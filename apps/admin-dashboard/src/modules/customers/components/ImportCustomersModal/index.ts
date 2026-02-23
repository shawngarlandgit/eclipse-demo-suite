/**
 * Import Customers Modal - Barrel Export
 *
 * Re-exports the main component and types for external usage.
 * Maintains the same public API as the original single-file component.
 */

export { ImportCustomersModal, default } from './ImportCustomersModal';
export type {
  ImportCustomersModalProps,
  ImportStep,
  ImportProgress,
  DbInsertResult,
} from './types';
