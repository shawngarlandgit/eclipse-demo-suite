/**
 * Internal Types for Inventory Services
 * Database and cache types used across inventory modules
 */

// Cache entry type for type-safe caching
export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

// Database product type from Supabase
export interface DbProduct {
  id: string;
  name: string;
  sku: string;
  image_url: string | null;
  strain_name: string | null;
  strain_type: string | null;
  product_type: string;
  thc_percentage: number | null;
  cbd_percentage: number | null;
  quantity_on_hand: number;
  low_stock_threshold: number;
  cost_price: number;
  retail_price: number;
  vendor: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Database batch type from Supabase
export interface DbBatch {
  id: string;
  product_id: string;
  batch_number: string;
  manufactured_date: string | null;
  expiration_date: string | null;
  test_date: string | null;
  test_results: Record<string, unknown> | null;
  quantity: number;
  cost_per_unit: number;
  is_active: boolean;
  created_at: string;
}

// Batch with product join for compliance alerts
export interface DbBatchWithProduct extends DbBatch {
  product: { name: string };
}
