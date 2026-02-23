import { Box, Text, Skeleton, VStack, HStack, Flex, Button, ButtonGroup, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { useState } from 'react';
import { formatCurrency } from '../../../../utils/formatters';

interface ProductTypeBreakdown {
  type: string;
  count: number;
}

interface StrainData {
  strain: string;
  category: string;
  transactions: number;
  revenue: number;
  breakdown: ProductTypeBreakdown[];
}

/**
 * TopStrainsChart
 * Displays top performing strains with transaction counts and product types
 */
function TopStrainsChart() {
  const [limit, setLimit] = useState<5 | 10 | 20 | 50 | 75>(10);

  // Categories to show as tabs
  const categories = [
    { key: 'all', label: 'All Products' },
    { key: 'flower', label: 'Flower' },
    { key: 'edible', label: 'Edibles' },
    { key: 'extract', label: 'Concentrates' },
    { key: 'pre-roll', label: 'Pre-Rolls' },
    { key: 'vape', label: 'Vapes' },
  ];

  // Helper function to generate realistic product breakdowns based on category
  const generateBreakdown = (totalTransactions: number, category: string): ProductTypeBreakdown[] => {
    const breakdown: ProductTypeBreakdown[] = [];
    let remaining = totalTransactions;

    if (category === 'flower') {
      breakdown.push({ type: 'Flower (1/8th)', count: remaining });
      return breakdown;
    }

    if (category === 'pre-roll') {
      breakdown.push({ type: 'Pre-Rolls', count: remaining });
      return breakdown;
    }

    if (category === 'vape') {
      breakdown.push({ type: 'Carts', count: remaining });
      return breakdown;
    }

    if (category === 'extract') {
      breakdown.push({ type: 'Dabs/Concentrates', count: remaining });
      return breakdown;
    }

    if (category === 'edible') {
      breakdown.push({ type: 'Edibles', count: remaining });
      return breakdown;
    }

    // For 'all', distribute across product types
    const flowerCount = Math.floor(remaining * (Math.random() * 0.3 + 0.2)); // 20-50%
    remaining -= flowerCount;
    if (flowerCount > 0) breakdown.push({ type: 'Flower (1/8th)', count: flowerCount });

    const preRollCount = Math.floor(remaining * (Math.random() * 0.25 + 0.15)); // 15-40%
    remaining -= preRollCount;
    if (preRollCount > 0) breakdown.push({ type: 'Pre-Rolls', count: preRollCount });

    const cartCount = Math.floor(remaining * (Math.random() * 0.4 + 0.2)); // 20-60%
    remaining -= cartCount;
    if (cartCount > 0) breakdown.push({ type: 'Carts', count: cartCount });

    const dabsCount = Math.floor(remaining * (Math.random() * 0.5 + 0.3)); // 30-80%
    remaining -= dabsCount;
    if (dabsCount > 0) breakdown.push({ type: 'Dabs/Concentrates', count: dabsCount });

    // Add remaining to first category
    if (remaining > 0 && breakdown.length > 0) {
      breakdown[0].count += remaining;
    }

    return breakdown.filter(b => b.count > 0);
  };

  // Strain names
  const strainNames = [
    'Blue Dream', 'Sour Diesel', 'Girl Scout Cookies', 'Gorilla Glue #4', 'Wedding Cake',
    'OG Kush', 'Gelato', 'Purple Haze', 'Jack Herer', 'White Widow',
    'Northern Lights', 'AK-47', 'Pineapple Express', 'Super Lemon Haze', 'Durban Poison',
    'Green Crack', 'Trainwreck', 'Maui Wowie', 'Bubba Kush', 'Strawberry Cough',
    'Cherry Pie', 'Skywalker OG', 'Do-Si-Dos', 'Sunset Sherbet', 'Amnesia Haze',
    'Tangie', 'Forbidden Fruit', 'Candyland', 'Headband', 'LA Confidential',
    'Chemdawg', 'Death Star', 'Blueberry', 'Alien OG', 'Harlequin',
    'Zkittlez', 'Mimosa', 'Tropicana Cookies', 'MAC', 'Runtz',
    'Biscotti', 'Ice Cream Cake', 'Apple Fritter', 'Lemon Cherry Gelato', 'Jealousy',
    'Cereal Milk', 'Papaya', 'London Pound Cake', 'Gary Payton', 'Slurricane',
    'Permanent Marker', 'Purple Punch', 'Granddaddy Purple', 'Sativa', 'Indica',
    'Hybrid Blend', 'Zkittlez OG', 'Cookies', 'Cake', 'Dream',
    'Haze', 'Kush', 'Diesel', 'Glue', 'Fire',
    'Premium', 'Top Shelf', 'Exotic', 'Reserve', 'Special Edition',
  ];

  // Category options for random assignment
  const categoryOptions = ['flower', 'edible', 'extract', 'pre-roll', 'vape'];

  // Generate 75 strain entries with random categories
  const allStrains: StrainData[] = strainNames.map((name) => {
    const category = categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
    const transactions = Math.floor(Math.random() * 500 + 100);
    return {
      strain: name,
      category,
      transactions,
      revenue: Math.random() * 5000 + 1500,
      breakdown: generateBreakdown(transactions, category),
    };
  });

  // Filter strains by category
  const getStrainsByCategory = (categoryKey: string) => {
    if (categoryKey === 'all') {
      return allStrains.slice(0, limit).sort((a, b) => b.transactions - a.transactions);
    }
    return allStrains
      .filter(s => s.category === categoryKey)
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, limit);
  };

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
            <Box key={`${strain.strain}-${strain.category}-${index}`} position="relative">
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
                      <Text
                        fontSize="sm"
                        fontWeight={index === 0 ? 'bold' : 'semibold'}
                        color={index === 0 ? 'green.400' : 'white'}
                        mb={1}
                      >
                        {strain.strain}
                      </Text>
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

      <Tabs variant="soft-rounded" colorScheme="green" size="sm">
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
