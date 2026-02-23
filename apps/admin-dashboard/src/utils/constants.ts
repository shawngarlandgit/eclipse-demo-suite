// Cannabis Admin Dashboard Constants
// Application-wide constant values

import type { UserRole, ComplianceFlagType, ComplianceSeverity } from '../types';

// ============================================================================
// Application Configuration
// ============================================================================

export const APP_NAME = 'Cannabis Admin Dashboard';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Owner/Operator control panel for cannabis dispensary management';

// ============================================================================
// Role Permissions
// ============================================================================

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  patient: [],
  budtender: ['view:dashboard', 'view:products'],
  staff: ['view:dashboard', 'view:inventory', 'view:products'],
  manager: [
    'view:dashboard',
    'view:inventory',
    'view:products',
    'edit:inventory',
    'view:analytics',
    'view:staff',
    'view:compliance',
  ],
  owner: [
    'view:dashboard',
    'view:inventory',
    'view:products',
    'edit:inventory',
    'view:analytics',
    'view:staff',
    'view:compliance',
    'view:configuration',
    'edit:configuration',
    'manage:users',
    'view:reports',
    'generate:reports',
  ],
  admin: ['*'], // All permissions
};

export const ROLE_LABELS: Record<UserRole, string> = {
  patient: 'Patient',
  budtender: 'Budtender',
  staff: 'Staff',
  manager: 'Manager',
  owner: 'Owner',
  admin: 'Administrator',
};

// ============================================================================
// Product Types
// ============================================================================

// Product types for filter dropdown (value/label pairs)
export const PRODUCT_TYPES: { value: string; label: string }[] = [
  // Cannabis Products
  { value: 'flower', label: 'Flower' },
  { value: 'pre_roll', label: 'Pre-Roll' },
  { value: 'concentrate', label: 'Concentrate' },
  { value: 'edible', label: 'Edible' },
  { value: 'vape', label: 'Vape' },
  { value: 'tincture', label: 'Tincture' },
  { value: 'topical', label: 'Topical' },
  { value: 'cannabis', label: 'Cannabis (Other)' },
  // Glass & Pipes
  { value: 'glass_pipe', label: 'Glass Pipe' },
  { value: 'water_pipe', label: 'Water Pipe' },
  { value: 'hookah', label: 'Hookah' },
  { value: 'nectar_collector', label: 'Nectar Collector' },
  // Smoking Accessories
  { value: 'papers_wraps', label: 'Papers & Wraps' },
  { value: 'grinder', label: 'Grinder' },
  { value: 'rolling_tray', label: 'Rolling Tray' },
  { value: 'dab_tool', label: 'Dab Tool' },
  { value: 'smoking_accessory', label: 'Smoking Accessory' },
  { value: 'lighter', label: 'Lighter' },
  { value: 'storage', label: 'Storage' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'scale', label: 'Scale' },
  // Vaporizers
  { value: 'electronic_vape', label: 'Electronic Vape' },
  { value: 'vaporizer', label: 'Vaporizer' },
  { value: 'vape_battery', label: 'Vape Battery' },
  { value: 'disposable_vape', label: 'Disposable Vape' },
  // Other
  { value: 'cbd', label: 'CBD' },
  { value: 'kratom', label: 'Kratom' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
];

// Legacy type arrays for backwards compatibility
export const PRODUCT_TYPE_VALUES = PRODUCT_TYPES.map(t => t.value);

export const PRODUCT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PRODUCT_TYPES.map(t => [t.value, t.label])
);

export const PRODUCT_TYPE_ICONS: Record<string, string> = {
  flower: '🌿',
  pre_roll: '🚬',
  concentrate: '💎',
  edible: '🍫',
  vape: '💨',
  tincture: '🧪',
  topical: '🧴',
  cannabis: '🌱',
  glass_pipe: '🪈',
  water_pipe: '🫧',
  hookah: '💨',
  nectar_collector: '🍯',
  papers_wraps: '📜',
  grinder: '⚙️',
  rolling_tray: '🗃️',
  dab_tool: '🔧',
  smoking_accessory: '🔥',
  lighter: '🔥',
  storage: '📦',
  cleaning: '🧹',
  scale: '⚖️',
  electronic_vape: '🔌',
  vaporizer: '💨',
  vape_battery: '🔋',
  disposable_vape: '💨',
  cbd: '💚',
  kratom: '🌿',
  accessory: '🛒',
  miscellaneous: '📦',
};

// ============================================================================
// Compliance
// ============================================================================

export const COMPLIANCE_FLAG_TYPES: ComplianceFlagType[] = [
  'testing_incomplete',
  'inventory_variance',
  'waste_threshold',
  'low_stock',
  'metrc_sync_failed',
  'missing_batch',
  'other',
];

export const COMPLIANCE_FLAG_TYPE_LABELS: Record<ComplianceFlagType, string> = {
  testing_incomplete: 'Testing Incomplete',
  inventory_variance: 'Inventory Variance',
  waste_threshold: 'Waste Threshold Exceeded',
  low_stock: 'Low Stock',
  metrc_sync_failed: 'Metrc Sync Failed',
  missing_batch: 'Missing Batch ID',
  other: 'Other',
};

export const COMPLIANCE_SEVERITY_LABELS: Record<ComplianceSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
};

export const COMPLIANCE_SEVERITY_COLORS: Record<ComplianceSeverity, string> = {
  critical: 'red',
  warning: 'yellow',
  info: 'blue',
};

