import type { InventorySummary, ComplianceAlert } from '../types';

/**
 * Inventory Insights Generator
 * Generates smart, contextual insights based on inventory data
 */

export interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'neutral';
  title: string;
  description: string;
  icon?: string;
}

/**
 * Generate insights from inventory summary
 */
export function generateInventorySummaryInsights(summary: InventorySummary): Insight[] {
  const insights: Insight[] = [];

  // Critical stock alerts
  if (summary.critical_stock_count > 0) {
    insights.push({
      id: 'critical-stock',
      type: 'warning',
      title: 'Out of Stock Items',
      description: `${summary.critical_stock_count} product${summary.critical_stock_count > 1 ? 's are' : ' is'} completely out of stock. Immediate reordering required.`,
    });
  }

  // Low stock warnings
  if (summary.low_stock_count > 0) {
    insights.push({
      id: 'low-stock',
      type: 'warning',
      title: 'Low Stock Alert',
      description: `${summary.low_stock_count} product${summary.low_stock_count > 1 ? 's' : ''} running low. Review and reorder before stockouts occur.`,
    });
  }

  // Inventory health
  if (summary.critical_stock_count === 0 && summary.low_stock_count === 0) {
    insights.push({
      id: 'healthy-inventory',
      type: 'success',
      title: 'Healthy Inventory Levels',
      description: 'All products are adequately stocked. Great inventory management!',
    });
  }

  // Inventory value insights
  if (summary.total_inventory_value > 0) {
    const profit = summary.total_inventory_value - summary.total_cost_value;
    const margin = (profit / summary.total_inventory_value) * 100;

    if (margin > 40) {
      insights.push({
        id: 'high-margin',
        type: 'success',
        title: 'Strong Profit Margins',
        description: `${margin.toFixed(0)}% profit margin on current inventory. Excellent pricing strategy!`,
      });
    }
  }

  return insights;
}

/**
 * Generate insights from compliance alerts
 */
export function generateComplianceInsights(alerts: ComplianceAlert[]): Insight[] {
  const insights: Insight[] = [];

  if (alerts.length === 0) {
    return insights;
  }

  // Expiring batches
  const expiringAlerts = alerts.filter(a => a.type === 'expiring_soon');
  if (expiringAlerts.length > 0) {
    insights.push({
      id: 'expiring-batches',
      type: 'warning',
      title: 'Batches Expiring Soon',
      description: `${expiringAlerts.length} batch${expiringAlerts.length > 1 ? 'es' : ''} expiring within 30 days. Review for markdown or disposal.`,
    });
  }

  // Expired batches
  const expiredAlerts = alerts.filter(a => a.type === 'expired');
  if (expiredAlerts.length > 0) {
    insights.push({
      id: 'expired-batches',
      type: 'warning',
      title: 'Expired Batches Detected',
      description: `${expiredAlerts.length} batch${expiredAlerts.length > 1 ? 'es have' : ' has'} expired. Quarantine immediately to maintain compliance.`,
    });
  }

  // Retest needed
  const retestAlerts = alerts.filter(a => a.type === 'needs_retest');
  if (retestAlerts.length > 0) {
    insights.push({
      id: 'needs-retest',
      type: 'info',
      title: 'Lab Retesting Required',
      description: `${retestAlerts.length} batch${retestAlerts.length > 1 ? 'es need' : ' needs'} retesting. Schedule lab appointments to maintain compliance.`,
    });
  }

  return insights;
}

/**
 * Generate general inventory insights
 */
export function generateInventoryInsights(summary: InventorySummary): Insight[] {
  const insights: Insight[] = [];

  // Active products ratio
  const activeRatio = summary.total_products > 0
    ? (summary.active_products / summary.total_products) * 100
    : 0;

  if (activeRatio < 70) {
    insights.push({
      id: 'inactive-products',
      type: 'info',
      title: 'High Inactive Product Count',
      description: `${(100 - activeRatio).toFixed(0)}% of products are inactive. Consider archiving or reactivating these items.`,
    });
  }

  // Batch management
  if (summary.quarantined_count > 0) {
    insights.push({
      id: 'quarantined-batches',
      type: 'warning',
      title: 'Quarantined Inventory',
      description: `${summary.quarantined_count} batch${summary.quarantined_count > 1 ? 'es are' : ' is'} quarantined. Review and resolve to recover inventory value.`,
    });
  }

  // Inventory efficiency
  const avgValuePerProduct = summary.total_products > 0
    ? summary.total_inventory_value / summary.active_products
    : 0;

  if (avgValuePerProduct > 500) {
    insights.push({
      id: 'high-value-inventory',
      type: 'info',
      title: 'High-Value Inventory',
      description: `Average product value of $${avgValuePerProduct.toFixed(0)}. Ensure proper security measures are in place.`,
    });
  }

  return insights;
}

