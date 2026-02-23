/**
 * Parse Driver's License PDF417 Barcode Data
 *
 * US/Canadian driver's licenses use AAMVA (American Association of Motor Vehicle Administrators)
 * format for PDF417 barcodes. This parser extracts key fields.
 *
 * @see https://www.aamva.org/identity/aamva-card-design-standard
 */

export interface ParsedLicenseData {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  dateOfBirth: Date | null;
  expirationDate: Date | null;
  licenseNumber: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  isExpired: boolean;
  isOver21: boolean;
  age: number | null;
  raw: string;
}

// AAMVA field codes
const FIELD_CODES: Record<string, string> = {
  DCS: 'lastName',
  DCT: 'firstName', // Sometimes includes middle name
  DAC: 'firstName',
  DAD: 'middleName',
  DBB: 'dateOfBirth', // MMDDYYYY
  DBA: 'expirationDate', // MMDDYYYY
  DAQ: 'licenseNumber',
  DAG: 'street',
  DAI: 'city',
  DAJ: 'state',
  DAK: 'zip',
  // Alternative codes used by some states
  DCG: 'country',
  DDE: 'lastNameTruncation',
  DDF: 'firstNameTruncation',
  DDG: 'middleNameTruncation',
};

/**
 * Parse AAMVA date format (MMDDYYYY or YYYYMMDD)
 */
