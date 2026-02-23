/**
 * Recommendations Hook
 * Fetches AI-powered strain recommendations for customers
 * Supports both returning customer and out-of-stock contexts
 *
 * Two modes:
 * 1. Edge Function (useEdgeFunction: true) - AI-enhanced recommendations from Supabase
 * 2. Client-side (default) - Fast fallback using local strain data
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../../services/supabase/client';
import { useCurrentUser, useCurrentDispensary } from '../../../../hooks/useAuth';
import { log } from '../../../../utils/logger';
import {
  findSimilarStrains,
  findMatchingStrains,
  generateRecommendationReason,
  type StrainProfile,
  type SimilarityResult,
} from '../utils/strainSimilarity';
import type { PurchaseHistorySummary } from '../services/order.service';

// ============================================================================
// TYPES
// ============================================================================

export interface Recommendation {
  productId: string;
  productName: string;
  strainName: string;
  strainType: string;
  effects: string[];
  matchReason: string;
  similarityScore: number;
  inStock: boolean;
  quantityAvailable: number;
  price: number;
  imageUrl?: string;
}

export type RecommendationContext = 'returning_customer' | 'out_of_stock';

export interface UseRecommendationsOptions {
  context: RecommendationContext;
  customerId?: string;
  purchaseHistory?: PurchaseHistorySummary | null;
  requestedStrain?: string;
  enabled?: boolean;
  limit?: number;
  /** Use Edge Function for AI-enhanced recommendations (default: true) */
  useEdgeFunction?: boolean;
}

