import { Badge } from '@chakra-ui/react';
import type { BatchStatus, TestStatus } from '../types/index';

interface BatchStatusBadgeProps {
  status: BatchStatus | TestStatus;
  type?: 'batch' | 'test';
}

/**
 * BatchStatusBadge
 * Color-coded badge for batch and test statuses
 */
function BatchStatusBadge({ status, type = 'batch' }: BatchStatusBadgeProps) {
  const batchStatusConfig: Record<
    BatchStatus,
    { color: string; label: string }
  > = {
    active: { color: 'green', label: 'Active' },
    quarantine: { color: 'red', label: 'Quarantine' },
    expired: { color: 'gray', label: 'Expired' },
    depleted: { color: 'slate', label: 'Depleted' },
  };

  const testStatusConfig: Record<TestStatus, { color: string; label: string }> =
    {
      passed: { color: 'green', label: 'Passed' },
      pending: { color: 'yellow', label: 'Pending' },
      failed: { color: 'red', label: 'Failed' },
      expired: { color: 'orange', label: 'Test Expired' },
    };

  const config =
    type === 'batch'
      ? batchStatusConfig[status as BatchStatus]
      : testStatusConfig[status as TestStatus];

  if (!config) return null;

  return (
    <Badge
      colorScheme={config.color}
      variant="subtle"
      fontSize="xs"
      px={2}
      py={0.5}
      borderRadius="full"
    >
      {config.label}
    </Badge>
  );
}

export default BatchStatusBadge;
