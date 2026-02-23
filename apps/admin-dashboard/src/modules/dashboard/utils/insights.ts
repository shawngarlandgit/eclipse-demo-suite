import type { DashboardKPIs } from '../../../types';

/**
 * Dashboard Insights Generator
 * Generates smart, contextual insights based on overall business data
 */

export interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'neutral';
  title: string;
  description: string;
  icon?: string;
}

/**
 * Generate insights from dashboard KPIs
 */
export function generateDashboardInsights(kpis: DashboardKPIs): Insight[] {
  const insights: Insight[] = [];

  // Revenue performance
  if (kpis.revenue_today > 0 && kpis.revenue_mtd > 0) {
    const dailyAvg = kpis.revenue_mtd / new Date().getDate();
    const performanceRatio = kpis.revenue_today / dailyAvg;

    if (performanceRatio > 1.2) {
      insights.push({
        id: 'strong-revenue-day',
        type: 'success',
        title: 'Exceptional Sales Performance',
        description: `Today's revenue is ${((performanceRatio - 1) * 100).toFixed(0)}% above monthly average. Keep up the momentum!`,
      });
    } else if (performanceRatio < 0.8) {
      insights.push({
        id: 'below-avg-revenue',
        type: 'info',
        title: 'Revenue Below Average',
        description: `Today's sales are ${((1 - performanceRatio) * 100).toFixed(0)}% below monthly average. Consider promotional strategies.`,
      });
    }
  }

  // Compliance alerts
  if (kpis.compliance_flags_critical > 0) {
    insights.push({
      id: 'critical-compliance',
      type: 'warning',
      title: 'Critical Compliance Issues',
      description: `${kpis.compliance_flags_critical} critical compliance flag${kpis.compliance_flags_critical > 1 ? 's require' : ' requires'} immediate attention.`,
    });
  } else if (kpis.compliance_flags_open === 0) {
    insights.push({
      id: 'compliance-clear',
      type: 'success',
      title: 'Full Compliance Status',
      description: 'No open compliance flags. Your operation is running smoothly!',
    });
  }

  // Inventory health
  if (kpis.inventory_health_pct < 70) {
    insights.push({
      id: 'inventory-concerns',
      type: 'warning',
      title: 'Inventory Needs Attention',
      description: `${kpis.low_stock_count} item${kpis.low_stock_count > 1 ? 's are' : ' is'} running low. Review reorder points to prevent stockouts.`,
    });
  } else if (kpis.inventory_health_pct >= 90) {
    insights.push({
      id: 'healthy-inventory',
      type: 'success',
      title: 'Optimal Inventory Levels',
      description: 'Inventory is well-stocked across all categories. Great supply chain management!',
    });
  }

  // Customer insights
  if (kpis.customers_repeat_pct > 60) {
    insights.push({
      id: 'high-retention',
      type: 'success',
      title: 'Strong Customer Retention',
      description: `${kpis.customers_repeat_pct.toFixed(0)}% repeat customer rate indicates excellent customer satisfaction and loyalty.`,
    });
  }

  // Transaction insights
  if (kpis.transactions_today > 0 && kpis.avg_transaction_value > 0) {
    if (kpis.avg_transaction_value > 75) {
      insights.push({
        id: 'high-ticket-sales',
        type: 'info',
        title: 'High Average Ticket',
        description: `$${kpis.avg_transaction_value.toFixed(2)} average transaction shows effective upselling and product recommendations.`,
      });
    }
  }

  // Staff performance
  if (kpis.staff_count > 0) {
    const salesPerStaff = kpis.revenue_today / kpis.staff_count;
    if (salesPerStaff > 500) {
      insights.push({
        id: 'productive-team',
        type: 'success',
        title: 'Highly Productive Team',
        description: `$${salesPerStaff.toFixed(0)} revenue per staff member today. Your team is performing exceptionally!`,
      });
    }
  }

  return insights;
}

/**
 * Generate time-based business insights
 */
