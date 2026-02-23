import {
  Box,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { ShieldAlert, FileText, Clock, Building, User } from 'lucide-react';
import type { License } from '../types';

interface LicensesGridProps {
  licenses: License[];
  isLoading?: boolean;
}

/**
 * LicensesGrid
 * Displays licenses and certifications with expiration warnings
 */
function LicensesGrid({ licenses, isLoading = false }: LicensesGridProps) {
  if (isLoading) {
    return (
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
        {[1, 2, 3].map((i) => (
          <GridItem key={i}>
            <Box className="skeleton" h="180px" w="full" />
          </GridItem>
        ))}
      </Grid>
    );
  }

  if (!licenses || licenses.length === 0) {
    return (
      <Box className="card" p={6} textAlign="center">
        <Text color="slate.400">No licenses found</Text>
      </Box>
    );
  }

  const getStatusColor = (status: License['status']) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'expiring_soon':
        return 'yellow';
      case 'expired':
        return 'red';
      case 'pending_renewal':
        return 'orange';
    }
  };

  const getTypeIcon = (type: License['type']) => {
    switch (type) {
      case 'business':
        return Building;
      case 'staff':
        return User;
      case 'operational':
        return FileText;
    }
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const now = new Date();
    const expDate = new Date(expirationDate);
    const diffMs = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatExpirationWarning = (license: License) => {
    const days = getDaysUntilExpiration(license.expiration_date);

    if (days < 0) {
      return `Expired ${Math.abs(days)} days ago`;
    } else if (days === 0) {
      return 'Expires today';
    } else if (days === 1) {
      return 'Expires tomorrow';
    } else if (days <= 30) {
      return `Expires in ${days} days`;
    } else {
      return `Expires ${new Date(license.expiration_date).toLocaleDateString()}`;
    }
  };

  return (
    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
      {licenses.map((license) => {
        const days = getDaysUntilExpiration(license.expiration_date);
        const isExpiringSoon = days <= 30 && days > 0;
        const isExpired = days < 0;

        return (
          <GridItem key={license.id}>
            <Box
              className="card"
              p={5}
              borderWidth="2px"
              borderColor={
                isExpired
                  ? 'red.600'
                  : isExpiringSoon
                  ? 'yellow.600'
                  : 'slate.700'
              }
            >
              <HStack spacing={3} mb={3}>
                <Icon
                  as={getTypeIcon(license.type)}
                  boxSize={6}
                  color={getStatusColor(license.status) + '.400'}
                />
                <Badge
                  colorScheme={getStatusColor(license.status)}
                  fontSize="xs"
                  textTransform="uppercase"
                >
                  {license.status.replace('_', ' ')}
                </Badge>
              </HStack>

              <VStack align="start" spacing={2} mb={4}>
                <Text fontSize="md" fontWeight="bold" color="white">
                  {license.name}
                </Text>
                <Text fontSize="xs" color="slate.400">
                  {license.license_number}
                </Text>
                {license.holder_name && (
                  <Text fontSize="xs" color="slate.400">
                    Holder: {license.holder_name}
                  </Text>
                )}
              </VStack>

              <Box borderTop="1px solid" borderColor="slate.700" pt={3}>
                <HStack spacing={2} mb={2}>
                  <Icon as={Clock} boxSize={4} color="slate.400" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="slate.400">
                      Expiration
                    </Text>
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      color={
                        isExpired
                          ? 'red.400'
                          : isExpiringSoon
                          ? 'yellow.400'
                          : 'white'
                      }
                    >
                      {formatExpirationWarning(license)}
                    </Text>
                  </VStack>
                </HStack>

                <Text fontSize="xs" color="slate.500" mt={2}>
                  Issued by: {license.issuing_authority}
                </Text>

                {license.renewal_required && (isExpired || isExpiringSoon) && (
                  <HStack spacing={2} mt={3} p={2} bg={isExpired ? 'red.900' : 'yellow.900'} borderRadius="md">
                    <Icon as={ShieldAlert} boxSize={4} color={isExpired ? 'red.400' : 'yellow.400'} />
                    <Text fontSize="xs" color={isExpired ? 'red.200' : 'yellow.200'}>
                      Renewal required
                    </Text>
                  </HStack>
                )}
              </Box>
            </Box>
          </GridItem>
        );
      })}
    </Grid>
  );
}

export default LicensesGrid;
