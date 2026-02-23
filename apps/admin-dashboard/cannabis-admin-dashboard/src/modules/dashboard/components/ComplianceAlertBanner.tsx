import {
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Text,
  Button,
  VStack,
} from '@chakra-ui/react';
import { ShieldExclamationIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

interface ComplianceAlertBannerProps {
  criticalFlagsCount: number;
  openFlagsCount: number;
  isLoading?: boolean;
}

/**
 * ComplianceAlertBanner Component
 * Displays critical compliance alerts at the top of the dashboard
 */
function ComplianceAlertBanner({
  criticalFlagsCount,
  openFlagsCount,
  isLoading = false,
}: ComplianceAlertBannerProps) {
  const navigate = useNavigate();

  // Don't show banner if no flags
  if (!isLoading && criticalFlagsCount === 0 && openFlagsCount === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <Box className="skeleton" h="80px" w="full" mb={6} rounded="lg" />
    );
  }

  const hasCritical = criticalFlagsCount > 0;
  const severity = hasCritical ? 'error' : 'warning';

  return (
    <Alert
      status={severity}
      variant="subtle"
      bg={hasCritical ? 'red.900' : 'yellow.900'}
      borderWidth="1px"
      borderColor={hasCritical ? 'red.700' : 'yellow.700'}
      rounded="lg"
      p={4}
      mb={6}
    >
      <AlertIcon boxSize={6} />

      <Box flex={1}>
        <HStack align="center" mb={1}>
          <AlertTitle fontSize="md" color="white">
            {hasCritical ? 'Critical Compliance Issues' : 'Compliance Attention Required'}
          </AlertTitle>
        </HStack>

        <AlertDescription>
          <VStack align="start" spacing={1}>
            {hasCritical && (
              <Text fontSize="sm" color={hasCritical ? 'red.200' : 'yellow.200'}>
                {criticalFlagsCount} critical issue{criticalFlagsCount !== 1 ? 's' : ''} requiring immediate attention
              </Text>
            )}
            <Text fontSize="sm" color={hasCritical ? 'red.200' : 'yellow.200'}>
              {openFlagsCount} total open compliance flag{openFlagsCount !== 1 ? 's' : ''}
            </Text>
          </VStack>
        </AlertDescription>
      </Box>

      <Button
        size="sm"
        colorScheme={hasCritical ? 'red' : 'yellow'}
        onClick={() => navigate('/compliance')}
      >
        View Details
      </Button>
    </Alert>
  );
}

export default ComplianceAlertBanner;