export function generateTimeBasedBusinessInsights(): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();

  // Time of day insights
  if (hour >= 16 && hour <= 19) {
    insights.push({
      id: 'peak-hours',
      type: 'info',
      title: 'Peak Hours Active',
      description: 'Evening rush is typically the busiest time. Ensure all stations are staffed and stocked.',
    });
  } else if (hour >= 10 && hour <= 12) {
    insights.push({
      id: 'morning-prep',
      type: 'info',
      title: 'Morning Operations',
      description: 'Good time for inventory counts and restocking before afternoon traffic increases.',
    });
  }

  // Weekend insights
  if (dayOfWeek === 5) {
    insights.push({
      id: 'friday-boost',
      type: 'info',
      title: 'Weekend Rush Incoming',
      description: 'Fridays typically see 20-30% higher traffic. Ensure popular items are fully stocked.',
    });
  } else if (dayOfWeek === 6 || dayOfWeek === 0) {
    insights.push({
      id: 'weekend-operations',
      type: 'info',
      title: 'Weekend Peak Activity',
      description: 'Weekend sales often drive weekly performance. Monitor stock levels closely.',
    });
  }

  // Month-end insights
  if (dayOfMonth >= 28) {
    insights.push({
      id: 'month-end',
      type: 'info',
      title: 'Month-End Approaching',
      description: 'Time to review monthly goals, prepare reports, and plan for next month\'s inventory.',
    });
  }

  // Beginning of month
  if (dayOfMonth <= 3) {
    insights.push({
      id: 'new-month',
      type: 'info',
      title: 'Fresh Month Ahead',
      description: 'Review last month\'s performance data to optimize strategies for this month.',
    });
  }

  return insights;
}

/**
 * Generate operational health insights
 */
export function generateOperationalInsights(kpis: DashboardKPIs): Insight[] {
  const insights: Insight[] = [];

  // Items needing retest
  if (kpis.items_needing_retest > 0) {
    insights.push({
      id: 'lab-testing-needed',
      type: 'warning',
      title: 'Lab Testing Required',
      description: `${kpis.items_needing_retest} batch${kpis.items_needing_retest > 1 ? 'es need' : ' needs'} retesting. Schedule lab appointments to maintain compliance.`,
    });
  }

  // Low stock warnings
  if (kpis.low_stock_count > 5) {
    insights.push({
      id: 'reorder-needed',
      type: 'warning',
      title: 'Multiple Items Need Reordering',
      description: `${kpis.low_stock_count} products below reorder threshold. Review purchasing queue.`,
    });
  }

  // Business health score
  const healthFactors = [
    kpis.inventory_health_pct >= 80 ? 1 : 0,
    kpis.compliance_flags_critical === 0 ? 1 : 0,
    kpis.customers_repeat_pct >= 50 ? 1 : 0,
    kpis.revenue_today > 0 ? 1 : 0,
  ];
  const healthScore = (healthFactors.reduce((a, b) => a + b, 0) / healthFactors.length) * 100;

  if (healthScore >= 75) {
    insights.push({
      id: 'strong-operations',
      type: 'success',
      title: 'Strong Operational Health',
      description: 'All key business metrics are performing well. Operations are running smoothly.',
    });
  } else if (healthScore < 50) {
    insights.push({
      id: 'operational-review',
      type: 'warning',
      title: 'Operational Review Needed',
      description: 'Multiple metrics need attention. Consider a comprehensive operational review.',
    });
  }

  return insights;
}

/**
 * Generate card-specific insights for dashboard stat cards
 */
