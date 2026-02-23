import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  HStack,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { ComplianceFlag } from '../types';

interface ComplianceFlagsTableProps {
  flags: ComplianceFlag[];
  isLoading?: boolean;
}

/**
 * ComplianceFlagsTable
 * Displays compliance flags in a detailed table format
 */
function ComplianceFlagsTable({ flags, isLoading = false }: ComplianceFlagsTableProps) {
  if (isLoading) {
    return (
      <Box className="card" p={6}>
        <Box className="skeleton" height="400px" />
      </Box>
    );
  }

  if (!flags || flags.length === 0) {
    return (
      <Box className="card" p={6} textAlign="center">
        <Text color="slate.400">No compliance flags found</Text>
      </Box>
    );
  }

  const getSeverityColor = (severity: ComplianceFlag['severity']) => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'blue';
    }
  };

  const getStatusColor = (status: ComplianceFlag['status']) => {
    switch (status) {
      case 'open':
        return 'red';
      case 'in_progress':
        return 'yellow';
      case 'resolved':
        return 'green';
      case 'dismissed':
        return 'gray';
    }
  };

  const getStatusIcon = (status: ComplianceFlag['status']) => {
    switch (status) {
      case 'open':
        return AlertTriangle;
      case 'in_progress':
        return Clock;
      case 'resolved':
        return CheckCircle;
      case 'dismissed':
        return XCircle;
    }
  };

  const formatCategory = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Box className="card" overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th color="slate.400" borderColor="slate.700">Severity</Th>
            <Th color="slate.400" borderColor="slate.700">Status</Th>
            <Th color="slate.400" borderColor="slate.700">Category</Th>
            <Th color="slate.400" borderColor="slate.700">Issue</Th>
            <Th color="slate.400" borderColor="slate.700">Detected</Th>
            <Th color="slate.400" borderColor="slate.700">Assigned To</Th>
          </Tr>
        </Thead>
        <Tbody>
          {flags.map((flag) => (
            <Tr key={flag.id} _hover={{ bg: 'slate.750' }}>
              <Td borderColor="slate.700">
                <Badge colorScheme={getSeverityColor(flag.severity)} textTransform="uppercase" fontSize="xs">
                  {flag.severity}
                </Badge>
              </Td>
              <Td borderColor="slate.700">
                <HStack spacing={2}>
                  <Icon as={getStatusIcon(flag.status)} boxSize={4} color={`${getStatusColor(flag.status)}.400`} />
                  <Badge colorScheme={getStatusColor(flag.status)} variant="subtle" textTransform="capitalize">
                    {flag.status.replace('_', ' ')}
                  </Badge>
                </HStack>
              </Td>
              <Td borderColor="slate.700">
                <Text fontSize="sm" color="slate.300" textTransform="capitalize">
                  {formatCategory(flag.category)}
                </Text>
              </Td>
              <Td borderColor="slate.700" maxW="400px">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="medium" color="white">
                    {flag.title}
                  </Text>
                  <Text fontSize="xs" color="slate.400" noOfLines={2}>
                    {flag.description}
                  </Text>
                  {flag.related_entity && (
                    <Text fontSize="xs" color="blue.400">
                      Related: {flag.related_entity.name}
                    </Text>
                  )}
                </VStack>
              </Td>
              <Td borderColor="slate.700">
                <Text fontSize="sm" color="slate.400">
                  {formatTimestamp(flag.detected_at)}
                </Text>
              </Td>
              <Td borderColor="slate.700">
                <Text fontSize="sm" color={flag.assigned_to ? 'white' : 'slate.500'}>
                  {flag.assigned_to || '-'}
                </Text>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

export default ComplianceFlagsTable;
