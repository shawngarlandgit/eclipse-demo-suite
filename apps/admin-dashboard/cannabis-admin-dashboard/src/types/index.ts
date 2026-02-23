// Cannabis Admin Dashboard TypeScript Types
// Shared type definitions for the entire application

// ============================================================================
// User & Authentication Types
// ============================================================================

// Extended roles for unified platform
// Order matters for hierarchy: patient < budtender < staff < manager < owner < admin
export type UserRole = 'patient' | 'budtender' | 'staff' | 'manager' | 'owner' | 'admin';

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  patient: 0,
  budtender: 1,
  staff: 2,
  manager: 3,
  owner: 4,
  admin: 5,
};

// Permission definitions for granular access control
export type Permission =
  | 'view_dashboard'
  | 'view_inventory'
  | 'manage_inventory'
  | 'view_analytics'
  | 'view_reports'
  | 'manage_staff'
  | 'view_compliance'
  | 'manage_compliance'
  | 'view_integrations'
  | 'manage_integrations'
  | 'view_recommendations'
  | 'create_recommendations'
  | 'view_questionnaire'
  | 'manage_questionnaire'
  | 'view_strains'
  | 'manage_strains'
  | 'view_patients'
  | 'manage_patients'
  | 'view_own_profile'
  | 'view_own_recommendations';

// Default permissions by role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  patient: [
    'view_own_profile',
    'view_own_recommendations',
    'view_questionnaire',
    'view_strains',
  ],
  budtender: [
    'view_dashboard',
    'view_inventory',
    'view_recommendations',
    'create_recommendations',
    'view_questionnaire',
    'manage_questionnaire',
    'view_strains',
    'view_patients',
    'manage_patients',
    'view_own_profile',
  ],
  staff: [
    'view_dashboard',
    'view_inventory',
    'view_recommendations',
    'create_recommendations',
    'view_questionnaire',
    'manage_questionnaire',
    'view_strains',
    'view_patients',
    'manage_patients',
    'view_own_profile',
  ],
  manager: [
    'view_dashboard',
    'view_inventory',
    'manage_inventory',
    'view_analytics',
    'view_reports',
    'manage_staff',
    'view_compliance',
    'view_recommendations',
    'create_recommendations',
    'view_questionnaire',
    'manage_questionnaire',
    'view_strains',
    'manage_strains',
    'view_patients',
    'manage_patients',
    'view_own_profile',
  ],
  owner: [
    'view_dashboard',
    'view_inventory',
    'manage_inventory',
    'view_analytics',
    'view_reports',
    'manage_staff',
    'view_compliance',
    'manage_compliance',
    'view_integrations',
    'manage_integrations',
    'view_recommendations',
    'create_recommendations',
    'view_questionnaire',
    'manage_questionnaire',
    'view_strains',
    'manage_strains',
    'view_patients',
    'manage_patients',
    'view_own_profile',
  ],
  admin: [
    'view_dashboard',
    'view_inventory',
    'manage_inventory',
    'view_analytics',
    'view_reports',
    'manage_staff',
    'view_compliance',
    'manage_compliance',
    'view_integrations',
    'manage_integrations',
    'view_recommendations',
    'create_recommendations',
    'view_questionnaire',
    'manage_questionnaire',
    'view_strains',
    'manage_strains',
    'view_patients',
    'manage_patients',
    'view_own_profile',
  ],
};

// Effect types for recommendations (matches database enum)
export type EffectType =
  | 'relaxation'
  | 'pain_relief'
  | 'anxiety_relief'
  | 'energy'
  | 'focus'
  | 'creativity'
  | 'appetite'
  | 'sleep';

// THC tolerance levels
export type THCTolerance = 'low' | 'medium' | 'high' | 'very_high';