export function generateDashboardCardInsights(kpis: DashboardKPIs) {
  const insights = {
    revenueToday: '',
    transactionsToday: '',
    avgTicket: '',
    inventoryHealth: '',
    revenueMTD: '',
    newCustomers: '',
    repeatRate: '',
    staffCount: '',
  };

  // Revenue Today insight
  if (kpis.revenue_today > 0 && kpis.revenue_mtd > 0) {
    const dailyAvg = kpis.revenue_mtd / new Date().getDate();
    const performanceRatio = kpis.revenue_today / dailyAvg;

    if (performanceRatio > 1.2) {
      insights.revenueToday = `${((performanceRatio - 1) * 100).toFixed(0)}% above monthly average. Exceptional performance!`;
    } else if (performanceRatio > 1.0) {
      insights.revenueToday = `${((performanceRatio - 1) * 100).toFixed(0)}% above monthly average. Strong sales day.`;
    } else if (performanceRatio > 0.8) {
      insights.revenueToday = `${((1 - performanceRatio) * 100).toFixed(0)}% below average. Normal daily variation.`;
    } else {
      insights.revenueToday = `${((1 - performanceRatio) * 100).toFixed(0)}% below average. Consider promotional strategies.`;
    }
  } else if (kpis.revenue_today > 0) {
    insights.revenueToday = 'Strong start to the month. Keep momentum going!';
  }

  // Transactions Today insight
  if (kpis.transactions_today > 0) {
    if (kpis.transactions_today > 100) {
      insights.transactionsToday = 'High traffic day with excellent customer flow and engagement.';
    } else if (kpis.transactions_today > 50) {
      insights.transactionsToday = 'Healthy transaction volume. Steady customer activity throughout the day.';
    } else if (kpis.transactions_today > 20) {
      insights.transactionsToday = 'Moderate traffic. Focus on customer experience and upselling.';
    } else {
      insights.transactionsToday = 'Lower transaction count. Review staffing and promotional opportunities.';
    }
  } else {
    insights.transactionsToday = 'No transactions yet. Day is just beginning!';
  }

  // Average Ticket insight
  if (kpis.avg_transaction_value > 0) {
    if (kpis.avg_transaction_value > 100) {
      insights.avgTicket = 'Premium ticket average. Excellent upselling and product recommendations.';
    } else if (kpis.avg_transaction_value > 75) {
      insights.avgTicket = 'Strong average ticket. Customers are purchasing multiple items.';
    } else if (kpis.avg_transaction_value > 50) {
      insights.avgTicket = 'Healthy ticket average. Consider bundling strategies to increase.';
    } else {
      insights.avgTicket = 'Opportunity to increase through product recommendations and bundles.';
    }
  }

  // Inventory Health insight
  if (kpis.inventory_health_pct >= 90) {
    insights.inventoryHealth = 'Optimal inventory levels across all categories. Excellent supply chain!';
  } else if (kpis.inventory_health_pct >= 75) {
    insights.inventoryHealth = `Healthy inventory status. ${kpis.low_stock_count || 0} items need attention.`;
  } else if (kpis.inventory_health_pct >= 60) {
    insights.inventoryHealth = `${kpis.low_stock_count || 0} items low. Review reorder points to prevent stockouts.`;
  } else {
    insights.inventoryHealth = `Critical: ${kpis.low_stock_count || 0} items need immediate reordering.`;
  }

  // Revenue MTD insight
  if (kpis.revenue_mtd > 0) {
    const dayOfMonth = new Date().getDate();
    const projectedMonthlyRevenue = (kpis.revenue_mtd / dayOfMonth) * 30;

    if (projectedMonthlyRevenue > 100000) {
      insights.revenueMTD = `Projected $${(projectedMonthlyRevenue / 1000).toFixed(0)}k monthly revenue. Outstanding trajectory!`;
    } else if (projectedMonthlyRevenue > 75000) {
      insights.revenueMTD = `On track for $${(projectedMonthlyRevenue / 1000).toFixed(0)}k monthly. Strong performance.`;
    } else if (projectedMonthlyRevenue > 50000) {
      insights.revenueMTD = `Trending toward $${(projectedMonthlyRevenue / 1000).toFixed(0)}k monthly. Steady growth.`;
    } else {
      insights.revenueMTD = 'Building monthly momentum. Focus on conversion and retention.';
    }
  }

  // New Customers insight
  if (kpis.customers_new_today > 0) {
    if (kpis.customers_new_today > 20) {
      insights.newCustomers = 'Exceptional new customer acquisition. Marketing is working!';
    } else if (kpis.customers_new_today > 10) {
      insights.newCustomers = 'Strong new customer growth. Ensure excellent first impressions.';
    } else if (kpis.customers_new_today > 5) {
      insights.newCustomers = 'Steady new customer acquisition. Focus on onboarding experience.';
    } else {
      insights.newCustomers = 'Focus on retention and word-of-mouth referrals from existing customers.';
    }
  } else {
    insights.newCustomers = 'No new customers yet today. Review marketing and outreach strategies.';
  }

  // Repeat Customer Rate insight
  if (kpis.customers_repeat_pct > 0) {
    if (kpis.customers_repeat_pct > 70) {
      insights.repeatRate = 'Exceptional loyalty! Strong customer satisfaction and retention.';
    } else if (kpis.customers_repeat_pct > 60) {
      insights.repeatRate = 'Excellent retention rate. Customers love coming back!';
    } else if (kpis.customers_repeat_pct > 50) {
      insights.repeatRate = 'Healthy repeat rate. Consider loyalty programs to increase.';
    } else if (kpis.customers_repeat_pct > 40) {
      insights.repeatRate = 'Moderate retention. Focus on customer experience improvements.';
    } else {
      insights.repeatRate = 'Opportunity to improve retention through loyalty programs and service.';
    }
  }

  // Staff Count insight
  if (kpis.staff_count > 0 && kpis.revenue_today > 0) {
    const revenuePerStaff = kpis.revenue_today / kpis.staff_count;
    if (revenuePerStaff > 1000) {
      insights.staffCount = `$${revenuePerStaff.toFixed(0)} per staff member today. Exceptional productivity!`;
    } else if (revenuePerStaff > 500) {
      insights.staffCount = `$${revenuePerStaff.toFixed(0)} per staff member. Strong team performance.`;
    } else if (revenuePerStaff > 250) {
      insights.staffCount = `$${revenuePerStaff.toFixed(0)} per staff member. Healthy productivity levels.`;
    } else {
      insights.staffCount = `${kpis.staff_count} team members. Review scheduling and productivity.`;
    }
  } else if (kpis.staff_count > 0) {
    insights.staffCount = `${kpis.staff_count} active team members. Ready to serve customers!`;
  }

  return insights;
}
