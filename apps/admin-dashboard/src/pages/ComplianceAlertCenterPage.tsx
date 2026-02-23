/**
 * Compliance Alert Center Page
 * Main page for managing OCP advisories and compliance alerts
 */

import { useState, useCallback } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  Select,
  Button,
  useDisclosure,
  Badge,
  Flex,
  useColorModeValue,
  Alert,
  AlertIcon,
  Skeleton,
} from "@chakra-ui/react";
import { ArrowPathIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { useCurrentDispensary } from "../hooks/useAuth";
import { StartDemoButton } from "../features/walkthrough";
import {
  useComplianceAlertCenter,
  useAdvisories,
  useResolutionWorkflow,
  useResolveMatch,
  useDismissMatch,
  useLockProduct,
  useAcknowledgeMatch,
  useResolutionAuditTrail,
} from "../modules/compliance-alerts/hooks/useComplianceAlerts";
import { AlertSummaryCards } from "../modules/compliance-alerts/components/AlertSummaryCards";
import { AdvisoryTable } from "../modules/compliance-alerts/components/AdvisoryTable";
import { FlaggedProductsTable } from "../modules/compliance-alerts/components/FlaggedProductsTable";
import { ResolutionWorkflow } from "../modules/compliance-alerts/components/ResolutionWorkflow";
import { ComplianceReportGenerator } from "../modules/compliance-alerts/components/ComplianceReportGenerator";
import type {
  AdvisorySeverity,
  AdvisoryStatus,
  EnrichedMatch,
} from "../modules/compliance-alerts/types";
import type { Id } from "@convex/_generated/dataModel";

export default function ComplianceAlertCenterPage() {
  const { dispensaryId, isLoading: dispensaryLoading } = useCurrentDispensary();
  const [severityFilter, setSeverityFilter] = useState<AdvisorySeverity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AdvisoryStatus | "all">("all");
  const [selectedMatch, setSelectedMatch] = useState<EnrichedMatch | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  // Data queries
  const { summary, activeAlerts, flaggedProducts, matches, unreadCount, isLoading } =
    useComplianceAlertCenter(dispensaryId ?? undefined);

  const advisories = useAdvisories(
    {
      status: statusFilter !== "all" ? statusFilter : undefined,
      severity: severityFilter !== "all" ? severityFilter : undefined,
    },
    50
  );

  const auditTrail = useResolutionAuditTrail(
    dispensaryId ?? undefined,
    selectedMatch ? { matchId: selectedMatch._id } : undefined
  );

  // Mutations
  const resolveMatch = useResolveMatch();
  const dismissMatch = useDismissMatch();
  const lockProduct = useLockProduct();
  const acknowledgeMatch = useAcknowledgeMatch();

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  // Handlers
  const handleViewAdvisoryDetails = useCallback((advisoryId: Id<"ocpAdvisories">) => {
    // TODO: Implement advisory detail view/modal
    console.log("View advisory:", advisoryId);
  }, []);

  const handleViewProductDetails = useCallback((productId: Id<"products">) => {
    // TODO: Navigate to product detail page or open modal
    console.log("View product:", productId);
  }, []);

  const handleResolveProduct = useCallback(
    (matchId: Id<"advisoryProductMatches">) => {
      // Find the match and open resolution modal
      const match = flaggedProducts?.find(
        (p) => p.complianceMatch?._id === matchId
      );
      if (match?.complianceMatch) {
        setSelectedMatch({
          ...match.complianceMatch,
          advisory: match.advisory,
          product: match,
        });
        onOpen();
      }
    },
    [flaggedProducts, onOpen]
  );

  const handleResolve = async (params: {
    matchId: Id<"advisoryProductMatches">;
    resolutionAction: any;
    notes?: string;
    quantityResolved?: number;
  }) => {
    await resolveMatch(params);
    setSelectedMatch(null);
  };

  const handleDismiss = async (params: {
    matchId: Id<"advisoryProductMatches">;
    reason: string;
  }) => {
    await dismissMatch(params);
    setSelectedMatch(null);
  };

  const handleLock = async (params: { matchId: Id<"advisoryProductMatches"> }) => {
    await lockProduct(params);
  };

  const handleAcknowledge = async (params: {
    matchId: Id<"advisoryProductMatches">;
  }) => {
    await acknowledgeMatch(params);
  };

  if (dispensaryLoading) {
    return (
      <Box minH="100vh" bg={bgColor} p={6}>
        <Container maxW="container.xl">
          <Skeleton height="40px" mb={4} />
          <Skeleton height="200px" />
        </Container>
      </Box>
    );
  }

  if (!dispensaryId) {
    return (
      <Box minH="100vh" bg={bgColor} p={6}>
        <Container maxW="container.xl">
          <Alert status="warning">
            <AlertIcon />
            Please select a dispensary to view compliance alerts.
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={6}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6} data-tour="compliance-page-header">
          <Box>
            <Heading size="lg" mb={1}>
              Compliance Alert Center
            </Heading>
            <Text color="gray.500">
              Monitor and resolve OCP advisories affecting your inventory
            </Text>
          </Box>
          <HStack spacing={3}>
            {unreadCount !== undefined && unreadCount > 0 && (
              <Badge colorScheme="red" fontSize="md" px={3} py={1} borderRadius="full">
                {unreadCount} unread
              </Badge>
            )}
            <StartDemoButton />
            <Button
              leftIcon={<ArrowPathIcon width={16} />}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
          </HStack>
        </Flex>

        {/* Critical Alerts Banner */}
        {summary && summary.criticalCount > 0 && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">
                {summary.criticalCount} Critical Alert
                {summary.criticalCount > 1 ? "s" : ""} Require Immediate Attention
              </Text>
              <Text fontSize="sm">
                Products may need to be pulled from inventory immediately.
              </Text>
            </Box>
          </Alert>
        )}

        {/* Summary Cards */}
        <Box mb={6}>
          <AlertSummaryCards summary={summary} isLoading={isLoading} />
        </Box>

        {/* Main Content Tabs */}
        <Box bg={cardBg} borderRadius="lg" shadow="sm" overflow="hidden">
          <Tabs>
            <TabList px={4} pt={2}>
              <Tab>
                Active Alerts
                {summary && summary.totalActiveMatches > 0 && (
                  <Badge ml={2} colorScheme="red">
                    {summary.totalActiveMatches}
                  </Badge>
                )}
              </Tab>
              <Tab data-tour="flagged-products-tab">
                Flagged Products
                {summary && summary.productsAffected > 0 && (
                  <Badge ml={2} colorScheme="orange">
                    {summary.productsAffected}
                  </Badge>
                )}
              </Tab>
              <Tab>All Advisories</Tab>
              <Tab>Reports</Tab>
            </TabList>

            <TabPanels>
              {/* Active Alerts Tab */}
              <TabPanel>
                <Box mb={4}>
                  <HStack spacing={4}>
                    <HStack>
                      <FunnelIcon width={16} />
                      <Text fontSize="sm" fontWeight="medium">
                        Filters:
                      </Text>
                    </HStack>
                    <Select
                      size="sm"
                      maxW="150px"
                      value={severityFilter}
                      onChange={(e) =>
                        setSeverityFilter(e.target.value as AdvisorySeverity | "all")
                      }
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </Select>
                    <Select
                      size="sm"
                      maxW="150px"
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as AdvisoryStatus | "all")
                      }
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="resolved">Resolved</option>
                      <option value="expired">Expired</option>
                    </Select>
                  </HStack>
                </Box>
                <AdvisoryTable
                  advisories={activeAlerts}
                  isLoading={isLoading}
                  onViewDetails={handleViewAdvisoryDetails}
                />
              </TabPanel>

              {/* Flagged Products Tab */}
              <TabPanel>
                <FlaggedProductsTable
                  products={flaggedProducts}
                  isLoading={isLoading}
                  onResolve={handleResolveProduct}
                  onViewDetails={handleViewProductDetails}
                />
              </TabPanel>

              {/* All Advisories Tab */}
              <TabPanel>
                <Box mb={4}>
                  <HStack spacing={4}>
                    <HStack>
                      <FunnelIcon width={16} />
                      <Text fontSize="sm" fontWeight="medium">
                        Filters:
                      </Text>
                    </HStack>
                    <Select
                      size="sm"
                      maxW="150px"
                      value={severityFilter}
                      onChange={(e) =>
                        setSeverityFilter(e.target.value as AdvisorySeverity | "all")
                      }
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </Select>
                    <Select
                      size="sm"
                      maxW="150px"
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as AdvisoryStatus | "all")
                      }
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="resolved">Resolved</option>
                      <option value="expired">Expired</option>
                      <option value="dismissed">Dismissed</option>
                    </Select>
                  </HStack>
                </Box>
                <AdvisoryTable
                  advisories={advisories}
                  isLoading={advisories === undefined}
                  onViewDetails={handleViewAdvisoryDetails}
                />
              </TabPanel>

              {/* Reports Tab */}
              <TabPanel>
                <ComplianceReportGenerator dispensaryId={dispensaryId} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Container>

      {/* Resolution Workflow Modal */}
      <ResolutionWorkflow
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setSelectedMatch(null);
        }}
        match={selectedMatch}
        auditTrail={auditTrail}
        onResolve={handleResolve}
        onDismiss={handleDismiss}
        onLock={handleLock}
        onAcknowledge={handleAcknowledge}
      />
    </Box>
  );
}
