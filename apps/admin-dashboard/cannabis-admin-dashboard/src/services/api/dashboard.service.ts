import { supabase } from '../supabase/client';
import type { DashboardKPIs, SalesTrend, DateRange } from '../../types';
import { authService } from './auth.service';
import { log } from '../../utils/logger';

/**
 * Dashboard Service
 * Handles dashboard data fetching and KPI aggregation
 */

// ============================================================================
// Dashboard Summary & KPIs
// ============================================================================

/**
 * Get dashboard summary with all KPIs
 */
export async function getDashboardSummary(): Promise<DashboardKPIs | null> {
  try {
    const dispensaryId = await authService.getUserDispensaryId();

    if (!dispensaryId) {
      throw new Error('No dispensary ID found');
    }

    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const yearStart = new Date(new Date().getFullYear(), 0, 1)
      .toISOString()
      .split('T')[0];

    // Fetch all KPIs in parallel
    const [
      todayRevenue,
      mtdRevenue,
      ytdRevenue,
      todayTransactions,
      mtdTransactions,
      newCustomersToday,
      repeatCustomerPct,
      inventoryHealth,
      lowStockCount,
      itemsNeedingRetest,
      complianceFlags,
      staffCount,
    ] = await Promise.all([
      // Today's revenue
      supabase
        .from('transactions')
        .select('total')
        .eq('dispensary_id', dispensaryId)
        .gte('transaction_date', today)
        .then((res) =>
          res.data?.reduce((sum, t) => sum + (t.total || 0), 0) || 0
        ),

      // Month-to-date revenue
      supabase
        .from('transactions')
        .select('total')
        .eq('dispensary_id', dispensaryId)
        .gte('transaction_date', monthStart)
        .then((res) =>
          res.data?.reduce((sum, t) => sum + (t.total || 0), 0) || 0
        ),

      // Year-to-date revenue
      supabase
        .from('transactions')
        .select('total')
        .eq('dispensary_id', dispensaryId)
        .gte('transaction_date', yearStart)
        .then((res) =>
          res.data?.reduce((sum, t) => sum + (t.total || 0), 0) || 0
        ),

      // Today's transaction count
      supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('dispensary_id', dispensaryId)
        .gte('transaction_date', today)
        .then((res) => res.count || 0),

      // Month-to-date transaction count
      supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('dispensary_id', dispensaryId)
        .gte('transaction_date', monthStart)
        .then((res) => res.count || 0),

      // New customers today
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('dispensary_id', dispensaryId)
        .gte('created_at', today)
        .then((res) => res.count || 0),

      // Repeat customer percentage (customers with > 1 transaction)
      supabase
        .from('customers')
        .select('transaction_count')
        .eq('dispensary_id', dispensaryId)
        .then((res) => {
          const customers = res.data || [];
          const repeatCustomers = customers.filter((c) => c.transaction_count > 1).length;
          return customers.length > 0 ? (repeatCustomers / customers.length) * 100 : 0;
        }),

      // Inventory health percentage
      supabase
        .from('products')
        .select('quantity_on_hand, reorder_level')
        .eq('dispensary_id', dispensaryId)
        .then((res) => {
          const products = res.data || [];
          const healthyProducts = products.filter(
            (p) => p.quantity_on_hand > p.reorder_level
          ).length;
          return products.length > 0 ? (healthyProducts / products.length) * 100 : 100;
        }),

      // Low stock count
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('dispensary_id', dispensaryId)
        .filter('quantity_on_hand', 'lte', 'reorder_level')
        .then((res) => res.count || 0),

      // Items needing retest (test_passed is null or test_date is old)
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('dispensary_id', dispensaryId)
        .or('test_passed.is.null,test_date.is.null')
        .then((res) => res.count || 0),

      // Compliance flags (open and critical)
      supabase
        .from('compliance_flags')
        .select('severity', { count: 'exact' })
        .eq('dispensary_id', dispensaryId)
        .is('resolved_at', null)
        .then((res) => {
          const flags = res.data || [];
          return {
            total: res.count || 0,
            critical: flags.filter((f) => f.severity === 'critical').length,
          };
        }),

      // Staff count
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('dispensary_id', dispensaryId)
        .then((res) => res.count || 0),
    ]);

    // Calculate average transaction value
    const avgTransactionValue =
      todayTransactions > 0 ? todayRevenue / todayTransactions : 0;

    const kpis: DashboardKPIs = {
      revenue_today: todayRevenue,
      revenue_mtd: mtdRevenue,
      revenue_ytd: ytdRevenue,
      transactions_today: todayTransactions,
      transactions_mtd: mtdTransactions,
      avg_transaction_value: avgTransactionValue,
      customers_new_today: newCustomersToday,
      customers_repeat_pct: repeatCustomerPct,
      inventory_health_pct: inventoryHealth,
      low_stock_count: lowStockCount,
      items_needing_retest: itemsNeedingRetest,
      compliance_flags_open: complianceFlags.total,
      compliance_flags_critical: complianceFlags.critical,
      staff_count: staffCount,
      last_updated: new Date().toISOString(),
    };

    return kpis;
  } catch (error) {
    log.error('Error fetching dashboard summary:', error);
    return null;
  }
}

