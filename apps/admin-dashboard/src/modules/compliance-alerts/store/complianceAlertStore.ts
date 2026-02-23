/**
 * Compliance Alert Store
 * Zustand store for managing compliance alert UI state
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Id } from "@convex/_generated/dataModel";
import type {
  AdvisorySeverity,
  AdvisoryStatus,
  MatchStatus,
  OCPAdvisory,
  EnrichedMatch,
} from "../types";

// ============================================================================
// TYPES
// ============================================================================

interface FilterState {
  severity: AdvisorySeverity | "all";
  status: AdvisoryStatus | "all";
  matchStatus: MatchStatus | "all";
  searchQuery: string;
  dateRange: {
    start: number | null;
    end: number | null;
  };
}

interface UIState {
  // Selected items
  selectedAdvisoryId: Id<"ocpAdvisories"> | null;
  selectedMatchId: Id<"advisoryProductMatches"> | null;

  // Modal states
  isDetailModalOpen: boolean;
  isResolutionModalOpen: boolean;
  isReportModalOpen: boolean;

  // View settings
  activeTab: number;
  viewMode: "table" | "cards";
  sortBy: "date" | "severity" | "status";
  sortOrder: "asc" | "desc";
}

interface NotificationPreferences {
  enabled: boolean;
  soundEnabled: boolean;
  criticalOnly: boolean;
  emailNotifications: boolean;
}

interface ComplianceAlertState {
  // Filters
  filters: FilterState;

  // UI State
  ui: UIState;

  // Notification preferences
  notifications: NotificationPreferences;

  // Read/acknowledged tracking (local)
  readAdvisoryIds: string[];
  acknowledgedMatchIds: string[];

  // Actions - Filters
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;

  // Actions - UI
  setSelectedAdvisory: (id: Id<"ocpAdvisories"> | null) => void;
  setSelectedMatch: (id: Id<"advisoryProductMatches"> | null) => void;
  openDetailModal: (advisoryId: Id<"ocpAdvisories">) => void;
  closeDetailModal: () => void;
  openResolutionModal: (matchId: Id<"advisoryProductMatches">) => void;
  closeResolutionModal: () => void;
  openReportModal: () => void;
  closeReportModal: () => void;
  setActiveTab: (index: number) => void;
  setViewMode: (mode: "table" | "cards") => void;
  setSortBy: (field: "date" | "severity" | "status") => void;
  toggleSortOrder: () => void;

  // Actions - Notifications
  setNotificationPreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => void;

  // Actions - Read tracking
  markAdvisoryAsRead: (id: string) => void;
  markMatchAsAcknowledged: (id: string) => void;
  isAdvisoryRead: (id: string) => boolean;
  isMatchAcknowledged: (id: string) => boolean;
  clearReadHistory: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialFilters: FilterState = {
  severity: "all",
  status: "all",
  matchStatus: "all",
  searchQuery: "",
  dateRange: {
    start: null,
    end: null,
  },
};

const initialUI: UIState = {
  selectedAdvisoryId: null,
  selectedMatchId: null,
  isDetailModalOpen: false,
  isResolutionModalOpen: false,
  isReportModalOpen: false,
  activeTab: 0,
  viewMode: "table",
  sortBy: "date",
  sortOrder: "desc",
};

const initialNotifications: NotificationPreferences = {
  enabled: true,
  soundEnabled: true,
  criticalOnly: false,
  emailNotifications: true,
};

// ============================================================================
// STORE
// ============================================================================

export const useComplianceAlertStore = create<ComplianceAlertState>()(
  persist(
    (set, get) => ({
      // Initial state
      filters: initialFilters,
      ui: initialUI,
      notifications: initialNotifications,
      readAdvisoryIds: [],
      acknowledgedMatchIds: [],

      // Filter actions
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),

      resetFilters: () =>
        set(() => ({
          filters: initialFilters,
        })),

      // UI actions
      setSelectedAdvisory: (id) =>
        set((state) => ({
          ui: { ...state.ui, selectedAdvisoryId: id },
        })),

      setSelectedMatch: (id) =>
        set((state) => ({
          ui: { ...state.ui, selectedMatchId: id },
        })),

      openDetailModal: (advisoryId) =>
        set((state) => {
          // Mark as read when opening
          const readIds = state.readAdvisoryIds.includes(advisoryId as string)
            ? state.readAdvisoryIds
            : [...state.readAdvisoryIds, advisoryId as string];

          return {
            ui: {
              ...state.ui,
              selectedAdvisoryId: advisoryId,
              isDetailModalOpen: true,
            },
            readAdvisoryIds: readIds,
          };
        }),

      closeDetailModal: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            selectedAdvisoryId: null,
            isDetailModalOpen: false,
          },
        })),

      openResolutionModal: (matchId) =>
        set((state) => ({
          ui: {
            ...state.ui,
            selectedMatchId: matchId,
            isResolutionModalOpen: true,
          },
        })),

      closeResolutionModal: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            selectedMatchId: null,
            isResolutionModalOpen: false,
          },
        })),

      openReportModal: () =>
        set((state) => ({
          ui: { ...state.ui, isReportModalOpen: true },
        })),

      closeReportModal: () =>
        set((state) => ({
          ui: { ...state.ui, isReportModalOpen: false },
        })),

      setActiveTab: (index) =>
        set((state) => ({
          ui: { ...state.ui, activeTab: index },
        })),

      setViewMode: (mode) =>
        set((state) => ({
          ui: { ...state.ui, viewMode: mode },
        })),

      setSortBy: (field) =>
        set((state) => ({
          ui: { ...state.ui, sortBy: field },
        })),

      toggleSortOrder: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            sortOrder: state.ui.sortOrder === "asc" ? "desc" : "asc",
          },
        })),

      // Notification actions
      setNotificationPreference: (key, value) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: value },
        })),

      // Read tracking actions
      markAdvisoryAsRead: (id) =>
        set((state) => ({
          readAdvisoryIds: state.readAdvisoryIds.includes(id)
            ? state.readAdvisoryIds
            : [...state.readAdvisoryIds, id],
        })),

      markMatchAsAcknowledged: (id) =>
        set((state) => ({
          acknowledgedMatchIds: state.acknowledgedMatchIds.includes(id)
            ? state.acknowledgedMatchIds
            : [...state.acknowledgedMatchIds, id],
        })),

      isAdvisoryRead: (id) => get().readAdvisoryIds.includes(id),

      isMatchAcknowledged: (id) => get().acknowledgedMatchIds.includes(id),

      clearReadHistory: () =>
        set(() => ({
          readAdvisoryIds: [],
          acknowledgedMatchIds: [],
        })),
    }),
    {
      name: "compliance-alert-store",
      partialize: (state) => ({
        // Only persist notification preferences and read tracking
        notifications: state.notifications,
        readAdvisoryIds: state.readAdvisoryIds,
        acknowledgedMatchIds: state.acknowledgedMatchIds,
        // Persist view preferences
        ui: {
          viewMode: state.ui.viewMode,
          sortBy: state.ui.sortBy,
          sortOrder: state.ui.sortOrder,
        },
      }),
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectFilters = (state: ComplianceAlertState) => state.filters;
export const selectUI = (state: ComplianceAlertState) => state.ui;
export const selectNotifications = (state: ComplianceAlertState) =>
  state.notifications;

export const selectUnreadCount = (
  state: ComplianceAlertState,
  advisoryIds: string[]
) => {
  return advisoryIds.filter((id) => !state.readAdvisoryIds.includes(id)).length;
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for filter state with memoized selectors
 */
