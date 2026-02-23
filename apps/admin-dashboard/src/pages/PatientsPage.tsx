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
  useDisclosure,
  Tooltip,
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
  FiUpload,
  FiMail,
  FiPhone,
  FiCreditCard,
  FiChevronUp,
  FiChevronDown,
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { ImportCustomersModal } from '../modules/customers/components/ImportCustomersModal';
import { useCurrentUser } from '../hooks/useAuth';
import { supabase } from '../services/supabase/client';

// Helper to decode base64 encrypted names
function decodeBase64(encoded: string | null): string {
  if (!encoded) return '';
  try {
    return atob(encoded);
  } catch {
    return encoded;
  }
}

interface Patient {
  id: string;
  first_name_encrypted: string | null;
  last_name_encrypted: string | null;
  email_hash: string | null;
  phone_hash: string | null;
  license_number_hash: string | null;
  is_medical_patient: boolean;
  medical_card_expiration: string | null;
  total_purchases: number;
  total_visits: number;
  last_visit: string | null;
  created_at: string;
}

/**
 * PatientsPage - Patient Management Interface
 * Allows budtenders and staff to manage patient records
 */
type SortColumn = 'name' | 'contact' | 'type' | 'total_purchases' | 'total_visits' | 'created_at';
type SortDirection = 'asc' | 'desc';