export interface UseRecommendationsResult {
  recommendations: Recommendation[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// ============================================================================
// STRAIN DATA CACHE
// ============================================================================

// Cache strain data in memory for faster lookups
let strainDataCache: StrainProfile[] | null = null;

async function loadStrainData(): Promise<StrainProfile[]> {
  if (strainDataCache) {
    return strainDataCache;
  }

  try {
    // Dynamic import of strain data
    const strainsModule = await import('../../../../data/strains.json');
    strainDataCache = strainsModule.default as StrainProfile[];
    log.info(`[useRecommendations] Loaded ${strainDataCache.length} strains`);
    return strainDataCache;
  } catch (error) {
    log.error('[useRecommendations] Failed to load strain data:', error);
    return [];
  }
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useRecommendations(options: UseRecommendationsOptions): UseRecommendationsResult {
  const {
    context,
    customerId,
    purchaseHistory,
    requestedStrain,
    enabled = true,
    limit = 5,
    useEdgeFunction = true,
  } = options;

  const dispensary = useCurrentDispensary();
  const dispensaryId = dispensary?._id;

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch recommendations from Edge Function
   */
  const fetchFromEdgeFunction = useCallback(async (): Promise<Recommendation[] | null> => {
    try {
      log.info('[useRecommendations] Trying Edge Function for AI recommendations');

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        log.warn('[useRecommendations] No auth token, falling back to client-side');
        return null;
      }

      const response = await supabase.functions.invoke('strain-recommendations', {
        body: {
          dispensaryId,
          customerId,
          context,
          requestedStrain,
          purchaseHistory: purchaseHistory ? {
            topEffects: purchaseHistory.topEffects,
            preferredStrainType: purchaseHistory.preferredStrainType,
            favoriteStrains: purchaseHistory.favoriteStrains,
            totalPurchases: purchaseHistory.totalPurchases,
          } : undefined,
          limit,
        },
      });

      if (response.error) {
        log.warn('[useRecommendations] Edge Function error:', response.error);
        return null;
      }

      const data = response.data;
      if (!data?.success || !Array.isArray(data.recommendations)) {
        log.warn('[useRecommendations] Invalid Edge Function response');
        return null;
      }

      // Map Edge Function response to Recommendation format
      return data.recommendations.map((rec: {
        product: {
          id: string;
          name: string;
          strain_name?: string;
          strain_type?: string;
          price: number;
          quantity_on_hand: number;
        };
        score: number;
        matchReasons: string[];
        aiExplanation?: string;
      }) => ({
        productId: rec.product.id,
        productName: rec.product.name,
        strainName: rec.product.strain_name || rec.product.name,
        strainType: rec.product.strain_type || 'hybrid',
        effects: [], // Edge Function doesn't return effects array
        matchReason: rec.aiExplanation || rec.matchReasons[0] || 'Recommended for you',
        similarityScore: rec.score,
        inStock: rec.product.quantity_on_hand > 0,
        quantityAvailable: rec.product.quantity_on_hand,
        price: rec.product.price,
      }));
    } catch (err) {
      log.warn('[useRecommendations] Edge Function failed:', err);
      return null;
    }
  }, [dispensaryId, customerId, context, requestedStrain, purchaseHistory, limit]);

  /**
   * Fetch recommendations based on context
   */
  const fetchRecommendations = useCallback(async () => {
    if (!enabled || !dispensaryId) {
      return;
    }

    // Validate required data for each context
    if (context === 'returning_customer' && !purchaseHistory?.topEffects?.length) {
      log.info('[useRecommendations] No purchase history for returning customer');
      return;
    }

    if (context === 'out_of_stock' && !requestedStrain) {
      log.info('[useRecommendations] No requested strain for out-of-stock context');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      log.info(`[useRecommendations] Fetching recommendations for ${context}`);

      // Try Edge Function first if enabled
      if (useEdgeFunction) {
        const edgeFunctionResults = await fetchFromEdgeFunction();
        if (edgeFunctionResults && edgeFunctionResults.length > 0) {
          log.info(`[useRecommendations] Got ${edgeFunctionResults.length} AI recommendations`);
          setRecommendations(edgeFunctionResults);
          setIsLoading(false);
          return;
        }
        log.info('[useRecommendations] Falling back to client-side recommendations');
      }

      // 1. Get in-stock products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, strain_name, product_type, price, quantity_on_hand, image_url, thc_pct, cbd_pct')
        .eq('dispensary_id', dispensaryId)
        .eq('is_active', true)
        .gt('quantity_on_hand', 0)
        .limit(100);

      if (productsError) {
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }

      if (!products || products.length === 0) {
        log.warn('[useRecommendations] No products in stock');
        setRecommendations([]);
        return;
      }

      // 2. Load strain data
      const allStrains = await loadStrainData();

      // 3. Match products to strain profiles
      const productStrainProfiles: Array<{
        product: typeof products[0];
        strain: StrainProfile;
      }> = [];

      for (const product of products) {
        if (product.strain_name) {
          // Find matching strain in our data
          const strainMatch = allStrains.find(
            s =>
              s.name.toLowerCase() === product.strain_name?.toLowerCase() ||
              s.slug === product.strain_name?.toLowerCase().replace(/\s+/g, '-')
          );

          if (strainMatch) {
            productStrainProfiles.push({ product, strain: strainMatch });
          } else {
            // Create minimal profile for unmatched strains
            productStrainProfiles.push({
              product,
              strain: {
                name: product.strain_name,
                strain_type: 'hybrid',
                positive_effects: [],
                flavors: [],
              },
            });
          }
        }
      }

      // 4. Calculate similarities based on context
      let results: SimilarityResult[];

      if (context === 'out_of_stock' && requestedStrain) {
        // Find the requested strain's profile
        const requestedStrainProfile = allStrains.find(
          s =>
            s.name.toLowerCase() === requestedStrain.toLowerCase() ||
            s.slug === requestedStrain.toLowerCase().replace(/\s+/g, '-')
        );

        if (!requestedStrainProfile) {
          log.warn(`[useRecommendations] Requested strain not found: ${requestedStrain}`);
          setRecommendations([]);
          return;
        }

        results = findSimilarStrains(
          requestedStrainProfile,
          productStrainProfiles.map(p => p.strain),
          limit * 2 // Get more to account for filtering
        );
      } else {
        // Returning customer - match to purchase history
        results = findMatchingStrains(
          {
            topEffects: purchaseHistory?.topEffects.map(e => e.effect) || [],
            preferredStrainType: purchaseHistory?.preferredStrainType || undefined,
            favoriteStrains: purchaseHistory?.favoriteStrains,
          },
          productStrainProfiles.map(p => p.strain),
          limit * 2
        );
      }

      // 5. Map results back to products with recommendations
      const recommendationsList: Recommendation[] = [];

      for (const result of results) {
        // Find the product for this strain
        const productMatch = productStrainProfiles.find(
          p => p.strain.name === result.strain.name
        );

        if (!productMatch) continue;

        recommendationsList.push({
          productId: productMatch.product.id,
          productName: productMatch.product.name,
          strainName: result.strain.name,
          strainType: result.strain.strain_type,
          effects: result.strain.positive_effects.slice(0, 4),
          matchReason: generateRecommendationReason(result, context, requestedStrain),
          similarityScore: result.score,
          inStock: productMatch.product.quantity_on_hand > 0,
          quantityAvailable: productMatch.product.quantity_on_hand,
          price: productMatch.product.price,
          imageUrl: productMatch.product.image_url,
        });

        if (recommendationsList.length >= limit) break;
      }

      // 6. Sort by score and set results
      recommendationsList.sort((a, b) => b.similarityScore - a.similarityScore);
      setRecommendations(recommendationsList);

      log.info(`[useRecommendations] Found ${recommendationsList.length} recommendations`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recommendations';
      log.error('[useRecommendations] Error:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [context, customerId, purchaseHistory, requestedStrain, enabled, dispensaryId, limit, useEdgeFunction, fetchFromEdgeFunction]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    refetch: fetchRecommendations,
  };
}

export default useRecommendations;
