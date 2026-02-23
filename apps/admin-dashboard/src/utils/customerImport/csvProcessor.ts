/**
 * CSV Processor for Vend Customer Import
 *
 * Processes Vend POS customer exports with full PII sanitization
 * for Maine MMCP compliance.
 *
 * Data Flow:
 * 1. Parse CSV file
 * 2. Extract structured data from note field
 * 3. Hash identifiers (email, phone, license, patient#)
 * 4. Encrypt retrievable PII (names, DOB, address)
 * 5. Return sanitized records ready for database insertion
 *
 * @module customerImport/csvProcessor
 */

import Papa from 'papaparse';
import { parseNoteField, getSanitizedNoteSummary as _getSanitizedNoteSummary, type ParsedNoteData } from './noteParser';
import {
  hashPII,
  encryptPII,
  normalizePhone,
  normalizeEmail,
  formatAddress,
  parseNumeric,
  parseBoolean,
  formatDateISO,
  type SanitizedCustomerData,
} from './piiSanitizer';

// Raw CSV row from Vend export
export interface VendCustomerRow {
  first_name?: string;
  last_name?: string;
  company_name?: string;
  customer_code?: string;
  customer_group_name?: string;
  sex?: string;
  date_of_birth?: string;
  note?: string;
  email?: string;
  do_not_email?: string;
  mobile?: string;
  phone?: string;
  fax?: string;
  website?: string;
  // Postal address (not importing per data minimization)
  postal_address1?: string;
  postal_address2?: string;
  postal_suburb?: string;
  postal_city?: string;
  postal_postcode?: string;
  postal_state?: string;
  postal_country_id?: string;
  // Physical address (importing for delivery)
  physical_address1?: string;
  physical_address2?: string;
  physical_suburb?: string;
  physical_city?: string;
  physical_postcode?: string;
  physical_state?: string;
  physical_country_id?: string;
  // Loyalty/Account
  store_credit_balance?: string;
  balance?: string;
  on_account_limit?: string;
  year_to_date?: string;
  enable_loyalty?: string;
  loyalty_balance?: string;
  loyalty_bonus_claimed?: string;
  loyalty_email_sent?: string;
  // Custom fields
  custom_field_1?: string;
  custom_field_2?: string;
  custom_field_3?: string;
  custom_field_4?: string;
}

// Processing result for a single row
export interface ProcessedCustomerRow {
  row: number;
  original: VendCustomerRow;
  sanitized: SanitizedCustomerData | null;
  parsedNote: ParsedNoteData;
  errors: string[];
  warnings: string[];
}

// Overall import result
export interface CustomerImportResult {
  total: number;
  successful: number;
  failed: number;
  warnings: number;
  medicalPatients: number;
  expiredCards: number;
  rows: ProcessedCustomerRow[];
  processingTime: number;
}

/**
 * Parse a CSV file into raw rows
 */
export function parseCSVFile(file: File): Promise<VendCustomerRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<VendCustomerRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        resolve(results.data);
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

/**
 * Process a single customer row with full PII sanitization
 */
