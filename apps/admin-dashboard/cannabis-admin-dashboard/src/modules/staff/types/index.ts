/**
 * Staff Module Types
 */

export interface StaffMemberDetails {
  user_id: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  email: string;
  hire_date: string;
  is_active: boolean;
}

export interface StaffPerformanceMetrics {
  user_id: string;
  full_name: string;
  role: string;
  sales: number;
  sales_change_pct: number;
  transaction_count: number;
  avg_transaction_value: number;
  recommendation_count: number;
  recommendation_conversion_rate: number;
  top_product_category: string;
  hours_worked: number;
  sales_per_hour: number;
}

export interface StaffPerformanceTrend {
  date: string;
  user_id: string;
  sales: number;
  transactions: number;
  recommendations: number;
}

export interface StaffSummary {
  total_staff: number;
  active_today: number;
  total_sales: number;
  total_transactions: number;
  avg_sales_per_staff: number;
  top_performer: {
    user_id: string;
    full_name: string;
    sales: number;
  } | null;
}

export interface StaffFilters {
  search?: string;
  role?: string;
  status?: 'all' | 'active' | 'inactive';
  sort_by?: 'sales' | 'transactions' | 'conversion_rate' | 'name';
  sort_order?: 'asc' | 'desc';
}
