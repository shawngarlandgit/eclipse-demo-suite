/**
 * PII Sanitization Utilities for Maine MMCP Compliance
 *
 * This module provides cryptographic functions for:
 * - SHA-256 hashing of identifiers (one-way, for lookup only)
 * - AES-256-GCM encryption of data that needs to be retrieved
 *
 * COMPLIANCE NOTES:
 * - Hashing is irreversible - use for email, phone, license#, patient#
 * - Encryption is reversible - use for names, DOB, addresses
 * - All encryption uses Web Crypto API (FIPS 140-2 compliant algorithms)
 *
 * @module customerImport/piiSanitizer
 */

// Type definitions for sanitized customer data
export interface SanitizedCustomerData {
  // Hashed identifiers (irreversible)
  email_hash: string | null;
  phone_hash: string | null;
  license_number_hash: string | null;
  medical_card_hash: string | null;

  // Encrypted fields (reversible)
  first_name_encrypted: string | null;
  last_name_encrypted: string | null;
  date_of_birth_encrypted: string | null;
  physical_address_encrypted: string | null;

  // Plain text (non-PII)
  customer_code: string;
  customer_group: string;
  is_medical_patient: boolean;
  medical_card_expiration: string | null; // ISO date string
  do_not_email: boolean;
  enable_loyalty: boolean;
  loyalty_balance: number;
  store_credit_balance: number;
  year_to_date: number;

  // Metadata
  imported_at: string;
  import_source: string;
  import_warnings: string[];
}

// Encryption key management
let encryptionKey: CryptoKey | null = null;

/**
 * Initialize the encryption key from environment or provided key
 * Must be called before using encryption functions
 *
 * @param keyBase64 - Base64-encoded 256-bit key, or will generate one
 */
export async function initializeEncryptionKey(keyBase64?: string): Promise<string> {
  if (keyBase64) {
    // Import existing key
    const keyBuffer = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
    encryptionKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    return keyBase64;
  } else {
    // Generate new key
    encryptionKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    // Export for storage
    const exported = await crypto.subtle.exportKey('raw', encryptionKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }
}

/**
 * Hash a string using SHA-256
 * Used for: email, phone, license numbers, patient numbers
 *
 * @param input - Plain text to hash
 * @returns Hex-encoded SHA-256 hash
 */
export async function hashPII(input: string | null | undefined): Promise<string | null> {
  if (!input || input.trim() === '') {
    return null;
  }

  // Normalize: lowercase, remove special chars except alphanumeric
  const normalized = input.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (normalized.length === 0) {
    return null;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt a string using AES-256-GCM
 * Used for: names, DOB, addresses (data we need to retrieve)
 *
 * @param plaintext - Data to encrypt
 * @returns Base64-encoded IV + ciphertext
 */
export async function encryptPII(plaintext: string | null | undefined): Promise<string | null> {
  if (!plaintext || plaintext.trim() === '') {
    return null;
  }

  if (!encryptionKey) {
    throw new Error('Encryption key not initialized. Call initializeEncryptionKey first.');
  }

  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    data
  );

  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a string encrypted with encryptPII
 *
 * @param encrypted - Base64-encoded IV + ciphertext
 * @returns Original plaintext
 */
export async function decryptPII(encrypted: string | null | undefined): Promise<string | null> {
  if (!encrypted) {
    return null;
  }

  if (!encryptionKey) {
    throw new Error('Encryption key not initialized. Call initializeEncryptionKey first.');
  }

  try {
    // Decode base64
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

    // Extract IV (first 12 bytes) and ciphertext
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      encryptionKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

/**
 * Normalize a phone number for consistent hashing
 * Strips all non-numeric characters
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, '');

  // Must have at least 10 digits
  if (digits.length < 10) return null;

  // If starts with 1 and has 11 digits, remove country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1);
  }

  return digits;
}

/**
 * Normalize an email address for consistent hashing
 * Lowercase, trim whitespace
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const normalized = email.toLowerCase().trim();

  // Basic email validation
  if (!normalized.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return null;
  }

  return normalized;
}

/**
 * Format an address object into a single encrypted string
 */
export function formatAddress(
  address1: string | null,
  address2: string | null,
  city: string | null,
  state: string | null,
  postcode: string | null
): string | null {
  const parts = [address1, address2, city, state, postcode].filter(Boolean);

  if (parts.length === 0) return null;

  return parts.join(', ');
}

/**
 * Parse numeric values safely
 */
export function parseNumeric(value: string | null | undefined, defaultValue = 0): number {
  if (!value) return defaultValue;

  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse boolean from various formats (1/0, true/false, yes/no)
 */
export function parseBoolean(value: string | null | undefined, defaultValue = false): boolean {
  if (!value) return defaultValue;

  const normalized = value.toLowerCase().trim();
  return ['1', 'true', 'yes', 'y'].includes(normalized);
}

/**
 * Format date as ISO string for database storage
 */
export function formatDateISO(date: Date | null): string | null {
  if (!date || isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

export default {
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
};
