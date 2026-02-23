import type { ResponsiveLayouts, DashboardStyle } from '../stores/settingsStore';

/**
 * Grid Configuration
 */
export const GRID_BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
};

export const GRID_COLS = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2,
};

export const GRID_ROW_HEIGHT = 100;

/**
 * Simple 1: "The Big Three"
 * 3 large gradient cards - Revenue, Sales, Best Seller
 */
const SIMPLE_1_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: 'revenue-card', x: 0, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
    { i: 'sales-card', x: 4, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
    { i: 'bestseller-card', x: 8, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
  ],
  md: [
    { i: 'revenue-card', x: 0, y: 0, w: 5, h: 3, minW: 3, minH: 2 },
    { i: 'sales-card', x: 5, y: 0, w: 5, h: 3, minW: 3, minH: 2 },
    { i: 'bestseller-card', x: 0, y: 3, w: 10, h: 3, minW: 4, minH: 2 },
  ],
  sm: [
    { i: 'revenue-card', x: 0, y: 0, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'sales-card', x: 0, y: 3, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'bestseller-card', x: 0, y: 6, w: 6, h: 3, minW: 3, minH: 2 },
  ],
  xs: [
    { i: 'revenue-card', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
    { i: 'sales-card', x: 0, y: 3, w: 4, h: 3, minW: 2, minH: 2 },
    { i: 'bestseller-card', x: 0, y: 6, w: 4, h: 3, minW: 2, minH: 2 },
  ],
  xxs: [
    { i: 'revenue-card', x: 0, y: 0, w: 2, h: 3, minW: 2, minH: 2 },
    { i: 'sales-card', x: 0, y: 3, w: 2, h: 3, minW: 2, minH: 2 },
    { i: 'bestseller-card', x: 0, y: 6, w: 2, h: 3, minW: 2, minH: 2 },
  ],
};

/**
 * Simple 2: "Health Check"
 * 4 status cards - Sales, Inventory, Customers, Compliance
 */
const SIMPLE_2_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: 'sales-status', x: 0, y: 0, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'inventory-status', x: 6, y: 0, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'customer-status', x: 0, y: 3, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'compliance-status', x: 6, y: 3, w: 6, h: 3, minW: 4, minH: 2 },
  ],
  md: [
    { i: 'sales-status', x: 0, y: 0, w: 5, h: 3, minW: 3, minH: 2 },
    { i: 'inventory-status', x: 5, y: 0, w: 5, h: 3, minW: 3, minH: 2 },
    { i: 'customer-status', x: 0, y: 3, w: 5, h: 3, minW: 3, minH: 2 },
    { i: 'compliance-status', x: 5, y: 3, w: 5, h: 3, minW: 3, minH: 2 },
  ],
  sm: [
    { i: 'sales-status', x: 0, y: 0, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'inventory-status', x: 0, y: 3, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'customer-status', x: 0, y: 6, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'compliance-status', x: 0, y: 9, w: 6, h: 3, minW: 3, minH: 2 },
  ],
  xs: [
    { i: 'sales-status', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
    { i: 'inventory-status', x: 0, y: 3, w: 4, h: 3, minW: 2, minH: 2 },
    { i: 'customer-status', x: 0, y: 6, w: 4, h: 3, minW: 2, minH: 2 },
    { i: 'compliance-status', x: 0, y: 9, w: 4, h: 3, minW: 2, minH: 2 },
  ],
  xxs: [
    { i: 'sales-status', x: 0, y: 0, w: 2, h: 3, minW: 2, minH: 2 },
    { i: 'inventory-status', x: 0, y: 3, w: 2, h: 3, minW: 2, minH: 2 },
    { i: 'customer-status', x: 0, y: 6, w: 2, h: 3, minW: 2, minH: 2 },
    { i: 'compliance-status', x: 0, y: 9, w: 2, h: 3, minW: 2, minH: 2 },
  ],
};

/**
 * Simple 3: "Cash Register"
 * Register display + Products list + Stock alerts
 */
