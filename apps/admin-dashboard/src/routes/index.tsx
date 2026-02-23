import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleProtectedRoute from '../components/auth/RoleProtectedRoute';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Lazy load pages for code splitting
// Core Admin Pages
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const DashboardOption1 = lazy(() => import('../pages/DashboardOption1'));
const DashboardOption2 = lazy(() => import('../pages/DashboardOption2'));
const DashboardOption4 = lazy(() => import('../pages/DashboardOption4'));
const DashboardOption5 = lazy(() => import('../pages/DashboardOption5'));
const DashboardSimple1 = lazy(() => import('../pages/DashboardSimple1'));
const DashboardSimple2 = lazy(() => import('../pages/DashboardSimple2'));
const DashboardSimple3 = lazy(() => import('../pages/DashboardSimple3'));
const DashboardSimple4 = lazy(() => import('../pages/DashboardSimple4'));
const InventoryPage = lazy(() => import('../pages/InventoryPage'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const StaffPage = lazy(() => import('../pages/StaffPage'));
const CompliancePage = lazy(() => import('../pages/CompliancePage'));
const ComplianceAlertCenterPage = lazy(() => import('../pages/ComplianceAlertCenterPage'));
const ConfigurationPage = lazy(() => import('../pages/ConfigurationPage'));

// Budtender Pages
const RecommendationsPage = lazy(() => import('../pages/RecommendationsPage'));
const QuestionnairePage = lazy(() => import('../pages/QuestionnairePage'));
const PatientsPage = lazy(() => import('../pages/PatientsPage'));
const StrainsPage = lazy(() => import('../pages/StrainsPage'));
const DispatchPage = lazy(() => import('../pages/DispatchPage'));
const SecureCallsPage = lazy(() => import('../pages/SecureCallsPage'));

// Patient Pages
const PatientDashboardPage = lazy(() => import('../pages/patient/PatientDashboardPage'));
const PatientQuestionnairePage = lazy(() => import('../pages/patient/PatientQuestionnairePage'));
const PatientRecommendationsPage = lazy(() => import('../pages/patient/PatientRecommendationsPage'));
const PatientProfilePage = lazy(() => import('../pages/patient/PatientProfilePage'));

// Auth Pages
const LoginPage = lazy(() => import('../pages/LoginPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));

/**
 * App Routes Configuration
 * Handles all routing for the Cannabis Admin Dashboard
 *
 * Route Access Levels:
 * - Public: /login, /unauthorized
 * - Patient: /patient/* (questionnaire, recommendations, profile)
 * - Budtender+: /dashboard, /recommendations, /questionnaire, /patients, /strains
 * - Manager+: /inventory, /analytics, /staff
 * - Owner+: /compliance, /configuration
 * - Admin: All routes
 */
function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        {/* ============================================================ */}
        {/* Public Routes */}
        {/* ============================================================ */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ============================================================ */}
        {/* Patient Routes - Patient role and above */}
        {/* Separate layout for patient-facing interface */}
        {/* ============================================================ */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={['patient', 'budtender', 'staff', 'manager', 'owner', 'admin']}
                fallbackPath="/login"
              >
                <PatientDashboardPage />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/questionnaire"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={['patient', 'budtender', 'staff', 'manager', 'owner', 'admin']}
                fallbackPath="/login"
              >
                <PatientQuestionnairePage />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/recommendations"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={['patient', 'budtender', 'staff', 'manager', 'owner', 'admin']}
                fallbackPath="/login"
              >
                <PatientRecommendationsPage />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/profile"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={['patient', 'budtender', 'staff', 'manager', 'owner', 'admin']}
                fallbackPath="/login"
              >
                <PatientProfilePage />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />

        {/* ============================================================ */}
        {/* Staff/Admin Routes - Budtender role and above */}
        {/* Uses DashboardLayout for admin interface */}
        {/* ============================================================ */}
        <Route
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                minimumRole="budtender"
                fallbackPath="/patient"
                showAccessDenied={false}
              >
                <DashboardLayout />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        >
          {/* Root redirect based on role is handled by DashboardPage */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ------------------------------------------------------------ */}
          {/* Budtender+ Routes - Core operational features */}
          {/* ------------------------------------------------------------ */}
          <Route
            path="/dashboard"
            element={
              <RoleProtectedRoute minimumRole="budtender">
                <DashboardPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/dashboard-option-1"
            element={
              <RoleProtectedRoute minimumRole="budtender">
                <DashboardOption1 />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/dashboard-option-2"
            element={
              <RoleProtectedRoute minimumRole="budtender">
                <DashboardOption2 />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/dashboard-option-4"
            element={
              <RoleProtectedRoute minimumRole="budtender">
                <DashboardOption4 />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/dashboard-option-5"
            element={
              <RoleProtectedRoute minimumRole="budtender">
                <DashboardOption5 />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/dashboard-simple-1"
            element={
              <RoleProtectedRoute minimumRole="budtender">
                <DashboardSimple1 />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/dashboard-simple-2"
            element={
              <RoleProtectedRoute minimumRole="budtender">
                <DashboardSimple2 />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/dashboard-simple-3"
            element={
              <RoleProtectedRoute minimumRole="budtender">
                <DashboardSimple3 />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/dashboard-simple-4"
            element={
              <RoleProtectedRoute minimumRole="budtender">
                <DashboardSimple4 />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/recommendations"
            element={
              <RoleProtectedRoute
                minimumRole="budtender"
                requiredPermissions={['view_recommendations']}
              >
                <RecommendationsPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/questionnaire"
            element={
              <RoleProtectedRoute
                minimumRole="budtender"
                requiredPermissions={['view_questionnaire']}
              >
                <QuestionnairePage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <RoleProtectedRoute
                minimumRole="budtender"
                requiredPermissions={['view_patients']}
              >
                <PatientsPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/strains"
            element={
              <RoleProtectedRoute
                minimumRole="budtender"
                requiredPermissions={['view_strains']}
              >
                <StrainsPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/dispatch"
            element={
              <RoleProtectedRoute
                minimumRole="budtender"
              >
                <DispatchPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/secure-calls"
            element={
              <RoleProtectedRoute minimumRole="budtender">
                <SecureCallsPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/med-card-flow"
            element={
              <RoleProtectedRoute minimumRole="budtender">
                <SecureCallsPage />
              </RoleProtectedRoute>
            }
          />

          {/* ------------------------------------------------------------ */}
          {/* Manager+ Routes - Inventory & Analytics */}
          {/* ------------------------------------------------------------ */}
          <Route
            path="/inventory"
            element={
              <RoleProtectedRoute
                minimumRole="manager"
                requiredPermissions={['view_inventory']}
              >
                <InventoryPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <RoleProtectedRoute
                minimumRole="manager"
                requiredPermissions={['view_analytics']}
              >
                <AnalyticsPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <RoleProtectedRoute
                minimumRole="manager"
                requiredPermissions={['manage_staff']}
              >
                <StaffPage />
              </RoleProtectedRoute>
            }
          />

          {/* ------------------------------------------------------------ */}
          {/* Owner+ Routes - Compliance & Configuration */}
          {/* ------------------------------------------------------------ */}
          <Route
            path="/compliance"
            element={
              <RoleProtectedRoute
                minimumRole="owner"
                requiredPermissions={['view_compliance']}
              >
                <CompliancePage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/compliance-alerts"
            element={
              <RoleProtectedRoute
                minimumRole="manager"
                requiredPermissions={['view_compliance']}
              >
                <ComplianceAlertCenterPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/configuration"
            element={
              <RoleProtectedRoute
                minimumRole="owner"
                requireAnyPermission={['manage_integrations', 'manage_compliance']}
              >
                <ConfigurationPage />
              </RoleProtectedRoute>
            }
          />
        </Route>

        {/* ============================================================ */}
        {/* 404 Not Found */}
        {/* ============================================================ */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
