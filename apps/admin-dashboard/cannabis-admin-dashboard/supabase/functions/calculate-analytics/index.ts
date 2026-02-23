// Supabase Edge Function: calculate-analytics
// Purpose: Heavy analytics calculations for dashboard KPIs and insights

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Types
interface AnalyticsRequest {
  dispensaryId: string;
  calculationType: 'dashboard_kpis' | 'product_insights' | 'customer_insights' | 'staff_insights' | 'forecasting';
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  comparisonPeriod?: boolean;
  filters?: Record<string, any>;
}

interface DashboardKPIs {
  revenue: {
    current: number;
    previous: number;
    percentChange: number;
    trend: 'up' | 'down' | 'stable';
  };
  transactions: {
    current: number;
    previous: number;
    percentChange: number;
  };
  avgTransactionValue: {
    current: number;
    previous: number;
    percentChange: number;
  };
  uniqueCustomers: {
    current: number;
    previous: number;
    percentChange: number;
  };
  inventoryValue: number;
  lowStockItems: number;
  complianceFlags: {
    total: number;
    unresolved: number;
  };
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Authenticate request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const requestData: AnalyticsRequest = await req.json();
    const { dispensaryId, calculationType, dateRange, comparisonPeriod, filters } = requestData;

    // Verify user has access
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('dispensary_id, role, permissions')
      .eq('id', user.id)
      .single();