const SIMPLE_3_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: 'register-display', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
    { i: 'whats-selling', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'stock-alerts', x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
  ],
  md: [
    { i: 'register-display', x: 0, y: 0, w: 10, h: 2, minW: 6, minH: 2 },
    { i: 'whats-selling', x: 0, y: 2, w: 5, h: 4, minW: 4, minH: 3 },
    { i: 'stock-alerts', x: 5, y: 2, w: 5, h: 4, minW: 4, minH: 3 },
  ],
  sm: [
    { i: 'register-display', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    { i: 'whats-selling', x: 0, y: 2, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'stock-alerts', x: 0, y: 6, w: 6, h: 4, minW: 3, minH: 3 },
  ],
  xs: [
    { i: 'register-display', x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
    { i: 'whats-selling', x: 0, y: 2, w: 4, h: 4, minW: 2, minH: 3 },
    { i: 'stock-alerts', x: 0, y: 6, w: 4, h: 4, minW: 2, minH: 3 },
  ],
  xxs: [
    { i: 'register-display', x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
    { i: 'whats-selling', x: 0, y: 2, w: 2, h: 4, minW: 2, minH: 3 },
    { i: 'stock-alerts', x: 0, y: 6, w: 2, h: 4, minW: 2, minH: 3 },
  ],
};

/**
 * Simple 4: "Owner's Summary"
 * Narrative sections - Revenue, Sellers, Customers, Staff, Alerts
 */
const SIMPLE_4_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: 'revenue-summary', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
    { i: 'bestsellers-summary', x: 0, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
    { i: 'customers-summary', x: 6, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
    { i: 'staff-spotlight', x: 0, y: 4, w: 6, h: 2, minW: 4, minH: 2 },
    { i: 'alerts-summary', x: 6, y: 4, w: 6, h: 2, minW: 4, minH: 2 },
  ],
  md: [
    { i: 'revenue-summary', x: 0, y: 0, w: 10, h: 2, minW: 5, minH: 2 },
    { i: 'bestsellers-summary', x: 0, y: 2, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'customers-summary', x: 5, y: 2, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'staff-spotlight', x: 0, y: 4, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'alerts-summary', x: 5, y: 4, w: 5, h: 2, minW: 3, minH: 2 },
  ],
  sm: [
    { i: 'revenue-summary', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    { i: 'bestsellers-summary', x: 0, y: 2, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'customers-summary', x: 0, y: 4, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'staff-spotlight', x: 0, y: 6, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'alerts-summary', x: 0, y: 8, w: 6, h: 2, minW: 3, minH: 2 },
  ],
  xs: [
    { i: 'revenue-summary', x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
    { i: 'bestsellers-summary', x: 0, y: 2, w: 4, h: 2, minW: 2, minH: 2 },
    { i: 'customers-summary', x: 0, y: 4, w: 4, h: 2, minW: 2, minH: 2 },
    { i: 'staff-spotlight', x: 0, y: 6, w: 4, h: 2, minW: 2, minH: 2 },
    { i: 'alerts-summary', x: 0, y: 8, w: 4, h: 2, minW: 2, minH: 2 },
  ],
  xxs: [
    { i: 'revenue-summary', x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
    { i: 'bestsellers-summary', x: 0, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
    { i: 'customers-summary', x: 0, y: 4, w: 2, h: 2, minW: 2, minH: 2 },
    { i: 'staff-spotlight', x: 0, y: 6, w: 2, h: 2, minW: 2, minH: 2 },
    { i: 'alerts-summary', x: 0, y: 8, w: 2, h: 2, minW: 2, minH: 2 },
  ],
};

/**
 * Option 1: "Metric Strips"
 * Horizontal metric strips + Staff table + Charts
 */
const OPTION_1_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: 'revenue-strip', x: 0, y: 0, w: 12, h: 1, minW: 6, minH: 1 },
    { i: 'customer-strip', x: 0, y: 1, w: 12, h: 1, minW: 6, minH: 1 },
    { i: 'inventory-strip', x: 0, y: 2, w: 12, h: 1, minW: 6, minH: 1 },
    { i: 'charts-section', x: 0, y: 3, w: 8, h: 4, minW: 6, minH: 4 },
    { i: 'staff-compact', x: 8, y: 3, w: 4, h: 4, minW: 3, minH: 3 },
  ],
  md: [
    { i: 'revenue-strip', x: 0, y: 0, w: 10, h: 1, minW: 5, minH: 1 },
    { i: 'customer-strip', x: 0, y: 1, w: 10, h: 1, minW: 5, minH: 1 },
    { i: 'inventory-strip', x: 0, y: 2, w: 10, h: 1, minW: 5, minH: 1 },
    { i: 'charts-section', x: 0, y: 3, w: 6, h: 4, minW: 4, minH: 4 },
    { i: 'staff-compact', x: 6, y: 3, w: 4, h: 4, minW: 3, minH: 3 },
  ],
  sm: [
    { i: 'revenue-strip', x: 0, y: 0, w: 6, h: 1, minW: 4, minH: 1 },
    { i: 'customer-strip', x: 0, y: 1, w: 6, h: 1, minW: 4, minH: 1 },
    { i: 'inventory-strip', x: 0, y: 2, w: 6, h: 1, minW: 4, minH: 1 },
    { i: 'staff-compact', x: 0, y: 3, w: 6, h: 3, minW: 3, minH: 3 },
    { i: 'charts-section', x: 0, y: 6, w: 6, h: 4, minW: 4, minH: 4 },
  ],
  xs: [
    { i: 'revenue-strip', x: 0, y: 0, w: 4, h: 1, minW: 2, minH: 1 },
    { i: 'customer-strip', x: 0, y: 1, w: 4, h: 1, minW: 2, minH: 1 },
    { i: 'inventory-strip', x: 0, y: 2, w: 4, h: 1, minW: 2, minH: 1 },
    { i: 'staff-compact', x: 0, y: 3, w: 4, h: 3, minW: 2, minH: 3 },
    { i: 'charts-section', x: 0, y: 6, w: 4, h: 4, minW: 2, minH: 4 },
  ],
  xxs: [
    { i: 'revenue-strip', x: 0, y: 0, w: 2, h: 1, minW: 2, minH: 1 },
    { i: 'customer-strip', x: 0, y: 1, w: 2, h: 1, minW: 2, minH: 1 },
    { i: 'inventory-strip', x: 0, y: 2, w: 2, h: 1, minW: 2, minH: 1 },
    { i: 'staff-compact', x: 0, y: 3, w: 2, h: 3, minW: 2, minH: 3 },
    { i: 'charts-section', x: 0, y: 6, w: 2, h: 4, minW: 2, minH: 4 },
  ],
};

/**
 * Option 2: "Data Tables"
 * Main metrics table + AI Insights + Products table + Staff table
 */
const OPTION_2_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: 'metrics-table', x: 0, y: 0, w: 12, h: 4, minW: 8, minH: 3 },
    { i: 'ai-insights', x: 0, y: 4, w: 12, h: 4, minW: 6, minH: 3 },
    { i: 'products-table', x: 0, y: 8, w: 12, h: 7, minW: 8, minH: 5 },
    { i: 'staff-table', x: 0, y: 15, w: 12, h: 5, minW: 6, minH: 4 },
  ],
  md: [
    { i: 'metrics-table', x: 0, y: 0, w: 10, h: 5, minW: 6, minH: 4 },
    { i: 'ai-insights', x: 0, y: 5, w: 10, h: 4, minW: 5, minH: 3 },
    { i: 'products-table', x: 0, y: 9, w: 10, h: 7, minW: 6, minH: 5 },
    { i: 'staff-table', x: 0, y: 16, w: 10, h: 5, minW: 5, minH: 4 },
  ],
  sm: [
    { i: 'metrics-table', x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 5 },
    { i: 'ai-insights', x: 0, y: 6, w: 6, h: 5, minW: 4, minH: 3 },
    { i: 'products-table', x: 0, y: 11, w: 6, h: 8, minW: 4, minH: 5 },
    { i: 'staff-table', x: 0, y: 19, w: 6, h: 5, minW: 3, minH: 4 },
  ],
  xs: [
    { i: 'metrics-table', x: 0, y: 0, w: 4, h: 8, minW: 2, minH: 6 },
    { i: 'ai-insights', x: 0, y: 8, w: 4, h: 6, minW: 2, minH: 4 },
    { i: 'products-table', x: 0, y: 14, w: 4, h: 8, minW: 2, minH: 5 },
    { i: 'staff-table', x: 0, y: 22, w: 4, h: 5, minW: 2, minH: 4 },
  ],
  xxs: [
    { i: 'metrics-table', x: 0, y: 0, w: 2, h: 10, minW: 2, minH: 8 },
    { i: 'ai-insights', x: 0, y: 10, w: 2, h: 8, minW: 2, minH: 4 },
    { i: 'products-table', x: 0, y: 18, w: 2, h: 8, minW: 2, minH: 5 },
    { i: 'staff-table', x: 0, y: 26, w: 2, h: 5, minW: 2, minH: 4 },
  ],
};

