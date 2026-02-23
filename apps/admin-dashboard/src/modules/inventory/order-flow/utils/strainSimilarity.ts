/**
 * Strain Similarity Algorithm
 * Calculates similarity scores between strains for recommendations
 *
 * Scoring weights:
 * - 40% Effect similarity (Jaccard coefficient on positive_effects)
 * - 30% Strain type match (indica/sativa/hybrid)
 * - 20% Flavor similarity (Jaccard coefficient on flavors)
 * - 10% Terpene similarity (if available)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface StrainProfile {
  name: string;
  slug?: string;
  strain_type: 'indica' | 'sativa' | 'hybrid' | string;
  positive_effects: string[];
  negative_effects?: string[];
  flavors: string[];
  terpenes?: string[];
  principal_effect?: string;
  thc_pct?: number;
  cbd_pct?: number;
}

export interface SimilarityResult {
  strain: StrainProfile;
  score: number; // 0-1 similarity score
  matchReasons: string[];
  effectOverlap: string[];
  flavorOverlap: string[];
}

export interface SimilarityWeights {
  effects: number;
  strainType: number;
  flavors: number;
  terpenes: number;
}

// Default weights
const DEFAULT_WEIGHTS: SimilarityWeights = {
  effects: 0.4,
  strainType: 0.3,
  flavors: 0.2,
  terpenes: 0.1,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate Jaccard similarity coefficient between two arrays
 * J(A,B) = |A ∩ B| / |A ∪ B|
 */
function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const setA = new Set(a.map(s => s.toLowerCase()));
  const setB = new Set(b.map(s => s.toLowerCase()));

  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

/**
 * Get overlapping items between two arrays
 */
function getOverlap(a: string[], b: string[]): string[] {
  const setA = new Set(a.map(s => s.toLowerCase()));
  return b.filter(item => setA.has(item.toLowerCase()));
}

/**
 * Calculate strain type similarity
 * Same type = 1.0
 * Hybrid matching indica/sativa = 0.5
 * Opposite types = 0.1
 */
function strainTypeSimilarity(typeA: string, typeB: string): number {
  const a = typeA.toLowerCase();
  const b = typeB.toLowerCase();

  if (a === b) return 1.0;

  if (a === 'hybrid' || b === 'hybrid') return 0.5;

  // indica vs sativa
  return 0.1;
}

// ============================================================================
// MAIN SIMILARITY FUNCTION
// ============================================================================

/**
 * Calculate similarity score between two strains
 */
export function calculateSimilarity(
  source: StrainProfile,
  target: StrainProfile,
  weights: SimilarityWeights = DEFAULT_WEIGHTS
): SimilarityResult {
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
  const typeScore = strainTypeSimilarity(
    source.strain_type || 'hybrid',
    target.strain_type || 'hybrid'
  );

  // Flavor similarity (20%)
  const flavorScore = jaccardSimilarity(
    source.flavors || [],
    target.flavors || []
  );
  const flavorOverlap = getOverlap(source.flavors || [], target.flavors || []);

  // Terpene similarity (10%) - if available
  let terpeneScore = 0.5; // Default if no terpene data
  if (source.terpenes?.length && target.terpenes?.length) {
    terpeneScore = jaccardSimilarity(source.terpenes, target.terpenes);
  }

  // Calculate weighted score
  const totalScore =
    effectScore * weights.effects +
    typeScore * weights.strainType +
    flavorScore * weights.flavors +
    terpeneScore * weights.terpenes;

  // Generate match reasons
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

  if (source.principal_effect === target.principal_effect && source.principal_effect) {
    matchReasons.push(`Same primary effect: ${source.principal_effect}`);
  }

  return {
    strain: target,
    score: Math.round(totalScore * 100) / 100,
    matchReasons,
    effectOverlap,
    flavorOverlap,
  };
}

/**
 * Find the most similar strains to a given source strain
 */
export function findSimilarStrains(
  source: StrainProfile,
  candidates: StrainProfile[],
  limit: number = 5,
  weights: SimilarityWeights = DEFAULT_WEIGHTS
): SimilarityResult[] {
  // Calculate similarity for all candidates
  const results = candidates
    .filter(candidate => candidate.name !== source.name) // Exclude same strain
    .map(candidate => calculateSimilarity(source, candidate, weights))
    .sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Find strains matching customer preferences
 */
export function findMatchingStrains(
  preferences: {
    topEffects: string[];
    preferredStrainType?: string;
    favoriteStrains?: string[];
  },
  candidates: StrainProfile[],
  limit: number = 5
): SimilarityResult[] {
  // Create a "virtual" source strain from preferences
  const virtualSource: StrainProfile = {
    name: 'customer_preferences',
    strain_type: preferences.preferredStrainType || 'hybrid',
    positive_effects: preferences.topEffects.slice(0, 5),
    flavors: [], // Will match on effects primarily
  };

  return findSimilarStrains(virtualSource, candidates, limit, {
    effects: 0.6, // Higher weight on effects for preference matching
    strainType: 0.3,
    flavors: 0.1,
    terpenes: 0.0,
  });
}

/**
 * Generate human-readable recommendation explanation
 */
export function generateRecommendationReason(
  result: SimilarityResult,
  context: 'returning_customer' | 'out_of_stock',
  requestedStrain?: string
): string {
  const { strain, matchReasons, score } = result;

  if (context === 'out_of_stock' && requestedStrain) {
    if (score >= 0.8) {
      return `Very similar to ${requestedStrain} - ${matchReasons[0] || 'great alternative'}`;
    } else if (score >= 0.6) {
      return `Good alternative to ${requestedStrain} - ${matchReasons[0] || 'similar profile'}`;
    } else {
      return `You might also enjoy this - ${matchReasons[0] || strain.strain_type}`;
    }
  }

  // Returning customer context
  if (score >= 0.8) {
    return `Perfect match for you - ${matchReasons[0] || 'based on your history'}`;
  } else if (score >= 0.6) {
    return `You'll probably love this - ${matchReasons[0] || 'fits your preferences'}`;
  } else {
    return `Try something new - ${matchReasons[0] || strain.strain_type}`;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  jaccardSimilarity,
  strainTypeSimilarity,
  getOverlap,
  DEFAULT_WEIGHTS,
};
