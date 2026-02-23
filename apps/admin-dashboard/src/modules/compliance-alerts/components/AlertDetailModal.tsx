/**
 * Alert Detail Modal
 * Slide-out drawer showing full advisory details with matches and audit trail
 */

import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Divider,
  Button,
  Link,
  Flex,
  Heading,
  List,
  ListItem,
  ListIcon,
  useColorModeValue,
  Skeleton,
  SkeletonText,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BeakerIcon,
  LinkIcon,
  DocumentTextIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import {
  SEVERITY_CONFIG,
  STATUS_CONFIG,
} from "../types";
import type { OCPAdvisory, AdvisoryProductMatch, ComplianceResolutionLog } from "../types";
import type { Id } from "@convex/_generated/dataModel";

interface AlertDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisory: OCPAdvisory | null;
  matches?: AdvisoryProductMatch[];
  auditTrail?: ComplianceResolutionLog[];
  isLoading?: boolean;
  onResolveMatch?: (matchId: Id<"advisoryProductMatches">) => void;
}

export function AlertDetailModal({
  isOpen,
  onClose,
  advisory,
  matches = [],
  auditTrail = [],
  isLoading = false,
  onResolveMatch,
}: AlertDetailModalProps) {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const mutedColor = useColorModeValue("gray.600", "gray.400");

  if (!advisory && !isLoading) {
    return null;
  }

  const severityConfig = advisory ? SEVERITY_CONFIG[advisory.severity] : null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} size="lg" placement="right">
      <DrawerOverlay />
      <DrawerContent bg={bgColor}>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          {isLoading ? (
            <Skeleton height="24px" width="200px" />
          ) : (
            <VStack align="start" spacing={2}>
              <HStack>
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
                  fontSize="sm"
                  px={2}
                  py={1}
                >
                  {severityConfig?.label}
                </Badge>
                <Badge
                  variant="outline"
                  colorScheme={advisory?.status === "active" ? "red" : "gray"}
                >
                  {advisory?.status}
                </Badge>
              </HStack>
              <Text fontSize="lg" fontWeight="bold">
                {advisory?.title}
              </Text>
              <Text fontSize="sm" color={mutedColor}>
                {advisory?.ocpAdvisoryId}
              </Text>
            </VStack>
          )}
        </DrawerHeader>

        <DrawerBody>
          {isLoading ? (
            <VStack spacing={4} align="stretch">
              <SkeletonText noOfLines={4} />
              <Skeleton height="100px" />
              <SkeletonText noOfLines={3} />
            </VStack>
          ) : (
            <VStack spacing={6} align="stretch">
              {/* Description */}
              <Box>
                <Heading size="sm" mb={2}>
                  Description
                </Heading>
                <Text color={mutedColor}>{advisory?.description}</Text>
              </Box>

              {/* Key Dates */}
              <Box>
                <Heading size="sm" mb={2}>
                  Timeline
                </Heading>
                <VStack align="stretch" spacing={2}>
                  <HStack>
                    <ClockIcon width={16} />
                    <Text fontSize="sm">
                      Published:{" "}
                      {advisory?.publishedAt
                        ? format(advisory.publishedAt, "MMM d, yyyy h:mm a")
                        : "N/A"}
                    </Text>
                  </HStack>
                  {advisory?.expiresAt && (
                    <HStack>
                      <ClockIcon width={16} />
                      <Text fontSize="sm">
                        Expires: {format(advisory.expiresAt, "MMM d, yyyy")}
                      </Text>
                    </HStack>
                  )}
                  {advisory?.processedAt && (
                    <HStack>
                      <CheckCircleIcon width={16} />
                      <Text fontSize="sm">
                        Processed:{" "}
                        {format(advisory.processedAt, "MMM d, yyyy h:mm a")}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </Box>

              {/* Affected Items */}
              <Accordion allowMultiple defaultIndex={[0]}>
                {/* Affected Products */}
                {advisory?.affectedProducts &&
                  advisory.affectedProducts.length > 0 && (
                    <AccordionItem border="1px" borderColor={borderColor} borderRadius="md" mb={2}>
                      <AccordionButton>
                        <HStack flex="1">
                          <CubeIcon width={16} />
                          <Text fontWeight="medium">
                            Affected Products ({advisory.affectedProducts.length})
                          </Text>
                        </HStack>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel>
                        <List spacing={1}>
                          {advisory.affectedProducts.map((product, idx) => (
                            <ListItem key={idx} fontSize="sm">
                              <ListIcon as={ExclamationTriangleIcon} color="orange.500" />
                              {product}
                            </ListItem>
                          ))}
                        </List>
                      </AccordionPanel>
                    </AccordionItem>
                  )}

                {/* Affected Strains */}
                {advisory?.affectedStrains &&
                  advisory.affectedStrains.length > 0 && (
                    <AccordionItem border="1px" borderColor={borderColor} borderRadius="md" mb={2}>
                      <AccordionButton>
                        <HStack flex="1">
                          <BeakerIcon width={16} />
                          <Text fontWeight="medium">
                            Affected Strains ({advisory.affectedStrains.length})
                          </Text>
                        </HStack>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel>
                        <List spacing={1}>
                          {advisory.affectedStrains.map((strain, idx) => (
                            <ListItem key={idx} fontSize="sm">
                              <ListIcon as={ExclamationTriangleIcon} color="orange.500" />
                              {strain}
                            </ListItem>
                          ))}
                        </List>
                      </AccordionPanel>
                    </AccordionItem>
                  )}

                {/* Contaminants */}
                {advisory?.contaminants && advisory.contaminants.length > 0 && (
                  <AccordionItem border="1px" borderColor={borderColor} borderRadius="md" mb={2}>
                    <AccordionButton>
                      <HStack flex="1">
                        <BeakerIcon width={16} />
                        <Text fontWeight="medium" color="red.500">
                          Contaminants ({advisory.contaminants.length})
                        </Text>
                      </HStack>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <List spacing={1}>
                        {advisory.contaminants.map((contaminant, idx) => (
                          <ListItem key={idx} fontSize="sm" color="red.600">
                            <ListIcon as={ExclamationTriangleIcon} color="red.500" />
                            {contaminant}
                          </ListItem>
                        ))}
                      </List>
                    </AccordionPanel>
                  </AccordionItem>
                )}
              </Accordion>

              {/* Recommended Action */}
              {advisory?.recommendedAction && (
                <Box
                  p={4}
                  bg={useColorModeValue("blue.50", "blue.900")}
                  borderRadius="md"
                  border="1px"
                  borderColor="blue.200"
                >
                  <Heading size="sm" mb={2} color="blue.600">
                    Recommended Action
                  </Heading>
                  <Text fontSize="sm">{advisory.recommendedAction}</Text>
                </Box>
              )}

              {/* Regulatory Reference */}
              {advisory?.regulatoryReference && (
                <Box>
                  <Heading size="sm" mb={2}>
                    Regulatory Reference
                  </Heading>
                  <HStack>
                    <DocumentTextIcon width={16} />
                    <Text fontSize="sm" color={mutedColor}>
                      {advisory.regulatoryReference}
                    </Text>
                  </HStack>
                </Box>
              )}

              {/* Source Link */}
              {advisory?.sourceUrl && (
                <Box>
                  <Heading size="sm" mb={2}>
                    Source
                  </Heading>
                  <Link
                    href={advisory.sourceUrl}
                    isExternal
                    color="blue.500"
                    fontSize="sm"
                  >
                    <HStack>
                      <LinkIcon width={16} />
                      <Text>View Original Advisory</Text>
                    </HStack>
                  </Link>
                </Box>
              )}

              <Divider />

              {/* Matched Products in Your Inventory */}
              {matches.length > 0 && (
                <Box>
                  <Heading size="sm" mb={3}>
                    Matched Products ({matches.length})
                  </Heading>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Match Type</Th>
                        <Th>Matched Value</Th>
                        <Th>Confidence</Th>
                        <Th>Status</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {matches.map((match) => {
                        const statusConfig = STATUS_CONFIG[match.status];
                        return (
                          <Tr key={match._id}>
                            <Td>
                              <Badge variant="outline" size="sm">
                                {match.matchType.replace("_", " ")}
                              </Badge>
                            </Td>
                            <Td>
                              <Text fontSize="sm" fontWeight="medium">
                                {match.matchedValue}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm">{match.matchConfidence}%</Text>
                            </Td>
                            <Td>
                              <Badge colorScheme={statusConfig.color.split(".")[0]}>
                                {statusConfig.label}
                              </Badge>
                            </Td>
                            <Td>
                              {match.status !== "resolved" &&
                                match.status !== "false_positive" &&
                                onResolveMatch && (
                                  <Button
                                    size="xs"
                                    colorScheme="blue"
                                    onClick={() => onResolveMatch(match._id)}
                                  >
                                    Resolve
                                  </Button>
                                )}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              )}

              {/* Audit Trail */}
              {auditTrail.length > 0 && (
                <Box>
                  <Heading size="sm" mb={3}>
                    Resolution History
                  </Heading>
                  <VStack align="stretch" spacing={2}>
                    {auditTrail.map((log) => (
                      <Box
                        key={log._id}
                        p={3}
                        bg={useColorModeValue("gray.50", "gray.700")}
                        borderRadius="md"
                        fontSize="sm"
                      >
                        <Flex justify="space-between" align="start">
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Badge>{log.action}</Badge>
                              {log.previousStatus && log.newStatus && (
                                <Text color={mutedColor}>
                                  {log.previousStatus} → {log.newStatus}
                                </Text>
                              )}
                            </HStack>
                            <Text color={mutedColor}>
                              by {log.userEmail} ({log.userRole})
                            </Text>
                            {log.notes && <Text>{log.notes}</Text>}
                          </VStack>
                          <Text fontSize="xs" color={mutedColor}>
                            {format(log.createdAt, "MMM d, h:mm a")}
                          </Text>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          )}
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px">
          <Button variant="outline" mr={3} onClick={onClose}>
            Close
          </Button>
          {advisory?.sourceUrl && (
            <Button
              as={Link}
              href={advisory.sourceUrl}
              isExternal
              colorScheme="blue"
              leftIcon={<LinkIcon width={16} />}
            >
              View OCP Source
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