/**
 * Generate time-based inventory insights
 */
export function generateTimeBasedInsights(): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();

  // Weekend preparation
  if (dayOfWeek === 4 || dayOfWeek === 5) {
    insights.push({
      id: 'weekend-prep',
      type: 'info',
      title: 'Weekend Inventory Check',
      description: 'Weekend approaching - ensure high-demand products are fully stocked for increased traffic.',
    });
  }

  // Month-end inventory
  if (dayOfMonth >= 25) {
    insights.push({
      id: 'month-end-count',
      type: 'info',
      title: 'Month-End Approaching',
      description: 'Schedule physical inventory count for month-end reconciliation and reporting.',
    });
  }

  // First week of month
  if (dayOfMonth <= 7) {
    insights.push({
      id: 'fresh-stock',
      type: 'info',
      title: 'New Month Restocking',
      description: 'Review previous month\'s sales data to optimize purchasing for this month.',
    });
  }

  return insights;
}

/**
 * Generate card-specific insights for inventory stat cards
 */
export function generateInventoryCardInsights(summary: InventorySummary) {
  const insights = {
    totalValue: '',
    lowStock: '',
    expiring: '',
    retest: '',
  };

  // Total Inventory Value insight
  if (summary.total_inventory_value > 0) {
    const profit = summary.total_inventory_value - summary.total_cost_value;
    const margin = (profit / summary.total_inventory_value) * 100;

    if (margin > 45) {
      insights.totalValue = `Strong ${margin.toFixed(0)}% profit margin across all inventory. Excellent pricing strategy.`;
    } else if (margin > 30) {
      insights.totalValue = `Healthy ${margin.toFixed(0)}% profit margin. Consider premium pricing on high-demand items.`;
    } else if (margin > 15) {
      insights.totalValue = `Moderate ${margin.toFixed(0)}% margin. Review cost structure and pricing opportunities.`;
    } else {
      insights.totalValue = `Low ${margin.toFixed(0)}% margin detected. Immediate pricing review recommended.`;
    }
  }

  // Low Stock Items insight
  if (summary.low_stock_count > 0) {
    const lowStockPct = (summary.low_stock_count / summary.total_products) * 100;
    if (lowStockPct > 20) {
      insights.lowStock = `${lowStockPct.toFixed(0)}% of products low. High risk of stockouts - immediate reorder needed.`;
    } else if (lowStockPct > 10) {
      insights.lowStock = `${lowStockPct.toFixed(0)}% of inventory running low. Schedule reorders to prevent disruption.`;
    } else {
      insights.lowStock = `${summary.low_stock_count} items need attention. Review and reorder before critical levels.`;
    }
  } else if (summary.critical_stock_count > 0) {
    insights.lowStock = `${summary.critical_stock_count} items out of stock. Immediate reordering required.`;
  } else {
    insights.lowStock = 'All products adequately stocked. Great inventory management!';
  }

  // Batches Expiring Soon insight
  if (summary.expiring_soon_count > 0) {
    if (summary.expiring_soon_count > 10) {
      insights.expiring = `${summary.expiring_soon_count} batches expiring soon. Consider markdowns to move inventory quickly.`;
    } else if (summary.expiring_soon_count > 5) {
      insights.expiring = `${summary.expiring_soon_count} batches expiring within 30 days. Review for promotional pricing.`;
    } else {
      insights.expiring = `${summary.expiring_soon_count} batch${summary.expiring_soon_count === 1 ? '' : 'es'} expiring soon. Monitor closely to prevent waste.`;
    }
  } else {
    insights.expiring = 'No batches expiring soon. Strong batch rotation and turnover.';
  }

  // Needs Retesting insight
  if (summary.needs_retest_count > 0) {
    if (summary.needs_retest_count > 10) {
      insights.retest = `${summary.needs_retest_count} batches require retesting. Schedule lab appointments immediately.`;
    } else if (summary.needs_retest_count > 5) {
      insights.retest = `${summary.needs_retest_count} batches need retesting. Contact lab to maintain compliance timeline.`;
    } else {
      insights.retest = `${summary.needs_retest_count} batch${summary.needs_retest_count === 1 ? '' : 'es'} need${summary.needs_retest_count === 1 ? 's' : ''} retesting. Stay compliant with lab scheduling.`;
    }
  } else {
    insights.retest = 'All batches have current lab results. Excellent compliance management!';
  }

  return insights;
}
