/**
 * Sample Records Table
 *
 * Displays a preview of imported customer records with
 * sanitized data (hashes instead of actual PII).
 */

import {
  Box,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Code,
  Tooltip,
} from '@chakra-ui/react';
import type { CustomerImportResult } from '../../../../../utils/customerImport';

interface SampleRecordsTableProps {
  importResult: CustomerImportResult;
  maxRows?: number;
}

/**
 * Renders a scrollable table of sample customer records
 */
export function SampleRecordsTable({
  importResult,
  maxRows = 10,
}: SampleRecordsTableProps) {
  const displayedRows = importResult.rows.slice(0, maxRows);

  return (
    <Box>
      <Text color="white" fontWeight="medium" mb={2}>
        Sample Records (sanitized preview)
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
              <Th color="gray.300">Row</Th>
              <Th color="gray.300">Customer Code</Th>
              <Th color="gray.300">Email</Th>
              <Th color="gray.300">Medical</Th>
              <Th color="gray.300">Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {displayedRows.map((row) => (
              <Tr key={row.row} _hover={{ bg: 'gray.700' }}>
                <Td color="gray.300" fontSize="sm">
                  {row.row}
                </Td>
                <Td color="white" fontSize="sm">
                  {row.sanitized?.customer_code || '-'}
                </Td>
                <Td color="gray.300" fontSize="sm">
                  <Tooltip label="Email is hashed - cannot be displayed">
                    {row.sanitized?.email_hash ? (
                      <Code fontSize="xs" colorScheme="blue">
                        {row.sanitized.email_hash.substring(0, 8)}...
                      </Code>
                    ) : (
                      '-'
                    )}
                  </Tooltip>
                </Td>
                <Td>
                  {row.sanitized?.is_medical_patient ? (
                    <Badge colorScheme="purple" fontSize="xs">
                      Medical
                    </Badge>
                  ) : (
                    <Badge colorScheme="gray" fontSize="xs">
                      Rec
                    </Badge>
                  )}
                </Td>
                <Td>
                  <RecordStatusBadge
                    errors={row.errors}
                    warnings={row.warnings}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      {importResult.total > maxRows && (
        <Text color="gray.400" fontSize="sm" mt={2} textAlign="center">
          Showing {maxRows} of {importResult.total} records
        </Text>
      )}
    </Box>
  );
}

interface RecordStatusBadgeProps {
  errors: string[];
  warnings: string[];
}

/**
 * Displays appropriate status badge based on errors/warnings
 */
function RecordStatusBadge({ errors, warnings }: RecordStatusBadgeProps) {
  if (errors.length > 0) {
    return (
      <Tooltip label={errors.join(', ')}>
        <Badge colorScheme="red" fontSize="xs">
          Error
        </Badge>
      </Tooltip>
    );
  }

  if (warnings.length > 0) {
    return (
      <Tooltip label={warnings.join(', ')}>
        <Badge colorScheme="yellow" fontSize="xs">
          Warning
        </Badge>
      </Tooltip>
    );
  }

  return (
    <Badge colorScheme="green" fontSize="xs">
      Ready
    </Badge>
  );
}
