import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Icon,
  Button,
  Badge,
  Avatar,
  FormControl,
  FormLabel,
  Input,
  Select,
  Checkbox,
  CheckboxGroup,
  Divider,
  useToast,
} from '@chakra-ui/react';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiSave,
  FiArrowLeft,
  FiCalendar,
} from 'react-icons/fi';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/**
 * PatientProfilePage - Patient Profile Management
 * Patients can view and update their profile information
 */
function PatientProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    preferredEffects: ['pain_relief', 'sleep'],
    thcTolerance: 'low',
    preferredMethod: 'flower',
    preferredTime: 'evening',
    medicalCardNumber: '',
    medicalCardExpiration: '2024-06-15',
  });

  const effectOptions = [
    { value: 'pain_relief', label: 'Pain Relief' },
    { value: 'sleep', label: 'Sleep' },
    { value: 'relaxation', label: 'Relaxation' },
    { value: 'anxiety_relief', label: 'Anxiety Relief' },
    { value: 'energy', label: 'Energy' },
    { value: 'focus', label: 'Focus' },
    { value: 'creativity', label: 'Creativity' },
    { value: 'appetite', label: 'Appetite' },
  ];

  const handleSave = () => {
    // Mock save
    toast({
      title: 'Profile Updated',
      description: 'Your preferences have been saved successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box minH="100vh" bg="slate.900" py={8}>
      <Container maxW="container.md">
        <VStack align="stretch" spacing={6}>
          {/* Header */}
          <VStack align="start" spacing={4}>
            <Button
              variant="ghost"
              color="slate.400"
              leftIcon={<Icon as={FiArrowLeft} />}
              onClick={() => navigate('/patient')}
            >
              Back to Dashboard
            </Button>
            <HStack>
              <Avatar size="lg" icon={<FiUser />} bg="cannabis.500" />
              <VStack align="start" spacing={1}>
                <Heading size="lg" color="white">
                  My Profile
                </Heading>
                <Text color="slate.400">
                  Manage your account and preferences
                </Text>
              </VStack>
            </HStack>
          </VStack>

          {/* Personal Information */}
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardHeader pb={2}>
              <HStack>
                <Icon as={FiUser} color="cannabis.400" />
                <Heading size="md" color="white">Personal Information</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel color="slate.400">Full Name</FormLabel>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      bg="slate.900"
                      borderColor="slate.700"
                      color="white"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="slate.400">Patient Number</FormLabel>
                    <Input
                      value={user?.patient_number || 'P-001234'}
                      isReadOnly
                      bg="slate.900"
                      borderColor="slate.700"
                      color="slate.400"
                    />
                  </FormControl>
                </HStack>
                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel color="slate.400">Email</FormLabel>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      bg="slate.900"
                      borderColor="slate.700"
                      color="white"
                      leftIcon={<Icon as={FiMail} />}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="slate.400">Phone</FormLabel>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      bg="slate.900"
                      borderColor="slate.700"
                      color="white"
                      _placeholder={{ color: 'slate.500' }}
                    />
                  </FormControl>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Medical Card Information */}
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardHeader pb={2}>
              <HStack justify="space-between">
                <HStack>
                  <Icon as={FiShield} color="green.400" />
                  <Heading size="md" color="white">Medical Card</Heading>
                </HStack>
                <Badge colorScheme="green">Verified</Badge>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel color="slate.400">Card Number</FormLabel>
                    <Input
                      value={formData.medicalCardNumber}
                      onChange={(e) => setFormData({ ...formData, medicalCardNumber: e.target.value })}
                      placeholder="ME-XXXXX"
                      bg="slate.900"
                      borderColor="slate.700"
                      color="white"
                      _placeholder={{ color: 'slate.500' }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="slate.400">Expiration Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.medicalCardExpiration}
                      onChange={(e) => setFormData({ ...formData, medicalCardExpiration: e.target.value })}
                      bg="slate.900"
                      borderColor="slate.700"
                      color="white"
                    />
                  </FormControl>
                </HStack>
                <Box bg="blue.900/30" p={3} borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                  <Text color="blue.200" fontSize="sm">
                    Your medical card was last verified on January 10, 2024. Please keep your card information up to date.
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Cannabis Preferences */}
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardHeader pb={2}>
              <HStack>
                <Icon as={FiCalendar} color="purple.400" />
                <Heading size="md" color="white">Cannabis Preferences</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={6}>
                {/* Preferred Effects */}
                <FormControl>
                  <FormLabel color="slate.400">Preferred Effects (select all that apply)</FormLabel>
                  <CheckboxGroup
                    value={formData.preferredEffects}
                    onChange={(values) => setFormData({ ...formData, preferredEffects: values as string[] })}
                  >
                    <HStack spacing={4} flexWrap="wrap">
                      {effectOptions.map((effect) => (
                        <Checkbox
                          key={effect.value}
                          value={effect.value}
                          colorScheme="cannabis"
                          color="slate.300"
                        >
                          {effect.label}
                        </Checkbox>
                      ))}
                    </HStack>
                  </CheckboxGroup>
                </FormControl>

                <Divider borderColor="slate.700" />

                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel color="slate.400">THC Tolerance</FormLabel>
                    <Select
                      value={formData.thcTolerance}
                      onChange={(e) => setFormData({ ...formData, thcTolerance: e.target.value })}
                      bg="slate.900"
                      borderColor="slate.700"
                      color="white"
                    >
                      <option value="first_time">First-Time User</option>
                      <option value="low">Low Tolerance</option>
                      <option value="medium">Medium Tolerance</option>
                      <option value="high">High Tolerance</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel color="slate.400">Preferred Consumption Method</FormLabel>
                    <Select
                      value={formData.preferredMethod}
                      onChange={(e) => setFormData({ ...formData, preferredMethod: e.target.value })}
                      bg="slate.900"
                      borderColor="slate.700"
                      color="white"
                    >
                      <option value="flower">Flower (Smoking)</option>
                      <option value="vape">Vaporizer</option>
                      <option value="edible">Edibles</option>
                      <option value="tincture">Tinctures</option>
                      <option value="topical">Topicals</option>
                    </Select>
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel color="slate.400">Preferred Usage Time</FormLabel>
                  <Select
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    bg="slate.900"
                    borderColor="slate.700"
                    color="white"
                    maxW="50%"
                  >
                    <option value="morning">Morning</option>
                    <option value="daytime">Daytime</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night / Bedtime</option>
                    <option value="varies">It Varies</option>
                  </Select>
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Save Button */}
          <Button
            colorScheme="cannabis"
            size="lg"
            leftIcon={<Icon as={FiSave} />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </VStack>
      </Container>
    </Box>
  );
}

export default PatientProfilePage;
