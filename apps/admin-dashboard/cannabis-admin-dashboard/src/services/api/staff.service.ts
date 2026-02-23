import { supabase } from '../supabase/client';
import type {
  StaffPerformanceMetrics,
  StaffPerformanceTrend,
  StaffSummary,
  StaffFilters,
} from '../../modules/staff/types';
import type { DateRange } from '../../types';

/**
 * Staff Service
 * Handles staff performance data, metrics, and analytics
 */

// Helper: Get current dispensary ID
function getCurrentDispensaryId(): string {
  if (import.meta.env.DEV) {
    return 'demo-dispensary-123';
  }
  return 'demo-dispensary-123';
}

// Sample staff members
const STAFF_MEMBERS = [
  { id: 'staff-1', name: 'Sarah Johnson', role: 'Budtender' },
  { id: 'staff-2', name: 'Mike Chen', role: 'Budtender' },
  { id: 'staff-3', name: 'Emily Rodriguez', role: 'Budtender' },
  { id: 'staff-4', name: 'James Wilson', role: 'Budtender' },
  { id: 'staff-5', name: 'Ashley Martinez', role: 'Budtender' },
  { id: 'staff-6', name: 'David Kim', role: 'Shift Manager' },
  { id: 'staff-7', name: 'Jessica Brown', role: 'Budtender' },
  { id: 'staff-8', name: 'Tyler Anderson', role: 'Budtender' },
  { id: 'staff-9', name: 'Rachel Green', role: 'Budtender' },
  { id: 'staff-10', name: 'Kevin Park', role: 'Shift Manager' },
];

class StaffService {
  private dispensaryId: string;

  constructor() {
    this.dispensaryId = getCurrentDispensaryId();
  }

  // ============================================================================
  // STAFF PERFORMANCE ANALYTICS
  // ============================================================================

  /**
   * Get performance metrics for all staff members
   */
  async getStaffPerformance(dateRange: DateRange, filters?: StaffFilters): Promise<StaffPerformanceMetrics[]> {
    // Generate mock performance data for each staff member
    let staffData = STAFF_MEMBERS.map((staff, index) => {
      const baseSales = Math.random() * 15000 + 5000;
      const transactions = Math.floor(Math.random() * 150 + 50);
      const recommendations = Math.floor(Math.random() * 80 + 20);
      const hoursWorked = Math.random() * 40 + 20;

      return {
        user_id: staff.id,
        full_name: staff.name,
        role: staff.role,
        sales: baseSales,
        sales_change_pct: (Math.random() - 0.5) * 40, // -20% to +20%
        transaction_count: transactions,
        avg_transaction_value: baseSales / transactions,
        recommendation_count: recommendations,
        recommendation_conversion_rate: Math.random() * 0.4 + 0.3, // 30-70%
        top_product_category: ['flower', 'edible', 'vape', 'pre-roll'][Math.floor(Math.random() * 4)],
        hours_worked: hoursWorked,
        sales_per_hour: baseSales / hoursWorked,
      };
    });

    // Apply filters
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      staffData = staffData.filter(s =>
        s.full_name.toLowerCase().includes(search)
      );
    }

    if (filters?.role && filters.role !== 'all') {
      staffData = staffData.filter(s => s.role === filters.role);
    }

    // Apply sorting
    const sortBy = filters?.sort_by || 'sales';
    const sortOrder = filters?.sort_order || 'desc';

    staffData.sort((a, b) => {
      let aValue: number, bValue: number;

      switch (sortBy) {
        case 'sales':
          aValue = a.sales;
          bValue = b.sales;
          break;
        case 'transactions':
          aValue = a.transaction_count;
          bValue = b.transaction_count;
          break;
        case 'conversion_rate':
          aValue = a.recommendation_conversion_rate;
          bValue = b.recommendation_conversion_rate;
          break;
        case 'name':
          return sortOrder === 'asc'
            ? a.full_name.localeCompare(b.full_name)
            : b.full_name.localeCompare(a.full_name);
        default:
          aValue = a.sales;
          bValue = b.sales;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return staffData;
  }

  /**
   * Get performance summary for all staff
   */
  async getStaffSummary(dateRange: DateRange): Promise<StaffSummary> {
    const staffPerformance = await this.getStaffPerformance(dateRange);

    const totalSales = staffPerformance.reduce((sum, s) => sum + s.sales, 0);
    const totalTransactions = staffPerformance.reduce((sum, s) => sum + s.transaction_count, 0);

    // Sort by sales to find top performer
    const topPerformer = staffPerformance.length > 0
      ? {
          user_id: staffPerformance[0].user_id,
          full_name: staffPerformance[0].full_name,
          sales: staffPerformance[0].sales,
        }
      : null;

    return {
      total_staff: STAFF_MEMBERS.length,
      active_today: Math.floor(Math.random() * 3) + (STAFF_MEMBERS.length - 2), // Most staff active
      total_sales: totalSales,
      total_transactions: totalTransactions,
      avg_sales_per_staff: totalSales / STAFF_MEMBERS.length,
      top_performer: topPerformer,
    };
  }

  /**
   * Get performance trend for a specific staff member
   */
  async getStaffPerformanceTrend(userId: string, dateRange: DateRange): Promise<StaffPerformanceTrend[]> {
    const days = this.getDaysBetween(dateRange.from, dateRange.to);

    return days.map(date => ({
      date,
      user_id: userId,
      sales: Math.random() * 2000 + 500,
      transactions: Math.floor(Math.random() * 20 + 5),
      recommendations: Math.floor(Math.random() * 15 + 3),
    }));
  }

  /**
   * Get top performing staff members
   */
  async getTopStaff(dateRange: DateRange, limit: number = 5): Promise<StaffPerformanceMetrics[]> {
    const allStaff = await this.getStaffPerformance(dateRange, {
      sort_by: 'sales',
      sort_order: 'desc',
    });

    return allStaff.slice(0, limit);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getDaysBetween(from: string, to: string): string[] {
    const days: string[] = [];
    const start = new Date(from);
    const end = new Date(to);

    const current = new Date(start);
    while (current <= end) {
      days.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return days;
  }
}

// Export singleton instance
export const staffService = new StaffService();
