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

// Cache entry type for analytics data
interface AnalyticsCacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

class AnalyticsService {
  private cache: Map<string, AnalyticsCacheEntry> = new Map();

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
  async getCategoryBreakdown(_dateRange: DateRange): Promise<CategoryBreakdown[]> {
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

  // Seeded random for consistent data
  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Cache for strain data from database
  private strainDataCache: Array<{ id: string; name: string; strain_type: string }> | null = null;

  // Fallback strain names if database is unavailable
  private readonly fallbackStrains = [
    'Blue Dream', 'Sour Diesel', 'Girl Scout Cookies', 'Gorilla Glue #4', 'Wedding Cake',
    'OG Kush', 'Gelato', 'Purple Haze', 'Jack Herer', 'White Widow',
    'Northern Lights', 'AK-47', 'Pineapple Express', 'Super Lemon Haze', 'Durban Poison',
    'Green Crack', 'Trainwreck', 'Maui Wowie', 'Bubba Kush', 'Strawberry Cough',
    'Cherry Pie', 'Skywalker OG', 'Do-Si-Dos', 'Sunset Sherbet', 'Amnesia Haze',
    'Tangie', 'Forbidden Fruit', 'Candyland', 'Headband', 'LA Confidential',
    'Chemdawg', 'Death Star', 'Blueberry', 'Alien OG', 'Harlequin',
    'Zkittlez', 'Mimosa', 'Tropicana Cookies', 'MAC', 'Runtz',
    'Biscotti', 'Ice Cream Cake', 'Apple Fritter', 'Lemon Cherry Gelato', 'Jealousy',
    'Cereal Milk', 'Papaya', 'London Pound Cake', 'Gary Payton', 'Slurricane',
    'Permanent Marker', 'Purple Punch', 'Granddaddy Purple', 'Grape Ape', 'Hindu Kush',
    'Afghan Kush', 'Master Kush', 'Critical Mass', 'Critical Kush', 'Blackberry Kush',
    'Zaza', 'Gushers', 'Thin Mint GSC', 'Animal Mints', 'Kush Mints',
    'Banana OG', 'Banana Punch', 'Strawberry Banana', 'Banana Kush', 'Banana Cream',
    'Lava Cake', 'Birthday Cake', 'Pancakes', 'French Toast', 'Waffles',
    'Grape Pie', 'Grape Gas', 'Grape Cream Cake', 'Grape Stomper', 'Grape Diamonds',
    'Rainbow Sherbet', 'Sherbert', 'Orange Sherbet', 'Mango Sherbet', 'Berry Sherbet',
    'Lemon OG', 'Lemon Skunk', 'Lemon Kush', 'Lemon Haze', 'Lemon Tree',
    'Orange Cookies', 'Orange Crush', 'Orange Creamsicle', 'Blood Orange', 'Mandarin Cookies',
    'Motor Breath', 'GMO', 'Garlic Cookies', 'Chem Cookies', 'Jet Fuel',
  ];

  /**
   * Fetch real strains from database (cached), with fallback to hardcoded list
   */
  private async fetchStrains(): Promise<Array<{ id: string; name: string; strain_type: string }>> {
    if (this.strainDataCache) return this.strainDataCache;

    try {
      const { data, error } = await supabase
        .from('strains')
        .select('id, name, strain_type')
        .order('name')
        .limit(500);

      if (!error && data && data.length > 0) {
        this.strainDataCache = data;
        return data;
      }
    } catch (e) {
      console.error('Failed to fetch strains from database:', e);
    }

    // Fallback to hardcoded strains
    const strainTypes = ['indica', 'sativa', 'hybrid'];
    const fallbackData = this.fallbackStrains.map((name, idx) => ({
      id: `fallback-${idx}`,
      name,
      strain_type: strainTypes[idx % 3],
    }));
    this.strainDataCache = fallbackData;
    return fallbackData;
  }

  /**
   * Get top performing products (uses real strain names from DB)
   */
  async getTopProducts(_dateRange: DateRange, limit: number = 10): Promise<ProductPerformance[]> {
    const strains = await this.fetchStrains();
    const categories = ['flower', 'pre-roll', 'edible', 'extract', 'vape'];

    // Generate product data from real strains with consistent simulated sales
    const productData: ProductPerformance[] = [];

    strains.slice(0, 100).forEach((strain, index) => {
      // Use strain index as seed for consistent random values
      const seed = index + 1;
      const category = categories[Math.floor(this.seededRandom(seed * 7) * categories.length)];
      const baseRevenue = this.seededRandom(seed * 2) * 8000 + 500;
      const quantity = Math.floor(this.seededRandom(seed * 3) * 300 + 20);
      const transactions = Math.floor(this.seededRandom(seed * 4) * 150 + 10);

      // Create product variants based on category
      let productName = strain.name;
      if (category === 'pre-roll') productName = `${strain.name} Pre-Roll`;
      else if (category === 'vape') productName = `${strain.name} Cart`;
      else if (category === 'extract') productName = `${strain.name} Live Resin`;
      else if (category === 'edible') productName = `${strain.name} Gummies`;

      productData.push({
        product_id: strain.id,
        product_name: productName,
        category,
        revenue: baseRevenue,
        quantity_sold: quantity,
        transaction_count: transactions,
        avg_price: baseRevenue / quantity,
      });
    });

    // Sort by revenue and return requested limit
    return productData
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Get top performing strains (aggregated across all product types)
   */
  async getTopStrains(limit: number = 75): Promise<Array<{
    strain_id: string;
    strain_name: string;
    strain_type: string;
    category: string;
    transactions: number;
    revenue: number;
  }>> {
    const strains = await this.fetchStrains();
    const categories = ['flower', 'pre-roll', 'edible', 'extract', 'vape'];

    // Generate strain performance data with consistent simulated sales
    const strainData = strains.slice(0, 400).map((strain, index) => {
      const seed = index + 100; // Different seed offset than products
      const category = categories[Math.floor(this.seededRandom(seed * 11) * categories.length)];
      const transactions = Math.floor(this.seededRandom(seed * 13) * 500 + 50);
      const avgPrice = this.seededRandom(seed * 17) * 40 + 15;

      return {
        strain_id: strain.id,
        strain_name: strain.name,
        strain_type: strain.strain_type || 'hybrid',
        category,
        transactions,
        revenue: transactions * avgPrice,
      };
    });

    // Sort by transactions and return requested limit
    return strainData
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, limit);
  }

  // ============================================================================
  // CUSTOMER ANALYTICS
  // ============================================================================

  /**
   * Get customer metrics summary
   */
  async getCustomerMetrics(_dateRange: DateRange): Promise<CustomerMetrics> {
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
  async getDayOfWeekPattern(_dateRange: DateRange): Promise<DayOfWeekPattern[]> {
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
  async getHourlyPattern(_dateRange: DateRange): Promise<HourlyPattern[]> {
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

  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
