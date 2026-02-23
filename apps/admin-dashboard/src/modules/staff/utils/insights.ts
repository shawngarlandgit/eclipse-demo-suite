import type { StaffPerformanceMetrics, StaffSummary } from '../types';

/**
 * Staff Insights Generator
 * Generates smart, contextual insights based on staff performance data
 */

export interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'neutral';
  title: string;
  description: string;
  icon?: string;
}

/**
 * Generate insights from staff summary data
 */
export function generateStaffSummaryInsights(summary: StaffSummary): Insight[] {
  const insights: Insight[] = [];

  // Top performer insight
  if (summary.top_performer && summary.avg_sales_per_staff > 0) {
    const topPerformerMultiple = summary.top_performer.sales / summary.avg_sales_per_staff;

    if (topPerformerMultiple > 1.5) {
      insights.push({
        id: 'top-performer',
        type: 'success',
        title: `${summary.top_performer.full_name} Leading the Pack`,
        description: `Top performer generated ${(topPerformerMultiple * 100 - 100).toFixed(0)}% more sales than team average. Consider recognition or training opportunities.`,
      });
    }
  }

  // Staff activity insight
  const activityRate = (summary.active_today / summary.total_staff) * 100;
  if (activityRate < 70) {
    insights.push({
      id: 'low-activity',
      type: 'warning',
      title: 'Below Optimal Staffing',
      description: `Only ${activityRate.toFixed(0)}% of staff active today. Consider adjusting schedules to improve coverage.`,
    });
  } else if (activityRate > 85) {
    insights.push({
      id: 'high-activity',
      type: 'success',
      title: 'Excellent Staff Coverage',
      description: `${activityRate.toFixed(0)}% of staff are active today. Great team participation!`,
    });
  }

  // Average sales per staff insight
  const avgSalesPerStaff = summary.avg_sales_per_staff;
  if (avgSalesPerStaff > 5000) {
    insights.push({
      id: 'high-productivity',
      type: 'success',
      title: 'Strong Individual Performance',
      description: `Staff averaging $${(avgSalesPerStaff / 1000).toFixed(1)}k in sales. Team is performing exceptionally well.`,
    });
  }

  return insights;
}

/**
 * Generate insights from staff performance metrics
 */
export function generateStaffPerformanceInsights(staff: StaffPerformanceMetrics[]): Insight[] {
  const insights: Insight[] = [];

  if (staff.length === 0) return insights;

  // AI recommendation insights
  const avgConversionRate = staff.reduce((sum, s) => sum + s.recommendation_conversion_rate, 0) / staff.length;
  const highPerformers = staff.filter(s => s.recommendation_conversion_rate > 0.6);

  if (avgConversionRate > 0.5) {
    insights.push({
      id: 'ai-success',
      type: 'success',
      title: 'AI Recommendations Driving Sales',
      description: `${(avgConversionRate * 100).toFixed(0)}% average conversion rate on AI recommendations. The system is working!`,
    });
  } else if (avgConversionRate < 0.3) {
    insights.push({
      id: 'ai-improvement',
      type: 'warning',
      title: 'AI Recommendation Performance Low',
      description: `Only ${(avgConversionRate * 100).toFixed(0)}% conversion on AI recs. Consider staff training on recommendation techniques.`,
    });
  }

  // High performers with AI recs
  if (highPerformers.length > 0) {
    insights.push({
      id: 'ai-champions',
      type: 'info',
      title: 'AI Recommendation Champions',
      description: `${highPerformers.length} staff members achieving 60%+ conversion on AI recommendations. Share their techniques!`,
    });
  }

  // Sales trend insights
  const staffWithGrowth = staff.filter(s => s.sales_change_pct > 10).length;
  const growthRate = (staffWithGrowth / staff.length) * 100;

  if (growthRate > 50) {
    insights.push({
      id: 'team-growth',
      type: 'success',
      title: 'Team-Wide Sales Growth',
      description: `${growthRate.toFixed(0)}% of staff showing 10%+ sales growth. Team momentum is building!`,
    });
  }

  const staffWithDecline = staff.filter(s => s.sales_change_pct < -15).length;
  if (staffWithDecline > 0) {
    insights.push({
      id: 'performance-concern',
      type: 'warning',
      title: 'Performance Support Needed',
      description: `${staffWithDecline} team member${staffWithDecline > 1 ? 's' : ''} experiencing significant sales decline. Consider coaching opportunities.`,
    });
  }

  // Efficiency insights
  const topEfficiency = staff.sort((a, b) => b.sales_per_hour - a.sales_per_hour)[0];
  if (topEfficiency && topEfficiency.sales_per_hour > 200) {
    insights.push({
      id: 'efficiency-leader',
      type: 'info',
      title: 'Peak Efficiency Achieved',
      description: `${topEfficiency.full_name} averaging $${topEfficiency.sales_per_hour.toFixed(0)}/hour. Outstanding productivity!`,
    });
  }

  return insights;
}

/**
 * Generate time-based insights for staff scheduling
 */
export function generateStaffTimeInsights(): Insight[] {
  const insights: Insight[] = [];
  const hour = new Date().getHours();
  const day = new Date().getDay();

  // Peak hours staffing
  if (hour >= 15 && hour <= 18) {
    insights.push({
      id: 'peak-staffing',
      type: 'info',
      title: 'Peak Hours Active',
      description: 'Evening rush (3-6 PM) requires full team coverage. Ensure all top performers are scheduled.',
    });
  }

  // Weekend preparation
  if (day === 4 || day === 5) {
    insights.push({
      id: 'weekend-staffing',
      type: 'info',
      title: 'Weekend Preparation',
      description: 'Schedule your highest-converting staff for weekend shifts when AI recommendations see 25% better performance.',
    });
  }

  // Monday motivation
  if (day === 1 && hour < 12) {
    insights.push({
      id: 'monday-start',
      type: 'info',
      title: 'Start Strong This Week',
      description: 'Mondays set the tone. Brief team on weekly goals and highlight top performers from last week.',
    });
  }

  return insights;
}