/**
 * Option 4: "Sidebar Layout"
 * Sidebar metrics + Main chart + Lists section
 */
const OPTION_4_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: 'sidebar-metrics', x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 4 },
    { i: 'main-chart', x: 3, y: 0, w: 9, h: 4, minW: 6, minH: 4 },
    { i: 'lists-section', x: 3, y: 4, w: 9, h: 4, minW: 6, minH: 3 },
  ],
  md: [
    { i: 'sidebar-metrics', x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 4 },
    { i: 'main-chart', x: 3, y: 0, w: 7, h: 4, minW: 5, minH: 4 },
    { i: 'lists-section', x: 3, y: 4, w: 7, h: 4, minW: 5, minH: 3 },
  ],
  sm: [
    { i: 'sidebar-metrics', x: 0, y: 0, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'main-chart', x: 0, y: 3, w: 6, h: 4, minW: 4, minH: 4 },
    { i: 'lists-section', x: 0, y: 7, w: 6, h: 4, minW: 4, minH: 3 },
  ],
  xs: [
    { i: 'sidebar-metrics', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
    { i: 'main-chart', x: 0, y: 3, w: 4, h: 4, minW: 2, minH: 4 },
    { i: 'lists-section', x: 0, y: 7, w: 4, h: 4, minW: 2, minH: 3 },
  ],
  xxs: [
    { i: 'sidebar-metrics', x: 0, y: 0, w: 2, h: 3, minW: 2, minH: 2 },
    { i: 'main-chart', x: 0, y: 3, w: 2, h: 4, minW: 2, minH: 4 },
    { i: 'lists-section', x: 0, y: 7, w: 2, h: 4, minW: 2, minH: 3 },
  ],
};