function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [contactFilter, setContactFilter] = useState('all');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<SortColumn>('total_purchases');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
  const user = useCurrentUser();

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Fetch patients from Supabase
  useEffect(() => {
    async function fetchPatients() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching patients:', error);
        } else {
          setPatients(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch patients:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPatients();
  }, []);

  // Filter patients based on search, type, and contact
  const filteredPatients = patients
    .filter(patient => {
      // Type filter
      if (typeFilter === 'medical' && !patient.is_medical_patient) return false;
      if (typeFilter === 'recreational' && patient.is_medical_patient) return false;
      if (typeFilter === 'expiring') {
        if (!patient.is_medical_patient || !patient.medical_card_expiration) return false;
        const expDate = new Date(patient.medical_card_expiration);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        if (expDate > thirtyDaysFromNow) return false;
      }

      // Contact filter
      if (contactFilter === 'has_email' && !patient.email_hash) return false;
      if (contactFilter === 'has_phone' && !patient.phone_hash) return false;
      if (contactFilter === 'has_id' && !patient.license_number_hash) return false;
      if (contactFilter === 'no_contact' && (patient.email_hash || patient.phone_hash)) return false;

      // Search filter (search by decoded name or ID)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const firstName = decodeBase64(patient.first_name_encrypted).toLowerCase();
        const lastName = decodeBase64(patient.last_name_encrypted).toLowerCase();
        const fullName = `${firstName} ${lastName}`;
        if (!fullName.includes(query) && !patient.id.toLowerCase().includes(query)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'name':
          const nameA = `${decodeBase64(a.first_name_encrypted)} ${decodeBase64(a.last_name_encrypted)}`.toLowerCase();
          const nameB = `${decodeBase64(b.first_name_encrypted)} ${decodeBase64(b.last_name_encrypted)}`.toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        case 'contact':
          // Count contact methods (email, phone, license)
          const contactA = (a.email_hash ? 1 : 0) + (a.phone_hash ? 1 : 0) + (a.license_number_hash ? 1 : 0);
          const contactB = (b.email_hash ? 1 : 0) + (b.phone_hash ? 1 : 0) + (b.license_number_hash ? 1 : 0);
          comparison = contactA - contactB;
          break;
        case 'type':
          // Medical patients first when descending
          comparison = (a.is_medical_patient ? 1 : 0) - (b.is_medical_patient ? 1 : 0);
          break;
        case 'total_purchases':
          comparison = (a.total_purchases || 0) - (b.total_purchases || 0);
          break;
        case 'total_visits':
          comparison = (a.total_visits || 0) - (b.total_visits || 0);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Calculate stats
  const totalPatients = patients.length;
  const medicalPatients = patients.filter(p => p.is_medical_patient).length;
  const expiringCards = patients.filter(p => {
    if (!p.is_medical_patient || !p.medical_card_expiration) return false;
    const expDate = new Date(p.medical_card_expiration);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expDate <= thirtyDaysFromNow && expDate > new Date();
  }).length;
  const newThisMonth = patients.filter(p => {
    const created = new Date(p.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

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
          <HStack spacing={3}>
            <Button leftIcon={<FiUpload />} variant="outline" colorScheme="blue" onClick={onImportOpen}>
              Import CSV
            </Button>
            <Button leftIcon={<FiPlus />} colorScheme="cannabis">
              Add Patient
            </Button>
          </HStack>
        </HStack>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Total Patients</Text>
                <Text color="white" fontSize="2xl" fontWeight="bold">{loading ? '...' : totalPatients}</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Medical Patients</Text>
                <Text color="cannabis.400" fontSize="2xl" fontWeight="bold">{loading ? '...' : medicalPatients}</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Cards Expiring Soon</Text>
                <Text color="yellow.400" fontSize="2xl" fontWeight="bold">{loading ? '...' : expiringCards}</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">New This Month</Text>
                <Text color="green.400" fontSize="2xl" fontWeight="bold">{loading ? '...' : newThisMonth}</Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters */}
        <HStack spacing={4} wrap="wrap">
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
            maxW="180px"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            bg="slate.800"
            borderColor="slate.700"
          >
            <option value="all">All Types</option>
            <option value="medical">Medical Only</option>
            <option value="recreational">Recreational Only</option>
            <option value="expiring">Cards Expiring</option>
          </Select>
          <Select
            maxW="180px"
            value={contactFilter}
            onChange={(e) => setContactFilter(e.target.value)}
            bg="slate.800"
            borderColor="slate.700"
          >
            <option value="all">All Contact</option>
            <option value="has_email">Has Email</option>
            <option value="has_phone">Has Phone</option>
            <option value="has_id">Has ID</option>
            <option value="no_contact">No Contact Info</option>
          </Select>
          <Text color="slate.400" fontSize="sm">
            Showing {filteredPatients.length} of {patients.length}
          </Text>
        </HStack>

        {/* Patients Table */}
        <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
          <CardBody p={0}>
            {loading ? (
              <VStack py={12} spacing={4}>
                <Text color="slate.400" fontSize="lg">Loading patients...</Text>
              </VStack>
            ) : filteredPatients.length === 0 ? (
              <VStack py={12} spacing={4}>
                <Icon as={FiUser} boxSize={12} color="slate.500" />
                <Text color="slate.400" fontSize="lg">
                  {patients.length === 0 ? 'No patients yet' : 'No patients match your filters'}
                </Text>
                {patients.length === 0 && (
                  <>
                    <Text color="slate.500" fontSize="sm">Import your customer list to get started</Text>
                    <Button leftIcon={<FiUpload />} colorScheme="blue" onClick={onImportOpen}>
                      Import CSV
                    </Button>
                  </>
                )}
              </VStack>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th
                      color="slate.400"
                      borderColor="slate.700"
                      cursor="pointer"
                      onClick={() => handleSort('name')}
                      _hover={{ color: 'white' }}
                    >
                      <HStack spacing={1}>
                        <Text>Patient</Text>
                        {sortColumn === 'name' && (
                          <Icon as={sortDirection === 'asc' ? FiChevronUp : FiChevronDown} boxSize={4} />
                        )}
                      </HStack>
                    </Th>
                    <Th
                      color="slate.400"
                      borderColor="slate.700"
                      cursor="pointer"
                      onClick={() => handleSort('contact')}
                      _hover={{ color: 'white' }}
                    >
                      <HStack spacing={1}>
                        <Text>Contact</Text>
                        {sortColumn === 'contact' && (
                          <Icon as={sortDirection === 'asc' ? FiChevronUp : FiChevronDown} boxSize={4} />
                        )}
                      </HStack>
                    </Th>
                    <Th
                      color="slate.400"
                      borderColor="slate.700"
                      cursor="pointer"
                      onClick={() => handleSort('type')}
                      _hover={{ color: 'white' }}
                    >
                      <HStack spacing={1}>
                        <Text>Type</Text>
                        {sortColumn === 'type' && (
                          <Icon as={sortDirection === 'asc' ? FiChevronUp : FiChevronDown} boxSize={4} />
                        )}
                      </HStack>
                    </Th>
                    <Th
                      color="slate.400"
                      borderColor="slate.700"
                      cursor="pointer"
                      onClick={() => handleSort('total_purchases')}
                      _hover={{ color: 'white' }}
                    >
                      <HStack spacing={1}>
                        <Text>Total Spent</Text>
                        {sortColumn === 'total_purchases' && (
                          <Icon as={sortDirection === 'asc' ? FiChevronUp : FiChevronDown} boxSize={4} />
                        )}
                      </HStack>
                    </Th>
                    <Th
                      color="slate.400"
                      borderColor="slate.700"
                      cursor="pointer"
                      onClick={() => handleSort('total_visits')}
                      _hover={{ color: 'white' }}
                    >
                      <HStack spacing={1}>
                        <Text>Visits</Text>
                        {sortColumn === 'total_visits' && (
                          <Icon as={sortDirection === 'asc' ? FiChevronUp : FiChevronDown} boxSize={4} />
                        )}
                      </HStack>
                    </Th>
                    <Th color="slate.400" borderColor="slate.700">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredPatients.map((patient) => {
                    const firstName = decodeBase64(patient.first_name_encrypted);
                    const lastName = decodeBase64(patient.last_name_encrypted);
                    const displayName = firstName || lastName
                      ? `${firstName} ${lastName}`.trim()
                      : 'Unknown';

                    return (
                      <Tr key={patient.id} _hover={{ bg: 'slate.700/50' }}>
                        <Td borderColor="slate.700">
                          <HStack>
                            <Avatar size="sm" name={displayName} icon={<FiUser />} bg="cannabis.500" />
                            <VStack align="start" spacing={0}>
                              <Text color="white" fontWeight="medium">{displayName}</Text>
                              <Text color="slate.400" fontSize="xs">{patient.id.slice(0, 8)}...</Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td borderColor="slate.700">
                          <HStack spacing={2}>
                            <Tooltip label={patient.email_hash ? 'Has email' : 'No email'} placement="top">
                              <span>
                                <Icon
                                  as={FiMail}
                                  boxSize={4}
                                  color={patient.email_hash ? 'green.400' : 'slate.600'}
                                />
                              </span>
                            </Tooltip>
                            <Tooltip label={patient.phone_hash ? 'Has phone' : 'No phone'} placement="top">
                              <span>
                                <Icon
                                  as={FiPhone}
                                  boxSize={4}
                                  color={patient.phone_hash ? 'green.400' : 'slate.600'}
                                />
                              </span>
                            </Tooltip>
                            <Tooltip label={patient.license_number_hash ? 'Has ID' : 'No ID'} placement="top">
                              <span>
                                <Icon
                                  as={FiCreditCard}
                                  boxSize={4}
                                  color={patient.license_number_hash ? 'green.400' : 'slate.600'}
                                />
                              </span>
                            </Tooltip>
                          </HStack>
                        </Td>
                        <Td borderColor="slate.700">
                          {patient.is_medical_patient ? (
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
                          <Text color="green.400" fontWeight="medium">
                            ${(patient.total_purchases || 0).toFixed(2)}
                          </Text>
                        </Td>
                        <Td borderColor="slate.700" color="white">{patient.total_visits || 0}</Td>
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
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Import Modal */}
      <ImportCustomersModal
        isOpen={isImportOpen}
        onClose={onImportClose}
        dispensaryId={user?.dispensary_id || ''}
        dispensaryName="Your Dispensary"
      />
    </Box>
  );
}

export default PatientsPage;
