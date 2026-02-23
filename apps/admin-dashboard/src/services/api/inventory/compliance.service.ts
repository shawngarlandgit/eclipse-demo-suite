/**
 * Compliance Service
 * Handles compliance alerts, inventory summary, and regulatory monitoring
 */

import { supabase } from '../../supabase/client';
import type {
  ComplianceAlert,
  InventorySummary,
} from '../../../modules/inventory/types/index';
import type { DbBatchWithProduct } from './types';
import { inventoryCache } from './cache.service';

export class ComplianceService {
  constructor(private getDispensaryId: () => string) {}

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
      .eq('dispensary_id', this.getDispensaryId())
      .eq('status', 'active')
      .lte('expiration_date', thirtyDaysFromNow.toISOString())
      .gte('expiration_date', new Date().toISOString());

    (expiringBatches as DbBatchWithProduct[] | null)?.forEach((batch) => {
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
      .eq('dispensary_id', this.getDispensaryId())
      .neq('status', 'expired')
      .lt('expiration_date', new Date().toISOString());

    (expiredBatches as DbBatchWithProduct[] | null)?.forEach((batch) => {
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
      .eq('dispensary_id', this.getDispensaryId())
      .eq('status', 'active')
      .lt('test_date', ninetyDaysAgo.toISOString());

    (needsRetestBatches as DbBatchWithProduct[] | null)?.forEach((batch) => {
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
      .eq('dispensary_id', this.getDispensaryId())
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
    const cached = inventoryCache.get<InventorySummary>(cacheKey);
    if (cached) return cached;

    // Get all products
    const { data: products } = await supabase
      .from('products')
      .select('id, is_active, quantity_on_hand, low_stock_threshold, retail_price, cost_price')
      .eq('dispensary_id', this.getDispensaryId());

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
      .eq('dispensary_id', this.getDispensaryId());

    // Get compliance counts
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { count: expiringSoonCount } = await supabase
      .from('product_batches')
      .select('*', { count: 'exact', head: true })
      .eq('dispensary_id', this.getDispensaryId())
      .eq('status', 'active')
      .lte('expiration_date', thirtyDaysFromNow.toISOString())
      .gte('expiration_date', new Date().toISOString());

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { count: needsRetestCount } = await supabase
      .from('product_batches')
      .select('*', { count: 'exact', head: true })
      .eq('dispensary_id', this.getDispensaryId())
      .eq('status', 'active')
      .lt('test_date', ninetyDaysAgo.toISOString());

    const { count: quarantinedCount } = await supabase
      .from('product_batches')
      .select('*', { count: 'exact', head: true })
      .eq('dispensary_id', this.getDispensaryId())
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

    inventoryCache.set(cacheKey, summary);
    return summary;
  }
}
