import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Dashboard Style Options
 */
export type DashboardStyle =
  | 'option-1'    // Compact Metric Strips
  | 'option-2'    // Data Tables with Sparklines
  | 'option-4'    // Sidebar Stats + Main Content
  | 'option-5'    // Tabbed Panels
  | 'simple-1'    // The Big Three
  | 'simple-2'    // Traffic Light Dashboard
  | 'simple-3'    // Cash Register View
  | 'simple-4';   // Owner's Summary

/**
 * Grid Layout Types
 * Compatible with react-grid-layout's Layout interface
 */
export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export type Breakpoint = 'lg' | 'md' | 'sm' | 'xs' | 'xxs';

export type ResponsiveLayouts = {
  [key in Breakpoint]: WidgetLayout[];
};

export interface DashboardStyleOption {
  id: DashboardStyle;
  name: string;
  description: string;
  category: 'detailed' | 'simple';
}

export const DASHBOARD_STYLES: DashboardStyleOption[] = [
  // Simple options first (recommended for most users)
  {
    id: 'simple-1',
    name: 'The Big Three',
    description: '3 large cards showing revenue, sales, and best seller',
    category: 'simple',
  },
  {
    id: 'simple-2',
    name: 'Health Check',
    description: 'Color-coded status indicators (green/yellow/red)',
    category: 'simple',
  },
  {
    id: 'simple-3',
    name: 'Cash Register',
    description: 'Register-style display for budtenders',
    category: 'simple',
  },
  {
    id: 'simple-4',
    name: "Owner's Summary",
    description: 'Plain English narrative summary',
    category: 'simple',
  },
  // Detailed options
  {
    id: 'option-1',
    name: 'Metric Strips',
    description: 'Compact horizontal rows with charts',
    category: 'detailed',
  },
  {
    id: 'option-2',
    name: 'Data Tables',
    description: 'Tables with sparkline trends',
    category: 'detailed',
  },
  {
    id: 'option-4',
    name: 'Sidebar Layout',
    description: 'Sidebar metrics with main content area',
    category: 'detailed',
  },
  {
    id: 'option-5',
    name: 'Tabbed Panels',
    description: 'Category tabs with metric bar',
    category: 'detailed',
  },
];

/**
 * Settings Store Interface
 */
interface SettingsState {
  // Dashboard style selection
  dashboardStyle: DashboardStyle;

  // Grid customization
  dashboardLayouts: Partial<Record<DashboardStyle, ResponsiveLayouts>>;
  isEditMode: boolean;

  // Actions - Style
  setDashboardStyle: (style: DashboardStyle) => void;
  reset: () => void;

  // Actions - Grid
  setEditMode: (enabled: boolean) => void;
  updateLayout: (style: DashboardStyle, breakpoint: Breakpoint, layouts: WidgetLayout[]) => void;
  setLayouts: (style: DashboardStyle, layouts: ResponsiveLayouts) => void;
  resetLayoutToDefault: (style: DashboardStyle) => void;
  resetAllLayouts: () => void;
}

/**
 * Settings Store with localStorage persistence
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Default to "The Big Three" - simplest option
      dashboardStyle: 'simple-1',

      // Grid customization state
      dashboardLayouts: {},
      isEditMode: false,

      // Style actions
      setDashboardStyle: (style: DashboardStyle) => {
        set({ dashboardStyle: style });
      },

      reset: () => {
        set({ dashboardStyle: 'simple-1' });
      },

      // Grid actions
      setEditMode: (enabled: boolean) => {
        set({ isEditMode: enabled });
      },

      updateLayout: (style: DashboardStyle, breakpoint: Breakpoint, layouts: WidgetLayout[]) => {
        const currentLayouts = get().dashboardLayouts;
        const styleLayouts = currentLayouts[style] || {} as ResponsiveLayouts;

        set({
          dashboardLayouts: {
            ...currentLayouts,
            [style]: {
              ...styleLayouts,
              [breakpoint]: layouts,
            },
          },
        });
      },

      setLayouts: (style: DashboardStyle, layouts: ResponsiveLayouts) => {
        const currentLayouts = get().dashboardLayouts;
        set({
          dashboardLayouts: {
            ...currentLayouts,
            [style]: layouts,
          },
        });
      },

      resetLayoutToDefault: (style: DashboardStyle) => {
        const currentLayouts = get().dashboardLayouts;
        const { [style]: _, ...rest } = currentLayouts;
        set({ dashboardLayouts: rest });
      },

      resetAllLayouts: () => {
        set({ dashboardLayouts: {} });
      },
    }),
    {
      name: 'cannabis-admin-settings',
      version: 18,
      // Don't persist isEditMode - always start with edit mode off
      partialize: (state) => ({
        dashboardStyle: state.dashboardStyle,
        dashboardLayouts: state.dashboardLayouts,
        isEditMode: false, // Always start with edit mode off
      }),
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<SettingsState>;
        if (version < 18) {
          // Version 18: AI Insights full display, consistent metric row heights
          return {
            dashboardStyle: state.dashboardStyle || 'simple-1',
            dashboardLayouts: {}, // Clear old layouts, will use defaults from defaultLayouts.ts
            isEditMode: false,
          };
        }
        return state as SettingsState;
      },
    }
  )
);

// Selector hooks
export const useDashboardStyle = () => useSettingsStore((state) => state.dashboardStyle);
