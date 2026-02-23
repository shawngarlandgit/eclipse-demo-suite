import { HStack, Button, IconButton, Text, Tooltip, useToast } from '@chakra-ui/react';
import { Edit2, RotateCcw, X } from 'lucide-react';
import { useSettingsStore, type DashboardStyle } from '../../stores/settingsStore';

interface EditModeToolbarProps {
  dashboardStyle: DashboardStyle;
}

/**
 * EditModeToolbar - Controls for entering/exiting edit mode and resetting layouts
 */
export function EditModeToolbar({ dashboardStyle }: EditModeToolbarProps) {
  const { isEditMode, setEditMode, resetLayoutToDefault } = useSettingsStore();
  const toast = useToast();

  const handleReset = () => {
    resetLayoutToDefault(dashboardStyle);
    toast({
      title: 'Layout Reset',
      description: 'Dashboard restored to default layout',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleDone = () => {
    setEditMode(false);
    toast({
      title: 'Layout Saved',
      description: 'Your custom layout has been saved',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // Show simple edit button when not in edit mode
  if (!isEditMode) {
    return (
      <Tooltip label="Customize layout - drag and resize widgets" placement="left">
        <IconButton
          aria-label="Edit layout"
          icon={<Edit2 size={18} />}
          size="sm"
          variant="ghost"
          color="slate.400"
          _hover={{ color: 'white', bg: 'slate.700' }}
          onClick={() => setEditMode(true)}
        />
      </Tooltip>
    );
  }

  // Show full toolbar when in edit mode
  return (
    <HStack
      bg="emerald.900"
      px={4}
      py={2}
      borderRadius="full"
      border="1px solid"
      borderColor="emerald.700"
      spacing={3}
      boxShadow="lg"
    >
      <HStack spacing={2}>
        <Edit2 size={16} color="var(--chakra-colors-emerald-400)" />
        <Text fontSize="sm" color="emerald.400" fontWeight="medium">
          Edit Mode
        </Text>
      </HStack>

      <Button
        leftIcon={<RotateCcw size={14} />}
        size="sm"
        variant="ghost"
        color="orange.300"
        _hover={{ bg: 'orange.900', color: 'orange.200' }}
        onClick={handleReset}
      >
        Reset
      </Button>

      <Button
        leftIcon={<X size={14} />}
        size="sm"
        bg="emerald.600"
        color="white"
        _hover={{ bg: 'emerald.500' }}
        onClick={handleDone}
      >
        Done
      </Button>
    </HStack>
  );
}

export default EditModeToolbar;