    if (userError || userData.dispensary_id !== dispensaryId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check view_analytics permission
    if (!userData.permissions?.view_analytics && !['manager', 'owner', 'admin'].includes(userData.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate analytics based on type
    let analyticsData;
    switch (calculationType) {
      case 'dashboard_kpis':
        analyticsData = await calculateDashboardKPIs(dispensaryId, dateRange, comparisonPeriod);
        break;
      case 'product_insights':
        analyticsData = await calculateProductInsights(dispensaryId, dateRange, filters);
        break;
      case 'customer_insights':
        analyticsData = await calculateCustomerInsights(dispensaryId, dateRange);
        break;
      case 'staff_insights':
        analyticsData = await calculateStaffInsights(dispensaryId, dateRange);
        break;
      case 'forecasting':
        analyticsData = await calculateForecasting(dispensaryId, dateRange);
        break;
      default:
        throw new Error(`Unknown calculation type: ${calculationType}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        calculationType,
        data: analyticsData,
        calculatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analytics calculation error:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Calculate Dashboard KPIs
async function calculateDashboardKPIs(
  dispensaryId: string,
  dateRange?: { startDate: string; endDate: string },
  comparisonPeriod?: boolean
): Promise<DashboardKPIs> {
  const endDate = dateRange?.endDate || new Date().toISOString().split('T')[0];
  const startDate = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Calculate date range for comparison period
  const daysDiff = Math.floor(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000)
  );
  const prevEndDate = new Date(new Date(startDate).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const prevStartDate = new Date(new Date(prevEndDate).getTime() - daysDiff * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Fetch current period data
  const { data: currentData } = await supabase
    .from('mv_daily_sales_summary')
    .select('*')
    .eq('dispensary_id', dispensaryId)
    .gte('sale_date', startDate)
    .lte('sale_date', endDate);

  // Fetch previous period data if comparison requested
  let previousData = [];
  if (comparisonPeriod) {
    const { data } = await supabase
      .from('mv_daily_sales_summary')
      .select('*')
      .eq('dispensary_id', dispensaryId)
      .gte('sale_date', prevStartDate)
      .lte('sale_date', prevEndDate);
    previousData = data || [];
  }

  // Calculate current metrics
  const currentRevenue = currentData?.reduce((sum, day) => sum + parseFloat(day.total_revenue), 0) || 0;
  const currentTransactions = currentData?.reduce((sum, day) => sum + day.total_transactions, 0) || 0;
  const currentCustomers = currentData?.reduce((sum, day) => sum + day.unique_customers, 0) || 0;
  const currentAvgTransactionValue = currentTransactions > 0 ? currentRevenue / currentTransactions : 0;

  // Calculate previous metrics
  const previousRevenue = previousData.reduce((sum, day) => sum + parseFloat(day.total_revenue), 0);
  const previousTransactions = previousData.reduce((sum, day) => sum + day.total_transactions, 0);
  const previousCustomers = previousData.reduce((sum, day) => sum + day.unique_customers, 0);
  const previousAvgTransactionValue = previousTransactions > 0 ? previousRevenue / previousTransactions : 0;

  // Calculate percent changes
  const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  const transactionsChange = previousTransactions > 0 ? ((currentTransactions - previousTransactions) / previousTransactions) * 100 : 0;
  const avgValueChange = previousAvgTransactionValue > 0 ? ((currentAvgTransactionValue - previousAvgTransactionValue) / previousAvgTransactionValue) * 100 : 0;
  const customersChange = previousCustomers > 0 ? ((currentCustomers - previousCustomers) / previousCustomers) * 100 : 0;

  // Get inventory value
  const { data: inventoryData } = await supabase
    .from('mv_inventory_value')
    .select('total_retail_value, low_stock_count')
    .eq('dispensary_id', dispensaryId);

  const inventoryValue = inventoryData?.reduce((sum, cat) => sum + parseFloat(cat.total_retail_value), 0) || 0;
  const lowStockItems = inventoryData?.reduce((sum, cat) => sum + cat.low_stock_count, 0) || 0;

  // Get compliance flags
  const { data: complianceData } = await supabase
    .from('compliance_flags')
    .select('id, resolved_at')
    .eq('dispensary_id', dispensaryId)
    .gte('flagged_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  const totalFlags = complianceData?.length || 0;
  const unresolvedFlags = complianceData?.filter(f => !f.resolved_at).length || 0;

  return {
    revenue: {
      current: currentRevenue,
      previous: previousRevenue,
      percentChange: revenueChange,
      trend: revenueChange > 5 ? 'up' : revenueChange < -5 ? 'down' : 'stable',
    },
    transactions: {
      current: currentTransactions,
      previous: previousTransactions,
      percentChange: transactionsChange,
    },
    avgTransactionValue: {
      current: currentAvgTransactionValue,
      previous: previousAvgTransactionValue,
      percentChange: avgValueChange,
    },
    uniqueCustomers: {
      current: currentCustomers,
      previous: previousCustomers,
      percentChange: customersChange,
    },
    inventoryValue,
    lowStockItems,
    complianceFlags: {
      total: totalFlags,
      unresolved: unresolvedFlags,
    },
  };
}

// Calculate Product Insights
async function calculateProductInsights(
  dispensaryId: string,
  dateRange?: { startDate: string; endDate: string },
  filters?: Record<string, any>
) {
  // Top performers
  const { data: topProducts } = await supabase
    .rpc('get_top_products', {
      p_dispensary_id: dispensaryId,
      p_category: filters?.category || null,
      p_limit: 10,
    });

  // Category breakdown
  const { data: categoryData } = await supabase
    .from('mv_product_performance')
    .select('category, total_revenue, total_quantity_sold, times_sold')
    .eq('dispensary_id', dispensaryId);

  const categoryBreakdown = categoryData?.reduce((acc: any, product: any) => {
    const cat = product.category;
    if (!acc[cat]) {
      acc[cat] = {
        revenue: 0,
        quantity: 0,
        productCount: 0,
      };
    }
    acc[cat].revenue += parseFloat(product.total_revenue || 0);
    acc[cat].quantity += parseFloat(product.total_quantity_sold || 0);
    acc[cat].productCount += 1;
    return acc;
  }, {});

  // Inventory turnover (products with high/low movement)
  const { data: lowMovers } = await supabase
    .from('mv_product_performance')
    .select('product_id, product_name, total_quantity_sold, last_sale_date')
    .eq('dispensary_id', dispensaryId)
    .order('total_quantity_sold', { ascending: true })
    .limit(10);

  return {
    topProducts,
    categoryBreakdown,
    lowMovers,
  };
}

// Calculate Customer Insights
async function calculateCustomerInsights(
  dispensaryId: string,
  dateRange?: { startDate: string; endDate: string }
) {
  // Customer segments
  const { data: segmentData } = await supabase
    .rpc('get_customer_distribution', {
      p_dispensary_id: dispensaryId,
    });

  // Customer lifetime value calculation
  const { data: topCustomers } = await supabase
    .from('mv_customer_segments')
    .select('*')
    .eq('dispensary_id', dispensaryId)
    .order('total_purchases', { ascending: false })
    .limit(10);

  // Churn analysis
  const { data: churnData } = await supabase
    .from('mv_customer_segments')
    .select('churn_risk, customer_id')
    .eq('dispensary_id', dispensaryId);

  const churnAnalysis = churnData?.reduce((acc: any, customer: any) => {
    acc[customer.churn_risk] = (acc[customer.churn_risk] || 0) + 1;
    return acc;
  }, {});

  // New vs returning customers
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: newCustomers } = await supabase
    .from('customers')
    .select('id')
    .eq('dispensary_id', dispensaryId)
    .gte('created_at', thirtyDaysAgo);

  return {
    segments: segmentData,
    topCustomers,
    churnAnalysis,
    newCustomersLast30Days: newCustomers?.length || 0,
  };
}

// Calculate Staff Insights
async function calculateStaffInsights(
  dispensaryId: string,
  dateRange?: { startDate: string; endDate: string }
) {
  const { data: staffPerformance } = await supabase
    .from('mv_staff_performance')
    .select('*')
    .eq('dispensary_id', dispensaryId)
    .order('total_sales', { ascending: false });

  // Calculate team metrics
  const totalSales = staffPerformance?.reduce((sum, staff) => sum + parseFloat(staff.total_sales || 0), 0) || 0;
  const totalTransactions = staffPerformance?.reduce((sum, staff) => sum + staff.total_transactions, 0) || 0;
  const avgSalesPerStaff = staffPerformance?.length > 0 ? totalSales / staffPerformance.length : 0;

  return {
    staffPerformance,
    teamMetrics: {
      totalSales,
      totalTransactions,
      avgSalesPerStaff,
      activeStaff: staffPerformance?.length || 0,
    },
  };
}

// Calculate Forecasting
async function calculateForecasting(
  dispensaryId: string,
  dateRange?: { startDate: string; endDate: string }
) {
  // Get historical data (last 90 days)
  const { data: historicalData } = await supabase
    .from('mv_daily_sales_summary')
    .select('sale_date, total_revenue, total_transactions')
    .eq('dispensary_id', dispensaryId)
    .gte('sale_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('sale_date', { ascending: true });

  if (!historicalData || historicalData.length < 14) {
    return {
      forecast: [],
      confidence: 'low',
      error: 'Insufficient historical data for forecasting',
    };
  }

  // Simple moving average forecast (7-day)
  const window = 7;
  const forecast = [];

  for (let i = 0; i < 7; i++) {
    const lastValues = historicalData.slice(-window);
    const avgRevenue = lastValues.reduce((sum, day) => sum + parseFloat(day.total_revenue), 0) / window;
    const avgTransactions = lastValues.reduce((sum, day) => sum + day.total_transactions, 0) / window;

    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + i + 1);

    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      predictedRevenue: avgRevenue,
      predictedTransactions: Math.round(avgTransactions),
    });
  }

  // Calculate trend (linear regression slope)
  const n = historicalData.length;
  const xMean = (n - 1) / 2;
  const yMean = historicalData.reduce((sum, day) => sum + parseFloat(day.total_revenue), 0) / n;

  let numerator = 0;
  let denominator = 0;

  historicalData.forEach((day, index) => {
    const x = index;
    const y = parseFloat(day.total_revenue);
    numerator += (x - xMean) * (y - yMean);
    denominator += (x - xMean) ** 2;
  });

  const slope = numerator / denominator;
  const trend = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';

  return {
    forecast,
    trend,
    confidence: historicalData.length >= 30 ? 'medium' : 'low',
    historicalAverage: yMean,
  };
}
