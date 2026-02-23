import { format, formatDistance, formatRelative, parseISO } from 'date-fns';

// ============================================================================
// Currency Formatting
// ============================================================================

/**
 * Format a number as USD currency
 * @param amount - The amount to format
 * @param options - Intl.NumberFormatOptions
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(
  amount: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    ...options,
  }).format(amount);
}

/**
 * Format currency without decimals for large amounts
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$1,235")
 */
export function formatCurrencyWhole(amount: number): string {
  return formatCurrency(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Format currency as compact notation (e.g., "$1.2K", "$3.5M")
 * @param amount - The amount to format
 * @returns Compact currency string
 */
export function formatCurrencyCompact(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format a number with thousand separators
 * @param num - The number to format
 * @returns Formatted number string (e.g., "1,234")
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format a number as a percentage
 * @param value - The decimal value (e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string (e.g., "15%")
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number with a specific number of decimal places
 * @param num - The number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export function formatDecimal(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

/**
 * Format a number as compact notation (e.g., "1.2K", "3.5M")
 * @param num - The number to format
 * @returns Compact number string
 */
export function formatCompact(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

// ============================================================================
// Date & Time Formatting
// ============================================================================

/**
 * Format a date string or Date object
 * @param date - The date to format
 * @param formatStr - The format string (defaults to "MM/dd/yyyy")
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, formatStr: string = 'MM/dd/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Format a date with time
 * @param date - The date to format
 * @returns Formatted date and time string (e.g., "11/09/2025 3:45 PM")
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'MM/dd/yyyy h:mm a');
}

/**
 * Format a date as time only
 * @param date - The date to format
 * @returns Formatted time string (e.g., "3:45 PM")
 */
export function formatTime(date: string | Date): string {
  return formatDate(date, 'h:mm a');
}

/**
 * Format a date relative to now (e.g., "2 hours ago")
 * @param date - The date to format
 * @returns Relative date string
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

/**
 * Format a date relative to now with more context (e.g., "yesterday at 3:45 PM")
 * @param date - The date to format
 * @returns Relative date string with context
 */
export function formatRelativeDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatRelative(dateObj, new Date());
}

/**
 * Format a date for input fields (YYYY-MM-DD)
 * @param date - The date to format
 * @returns ISO date string
 */
export function formatDateForInput(date: string | Date): string {
  return formatDate(date, 'yyyy-MM-dd');
}

// ============================================================================
// THC/CBD Formatting
// ============================================================================

/**
 * Format THC/CBD percentage
 * @param value - The percentage value
 * @returns Formatted percentage string with % symbol
 */
export function formatCannabinoidPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return `${formatDecimal(value, 2)}%`;
}

// ============================================================================
// Phone Number Formatting
// ============================================================================

/**
 * Format a phone number to (XXX) XXX-XXXX format
 * @param phone - The phone number to format
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

// ============================================================================
// Text Formatting
// ============================================================================

/**
 * Capitalize the first letter of a string
 * @param str - The string to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert snake_case to Title Case
 * @param str - The snake_case string
 * @returns Title Case string
 */
export function snakeToTitle(str: string): string {
  return str
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Truncate a string to a maximum length
 * @param str - The string to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

// ============================================================================
// File Size Formatting
// ============================================================================

/**
 * Format file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================================================
// Status Badge Formatting
// ============================================================================

/**
 * Get a color class for a stock level
 * @param quantity - Current quantity
 * @param reorderLevel - Reorder threshold
 * @returns Color class name
 */
export function getStockLevelColor(quantity: number, reorderLevel: number): string {
  if (quantity === 0) return 'red';
  if (quantity <= reorderLevel / 2) return 'red';
  if (quantity <= reorderLevel) return 'yellow';
  return 'green';
}

/**
 * Get a readable stock status label
 * @param quantity - Current quantity
 * @param reorderLevel - Reorder threshold
 * @returns Status label
 */
export function getStockStatus(quantity: number, reorderLevel: number): string {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= reorderLevel / 2) return 'Critical';
  if (quantity <= reorderLevel) return 'Low Stock';
  return 'In Stock';
}

// ============================================================================
// Chart Data Formatting
// ============================================================================

/**
 * Format data for chart tooltips
 * @param value - The value to format
 * @param type - The type of data ('currency', 'number', 'percentage')
 * @returns Formatted string for tooltip
 */
export function formatChartValue(
  value: number,
  type: 'currency' | 'number' | 'percentage' = 'number'
): string {
  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    default:
      return formatNumber(value);
  }
}
