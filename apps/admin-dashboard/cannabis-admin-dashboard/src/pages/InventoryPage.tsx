import { Box, Heading, Text, SimpleGrid, HStack, Button, Icon, useDisclosure } from '@chakra-ui/react';
import { useMemo } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import DateRangeSelector from '../modules/analytics/components/DateRangeSelector';
import InsightCard from '../modules/analytics/components/InsightCard';
import InventoryStats from '../modules/inventory/components/InventoryStats';
import ProductFilters from '../modules/inventory/components/ProductFilters';
import ProductsTable from '../modules/inventory/components/ProductsTable';
import ProductDetailModal from '../modules/inventory/components/ProductDetailModal';
import ImportProductsModal from '../modules/inventory/components/ImportProductsModal';
import { useInventorySummary, useComplianceAlerts } from '../hooks/useInventory';
import {
  generateInventorySummaryInsights,
  generateComplianceInsights,
  generateInventoryInsights,
  generateTimeBasedInsights,
} from '../modules/inventory/utils/insights';

// The Neon Pipe dispensary ID
const NEON_PIPE_DISPENSARY_ID = '06c18efa-32ce-44c3-8282-da807fefd23f';

/**
 * InventoryPage
 * Main inventory management page with products, batches, and compliance tracking
 */
function InventoryPage() {
  const { data: summary } = useInventorySummary();
  const { data: alerts } = useComplianceAlerts();
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();

  // Generate insights
  const insights = useMemo(() => {
    const summaryInsights = summary ? generateInventorySummaryInsights(summary) : [];
    const complianceInsights = alerts && alerts.length > 0 ? generateComplianceInsights(alerts) : [];
    const inventoryInsights = summary ? generateInventoryInsights(summary) : [];
    const timeInsights = generateTimeBasedInsights();

    // Combine insights strategically
    const allInsights = [];

    // Add first summary or compliance insight
    if (summaryInsights.length > 0) {
      allInsights.push(summaryInsights[0]);
    } else if (complianceInsights.length > 0) {
      allInsights.push(complianceInsights[0]);
    }

    // Add time insight in the middle
    if (timeInsights.length > 0) {
      allInsights.push(timeInsights[0]);
    }

    // Add remaining insights
    if (inventoryInsights.length > 0) {
      allInsights.push(inventoryInsights[0]);
    }

    // Add any additional insights to fill the grid
    const remaining = [
      ...summaryInsights.slice(1),
      ...complianceInsights.slice(summaryInsights.length > 0 ? 0 : 1),
      ...inventoryInsights.slice(1),
      ...timeInsights.slice(1),
    ];
    allInsights.push(...remaining);

    return allInsights;
  }, [summary, alerts]);

  return (
    <Box>
      <HStack justify="space-between" align="flex-start" mb={4}>
        <Box>
          <Heading size="lg" mb={2} color="white">
            Inventory Management
          </Heading>
          <Text color="slate.400">
            Product inventory, stock levels, strain catalog, and compliance tracking
          </Text>
        </Box>
        <Button
          colorScheme="green"
          leftIcon={<Icon as={ArrowUpTrayIcon} boxSize={5} />}
          onClick={onImportOpen}
        >
          Import Products
        </Button>
      </HStack>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Box mb={6}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Date Range Selector */}
      <Box mb={6}>
        <DateRangeSelector />
      </Box>

      {/* Inventory Summary Stats */}
      <InventoryStats />

      {/* Product Filters */}
      <ProductFilters />

      {/* Products Table */}
      <ProductsTable />

      {/* Product Detail Modal */}
      <ProductDetailModal />

      {/* Import Products Modal */}
      <ImportProductsModal
        isOpen={isImportOpen}
        onClose={onImportClose}
        dispensaryId={NEON_PIPE_DISPENSARY_ID}
        dispensaryName="The Neon Pipe"
      />
    </Box>
  );
}

export default InventoryPage;
