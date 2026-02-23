import { SimpleGrid } from '@chakra-ui/react';
import {
  CubeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import { useMemo } from 'react';
import StatCard from '../../dashboard/components/StatCard';
import { useInventorySummary } from '../../../hooks/useInventory';
import { generateInventoryCardInsights } from '../utils/insights';

/**
 * InventoryStats
 * Summary statistics for inventory overview
 */
function InventoryStats() {
  const { data: summary, isLoading } = useInventorySummary();

  // Generate insights for each card
  const cardInsights = useMemo(() => {
    if (!summary) return { totalValue: '', lowStock: '', expiring: '', retest: '' };
    return generateInventoryCardInsights(summary);
  }, [summary]);

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={6}>
      <StatCard
        label="Total Inventory Value"
        value={summary?.total_inventory_value || 0}
        format="currency"
        icon={<CubeIcon className="w-6 h-6" />}
        isLoading={isLoading}
        insight={cardInsights.totalValue}
      />

      <StatCard
        label="Low Stock Items"
        value={summary?.low_stock_count || 0}
        format="number"
        icon={<ExclamationTriangleIcon className="w-6 h-6" />}
        isLoading={isLoading}
        trend={
          summary?.low_stock_count && summary.low_stock_count > 0
            ? { value: summary.low_stock_count, isPositive: false }
            : undefined
        }
        insight={cardInsights.lowStock}
      />

      <StatCard
        label="Batches Expiring Soon"
        value={summary?.expiring_soon_count || 0}
        format="number"
        icon={<ClockIcon className="w-6 h-6" />}
        isLoading={isLoading}
        insight={cardInsights.expiring}
      />

      <StatCard
        label="Needs Retesting"
        value={summary?.needs_retest_count || 0}
        format="number"
        icon={<BeakerIcon className="w-6 h-6" />}
        isLoading={isLoading}
        insight={cardInsights.retest}
      />
    </SimpleGrid>
  );
}

export default InventoryStats;
