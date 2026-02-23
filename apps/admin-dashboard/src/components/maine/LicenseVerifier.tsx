import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  VStack,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Skeleton,
  Divider,
  Link,
  useToast,
} from "@chakra-ui/react";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Users,
  Store,
  Calendar,
  MapPin,
  FileText,
  ExternalLink,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { useVerifyLicense } from "../../hooks/useMaineData";

/**
 * Format date from Unix timestamp
 */
function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get status badge color
 */
function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case "active":
      return "green";
    case "conditional":
      return "yellow";
    case "suspended":
      return "orange";
    case "revoked":
    case "expired":
      return "red";
    default:
      return "gray";
  }
}

/**
 * Get license type icon
 */
function getLicenseIcon(type: string) {
  switch (type) {
    case "medical_dispensary":
      return Building2;
    case "medical_caregiver":
      return Users;
    case "adult_use":
      return Store;
    default:
      return Building2;
  }
}

/**
 * Get license type label
 */
function getLicenseLabel(type: string): string {
  switch (type) {
    case "medical_dispensary":
      return "Medical Dispensary";
    case "medical_caregiver":
      return "Medical Caregiver";
    case "adult_use":
      return "Adult Use";
    default:
      return "Unknown";
  }
}

/**
 * Format currency
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * License Result Component
 */
interface LicenseResultProps {
  result: {
    found: boolean;
    type?: string;
    registrationNumber?: string;
    licenseNumber?: string;
    licenseType?: string;
    registrationType?: string;
    name?: string;
    dba?: string;
    city?: string;
    town?: string;
    address?: string;
    status?: string;
    expiresAt?: number;
    hasViolations?: boolean;
    violationCount?: number;
    violations?: Array<{
      date: number;
      action: string;
      fineAmount?: number;
      documentUrl?: string;
    }>;
    lastSyncedAt?: number;
  };
}

function LicenseResult({ result }: LicenseResultProps) {
  if (!result.found) {
    return (
      <Alert
        status="warning"
        variant="subtle"
        borderRadius="lg"
        bg="orange.900/30"
        border="1px solid"
        borderColor="orange.500/30"
      >
        <AlertIcon as={XCircle} color="orange.400" />
        <Box>
          <AlertTitle color="orange.300" fontSize="sm">
            License Not Found
          </AlertTitle>
          <AlertDescription color="orange.200" fontSize="xs">
            No Maine cannabis license found with registration "{result.registrationNumber}".
            Verify the number and try again.
          </AlertDescription>
        </Box>
      </Alert>
    );
  }

  const LicenseIcon = getLicenseIcon(result.type || "");
  const isExpiringSoon = result.expiresAt && result.expiresAt < Date.now() + 30 * 24 * 60 * 60 * 1000;
  const isExpired = result.expiresAt && result.expiresAt < Date.now();

  return (
    <Box
      bg="slate.700/30"
      borderRadius="lg"
      border="1px solid"
      borderColor={result.hasViolations ? "orange.500/30" : "slate.600"}
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        p={4}
        bg={result.status === "active" ? "green.900/20" : "slate.700/50"}
        borderBottom="1px solid"
        borderColor="slate.600/50"
      >
        <HStack spacing={3}>
          <Box
            bg={result.status === "active" ? "green.500/20" : "slate.600"}
            p={2}
            borderRadius="lg"
          >
            <Icon
              as={LicenseIcon}
              boxSize={5}
              color={result.status === "active" ? "green.400" : "slate.400"}
            />
          </Box>
          <VStack align="start" spacing={0}>
            <HStack spacing={2}>
              <Text fontWeight="bold" color="white" fontSize="sm">
                {result.registrationNumber || result.licenseNumber}
              </Text>
              <Badge
                colorScheme={getStatusColor(result.status || "")}
                fontSize="xs"
                borderRadius="md"
              >
                {result.status?.toUpperCase()}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="slate.400">
              {getLicenseLabel(result.type || "")}
              {result.licenseType && ` (${result.licenseType})`}
              {result.registrationType && ` (${result.registrationType})`}
            </Text>
          </VStack>
        </HStack>

        <Icon
          as={result.status === "active" ? CheckCircle : AlertTriangle}
          boxSize={6}
          color={result.status === "active" ? "green.400" : "orange.400"}
        />
      </Flex>

      {/* Details */}
      <Box p={4}>
        <VStack align="stretch" spacing={3}>
          {/* Name */}
          {result.name && (
            <HStack spacing={3}>
              <Icon as={Building2} boxSize={4} color="slate.500" />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" color="white" fontWeight="medium">
                  {result.name}
                </Text>
                {result.dba && (
                  <Text fontSize="xs" color="slate.400">
                    DBA: {result.dba}
                  </Text>
                )}
              </VStack>
            </HStack>
          )}

          {/* Location */}
          {(result.city || result.town || result.address) && (
            <HStack spacing={3}>
              <Icon as={MapPin} boxSize={4} color="slate.500" />
              <Text fontSize="sm" color="slate.300">
                {result.address ? `${result.address}, ` : ""}
                {result.city || result.town}
              </Text>
            </HStack>
          )}

          {/* Expiration */}
          {result.expiresAt && (
            <HStack spacing={3}>
              <Icon
                as={Calendar}
                boxSize={4}
                color={isExpired ? "red.500" : isExpiringSoon ? "orange.500" : "slate.500"}
              />
              <HStack spacing={2}>
                <Text
                  fontSize="sm"
                  color={isExpired ? "red.400" : isExpiringSoon ? "orange.400" : "slate.300"}
                >
                  Expires: {formatDate(result.expiresAt)}
                </Text>
                {isExpired && (
                  <Badge colorScheme="red" fontSize="xs">EXPIRED</Badge>
                )}
                {!isExpired && isExpiringSoon && (
                  <Badge colorScheme="orange" fontSize="xs">EXPIRING SOON</Badge>
                )}
              </HStack>
            </HStack>
          )}

          {/* Last Synced */}
          {result.lastSyncedAt && (
            <HStack spacing={3}>
              <Icon as={Clock} boxSize={4} color="slate.500" />
              <Text fontSize="xs" color="slate.500">
                Data updated: {formatDate(result.lastSyncedAt)}
              </Text>
            </HStack>
          )}
        </VStack>

        {/* Violations */}
        {result.hasViolations && result.violations && result.violations.length > 0 && (
          <>
            <Divider my={4} borderColor="slate.600" />
            <VStack align="stretch" spacing={2}>
              <HStack spacing={2}>
                <Icon as={AlertTriangle} boxSize={4} color="orange.400" />
                <Text fontSize="sm" fontWeight="medium" color="orange.300">
                  Compliance History ({result.violationCount} violation{result.violationCount !== 1 ? "s" : ""})
                </Text>
              </HStack>

              {result.violations.slice(0, 3).map((v, idx) => (
                <Box
                  key={idx}
                  p={2}
                  bg="orange.900/20"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="orange.500/20"
                >
                  <Flex justify="space-between" align="center">
                    <HStack spacing={2}>
                      <Badge colorScheme="orange" fontSize="xs">
                        {v.action}
                      </Badge>
                      <Text fontSize="xs" color="slate.400">
                        {formatDate(v.date)}
                      </Text>
                      {v.fineAmount && v.fineAmount > 0 && (
                        <Text fontSize="xs" color="yellow.400">
                          {formatCurrency(v.fineAmount)}
                        </Text>
                      )}
                    </HStack>
                    {v.documentUrl && (
                      <Link href={v.documentUrl} isExternal>
                        <Icon as={ExternalLink} boxSize={3} color="blue.400" />
                      </Link>
                    )}
                  </Flex>
                </Box>
              ))}
            </VStack>
          </>
        )}
      </Box>
    </Box>
  );
}