function parseAAMVADate(dateStr: string): Date | null {
  if (!dateStr || dateStr.length < 8) return null;

  // Remove any non-numeric characters
  const cleaned = dateStr.replace(/\D/g, '');

  let year: number, month: number, day: number;

  if (cleaned.length === 8) {
    // Try MMDDYYYY first (most common)
    const mmddyyyy = {
      month: parseInt(cleaned.substring(0, 2), 10),
      day: parseInt(cleaned.substring(2, 4), 10),
      year: parseInt(cleaned.substring(4, 8), 10),
    };

    // Check if this looks valid
    if (mmddyyyy.month >= 1 && mmddyyyy.month <= 12 && mmddyyyy.year > 1900) {
      month = mmddyyyy.month;
      day = mmddyyyy.day;
      year = mmddyyyy.year;
    } else {
      // Try YYYYMMDD
      year = parseInt(cleaned.substring(0, 4), 10);
      month = parseInt(cleaned.substring(4, 6), 10);
      day = parseInt(cleaned.substring(6, 8), 10);
    }
  } else {
    return null;
  }

  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
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
 * Parse PDF417 barcode data from driver's license
 */
export function parseDriverLicense(rawData: string): ParsedLicenseData | null {
  if (!rawData || typeof rawData !== 'string') {
    return null;
  }


  // Initialize result
  const result: Partial<ParsedLicenseData> = {
    raw: rawData,
  };

  const address: Partial<ParsedLicenseData['address']> = {};

  // Try multiple parsing strategies

  // Strategy 1: Split by common delimiters (newline, record separator, line feed, etc.)
  const lines = rawData.split(/[\n\r\x1e\x1d\x0a\x0d]+/);

  for (const line of lines) {
    // Each field typically starts with a 3-character code
    for (const [code, fieldName] of Object.entries(FIELD_CODES)) {
      if (line.startsWith(code)) {
        const value = line.substring(code.length).trim();

        switch (fieldName) {
          case 'lastName':
            result.lastName = value;
            break;
          case 'firstName':
            // Some states include middle name with comma
            const names = value.split(',').map(n => n.trim());
            result.firstName = names[0];
            if (names[1] && !result.middleName) {
              result.middleName = names[1];
            }
            break;
          case 'middleName':
            result.middleName = value;
            break;
          case 'dateOfBirth':
            result.dateOfBirth = parseAAMVADate(value);
            break;
          case 'expirationDate':
            result.expirationDate = parseAAMVADate(value);
            break;
          case 'licenseNumber':
            result.licenseNumber = value;
            break;
          case 'street':
            address.street = value;
            break;
          case 'city':
            address.city = value;
            break;
          case 'state':
            address.state = value;
            break;
          case 'zip':
            address.zip = value.substring(0, 5); // Just first 5 digits
            break;
        }
        break; // Found matching code, move to next line
      }
    }
  }

  // Strategy 2: Try regex-based extraction for missing fields
  // This now runs for any missing fields, not just when name parsing fails
  const needsRegexExtraction = !result.firstName || !result.lastName || !result.licenseNumber;

  if (needsRegexExtraction) {

    // Look for field codes anywhere in the data - try multiple patterns for each field
    const fieldPatterns: Record<string, RegExp[]> = {
      lastName: [/DCS([^\x00-\x1f]+)/, /DCS([A-Z ]+)/],
      firstName: [/(?:DAC|DCT)([^\x00-\x1f]+)/, /(?:DAC|DCT)([A-Z ,]+)/],
      middleName: [/DAD([^\x00-\x1f]+)/],
      dateOfBirth: [/DBB(\d{8})/],
      expirationDate: [/DBA(\d{8})/],
      // Multiple patterns for license number - some states use different formats
      licenseNumber: [
        /DAQ([^\x00-\x1f]+)/,           // Standard AAMVA
        /DAQ([A-Z0-9]+)/,                // Alphanumeric only
        /DAQ([A-Z0-9\-]+)/,              // With dashes
        /DCS[^\n]*\nDAQ([^\n]+)/,        // DAQ after DCS
        /ANSI[^\n]*DAQ([^\n]+)/i,        // After ANSI header
      ],
      street: [/DAG([^\x00-\x1f]+)/],
      city: [/DAI([^\x00-\x1f]+)/],
      state: [/DAJ([A-Z]{2})/],
      zip: [/DAK(\d{5,9})/, /DAK(\d{5})/],
    };

    for (const [field, patterns] of Object.entries(fieldPatterns)) {
      // Skip if we already have this field
      if (field === 'lastName' && result.lastName) continue;
      if (field === 'firstName' && result.firstName) continue;
      if (field === 'licenseNumber' && result.licenseNumber) continue;
      if (field === 'dateOfBirth' && result.dateOfBirth) continue;
      if (field === 'expirationDate' && result.expirationDate) continue;

      // Try each pattern until one matches
      for (const pattern of patterns) {
        const match = rawData.match(pattern);
        if (match && match[1]) {
          const value = match[1].trim();
          if (!value) continue;


          switch (field) {
            case 'lastName':
              result.lastName = value;
              break;
            case 'firstName':
              const names = value.split(',').map(n => n.trim());
              result.firstName = names[0];
              if (names[1]) result.middleName = names[1];
              break;
            case 'middleName':
              result.middleName = value;
              break;
            case 'dateOfBirth':
              result.dateOfBirth = parseAAMVADate(value);
              break;
            case 'expirationDate':
              result.expirationDate = parseAAMVADate(value);
              break;
            case 'licenseNumber':
              result.licenseNumber = value;
              break;
            case 'street':
              address.street = value;
              break;
            case 'city':
              address.city = value;
              break;
            case 'state':
              address.state = value;
              break;
            case 'zip':
              address.zip = value.substring(0, 5);
              break;
          }
          break; // Found a match, move to next field
        }
      }
    }
  }

  // Log final extracted license number for debugging

  // Validate we got minimum required fields
  if (!result.firstName && !result.lastName) {
    // Try alternative parsing for non-standard formats
    return parseAlternativeFormat(rawData);
  }

  // Build full name
  const nameParts = [result.firstName, result.middleName, result.lastName].filter(Boolean);
  result.fullName = nameParts.join(' ');

  // Calculate age and validation
  if (result.dateOfBirth) {
    result.age = calculateAge(result.dateOfBirth);
    result.isOver21 = result.age >= 21;
  } else {
    result.age = null;
    result.isOver21 = false;
  }

  // Check expiration
  if (result.expirationDate) {
    result.isExpired = result.expirationDate < new Date();
  } else {
    result.isExpired = false;
  }

  // Add address if we have any parts
  if (address.street || address.city || address.state) {
    result.address = address as ParsedLicenseData['address'];
  }

  return result as ParsedLicenseData;
}

/**
 * Try to parse non-standard barcode formats
 */
function parseAlternativeFormat(rawData: string): ParsedLicenseData | null {

  // Some older licenses or non-US IDs might use different formats
  // This is a fallback that tries to extract any recognizable data

  const result: Partial<ParsedLicenseData> = {
    raw: rawData,
    firstName: '',
    lastName: '',
    fullName: '',
    licenseNumber: '',
    dateOfBirth: null,
    expirationDate: null,
    isExpired: false,
    isOver21: false,
    age: null,
  };

  // Look for AAMVA-style 8-digit dates (MMDDYYYY or YYYYMMDD)
  const aamvaDatePattern = /\b(\d{8})\b/g;
  const aamvaDates: Date[] = [];
  let match;

  while ((match = aamvaDatePattern.exec(rawData)) !== null) {
    const dateStr = match[1];
    const parsed = parseAAMVADate(dateStr);
    if (parsed && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
      aamvaDates.push(parsed);
    }
  }

  // Look for date patterns with separators (MM/DD/YYYY, YYYY-MM-DD, etc.)
  const datePattern = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g;

  while ((match = datePattern.exec(rawData)) !== null) {
    const [, p1, p2, p3] = match;
    let year = parseInt(p3, 10);
    if (year < 100) year += year > 50 ? 1900 : 2000;

    const date = new Date(year, parseInt(p1, 10) - 1, parseInt(p2, 10));
    if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
      aamvaDates.push(date);
    }
  }

  // Sort dates and try to identify DOB (oldest reasonable) and expiration (future)
  const now = new Date();
  const sortedDates = aamvaDates.sort((a, b) => a.getTime() - b.getTime());

  // DOB should be 16-120 years ago
  const possibleDOBs = sortedDates.filter(d => {
    const age = calculateAge(d);
    return age >= 16 && age <= 120;
  });

  // Expiration should be in the past or future (within 20 years)
  const possibleExpirations = sortedDates.filter(d => {
    const yearsFromNow = (d.getTime() - now.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return yearsFromNow > -10 && yearsFromNow < 20;
  });

  if (possibleDOBs.length > 0) {
    result.dateOfBirth = possibleDOBs[0]; // Oldest valid DOB
    result.age = calculateAge(possibleDOBs[0]);
    result.isOver21 = result.age >= 21;
  }

  if (possibleExpirations.length > 0) {
    // Pick the one that's most likely expiration (newest date that could be expiration)
    result.expirationDate = possibleExpirations[possibleExpirations.length - 1];
    result.isExpired = result.expirationDate < now;
  }

  // Try to find a license number (alphanumeric string of reasonable length)
  const licensePatterns = [
    /[A-Z]\d{7,12}/,  // Letter followed by numbers (common format)
    /\d{7,12}/,       // Just numbers
    /[A-Z]{1,2}\d{6,10}/, // 1-2 letters + numbers
    /\d{3}-\d{3}-\d{3}/, // Dashed format
  ];

  for (const pattern of licensePatterns) {
    const licenseMatch = rawData.match(pattern);
    if (licenseMatch) {
      result.licenseNumber = licenseMatch[0];
      break;
    }
  }

  // If we found at least a DOB, consider this a partial success
  if (result.dateOfBirth) {
    result.fullName = 'Verified Customer';
    result.firstName = 'Verified';
    result.lastName = 'Customer';
    return result as ParsedLicenseData;
  }

  return null;
}

/**
 * Format parsed license data for display
 */
export function formatLicenseDisplay(data: ParsedLicenseData): string {
  const lines: string[] = [];

  if (data.fullName) {
    lines.push(`Name: ${data.fullName}`);
  }

  if (data.dateOfBirth) {
    lines.push(`DOB: ${data.dateOfBirth.toLocaleDateString()}`);
  }

  if (data.age !== null) {
    lines.push(`Age: ${data.age}`);
  }

  if (data.licenseNumber) {
    lines.push(`License #: ${data.licenseNumber}`);
  }

  return lines.join('\n');
}
