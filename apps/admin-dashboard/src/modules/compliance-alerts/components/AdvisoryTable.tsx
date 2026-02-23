/**
 * Advisory Table
 * Displays list of OCP advisories with filtering and actions
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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Skeleton,
  useColorModeValue,
  Link,
} from "@chakra-ui/react";
import {
  EyeIcon,
  EllipsisVerticalIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import type { OCPAdvisory } from "../types";
import { SEVERITY_CONFIG } from "../types";
import type { Id } from "@convex/_generated/dataModel";

interface AdvisoryTableProps {
  advisories: OCPAdvisory[] | undefined;
  isLoading?: boolean;
  onViewDetails: (advisoryId: Id<"ocpAdvisories">) => void;
}

export function AdvisoryTable({
  advisories,
  isLoading,
  onViewDetails,
}: AdvisoryTableProps) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getAdvisoryTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; colorScheme: string }> = {
      recall: { label: "Recall", colorScheme: "red" },
      safety_alert: { label: "Safety Alert", colorScheme: "orange" },
      contamination: { label: "Contamination", colorScheme: "purple" },
      labeling: { label: "Labeling", colorScheme: "blue" },
      other: { label: "Other", colorScheme: "gray" },
    };
    const config = typeConfig[type] || typeConfig.other;
    return (
      <Badge colorScheme={config.colorScheme} size="sm">
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Advisory</Th>
              <Th>Type</Th>
              <Th>Severity</Th>
              <Th>Published</Th>
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

  if (!advisories || advisories.length === 0) {
    return (
      <Box py={10} textAlign="center">
        <Text color="gray.500">No advisories found</Text>
      </Box>
    );
  }

  return (
    <Box overflowX="auto" data-tour="advisory-table">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th borderColor={borderColor}>Advisory</Th>
            <Th borderColor={borderColor}>Type</Th>
            <Th borderColor={borderColor}>Severity</Th>
            <Th borderColor={borderColor}>Published</Th>
            <Th borderColor={borderColor}>Status</Th>
            <Th borderColor={borderColor}>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {advisories.map((advisory, index) => {
            const severityConfig = SEVERITY_CONFIG[advisory.severity];
            return (
              <Tr
                key={advisory._id}
                _hover={{ bg: hoverBg }}
                cursor="pointer"
                onClick={() => onViewDetails(advisory._id)}
                data-tour={index === 0 ? "advisory-table-row" : undefined}
              >
                <Td borderColor={borderColor} maxW="300px">
                  <Flex direction="column" gap={1}>
                    <Text fontWeight="medium" noOfLines={1}>
                      {advisory.title}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      ID: {advisory.ocpAdvisoryId}
                    </Text>
                  </Flex>
                </Td>
                <Td borderColor={borderColor}>
                  {getAdvisoryTypeBadge(advisory.advisoryType)}
                </Td>
                <Td borderColor={borderColor}>
                  <Badge
                    colorScheme={
                      advisory.severity === "critical"
                        ? "red"
                        : advisory.severity === "high"
                        ? "orange"
                        : advisory.severity === "medium"
                        ? "yellow"
                        : "blue"
                    }
                  >
                    {severityConfig.label}
                  </Badge>
                </Td>
                <Td borderColor={borderColor}>
                  <Text fontSize="sm">{formatDate(advisory.publishedAt)}</Text>
                </Td>
                <Td borderColor={borderColor}>
                  <Badge
                    colorScheme={
                      advisory.status === "active"
                        ? "red"
                        : advisory.status === "resolved"
                        ? "green"
                        : advisory.status === "expired"
                        ? "gray"
                        : "yellow"
                    }
                  >
                    {advisory.status.charAt(0).toUpperCase() +
                      advisory.status.slice(1)}
                  </Badge>
                </Td>
                <Td borderColor={borderColor} onClick={(e) => e.stopPropagation()}>
                  <Flex gap={2}>
                    <IconButton
                      aria-label="View details"
                      icon={<EyeIcon width={16} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewDetails(advisory._id)}
                    />
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        aria-label="More options"
                        icon={<EllipsisVerticalIcon width={16} />}
                        size="sm"
                        variant="ghost"
                      />
                      <MenuList>
                        <MenuItem
                          icon={<EyeIcon width={16} />}
                          onClick={() => onViewDetails(advisory._id)}
                        >
                          View Details
                        </MenuItem>
                        <MenuItem
                          as={Link}
                          href={advisory.sourceUrl}
                          isExternal
                          icon={<ArrowTopRightOnSquareIcon width={16} />}
                        >
                          View Source
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Flex>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}