/**
 * Option 5: "Tabbed Panels"
 * Summary bar + Tab panels
 */
const OPTION_5_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: 'summary-bar', x: 0, y: 0, w: 12, h: 1, minW: 8, minH: 1 },
    { i: 'tab-panels', x: 0, y: 1, w: 12, h: 5, minW: 8, minH: 4 },
  ],
  md: [
    { i: 'summary-bar', x: 0, y: 0, w: 10, h: 1, minW: 6, minH: 1 },
    { i: 'tab-panels', x: 0, y: 1, w: 10, h: 5, minW: 6, minH: 4 },
  ],
  sm: [
    { i: 'summary-bar', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 1 },
    { i: 'tab-panels', x: 0, y: 2, w: 6, h: 5, minW: 4, minH: 4 },
  ],
  xs: [
    { i: 'summary-bar', x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 1 },
    { i: 'tab-panels', x: 0, y: 2, w: 4, h: 5, minW: 2, minH: 4 },
  ],
  xxs: [
    { i: 'summary-bar', x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 1 },
    { i: 'tab-panels', x: 0, y: 2, w: 2, h: 5, minW: 2, minH: 4 },
  ],
};

/**
 * All default layouts by dashboard style
 */
export const DEFAULT_LAYOUTS: Record<DashboardStyle, ResponsiveLayouts> = {
  'simple-1': SIMPLE_1_LAYOUTS,
  'simple-2': SIMPLE_2_LAYOUTS,
  'simple-3': SIMPLE_3_LAYOUTS,
  'simple-4': SIMPLE_4_LAYOUTS,
  'option-1': OPTION_1_LAYOUTS,
  'option-2': OPTION_2_LAYOUTS,
  'option-4': OPTION_4_LAYOUTS,
  'option-5': OPTION_5_LAYOUTS,
};

