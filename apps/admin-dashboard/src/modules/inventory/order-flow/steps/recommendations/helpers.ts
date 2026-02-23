/**
 * Helper Functions for Recommendations Step
 * Utility functions for strain type handling, color schemes, and data processing
 */

import type { ProductWithStrainType, StrainTypeColorScheme } from './types';

// ============================================================================
// STRAIN TYPE HELPERS
// ============================================================================

/**
 * Safely extracts strain_type from a product.
 * Handles products that may or may not have the strain_type property.
 */
export function getStrainType(product: ProductWithStrainType): string | undefined {
  return product.strain_type;
}

/**
 * Checks if a product has a strain_type property
 */
export function hasStrainType(product: ProductWithStrainType): product is ProductWithStrainType & { strain_type: string } {
  return typeof product.strain_type === 'string' && product.strain_type.length > 0;
}

/**
 * Gets the color scheme for a strain type badge
 */
export function getStrainTypeColorScheme(strainType: string | undefined): StrainTypeColorScheme {
  if (!strainType) return 'green';

  const type = strainType.toLowerCase();
  switch (type) {
    case 'indica':
      return 'purple';
    case 'sativa':
      return 'orange';
    case 'hybrid':
    default:
      return 'cyan';
  }
}

/**
 * Gets the color scheme name for purchase history badges
 */
export function getPreferredTypeColorScheme(strainType: string | null): string {
  if (!strainType) return 'green';

  const type = strainType.toLowerCase();
  switch (type) {
    case 'indica':
      return 'purple';
    case 'sativa':
      return 'orange';
    case 'hybrid':
    default:
      return 'green';
  }
}

// ============================================================================
// FAVORITE STRAIN HELPERS
// ============================================================================

/**
 * Gets the rank of a strain in the favorites list (-1 if not found)
 */
export function getFavoriteRank(strainName: string, favoriteStrains: string[]): number {
  return favoriteStrains.findIndex(fav =>
    strainName.toLowerCase().includes(fav.toLowerCase()) ||
    fav.toLowerCase().includes(strainName.toLowerCase())
  );
}

/**
 * Checks if a strain is in the favorites list
 */
export function isFavoriteStrain(strainName: string, favoriteStrains: string[]): boolean {
  return getFavoriteRank(strainName, favoriteStrains) >= 0;
}

// ============================================================================
// PRODUCT FILTERING HELPERS
// ============================================================================

/**
 * Filters products that match customer preferences
 */
export function filterMatchingProducts(
  products: ProductWithStrainType[],
  preferredStrainType: string | null,
  favoriteStrains: string[]
): ProductWithStrainType[] {
  return products.filter(product => {
    const strainType = getStrainType(product);

    // Match by strain type preference
    if (preferredStrainType && strainType &&
        strainType.toLowerCase() === preferredStrainType.toLowerCase()) {
      return true;
    }

    // Match by favorite strains
    if (favoriteStrains.some(
      strain => product.strain_name?.toLowerCase().includes(strain.toLowerCase())
    )) {
      return true;
    }

    return false;
  });
}

// ============================================================================
// PRODUCT GROUPING HELPERS
// ============================================================================

/**
 * Groups products by their product_type
 */
export function groupProductsByType(
  products: ProductWithStrainType[]
): Record<string, ProductWithStrainType[]> {
  return products.reduce((acc, product) => {
    const type = product.product_type || 'other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(product);
    return acc;
  }, {} as Record<string, ProductWithStrainType[]>);
}

// ============================================================================
// SCORE CALCULATION HELPERS
// ============================================================================

/**
 * Calculates similarity score based on position and favorite status
 */
export function calculateSimilarityScore(index: number, isFavorite: boolean): number {
  let score = 0.95 - (index * 0.05);
  if (isFavorite) {
    score = Math.min(0.98, score + 0.1);
  }
  return score;
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================

/**
 * Formats a product type for display (replaces hyphens with spaces)
 */
export function formatProductType(productType: string): string {
  return productType.replace(/-/g, ' ');
}

/**
 * Truncates a string to a maximum length with ellipsis
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}
