import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import type { Layout, Layouts } from 'react-grid-layout';
import { Box, useBreakpointValue } from '@chakra-ui/react';
import {
  useSettingsStore,
  type DashboardStyle,
  type Breakpoint,
  type WidgetLayout,
} from '../../stores/settingsStore';
import { DEFAULT_LAYOUTS, GRID_BREAKPOINTS, GRID_COLS, GRID_ROW_HEIGHT } from '../../config/defaultLayouts';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Cast to ComponentType to work around type mismatch between @types/react-grid-layout and actual API
const Responsive = ResponsiveGridLayout as React.ComponentType<{
  width: number;
  layouts: Layouts;
  breakpoints: Record<string, number>;
  cols: Record<string, number>;
  rowHeight: number;
  isDraggable: boolean;
  isResizable: boolean;
  onLayoutChange: (currentLayout: Layout[], allLayouts: Layouts) => void;
  draggableHandle?: string;
  resizeHandles: string[];
  margin: [number, number];
  containerPadding: [number, number];
  useCSSTransforms: boolean;
  compactType: string;
  preventCollision: boolean;
  children: React.ReactNode;
}>;

// Hook to measure container width (since WidthProvider has type issues)
function useContainerWidth(containerRef: React.RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };

    // Initial measurement
    updateWidth();

    // Watch for resize
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [containerRef]);

  return width;
}


interface DraggableGridProps {
  dashboardStyle: DashboardStyle;
  children: React.ReactNode;
}

/**
 * DraggableGrid - Main wrapper for react-grid-layout
 * Provides drag/drop/resize functionality when edit mode is enabled
 */
export function DraggableGrid({ dashboardStyle, children }: DraggableGridProps) {
  const { dashboardLayouts, isEditMode, updateLayout } = useSettingsStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(containerRef);

  // Get layouts: user customized or defaults
  const layouts = useMemo(() => {
    const customLayouts = dashboardLayouts[dashboardStyle];
    const defaults = DEFAULT_LAYOUTS[dashboardStyle];

    // Get base layouts
    let baseLayouts: Record<string, WidgetLayout[]>;
    if (customLayouts) {
      baseLayouts = {
        lg: customLayouts.lg || defaults.lg,
        md: customLayouts.md || defaults.md,
        sm: customLayouts.sm || defaults.sm,
        xs: customLayouts.xs || defaults.xs,
        xxs: customLayouts.xxs || defaults.xxs,
      };
    } else {
      baseLayouts = { ...defaults };
    }

    // When not in edit mode, mark all items as static
    if (!isEditMode) {
      const staticLayouts: Record<string, WidgetLayout[]> = {};
      Object.entries(baseLayouts).forEach(([breakpoint, items]) => {
        staticLayouts[breakpoint] = items.map(item => ({
          ...item,
          static: true,
          isDraggable: false,
          isResizable: false,
        }));
      });
      return staticLayouts;
    }

    return baseLayouts;
  }, [dashboardLayouts, dashboardStyle, isEditMode]);

  // Disable drag/resize on mobile (default to false to prevent undefined issues)
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false;

  // Compute draggable/resizable state
  const canInteract = isEditMode && !isMobile;

  // Handle layout changes - only save when in edit mode
  const handleLayoutChange = useCallback(
    (_currentLayout: Layout[], allLayouts: Layouts) => {
      if (!isEditMode) return;

      // Save each breakpoint's layout
      Object.entries(allLayouts).forEach(([breakpoint, layoutArray]) => {
        updateLayout(dashboardStyle, breakpoint as Breakpoint, layoutArray as WidgetLayout[]);
      });
    },
    [dashboardStyle, isEditMode, updateLayout]
  );

  // Don't render grid until we have container width
  if (!width) {
    return (
      <Box ref={containerRef} minH="400px">
        {/* Measuring container width */}
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      className={isEditMode ? 'edit-mode' : ''}
      sx={{
        // Disable all drag/resize interactions when not in edit mode
        '.react-grid-item': {
          pointerEvents: isEditMode ? 'auto' : 'auto',
          '& > .react-resizable-handle': {
            display: isEditMode ? 'block' : 'none !important',
          },
        },
        // Disable the draggable functionality completely when not editing
        '.react-draggable': {
          cursor: isEditMode ? undefined : 'default !important',
        },
        '.react-grid-item.react-grid-placeholder': {
          bg: 'emerald.500',
          opacity: 0.2,
          borderRadius: 'xl',
          display: isEditMode ? 'block' : 'none',
        },
        '.react-grid-item.react-draggable-dragging': {
          zIndex: 100,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        },
        '.react-resizable-handle': {
          width: '20px',
          height: '20px',
          background: 'var(--chakra-colors-emerald-500)',
          borderRadius: '4px',
          opacity: isEditMode ? 0.7 : 0,
          display: isEditMode ? 'block' : 'none !important',
          transition: 'opacity 200ms ease',
          '&:hover': {
            opacity: 1,
          },
        },
        '.react-resizable-handle-se': {
          bottom: '4px',
          right: '4px',
          cursor: 'se-resize',
        },
        '.react-resizable-handle-sw': {
          bottom: '4px',
          left: '4px',
          cursor: 'sw-resize',
        },
        '.react-resizable-handle-ne': {
          top: '4px',
          right: '4px',
          cursor: 'ne-resize',
        },
        '.react-resizable-handle-nw': {
          top: '4px',
          left: '4px',
          cursor: 'nw-resize',
        },
      }}
    >
      <Responsive
        width={width}
        layouts={layouts}
        breakpoints={GRID_BREAKPOINTS}
        cols={GRID_COLS}
        rowHeight={GRID_ROW_HEIGHT}
        isDraggable={canInteract}
        isResizable={canInteract}
        onLayoutChange={handleLayoutChange}
        draggableHandle={canInteract ? '.widget-drag-handle' : undefined}
        resizeHandles={canInteract ? ['se', 'sw', 'ne', 'nw'] : []}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
      >
        {children}
      </Responsive>
    </Box>
  );
}

export default DraggableGrid;
