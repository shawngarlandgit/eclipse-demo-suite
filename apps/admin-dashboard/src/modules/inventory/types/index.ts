/**
 * Inventory Module Types
 * Extended types for inventory management, batch tracking, and compliance
 */

// Re-export base types from main types file
export type { ProductType, Product } from '../../../types';

// ============================================================================
// PRODUCTS WITH INVENTORY
// ============================================================================

export interface ProductWithInventory {
  id: string;
  dispensary_id: string;
  name: string;
  sku?: string;
  product_type: string;
  strain_name: string | null;
  description?: string | null;
  thc_pct: number | null;
  cbd_pct: number | null;
  cbg_pct?: number | null;
  thca_pct?: number | null;
  vendor: string | null;
  price: number;
  cost: number | null;
  quantity_on_hand: number;
  reorder_level: number;
  low_stock_threshold?: number;
  image_url: string | null;
  is_active: boolean;
  batch_count: number;
  last_restocked?: string | null;
  last_updated?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// BATCH TRACKING
// ============================================================================

export type BatchStatus = 'active' | 'quarantine' | 'expired' | 'depleted';
export type TestStatus = 'passed' | 'pending' | 'failed' | 'expired';

export interface ProductBatch {
  id: string;
  dispensary_id: string;
  product_id: string;
  batch_number: string;
  quantity_initial: number;
  quantity_remaining: number;
  received_date: string;
  expiration_date: string | null;
  test_date: string | null;
  test_status: TestStatus;
  test_results: {
    thc_pct?: number;
    cbd_pct?: number;
    contaminants?: string[];
    lab_name?: string;
  } | null;
  status: BatchStatus;
  metrc_batch_id: string | null;
  compliance_flags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: ProductWithInventory;
}

// ============================================================================
// STOCK ADJUSTMENTS
// ============================================================================

export type AdjustmentType = 'damage' | 'theft' | 'waste' | 'correction' | 'transfer' | 'return';

export interface InventoryAdjustment {
  id: string;
  dispensary_id: string;
  product_id: string;
  batch_id: string | null;
  adjustment_type: AdjustmentType;
  quantity_delta: number; // Positive for additions, negative for subtractions
  reason: string;
  notes: string | null;
  adjusted_by: string;
  adjusted_at: string;
  created_at: string;
  product?: ProductWithInventory;
  batch?: ProductBatch;
  user?: { full_name: string };
}

// ============================================================================
// STOCK LEVELS
// ============================================================================

export type StockLevel = 'critical' | 'low' | 'normal' | 'high';

export interface StockLevelInfo {
  level: StockLevel;
  percentage: number;
  color: string;
  label: string;
}

// ============================================================================
// FILTERS
// ============================================================================

export interface InventoryFilters {
  search: string;
  category: string | 'all';
  status: 'all' | 'active' | 'inactive';
  stockLevel: 'all' | 'critical' | 'low' | 'normal' | 'high';
  vendor: string | 'all';
}

export interface BatchFilters {
  search: string;
  productId: string | 'all';
  status: BatchStatus | 'all';
  testStatus: TestStatus | 'all';
}

// ============================================================================
// STOCK TRENDS
// ============================================================================

export interface StockTrendPoint {
  date: string;
  quantity: number;
  adjustments: number;
  sales: number;
}

// ============================================================================
// COMPLIANCE ALERTS
// ============================================================================

export interface ComplianceAlert {
  id: string;
  type: 'expiring_soon' | 'expired' | 'needs_retest' | 'quarantine' | 'low_stock';
  severity: 'critical' | 'warning' | 'info';
  product_id: string;
  batch_id: string | null;
  message: string;
  action_required: string;
  created_at: string;
}

// ============================================================================
// INVENTORY SUMMARY
// ============================================================================

export interface InventorySummary {
  total_products: number;
  active_products: number;
  total_inventory_value: number;
  total_cost_value: number;
  low_stock_count: number;
  critical_stock_count: number;
  total_batches: number;
  expiring_soon_count: number;
  needs_retest_count: number;
  quarantined_count: number;
  last_updated: string;
}
