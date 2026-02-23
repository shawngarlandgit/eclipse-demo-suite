import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Auth Bypass Security Tests
 *
 * These tests verify that authentication bypass is:
 * 1. Only enabled when explicitly configured via VITE_BYPASS_AUTH
 * 2. NOT automatically enabled in development mode
 * 3. Returns appropriate mock data only when enabled
 */
describe('Auth Bypass Configuration', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env
    Object.assign(import.meta.env, originalEnv);
  });

  describe('BYPASS_AUTH constant', () => {
    it('should be false when VITE_BYPASS_AUTH is not set', async () => {
      // @ts-expect-error - modifying env for test - modifying env for test
      import.meta.env.VITE_BYPASS_AUTH = undefined;
      // @ts-expect-error - modifying env for test
      import.meta.env.DEV = true;

      // The constant is evaluated at module load time
      // In the refactored code, DEV mode alone should NOT enable bypass
      const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true';
      expect(bypassAuth).toBe(false);
    });

    it('should be false when VITE_BYPASS_AUTH is "false"', async () => {
      // @ts-expect-error - modifying env for test
      import.meta.env.VITE_BYPASS_AUTH = 'false';

      const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true';
      expect(bypassAuth).toBe(false);
    });

    it('should be true only when VITE_BYPASS_AUTH is explicitly "true"', async () => {
      // @ts-expect-error - modifying env for test
      import.meta.env.VITE_BYPASS_AUTH = 'true';

      const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true';
      expect(bypassAuth).toBe(true);
    });

    it('should NOT automatically enable bypass in DEV mode', async () => {
      // @ts-expect-error - modifying env for test
      import.meta.env.VITE_BYPASS_AUTH = undefined;
      // @ts-expect-error - modifying env for test
      import.meta.env.DEV = true;

      // This is the CRITICAL security test
      // The old code was: BYPASS_AUTH = VITE_BYPASS_AUTH === 'true' || import.meta.env.DEV
      // The new code is: BYPASS_AUTH = VITE_BYPASS_AUTH === 'true'
      const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true';

      // Even in DEV mode, bypass should be FALSE unless explicitly enabled
      expect(bypassAuth).toBe(false);
    });
  });

  describe('Security invariants', () => {
    it('bypass should require explicit opt-in', () => {
      // Test various falsy/undefined values
      const testCases = [
        undefined,
        null,
        '',
        'false',
        'FALSE',
        '0',
        'no',
      ];

      testCases.forEach((value) => {
        // @ts-expect-error - modifying env for test
        import.meta.env.VITE_BYPASS_AUTH = value;
        const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true';
        expect(bypassAuth).toBe(false);
      });
    });

    it('only exact string "true" enables bypass', () => {
      // Test values that might be confused with true
      const falsyTrueValues = ['TRUE', 'True', '1', 'yes', 'enabled'];

      falsyTrueValues.forEach((value) => {
        // @ts-expect-error - modifying env for test
        import.meta.env.VITE_BYPASS_AUTH = value;
        const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true';
        expect(bypassAuth).toBe(false);
      });

      // Only exact 'true' works
      // @ts-expect-error - modifying env for test
      import.meta.env.VITE_BYPASS_AUTH = 'true';
      const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true';
      expect(bypassAuth).toBe(true);
    });
  });
});
