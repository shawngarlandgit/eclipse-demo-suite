/**
 * Resolution Workflow
 * Modal component for resolving compliance matches
 */

import { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import {
  RESOLUTION_ACTIONS,
  SEVERITY_CONFIG,
  STATUS_CONFIG,
} from "../types";
import type { EnrichedMatch, ResolutionAction, EnrichedResolutionLog } from "../types";
import type { Id } from "@convex/_generated/dataModel";

interface ResolutionWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  match: EnrichedMatch | null;
  auditTrail: EnrichedResolutionLog[] | undefined;
  onResolve: (params: {
    matchId: Id<"advisoryProductMatches">;
    resolutionAction: ResolutionAction;
    notes?: string;
    quantityResolved?: number;
  }) => Promise<void>;
  onDismiss: (params: {
    matchId: Id<"advisoryProductMatches">;
    reason: string;
  }) => Promise<void>;
  onLock: (params: { matchId: Id<"advisoryProductMatches"> }) => Promise<void>;
  onAcknowledge: (params: {
    matchId: Id<"advisoryProductMatches">;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function ResolutionWorkflow({
  isOpen,
  onClose,
  match,
  auditTrail,
  onResolve,
  onDismiss,
  onLock,
  onAcknowledge,
  isLoading,
}: ResolutionWorkflowProps) {
  const toast = useToast();
  const [selectedAction, setSelectedAction] = useState<ResolutionAction | "">("");
  const [notes, setNotes] = useState("");
  const [quantityResolved, setQuantityResolved] = useState<number | undefined>(
    undefined
  );
  const [dismissReason, setDismissReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResolve = async () => {
    if (!match || !selectedAction) return;

    setIsSubmitting(true);
    try {
      await onResolve({
        matchId: match._id,
        resolutionAction: selectedAction,
        notes: notes || undefined,
        quantityResolved,
      });
      toast({
        title: "Match resolved",
        description: "The compliance match has been resolved successfully.",
        status: "success",
        duration: 5000,
      });
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to resolve match",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    if (!match || !dismissReason) return;

    setIsSubmitting(true);
    try {
      await onDismiss({
        matchId: match._id,
        reason: dismissReason,
      });
      toast({
        title: "Match dismissed",
        description: "The match has been marked as a false positive.",
        status: "success",
        duration: 5000,
      });
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to dismiss match",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLock = async () => {
    if (!match) return;

    setIsSubmitting(true);
    try {
      await onLock({ matchId: match._id });
      toast({
        title: "Product locked",
        description: "The product has been locked from sales.",
        status: "success",
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to lock product",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!match) return;

    setIsSubmitting(true);
    try {
      await onAcknowledge({ matchId: match._id });
      toast({
        title: "Match acknowledged",
        description: "The match has been acknowledged and confirmed.",
        status: "success",
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to acknowledge match",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedAction("");
    setNotes("");
    setQuantityResolved(undefined);
    setDismissReason("");
    onClose();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!match) return null;

  const severityConfig = match.advisory
    ? SEVERITY_CONFIG[match.advisory.severity]
    : null;
  const statusConfig = STATUS_CONFIG[match.status];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="700px">
        <ModalHeader>
          Resolution Workflow
          <Text fontSize="sm" fontWeight="normal" color="gray.500" mt={1}>
            {match.product?.name}
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <Tabs>
            <TabList>
              <Tab>Details</Tab>
              <Tab>Resolve</Tab>
              <Tab>Dismiss</Tab>
              <Tab>Audit Trail</Tab>
            </TabList>

            <TabPanels>
              {/* Details Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {/* Match Info */}
                  <Box p={4} bg="gray.50" borderRadius="md">
                    <Text fontWeight="medium" mb={2}>
                      Match Information
                    </Text>
                    <HStack spacing={4} flexWrap="wrap">
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          Status
                        </Text>
                        <Badge
                          colorScheme={
                            match.status === "pending"
                              ? "yellow"
                              : match.status === "confirmed"
                              ? "red"
                              : match.status === "resolved"
                              ? "green"
                              : "gray"
                          }
                        >
                          {statusConfig.label}
                        </Badge>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          Confidence
                        </Text>
                        <Text fontWeight="medium">
                          {match.matchConfidence}%
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          Match Type
                        </Text>
                        <Text fontWeight="medium">
                          {match.matchType.replace("_", " ")}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          Matched Value
                        </Text>
                        <Text fontWeight="medium">{match.matchedValue}</Text>
                      </Box>
                    </HStack>
                  </Box>

                  {/* Advisory Info */}
                  {match.advisory && (
                    <Box p={4} bg="gray.50" borderRadius="md">
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="medium">Advisory Details</Text>
                        {severityConfig && (
                          <Badge
                            colorScheme={
                              match.advisory.severity === "critical"
                                ? "red"
                                : match.advisory.severity === "high"
                                ? "orange"
                                : match.advisory.severity === "medium"
                                ? "yellow"
                                : "blue"
                            }
                          >
                            {severityConfig.label}
                          </Badge>
                        )}
                      </HStack>
                      <Text fontWeight="medium">{match.advisory.title}</Text>
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        {match.advisory.description}
                      </Text>
                      {match.advisory.recommendedAction && (
                        <Alert status="info" mt={3} size="sm">
                          <AlertIcon />
                          <Text fontSize="sm">
                            <strong>Recommended Action:</strong>{" "}
                            {match.advisory.recommendedAction}
                          </Text>
                        </Alert>
                      )}
                    </Box>
                  )}

                  {/* Quick Actions */}
                  <HStack spacing={3}>
                    {match.status === "pending" && (
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={handleAcknowledge}
                        isLoading={isSubmitting}
                      >
                        Acknowledge Match
                      </Button>
                    )}
                    {match.status !== "resolved" && (
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={handleLock}
                        isLoading={isSubmitting}
                      >
                        Lock Product
                      </Button>
                    )}
                  </HStack>
                </VStack>
              </TabPanel>

              {/* Resolve Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>Resolution Action</FormLabel>
                    <Select
                      placeholder="Select action"
                      value={selectedAction}
                      onChange={(e) =>
                        setSelectedAction(e.target.value as ResolutionAction)
                      }
                    >
                      {Object.entries(RESOLUTION_ACTIONS).map(
                        ([value, config]) => (
                          <option key={value} value={value}>
                            {config.label}
                          </option>
                        )
                      )}
                    </Select>
                    {selectedAction && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {RESOLUTION_ACTIONS[selectedAction].description}
                      </Text>
                    )}
                  </FormControl>

                  {match.quantityAffected && (
                    <FormControl>
                      <FormLabel>Quantity Resolved</FormLabel>
                      <NumberInput
                        value={quantityResolved}
                        onChange={(_, val) => setQuantityResolved(val || undefined)}
                        max={match.quantityAffected}
                        min={0}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Total affected: {match.quantityAffected}
                      </Text>
                    </FormControl>
                  )}

                  <FormControl>
                    <FormLabel>Notes</FormLabel>
                    <Textarea
                      placeholder="Add resolution notes (required for audit)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </FormControl>

                  <Button
                    colorScheme="green"
                    onClick={handleResolve}
                    isLoading={isSubmitting}
                    isDisabled={!selectedAction}
                  >
                    Resolve Match
                  </Button>
                </VStack>
              </TabPanel>

              {/* Dismiss Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Alert status="warning">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Only dismiss if you've verified this is a false positive.
                      All dismissals are logged for audit purposes.
                    </Text>
                  </Alert>

                  <FormControl isRequired>
                    <FormLabel>Reason for Dismissal</FormLabel>
                    <Textarea
                      placeholder="Explain why this is a false positive..."
                      value={dismissReason}
                      onChange={(e) => setDismissReason(e.target.value)}
                      rows={4}
                    />
                  </FormControl>

                  <Button
                    colorScheme="gray"
                    onClick={handleDismiss}
                    isLoading={isSubmitting}
                    isDisabled={!dismissReason}
                  >
                    Mark as False Positive
                  </Button>
                </VStack>
              </TabPanel>

              {/* Audit Trail Tab */}
              <TabPanel data-tour="audit-trail">
                <VStack spacing={3} align="stretch">
                  {!auditTrail || auditTrail.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={4}>
                      No audit history yet
                    </Text>
                  ) : (
                    auditTrail.map((log, index) => (
                      <Box
                        key={log._id}
                        p={3}
                        bg="gray.50"
                        borderRadius="md"
                        borderLeft="3px solid"
                        borderLeftColor="blue.400"
                      >
                        <HStack justify="space-between" mb={1}>
                          <Text fontWeight="medium" fontSize="sm">
                            {log.action.replace("_", " ").toUpperCase()}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(log.createdAt)}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          By {log.userEmail} ({log.userRole})
                        </Text>
                        {log.previousStatus && log.newStatus && (
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            Status: {log.previousStatus} → {log.newStatus}
                          </Text>
                        )}
                        {log.notes && (
                          <Text fontSize="sm" mt={2} fontStyle="italic">
                            "{log.notes}"
                          </Text>
                        )}
                      </Box>
                    ))
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={handleClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
