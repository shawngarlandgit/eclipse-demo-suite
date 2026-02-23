/**
 * Product Flag Badge
 * Visual indicator for product compliance status in inventory views
 */

import {
  Badge,
  HStack,
  Tooltip,
  Icon,
  Text,
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  Button,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { SEVERITY_CONFIG } from "../types";
import type { ProductComplianceStatus, AdvisorySeverity } from "../types";
import type { Id } from "@convex/_generated/dataModel";

interface ProductFlagBadgeProps {
  /** Current compliance status */
  status: ProductComplianceStatus;
  /** Severity of the related advisory (if flagged) */
  severity?: AdvisorySeverity;
  /** Advisory title (for tooltip) */
  advisoryTitle?: string;
  /** Match ID (for resolution link) */
  matchId?: Id<"advisoryProductMatches">;
  /** Callback when clicking resolve */
  onResolve?: (matchId: Id<"advisoryProductMatches">) => void;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show only icon (compact mode) */
  iconOnly?: boolean;
}

const STATUS_DISPLAY: Record<
  ProductComplianceStatus,
  {
    label: string;
    colorScheme: string;
    icon: typeof ExclamationTriangleIcon;
    description: string;
  }
> = {
  clear: {
    label: "Clear",
    colorScheme: "green",
    icon: CheckCircleIcon,
    description: "No compliance issues",
  },
  flagged: {
    label: "Flagged",
    colorScheme: "orange",
    icon: ExclamationTriangleIcon,
    description: "Matches an active OCP advisory - review required",
  },
  locked: {
    label: "Locked",
    colorScheme: "red",
    icon: LockClosedIcon,
    description: "Product is locked from sale pending resolution",
  },
  under_review: {
    label: "Under Review",
    colorScheme: "yellow",
    icon: MagnifyingGlassIcon,
    description: "Currently being reviewed for compliance",
  },
};

export function ProductFlagBadge({
  status,
  severity,
  advisoryTitle,
  matchId,
  onResolve,
  size = "md",
  iconOnly = false,
}: ProductFlagBadgeProps) {
  const config = STATUS_DISPLAY[status];
  const severityConfig = severity ? SEVERITY_CONFIG[severity] : null;
  const popoverBg = useColorModeValue("white", "gray.800");

  // If status is clear, show nothing or a subtle indicator
  if (status === "clear") {
    if (iconOnly) return null;
    return (
      <Tooltip label="No compliance issues">
        <Badge colorScheme="green" variant="subtle" size={size}>
          <HStack spacing={1}>
            <Icon as={CheckCircleIcon} boxSize={size === "sm" ? 3 : 4} />
            <Text>Clear</Text>
          </HStack>
        </Badge>
      </Tooltip>
    );
  }

  const iconSize = size === "sm" ? 3 : size === "md" ? 4 : 5;
  const BadgeIcon = config.icon;

  // Icon-only mode with tooltip
  if (iconOnly) {
    return (
      <Tooltip
        label={
          <Box>
            <Text fontWeight="bold">{config.label}</Text>
            {advisoryTitle && <Text fontSize="xs">{advisoryTitle}</Text>}
          </Box>
        }
        hasArrow
      >
        <Box
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          p={1}
          borderRadius="md"
          bg={`${config.colorScheme}.100`}
          color={`${config.colorScheme}.600`}
          cursor="pointer"
        >
          <Icon as={BadgeIcon} boxSize={iconSize} />
        </Box>
      </Tooltip>
    );
  }

  // Full badge with popover for more details
  return (
    <Popover trigger="hover" placement="top">
      <PopoverTrigger>
        <Badge
          colorScheme={config.colorScheme}
          variant="solid"
          px={2}
          py={1}
          borderRadius="md"
          cursor="pointer"
          fontSize={size === "sm" ? "xs" : size === "md" ? "sm" : "md"}
        >
          <HStack spacing={1}>
            <Icon as={BadgeIcon} boxSize={iconSize} />
            <Text>{config.label}</Text>
            {severity && severityConfig && (
              <Badge
                ml={1}
                colorScheme={
                  severity === "critical"
                    ? "red"
                    : severity === "high"
                    ? "orange"
                    : severity === "medium"
                    ? "yellow"
                    : "blue"
                }
                variant="subtle"
                fontSize="xs"
              >
                {severityConfig.label}
              </Badge>
            )}
          </HStack>
        </Badge>
      </PopoverTrigger>
      <PopoverContent bg={popoverBg} maxW="300px">
        <PopoverArrow bg={popoverBg} />
        <PopoverHeader fontWeight="bold" borderBottomWidth="1px">
          <HStack>
            <Icon as={ShieldExclamationIcon} color={`${config.colorScheme}.500`} />
            <Text>Compliance Alert</Text>
          </HStack>
        </PopoverHeader>
        <PopoverBody>
          <VStack align="stretch" spacing={3}>
            <Text fontSize="sm" color="gray.600">
              {config.description}
            </Text>
            {advisoryTitle && (
              <Box p={2} bg="gray.50" borderRadius="md">
                <Text fontSize="xs" fontWeight="medium" color="gray.500">
                  Related Advisory:
                </Text>
                <Text fontSize="sm">{advisoryTitle}</Text>
              </Box>
            )}
            {matchId && onResolve && status !== "clear" && (
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => onResolve(matchId)}
              >
                Review & Resolve
              </Button>
            )}
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Compact version for table cells
 */
export function ProductFlagIcon({
  status,
  severity,
}: {
  status: ProductComplianceStatus;
  severity?: AdvisorySeverity;
}) {
  return (
    <ProductFlagBadge status={status} severity={severity} iconOnly size="sm" />
  );
}

/**
 * Status indicator dot for lists
 */
export function ComplianceStatusDot({
  status,
}: {
  status: ProductComplianceStatus;
}) {
  const config = STATUS_DISPLAY[status];

  return (
    <Tooltip label={config.label}>
      <Box
        w={2}
        h={2}
        borderRadius="full"
        bg={`${config.colorScheme}.500`}
        display="inline-block"
      />
    </Tooltip>
  );
}