/**
 * License Verifier Component
 *
 * Allows users to verify Maine cannabis licenses by registration number.
 * Shows license status, expiration, and compliance history.
 */
export function LicenseVerifier() {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const { data: result, isLoading } = useVerifyLicense(submittedQuery);
  const toast = useToast();

  const handleSearch = () => {
    const query = searchQuery.trim().toUpperCase();
    if (!query) {
      toast({
        title: "Enter a registration number",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    setSubmittedQuery(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Box
      bg="slate.800"
      borderRadius="xl"
      border="1px solid"
      borderColor="slate.700"
      overflow="hidden"
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
          <Box bg="blue.500/20" p={2} borderRadius="lg">
            <Icon as={Search} boxSize={5} color="blue.400" />
          </Box>
          <VStack align="start" spacing={0}>
            <Heading size="sm" color="white">
              License Verifier
            </Heading>
            <Text fontSize="xs" color="slate.400">
              Verify Maine cannabis licenses
            </Text>
          </VStack>
        </HStack>
      </Flex>

      {/* Search */}
      <Box p={6}>
        <VStack spacing={4}>
          <HStack spacing={2} w="100%">
            <InputGroup flex={1}>
              <InputLeftElement>
                <Icon as={Search} boxSize={4} color="slate.500" />
              </InputLeftElement>
              <Input
                placeholder="Enter registration # (e.g., CGR12345, DSP001)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                bg="slate.700"
                border="none"
                color="white"
                _placeholder={{ color: "slate.500" }}
                _focus={{ bg: "slate.600", boxShadow: "none" }}
              />
            </InputGroup>
            <Button
              colorScheme="blue"
              onClick={handleSearch}
              isLoading={isLoading}
              loadingText="Verifying"
            >
              Verify
            </Button>
          </HStack>

          {/* Help text */}
          <Text fontSize="xs" color="slate.500" w="100%">
            Enter a Maine OCP registration number. Formats: CGR##### (Caregiver),
            DSP### (Dispensary), AMS### (Adult Use Store)
          </Text>

          {/* Results */}
          {isLoading && (
            <Box w="100%">
              <Skeleton height="150px" borderRadius="lg" />
            </Box>
          )}

          {!isLoading && result && (
            <Box w="100%">
              <LicenseResult result={result} />
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
}

export default LicenseVerifier;
