import { supabase } from '../supabase/client';
import type {
  ProductWithInventory,
  ProductBatch,
  InventoryAdjustment,
  InventoryFilters,
  BatchFilters,
  StockTrendPoint,
  ComplianceAlert,
  InventorySummary,
  AdjustmentType,
  StockLevelInfo,
} from '../../modules/inventory/types/index';
import type {
  TransformedProduct,
  ImportProgress,
  ImportResult,
} from '../../modules/inventory/utils/csvImport';
import { chunkArray } from '../../modules/inventory/utils/csvImport';

/**
 * Inventory Service
 * Handles all inventory-related data operations including products, batches, adjustments, and compliance
 */

// Get current dispensary ID from local storage or context
// In production, this would come from the authenticated user's context
function getCurrentDispensaryId(): string {
  // TODO: Get from auth context when multi-tenancy is implemented
  // The Neon Pipe dispensary ID
  return '06c18efa-32ce-44c3-8282-da807fefd23f';
}

class InventoryService {
  private dispensaryId: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout: number = 3 * 60 * 1000; // 3 minutes

  constructor() {
    this.dispensaryId = getCurrentDispensaryId();
  }

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  /**
   * Get all products with inventory information
   */
  async getProducts(filters?: Partial<InventoryFilters>): Promise<ProductWithInventory[]> {
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        image_url,
        strain_name,
        strain_type,
        product_type,
        thc_pct,
        cbd_pct,
        cbg_pct,
        thca_pct,
        quantity_on_hand,
        low_stock_threshold,
        reorder_level,
        retail_price,
        cost_price,
        is_active,
        vendor,
        created_at
      `)
      .eq('dispensary_id', this.dispensaryId)
      .order('name', { ascending: true })
      .limit(500);

    // Apply filters
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,strain_name.ilike.%${filters.search}%`);
    }

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('product_type', filters.category);
    }

    if (filters?.status === 'active') {
      query = query.eq('is_active', true);
    } else if (filters?.status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (filters?.vendor && filters.vendor !== 'all') {
      query = query.eq('vendor', filters.vendor);
    }

    const { data, error } = await query;

    console.log('[InventoryService] getProducts query result:', {
      dispensaryId: this.dispensaryId,
      productCount: data?.length,
      error: error?.message,
      firstProduct: data?.[0]?.name,
    });

    if (error) {
      console.error('[InventoryService] Query error:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    // Map database columns to UI expected names and add batch_count
    const productsWithBatchCount = (data || []).map((product: any) => ({
      ...product,
      price: product.retail_price,
      cost: product.cost_price,
      batch_count: 0,
    }));

    // Filter by stock level client-side
    let products = productsWithBatchCount;
    if (filters?.stockLevel && filters.stockLevel !== 'all') {
      products = products.filter((product) => {
        const stockInfo = this.getStockLevelInfo(
          product.quantity_on_hand,
          product.low_stock_threshold
        );
        return stockInfo.level === filters.stockLevel;
      });
    }

    return products;
  }

  /**
   * Get single product with full details
   */
  async getProductById(productId: string): Promise<ProductWithInventory> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('dispensary_id', this.dispensaryId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    // Map database columns to UI expected names
    return {
      ...data,
      price: data.retail_price,
      cost: data.cost_price,
      batch_count: 0,
    };
  }

  /**
   * Get stock level classification
   */
  getStockLevelInfo(quantity: number, threshold: number): StockLevelInfo {
    const percentage = threshold > 0 ? (quantity / threshold) * 100 : 100;

    if (quantity === 0) {
      return {
        level: 'critical',
        percentage: 0,
        color: 'red',
        label: 'Out of Stock',
      };
    } else if (percentage < 50) {
      return {
        level: 'critical',
        percentage,
        color: 'red',
        label: 'Critical',
      };
    } else if (percentage < 100) {
      return {
        level: 'low',
        percentage,
        color: 'yellow',
        label: 'Low Stock',
      };
    } else if (percentage < 200) {
      return {
        level: 'normal',
        percentage,
        color: 'green',
        label: 'Normal',
      };
    } else {
      return {
        level: 'high',
        percentage,
        color: 'blue',
        label: 'High Stock',
      };
    }
  }

  /**
   * Get available vendors for filtering
   */
  async getVendors(): Promise<string[]> {
    const { data, error } = await supabase
      .from('products')
      .select('vendor')
      .eq('dispensary_id', this.dispensaryId)
      .not('vendor', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch vendors: ${error.message}`);
    }

    const vendors = [
      ...new Set(data.map((p) => p.vendor).filter(Boolean) as string[]),
    ];
    return vendors.sort();
  }

  // ============================================================================
  // BATCHES
  // ============================================================================

  /**
   * Get all batches with optional filters
   */
  async getBatches(filters?: Partial<BatchFilters>): Promise<ProductBatch[]> {
    let query = supabase
      .from('product_batches')
      .select(`
        *,
        product:products(*)
      `)
      .eq('dispensary_id', this.dispensaryId)
      .order('received_date', { ascending: false });

    // Apply filters
    if (filters?.search) {
      query = query.ilike('batch_number', `%${filters.search}%`);
    }

    if (filters?.productId && filters.productId !== 'all') {
      query = query.eq('product_id', filters.productId);
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.testStatus && filters.testStatus !== 'all') {
      query = query.eq('test_status', filters.testStatus);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch batches: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get batches for a specific product
   */
  async getProductBatches(productId: string): Promise<ProductBatch[]> {
    const { data, error } = await supabase
      .from('product_batches')
      .select('*')
      .eq('product_id', productId)
      .eq('dispensary_id', this.dispensaryId)
      .order('received_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch product batches: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create new batch
   */
  async createBatch(batch: Partial<ProductBatch>): Promise<ProductBatch> {
    const { data, error } = await supabase
      .from('product_batches')
      .insert({
        ...batch,
        dispensary_id: this.dispensaryId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create batch: ${error.message}`);
    }

    return data;
  }

  /**
   * Update batch status
   */
  async updateBatchStatus(batchId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('product_batches')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', batchId)
      .eq('dispensary_id', this.dispensaryId);

    if (error) {
      throw new Error(`Failed to update batch status: ${error.message}`);
    }
  }

  // ============================================================================
  // INVENTORY ADJUSTMENTS
  // ============================================================================

  /**
   * Create inventory adjustment
   */
  async createAdjustment(adjustment: {
    product_id: string;
    batch_id?: string;
    adjustment_type: AdjustmentType;
    quantity_delta: number;
    reason: string;
    notes?: string;
  }): Promise<InventoryAdjustment> {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    const { data, error } = await supabase
      .from('inventory_adjustments')
      .insert({
        ...adjustment,
        dispensary_id: this.dispensaryId,
        adjusted_by: userId,
        adjusted_at: new Date().toISOString(),
      })
      .select(`
        *,
        product:products(*),
        batch:product_batches(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create adjustment: ${error.message}`);
    }

    return data;
  }

  /**
   * Get adjustment history for a product
   */
  async getProductAdjustments(
    productId: string,
    limit: number = 50
  ): Promise<InventoryAdjustment[]> {
    const { data, error } = await supabase
      .from('inventory_adjustments')
      .select('*')
      .eq('product_id', productId)
      .eq('dispensary_id', this.dispensaryId)
      .order('adjusted_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch adjustments: ${error.message}`);
    }

    return data || [];
  }

  // ============================================================================
  // STOCK TRENDS
  // ============================================================================

  /**
   * Get stock level trend for a product
   * Simulated data - in production this would use a database function or aggregation
   */
  async getStockTrend(
    productId: string,
    days: number = 30
  ): Promise<StockTrendPoint[]> {
    // For now, return simulated data
    // In production, this would call a Supabase RPC function
    const trendData: StockTrendPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      trendData.push({
        date: date.toISOString().split('T')[0],
        quantity: Math.floor(Math.random() * 100) + 50,
        adjustments: Math.floor(Math.random() * 10),
        sales: Math.floor(Math.random() * 20),
      });
    }

    return trendData;
  }

  // ============================================================================
  // COMPLIANCE & ALERTS
  // ============================================================================

  /**
   * Get compliance alerts
   */
  async getComplianceAlerts(): Promise<ComplianceAlert[]> {
    const alerts: ComplianceAlert[] = [];

    // Get expiring batches (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringBatches } = await supabase
      .from('product_batches')
      .select('*, product:products(name)')
      .eq('dispensary_id', this.dispensaryId)
      .eq('status', 'active')
      .lte('expiration_date', thirtyDaysFromNow.toISOString())
      .gte('expiration_date', new Date().toISOString());

    expiringBatches?.forEach((batch: any) => {
      alerts.push({
        id: `expiring_${batch.id}`,
        type: 'expiring_soon',
        severity: 'warning',
        product_id: batch.product_id,
        batch_id: batch.id,
        message: `Batch ${batch.batch_number} for ${batch.product.name} expires soon`,
        action_required: 'Review and potentially quarantine batch',
        created_at: new Date().toISOString(),
      });
    });

    // Get expired batches
    const { data: expiredBatches } = await supabase
      .from('product_batches')
      .select('*, product:products(name)')
      .eq('dispensary_id', this.dispensaryId)
      .neq('status', 'expired')
      .lt('expiration_date', new Date().toISOString());

    expiredBatches?.forEach((batch: any) => {
      alerts.push({
        id: `expired_${batch.id}`,
        type: 'expired',
        severity: 'critical',
        product_id: batch.product_id,
        batch_id: batch.id,
        message: `Batch ${batch.batch_number} for ${batch.product.name} has expired`,
        action_required: 'Quarantine batch immediately',
        created_at: new Date().toISOString(),
      });
    });

    // Get batches needing retest (test date > 90 days old)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: needsRetestBatches } = await supabase
      .from('product_batches')
      .select('*, product:products(name)')
      .eq('dispensary_id', this.dispensaryId)
      .eq('status', 'active')
      .lt('test_date', ninetyDaysAgo.toISOString());

    needsRetestBatches?.forEach((batch: any) => {
      alerts.push({
        id: `retest_${batch.id}`,
        type: 'needs_retest',
        severity: 'warning',
        product_id: batch.product_id,
        batch_id: batch.id,
        message: `Batch ${batch.batch_number} needs retesting`,
        action_required: 'Schedule lab testing',
        created_at: new Date().toISOString(),
      });
    });

    // Get low stock products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('dispensary_id', this.dispensaryId)
      .eq('is_active', true);

    products
      ?.filter((p) => p.quantity_on_hand <= p.low_stock_threshold)
      .forEach((product) => {
        alerts.push({
          id: `low_stock_${product.id}`,
          type: 'low_stock',
          severity: product.quantity_on_hand === 0 ? 'critical' : 'warning',
          product_id: product.id,
          batch_id: null,
          message: `${product.name} is ${
            product.quantity_on_hand === 0 ? 'out of stock' : 'low on stock'
          }`,
          action_required: 'Reorder product',
          created_at: new Date().toISOString(),
        });
      });

    // Sort by severity (critical first), then by date
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }

  /**
   * Get inventory summary statistics
   */
  async getInventorySummary(): Promise<InventorySummary> {
    const cacheKey = 'inventory_summary';
    const cached = this.getFromCache<InventorySummary>(cacheKey);
    if (cached) return cached;

    // Get all products
    const { data: products } = await supabase
      .from('products')
      .select('id, is_active, quantity_on_hand, low_stock_threshold, retail_price, cost_price')
      .eq('dispensary_id', this.dispensaryId);

    const totalProducts = products?.length || 0;
    const activeProducts = products?.filter((p) => p.is_active).length || 0;

    const totalInventoryValue =
      products?.reduce((sum, p) => sum + p.quantity_on_hand * (p.retail_price || 0), 0) || 0;
    const totalCostValue =
      products?.reduce(
        (sum, p) => sum + p.quantity_on_hand * (p.cost_price || 0),
        0
      ) || 0;

    const lowStockCount =
      products?.filter(
        (p) =>
          p.is_active &&
          p.quantity_on_hand > 0 &&
          p.quantity_on_hand <= p.low_stock_threshold
      ).length || 0;

    const criticalStockCount =
      products?.filter((p) => p.is_active && p.quantity_on_hand === 0).length ||
      0;

    // Get batch counts
    const { count: totalBatches } = await supabase
      .from('product_batches')
      .select('*', { count: 'exact', head: true })
      .eq('dispensary_id', this.dispensaryId);

    // Get compliance counts
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { count: expiringSoonCount } = await supabase
      .from('product_batches')
      .select('*', { count: 'exact', head: true })
      .eq('dispensary_id', this.dispensaryId)
      .eq('status', 'active')
      .lte('expiration_date', thirtyDaysFromNow.toISOString())
      .gte('expiration_date', new Date().toISOString());

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { count: needsRetestCount } = await supabase
      .from('product_batches')
      .select('*', { count: 'exact', head: true })
      .eq('dispensary_id', this.dispensaryId)
      .eq('status', 'active')
      .lt('test_date', ninetyDaysAgo.toISOString());

    const { count: quarantinedCount } = await supabase
      .from('product_batches')
      .select('*', { count: 'exact', head: true })
      .eq('dispensary_id', this.dispensaryId)
      .eq('status', 'quarantine');

    const summary = {
      total_products: totalProducts,
      active_products: activeProducts,
      total_inventory_value: totalInventoryValue,
      total_cost_value: totalCostValue,
      low_stock_count: lowStockCount,
      critical_stock_count: criticalStockCount,
      total_batches: totalBatches || 0,
      expiring_soon_count: expiringSoonCount || 0,
      needs_retest_count: needsRetestCount || 0,
      quarantined_count: quarantinedCount || 0,
      last_updated: new Date().toISOString(),
    };

    this.setCache(cacheKey, summary);
    return summary;
  }

  // ============================================================================
  // PRODUCT IMPORT
  // ============================================================================

  /**
   * Batch import products from CSV data
   * Uses upsert to handle both new products and updates to existing SKUs
   */
  async importProducts(
    products: TransformedProduct[],
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const BATCH_SIZE = 50; // Supabase recommends batches of 50-100
    const results: ImportResult = {
      total: products.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    const batches = chunkArray(products, BATCH_SIZE);
    let processed = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      try {
        // Use upsert to handle both inserts and updates
        // Conflicts on (dispensary_id, sku) will update existing products
        const { data, error } = await supabase
          .from('products')
          .upsert(
            batch.map((p) => ({
              dispensary_id: p.dispensary_id,
              sku: p.sku,
              name: p.name,
              product_type: p.product_type,
              brand: p.brand,
              description: p.description,
              cost_price: p.cost_price,
              retail_price: p.retail_price,
              quantity_on_hand: p.quantity_on_hand,
              low_stock_threshold: p.low_stock_threshold,
              is_active: p.is_active,
              strain_name: p.strain_name,
              thc_pct: p.thc_pct,
              cbd_pct: p.cbd_pct,
              vendor: p.vendor,
              updated_at: new Date().toISOString(),
            })),
            {
              onConflict: 'dispensary_id,sku',
              ignoreDuplicates: false,
            }
          )
          .select('id');

        if (error) {
          console.error('Batch import error:', error);
          // Track individual failures from this batch
          batch.forEach((product) => {
            results.failed++;
            results.errors.push({
              sku: product.sku,
              message: error.message,
            });
          });
        } else {
          results.successful += data?.length || batch.length;
        }
      } catch (err) {
        console.error('Unexpected import error:', err);
        // Handle network/unexpected errors
        batch.forEach((product) => {
          results.failed++;
          results.errors.push({
            sku: product.sku,
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        });
      }

      processed += batch.length;

      // Report progress
      if (onProgress) {
        onProgress({
          current: processed,
          total: products.length,
          percentage: Math.round((processed / products.length) * 100),
          currentBatch: i + 1,
          totalBatches: batches.length,
        });
      }

      // Small delay between batches to avoid rate limiting
      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Clear cache after import to ensure fresh data
    this.clearCache();

    return results;
  }

  /**
   * Set the dispensary ID for import operations
   */
  setDispensaryId(dispensaryId: string): void {
    this.dispensaryId = dispensaryId;
    this.clearCache();
  }

  /**
   * Get current dispensary ID
   */
  getDispensaryId(): string {
    return this.dispensaryId;
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();
export default inventoryService;
