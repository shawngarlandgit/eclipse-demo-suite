import {
  Box,
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
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Switch,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { FiEdit, FiCopy, FiEye, FiPlus, FiFileText, FiSettings } from 'react-icons/fi';
import { useState } from 'react';

/**
 * QuestionnairePage - Admin Interface
 * Allows managers to configure and manage questionnaire templates
 */
function QuestionnairePage() {
  const [activeTab, setActiveTab] = useState(0);

  // Mock templates
  const mockTemplates = [
    {
      id: '1',
      name: 'Maine Medical Cannabis Intake',
      description: 'Medical-focused questionnaire with conditional follow-ups',
      questionCount: 8,
      isActive: true,
      isDefault: true,
      version: 1,
      estimatedMinutes: 5,
    },
    {
      id: '2',
      name: 'Quick Consultation',
      description: 'Shortened questionnaire for returning patients',
      questionCount: 4,
      isActive: true,
      isDefault: false,
      version: 2,
      estimatedMinutes: 2,
    },
  ];

  // Mock question preview
  const mockQuestions = [
    { id: 1, title: 'What brings you in today?', type: 'textarea', required: false },
    { id: 2, title: 'What is your primary need?', type: 'single_choice', required: true },
    { id: 3, title: 'Have you tried medical cannabis before?', type: 'single_choice', required: true },
    { id: 4, title: 'How would you describe your tolerance?', type: 'single_choice', required: true },
    { id: 5, title: 'What is your preferred way to consume?', type: 'single_choice', required: true },
    { id: 6, title: 'When do you plan to use this?', type: 'single_choice', required: true },
  ];

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <HStack justify="space-between" wrap="wrap" gap={4}>
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="white">
              Questionnaire Management
            </Heading>
            <Text color="slate.400">
              Configure patient intake questionnaires
            </Text>
          </VStack>
          <Button leftIcon={<FiPlus />} colorScheme="cannabis">
            New Template
          </Button>
        </HStack>

        {/* Stats */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Active Templates</Text>
                <Text color="white" fontSize="2xl" fontWeight="bold">2</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Total Completions</Text>
                <Text color="cannabis.400" fontSize="2xl" fontWeight="bold">1,247</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Avg. Completion Time</Text>
                <Text color="white" fontSize="2xl" fontWeight="bold">4.2 min</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Completion Rate</Text>
                <Text color="green.400" fontSize="2xl" fontWeight="bold">89%</Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Tabs */}
        <Tabs colorScheme="cannabis" onChange={setActiveTab} index={activeTab}>
          <TabList borderColor="slate.700">
            <Tab color="slate.400" _selected={{ color: 'cannabis.400', borderColor: 'cannabis.400' }}>
              <HStack><Icon as={FiFileText} /><Text>Templates</Text></HStack>
            </Tab>
            <Tab color="slate.400" _selected={{ color: 'cannabis.400', borderColor: 'cannabis.400' }}>
              <HStack><Icon as={FiSettings} /><Text>Settings</Text></HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Templates Tab */}
            <TabPanel px={0}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                {mockTemplates.map((template) => (
                  <Card key={template.id} bg="slate.800" borderColor="slate.700" borderWidth="1px">
                    <CardHeader pb={2}>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Heading size="md" color="white">{template.name}</Heading>
                            {template.isDefault && (
                              <Badge colorScheme="cannabis">Default</Badge>
                            )}
                          </HStack>
                          <Text color="slate.400" fontSize="sm">{template.description}</Text>
                        </VStack>
                        <FormControl display="flex" alignItems="center" w="auto">
                          <FormLabel htmlFor={`active-${template.id}`} mb="0" color="slate.400" fontSize="sm">
                            Active
                          </FormLabel>
                          <Switch
                            id={`active-${template.id}`}
                            colorScheme="cannabis"
                            isChecked={template.isActive}
                          />
                        </FormControl>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={2}>
                      <HStack spacing={6} mb={4}>
                        <VStack align="start" spacing={0}>
                          <Text color="slate.500" fontSize="xs">Questions</Text>
                          <Text color="white" fontWeight="medium">{template.questionCount}</Text>
                        </VStack>
                        <VStack align="start" spacing={0}>
                          <Text color="slate.500" fontSize="xs">Est. Time</Text>
                          <Text color="white" fontWeight="medium">{template.estimatedMinutes} min</Text>
                        </VStack>
                        <VStack align="start" spacing={0}>
                          <Text color="slate.500" fontSize="xs">Version</Text>
                          <Text color="white" fontWeight="medium">v{template.version}</Text>
                        </VStack>
                      </HStack>
                      <HStack spacing={2}>
                        <Button size="sm" leftIcon={<FiEdit />} variant="outline" colorScheme="cannabis">
                          Edit
                        </Button>
                        <Button size="sm" leftIcon={<FiEye />} variant="ghost" colorScheme="cannabis">
                          Preview
                        </Button>
                        <Button size="sm" leftIcon={<FiCopy />} variant="ghost" colorScheme="cannabis">
                          Duplicate
                        </Button>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>

              {/* Question Preview */}
              <Card mt={6} bg="slate.800" borderColor="slate.700" borderWidth="1px">
                <CardHeader>
                  <Heading size="md" color="white">Question Preview - Maine Medical Cannabis Intake</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color="slate.400" borderColor="slate.700">#</Th>
                        <Th color="slate.400" borderColor="slate.700">Question</Th>
                        <Th color="slate.400" borderColor="slate.700">Type</Th>
                        <Th color="slate.400" borderColor="slate.700">Required</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {mockQuestions.map((q) => (
                        <Tr key={q.id}>
                          <Td borderColor="slate.700" color="slate.400">{q.id}</Td>
                          <Td borderColor="slate.700" color="white">{q.title}</Td>
                          <Td borderColor="slate.700">
                            <Badge colorScheme="blue" fontSize="xs">{q.type}</Badge>
                          </Td>
                          <Td borderColor="slate.700">
                            {q.required ? (
                              <Badge colorScheme="red">Required</Badge>
                            ) : (
                              <Badge colorScheme="gray">Optional</Badge>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Settings Tab */}
            <TabPanel px={0}>
              <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
                <CardHeader>
                  <Heading size="md" color="white">Questionnaire Settings</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <FormControl display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <FormLabel color="white" mb={0}>Allow Self-Service Mode</FormLabel>
                        <Text color="slate.400" fontSize="sm">Patients can complete questionnaire on their own device</Text>
                      </Box>
                      <Switch colorScheme="cannabis" defaultChecked />
                    </FormControl>
                    <FormControl display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <FormLabel color="white" mb={0}>Require Medical Card Verification</FormLabel>
                        <Text color="slate.400" fontSize="sm">Verify medical card before questionnaire</Text>
                      </Box>
                      <Switch colorScheme="cannabis" defaultChecked />
                    </FormControl>
                    <FormControl display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <FormLabel color="white" mb={0}>Auto-Generate Recommendations</FormLabel>
                        <Text color="slate.400" fontSize="sm">Use AI to suggest strains after questionnaire</Text>
                      </Box>
                      <Switch colorScheme="cannabis" defaultChecked />
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
}

export default QuestionnairePage;