export interface User {
  id: string;
  dispensary_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  permissions?: Record<string, boolean>; // Custom permissions override
  // Patient-specific fields (optional)
  patient_number?: string | null;
  is_medical_patient?: boolean;
  medical_card_expiration?: string | null;
  preferred_effects?: EffectType[];
  thc_tolerance?: THCTolerance | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================================================
// Dispensary Types
// ============================================================================

export type DispensaryType = 'medical' | 'recreational' | 'caregiver';

export interface Dispensary {
  id: string;
  name: string;
  type: DispensaryType;
  license_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  metrc_facility_id: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Product & Inventory Types
// ============================================================================

export type ProductType =
  | 'flower'
  | 'edible'
  | 'extract'
  | 'pre-roll'
  | 'tincture'
  | 'topical'
  | 'vape'
  | 'other';

export interface Product {
  id: string;
  dispensary_id: string;
  name: string;
  product_type: ProductType;
  strain_name: string | null;
  thc_pct: number | null;
  cbd_pct: number | null;
  vendor: string | null;
  price: number;
  cost: number | null;
  quantity_on_hand: number;
  reorder_level: number;
  image_url: string | null;
  metrc_id: string | null;
  test_date: string | null;
  test_passed: boolean | null;
  batch_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventorySnapshot {
  id: string;
  dispensary_id: string;
  product_id: string;
  quantity_on_hand: number;
  quantity_sold: number;
  quantity_received: number;
  quantity_waste: number;
  snapshot_date: string;
  source: 'system' | 'manual_count' | 'metrc_sync';
  created_at: string;
}

export interface InventoryFilters {
  search?: string;
  product_type?: ProductType;
  status?: 'all' | 'low_stock' | 'needs_test' | 'healthy';
  vendor?: string;
  min_thc?: number;
  max_thc?: number;
}

// ============================================================================
// Transaction Types
// ============================================================================

export type PaymentMethod = 'cash' | 'card' | 'other';

export interface TransactionItem {
  product_id: string;
  quantity: number;
  price: number;
  product?: Product; // Populated via join
}

export interface Transaction {
  id: string;
  dispensary_id: string;
  staff_user_id: string | null;
  transaction_date: string;
  customer_id: string | null;
  customer_hash: string | null;
  products: TransactionItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod | null;
  metrc_id: string | null;
  is_synced_to_metrc: boolean;
  created_at: string;
}

// ============================================================================
// Customer Types
// ============================================================================

export type CustomerType = 'medical' | 'recreational';

export interface Customer {
  id: string;
  dispensary_id: string;
  customer_hash: string;
  customer_type: CustomerType | null;
  total_spent: number;
  transaction_count: number;
  last_purchase: string | null;
  preferences: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export type CustomerSegment =
  | 'champions'
  | 'loyal'
  | 'potential_loyalist'
  | 'at_risk'
  | 'hibernating'
  | 'new';

export interface CustomerCohort {
  segment: CustomerSegment;
  count: number;
  total_spent: number;
  avg_ltv: number;
}

// ============================================================================
// Compliance Types
// ============================================================================

export type ComplianceFlagType =
  | 'testing_incomplete'
  | 'inventory_variance'
  | 'waste_threshold'
  | 'low_stock'
  | 'metrc_sync_failed'
  | 'missing_batch'
  | 'other';

export type ComplianceSeverity = 'critical' | 'warning' | 'info';

export interface ComplianceFlag {
  id: string;
  dispensary_id: string;
  flag_type: ComplianceFlagType;
  severity: ComplianceSeverity;
  description: string;
  flagged_date: string;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

// ============================================================================
// Audit Log Types
// ============================================================================

export type AuditAction = 'view' | 'edit' | 'delete' | 'export' | 'login' | 'create';

export interface AuditLog {
  id: string;
  user_id: string | null;
  dispensary_id: string | null;
  action: AuditAction;
  table_affected: string | null;
  record_id: string | null;
  changes: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  } | null;
  ip_address: string | null;
  timestamp: string;
}

// ============================================================================
// Integration Types
// ============================================================================

export type IntegrationVendor =
  | 'metrc'
  | 'dutchie'
  | 'flowhub'
  | 'treez'
  | 'jane'
  | 'square'
  | 'clover';

export type IntegrationStatus = 'success' | 'failed' | 'pending';

export interface ApiIntegration {
  id: string;
  dispensary_id: string;
  vendor: IntegrationVendor;
  api_key_encrypted: string;
  vendor_account_id: string | null;
  sync_enabled: boolean;
  last_sync: string | null;
  sync_status: IntegrationStatus | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Report Types
// ============================================================================

export type ReportType = 'audit' | 'compliance' | 'sales' | 'inventory' | 'tax';

export interface Report {
  id: string;
  dispensary_id: string;
  report_type: ReportType;
  generated_by: string;
  date_range_start: string | null;
  date_range_end: string | null;
  file_url: string | null;
  created_at: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface DashboardKPIs {
  revenue_today: number;
  revenue_mtd: number;
  revenue_ytd: number;
  transactions_today: number;
  transactions_mtd: number;
  avg_transaction_value: number;
  customers_new_today: number;
  customers_repeat_pct: number;
  inventory_health_pct: number;
  low_stock_count: number;
  items_needing_retest: number;
  compliance_flags_open: number;
  compliance_flags_critical: number;
  staff_count: number;
  last_updated: string;
}

export interface SalesTrend {
  date: string;
  sales: number;
  transactions: number;
  avg_ticket: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  product_type: ProductType;
  rank: number;
  revenue: number;
  units_sold: number;
  margin: number;
}

export interface StaffPerformance {
  user_id: string;
  full_name: string;
  role: UserRole;
  sales: number;
  transaction_count: number;
  avg_transaction_value: number;
  recommendation_count: number;
  recommendation_conversion_rate: number;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface DateRange {
  from: string;
  to: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  timestamp: string;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// ============================================================================
// Real-time Types
// ============================================================================

export interface RealtimePayload<T = any> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  errors: any[] | null;
}

export interface SyncStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  lastSyncTime: string | null;
  metrc_status: IntegrationStatus | null;
  pos_status: IntegrationStatus | null;
}

// ============================================================================
// Form Types
// ============================================================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface InventoryAdjustmentFormData {
  product_id: string;
  quantity_delta: number;
  reason: string;
  notes?: string;
}

export interface UserCreateFormData {
  email: string;
  full_name: string;
  role: UserRole;
  password: string;
}

export interface ProductCreateFormData {
  name: string;
  product_type: ProductType;
  strain_name?: string;
  thc_pct?: number;
  cbd_pct?: number;
  vendor?: string;
  price: number;
  cost?: number;
  quantity_on_hand: number;
  reorder_level: number;
  image_url?: string;
  batch_id?: string;
}
