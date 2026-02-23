/**
 * Supplier Detail Modal
 * Full profile view of a supplier's risk data
 */

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Flex,
  Spinner,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import type { Id } from "@convex/_generated/dataModel";
import { useSupplierProfile, useIncidentHistory } from "../hooks/useSupplierRisk";
import { RiskScoreCard } from "./RiskScoreCard";
import { IncidentTimeline } from "./IncidentTimeline";
import {
  TIER_CONFIGS,
  INCIDENT_TYPE_LABELS,
  LICENSE_TYPE_LABELS,
  formatDaysSinceIncident,
} from "../types";

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: Id<"suppliers"> | null;
  dispensaryId: Id<"dispensaries"> | undefined;
}

export function SupplierDetailModal({
  isOpen,
  onClose,
  supplierId,
  dispensaryId,
}: SupplierDetailModalProps) {
  const profile = useSupplierProfile(supplierId ?? undefined, dispensaryId);
  const incidents = useIncidentHistory(supplierId ?? undefined, dispensaryId, 50);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const isLoading = profile === undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={bgColor} maxH="90vh">
        <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
          <HStack spacing={3}>
            <Icon as={BuildingOfficeIcon} boxSize={6} />
            <Box>
              <Text>{profile?.supplier?.name ?? "Supplier Details"}</Text>
              <Text fontSize="sm" fontWeight="normal" color="gray.500">
                {profile?.supplier?.licenseNumber}
              </Text>
            </Box>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={6}>
          {isLoading ? (
            <Flex justify="center" py={10}>
              <Spinner size="lg" />
            </Flex>
          ) : !profile ? (
            <Text color="gray.500" textAlign="center">
              Supplier not found
            </Text>
          ) : (
            <VStack spacing={6} align="stretch">
              {/* Risk Score Header */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {/* Risk Score */}
                <Box
                  bg={cardBg}
                  p={6}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  textAlign="center"
                >
                  {profile.profile ? (
                    <RiskScoreCard
                      score={profile.profile.riskScore}
                      tier={profile.profile.riskTier}
                      trend={profile.profile.trend}
                      trendDirection={profile.profile.trendDirection}
                      scoreChange={profile.profile.scoreChange}
                      size="lg"
                    />
                  ) : (
                    <VStack>
                      <Text fontSize="3xl" fontWeight="bold" color="green.500">
                        0
                      </Text>
                      <Badge colorScheme="green">No Risk Data</Badge>
                    </VStack>
                  )}
                </Box>

                {/* Incident Counts */}
                <Box
                  bg={cardBg}
                  p={6}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Text fontWeight="medium" mb={4}>
                    Incident Breakdown
                  </Text>
                  <SimpleGrid columns={2} spacing={3}>
                    {Object.entries(profile.incidentCounts).map(([type, count]) => (
                      <HStack key={type} justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          {INCIDENT_TYPE_LABELS[type as keyof typeof INCIDENT_TYPE_LABELS]}
                        </Text>
                        <Text fontWeight="medium">{count}</Text>
                      </HStack>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Metrics */}
                <Box
                  bg={cardBg}
                  p={6}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Text fontWeight="medium" mb={4}>
                    Key Metrics
                  </Text>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Total Batches
                      </Text>
                      <Text fontWeight="medium">
                        {profile.profile?.totalBatches ?? 0}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Incident Rate
                      </Text>
                      <Text fontWeight="medium">
                        {profile.profile?.incidentRate?.toFixed(1) ?? 0}%
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Last Incident
                      </Text>
                      <Text fontWeight="medium">
                        {formatDaysSinceIncident(profile.profile?.daysSinceLastIncident)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Products
                      </Text>
                      <Text fontWeight="medium">{profile.products.length}</Text>
                    </HStack>
                  </VStack>
                </Box>
              </SimpleGrid>

              {/* Tabs */}
              <Tabs colorScheme="blue" variant="enclosed">
                <TabList>
                  <Tab>Incidents ({incidents?.length ?? 0})</Tab>
                  <Tab>Products ({profile.products.length})</Tab>
                  <Tab>Contact Info</Tab>
                </TabList>

                <TabPanels>
                  {/* Incidents Tab */}
                  <TabPanel px={0}>
                    <Box
                      bg={cardBg}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={borderColor}
                      p={4}
                    >
                      <IncidentTimeline incidents={incidents} />
                    </Box>
                  </TabPanel>

                  {/* Products Tab */}
                  <TabPanel px={0}>
                    <Box
                      bg={cardBg}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={borderColor}
                      overflowX="auto"
                    >
                      {profile.products.length === 0 ? (
                        <Text p={4} color="gray.500" textAlign="center">
                          No products linked to this supplier
                        </Text>
                      ) : (
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Product</Th>
                              <Th>SKU</Th>
                              <Th>Category</Th>
                              <Th>Brand</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {profile.products.map((product) => (
                              <Tr key={product._id}>
                                <Td fontWeight="medium">{product.name}</Td>
                                <Td>{product.sku}</Td>
                                <Td>
                                  <Badge variant="subtle">{product.category}</Badge>
                                </Td>
                                <Td>{product.brand ?? "-"}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </Box>
                  </TabPanel>

                  {/* Contact Tab */}
                  <TabPanel px={0}>
                    <Box
                      bg={cardBg}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={borderColor}
                      p={6}
                    >
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <VStack align="stretch" spacing={4}>
                          <HStack spacing={3}>
                            <Icon as={DocumentTextIcon} boxSize={5} color="gray.500" />
                            <Box>
                              <Text fontSize="xs" color="gray.500">
                                License Type
                              </Text>
                              <Text fontWeight="medium">
                                {profile.supplier?.licenseType
                                  ? LICENSE_TYPE_LABELS[profile.supplier.licenseType]
                                  : "Unknown"}
                              </Text>
                            </Box>
                          </HStack>

                          <HStack spacing={3}>
                            <Icon as={MapPinIcon} boxSize={5} color="gray.500" />
                            <Box>
                              <Text fontSize="xs" color="gray.500">
                                Address
                              </Text>
                              <Text fontWeight="medium">
                                {profile.supplier?.address ?? "Not provided"}
                              </Text>
                              {profile.supplier?.city && (
                                <Text fontSize="sm" color="gray.600">
                                  {profile.supplier.city}, {profile.supplier.state}
                                </Text>
                              )}
                            </Box>
                          </HStack>
                        </VStack>

                        <VStack align="stretch" spacing={4}>
                          <HStack spacing={3}>
                            <Icon as={EnvelopeIcon} boxSize={5} color="gray.500" />
                            <Box>
                              <Text fontSize="xs" color="gray.500">
                                Email
                              </Text>
                              <Text fontWeight="medium">
                                {profile.supplier?.contactEmail ?? "Not provided"}
                              </Text>
                            </Box>
                          </HStack>

                          <HStack spacing={3}>
                            <Icon as={PhoneIcon} boxSize={5} color="gray.500" />
                            <Box>
                              <Text fontSize="xs" color="gray.500">
                                Phone
                              </Text>
                              <Text fontWeight="medium">
                                {profile.supplier?.contactPhone ?? "Not provided"}
                              </Text>
                            </Box>
                          </HStack>

                          {profile.supplier?.website && (
                            <HStack spacing={3}>
                              <Icon as={GlobeAltIcon} boxSize={5} color="gray.500" />
                              <Box>
                                <Text fontSize="xs" color="gray.500">
                                  Website
                                </Text>
                                <Text fontWeight="medium" color="blue.500">
                                  {profile.supplier.website}
                                </Text>
                              </Box>
                            </HStack>
                          )}
                        </VStack>
                      </SimpleGrid>

                      {profile.supplier?.notes && (
                        <Box mt={6} pt={4} borderTopWidth="1px" borderColor={borderColor}>
                          <Text fontSize="xs" color="gray.500" mb={2}>
                            Notes
                          </Text>
                          <Text>{profile.supplier.notes}</Text>
                        </Box>
                      )}
                    </Box>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
