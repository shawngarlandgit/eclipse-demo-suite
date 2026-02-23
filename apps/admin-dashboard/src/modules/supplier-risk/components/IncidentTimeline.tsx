/**
 * Incident Timeline
 * Visual timeline of supplier incidents
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Flex,
  useColorModeValue,
  Divider,
} from "@chakra-ui/react";
import {
  ExclamationTriangleIcon,
  BeakerIcon,
  DocumentTextIcon,
  TagIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import type { EnrichedIncident, IncidentType, IncidentSeverity } from "../types";
import { INCIDENT_TYPE_LABELS, SEVERITY_CONFIGS } from "../types";

interface IncidentTimelineProps {
  incidents: EnrichedIncident[] | undefined;
  isLoading?: boolean;
  maxItems?: number;
}

export function IncidentTimeline({
  incidents,
  isLoading,
  maxItems,
}: IncidentTimelineProps) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bgColor = useColorModeValue("white", "gray.800");

  const getIncidentIcon = (type: IncidentType) => {
    const icons = {
      contamination: BeakerIcon,
      recall: ExclamationTriangleIcon,
      labeling: TagIcon,
      quality: ExclamationTriangleIcon,
      documentation: DocumentTextIcon,
      other: QuestionMarkCircleIcon,
    };
    return icons[type];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Box p={4}>
        <Text color="gray.500">Loading incidents...</Text>
      </Box>
    );
  }

  if (!incidents || incidents.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Icon as={CheckCircleIcon} boxSize={8} color="green.500" mb={2} />
        <Text color="gray.500">No incidents recorded</Text>
      </Box>
    );
  }

  const displayIncidents = maxItems ? incidents.slice(0, maxItems) : incidents;

  return (
    <VStack spacing={0} align="stretch" data-tour="incident-timeline">
      {displayIncidents.map((incident, index) => (
        <Box key={incident._id} position="relative">
          {/* Timeline line */}
          {index < displayIncidents.length - 1 && (
            <Box
              position="absolute"
              left="19px"
              top="40px"
              bottom="-8px"
              width="2px"
              bg={borderColor}
            />
          )}

          <HStack align="flex-start" spacing={4} py={3}>
            {/* Icon */}
            <Box
              p={2}
              borderRadius="full"
              bg={useColorModeValue(
                SEVERITY_CONFIGS[incident.severity].bgColor,
                `${SEVERITY_CONFIGS[incident.severity].color.split(".")[0]}.900`
              )}
              position="relative"
              zIndex={1}
            >
              <Icon
                as={getIncidentIcon(incident.incidentType)}
                boxSize={5}
                color={SEVERITY_CONFIGS[incident.severity].color}
              />
            </Box>

            {/* Content */}
            <Box flex={1}>
              <Flex justify="space-between" align="flex-start" mb={1}>
                <Text fontWeight="medium" fontSize="sm">
                  {incident.title}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {formatDate(incident.incidentDate)}
                </Text>
              </Flex>

              <HStack spacing={2} mb={2}>
                <Badge
                  colorScheme={
                    incident.severity === "critical"
                      ? "red"
                      : incident.severity === "high"
                      ? "orange"
                      : incident.severity === "medium"
                      ? "yellow"
                      : "blue"
                  }
                  variant="subtle"
                  fontSize="xs"
                >
                  {SEVERITY_CONFIGS[incident.severity].label}
                </Badge>
                <Badge variant="outline" fontSize="xs">
                  {INCIDENT_TYPE_LABELS[incident.incidentType]}
                </Badge>
                {incident.resolvedAt && (
                  <Badge colorScheme="green" variant="subtle" fontSize="xs">
                    Resolved
                  </Badge>
                )}
              </HStack>

              <Text fontSize="sm" color="gray.600" noOfLines={2}>
                {incident.description}
              </Text>

              {incident.contaminants && incident.contaminants.length > 0 && (
                <HStack mt={2} flexWrap="wrap" gap={1}>
                  <Text fontSize="xs" color="gray.500">
                    Contaminants:
                  </Text>
                  {incident.contaminants.map((c) => (
                    <Badge key={c} colorScheme="red" variant="outline" fontSize="xs">
                      {c}
                    </Badge>
                  ))}
                </HStack>
              )}

              {incident.advisory && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Source: OCP Advisory {incident.advisory.ocpAdvisoryId}
                </Text>
              )}
            </Box>
          </HStack>

          {index < displayIncidents.length - 1 && (
            <Divider ml="40px" />
          )}
        </Box>
      ))}

      {maxItems && incidents.length > maxItems && (
        <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
          +{incidents.length - maxItems} more incidents
        </Text>
      )}
    </VStack>
  );
}
