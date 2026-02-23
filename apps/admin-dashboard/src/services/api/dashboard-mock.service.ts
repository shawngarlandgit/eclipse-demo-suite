import type { DashboardKPIs, SalesTrend, TopProduct } from '../../types';

/**
 * Mock Dashboard Service
 * Generates realistic dashboard data for development
 */

class MockDashboardService {
  private salesData: SalesTrend[] = [];
  private topProducts: TopProduct[] = [];

  constructor() {
    this.generateMockData();
  }

  private generateMockData() {
    // Generate 30 days of sales trend data
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const baseTransactions = 45 + Math.floor(Math.random() * 30);
      const avgTicket = 55 + Math.random() * 30;
      const sales = baseTransactions * avgTicket;

      this.salesData.push({
        date: date.toISOString().split('T')[0],
        sales: parseFloat(sales.toFixed(2)),
        transactions: baseTransactions,
        avg_ticket: parseFloat(avgTicket.toFixed(2)),
      });
    }

    // Generate top products
    const productNames = [
      'Blue Dream - Flower',
      'Girl Scout Cookies - Pre-Roll',
      'OG Kush - Concentrate',
      'Sour Diesel - Vape',
      'Northern Lights - Edible',
    ];

    this.topProducts = productNames.map((name, index) => ({
      product_id: `prod-${index + 1}`,
      product_name: name,
      product_type: name.includes('Flower') ? 'flower' :
                    name.includes('Pre-Roll') ? 'pre-roll' :
                    name.includes('Concentrate') ? 'extract' :
                    name.includes('Vape') ? 'vape' : 'edible',
      rank: index + 1,
      revenue: 15000 - (index * 2500) + Math.random() * 1000,
      units_sold: 350 - (index * 50) + Math.floor(Math.random() * 30),
      margin: 35 + Math.random() * 15,
    }));
  }

  async getDashboardSummary(dateRange?: { startDate: string; endDate: string }): Promise<DashboardKPIs> {
    await this.simulateDelay();

    // Filter sales data by date range
    let filteredSales = this.salesData;
    if (dateRange) {
      filteredSales = this.salesData.filter(sale => {
        return sale.date >= dateRange.startDate && sale.date <= dateRange.endDate;
      });
    }

    // If no data in range, use last available
    if (filteredSales.length === 0) {
      filteredSales = [this.salesData[this.salesData.length - 1]];
    }

    const totalRevenue = filteredSales.reduce((sum, day) => sum + day.sales, 0);
    const totalTransactions = filteredSales.reduce((sum, day) => sum + day.transactions, 0);
    const avgTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Scale metrics based on date range
    const dayCount = filteredSales.length;
    const scaleFactor = dayCount / 30; // Relative to 30 days

    return {
      revenue_today: totalRevenue,
      revenue_mtd: totalRevenue,
      revenue_ytd: totalRevenue * 12, // Rough estimate
      transactions_today: totalTransactions,
      transactions_mtd: totalTransactions,
      avg_transaction_value: avgTicket,
      customers_new_today: Math.floor((Math.random() * 15 + 5) * scaleFactor),
      customers_repeat_pct: 65 + Math.random() * 15,
      inventory_health_pct: 82 + Math.random() * 10,
      low_stock_count: Math.floor(Math.random() * 8) + 2,
      items_needing_retest: Math.floor(Math.random() * 3),
      compliance_flags_open: Math.floor(Math.random() * 5),
      compliance_flags_critical: Math.floor(Math.random() * 2),
      staff_count: 8,
      last_updated: new Date().toISOString(),
    };
  }

  async getSalesTrend(days: number = 30): Promise<SalesTrend[]> {
    await this.simulateDelay();
    return this.salesData.slice(-days);
  }

  async getTopProducts(limit: number = 5): Promise<TopProduct[]> {
    await this.simulateDelay();
    return this.topProducts.slice(0, limit);
  }

  async getCategoryBreakdown(): Promise<any[]> {
    await this.simulateDelay();
    return [
      { category: 'flower', revenue: 45000, percentage: 35 },
      { category: 'pre-roll', revenue: 28000, percentage: 22 },
      { category: 'concentrate', revenue: 25000, percentage: 19 },
      { category: 'vape', revenue: 20000, percentage: 15 },
      { category: 'edible', revenue: 12000, percentage: 9 },
    ];
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  }
}

export const mockDashboardService = new MockDashboardService();
