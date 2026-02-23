/**
 * Import Customers Modal - Legacy Re-export
 *
 * This file has been refactored into the ImportCustomersModal/ directory.
 * This re-export maintains backward compatibility for existing imports.
 *
 * @see ./ImportCustomersModal/ImportCustomersModal.tsx - Main component
 * @see ./ImportCustomersModal/useCustomerImport.ts - Business logic hook
 * @see ./ImportCustomersModal/components/ - UI sub-components
 */

export {
  ImportCustomersModal,
  default,
  type ImportCustomersModalProps,
  type ImportStep,
  type ImportProgress,
  type DbInsertResult,
} from './ImportCustomersModal/index';
