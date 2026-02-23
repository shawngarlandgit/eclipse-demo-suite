import { forwardRef } from 'react';
import { Box, HStack, Text, Icon } from '@chakra-ui/react';
import { GripVertical } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { WIDGET_METADATA } from '../../config/defaultLayouts';

interface DraggableWidgetProps {
  id: string;
  children: React.ReactNode;
  title?: string;
  noPadding?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * DraggableWidget - Wrapper component for grid widgets
 * Shows drag handle when in edit mode
 * Must use forwardRef for react-grid-layout compatibility
 */
export const DraggableWidget = forwardRef<HTMLDivElement, DraggableWidgetProps>(
  ({ id, children, title, noPadding = false, style, className, ...props }, ref) => {
    const isEditMode = useSettingsStore((state) => state.isEditMode);

    // Get title from metadata if not provided
    const displayTitle = title || WIDGET_METADATA[id]?.name || id;

    return (
      <div
        ref={ref}
        style={style}
        className={className}
        {...props}
      >
        <Box
          position="relative"
          h="100%"
          bg="slate.800"
          borderRadius="xl"
          border={isEditMode ? '2px dashed' : '1px solid'}
          borderColor={isEditMode ? 'emerald.500' : 'slate.700'}
          overflow="hidden"
          transition="border-color 0.2s, box-shadow 0.2s"
          _hover={isEditMode ? { boxShadow: '0 0 0 2px var(--chakra-colors-emerald-500)' } : undefined}
        >
        {/* Edit mode drag handle */}
        {isEditMode && (
          <HStack
            className="widget-drag-handle"
            position="absolute"
            top={0}
            left={0}
            right={0}
            h="32px"
            bg="slate.900"
            px={3}
            justify="space-between"
            cursor="move"
            zIndex={10}
            borderBottom="1px solid"
            borderColor="slate.700"
          >
            <HStack spacing={2}>
              <Icon as={GripVertical} color="slate.400" boxSize={4} />
              <Text fontSize="xs" color="slate.400" fontWeight="medium" noOfLines={1}>
                {displayTitle}
              </Text>
            </HStack>
          </HStack>
        )}

        {/* Widget content */}
        <Box
          p={noPadding ? 0 : 4}
          pt={isEditMode ? '40px' : noPadding ? 0 : 4}
          h="100%"
          overflow="auto"
        >
          {children}
        </Box>
        </Box>
      </div>
    );
  }
);

DraggableWidget.displayName = 'DraggableWidget';

export default DraggableWidget;
