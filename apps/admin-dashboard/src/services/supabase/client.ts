/**
 * DEPRECATED: DO NOT USE SUPABASE
 *
 * This file is kept for reference but should not be used.
 * This project now uses Convex for all backend operations.
 *
 * See: convex/ directory for all database operations
 * Convex deployment: fiery-cheetah-41
 */

const ERR =
  'DO NOT USE SUPABASE - This project uses Convex for backend. ' +
  'See convex/ directory for database operations.';

// Compatibility stub so legacy imports don't break the build.
// Any runtime use will throw loudly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = new Proxy(
  {},
  {
    get() {
      throw new Error(ERR);
    },
  }
);
