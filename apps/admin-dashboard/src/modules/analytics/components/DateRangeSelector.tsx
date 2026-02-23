import {
  Box,
  Button,
  HStack,
  Text,
  Input,
  VStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  useDisclosure,
} from '@chakra-ui/react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useAnalyticsStore } from '../../../stores/analyticsStore';
import type { DateRangePreset } from '../types/index';
import { useState } from 'react';

/**
 * DateRangeSelector
 * Compact dropdown for selecting date ranges in dashboard headers
 */
function DateRangeSelector() {
  const { dateRange, setDateRangePreset, setDateRange } = useAnalyticsStore();
  const [customStart, setCustomStart] = useState(dateRange.startDate);
  const [customEnd, setCustomEnd] = useState(dateRange.endDate);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const presets: Array<{ label: string; value: DateRangePreset }> = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'Last 30 Days', value: 'last30days' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
  ];

  const currentPresetLabel = presets.find(p => p.value === dateRange.preset)?.label || 'Custom';

  const handlePresetClick = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
    onClose();
  };

  const handleCustomDateChange = () => {
    if (customStart && customEnd) {
      setDateRange({
        startDate: customStart,
        endDate: customEnd,
        preset: 'custom',
      });
      onClose();
    }
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement="bottom-end">
      <PopoverTrigger>
        <Button
          size="sm"
          variant="outline"
          borderColor="slate.600"
          bg="slate.800"
          color="slate.200"
          _hover={{ bg: 'slate.700', borderColor: 'slate.500' }}
          leftIcon={<Calendar size={14} />}
          rightIcon={<ChevronDown size={14} />}
          fontWeight="normal"
        >
          <Text fontSize="sm">
            {currentPresetLabel === 'Custom'
              ? `${formatShortDate(dateRange.startDate)} - ${formatShortDate(dateRange.endDate)}`
              : currentPresetLabel
            }
          </Text>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        bg="slate.800"
        borderColor="slate.600"
        boxShadow="xl"
        w="280px"
        _focus={{ boxShadow: 'xl' }}
      >
        <PopoverArrow bg="slate.800" />
        <PopoverBody p={3}>
          <VStack spacing={3} align="stretch">
            {/* Preset Options */}
            <VStack spacing={1} align="stretch">
              {presets.map((preset) => (
                <Button
                  key={preset.value}
                  size="sm"
                  variant="ghost"
                  justifyContent="flex-start"
                  onClick={() => handlePresetClick(preset.value)}
                  bg={dateRange.preset === preset.value ? 'green.600' : 'transparent'}
                  color={dateRange.preset === preset.value ? 'white' : 'slate.300'}
                  _hover={{
                    bg: dateRange.preset === preset.value ? 'green.700' : 'slate.700',
                  }}
                  fontWeight={dateRange.preset === preset.value ? 'medium' : 'normal'}
                >
                  {preset.label}
                </Button>
              ))}
            </VStack>

            {/* Divider */}
            <Box borderTop="1px solid" borderColor="slate.600" />

            {/* Custom Date Range */}
            <VStack spacing={2} align="stretch">
              <Text fontSize="xs" color="slate.400" fontWeight="medium">
                Custom Range
              </Text>
              <HStack spacing={2}>
                <Input
                  type="date"
                  size="sm"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  bg="slate.900"
                  color="white"
                  borderColor="slate.600"
                  fontSize="xs"
                  _hover={{ borderColor: 'slate.500' }}
                  _focus={{ borderColor: 'green.500', boxShadow: '0 0 0 1px var(--chakra-colors-green-500)' }}
                />
                <Text color="slate.500" fontSize="xs">to</Text>
                <Input
                  type="date"
                  size="sm"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  bg="slate.900"
                  color="white"
                  borderColor="slate.600"
                  fontSize="xs"
                  _hover={{ borderColor: 'slate.500' }}
                  _focus={{ borderColor: 'green.500', boxShadow: '0 0 0 1px var(--chakra-colors-green-500)' }}
                />
              </HStack>
              <Button
                size="sm"
                colorScheme="green"
                onClick={handleCustomDateChange}
                isDisabled={!customStart || !customEnd}
              >
                Apply
              </Button>
            </VStack>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export default DateRangeSelector;
