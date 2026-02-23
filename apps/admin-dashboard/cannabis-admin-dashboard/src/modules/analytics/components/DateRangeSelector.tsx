import { Box, Button, ButtonGroup, HStack, Text, Input, VStack, Flex } from '@chakra-ui/react';
import { Calendar } from 'lucide-react';
import { useAnalyticsStore } from '../../../stores/analyticsStore';
import type { DateRangePreset } from '../types/index';
import { useState } from 'react';

/**
 * DateRangeSelector
 * Allows users to select preset date ranges or custom dates for analytics
 */
function DateRangeSelector() {
  const { dateRange, setDateRangePreset, setDateRange } = useAnalyticsStore();
  const [customStart, setCustomStart] = useState(dateRange.startDate);
  const [customEnd, setCustomEnd] = useState(dateRange.endDate);

  const presets: Array<{ label: string; value: DateRangePreset }> = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'Last 30 Days', value: 'last30days' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
  ];

  const handleCustomDateChange = () => {
    if (customStart && customEnd) {
      setDateRange({
        startDate: customStart,
        endDate: customEnd,
        preset: 'custom',
      });
    }
  };

  return (
    <Box className="card" p={4}>
      <VStack spacing={4} align="stretch">
        {/* Preset Buttons */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Text fontSize="sm" fontWeight="medium" color="slate.400">
            Date Range:
          </Text>

          <ButtonGroup size="sm" isAttached variant="outline" flexWrap="wrap">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                onClick={() => setDateRangePreset(preset.value)}
                bg={dateRange.preset === preset.value ? 'green.600' : 'slate.700'}
                color={dateRange.preset === preset.value ? 'white' : 'slate.300'}
                borderColor="slate.600"
                _hover={{
                  bg: dateRange.preset === preset.value ? 'green.700' : 'slate.600',
                }}
                _active={{
                  bg: dateRange.preset === preset.value ? 'green.800' : 'slate.500',
                }}
              >
                {preset.label}
              </Button>
            ))}
          </ButtonGroup>
        </Flex>

        {/* Custom Date Picker */}
        <HStack spacing={3} align="end" flexWrap="wrap">
          <Box flex="1" minW="200px">
            <Text fontSize="xs" color="slate.500" mb={1}>
              Start Date
            </Text>
            <Input
              type="date"
              size="sm"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              bg="slate.800"
              color="white"
              borderColor="slate.600"
              _hover={{ borderColor: 'slate.500' }}
              _focus={{ borderColor: 'green.500', boxShadow: '0 0 0 1px var(--chakra-colors-green-500)' }}
            />
          </Box>

          <Box flex="1" minW="200px">
            <Text fontSize="xs" color="slate.500" mb={1}>
              End Date
            </Text>
            <Input
              type="date"
              size="sm"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              bg="slate.800"
              color="white"
              borderColor="slate.600"
              _hover={{ borderColor: 'slate.500' }}
              _focus={{ borderColor: 'green.500', boxShadow: '0 0 0 1px var(--chakra-colors-green-500)' }}
            />
          </Box>

          <Button
            size="sm"
            colorScheme="green"
            leftIcon={<Calendar size={16} />}
            onClick={handleCustomDateChange}
            isDisabled={!customStart || !customEnd}
          >
            Apply Custom Range
          </Button>
        </HStack>

        {/* Display current range */}
        <Text fontSize="xs" color="slate.500">
          Current range: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
        </Text>
      </VStack>
    </Box>
  );
}

export default DateRangeSelector;