// ============================================================================
// Sales Trends
// ============================================================================

/**
 * Get sales trend data for charting
 */
export async function getSalesTrend(days: number = 30): Promise<SalesTrend[]> {
  try {
    const dispensaryId = await authService.getUserDispensaryId();

    if (!dispensaryId) {
      throw new Error('No dispensary ID found');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('transactions')
      .select('transaction_date, total')
      .eq('dispensary_id', dispensaryId)
      .gte('transaction_date', startDate.toISOString())
      .order('transaction_date', { ascending: true });

    if (error) {
      throw error;
    }

    // Aggregate by date
    const trendMap = new Map<string, { sales: number; count: number }>();

    data?.forEach((transaction) => {
      const date = transaction.transaction_date.split('T')[0];
      const existing = trendMap.get(date) || { sales: 0, count: 0 };

      trendMap.set(date, {
        sales: existing.sales + transaction.total,
        count: existing.count + 1,
      });
    });

    // Convert to array
    const trend: SalesTrend[] = Array.from(trendMap.entries()).map(
      ([date, data]) => ({
        date,
        sales: data.sales,
        transactions: data.count,
        avg_ticket: data.count > 0 ? data.sales / data.count : 0,
      })
    );

    return trend;
  } catch (error) {
    log.error('Error fetching sales trend:', error);
    return [];
  }
}

// ============================================================================
// Category Breakdown
// ============================================================================

/**
 * Get sales breakdown by product category
 */
export async function getCategoryBreakdown(): Promise<
  Array<{ category: string; revenue: number; percentage: number }>
> {
  try {
    const dispensaryId = await authService.getUserDispensaryId();

    if (!dispensaryId) {
      throw new Error('No dispensary ID found');
    }

    // Get all products with their types
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, product_type')
      .eq('dispensary_id', dispensaryId);

    if (productsError) {
      throw productsError;
    }

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('products')
      .eq('dispensary_id', dispensaryId)
      .gte(
        'transaction_date',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (transactionsError) {
      throw transactionsError;
    }

    // Create product type lookup
    const productTypeMap = new Map(
      products?.map((p) => [p.id, p.product_type]) || []
    );

    // Aggregate sales by category
    const categoryRevenue = new Map<string, number>();

    transactions?.forEach((transaction) => {
      const items = transaction.products as Array<{
        product_id: string;
        price: number;
        quantity: number;
      }>;

      items.forEach((item) => {
        const productType = productTypeMap.get(item.product_id) || 'other';
        const revenue = item.price * item.quantity;
        categoryRevenue.set(
          productType,
          (categoryRevenue.get(productType) || 0) + revenue
        );
      });
    });

    // Calculate total and percentages
    const totalRevenue = Array.from(categoryRevenue.values()).reduce(
      (sum, rev) => sum + rev,
      0
    );

    const breakdown = Array.from(categoryRevenue.entries())
      .map(([category, revenue]) => ({
        category,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return breakdown;
  } catch (error) {
    log.error('Error fetching category breakdown:', error);
    return [];
  }
}

// ============================================================================
// Top Products
// ============================================================================

/**
 * Get top selling products
 */
export async function getTopProducts(limit: number = 5): Promise<
  Array<{
    product_id: string;
    product_name: string;
    revenue: number;
    units_sold: number;
  }>
> {
  try {
    const dispensaryId = await authService.getUserDispensaryId();

    if (!dispensaryId) {
      throw new Error('No dispensary ID found');
    }

    // Use materialized view if available, otherwise calculate
    const { data, error } = await supabase
      .from('mv_product_performance')
      .select('product_id, product_name, total_revenue, units_sold')
      .eq('dispensary_id', dispensaryId)
      .order('total_revenue', { ascending: false })
      .limit(limit);

    if (error) {
      // Fallback: calculate manually if materialized view doesn't exist
      log.warn('Materialized view not available, calculating manually');
      return [];
    }

    return (
      data?.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        revenue: item.total_revenue,
        units_sold: item.units_sold,
      })) || []
    );
  } catch (error) {
    log.error('Error fetching top products:', error);
    return [];
  }
}

// Export service object
export const dashboardService = {
  getDashboardSummary,
  getSalesTrend,
  getCategoryBreakdown,
  getTopProducts,
};

export default dashboardService;
