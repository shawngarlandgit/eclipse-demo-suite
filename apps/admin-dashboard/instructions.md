# Cannabis Admin Dashboard - Agent Strategy Guide

## Project Overview
Building an owner/operator admin dashboard for cannabis dispensary management, complementing the Budtender-MVP POS application. Both share the same Supabase backend with real-time sync.

## Agent Assignment Strategy

### Phase 1: Architecture & Planning
**Agent: feature-architect**
- Analyze the full requirements and create implementation roadmap
- Plan how modules integrate with each other and Budtender-MVP
- Design component hierarchy and data flow patterns
- Identify shared components and reusable patterns
- Plan database schema integration strategy

**Agent: api-architect**
- Design Supabase database schema (tables, indexes, RLS policies)
- Plan Supabase Edge Functions for serverless logic
- Design API service layer architecture
- Plan real-time subscription patterns
- Define authentication and authorization flow

### Phase 2: Foundation & Core Infrastructure
**Direct Implementation** (No agent needed for straightforward setup):
- Initialize Vite + React + TypeScript project
- Install dependencies (Tailwind, Chakra UI, Supabase client, etc.)
- Configure build tools and environment variables

**Agent: api-architect**
- Implement Supabase client configuration
- Create service layer (auth, dashboard, inventory, analytics, compliance)
- Set up RLS policies
- Implement real-time subscription hooks

### Phase 3: Styling System
**Direct Implementation**:
- Configure Tailwind CSS with cannabis theme tokens
- Set up Chakra UI theme overrides
- Create base layout components (Navbar, Sidebar)
- Build common components (LoadingSpinner, ErrorBoundary, ConfirmModal)

**Agent: ui-ux-validator** (Post-implementation review):
- Validate design consistency with Budtender-MVP
- Review accessibility compliance
- Ensure responsive design patterns
- Validate dark mode implementation

### Phase 4: Module Development

#### Module 1: Dashboard Landing (Real-Time KPIs)
**Agent: feature-architect**
- Plan dashboard layout and widget positioning
- Design KPI card component hierarchy
- Plan real-time data subscription strategy

**Direct Implementation**:
- Build StatCard, RevenueChart, ComplianceAlertBanner
- Implement InventoryHealthCard, StaffLeaderboard
- Create SyncStatusWidget
- Wire up real-time subscriptions

#### Module 2: Inventory Management & Compliance
**Agent: api-architect**
- Design inventory table query optimization
- Plan batch tracking data flow
- Design compliance flag resolution workflow

**Direct Implementation**:
- Build InventoryTable with filtering/sorting
- Create ProductDetailModal, LowStockAlert
- Implement InventoryAdjustmentForm
- Build BatchTracker and ComplianceFlagsPanel

#### Module 3: Sales & Customer Analytics
**Agent: feature-architect**
- Plan analytics data aggregation strategy
- Design chart component architecture
- Plan customer cohort segmentation logic

**Direct Implementation**:
- Build DailySalesChart, TopProductsChart
- Create CustomerCohortCard, LifetimeValueChart
- Implement TrendAnalysisChart
- Build export functionality

#### Module 4: Staff Performance & Recommendations
**Agent: api-architect**
- Design staff metrics calculation queries
- Plan recommendation attribution tracking
- Design activity log retrieval patterns

**Direct Implementation**:
- Build StaffLeaderboard component
- Create RecommendationMetricsChart
- Implement ActivityLogTable, ShiftPerformanceCard

#### Module 5: Compliance & Audit Reporting
**Agent: api-architect**
- Design PDF report generation Edge Function
- Plan Metrc reconciliation logic
- Design audit log query patterns

**Direct Implementation**:
- Build ReportGeneratorModal
- Create AuditLogViewer, MetrcReconciliationView
- Implement TaxExportButton
- Build ComplianceFlagTimeline

#### Module 6: Configuration & Integrations
**Agent: api-architect**
- Design integration authentication flow
- Plan webhook configuration storage
- Design user management CRUD operations

**Direct Implementation**:
- Build IntegrationsPage
- Create MetrcAuthForm, POSIntegrationModal
- Implement UserManagementPage
- Build BackupStatusWidget

### Phase 5: State Management
**Agent: feature-architect**
- Review Zustand store architecture
- Plan store separation and data flow
- Design cross-store communication patterns

**Direct Implementation**:
- Create authStore, dashboardStore
- Build inventoryStore, analyticsStore
- Implement notificationStore

### Phase 6: Quality Assurance & Optimization

**Agent: debugger**
- Investigate any errors or unexpected behavior
- Debug failing tests or broken features
- Fix integration issues

**Agent: code-refactoring-specialist**
- Refactor any files exceeding 500 lines
- Extract reusable components from large files
- Modularize complex logic

**Agent: ui-ux-validator**
- Comprehensive UI/UX audit
- Accessibility compliance check
- Responsive design validation
- Dark mode consistency review

**Agent: senior-architect**
- Overall code quality review
- Performance optimization recommendations
- Security audit
- Architectural pattern validation

**Agent: mvp-validator**
- Determine launch readiness
- Identify critical vs nice-to-have features
- Assess technical debt vs shipping timeline

### Phase 7: Documentation & Deployment
**Direct Implementation**:
- Create comprehensive README
- Document environment setup
- Add inline code documentation
- Create deployment guide

## Agent Usage Principles

### When to Use Agents
1. **Complex Planning**: Use feature-architect or api-architect for multi-step architectural decisions
2. **System Design**: Use senior-architect for holistic reviews and optimization
3. **Debugging**: Use debugger when encountering errors or unexpected behavior
4. **Large Files**: Use code-refactoring-specialist when files exceed 500 lines
5. **UX Validation**: Use ui-ux-validator for design reviews and accessibility audits
6. **Launch Decisions**: Use mvp-validator for feature prioritization and readiness assessment

### When NOT to Use Agents
1. **Straightforward Implementation**: Building components with clear specs
2. **Configuration**: Setting up tools, installing packages
3. **Simple CRUD Operations**: Basic create/read/update/delete logic
4. **Styling**: Applying Tailwind classes or Chakra props
5. **Single File Tasks**: Reading, editing, or writing individual files

## Current Phase
**Phase 1: Architecture & Planning**

### Next Steps
1. Use **feature-architect** to analyze requirements and create detailed implementation plan
2. Use **api-architect** to design complete Supabase schema and Edge Functions
3. Proceed with foundation implementation based on agent recommendations

## Success Criteria
- Clean separation of concerns (components, services, stores, hooks)
- Type-safe implementation (TypeScript throughout)
- Real-time sync working across Budtender-MVP and Admin Dashboard
- Production-ready error handling and loading states
- Comprehensive RLS policies protecting multi-tenant data
- Audit-ready compliance reporting
- <3 second page load times
- Zero PII logged or exposed
