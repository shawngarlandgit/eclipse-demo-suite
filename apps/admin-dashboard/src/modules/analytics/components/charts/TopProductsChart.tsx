import { Box, Text, Skeleton, VStack, HStack, Flex, Button, ButtonGroup, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { Package } from 'lucide-react';
import { useTopProducts } from '../../../../hooks/useAnalytics';
import { formatCurrency } from '../../../../utils/formatters';
import { useState, useMemo, useCallback } from 'react';

/**
 * TopProductsChart
 * Displays top performing products with sales metrics
 */
function TopProductsChart() {
  const [limit, setLimit] = useState<5 | 10 | 20 | 50 | 75>(10);
  const { data: allProducts, isLoading } = useTopProducts(75); // Fetch all products for filtering

  // Categories to show as tabs - memoized to prevent recreation
  const categories = useMemo(() => [
    { key: 'all', label: 'All Products' },
    { key: 'flower', label: 'Flower' },
    { key: 'edible', label: 'Edibles' },
    { key: 'extract', label: 'Concentrates' },
    { key: 'pre-roll', label: 'Pre-Rolls' },
    { key: 'vape', label: 'Vapes' },
  ], []);

  // Memoize filtered products by category - recomputes when limit or allProducts changes
  const productsByCategory = useMemo(() => {
    if (!allProducts) return {};
    return categories.reduce((acc, cat) => {
      if (cat.key === 'all') {
        acc[cat.key] = allProducts.slice(0, limit);
      } else {
        acc[cat.key] = allProducts
          .filter(p => p.category === cat.key)
          .slice(0, limit);
      }
      return acc;
    }, {} as Record<string, typeof allProducts>);
  }, [allProducts, limit, categories]);

  // Get products for a specific category
  const getProductsByCategory = useCallback((categoryKey: string) => {
    return productsByCategory[categoryKey] || [];
  }, [productsByCategory]);

  if (isLoading) {
    return (
      <Box className="card" p={6}>
        <Skeleton height="400px" />
      </Box>
    );
  }

  if (!allProducts || allProducts.length === 0) {
    return (
      <Box className="card" p={6}>
        <Text color="slate.400">No product data available</Text>
      </Box>
    );
  }

  // Render product list for a category
  const renderProductList = (data: typeof allProducts) => {
    if (!data || data.length === 0) {
      return (
        <Text color="slate.400" py={8} textAlign="center">
          No products in this category
        </Text>
      );
    }

    const maxRevenue = Math.max(...data.map(p => p.revenue));

    return (
      <>
        <VStack spacing={4} align="stretch">
          {data.map((product, index) => {
            const barWidth = (product.revenue / maxRevenue) * 100;

            return (
              <Box key={product.product_id} position="relative">
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
                  _hover={{ opacity: 0.5 }}
                />

                {/* Content */}
                <Box position="relative" p={3}>
                  <Flex justify="space-between" align="start" mb={2}>
                    <HStack spacing={3} flex={1}>
                      <Flex
                        align="center"
                        justify="center"
                        w={8}
                        h={8}
                        borderRadius="md"
                        bg={index === 0 ? 'green.600' : 'slate.700'}
                        color="white"
                        fontSize="sm"
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
                          {product.product_name}
                        </Text>
                        <HStack spacing={4} fontSize="xs" color="slate.500">
                          <HStack spacing={1}>
                            <Package size={12} />
                            <Text>{product.quantity_sold} sold</Text>
                          </HStack>
                          <Text>•</Text>
                          <Text>{product.transaction_count} transactions</Text>
                        </HStack>
                      </Box>
                    </HStack>

                    <VStack align="end" spacing={0}>
                      <Text
                        fontSize="md"
                        fontWeight="bold"
                        color={index === 0 ? 'green.400' : 'white'}
                      >
                        {formatCurrency(product.revenue)}
                      </Text>
                      <Text fontSize="xs" color="slate.500">
                        Avg {formatCurrency(product.avg_price)}
                      </Text>
                    </VStack>
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
              Total Revenue (Top {data.length})
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color="green.400">
              {formatCurrency(data.reduce((sum, p) => sum + p.revenue, 0))}
            </Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="xs" color="slate.500">
              Total Units Sold
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color="white">
              {data.reduce((sum, p) => sum + p.quantity_sold, 0).toLocaleString()} units
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
          Top Products
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
              {renderProductList(getProductsByCategory(category.key))}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default TopProductsChart;
