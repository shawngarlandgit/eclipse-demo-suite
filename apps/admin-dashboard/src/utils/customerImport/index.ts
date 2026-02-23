/**
 * Customer Import Module
 *
 * Provides MMCP-compliant customer data import from Vend POS exports.
 *
 * Features:
 * - Note field parsing (extracts DL, patient#, DOB, expiration)
 * - SHA-256 hashing for identifiers
 * - AES-256-GCM encryption for retrievable PII
 * - Data minimization (discards unnecessary fields)
 * - Comprehensive validation and warnings
 *
 * @module customerImport
 */

export { parseNoteField, isValidMedicalPatient, getSanitizedNoteSummary } from './noteParser';
export type { ParsedNoteData } from './noteParser';

export {
  initializeEncryptionKey,
  hashPII,
  encryptPII,
  decryptPII,
  normalizePhone,
  normalizeEmail,
  formatAddress,
  parseNumeric,
  parseBoolean,
  formatDateISO,
} from './piiSanitizer';
export type { SanitizedCustomerData } from './piiSanitizer';

export {
  parseCSVFile,
  processCustomerCSV,
  generateImportSummary,
  getSuccessfulRecords,
} from './csvProcessor';
export type {
  VendCustomerRow,
  ProcessedCustomerRow,
  CustomerImportResult,
} from './csvProcessor';
