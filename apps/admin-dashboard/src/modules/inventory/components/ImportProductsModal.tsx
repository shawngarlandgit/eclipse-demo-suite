import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Progress,
  Box,
  Alert,
  AlertIcon,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Icon,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  parseCSV,
  transformAndValidate,
  getCategoryLabel,
  CATEGORY_GROUPS,
  type ImportValidationResult,
  type ImportProgress,
  type ImportResult,
} from '../utils/csvImport';
import { inventoryService } from '../../../services/api/inventory.service';

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispensaryId: string;
  dispensaryName?: string;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export function ImportProductsModal({
  isOpen,
  onClose,
  dispensaryId,
  dispensaryName = 'The Neon Pipe',
}: ImportProductsModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [validationResult, setValidationResult] =
    useState<ImportValidationResult | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    currentBatch: 0,
    totalBatches: 0,
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const toast = useToast();
  const queryClient = useQueryClient();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        toast({
          title: 'Parsing CSV...',
          description: 'Reading product data from file',
          status: 'info',
          duration: 2000,
        });

        const rows = await parseCSV(file);
        const result = transformAndValidate(rows, dispensaryId);

        setValidationResult(result);
        setStep('preview');

        toast({
          title: 'CSV Parsed Successfully',
          description: `Found ${result.valid.length} products ready for import`,
          status: 'success',
          duration: 3000,
        });
      } catch (error) {
        console.error('CSV parsing error:', error);
        toast({
          title: 'Error Parsing CSV',
          description:
            error instanceof Error ? error.message : 'Unknown error occurred',
          status: 'error',
          duration: 5000,
        });
      }
    },
    [dispensaryId, toast]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    noClick: true, // Disable default click, we'll handle it ourselves
    noKeyboard: true,
  });

  const handleImport = async () => {
    if (!validationResult) return;

    setStep('importing');
    setImportProgress({
      current: 0,
      total: validationResult.valid.length,
      percentage: 0,
      currentBatch: 0,
      totalBatches: Math.ceil(validationResult.valid.length / 50),
    });

    try {
      // Set the dispensary ID on the service
      inventoryService.setDispensaryId(dispensaryId);

      const result = await inventoryService.importProducts(
        validationResult.valid,
        (progress) => setImportProgress(progress)
      );

      setImportResult(result);
      setStep('complete');

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.successful} of ${result.total} products`,
        status: result.failed > 0 ? 'warning' : 'success',
        duration: 5000,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
      setStep('preview');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setValidationResult(null);
    setImportResult(null);
    setImportProgress({
      current: 0,
      total: 0,
      percentage: 0,
      currentBatch: 0,
      totalBatches: 0,
    });
    onClose();
  };

  // Group categories for display
  const getCategoryGroups = () => {
    if (!validationResult) return {};

    const groups: Record<string, { name: string; count: number }[]> = {
      Cannabis: [],
      Glass: [],
      Accessories: [],
      Electronic: [],
      Wellness: [],
      Other: [],
    };

    Object.entries(validationResult.categoryDistribution).forEach(
      ([category, count]) => {
        if (CATEGORY_GROUPS.cannabis.includes(category)) {
          groups.Cannabis.push({ name: getCategoryLabel(category), count });
        } else if (CATEGORY_GROUPS.glass.includes(category)) {
          groups.Glass.push({ name: getCategoryLabel(category), count });
        } else if (CATEGORY_GROUPS.accessories.includes(category)) {
          groups.Accessories.push({ name: getCategoryLabel(category), count });
        } else if (CATEGORY_GROUPS.electronic.includes(category)) {
          groups.Electronic.push({ name: getCategoryLabel(category), count });
        } else if (CATEGORY_GROUPS.wellness.includes(category)) {
          groups.Wellness.push({ name: getCategoryLabel(category), count });
        } else {
          groups.Other.push({ name: getCategoryLabel(category), count });
        }
      }
    );

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([, items]) => items.length > 0)
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      scrollBehavior="inside"
    >
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg="gray.800" maxH="90vh">
        <ModalHeader color="white" borderBottomWidth="1px" borderColor="gray.700">
          <HStack spacing={3}>
            <Icon as={ArrowUpTrayIcon} boxSize={6} color="green.400" />
            <Text>Import Products to {dispensaryName}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" />

        <ModalBody py={6}>
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <VStack spacing={6}>
              <Box
                {...getRootProps()}
                onClick={open}
                w="full"
                border="2px dashed"
                borderColor={isDragActive ? 'green.400' : 'gray.600'}
                borderRadius="xl"
                p={12}
                textAlign="center"
                cursor="pointer"
                bg={isDragActive ? 'green.900' : 'gray.700'}
                transition="all 0.2s"
                _hover={{ borderColor: 'green.400', bg: 'gray.700' }}
              >
                <input {...getInputProps()} />
                <VStack spacing={4}>
                  <Icon
                    as={DocumentTextIcon}
                    boxSize={12}
                    color={isDragActive ? 'green.400' : 'gray.400'}
                  />
                  <Text color="white" fontSize="lg" fontWeight="medium">
                    {isDragActive
                      ? 'Drop the CSV file here...'
                      : 'Drag & drop a CSV file here, or click to select'}
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    Supports CSV exports from Vend/Lightspeed POS
                  </Text>
                </VStack>
              </Box>

              <Alert status="info" borderRadius="md" bg="blue.900">
                <AlertIcon color="blue.400" />
                <Box>
                  <Text fontWeight="medium" color="white">
                    All inventory quantities will be set to 0
                  </Text>
                  <Text fontSize="sm" color="gray.300">
                    This allows for a fresh inventory count when going live.
                    Product names, pricing, and categories will be imported.
                  </Text>
                </Box>
              </Alert>
            </VStack>
          )}

          {/* STEP 2: Preview */}
          {step === 'preview' && validationResult && (
            <VStack spacing={6} align="stretch">
              {/* Summary Stats */}
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                <Stat bg="green.900" p={4} borderRadius="lg">
                  <StatLabel color="green.300">Ready to Import</StatLabel>
                  <StatNumber color="white" fontSize="3xl">
                    {validationResult.valid.length}
                  </StatNumber>
                </Stat>
                <Stat bg="red.900" p={4} borderRadius="lg">
                  <StatLabel color="red.300">Errors</StatLabel>
                  <StatNumber color="white" fontSize="3xl">
                    {validationResult.errors.length}
                  </StatNumber>
                </Stat>
                <Stat bg="yellow.900" p={4} borderRadius="lg">
                  <StatLabel color="yellow.300">Warnings</StatLabel>
                  <StatNumber color="white" fontSize="3xl">
                    {validationResult.warnings.length}
                  </StatNumber>
                </Stat>
                <Stat bg="purple.900" p={4} borderRadius="lg">
                  <StatLabel color="purple.300">Duplicates</StatLabel>
                  <StatNumber color="white" fontSize="3xl">
                    {validationResult.duplicates.length}
                  </StatNumber>
                </Stat>
              </SimpleGrid>

              {/* Category Distribution */}
              <Box bg="gray.700" p={4} borderRadius="lg">
                <Text color="white" fontWeight="medium" mb={3}>
                  Category Distribution
                </Text>
                <Accordion allowMultiple defaultIndex={[0]}>
                  {Object.entries(getCategoryGroups()).map(
                    ([groupName, items]) => (
                      <AccordionItem
                        key={groupName}
                        border="none"
                        mb={2}
                      >
                        <AccordionButton
                          bg="gray.600"
                          borderRadius="md"
                          _hover={{ bg: 'gray.500' }}
                          _expanded={{ bg: 'gray.600', borderBottomRadius: 0 }}
                        >
                          <Box flex="1" textAlign="left">
                            <HStack>
                              <Text color="white" fontWeight="medium">
                                {groupName}
                              </Text>
                              <Badge colorScheme="blue">
                                {items.reduce((sum, i) => sum + i.count, 0)}
                              </Badge>
                            </HStack>
                          </Box>
                          <AccordionIcon color="gray.400" />
                        </AccordionButton>
                        <AccordionPanel
                          bg="gray.650"
                          borderBottomRadius="md"
                          pb={2}
                        >
                          <Flex flexWrap="wrap" gap={2} pt={2}>
                            {items.map(({ name, count }) => (
                              <Badge
                                key={name}
                                colorScheme="gray"
                                px={2}
                                py={1}
                                borderRadius="md"
                              >
                                {name}: {count}
                              </Badge>
                            ))}
                          </Flex>
                        </AccordionPanel>
                      </AccordionItem>
                    )
                  )}
                </Accordion>
              </Box>

              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <Alert status="error" borderRadius="md" bg="red.900">
                  <AlertIcon color="red.400" />
                  <Box>
                    <Text fontWeight="bold" color="white">
                      {validationResult.errors.length} products will be skipped
                    </Text>
                    <Text fontSize="sm" color="gray.300">
                      Row {validationResult.errors[0].row}:{' '}
                      {validationResult.errors[0].message}
                      {validationResult.errors.length > 1 &&
                        ` (and ${validationResult.errors.length - 1} more)`}
                    </Text>
                  </Box>
                </Alert>
              )}

              {/* Preview Table */}
              <Box>
                <Text color="white" fontWeight="medium" mb={2}>
                  Preview (first 10 products)
                </Text>
                <Box
                  maxH="250px"
                  overflowY="auto"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.600"
                >
                  <Table size="sm" variant="simple">
                    <Thead bg="gray.700" position="sticky" top={0}>
                      <Tr>
                        <Th color="gray.300">SKU</Th>
                        <Th color="gray.300">Name</Th>
                        <Th color="gray.300">Category</Th>
                        <Th color="gray.300" isNumeric>Cost</Th>
                        <Th color="gray.300" isNumeric>Retail</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {validationResult.valid.slice(0, 10).map((product) => (
                        <Tr key={product.sku} _hover={{ bg: 'gray.700' }}>
                          <Td color="gray.300" fontSize="sm">
                            {product.sku}
                          </Td>
                          <Td
                            color="white"
                            fontSize="sm"
                            maxW="200px"
                            isTruncated
                          >
                            {product.name}
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={
                                CATEGORY_GROUPS.cannabis.includes(
                                  product.product_type
                                )
                                  ? 'green'
                                  : 'gray'
                              }
                              fontSize="xs"
                            >
                              {getCategoryLabel(product.product_type)}
                            </Badge>
                          </Td>
                          <Td color="gray.300" fontSize="sm" isNumeric>
                            ${product.cost_price.toFixed(2)}
                          </Td>
                          <Td color="white" fontSize="sm" isNumeric>
                            ${product.retail_price.toFixed(2)}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
                {validationResult.valid.length > 10 && (
                  <Text color="gray.400" fontSize="sm" mt={2} textAlign="center">
                    Showing 10 of {validationResult.valid.length} products
                  </Text>
                )}
              </Box>
            </VStack>
          )}

          {/* STEP 3: Importing */}
          {step === 'importing' && (
            <VStack spacing={6} py={8}>
              <Icon as={ArrowUpTrayIcon} boxSize={12} color="green.400" />
              <Text color="white" fontSize="xl" fontWeight="medium">
                Importing Products...
              </Text>
              <Box w="full" maxW="400px">
                <Progress
                  value={importProgress.percentage}
                  size="lg"
                  colorScheme="green"
                  borderRadius="full"
                  bg="gray.600"
                  hasStripe
                  isAnimated
                />
              </Box>
              <VStack spacing={1}>
                <Text color="white" fontSize="lg">
                  {importProgress.current} of {importProgress.total} products
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Batch {importProgress.currentBatch} of{' '}
                  {importProgress.totalBatches}
                </Text>
              </VStack>
            </VStack>
          )}

          {/* STEP 4: Complete */}
          {step === 'complete' && importResult && (
            <VStack spacing={6} py={8}>
              <Icon
                as={
                  importResult.failed === 0
                    ? CheckCircleIcon
                    : ExclamationTriangleIcon
                }
                boxSize={16}
                color={importResult.failed === 0 ? 'green.400' : 'yellow.400'}
              />
              <Text color="white" fontSize="2xl" fontWeight="bold">
                Import Complete!
              </Text>

              <SimpleGrid columns={2} spacing={4} w="full" maxW="300px">
                <Stat textAlign="center">
                  <StatLabel color="gray.400">Successful</StatLabel>
                  <StatNumber color="green.400">
                    {importResult.successful}
                  </StatNumber>
                </Stat>
                <Stat textAlign="center">
                  <StatLabel color="gray.400">Failed</StatLabel>
                  <StatNumber
                    color={importResult.failed > 0 ? 'red.400' : 'gray.400'}
                  >
                    {importResult.failed}
                  </StatNumber>
                </Stat>
              </SimpleGrid>

              {importResult.failed > 0 && (
                <Alert status="warning" borderRadius="md" maxW="400px">
                  <AlertIcon />
                  <Text fontSize="sm">
                    {importResult.failed} products failed to import. Check
                    console for details.
                  </Text>
                </Alert>
              )}

              <Divider borderColor="gray.600" />

              <Text color="gray.400" fontSize="sm" textAlign="center">
                Products are now available in your inventory.
                <br />
                All quantities are set to 0 for fresh inventory count.
              </Text>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor="gray.700">
          {step === 'upload' && (
            <Button variant="ghost" color="gray.400" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === 'preview' && (
            <HStack spacing={3}>
              <Button
                variant="ghost"
                color="gray.400"
                onClick={() => setStep('upload')}
              >
                Back
              </Button>
              <Button
                colorScheme="green"
                onClick={handleImport}
                isDisabled={
                  !validationResult || validationResult.valid.length === 0
                }
                leftIcon={<Icon as={ArrowUpTrayIcon} />}
              >
                Import {validationResult?.valid.length || 0} Products
              </Button>
            </HStack>
          )}

          {step === 'complete' && (
            <Button colorScheme="blue" onClick={handleClose}>
              Done
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ImportProductsModal;
