import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Icon,
  Button,
  Avatar,
  Badge,
  Progress,
} from '@chakra-ui/react';
import {
  FiUser,
  FiFileText,
  FiStar,
  FiCalendar,
  FiArrowRight,
  FiShield,
  FiCheckCircle,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useAuth';

/**
 * PatientDashboardPage - Patient Home
 * Landing page for patients showing their status and quick actions
 */
function PatientDashboardPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();

  // Mock patient data
  const patientData = {
    questionnaireComplete: true,
    questionnaireProgress: 100,
    recommendationsCount: 3,
    lastVisit: '2024-01-14',
    nextRecommendation: '2024-02-01',
    medicalCardExpires: '2024-06-15',
    preferredEffects: ['pain_relief', 'sleep', 'relaxation'],
  };

  const daysUntilCardExpiry = () => {
    const expDate = new Date(patientData.medicalCardExpires);
    const today = new Date();
    return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Box minH="100vh" bg="slate.900" py={8}>
      <Container maxW="container.lg">
        <VStack align="stretch" spacing={8}>
          {/* Welcome Header */}
          <Card bg="gradient-to-r from-cannabis.900 to-slate.800" borderColor="cannabis.700" borderWidth="1px">
            <CardBody>
              <HStack spacing={6}>
                <Avatar size="xl" icon={<FiUser />} bg="cannabis.500" />
                <VStack align="start" spacing={2} flex={1}>
                  <HStack>
                    <Heading size="lg" color="white">
                      Welcome back, {user?.full_name || 'Patient'}
                    </Heading>
                    <Badge colorScheme="green" fontSize="sm">
                      <HStack spacing={1}>
                        <Icon as={FiShield} />
                        <Text>Medical</Text>
                      </HStack>
                    </Badge>
                  </HStack>
                  <Text color="slate.300">
                    Patient #{user?.patient_number || 'P-001234'}
                  </Text>
                  <HStack spacing={4} color="slate.400" fontSize="sm">
                    <HStack>
                      <Icon as={FiCalendar} />
                      <Text>Last visit: {new Date(patientData.lastVisit).toLocaleDateString()}</Text>
                    </HStack>
                  </HStack>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Card
              bg="slate.800"
              borderColor="slate.700"
              borderWidth="1px"
              _hover={{ borderColor: 'cannabis.500', transform: 'translateY(-2px)' }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={() => navigate('/patient/questionnaire')}
            >
              <CardBody>
                <HStack justify="space-between">
                  <HStack spacing={4}>
                    <Box p={3} borderRadius="lg" bg="cannabis.900/50">
                      <Icon as={FiFileText} boxSize={6} color="cannabis.400" />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text color="white" fontWeight="semibold">Intake Questionnaire</Text>
                      {patientData.questionnaireComplete ? (
                        <HStack color="green.400" fontSize="sm">
                          <Icon as={FiCheckCircle} />
                          <Text>Completed</Text>
                        </HStack>
                      ) : (
                        <Text color="slate.400" fontSize="sm">
                          {patientData.questionnaireProgress}% complete
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                  <Icon as={FiArrowRight} color="slate.400" />
                </HStack>
                {!patientData.questionnaireComplete && (
                  <Progress
                    value={patientData.questionnaireProgress}
                    size="xs"
                    colorScheme="cannabis"
                    mt={4}
                    borderRadius="full"
                  />
                )}
              </CardBody>
            </Card>

            <Card
              bg="slate.800"
              borderColor="slate.700"
              borderWidth="1px"
              _hover={{ borderColor: 'cannabis.500', transform: 'translateY(-2px)' }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={() => navigate('/patient/recommendations')}
            >
              <CardBody>
                <HStack justify="space-between">
                  <HStack spacing={4}>
                    <Box p={3} borderRadius="lg" bg="yellow.900/50">
                      <Icon as={FiStar} boxSize={6} color="yellow.400" />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text color="white" fontWeight="semibold">My Recommendations</Text>
                      <Text color="slate.400" fontSize="sm">
                        {patientData.recommendationsCount} personalized strains
                      </Text>
                    </VStack>
                  </HStack>
                  <Icon as={FiArrowRight} color="slate.400" />
                </HStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Medical Card Status */}
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardHeader pb={2}>
              <HStack justify="space-between">
                <Heading size="md" color="white">Medical Card Status</Heading>
                <Badge
                  colorScheme={daysUntilCardExpiry() > 30 ? 'green' : daysUntilCardExpiry() > 0 ? 'yellow' : 'red'}
                >
                  {daysUntilCardExpiry() > 0 ? `${daysUntilCardExpiry()} days remaining` : 'Expired'}
                </Badge>
              </HStack>
            </CardHeader>
            <CardBody pt={2}>
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between">
                  <Text color="slate.400">Expiration Date</Text>
                  <Text color="white" fontWeight="medium">
                    {new Date(patientData.medicalCardExpires).toLocaleDateString()}
                  </Text>
                </HStack>
                <Progress
                  value={Math.max(0, (daysUntilCardExpiry() / 365) * 100)}
                  size="sm"
                  colorScheme={daysUntilCardExpiry() > 30 ? 'green' : 'yellow'}
                  bg="slate.700"
                  borderRadius="full"
                />
                {daysUntilCardExpiry() <= 30 && daysUntilCardExpiry() > 0 && (
                  <Box bg="yellow.900/30" p={3} borderRadius="md" borderLeft="4px solid" borderColor="yellow.400">
                    <Text color="yellow.200" fontSize="sm">
                      Your medical card is expiring soon. Please renew to continue receiving medical cannabis.
                    </Text>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Preferred Effects */}
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardHeader pb={2}>
              <Heading size="md" color="white">Your Preferences</Heading>
            </CardHeader>
            <CardBody pt={2}>
              <VStack align="start" spacing={4}>
                <Text color="slate.400" fontSize="sm">Preferred Effects</Text>
                <HStack spacing={2} flexWrap="wrap">
                  {patientData.preferredEffects.map((effect) => (
                    <Badge key={effect} colorScheme="cannabis" fontSize="sm" px={3} py={1}>
                      {effect.replace('_', ' ')}
                    </Badge>
                  ))}
                </HStack>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="cannabis"
                  onClick={() => navigate('/patient/profile')}
                >
                  Update Preferences
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}

export default PatientDashboardPage;
