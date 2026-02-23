/**
 * Import Customers Modal
 *
 * MMCP-compliant customer import from Vend POS CSV exports.
 *
 * Features:
 * - Drag & drop CSV upload
 * - PII sanitization preview
 * - Medical patient detection
 * - Expired card warnings
 * - Progress tracking
 * - Audit logging
 *
 * This component orchestrates the import workflow through four steps:
 * 1. Upload - File selection with compliance info
 * 2. Preview - Data validation and summary
 * 3. Importing - Progress tracking
 * 4. Complete - Success confirmation
 */

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  HStack,
  Text,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { useCustomerImport } from './useCustomerImport';
import {
  UploadStep,
  PreviewStep,
  ImportingStep,
  CompleteStep,
  ModalFooterActions,
} from './components';
import type { ImportCustomersModalProps } from './types';

/**
 * Main modal component for importing customers from CSV
 */
export function ImportCustomersModal({
  isOpen,
  onClose,
  dispensaryId,
  dispensaryName = 'Dispensary',
}: ImportCustomersModalProps) {
  const {
    // State
    step,
    importResult,
    importProgress,
    dbInsertResult,
    // Actions
    setStep,
    handleFileDrop,
    handleImport,
    handleClose,
  } = useCustomerImport({
    dispensaryId,
    isOpen,
    onClose,
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg="gray.800" maxH="90vh">
        <ModalHeader color="white" borderBottomWidth="1px" borderColor="gray.700">
          <HStack spacing={3}>
            <Icon as={UserGroupIcon} boxSize={6} color="blue.400" />
            <Text>Import Customers - {dispensaryName}</Text>
            <Badge colorScheme="green" fontSize="xs">
              MMCP Compliant
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" />

        <ModalBody py={6}>
          {step === 'upload' && (
            <UploadStep onFileDrop={handleFileDrop} />
          )}

          {step === 'preview' && importResult && (
            <PreviewStep importResult={importResult} />
          )}

          {step === 'importing' && (
            <ImportingStep progress={importProgress} />
          )}

          {step === 'complete' && dbInsertResult && (
            <CompleteStep result={dbInsertResult} />
          )}
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor="gray.700">
          <ModalFooterActions
            step={step}
            importResult={importResult}
            onBack={() => setStep('upload')}
            onImport={handleImport}
            onClose={handleClose}
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ImportCustomersModal;
