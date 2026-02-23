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
  Badge,
  Divider,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

interface ComplianceAlertBannerProps {
  criticalFlagsCount: number;
  openFlagsCount: number;
  // OCP Advisory Props
  ocpCriticalCount?: number;
  ocpHighCount?: number;
  ocpTotalActiveMatches?: number;
  isLoading?: boolean;
}

/**
 * ComplianceAlertBanner Component
 * Displays critical compliance alerts at the top of the dashboard
 * Now includes OCP (Office of Cannabis Policy) advisory alerts
 */
function ComplianceAlertBanner({
  criticalFlagsCount,
  openFlagsCount,
  ocpCriticalCount = 0,
  ocpHighCount = 0,
  ocpTotalActiveMatches = 0,
  isLoading = false,
}: ComplianceAlertBannerProps) {
  const navigate = useNavigate();

  // Don't show banner if no flags
  const hasComplianceFlags = criticalFlagsCount > 0 || openFlagsCount > 0;
  const hasOcpAlerts = ocpTotalActiveMatches > 0;

  if (!isLoading && !hasComplianceFlags && !hasOcpAlerts) {
    return null;
  }

  if (isLoading) {
    return (
      <Box className="skeleton" h="80px" w="full" mb={6} rounded="lg" />
    );
  }

  const hasCritical = criticalFlagsCount > 0 || ocpCriticalCount > 0;
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
          {hasOcpAlerts && (
            <Badge colorScheme="red" variant="solid" fontSize="xs">
              OCP Alert
            </Badge>
          )}
        </HStack>

        <AlertDescription>
          <VStack align="start" spacing={1}>
            {/* OCP Advisory Alerts */}
            {hasOcpAlerts && (
              <>
                {ocpCriticalCount > 0 && (
                  <Text fontSize="sm" color="red.200" fontWeight="medium">
                    ⚠️ {ocpCriticalCount} critical OCP advisory{ocpCriticalCount !== 1 ? 'ies' : ''} - products may need to be pulled
                  </Text>
                )}
                {ocpHighCount > 0 && (
                  <Text fontSize="sm" color="orange.200">
                    {ocpHighCount} high priority OCP advisory{ocpHighCount !== 1 ? 'ies' : ''}
                  </Text>
                )}
                <Text fontSize="sm" color={hasCritical ? 'red.200' : 'yellow.200'}>
                  {ocpTotalActiveMatches} product{ocpTotalActiveMatches !== 1 ? 's' : ''} flagged by OCP advisories
                </Text>
              </>
            )}

            {/* Original Compliance Flags */}
            {hasComplianceFlags && hasOcpAlerts && (
              <Divider borderColor={hasCritical ? 'red.600' : 'yellow.600'} my={1} />
            )}
            {criticalFlagsCount > 0 && (
              <Text fontSize="sm" color={hasCritical ? 'red.200' : 'yellow.200'}>
                {criticalFlagsCount} critical compliance issue{criticalFlagsCount !== 1 ? 's' : ''} requiring immediate attention
              </Text>
            )}
            {openFlagsCount > 0 && (
              <Text fontSize="sm" color={hasCritical ? 'red.200' : 'yellow.200'}>
                {openFlagsCount} total open compliance flag{openFlagsCount !== 1 ? 's' : ''}
              </Text>
            )}
          </VStack>
        </AlertDescription>
      </Box>

      <VStack spacing={2}>
        {hasOcpAlerts && (
          <Button
            size="sm"
            colorScheme="red"
            onClick={() => navigate('/compliance-alerts')}
          >
            View OCP Alerts
          </Button>
        )}
        {hasComplianceFlags && (
          <Button
            size="sm"
            colorScheme={hasCritical && !hasOcpAlerts ? 'red' : 'yellow'}
            variant={hasOcpAlerts ? 'outline' : 'solid'}
            onClick={() => navigate('/compliance')}
          >
            View Compliance
          </Button>
        )}
      </VStack>
    </Alert>
  );
}

export default ComplianceAlertBanner;
