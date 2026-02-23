/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and valid
 *
 * DO NOT USE SUPABASE - This project uses Convex for backend
 */

interface EnvConfig {
  convexUrl: string;
  clerkPublishableKey: string;
  appName: string;
  appEnv: string;
  isDev: boolean;
  isProd: boolean;
  bypassAuth: boolean;
}

/**
 * Validates and parses environment variables
 * Throws an error if required variables are missing
 */
function validateEnv(): EnvConfig {
  const errors: string[] = [];

  // Required variables - Convex
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!convexUrl) {
    errors.push('VITE_CONVEX_URL is required');
  }

  // Validate URL format if provided
  if (convexUrl && !isValidUrl(convexUrl)) {
    errors.push('VITE_CONVEX_URL must be a valid URL');
  }

  // Throw error if validation fails
  if (errors.length > 0) {
    throw new Error(
      `Environment variable validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
      `Please check your .env file and ensure all required variables are set.`
    );
  }

  // Optional variables with defaults
  const appName = import.meta.env.VITE_APP_NAME || 'Cannabis Admin Dashboard';
  const appEnv = import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development';
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;
  const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true';

  return {
    convexUrl,
    clerkPublishableKey: clerkPublishableKey || '',
    appName,
    appEnv,
    isDev,
    isProd,
    bypassAuth,
  };
}

/**
 * Simple URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Validate on module load
export const env = validateEnv();

// Log configuration in development
if (env.isDev) {
  // Use console.log here since logger depends on env
  console.log('Environment Configuration:', {
    appName: env.appName,
    appEnv: env.appEnv,
    convexUrl: env.convexUrl,
    bypassAuth: env.bypassAuth,
    // Don't log sensitive keys
  });
}
