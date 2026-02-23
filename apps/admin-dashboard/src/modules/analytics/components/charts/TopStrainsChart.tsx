import { Box, Text, VStack, HStack, Flex, Button, ButtonGroup, Tabs, TabList, TabPanels, Tab, TabPanel, Skeleton } from '@chakra-ui/react';
import { useState, useMemo, useCallback } from 'react';
import { formatCurrency } from '../../../../utils/formatters';
import { useTopStrains } from '../../../../hooks/useAnalytics';

interface ProductTypeBreakdown {
  type: string;
  count: number;
}

interface StrainData {
  strain_id: string;
  strain_name: string;
  strain_type: string;
  category: string;
  transactions: number;
  revenue: number;
  breakdown: ProductTypeBreakdown[];
}

/**
 * TopStrainsChart
 * Displays top performing strains with transaction counts and product types
 * Uses real strain names from database with simulated sales data
 */
function TopStrainsChart() {
  const [limit, setLimit] = useState<5 | 10 | 20 | 50 | 75>(10);
  const { data: rawStrains, isLoading } = useTopStrains(75); // Fetch all for filtering

  // Categories to show as tabs - memoized to prevent recreation
  const categories = useMemo(() => [
    { key: 'all', label: 'All Products' },
    { key: 'flower', label: 'Flower' },
    { key: 'edible', label: 'Edibles' },
    { key: 'extract', label: 'Concentrates' },
    { key: 'pre-roll', label: 'Pre-Rolls' },
    { key: 'vape', label: 'Vapes' },
  ], []);

  // Helper function to generate realistic product breakdowns based on category
  const generateBreakdown = useCallback((totalTransactions: number, category: string): ProductTypeBreakdown[] => {
    const breakdown: ProductTypeBreakdown[] = [];

    if (category === 'flower') {
      breakdown.push({ type: 'Flower (1/8th)', count: totalTransactions });
      return breakdown;
    }

    if (category === 'pre-roll') {
      breakdown.push({ type: 'Pre-Rolls', count: totalTransactions });
      return breakdown;
    }

    if (category === 'vape') {
      breakdown.push({ type: 'Carts', count: totalTransactions });
      return breakdown;
    }

    if (category === 'extract') {
      breakdown.push({ type: 'Dabs/Concentrates', count: totalTransactions });
      return breakdown;
    }

    if (category === 'edible') {
      breakdown.push({ type: 'Edibles', count: totalTransactions });
      return breakdown;
    }

    // Default fallback
    breakdown.push({ type: 'Products', count: totalTransactions });
    return breakdown;
  }, []);

  // Transform raw data to include breakdowns
  const allStrains = useMemo<StrainData[]>(() => {
    if (!rawStrains) return [];
    return rawStrains.map(strain => ({
      ...strain,
      breakdown: generateBreakdown(strain.transactions, strain.category),
    }));
  }, [rawStrains, generateBreakdown]);

  // Memoize filtered strains by category
  const strainsByCategory = useMemo(() => {
    return categories.reduce((acc, cat) => {
      if (cat.key === 'all') {
        acc[cat.key] = allStrains.slice(0, limit);
      } else {
        acc[cat.key] = allStrains
          .filter(s => s.category === cat.key)
          .slice(0, limit);
      }
      return acc;
    }, {} as Record<string, StrainData[]>);
  }, [allStrains, limit, categories]);

  // Get strains for a specific category
  const getStrainsByCategory = useCallback((categoryKey: string) => {
    return strainsByCategory[categoryKey] || [];
  }, [strainsByCategory]);

  if (isLoading) {
    return (
      <Box className="card" p={6}>
        <Skeleton height="400px" />
      </Box>
    );
  }

  if (!allStrains || allStrains.length === 0) {
    return (
      <Box className="card" p={6}>
        <Text color="slate.400">No strain data available</Text>
      </Box>
    );
  }

  // Render strain list for a category
  const renderStrainList = (data: StrainData[]) => {
    if (!data || data.length === 0) {
      return (
        <Text color="slate.400" py={8} textAlign="center">
          No strains in this category
        </Text>
      );
    }

    const maxTransactions = Math.max(...data.map(s => s.transactions));

    return (
      <>
        <VStack spacing={3} align="stretch">
          {data.map((strain, index) => {
          const barWidth = (strain.transactions / maxTransactions) * 100;

          return (
            <Box key={`${strain.strain_id}-${strain.category}-${index}`} position="relative">
              {/* Background bar */}
              <Box
                position="absolute"
                left={0}
                top={0}
                bottom={0}
                w={`${barWidth}%`}
                bg={index === 0 ? 'green.900' : 'slate.800'}
                borderRadius="md"
                opacity={0.3}
                transition="all 0.3s"
              />

              {/* Content */}
              <Box position="relative" p={3}>
                <Flex justify="space-between" align="center">
                  <HStack spacing={3} flex={1}>
                    <Flex
                      align="center"
                      justify="center"
                      minW={8}
                      h={8}
                      borderRadius="md"
                      bg={index === 0 ? 'green.600' : index < 3 ? 'slate.600' : 'slate.700'}
                      color="white"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      {index + 1}
                    </Flex>

                    <Box flex={1}>
                      <HStack spacing={2} mb={1}>
                        <Text
                          fontSize="sm"
                          fontWeight={index === 0 ? 'bold' : 'semibold'}
                          color={index === 0 ? 'green.400' : 'white'}
                        >
                          {strain.strain_name}
                        </Text>
                        <Text
                          fontSize="xs"
                          color="slate.500"
                          textTransform="capitalize"
                        >
                          ({strain.strain_type})
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="slate.500" mb={1}>
                        {strain.breakdown.map((b, i) => (
                          <span key={i}>
                            {i > 0 && ', '}
                            <Text as="span" fontWeight="semibold" color="slate.400">
                              {b.count}
                            </Text>{' '}
                            {b.type}
                          </span>
                        ))}
                      </Text>
                      <Text fontSize="xs" color="slate.600">
                        {strain.transactions} total transactions
                      </Text>
                    </Box>
                  </HStack>

                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color={index === 0 ? 'green.400' : 'white'}
                  >
                    {formatCurrency(strain.revenue)}
                  </Text>
                </Flex>
              </Box>
            </Box>
          );
        })}
      </VStack>

      {/* Summary Footer */}
      <Box
        mt={6}
        pt={4}
        borderTop="1px solid"
        borderColor="slate.700"
      >
        <HStack justify="space-between" mb={2}>
          <Text fontSize="xs" color="slate.500">
            Total Transactions (Top {data.length})
          </Text>
          <Text fontSize="sm" fontWeight="semibold" color="white">
            {data.reduce((sum, s) => sum + s.transactions, 0).toLocaleString()}
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text fontSize="xs" color="slate.500">
            Total Revenue
          </Text>
          <Text fontSize="sm" fontWeight="semibold" color="green.400">
            {formatCurrency(data.reduce((sum, s) => sum + s.revenue, 0))}
          </Text>
        </HStack>
      </Box>
      </>
    );
  };

  return (
    <Box className="card" p={6} h="100%" display="flex" flexDirection="column" w="100%">
      <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={4}>
        <Text fontSize="lg" fontWeight="bold" color="white">
          Top Strains
        </Text>

        <ButtonGroup size="xs" variant="outline">
          {([5, 10, 20, 50, 75] as const).map((num) => (
            <Button
              key={num}
              onClick={() => setLimit(num)}
              bg={limit === num ? 'green.600' : 'slate.700'}
              color={limit === num ? 'white' : 'slate.300'}
              borderColor="slate.600"
              _hover={{
                bg: limit === num ? 'green.700' : 'slate.600',
              }}
            >
              Top {num}
            </Button>
          ))}
        </ButtonGroup>
      </Flex>

      <Tabs variant="soft-rounded" colorScheme="green" size="sm" isLazy>
        <TabList mb={4} gap={2} flexWrap="wrap">
          {categories.map((category) => (
            <Tab
              key={category.key}
              fontSize="xs"
              color="slate.400"
              _selected={{
                color: 'white',
                bg: 'green.600',
              }}
              _hover={{
                color: 'slate.200',
              }}
            >
              {category.label}
            </Tab>
          ))}
        </TabList>

        <TabPanels maxH="500px" overflowY="auto">
          {categories.map((category) => (
            <TabPanel key={category.key} px={0}>
              {renderStrainList(getStrainsByCategory(category.key))}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default TopStrainsChart;
