/**
 * Note Field Parser for Vend POS Customer Data
 *
 * Extracts structured PII from free-form note fields containing:
 * - Driver's License numbers (DL)
 * - Medical patient card numbers
 * - Dates of birth (DOB)
 * - Card expiration dates
 *
 * COMPLIANCE: This parser extracts data that will be:
 * - DL numbers → SHA-256 hashed (never stored plain)
 * - Patient numbers → SHA-256 hashed (never stored plain)
 * - DOB → AES-256-GCM encrypted (needed for age verification)
 * - Expiration dates → Stored plain (non-PII, needed for validity checks)
 *
 * @module customerImport/noteParser
 */

export interface ParsedNoteData {
  /** Driver's License number (to be hashed) */
  driverLicenseNumber: string | null;
  /** Medical patient/card number (to be hashed) */
  medicalCardNumber: string | null;
  /** Date of birth (to be encrypted) */
  dateOfBirth: Date | null;
  /** Card expiration date */
  expirationDate: Date | null;
  /** Whether this customer has medical card info */
  isMedicalPatient: boolean;
  /** Any unparsed content from the note */
  rawNote: string;
  /** Parsing warnings/issues */
  warnings: string[];
}

// Common date formats found in notes
const DATE_PATTERNS = [
  // MM/DD/YYYY or M/D/YYYY
  /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
  // MM-DD-YYYY
  /(\d{1,2})-(\d{1,2})-(\d{2,4})/,
  // Month DD, YYYY (e.g., "Jan 15, 2025")
  /([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{2,4})/,
];

// Patterns for extracting specific fields
const PATTERNS = {
  // Driver's License: "DL:3360258" or "DL 3360258" or just 7-digit number at start
  driverLicense: [
    /DL[:\s]*(\d{6,10})/i,
    /Driver'?s?\s*License[:\s]*(\d{6,10})/i,
    /^(\d{7})(?:\s|<br>|$)/,  // 7-digit number at start of note
  ],

  // Medical Card: "Patient: 25207006" or "Patient # 249401708" or 9-digit number
  medicalCard: [
    /Patient[:\s#]*\s*(\d{8,10})/i,
    /Card[:\s#]*\s*(\d{8,10})/i,
    /Med(?:ical)?[:\s#]*\s*(\d{8,10})/i,
    // 9-digit numbers that look like Maine patient IDs (typically 2XXXXXXXX format)
    /\b(2\d{8})\b/,
    // Also match standalone 8-9 digit numbers after first number
    /(?:^|\s|<br>)(\d{8,9})(?:\s|<br>|$)/,
  ],

  // DOB: "DOB: 6/20/1977" or "DOB 1/22/1964"
  dateOfBirth: [
    /DOB[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /DOB[:\s]*(\d{1,2}-\d{1,2}-\d{2,4})/i,
    /Date\s*of\s*Birth[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  ],

  // Expiration: "Exp 7/1/26" or "Exp6/23/24" or just date at end
  expiration: [
    /Exp(?:ir(?:es?|ation)?)?[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /Exp(?:ir(?:es?|ation)?)?[:\s]*(\d{1,2}-\d{1,2}-\d{2,4})/i,
    // Date at end of note (likely expiration)
    /(\d{1,2}\/\d{1,2}\/\d{2,4})$/,
  ],
};

/**
 * Parse a date string into a Date object
 * Handles various formats and 2-digit years
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try each pattern
  for (const pattern of DATE_PATTERNS) {
    const match = dateStr.match(pattern);
    if (match) {
      let month: number, day: number, year: number;

      if (match[1].match(/[A-Za-z]/)) {
        // Month name format
        const monthNames: Record<string, number> = {
          jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
          jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
        };
        month = monthNames[match[1].toLowerCase().substring(0, 3)] || 1;
        day = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
      } else {
        // Numeric format
        month = parseInt(match[1], 10);
        day = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
      }

      // Handle 2-digit years
      if (year < 100) {
        // Assume 20XX for years 00-50, 19XX for 51-99
        year = year <= 50 ? 2000 + year : 1900 + year;
      }

      // Validate ranges
      if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
        continue;
      }

      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

/**
 * Extract a field using multiple patterns
 */
function extractField(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Parse the note field and extract structured PII data
 *
 * @param note - Raw note field from Vend export
 * @returns Parsed data with warnings
 */
export function parseNoteField(note: string | null | undefined): ParsedNoteData {
  const result: ParsedNoteData = {
    driverLicenseNumber: null,
    medicalCardNumber: null,
    dateOfBirth: null,
    expirationDate: null,
    isMedicalPatient: false,
    rawNote: note || '',
    warnings: [],
  };

  if (!note || note.trim() === '') {
    return result;
  }

  // Normalize: replace <br> with newlines, trim whitespace
  const normalized = note
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract Driver's License
  result.driverLicenseNumber = extractField(normalized, PATTERNS.driverLicense);

  // Extract Medical Card Number
  result.medicalCardNumber = extractField(normalized, PATTERNS.medicalCard);

  // If we found a medical card number, mark as medical patient
  if (result.medicalCardNumber) {
    result.isMedicalPatient = true;
  }

  // Extract DOB
  const dobStr = extractField(normalized, PATTERNS.dateOfBirth);
  if (dobStr) {
    result.dateOfBirth = parseDate(dobStr);
    if (!result.dateOfBirth) {
      result.warnings.push(`Could not parse DOB: ${dobStr}`);
    }
  }

  // Extract Expiration Date
  const expStr = extractField(normalized, PATTERNS.expiration);
  if (expStr) {
    result.expirationDate = parseDate(expStr);
    if (!result.expirationDate) {
      result.warnings.push(`Could not parse expiration: ${expStr}`);
    }
  }

  // Validation warnings
  if (result.driverLicenseNumber && result.driverLicenseNumber.length < 6) {
    result.warnings.push(`DL number seems short: ${result.driverLicenseNumber}`);
  }

  if (result.medicalCardNumber && !result.medicalCardNumber.match(/^2\d{8}$/)) {
    result.warnings.push(`Medical card may not be Maine format: ${result.medicalCardNumber}`);
  }

  if (result.dateOfBirth) {
    const age = calculateAge(result.dateOfBirth);
    if (age < 18 || age > 120) {
      result.warnings.push(`DOB results in unusual age: ${age}`);
    }
  }

  if (result.expirationDate && result.expirationDate < new Date()) {
    result.warnings.push('Medical card is expired');
  }

  return result;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Check if a customer is a valid medical patient based on parsed data
 */
export function isValidMedicalPatient(parsed: ParsedNoteData): boolean {
  if (!parsed.isMedicalPatient || !parsed.medicalCardNumber) {
    return false;
  }

  // Check expiration if available
  if (parsed.expirationDate && parsed.expirationDate < new Date()) {
    return false;
  }

  return true;
}

/**
 * Get a sanitized summary of the note (no PII, just metadata)
 * Safe for logging and debugging
 */
export function getSanitizedNoteSummary(parsed: ParsedNoteData): string {
  const parts: string[] = [];

  if (parsed.driverLicenseNumber) {
    parts.push('DL: ***');
  }
  if (parsed.medicalCardNumber) {
    parts.push('MED: ***');
  }
  if (parsed.dateOfBirth) {
    parts.push(`DOB: ${parsed.dateOfBirth.getFullYear()}`);
  }
  if (parsed.expirationDate) {
    const status = parsed.expirationDate < new Date() ? 'EXPIRED' : 'VALID';
    parts.push(`EXP: ${status}`);
  }

  return parts.length > 0 ? parts.join(' | ') : 'No structured data';
}

export default parseNoteField;