export function useComplianceFilters() {
  const filters = useComplianceAlertStore((state) => state.filters);
  const setFilter = useComplianceAlertStore((state) => state.setFilter);
  const resetFilters = useComplianceAlertStore((state) => state.resetFilters);

  return { filters, setFilter, resetFilters };
}

/**
 * Hook for UI state
 */
export function useComplianceUI() {
  const ui = useComplianceAlertStore((state) => state.ui);
  const openDetailModal = useComplianceAlertStore(
    (state) => state.openDetailModal
  );
  const closeDetailModal = useComplianceAlertStore(
    (state) => state.closeDetailModal
  );
  const openResolutionModal = useComplianceAlertStore(
    (state) => state.openResolutionModal
  );
  const closeResolutionModal = useComplianceAlertStore(
    (state) => state.closeResolutionModal
  );
  const setActiveTab = useComplianceAlertStore((state) => state.setActiveTab);

  return {
    ui,
    openDetailModal,
    closeDetailModal,
    openResolutionModal,
    closeResolutionModal,
    setActiveTab,
  };
}

/**
 * Hook for notification preferences
 */
export function useComplianceNotifications() {
  const notifications = useComplianceAlertStore(
    (state) => state.notifications
  );
  const setNotificationPreference = useComplianceAlertStore(
    (state) => state.setNotificationPreference
  );

  return { notifications, setNotificationPreference };
}
