/**
 * Preview Step Component
 *
 * Second step in the import workflow. Displays:
 * - Summary statistics (ready, medical, expired, errors)
 * - Warning alerts for records with issues
 * - Sample records table with sanitized preview
 * - Failed records accordion
 */

import {
  VStack,
  SimpleGrid,
  Box,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import type { CustomerImportResult } from '../../../../../utils/customerImport';
import { SampleRecordsTable } from './SampleRecordsTable';

interface PreviewStepProps {
  importResult: CustomerImportResult;
}

/**
 * Renders the preview step with import summary and sample data
 */
export function PreviewStep({ importResult }: PreviewStepProps) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Summary Stats */}
      <ImportSummaryStats importResult={importResult} />

      {/* Warnings Alert */}
      {importResult.warnings > 0 && (
        <Alert status="warning" borderRadius="md" bg="yellow.900">
          <AlertIcon color="yellow.400" />
          <Box>
            <AlertTitle color="white">
              {importResult.warnings} records have warnings
            </AlertTitle>
            <AlertDescription color="gray.300" fontSize="sm">
              Records with warnings will still be imported. Review the details below.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Sample Records Table */}
      <SampleRecordsTable importResult={importResult} maxRows={10} />

      {/* Failed Records Accordion */}
      {importResult.failed > 0 && (
        <FailedRecordsAccordion importResult={importResult} />
      )}
    </VStack>
  );
}

interface ImportSummaryStatsProps {
  importResult: CustomerImportResult;
}

/**
 * Displays summary statistics as colored stat cards
 */
function ImportSummaryStats({ importResult }: ImportSummaryStatsProps) {
  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
      <Stat bg="green.900" p={4} borderRadius="lg">
        <StatLabel color="green.300">Ready to Import</StatLabel>
        <StatNumber color="white" fontSize="3xl">
          {importResult.successful}
        </StatNumber>
      </Stat>
      <Stat bg="purple.900" p={4} borderRadius="lg">
        <StatLabel color="purple.300">Medical Patients</StatLabel>
        <StatNumber color="white" fontSize="3xl">
          {importResult.medicalPatients}
        </StatNumber>
      </Stat>
      <Stat bg="yellow.900" p={4} borderRadius="lg">
        <StatLabel color="yellow.300">Expired Cards</StatLabel>
        <StatNumber color="white" fontSize="3xl">
          {importResult.expiredCards}
        </StatNumber>
      </Stat>
      <Stat bg="red.900" p={4} borderRadius="lg">
        <StatLabel color="red.300">Errors</StatLabel>
        <StatNumber color="white" fontSize="3xl">
          {importResult.failed}
        </StatNumber>
      </Stat>
    </SimpleGrid>
  );
}

interface FailedRecordsAccordionProps {
  importResult: CustomerImportResult;
  maxDisplay?: number;
}

/**
 * Expandable section showing failed record details
 */
function FailedRecordsAccordion({
  importResult,
  maxDisplay = 5,
}: FailedRecordsAccordionProps) {
  const failedRows = importResult.rows
    .filter((r) => r.errors.length > 0)
    .slice(0, maxDisplay);

  return (
    <Accordion allowToggle>
      <AccordionItem border="none">
        <AccordionButton
          bg="red.900"
          borderRadius="md"
          _hover={{ bg: 'red.800' }}
        >
          <Box flex="1" textAlign="left">
            <Text color="white" fontWeight="medium">
              {importResult.failed} Failed Records
            </Text>
          </Box>
          <AccordionIcon color="gray.400" />
        </AccordionButton>
        <AccordionPanel bg="gray.700" borderBottomRadius="md">
          {failedRows.map((row) => (
            <Text key={row.row} color="gray.300" fontSize="sm" mb={1}>
              Row {row.row}: {row.errors.join(', ')}
            </Text>
          ))}
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
