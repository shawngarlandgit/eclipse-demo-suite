import {
  Box,
  Flex,
  Heading,
  HStack,
  Icon,
  Text,
  VStack,
  Badge,
  Link,
  Skeleton,
  SkeletonText,
  Divider,
  Select,
} from "@chakra-ui/react";
import {
  AlertTriangle,
  ExternalLink,
  FileText,
  Calendar,
  DollarSign,
  User,
} from "lucide-react";
import { useState } from "react";
import { useRecentViolations } from "../../hooks/useMaineData";

/**
 * Format date from Unix timestamp
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format currency
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Get badge color based on action type
 */
function getActionColor(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes("revoke")) return "red";
  if (lower.includes("suspend")) return "orange";
  return "yellow";
}

/**
 * Individual violation item
 */
interface ViolationItemProps {
  violation: {
    registrationNumber: string;
    registrantName: string;
    violationDate: number;
    action: string;
    settledFineAmount?: number;
    documentType?: string;
    documentUrl?: string;
  };
}

function ViolationItem({ violation }: ViolationItemProps) {
  return (
    <Box
      p={4}
      borderRadius="lg"
      bg="slate.700/30"
      border="1px solid"
      borderColor="slate.600/50"
      _hover={{ bg: "slate.700/50", borderColor: "slate.500" }}
      transition="all 0.2s"
    >
      <Flex justify="space-between" align="start">
        <HStack align="start" spacing={3}>
          {/* Icon */}
          <Box
            bg={getActionColor(violation.action) + ".500/20"}
            p={2}
            borderRadius="lg"
            mt={0.5}
          >
            <Icon
              as={AlertTriangle}
              boxSize={4}
              color={getActionColor(violation.action) + ".400"}
            />
          </Box>

          {/* Content */}
          <VStack align="start" spacing={1}>
            <HStack spacing={2}>
              <Text fontWeight="semibold" color="white" fontSize="sm">
                {violation.registrantName}
              </Text>
              <Badge
                colorScheme={getActionColor(violation.action)}
                fontSize="xs"
                borderRadius="md"
              >
                {violation.action}
              </Badge>
            </HStack>

            <HStack spacing={3} flexWrap="wrap">
              <HStack spacing={1}>
                <Icon as={User} boxSize={3} color="slate.500" />
                <Text fontSize="xs" color="slate.400">
                  {violation.registrationNumber}
                </Text>
              </HStack>

              <HStack spacing={1}>
                <Icon as={Calendar} boxSize={3} color="slate.500" />
                <Text fontSize="xs" color="slate.400">
                  {formatDate(violation.violationDate)}
                </Text>
              </HStack>

              {violation.settledFineAmount && violation.settledFineAmount > 0 && (
                <HStack spacing={1}>
                  <Icon as={DollarSign} boxSize={3} color="yellow.500" />
                  <Text fontSize="xs" color="yellow.400" fontWeight="medium">
                    {formatCurrency(violation.settledFineAmount)}
                  </Text>
                </HStack>
              )}
            </HStack>
          </VStack>
        </HStack>

        {/* Document Link */}
        {violation.documentUrl && (
          <Link
            href={violation.documentUrl}
            isExternal
            _hover={{ textDecoration: "none" }}
          >
            <HStack
              spacing={1}
              color="blue.400"
              fontSize="xs"
              _hover={{ color: "blue.300" }}
            >
              <Icon as={FileText} boxSize={3} />
              <Text>{violation.documentType || "View"}</Text>
              <Icon as={ExternalLink} boxSize={3} />
            </HStack>
          </Link>
        )}
      </Flex>
    </Box>
  );
}

/**
 * Loading skeleton for violation items
 */
function ViolationSkeleton() {
  return (
    <Box
      p={4}
      borderRadius="lg"
      bg="slate.700/30"
      border="1px solid"
      borderColor="slate.600/50"
    >
      <HStack spacing={3}>
        <Skeleton boxSize={8} borderRadius="lg" />
        <VStack align="start" spacing={2} flex={1}>
          <Skeleton height="16px" width="200px" />
          <SkeletonText noOfLines={1} width="150px" />
        </VStack>
      </HStack>
    </Box>
  );
}

/**
 * Compliance Feed Component
 *
 * Displays recent OCP enforcement actions (suspensions, revocations)
 * with links to official documentation.
 */
export function ComplianceFeed() {
  const [daysFilter, setDaysFilter] = useState(90);
  const { data: violations, isLoading } = useRecentViolations(daysFilter);

  return (
    <Box
      bg="slate.800"
      borderRadius="xl"
      border="1px solid"
      borderColor="slate.700"
      overflow="hidden"
      h="100%"
    >
      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        px={6}
        py={4}
        borderBottom="1px solid"
        borderColor="slate.700"
        bg="slate.800/50"
      >
        <HStack spacing={3}>
          <Box bg="orange.500/20" p={2} borderRadius="lg">
            <Icon as={AlertTriangle} boxSize={5} color="orange.400" />
          </Box>
          <VStack align="start" spacing={0}>
            <Heading size="sm" color="white">
              OCP Enforcement Actions
            </Heading>
            <Text fontSize="xs" color="slate.400">
              Maine Medical Use Program
            </Text>
          </VStack>
        </HStack>

        {/* Time Filter */}
        <Select
          size="sm"
          width="130px"
          bg="slate.700"
          border="none"
          color="slate.300"
          value={daysFilter}
          onChange={(e) => setDaysFilter(Number(e.target.value))}
          _hover={{ bg: "slate.600" }}
          _focus={{ bg: "slate.600", boxShadow: "none" }}
        >
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={180}>Last 6 months</option>
          <option value={365}>Last year</option>
        </Select>
      </Flex>

      {/* Violations List */}
      <Box p={4} maxH="500px" overflowY="auto">
        <VStack spacing={3} align="stretch">
          {isLoading ? (
            <>
              <ViolationSkeleton />
              <ViolationSkeleton />
              <ViolationSkeleton />
            </>
          ) : violations && violations.length > 0 ? (
            violations.map((violation, idx) => (
              <ViolationItem key={`${violation.registrationNumber}-${idx}`} violation={violation} />
            ))
          ) : (
            <Box textAlign="center" py={8}>
              <Icon as={AlertTriangle} boxSize={8} color="slate.500" mb={3} />
              <Text color="slate.400" fontSize="sm">
                No enforcement actions in the last {daysFilter} days
              </Text>
            </Box>
          )}
        </VStack>
      </Box>

      {/* Footer */}
      {violations && violations.length > 0 && (
        <Box
          px={6}
          py={3}
          borderTop="1px solid"
          borderColor="slate.700"
          bg="slate.800/50"
        >
          <HStack justify="space-between">
            <Text fontSize="xs" color="slate.500">
              {violations.length} action{violations.length !== 1 ? "s" : ""} found
            </Text>
            <Link
              href="https://www.maine.gov/dafs/ocp/open-data/medical-use/compliance-data"
              isExternal
              fontSize="xs"
              color="blue.400"
              _hover={{ color: "blue.300" }}
            >
              <HStack spacing={1}>
                <Text>View on OCP</Text>
                <Icon as={ExternalLink} boxSize={3} />
              </HStack>
            </Link>
          </HStack>
        </Box>
      )}
    </Box>
  );
}

export default ComplianceFeed;