/**
 * Get default layouts for a specific dashboard style
 */
export function getDefaultLayouts(style: DashboardStyle): ResponsiveLayouts {
  return DEFAULT_LAYOUTS[style];
}

/**
 * Widget metadata for display purposes
 */
export interface WidgetMeta {
  id: string;
  name: string;
  description: string;
}

export const WIDGET_METADATA: Record<string, WidgetMeta> = {
  // Simple 1 widgets
  'revenue-card': { id: 'revenue-card', name: "Today's Revenue", description: 'Total revenue for today' },
  'sales-card': { id: 'sales-card', name: 'Sales Count', description: 'Transaction count and average' },
  'bestseller-card': { id: 'bestseller-card', name: 'Best Seller', description: 'Top selling product today' },

  // Simple 2 widgets
  'sales-status': { id: 'sales-status', name: 'Sales Status', description: 'Sales health indicator' },
  'inventory-status': { id: 'inventory-status', name: 'Inventory Status', description: 'Stock health indicator' },
  'customer-status': { id: 'customer-status', name: 'Customer Status', description: 'Customer metrics health' },
  'compliance-status': { id: 'compliance-status', name: 'Compliance Status', description: 'Compliance health indicator' },

  // Simple 3 widgets
  'register-display': { id: 'register-display', name: 'Register Display', description: 'Cash register style revenue' },
  'whats-selling': { id: 'whats-selling', name: "What's Selling", description: 'Top products list' },
  'stock-alerts': { id: 'stock-alerts', name: 'Stock Alerts', description: 'Low stock warnings' },

  // Simple 4 widgets
  'revenue-summary': { id: 'revenue-summary', name: 'Revenue Summary', description: 'Revenue narrative' },
  'bestsellers-summary': { id: 'bestsellers-summary', name: 'Best Sellers', description: 'Top products narrative' },
  'customers-summary': { id: 'customers-summary', name: 'Customer Insights', description: 'Customer narrative' },
  'staff-spotlight': { id: 'staff-spotlight', name: 'Staff Spotlight', description: 'Top performer highlight' },
  'alerts-summary': { id: 'alerts-summary', name: 'Alerts', description: 'Issues and alerts' },

  // Option 1 widgets
  'revenue-strip': { id: 'revenue-strip', name: 'Revenue Metrics', description: 'Revenue and sales strip' },
  'customer-strip': { id: 'customer-strip', name: 'Customer Metrics', description: 'Customer statistics strip' },
  'inventory-strip': { id: 'inventory-strip', name: 'Inventory Metrics', description: 'Inventory and compliance strip' },
  'staff-compact': { id: 'staff-compact', name: 'Staff Performance', description: 'Compact staff table' },
  'charts-section': { id: 'charts-section', name: 'Charts', description: 'Revenue chart and products' },

  // Option 2 widgets
  'metrics-table': { id: 'metrics-table', name: 'Metrics Table', description: 'Main KPI table with sparklines' },
  'products-table': { id: 'products-table', name: 'Products Table', description: 'Top products with trends' },
  'staff-table': { id: 'staff-table', name: 'Staff Table', description: 'Staff performance table' },
  'ai-insights': { id: 'ai-insights', name: 'AI Insights', description: 'AI-powered business insights' },

  // Option 4 widgets
  'sidebar-metrics': { id: 'sidebar-metrics', name: 'Sidebar Metrics', description: 'Key metrics sidebar' },
  'main-chart': { id: 'main-chart', name: 'Revenue Chart', description: 'Main revenue chart' },
  'lists-section': { id: 'lists-section', name: 'Lists', description: 'Products and staff lists' },

  // Option 5 widgets
  'summary-bar': { id: 'summary-bar', name: 'Summary Bar', description: 'Compact stats row' },
  'tab-panels': { id: 'tab-panels', name: 'Tab Panels', description: 'Tabbed content panels' },
};
