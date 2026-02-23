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
} from '@chakra-ui/react';
import { FiSearch, FiPlus, FiUser, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useState } from 'react';

/**
 * RecommendationsPage - Budtender Interface
 * Allows budtenders to create and manage patient recommendations
 */
function RecommendationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - will be replaced with real data from Supabase
  const mockSessions = [
    {
      id: '1',
      patientName: 'John Doe',
      patientNumber: 'P-001234',
      status: 'completed',
      createdAt: '2024-01-15T10:30:00',
      strainCount: 3,
      budtenderName: 'Sarah',
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      patientNumber: 'P-001235',
      status: 'pending',
      createdAt: '2024-01-15T11:15:00',
      strainCount: 0,
      budtenderName: 'Mike',
    },
    {
      id: '3',
      patientName: 'Bob Johnson',
      patientNumber: 'P-001236',
      status: 'in_progress',
      createdAt: '2024-01-15T11:45:00',
      strainCount: 2,
      budtenderName: 'Sarah',
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: { colorScheme: 'green', icon: FiCheckCircle },
      pending: { colorScheme: 'yellow', icon: FiClock },
      in_progress: { colorScheme: 'blue', icon: FiAlertCircle },
    };
    const config = styles[status as keyof typeof styles] || styles.pending;
    return (
      <Badge colorScheme={config.colorScheme} display="flex" alignItems="center" gap={1}>
        <Icon as={config.icon} boxSize={3} />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <Box>
      {/* Header */}
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between" wrap="wrap" gap={4}>
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="white">
              Recommendations
            </Heading>
            <Text color="slate.400">
              Create and manage patient strain recommendations
            </Text>
          </VStack>
          <Button leftIcon={<FiPlus />} colorScheme="cannabis">
            New Recommendation
          </Button>
        </HStack>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Today's Sessions</Text>
                <Text color="white" fontSize="2xl" fontWeight="bold">12</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Pending</Text>
                <Text color="yellow.400" fontSize="2xl" fontWeight="bold">3</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Completed</Text>
                <Text color="green.400" fontSize="2xl" fontWeight="bold">9</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Avg. Conversion</Text>
                <Text color="cannabis.400" fontSize="2xl" fontWeight="bold">67%</Text>
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            bg="slate.800"
            borderColor="slate.700"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </Select>
        </HStack>

        {/* Sessions Table */}
        <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
          <CardBody p={0}>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th color="slate.400" borderColor="slate.700">Patient</Th>
                  <Th color="slate.400" borderColor="slate.700">Status</Th>
                  <Th color="slate.400" borderColor="slate.700">Strains</Th>
                  <Th color="slate.400" borderColor="slate.700">Budtender</Th>
                  <Th color="slate.400" borderColor="slate.700">Date</Th>
                  <Th color="slate.400" borderColor="slate.700">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {mockSessions.map((session) => (
                  <Tr key={session.id} _hover={{ bg: 'slate.700/50' }}>
                    <Td borderColor="slate.700">
                      <HStack>
                        <Avatar size="sm" icon={<FiUser />} bg="cannabis.500" />
                        <VStack align="start" spacing={0}>
                          <Text color="white" fontWeight="medium">{session.patientName}</Text>
                          <Text color="slate.400" fontSize="xs">{session.patientNumber}</Text>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td borderColor="slate.700">{getStatusBadge(session.status)}</Td>
                    <Td borderColor="slate.700" color="white">{session.strainCount}</Td>
                    <Td borderColor="slate.700" color="slate.300">{session.budtenderName}</Td>
                    <Td borderColor="slate.700" color="slate.400">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </Td>
                    <Td borderColor="slate.700">
                      <Button size="sm" variant="ghost" colorScheme="cannabis">
                        View
                      </Button>
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

export default RecommendationsPage;
