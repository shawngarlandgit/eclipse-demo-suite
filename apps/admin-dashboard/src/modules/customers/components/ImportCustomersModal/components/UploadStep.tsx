/**
 * Upload Step Component
 *
 * First step in the import workflow. Displays:
 * - MMCP compliance banner
 * - Drag-and-drop file upload zone
 * - Data protection information
 */

import {
  VStack,
  Box,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
} from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { DataProtectionInfo } from './DataProtectionInfo';

interface UploadStepProps {
  onFileDrop: (files: File[]) => Promise<void>;
}

/**
 * Renders the upload step with dropzone and compliance info
 */
export function UploadStep({ onFileDrop }: UploadStepProps) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: onFileDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <VStack spacing={6}>
      {/* Compliance Banner */}
      <Alert status="info" borderRadius="md" bg="blue.900">
        <AlertIcon color="blue.400" />
        <Box>
          <AlertTitle color="white">Maine MMCP Compliant Import</AlertTitle>
          <AlertDescription color="gray.300" fontSize="sm">
            All PII will be encrypted or hashed before storage. Medical card numbers,
            license numbers, and contact info are protected per state requirements.
          </AlertDescription>
        </Box>
      </Alert>

      {/* Drop Zone */}
      <Box
        {...getRootProps()}
        onClick={open}
        w="full"
        border="2px dashed"
        borderColor={isDragActive ? 'blue.400' : 'gray.600'}
        borderRadius="xl"
        p={12}
        textAlign="center"
        cursor="pointer"
        bg={isDragActive ? 'blue.900' : 'gray.700'}
        transition="all 0.2s"
        _hover={{ borderColor: 'blue.400', bg: 'gray.700' }}
      >
        <input {...getInputProps()} />
        <VStack spacing={4}>
          <Icon
            as={DocumentTextIcon}
            boxSize={12}
            color={isDragActive ? 'blue.400' : 'gray.400'}
          />
          <Text color="white" fontSize="lg" fontWeight="medium">
            {isDragActive
              ? 'Drop the CSV file here...'
              : 'Drag & drop a Vend customer CSV, or click to select'}
          </Text>
          <Text color="gray.400" fontSize="sm">
            Supports Vend/Lightspeed POS customer exports
          </Text>
        </VStack>
      </Box>

      {/* Data Protection Info */}
      <DataProtectionInfo />
    </VStack>
  );
}
