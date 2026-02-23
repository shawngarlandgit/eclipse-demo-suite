import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  Icon,
  Button,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiPlus,
  FiUser,
  FiMoreVertical,
  FiEdit,
  FiEye,
  FiFileText,
  FiShield,
} from 'react-icons/fi';
import { useState } from 'react';

/**
 * PatientsPage - Patient Management Interface
 * Allows budtenders and staff to manage patient records
 */
function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Mock patients data
  const mockPatients = [
    {
      id: '1',
      fullName: 'John Doe',
      patientNumber: 'P-001234',
      email: 'john.doe@email.com',
      isMedical: true,
      cardExpiration: '2024-06-15',
      totalVisits: 24,
      lastVisit: '2024-01-14',
      preferredEffects: ['pain_relief', 'sleep'],
    },
    {
      id: '2',
      fullName: 'Jane Smith',
      patientNumber: 'P-001235',
      email: 'jane.smith@email.com',
      isMedical: true,
      cardExpiration: '2024-03-20',
      totalVisits: 12,
      lastVisit: '2024-01-10',
      preferredEffects: ['anxiety_relief', 'relaxation'],
    },
    {
      id: '3',
      fullName: 'Bob Johnson',
      patientNumber: 'P-001236',
      email: 'bob.j@email.com',
      isMedical: false,
      cardExpiration: null,
      totalVisits: 5,
      lastVisit: '2024-01-05',
      preferredEffects: ['energy', 'focus'],
    },
  ];

  const isCardExpiringSoon = (expiration: string | null) => {
    if (!expiration) return false;
    const expDate = new Date(expiration);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isCardExpired = (expiration: string | null) => {
    if (!expiration) return false;
    return new Date(expiration) < new Date();
  };

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <HStack justify="space-between" wrap="wrap" gap={4}>
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="white">
              Patients
            </Heading>
            <Text color="slate.400">
              Manage patient records and preferences
            </Text>
          </VStack>
          <Button leftIcon={<FiPlus />} colorScheme="cannabis">
            Add Patient
          </Button>
        </HStack>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Total Patients</Text>
                <Text color="white" fontSize="2xl" fontWeight="bold">1,247</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Medical Patients</Text>
                <Text color="cannabis.400" fontSize="2xl" fontWeight="bold">892</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Cards Expiring Soon</Text>
                <Text color="yellow.400" fontSize="2xl" fontWeight="bold">23</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">New This Month</Text>
                <Text color="green.400" fontSize="2xl" fontWeight="bold">45</Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters */}
        <HStack spacing={4}>
          <InputGroup maxW="300px">
            <InputLeftElement>
              <Icon as={FiSearch} color="slate.400" />
            </InputLeftElement>
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="slate.800"
              borderColor="slate.700"
              _placeholder={{ color: 'slate.500' }}
            />
          </InputGroup>
          <Select
            maxW="200px"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            bg="slate.800"
            borderColor="slate.700"
          >
            <option value="all">All Patients</option>
            <option value="medical">Medical Only</option>
            <option value="recreational">Recreational Only</option>
            <option value="expiring">Cards Expiring</option>
          </Select>
        </HStack>

        {/* Patients Table */}
        <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
          <CardBody p={0}>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th color="slate.400" borderColor="slate.700">Patient</Th>
                  <Th color="slate.400" borderColor="slate.700">Type</Th>
                  <Th color="slate.400" borderColor="slate.700">Card Status</Th>
                  <Th color="slate.400" borderColor="slate.700">Visits</Th>
                  <Th color="slate.400" borderColor="slate.700">Last Visit</Th>
                  <Th color="slate.400" borderColor="slate.700">Preferences</Th>
                  <Th color="slate.400" borderColor="slate.700">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {mockPatients.map((patient) => (
                  <Tr key={patient.id} _hover={{ bg: 'slate.700/50' }}>
                    <Td borderColor="slate.700">
                      <HStack>
                        <Avatar size="sm" icon={<FiUser />} bg="cannabis.500" />
                        <VStack align="start" spacing={0}>
                          <Text color="white" fontWeight="medium">{patient.fullName}</Text>
                          <Text color="slate.400" fontSize="xs">{patient.patientNumber}</Text>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td borderColor="slate.700">
                      {patient.isMedical ? (
                        <Badge colorScheme="green">
                          <HStack spacing={1}>
                            <Icon as={FiShield} boxSize={3} />
                            <Text>Medical</Text>
                          </HStack>
                        </Badge>
                      ) : (
                        <Badge colorScheme="blue">Recreational</Badge>
                      )}
                    </Td>
                    <Td borderColor="slate.700">
                      {patient.isMedical ? (
                        isCardExpired(patient.cardExpiration) ? (
                          <Badge colorScheme="red">Expired</Badge>
                        ) : isCardExpiringSoon(patient.cardExpiration) ? (
                          <Badge colorScheme="yellow">Expiring Soon</Badge>
                        ) : (
                          <Badge colorScheme="green">Valid</Badge>
                        )
                      ) : (
                        <Text color="slate.500">N/A</Text>
                      )}
                    </Td>
                    <Td borderColor="slate.700" color="white">{patient.totalVisits}</Td>
                    <Td borderColor="slate.700" color="slate.400">
                      {new Date(patient.lastVisit).toLocaleDateString()}
                    </Td>
                    <Td borderColor="slate.700">
                      <HStack spacing={1} flexWrap="wrap">
                        {patient.preferredEffects.slice(0, 2).map((effect) => (
                          <Badge key={effect} colorScheme="purple" fontSize="xs">
                            {effect.replace('_', ' ')}
                          </Badge>
                        ))}
                        {patient.preferredEffects.length > 2 && (
                          <Badge colorScheme="gray" fontSize="xs">
                            +{patient.preferredEffects.length - 2}
                          </Badge>
                        )}
                      </HStack>
                    </Td>
                    <Td borderColor="slate.700">
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FiMoreVertical />}
                          variant="ghost"
                          size="sm"
                          color="slate.400"
                        />
                        <MenuList bg="slate.800" borderColor="slate.700">
                          <MenuItem icon={<FiEye />} bg="slate.800" _hover={{ bg: 'slate.700' }}>
                            View Profile
                          </MenuItem>
                          <MenuItem icon={<FiEdit />} bg="slate.800" _hover={{ bg: 'slate.700' }}>
                            Edit Patient
                          </MenuItem>
                          <MenuItem icon={<FiFileText />} bg="slate.800" _hover={{ bg: 'slate.700' }}>
                            View History
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}

export default PatientsPage;
