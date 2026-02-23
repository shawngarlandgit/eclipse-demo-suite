/**
 * Modal Footer Actions Component
 *
 * Renders appropriate action buttons based on current step:
 * - Upload: Cancel button
 * - Preview: Back and Import buttons
 * - Importing: No buttons (processing)
 * - Complete: Done button
 */

import { HStack, Button, Icon } from '@chakra-ui/react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import type { ImportStep } from '../types';
import type { CustomerImportResult } from '../../../../../utils/customerImport';

interface ModalFooterActionsProps {
  step: ImportStep;
  importResult: CustomerImportResult | null;
  onBack: () => void;
  onImport: () => void;
  onClose: () => void;
}

/**
 * Renders step-appropriate footer action buttons
 */
export function ModalFooterActions({
  step,
  importResult,
  onBack,
  onImport,
  onClose,
}: ModalFooterActionsProps) {
  switch (step) {
    case 'upload':
      return (
        <Button variant="ghost" color="gray.400" onClick={onClose}>
          Cancel
        </Button>
      );

    case 'preview':
      return (
        <HStack spacing={3}>
          <Button variant="ghost" color="gray.400" onClick={onBack}>
            Back
          </Button>
          <Button
            colorScheme="blue"
            onClick={onImport}
            isDisabled={!importResult || importResult.successful === 0}
            leftIcon={<Icon as={ArrowUpTrayIcon} />}
          >
            Import {importResult?.successful || 0} Customers
          </Button>
        </HStack>
      );

    case 'importing':
      // No buttons during import
      return null;

    case 'complete':
      return (
        <Button colorScheme="blue" onClick={onClose}>
          Done
        </Button>
      );

    default:
      return null;
  }
}