// ============================================================================
// Date Ranges
// ============================================================================

export const DATE_RANGE_PRESETS = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7days: 'Last 7 Days',
  last30days: 'Last 30 Days',
  last90days: 'Last 90 Days',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  thisYear: 'This Year',
  custom: 'Custom Range',
} as const;

// ============================================================================
// Chart Configuration
// ============================================================================

export const CHART_COLORS = {
  primary: '#22c55e', // cannabis-500
  secondary: '#8b5cf6', // violet-500
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  neutral: '#64748b',
};

export const CHART_GRADIENT_COLORS = {
  revenue: ['#22c55e', '#16a34a'],
  transactions: ['#8b5cf6', '#7c3aed'],
  customers: ['#3b82f6', '#2563eb'],
  inventory: ['#f59e0b', '#d97706'],
};

// ============================================================================
// Pagination
// ============================================================================

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ============================================================================
// Inventory Thresholds
// ============================================================================

export const LOW_STOCK_THRESHOLD = 10; // Default reorder level
export const CRITICAL_STOCK_THRESHOLD = 5;
export const HEALTHY_STOCK_MINIMUM = 20;

// ============================================================================
// Cache & Refresh Intervals
// ============================================================================

export const CACHE_TIMES = {
  short: 30_000, // 30 seconds
  medium: 60_000, // 1 minute
  long: 5 * 60_000, // 5 minutes
  veryLong: 15 * 60_000, // 15 minutes
};

export const REFETCH_INTERVALS = {
  dashboard: 60_000, // 1 minute
  inventory: 30_000, // 30 seconds
  analytics: 5 * 60_000, // 5 minutes
  compliance: 60_000, // 1 minute
};

// ============================================================================
// Real-time Subscription Batch Times
// ============================================================================

export const REALTIME_BATCH_TIMES = {
  inventory: 500, // 500ms
  transactions: 1000, // 1 second
  compliance: 0, // Immediate
};

// ============================================================================
// File Upload
// ============================================================================

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/csv'];

// ============================================================================
// Local Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  auth: 'cannabis_admin_auth',
  theme: 'cannabis_admin_theme',
  filters: 'cannabis_admin_filters',
  preferences: 'cannabis_admin_preferences',
  recentViews: 'cannabis_admin_recent_views',
};

// ============================================================================
// Routes
// ============================================================================

export const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  inventory: {
    base: '/inventory',
    detail: (id: string) => `/inventory/${id}`,
    adjust: (id: string) => `/inventory/${id}/adjust`,
  },
  analytics: {
    base: '/analytics',
    sales: '/analytics/sales',
    customers: '/analytics/customers',
  },
  staff: {
    base: '/staff',
    detail: (id: string) => `/staff/${id}`,
  },
  compliance: {
    base: '/compliance',
    reports: '/compliance/reports',
    audit: '/compliance/audit',
  },
  configuration: {
    base: '/configuration',
    integrations: '/configuration/integrations',
    users: '/configuration/users',
    dispensary: '/configuration/dispensary',
  },
} as const;

// ============================================================================
// API Endpoints (if using custom backend)
// ============================================================================

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
  },
  dashboard: {
    summary: '/dashboard/summary',
    kpis: '/dashboard/kpis',
    salesTrend: '/dashboard/sales-trend',
  },
  inventory: {
    list: '/inventory',
    detail: (id: string) => `/inventory/${id}`,
    adjust: (id: string) => `/inventory/${id}/adjust`,
  },
  analytics: {
    sales: '/analytics/sales',
    customers: '/analytics/customers',
    products: '/analytics/products',
  },
} as const;

// ============================================================================
// Notification Configuration
// ============================================================================

export const NOTIFICATION_DURATION = {
  short: 3000,
  medium: 5000,
  long: 7000,
  persistent: 0, // Don't auto-dismiss
};

// ============================================================================
// Integration Vendors
// ============================================================================

export const INTEGRATION_VENDORS = {
  metrc: 'Metrc',
  dutchie: 'Dutchie',
  flowhub: 'Flowhub',
  treez: 'Treez',
  jane: 'Jane',
  square: 'Square',
  clover: 'Clover',
} as const;

// ============================================================================
// Customer Segments
// ============================================================================

export const CUSTOMER_SEGMENT_LABELS = {
  champions: 'Champions',
  loyal: 'Loyal Customers',
  potential_loyalist: 'Potential Loyalists',
  at_risk: 'At Risk',
  hibernating: 'Hibernating',
  new: 'New Customers',
} as const;

export const CUSTOMER_SEGMENT_COLORS = {
  champions: '#22c55e',
  loyal: '#3b82f6',
  potential_loyalist: '#8b5cf6',
  at_risk: '#f59e0b',
  hibernating: '#ef4444',
  new: '#64748b',
} as const;

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  generic: 'An unexpected error occurred. Please try again.',
  network: 'Network error. Please check your internet connection.',
  unauthorized: 'You are not authorized to perform this action.',
  sessionExpired: 'Your session has expired. Please log in again.',
  notFound: 'The requested resource was not found.',
  validation: 'Please check your input and try again.',
} as const;

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  login: 'Successfully logged in!',
  logout: 'Successfully logged out.',
  save: 'Changes saved successfully.',
  delete: 'Item deleted successfully.',
  create: 'Item created successfully.',
  update: 'Item updated successfully.',
} as const;
