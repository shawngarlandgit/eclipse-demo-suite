/**
 * Types for Import Customers Modal
 *
 * Defines all TypeScript interfaces and types used across
 * the customer import feature components.
 */

import type { CustomerImportResult } from '../../../../utils/customerImport';

/**
 * Props for the main ImportCustomersModal component
 */
export interface ImportCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispensaryId: string;
  dispensaryName?: string;
}

/**
 * Represents the current step in the import workflow
 */
export type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

/**
 * Progress tracking for import operations
 */
export interface ImportProgress {
  current: number;
  total: number;
}

/**
 * Result of database insert operation
 */
export interface DbInsertResult {
  inserted: number;
  failed: number;
  errors: string[];
}

/**
 * State returned by useCustomerImport hook
 */
export interface CustomerImportState {
  step: ImportStep;
  importResult: CustomerImportResult | null;
  importProgress: ImportProgress;
  encryptionKeyReady: boolean;
  dbInsertResult: DbInsertResult | null;
}

/**
 * Actions returned by useCustomerImport hook
 */
export interface CustomerImportActions {
  setStep: (step: ImportStep) => void;
  handleFileDrop: (files: File[]) => Promise<void>;
  handleImport: () => Promise<void>;
  handleClose: () => void;
}

/**
 * Combined hook return type
 */
export interface UseCustomerImportReturn extends CustomerImportState, CustomerImportActions {}
