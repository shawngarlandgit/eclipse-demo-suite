import type { AnalyticsSummary, CategoryBreakdown } from '../types';

/**
 * Analytics Insights Generator
 * Generates smart, contextual insights based on analytics data
 */

export interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'neutral';
  title: string;
  description: string;
  icon?: string;
}

/**
 * Generate insights from analytics summary
 */
export function generateSummaryInsights(summary: AnalyticsSummary): Insight[] {
  const insights: Insight[] = [];

  // Revenue insights
  if (summary.revenue.change_pct > 15) {
    insights.push({
      id: 'revenue-surge',
      type: 'success',
      title: 'Strong Revenue Growth',
      description: `Revenue is up ${summary.revenue.change_pct.toFixed(1)}% compared to the previous period. Keep up the momentum!`,
    });
  } else if (summary.revenue.change_pct < -10) {
    insights.push({
      id: 'revenue-decline',
      type: 'warning',
      title: 'Revenue Decline',
      description: `Revenue decreased by ${Math.abs(summary.revenue.change_pct).toFixed(1)}%. Consider promotional strategies to boost sales.`,
    });
  }

  // Transaction value insights
  if (summary.transactions.avg_value_change_pct > 10) {
    insights.push({
      id: 'avg-value-up',
      type: 'success',
      title: 'Higher Ticket Sales',
      description: `Average transaction value increased by ${summary.transactions.avg_value_change_pct.toFixed(1)}%. Customers are buying more per visit.`,
    });
  }

  // Customer insights
  const newCustomerRate = (summary.customers.new / summary.customers.total) * 100;
  if (newCustomerRate > 40) {
    insights.push({
      id: 'new-customers',
      type: 'info',
      title: 'Strong Customer Acquisition',
      description: `${newCustomerRate.toFixed(0)}% of customers are new. Focus on retention strategies to convert them into regulars.`,
    });
  }

  if (summary.customers.retention_rate > 75) {
    insights.push({
      id: 'high-retention',
      type: 'success',
      title: 'Excellent Retention',
      description: `${summary.customers.retention_rate.toFixed(0)}% customer retention rate. Your loyalty programs are working!`,
    });
  }

  return insights;
}

/**
 * Generate insights from category breakdown
 */
export function generateCategoryInsights(categories: CategoryBreakdown[]): Insight[] {
  const insights: Insight[] = [];

  if (categories.length === 0) return insights;

  const topCategory = categories[0];
  const secondCategory = categories[1];

  // Dominant category insight
  if (topCategory.percentage > 35) {
    insights.push({
      id: 'dominant-category',
      type: 'info',
      title: `${formatCategoryName(topCategory.category)} Dominates Sales`,
      description: `${topCategory.percentage.toFixed(0)}% of revenue comes from ${formatCategoryName(topCategory.category).toLowerCase()}. Consider diversifying product offerings.`,
    });
  }

  // Balanced portfolio
  if (topCategory.percentage < 25 && secondCategory?.percentage > 20) {
    insights.push({
      id: 'balanced-mix',
      type: 'success',
      title: 'Well-Balanced Product Mix',
      description: 'Revenue is evenly distributed across categories, reducing dependency on any single product type.',
    });
  }

  return insights;
}

/**
 * Generate time-based insights
 */
export function generateTimeInsights(): Insight[] {
  const insights: Insight[] = [];
  const hour = new Date().getHours();
  const day = new Date().getDay();

  // Time of day insights
  if (hour >= 16 && hour <= 19) {
    insights.push({
      id: 'peak-hours',
      type: 'info',
      title: 'Peak Hours Approaching',
      description: 'Evening rush (4-7 PM) typically sees 30% higher transaction volume. Ensure adequate staffing.',
    });
  }

  // Weekend insights
  if (day === 5) {
    insights.push({
      id: 'weekend-prep',
      type: 'info',
      title: 'Weekend Traffic Expected',
      description: 'Fridays and Saturdays see 40% more foot traffic. Stock up on popular items.',
    });
  }

  return insights;
}

/**
 * Helper to format category names
 */
function formatCategoryName(category: string): string {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
