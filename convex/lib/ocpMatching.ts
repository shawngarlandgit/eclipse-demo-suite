/**
 * OCP Advisory Matching Utilities
 * Algorithms for cross-referencing advisories against inventory
 */

/**
 * Normalize text for matching (lowercase, remove special chars, trim)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0-100) between two strings
 * Uses Levenshtein distance normalized by max length
 */
export function calculateSimilarity(a: string, b: string): number {
  const normalizedA = normalizeText(a);
  const normalizedB = normalizeText(b);

  if (normalizedA === normalizedB) return 100;
  if (!normalizedA || !normalizedB) return 0;

  const maxLen = Math.max(normalizedA.length, normalizedB.length);
  const distance = levenshteinDistance(normalizedA, normalizedB);
  const similarity = ((maxLen - distance) / maxLen) * 100;

  return Math.round(similarity);
}

/**
 * Check if text contains all words from query (order-independent)
 */
export function containsAllWords(text: string, query: string): boolean {
  const normalizedText = normalizeText(text);
  const queryWords = normalizeText(query).split(' ').filter(w => w.length > 2);

  return queryWords.every(word => normalizedText.includes(word));
}

/**
 * Match product against advisory criteria
 * Returns matches with confidence scores
 */
export interface ProductMatch {
  matchType: 'product_name' | 'strain' | 'brand' | 'batch_number' | 'license';
  matchedValue: string;
  confidence: number;
}

export interface MatchableProduct {
  name: string;
  brand?: string | null;
  batchNumber?: string | null;
  metrcId?: string | null; // Can be used as license reference
}

export interface AdvisoryMatchCriteria {
  affectedProducts?: string[];
  affectedStrains?: string[];
  affectedBrands?: string[];
  affectedBatchNumbers?: string[];
  affectedLicenses?: string[];
}

const MINIMUM_FUZZY_CONFIDENCE = 70; // Minimum confidence for fuzzy matches

export function matchProductToAdvisory(
  product: MatchableProduct,
  criteria: AdvisoryMatchCriteria
): ProductMatch[] {
  const matches: ProductMatch[] = [];

  // Match product name against affected products/strains
  const productNames = [
    ...(criteria.affectedProducts || []),
    ...(criteria.affectedStrains || []),
  ];

  for (const affectedName of productNames) {
    // Exact match (case insensitive)
    if (normalizeText(product.name) === normalizeText(affectedName)) {
      matches.push({
        matchType: 'product_name',
        matchedValue: affectedName,
        confidence: 100,
      });
    }
    // Contains match (all words present)
    else if (containsAllWords(product.name, affectedName)) {
      matches.push({
        matchType: 'product_name',
        matchedValue: affectedName,
        confidence: 90,
      });
    }
    // Fuzzy match
    else {
      const similarity = calculateSimilarity(product.name, affectedName);
      if (similarity >= MINIMUM_FUZZY_CONFIDENCE) {
        matches.push({
          matchType: criteria.affectedStrains?.includes(affectedName) ? 'strain' : 'product_name',
          matchedValue: affectedName,
          confidence: similarity,
        });
      }
    }
  }

  // Match brand
  if (product.brand && criteria.affectedBrands) {
    for (const affectedBrand of criteria.affectedBrands) {
      const similarity = calculateSimilarity(product.brand, affectedBrand);
      if (similarity >= MINIMUM_FUZZY_CONFIDENCE) {
        matches.push({
          matchType: 'brand',
          matchedValue: affectedBrand,
          confidence: similarity,
        });
      }
    }
  }

  // Match batch number (exact only for safety)
  if (product.batchNumber && criteria.affectedBatchNumbers) {
    for (const affectedBatch of criteria.affectedBatchNumbers) {
      if (normalizeText(product.batchNumber) === normalizeText(affectedBatch)) {
        matches.push({
          matchType: 'batch_number',
          matchedValue: affectedBatch,
          confidence: 100,
        });
      }
    }
  }

  // Match license/METRC ID
  if (product.metrcId && criteria.affectedLicenses) {
    for (const affectedLicense of criteria.affectedLicenses) {
      if (product.metrcId.includes(affectedLicense) || affectedLicense.includes(product.metrcId)) {
        matches.push({
          matchType: 'license',
          matchedValue: affectedLicense,
          confidence: 100,
        });
      }
    }
  }

  // Return unique matches with highest confidence for each type
  const uniqueMatches = new Map<string, ProductMatch>();
  for (const match of matches) {
    const key = `${match.matchType}:${match.matchedValue}`;
    const existing = uniqueMatches.get(key);
    if (!existing || existing.confidence < match.confidence) {
      uniqueMatches.set(key, match);
    }
  }

  return Array.from(uniqueMatches.values());
}
