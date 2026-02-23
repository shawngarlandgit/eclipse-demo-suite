/**
 * Mock Data for Recommendations Step
 * Contains mock strains and order history for demo/development purposes
 */

import type { MockStrain, MockOrder, PurchaseHistorySummary } from './types';

// ============================================================================
// MOCK STRAIN DATA
// ============================================================================

/**
 * Mock strain data for demo purposes (from strains.json reference)
 */
export const MOCK_STRAINS: MockStrain[] = [
  {
    name: 'Blue Dream',
    strain_type: 'hybrid',
    effects: ['relaxed', 'happy', 'euphoric', 'uplifted', 'creative'],
    flavors: ['blueberry', 'sweet', 'berry'],
  },
  {
    name: 'Girl Scout Cookies',
    strain_type: 'hybrid',
    effects: ['euphoric', 'happy', 'relaxed', 'uplifted', 'creative'],
    flavors: ['sweet', 'earthy', 'pungent'],
  },
  {
    name: 'OG Kush',
    strain_type: 'indica',
    effects: ['relaxed', 'happy', 'euphoric', 'uplifted', 'sleepy'],
    flavors: ['earthy', 'woody', 'pine'],
  },
  {
    name: 'Sour Diesel',
    strain_type: 'sativa',
    effects: ['energetic', 'happy', 'uplifted', 'euphoric', 'creative'],
    flavors: ['diesel', 'pungent', 'earthy'],
  },
  {
    name: 'Granddaddy Purple',
    strain_type: 'indica',
    effects: ['relaxed', 'sleepy', 'happy', 'euphoric', 'hungry'],
    flavors: ['grape', 'berry', 'sweet'],
  },
  {
    name: 'Jack Herer',
    strain_type: 'sativa',
    effects: ['happy', 'uplifted', 'energetic', 'creative', 'focused'],
    flavors: ['earthy', 'pine', 'woody'],
  },
];

// ============================================================================
// MOCK ORDER HISTORY
// ============================================================================

/**
 * Mock order history for demo purposes
 */
export const MOCK_ORDER_HISTORY: MockOrder[] = [
  {
    id: 'ORD-2024-1201',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    items: [
      { name: 'Blue Dream - 3.5g', quantity: 1, price: 45.0 },
      { name: 'RAW Rolling Papers', quantity: 2, price: 5.99 },
    ],
    total: 56.98,
    status: 'completed',
  },
  {
    id: 'ORD-2024-1115',
    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
    items: [
      { name: 'OG Kush - 7g', quantity: 1, price: 85.0 },
      { name: 'Glass Pipe - Spoon', quantity: 1, price: 24.99 },
    ],
    total: 109.99,
    status: 'completed',
  },
  {
    id: 'ORD-2024-1028',
    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 6 weeks ago
    items: [
      { name: 'Blue Dream - 7g', quantity: 1, price: 80.0 },
      { name: 'Girl Scout Cookies - 3.5g', quantity: 1, price: 48.0 },
      { name: 'Grinder - 4pc', quantity: 1, price: 29.99 },
    ],
    total: 157.99,
    status: 'completed',
  },
  {
    id: 'ORD-2024-0915',
    date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
    items: [
      { name: 'Sour Diesel - 3.5g', quantity: 2, price: 42.0 },
      { name: 'Pre-Roll 5-Pack', quantity: 1, price: 35.0 },
    ],
    total: 119.0,
    status: 'completed',
  },
];

// ============================================================================
// DEFAULT PURCHASE HISTORY
// ============================================================================

/**
 * Default purchase history for returning customers without real data
 */
export const DEFAULT_PURCHASE_HISTORY: PurchaseHistorySummary = {
  preferredStrainType: 'hybrid',
  topEffects: [
    { effect: 'relaxed', count: 8 },
    { effect: 'happy', count: 6 },
    { effect: 'creative', count: 4 },
  ],
  favoriteStrains: ['Blue Dream', 'OG Kush'],
  totalTransactions: 12,
};

// ============================================================================
// MATCH REASONS BY PRODUCT TYPE
// ============================================================================

/**
 * Match reasons displayed on recommendation cards by product type
 */
export const MATCH_REASONS_BY_TYPE: Record<string, string[]> = {
  flower: ['Top pick based on your preferences', 'Similar to strains you love'],
  'pre-roll': ['Convenient and ready to enjoy', 'Great for on-the-go'],
  vape: ['Clean and discreet option', 'Fast-acting effects'],
  edible: ['Long-lasting experience', 'Delicious way to enjoy'],
  extract: ['Potent and pure', 'For experienced users'],
  tincture: ['Easy dosing', 'Versatile consumption'],
  topical: ['Targeted relief', 'Non-psychoactive option'],
  other: ['Customer favorite', 'Highly rated product'],
};

/**
 * Priority order for product types when generating recommendations
 */
export const PRODUCT_TYPE_PRIORITY: string[] = [
  'flower',
  'pre-roll',
  'vape',
  'edible',
  'extract',
  'tincture',
  'topical',
  'other',
];
