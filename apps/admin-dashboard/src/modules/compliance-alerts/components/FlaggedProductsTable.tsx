/**
 * Flagged Products Table
 * Displays products that have been flagged due to compliance alerts
 */

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Box,
  Flex,
  Text,
  IconButton,
  Skeleton,
  Progress,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  LockClosedIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import type { FlaggedProduct } from "../types";
import { SEVERITY_CONFIG, STATUS_CONFIG } from "../types";
import type { Id } from "@convex/_generated/dataModel";

interface FlaggedProductsTableProps {
  products: FlaggedProduct[] | undefined;
  isLoading?: boolean;
  onResolve: (matchId: Id<"advisoryProductMatches">) => void;
  onViewDetails: (productId: Id<"products">) => void;
}

export function FlaggedProductsTable({
  products,
  isLoading,
  onResolve,
  onViewDetails,
}: FlaggedProductsTableProps) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "locked":
        return <LockClosedIcon width={16} />;
      case "flagged":
        return <ExclamationTriangleIcon width={16} />;
      case "under_review":
        return <ClockIcon width={16} />;
      default:
        return <CheckCircleIcon width={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "locked":
        return "red";
      case "flagged":
        return "orange";
      case "under_review":
        return "yellow";
      default:
        return "green";
    }
  };

  if (isLoading) {
    return (
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Product</Th>
              <Th>Match Confidence</Th>
              <Th>Advisory</Th>
              <Th>Severity</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {[...Array(5)].map((_, i) => (
              <Tr key={i}>
                {[...Array(6)].map((_, j) => (
                  <Td key={j}>
                    <Skeleton height="20px" />
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Box py={10} textAlign="center">
        <Flex direction="column" align="center" gap={2}>
          <CheckCircleIcon width={48} color="var(--chakra-colors-green-500)" />
          <Text color="gray.500" fontWeight="medium">
            No flagged products
          </Text>
          <Text color="gray.400" fontSize="sm">
            All inventory items are compliant
          </Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th borderColor={borderColor}>Product</Th>
            <Th borderColor={borderColor}>Match Confidence</Th>
            <Th borderColor={borderColor}>Advisory</Th>
            <Th borderColor={borderColor}>Severity</Th>
            <Th borderColor={borderColor}>Status</Th>
            <Th borderColor={borderColor}>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {products.map((product, productIndex) => {
            const match = product.complianceMatch;
            const advisory = product.advisory;
            const severityConfig = advisory
              ? SEVERITY_CONFIG[advisory.severity]
              : null;
            const matchStatus = match?.status || "pending";
            const statusConfig = STATUS_CONFIG[matchStatus];

            return (
              <Tr
                key={product._id}
                _hover={{ bg: hoverBg }}
                cursor="pointer"
                onClick={() => onViewDetails(product._id)}
              >
                <Td borderColor={borderColor}>
                  <Flex direction="column" gap={1}>
                    <Flex align="center" gap={2}>
                      {getStatusIcon(product.complianceStatus || "clear")}
                      <Text fontWeight="medium">{product.name}</Text>
                    </Flex>
                    <Flex gap={2} fontSize="xs" color="gray.500">
                      {product.sku && <Text>SKU: {product.sku}</Text>}
                      {product.batchNumber && (
                        <Text>Batch: {product.batchNumber}</Text>
                      )}
                    </Flex>
                    {product.brand && (
                      <Text fontSize="xs" color="gray.500">
                        Brand: {product.brand}
                      </Text>
                    )}
                  </Flex>
                </Td>
                <Td borderColor={borderColor}>
                  {match && (
                    <Flex direction="column" gap={1} maxW="150px">
                      <Flex justify="space-between" fontSize="sm">
                        <Text>{match.matchConfidence}%</Text>
                        <Text color="gray.500" fontSize="xs">
                          {match.matchType.replace("_", " ")}
                        </Text>
                      </Flex>
                      <Progress
                        value={match.matchConfidence}
                        size="sm"
                        colorScheme={
                          match.matchConfidence >= 90
                            ? "green"
                            : match.matchConfidence >= 70
                            ? "yellow"
                            : "orange"
                        }
                        borderRadius="full"
                      />
                    </Flex>
                  )}
                </Td>
                <Td borderColor={borderColor} maxW="200px">
                  {advisory ? (
                    <Tooltip label={advisory.description} hasArrow>
                      <Text noOfLines={2} fontSize="sm">
                        {advisory.title}
                      </Text>
                    </Tooltip>
                  ) : (
                    <Text color="gray.400" fontSize="sm">
                      Unknown
                    </Text>
                  )}
                </Td>
                <Td borderColor={borderColor}>
                  {severityConfig ? (
                    <Badge
                      colorScheme={
                        advisory?.severity === "critical"
                          ? "red"
                          : advisory?.severity === "high"
                          ? "orange"
                          : advisory?.severity === "medium"
                          ? "yellow"
                          : "blue"
                      }
                    >
                      {severityConfig.label}
                    </Badge>
                  ) : (
                    "-"
                  )}
                </Td>
                <Td borderColor={borderColor}>
                  <Badge colorScheme={getStatusColor(product.complianceStatus || "clear")}>
                    {statusConfig?.label || product.complianceStatus}
                  </Badge>
                </Td>
                <Td
                  borderColor={borderColor}
                  onClick={(e) => e.stopPropagation()}
                >
                  {match && matchStatus !== "resolved" && (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => onResolve(match._id)}
                      data-tour={productIndex === 0 ? "resolve-button" : undefined}
                    >
                      Resolve
                    </Button>
                  )}
                  {matchStatus === "resolved" && (
                    <Badge colorScheme="green">Resolved</Badge>
                  )}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}
