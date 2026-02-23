/**
 * Supabase Edge Function: strain-recommendations
 * AI-powered strain recommendations for returning customers and out-of-stock alternatives
 *
 * Endpoints:
 * - POST /strain-recommendations
 *
 * Contexts:
 * - returning_customer: Recommend based on purchase history
 * - out_of_stock: Suggest alternatives to unavailable strains
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// ============================================================================
// TYPES
// ============================================================================

interface RecommendationRequest {
  dispensaryId: string;
  customerId?: string;
  context: 'returning_customer' | 'out_of_stock';
  requestedStrain?: string; // For out_of_stock context
  purchaseHistory?: {
    topEffects: Array<{ effect: string; count: number }>;
    preferredStrainType: string | null;
    favoriteStrains: string[];
    totalTransactions: number;
  };
  limit?: number;
}

interface StrainProfile {
  name: string;
  strain_type: string;
  positive_effects: string[];
  flavors: string[];
  terpenes?: string[];
}

interface ProductWithStrain {
  id: string;
  name: string;
  sku?: string;
  price: number;
  category: string;
  strain_name?: string;
  strain_type?: string;
  quantity_on_hand: number;
  strainProfile?: StrainProfile;
}

interface Recommendation {
  product: ProductWithStrain;
  score: number;
  matchReasons: string[];
  aiExplanation?: string;
}

// ============================================================================
// SIMILARITY ALGORITHM (embedded for Edge Function isolation)
// ============================================================================

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const setA = new Set(a.map(s => s.toLowerCase()));
  const setB = new Set(b.map(s => s.toLowerCase()));

  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

function getOverlap(a: string[], b: string[]): string[] {
  const setA = new Set(a.map(s => s.toLowerCase()));
  return b.filter(item => setA.has(item.toLowerCase()));
}

function strainTypeSimilarity(typeA: string, typeB: string): number {
  const a = (typeA || 'hybrid').toLowerCase();
  const b = (typeB || 'hybrid').toLowerCase();

  if (a === b) return 1.0;
  if (a === 'hybrid' || b === 'hybrid') return 0.5;
  return 0.1; // indica vs sativa
}

function calculateSimilarity(
  source: StrainProfile,
  target: StrainProfile
): { score: number; matchReasons: string[]; effectOverlap: string[] } {
  const weights = { effects: 0.4, strainType: 0.3, flavors: 0.2, terpenes: 0.1 };

  // Effect similarity (40%)
  const effectScore = jaccardSimilarity(
    source.positive_effects || [],
    target.positive_effects || []
  );
  const effectOverlap = getOverlap(
    source.positive_effects || [],
    target.positive_effects || []
  );

  // Strain type similarity (30%)
  const typeScore = strainTypeSimilarity(source.strain_type, target.strain_type);

  // Flavor similarity (20%)
  const flavorScore = jaccardSimilarity(source.flavors || [], target.flavors || []);
  const flavorOverlap = getOverlap(source.flavors || [], target.flavors || []);

  // Terpene similarity (10%)
  let terpeneScore = 0.5;
  if (source.terpenes?.length && target.terpenes?.length) {
    terpeneScore = jaccardSimilarity(source.terpenes, target.terpenes);
  }

  // Weighted score
  const totalScore =
    effectScore * weights.effects +
    typeScore * weights.strainType +
    flavorScore * weights.flavors +
    terpeneScore * weights.terpenes;

  // Match reasons
  const matchReasons: string[] = [];
  if (effectOverlap.length >= 2) {
    matchReasons.push(`Similar effects: ${effectOverlap.slice(0, 3).join(', ')}`);
  }
  if (typeScore === 1.0) {
    matchReasons.push(`Same strain type (${source.strain_type})`);
  } else if (typeScore === 0.5) {
    matchReasons.push(`Compatible strain types`);
  }
  if (flavorOverlap.length >= 1) {
    matchReasons.push(`Similar flavors: ${flavorOverlap.slice(0, 2).join(', ')}`);
  }

  return {
    score: Math.round(totalScore * 100) / 100,
    matchReasons,
    effectOverlap,
  };
}

// ============================================================================
// CLAUDE AI INTEGRATION
// ============================================================================

async function generateAIExplanation(
  recommendations: Recommendation[],
  context: 'returning_customer' | 'out_of_stock',
  purchaseHistory?: RecommendationRequest['purchaseHistory'],
  requestedStrain?: string
): Promise<Map<string, string>> {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  const explanations = new Map<string, string>();

  if (!anthropicKey) {
    console.log('No ANTHROPIC_API_KEY, skipping AI explanations');
    return explanations;
  }

  try {
    const prompt = context === 'returning_customer'
      ? buildReturningCustomerPrompt(recommendations, purchaseHistory!)
      : buildOutOfStockPrompt(recommendations, requestedStrain!);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Fast and cost-effective
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', await response.text());
      return explanations;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Parse the response (expecting JSON array)
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        parsed.forEach((item: { productId: string; explanation: string }) => {
          explanations.set(item.productId, item.explanation);
        });
      }
    } catch {
      // If not valid JSON, try to use as a single explanation
      console.log('Could not parse AI response as JSON');
    }
  } catch (error) {
    console.error('AI explanation error:', error);
  }

  return explanations;
}

function buildReturningCustomerPrompt(
  recommendations: Recommendation[],
  purchaseHistory: RecommendationRequest['purchaseHistory']
): string {
  const topEffects = purchaseHistory?.topEffects?.map(e => e.effect).slice(0, 3).join(', ') || 'relaxation';
  const preferredType = purchaseHistory?.preferredStrainType || 'hybrid';
  const favorites = purchaseHistory?.favoriteStrains?.slice(0, 2).join(', ') || 'various strains';

  const productList = recommendations.map(r => ({
    id: r.product.id,
    name: r.product.name,
    strain: r.product.strain_name || r.product.name,
    type: r.product.strain_type || 'hybrid',
    reasons: r.matchReasons.join('; '),
  }));

  return `You're a friendly budtender. A returning customer who usually enjoys ${topEffects} effects and prefers ${preferredType} strains (favorites: ${favorites}) is back.

Generate short, personalized explanations (15-25 words max) for why they might like each product:

${JSON.stringify(productList, null, 2)}

Respond ONLY with a JSON array like:
[{"productId": "id1", "explanation": "Short friendly reason..."}]`;
}

function buildOutOfStockPrompt(
  recommendations: Recommendation[],
  requestedStrain: string
): string {
  const productList = recommendations.map(r => ({
    id: r.product.id,
    name: r.product.name,
    strain: r.product.strain_name || r.product.name,
    type: r.product.strain_type || 'hybrid',
    score: r.score,
    reasons: r.matchReasons.join('; '),
  }));

  return `A customer wanted "${requestedStrain}" but it's out of stock. Generate short, helpful explanations (15-25 words max) for each alternative:

${JSON.stringify(productList, null, 2)}

Be conversational and mention how similar each is to ${requestedStrain}.

Respond ONLY with a JSON array like:
[{"productId": "id1", "explanation": "Short helpful reason..."}]`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const requestData: RecommendationRequest = await req.json();
    const {
      dispensaryId,
      customerId,
      context,
      requestedStrain,
      purchaseHistory,
      limit = 5,
    } = requestData;

    // Verify user access
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('dispensary_id')
      .eq('id', user.id)
      .single();

    if (userError || userData.dispensary_id !== dispensaryId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch in-stock products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku, price, category, strain_name, strain_type, quantity_on_hand, effects, flavors, terpenes')
      .eq('dispensary_id', dispensaryId)
      .eq('status', 'active')
      .gt('quantity_on_hand', 0)
      .order('quantity_on_hand', { ascending: false });

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [], message: 'No products in stock' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build recommendations based on context
    let recommendations: Recommendation[] = [];

    if (context === 'returning_customer' && purchaseHistory) {
      // Create virtual profile from purchase history
      const topEffects = purchaseHistory.topEffects?.map(e => e.effect) || [];
      const virtualSource: StrainProfile = {
        name: 'customer_preferences',
        strain_type: purchaseHistory.preferredStrainType || 'hybrid',
        positive_effects: topEffects.slice(0, 5),
        flavors: [],
      };

      // Score all products
      recommendations = products
        .map(product => {
          const targetProfile: StrainProfile = {
            name: product.strain_name || product.name,
            strain_type: product.strain_type || 'hybrid',
            positive_effects: product.effects || [],
            flavors: product.flavors || [],
            terpenes: product.terpenes || [],
          };

          const similarity = calculateSimilarity(virtualSource, targetProfile);

          return {
            product: {
              id: product.id,
              name: product.name,
              sku: product.sku,
              price: product.price,
              category: product.category,
              strain_name: product.strain_name,
              strain_type: product.strain_type,
              quantity_on_hand: product.quantity_on_hand,
            },
            score: similarity.score,
            matchReasons: similarity.matchReasons,
          };
        })
        .filter(r => r.score > 0.3) // Minimum relevance threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } else if (context === 'out_of_stock' && requestedStrain) {
      // Find the requested strain profile (could be from our database or external)
      const { data: strainData } = await supabase
        .from('products')
        .select('strain_name, strain_type, effects, flavors, terpenes')
        .eq('dispensary_id', dispensaryId)
        .ilike('strain_name', `%${requestedStrain}%`)
        .limit(1)
        .single();

      // Build source profile
      const sourceProfile: StrainProfile = strainData
        ? {
            name: strainData.strain_name || requestedStrain,
            strain_type: strainData.strain_type || 'hybrid',
            positive_effects: strainData.effects || [],
            flavors: strainData.flavors || [],
            terpenes: strainData.terpenes || [],
          }
        : {
            // Default if strain not found - generic hybrid
            name: requestedStrain,
            strain_type: 'hybrid',
            positive_effects: ['relaxed', 'happy', 'euphoric'],
            flavors: ['earthy'],
          };

      // Find similar in-stock products
      recommendations = products
        .filter(p => p.strain_name?.toLowerCase() !== requestedStrain.toLowerCase())
        .map(product => {
          const targetProfile: StrainProfile = {
            name: product.strain_name || product.name,
            strain_type: product.strain_type || 'hybrid',
            positive_effects: product.effects || [],
            flavors: product.flavors || [],
            terpenes: product.terpenes || [],
          };

          const similarity = calculateSimilarity(sourceProfile, targetProfile);

          return {
            product: {
              id: product.id,
              name: product.name,
              sku: product.sku,
              price: product.price,
              category: product.category,
              strain_name: product.strain_name,
              strain_type: product.strain_type,
              quantity_on_hand: product.quantity_on_hand,
            },
            score: similarity.score,
            matchReasons: similarity.matchReasons.length > 0
              ? similarity.matchReasons
              : [`Alternative ${product.strain_type || 'strain'} option`],
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }

    // Add AI explanations if available
    if (recommendations.length > 0) {
      const aiExplanations = await generateAIExplanation(
        recommendations,
        context,
        purchaseHistory,
        requestedStrain
      );

      recommendations = recommendations.map(r => ({
        ...r,
        aiExplanation: aiExplanations.get(r.product.id) || undefined,
      }));
    }

    return new Response(
      JSON.stringify({
        success: true,
        context,
        recommendations,
        generatedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
        },
      }
    );

  } catch (error) {
    console.error('Recommendation error:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
        },
      }
    );
  }
});
