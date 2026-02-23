import { supabase } from '../supabase/client';
import type {
  DateRange,
  RevenueTrend,
  RevenueComparison,
  CategoryBreakdown,
  ProductPerformance,
  CustomerMetrics,
  CustomerTrend,
  HourlyPattern,
  DayOfWeekPattern,
  AnalyticsSummary,
} from '../../modules/analytics/types/index';

/**
 * Analytics Service
 * Handles analytics data aggregation, trend analysis, and reporting
 */

// Helper: Get current dispensary ID
function getCurrentDispensaryId(): string {
  if (import.meta.env.DEV) {
    return 'demo-dispensary-123';
  }
  return 'demo-dispensary-123';
}

class AnalyticsService {
  private dispensaryId: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.dispensaryId = getCurrentDispensaryId();
  }

  // ============================================================================
  // REVENUE ANALYTICS
  // ============================================================================

  /**
   * Get revenue trend data for a date range
   */
  async getRevenueTrend(dateRange: DateRange): Promise<RevenueTrend[]> {
    // In production, this would query the transactions table
    // For now, generate simulated data
    return this.generateRevenueTrendData(dateRange);
  }

  /**
   * Get revenue comparison (current vs previous period)
   */
  async getRevenueComparison(dateRange: DateRange): Promise<RevenueComparison> {
    const currentData = await this.getRevenueTrend(dateRange);
    const previousDateRange = this.getPreviousPeriod(dateRange);
    const previousData = await this.getRevenueTrend(previousDateRange);

    const currentTotal = currentData.reduce((sum, d) => sum + d.revenue, 0);
    const currentTransactions = currentData.reduce((sum, d) => sum + d.transaction_count, 0);
    const currentAvgValue = currentTotal / currentTransactions || 0;

    const previousTotal = previousData.reduce((sum, d) => sum + d.revenue, 0);
    const previousTransactions = previousData.reduce((sum, d) => sum + d.transaction_count, 0);
    const previousAvgValue = previousTotal / previousTransactions || 0;

    return {
      current: {
        total_revenue: currentTotal,
        transaction_count: currentTransactions,
        avg_transaction_value: currentAvgValue,
      },
      previous: {
        total_revenue: previousTotal,
        transaction_count: previousTransactions,
        avg_transaction_value: previousAvgValue,
      },
      change: {
        revenue_pct: this.calculatePercentageChange(currentTotal, previousTotal),
        transactions_pct: this.calculatePercentageChange(currentTransactions, previousTransactions),
        avg_value_pct: this.calculatePercentageChange(currentAvgValue, previousAvgValue),
      },
    };
  }

  // ============================================================================
  // CATEGORY ANALYTICS
  // ============================================================================

  /**
   * Get sales breakdown by product category
   */
  async getCategoryBreakdown(dateRange: DateRange): Promise<CategoryBreakdown[]> {
    // Generate simulated category data
    const categories = ['flower', 'edible', 'extract', 'pre-roll', 'vape', 'topical'];
    const totalRevenue = Math.random() * 50000 + 30000;

    // Generate random weights for each category
    const weights = categories.map(() => Math.random() * 0.3 + 0.05);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Normalize weights and calculate revenue
    const data = categories.map((category, index) => {
      const normalizedWeight = weights[index] / totalWeight;
      const revenue = totalRevenue * normalizedWeight;
      const transaction_count = Math.floor(Math.random() * 200 + 50);

      return {
        category,
        revenue,
        transaction_count,
        percentage: normalizedWeight * 100,
        avg_transaction_value: revenue / transaction_count,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Ensure percentages add up to exactly 100% by adjusting the largest category
    const totalPercentage = data.reduce((sum, item) => sum + item.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      data[0].percentage += (100 - totalPercentage);
    }

    return data;
  }

  /**
   * Get top performing products
   */
  async getTopProducts(dateRange: DateRange, limit: number = 10): Promise<ProductPerformance[]> {
    // Generate simulated product performance data with realistic cannabis products
    const productData: Array<{ name: string; category: string }> = [
      // Flower
      { name: 'Blue Dream', category: 'flower' },
      { name: 'Sour Diesel', category: 'flower' },
      { name: 'Girl Scout Cookies', category: 'flower' },
      { name: 'Gorilla Glue #4', category: 'flower' },
      { name: 'Wedding Cake', category: 'flower' },
      { name: 'OG Kush', category: 'flower' },
      { name: 'Gelato', category: 'flower' },
      { name: 'Purple Haze', category: 'flower' },
      { name: 'Jack Herer', category: 'flower' },
      { name: 'White Widow', category: 'flower' },

      // Pre-Rolls
      { name: 'Blue Dream Pre-Roll', category: 'pre-roll' },
      { name: 'Sour Diesel Pre-Roll', category: 'pre-roll' },
      { name: 'GSC Pre-Roll 3-Pack', category: 'pre-roll' },
      { name: 'Gelato Infused Pre-Roll', category: 'pre-roll' },
      { name: 'Wedding Cake Pre-Roll', category: 'pre-roll' },
      { name: 'OG Kush Pre-Roll 5-Pack', category: 'pre-roll' },
      { name: 'Jack Herer Pre-Roll', category: 'pre-roll' },
      { name: 'Purple Punch Pre-Roll', category: 'pre-roll' },
      { name: 'Sativa Blend Pre-Roll', category: 'pre-roll' },
      { name: 'Indica Blend Pre-Roll Pack', category: 'pre-roll' },
      { name: 'Hybrid Mix Pre-Roll 10-Pack', category: 'pre-roll' },
      { name: 'Zkittlez Pre-Roll', category: 'pre-roll' },

      // Edibles
      { name: 'THC Gummies 10mg', category: 'edible' },
      { name: 'CBD Oil Tincture', category: 'edible' },
      { name: 'Chocolate Bar 100mg', category: 'edible' },
      { name: 'Sour Gummies 5mg', category: 'edible' },
      { name: 'Hard Candy Variety Pack', category: 'edible' },
      { name: 'Brownie Bites 50mg', category: 'edible' },
      { name: 'Fruit Chews 10mg', category: 'edible' },
      { name: 'CBD:THC Gummies 1:1', category: 'edible' },

      // Concentrates/Extracts
      { name: 'Live Resin Cart - Blue Dream', category: 'extract' },
      { name: 'Hash Rosin', category: 'extract' },
      { name: 'Shatter - GSC', category: 'extract' },
      { name: 'Wax - Wedding Cake', category: 'extract' },
      { name: 'Live Resin - Sour Diesel', category: 'extract' },
      { name: 'Diamond Sauce', category: 'extract' },
      { name: 'THC-A Crystals', category: 'extract' },
      { name: 'Budder - Gelato', category: 'extract' },

      // Vapes
      { name: 'Sativa Cart - Jack Herer', category: 'vape' },
      { name: 'Indica Cart - Purple Punch', category: 'vape' },
      { name: 'Hybrid Cart - Blue Dream', category: 'vape' },
      { name: 'Live Resin Cart - GSC', category: 'vape' },
      { name: 'Disposable Vape - OG Kush', category: 'vape' },
      { name: 'Disposable Vape - Wedding Cake', category: 'vape' },
      { name: 'CBD Cart 1:1', category: 'vape' },
      { name: 'Flavored Cart - Mango', category: 'vape' },
    ];

    return productData.slice(0, limit).map((product, index) => ({
      product_id: `product-${index}`,
      product_name: product.name,
      category: product.category,
      revenue: Math.random() * 5000 + 1000,
      quantity_sold: Math.floor(Math.random() * 200 + 50),
      transaction_count: Math.floor(Math.random() * 100 + 20),
      avg_price: Math.random() * 50 + 10,
    })).sort((a, b) => b.revenue - a.revenue);
  }

  // ============================================================================
  // CUSTOMER ANALYTICS
  // ============================================================================

  /**
   * Get customer metrics summary
   */
  async getCustomerMetrics(dateRange: DateRange): Promise<CustomerMetrics> {
    return {
      total_customers: Math.floor(Math.random() * 500 + 200),
      new_customers: Math.floor(Math.random() * 100 + 20),
      returning_customers: Math.floor(Math.random() * 400 + 180),
      avg_customer_value: Math.random() * 300 + 100,
      avg_purchase_frequency: Math.random() * 3 + 1,
      retention_rate: Math.random() * 30 + 60, // 60-90%
    };
  }

  /**
   * Get customer acquisition trend
   */
  async getCustomerTrend(dateRange: DateRange): Promise<CustomerTrend[]> {
    const days = this.getDaysBetween(new Date(dateRange.startDate), new Date(dateRange.endDate));
    const data: CustomerTrend[] = [];

    for (let i = 0; i <= days; i++) {
      const date = new Date(dateRange.startDate);
      date.setDate(date.getDate() + i);

      data.push({
        date: date.toISOString().split('T')[0],
        new_customers: Math.floor(Math.random() * 20 + 5),
        returning_customers: Math.floor(Math.random() * 50 + 20),
        total_revenue: Math.random() * 3000 + 1000,
      });
    }

    return data;
  }

  // ============================================================================
  // TIME-BASED ANALYTICS
  // ============================================================================

  /**
   * Get sales patterns by day of week
   */
  async getDayOfWeekPattern(dateRange: DateRange): Promise<DayOfWeekPattern[]> {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return daysOfWeek.map(day => ({
      day_of_week: day,
      avg_revenue: Math.random() * 2000 + 500,
      transaction_count: Math.floor(Math.random() * 100 + 30),
    }));
  }

  /**
   * Get sales patterns by hour of day
   */
  async getHourlyPattern(dateRange: DateRange): Promise<HourlyPattern[]> {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const data: HourlyPattern[] = [];

    // Generate pattern: low in early morning, peak in afternoon/evening
    daysOfWeek.forEach(day => {
      hours.forEach(hour => {
        let multiplier = 0.1;
        if (hour >= 10 && hour <= 20) {
          multiplier = 0.5 + Math.random() * 0.5;
        }
        if (hour >= 16 && hour <= 19) {
          multiplier = 0.8 + Math.random() * 0.2;
        }

        data.push({
          hour,
          day_of_week: day,
          avg_revenue: Math.random() * 500 * multiplier,
          transaction_count: Math.floor(Math.random() * 20 * multiplier),
        });
      });
    });

    return data;
  }

  // ============================================================================
  // ANALYTICS SUMMARY
  // ============================================================================

  /**
   * Get comprehensive analytics summary
   */
  async getAnalyticsSummary(dateRange: DateRange): Promise<AnalyticsSummary> {
    const comparison = await this.getRevenueComparison(dateRange);
    const categories = await this.getCategoryBreakdown(dateRange);
    const topProducts = await this.getTopProducts(dateRange, 1);
    const customerMetrics = await this.getCustomerMetrics(dateRange);

    return {
      date_range: dateRange,
      revenue: {
        total: comparison.current.total_revenue,
        change_pct: comparison.change.revenue_pct,
        avg_daily: comparison.current.total_revenue / this.getDaysBetween(new Date(dateRange.startDate), new Date(dateRange.endDate)),
      },
      transactions: {
        total: comparison.current.transaction_count,
        change_pct: comparison.change.transactions_pct,
        avg_value: comparison.current.avg_transaction_value,
        avg_value_change_pct: comparison.change.avg_value_pct,
      },
      customers: {
        total: customerMetrics.total_customers,
        new: customerMetrics.new_customers,
        returning: customerMetrics.returning_customers,
        retention_rate: customerMetrics.retention_rate,
      },
      top_product: {
        name: topProducts[0]?.product_name || 'N/A',
        revenue: topProducts[0]?.revenue || 0,
      },
      top_category: {
        name: categories[0]?.category || 'N/A',
        revenue: categories[0]?.revenue || 0,
        percentage: categories[0]?.percentage || 0,
      },
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getPreviousPeriod(dateRange: DateRange): DateRange {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const days = this.getDaysBetween(start, end);

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - days);

    return {
      startDate: prevStart.toISOString().split('T')[0],
      endDate: prevEnd.toISOString().split('T')[0],
    };
  }

  private getDaysBetween(start: Date, end: Date): number {
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private generateRevenueTrendData(dateRange: DateRange): RevenueTrend[] {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const days = this.getDaysBetween(start, end);
    const data: RevenueTrend[] = [];

    // For single-day ranges (Today, Yesterday), generate hourly data
    if (days === 0) {
      const baseDate = new Date(dateRange.startDate);

      for (let hour = 0; hour < 24; hour++) {
        const currentHour = new Date(baseDate);
        currentHour.setHours(hour, 0, 0, 0);

        // Generate realistic hourly pattern (low early morning, peak afternoon/evening)
        let multiplier = 0.2;
        if (hour >= 9 && hour <= 21) {
          multiplier = 0.5 + Math.random() * 0.3;
        }
        if (hour >= 15 && hour <= 19) {
          multiplier = 0.8 + Math.random() * 0.2;
        }

        const transaction_count = Math.floor((Math.random() * 20 + 5) * multiplier);
        const avg_transaction_value = Math.random() * 60 + 20;
        const revenue = transaction_count * avg_transaction_value;

        data.push({
          date: currentHour.toISOString(),
          revenue,
          transaction_count,
          avg_transaction_value,
        });
      }
    } else {
      // For multi-day ranges, generate daily data
      for (let i = 0; i <= days; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);

        const transaction_count = Math.floor(Math.random() * 100 + 30);
        const avg_transaction_value = Math.random() * 60 + 20;
        const revenue = transaction_count * avg_transaction_value;

        data.push({
          date: date.toISOString().split('T')[0],
          revenue,
          transaction_count,
          avg_transaction_value,
        });
      }
    }

    return data;
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
export const analyticsService = new AnalyticsService();
export default analyticsService;