async function processCustomerRow(
  row: VendCustomerRow,
  rowIndex: number,
  importSource: string
): Promise<ProcessedCustomerRow> {
  const result: ProcessedCustomerRow = {
    row: rowIndex,
    original: row,
    sanitized: null,
    parsedNote: parseNoteField(row.note),
    errors: [],
    warnings: [],
  };

  // Add note parsing warnings
  result.warnings.push(...result.parsedNote.warnings);

  try {
    // Validate required field
    if (!row.customer_code) {
      result.errors.push('Missing customer_code');
      return result;
    }

    // Get phone from mobile or phone field
    const phoneRaw = row.mobile || row.phone;
    const normalizedPhone = normalizePhone(phoneRaw);

    // Get email (sometimes in wrong field, check note too)
    let emailRaw = row.email;
    if (!emailRaw && row.note?.includes('@')) {
      // Try to extract email from note
      const emailMatch = row.note.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        emailRaw = emailMatch[0];
        result.warnings.push('Email extracted from note field');
      }
    }
    const normalizedEmail = normalizeEmail(emailRaw);

    // Format physical address
    const formattedAddress = formatAddress(
      row.physical_address1 ?? null,
      row.physical_address2 ?? null,
      row.physical_city ?? null,
      row.physical_state ?? null,
      row.physical_postcode ?? null
    );

    // Determine primary identifier for hashing
    // Priority: license number > medical card > email > phone
    const licenseNumber = result.parsedNote.driverLicenseNumber;
    const medicalCardNumber = result.parsedNote.medicalCardNumber;

    // Build sanitized record
    const sanitized: SanitizedCustomerData = {
      // Hashed identifiers
      email_hash: await hashPII(normalizedEmail),
      phone_hash: await hashPII(normalizedPhone),
      license_number_hash: await hashPII(licenseNumber),
      medical_card_hash: await hashPII(medicalCardNumber),

      // Encrypted fields
      first_name_encrypted: await encryptPII(row.first_name?.trim()),
      last_name_encrypted: await encryptPII(row.last_name?.trim()),
      date_of_birth_encrypted: await encryptPII(
        result.parsedNote.dateOfBirth
          ? formatDateISO(result.parsedNote.dateOfBirth)
          : row.date_of_birth
      ),
      physical_address_encrypted: await encryptPII(formattedAddress),

      // Plain text (non-PII)
      customer_code: row.customer_code,
      customer_group: row.customer_group_name || 'All Customers',
      is_medical_patient: result.parsedNote.isMedicalPatient,
      medical_card_expiration: formatDateISO(result.parsedNote.expirationDate),
      do_not_email: parseBoolean(row.do_not_email),
      enable_loyalty: parseBoolean(row.enable_loyalty, true),
      loyalty_balance: parseNumeric(row.loyalty_balance),
      store_credit_balance: parseNumeric(row.store_credit_balance),
      year_to_date: parseNumeric(row.year_to_date),

      // Metadata
      imported_at: new Date().toISOString(),
      import_source: importSource,
      import_warnings: result.warnings,
    };

    // Validation warnings
    if (!sanitized.email_hash && !sanitized.phone_hash && !sanitized.license_number_hash) {
      result.warnings.push('No contact method available (no email, phone, or license)');
    }

    if (sanitized.is_medical_patient && !sanitized.medical_card_hash) {
      result.warnings.push('Medical patient flag set but no card number found');
    }

    if (sanitized.medical_card_expiration) {
      const expDate = new Date(sanitized.medical_card_expiration);
      if (expDate < new Date()) {
        result.warnings.push('Medical card is expired');
      }
    }

    result.sanitized = sanitized;
  } catch (error) {
    result.errors.push(
      `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}

/**
 * Process all rows from a Vend customer CSV export
 *
 * @param file - CSV file to process
 * @param importSource - Identifier for this import (e.g., filename)
 * @param onProgress - Optional callback for progress updates
 */
export async function processCustomerCSV(
  file: File,
  importSource: string,
  onProgress?: (current: number, total: number) => void
): Promise<CustomerImportResult> {
  const startTime = Date.now();

  // Parse CSV
  const rows = await parseCSVFile(file);

  const result: CustomerImportResult = {
    total: rows.length,
    successful: 0,
    failed: 0,
    warnings: 0,
    medicalPatients: 0,
    expiredCards: 0,
    rows: [],
    processingTime: 0,
  };

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const processedRow = await processCustomerRow(rows[i], i + 2, importSource); // +2 for 1-indexed + header

    result.rows.push(processedRow);

    if (processedRow.errors.length > 0) {
      result.failed++;
    } else {
      result.successful++;
    }

    if (processedRow.warnings.length > 0) {
      result.warnings++;
    }

    if (processedRow.sanitized?.is_medical_patient) {
      result.medicalPatients++;
    }

    if (processedRow.parsedNote.expirationDate && processedRow.parsedNote.expirationDate < new Date()) {
      result.expiredCards++;
    }

    // Report progress
    if (onProgress && i % 50 === 0) {
      onProgress(i + 1, rows.length);
    }
  }

  result.processingTime = Date.now() - startTime;

  return result;
}

/**
 * Generate a summary report of the import (safe for logging - no PII)
 */
export function generateImportSummary(result: CustomerImportResult): string {
  const lines = [
    '=== Customer Import Summary ===',
    `Total Records: ${result.total}`,
    `Successful: ${result.successful}`,
    `Failed: ${result.failed}`,
    `With Warnings: ${result.warnings}`,
    `Medical Patients: ${result.medicalPatients}`,
    `Expired Cards: ${result.expiredCards}`,
    `Processing Time: ${result.processingTime}ms`,
    '',
  ];

  // Add sample of failures
  const failures = result.rows.filter(r => r.errors.length > 0).slice(0, 5);
  if (failures.length > 0) {
    lines.push('--- Sample Failures ---');
    failures.forEach(f => {
      lines.push(`Row ${f.row}: ${f.errors.join(', ')}`);
    });
    lines.push('');
  }

  // Add sample of warnings
  const warned = result.rows.filter(r => r.warnings.length > 0 && r.errors.length === 0).slice(0, 5);
  if (warned.length > 0) {
    lines.push('--- Sample Warnings ---');
    warned.forEach(w => {
      lines.push(`Row ${w.row}: ${w.warnings.join(', ')}`);
    });
  }

  return lines.join('\n');
}

/**
 * Get only the successfully sanitized records
 */
export function getSuccessfulRecords(result: CustomerImportResult): SanitizedCustomerData[] {
  return result.rows
    .filter(r => r.sanitized !== null && r.errors.length === 0)
    .map(r => r.sanitized!);
}

export default {
  parseCSVFile,
  processCustomerCSV,
  generateImportSummary,
  getSuccessfulRecords,
};
