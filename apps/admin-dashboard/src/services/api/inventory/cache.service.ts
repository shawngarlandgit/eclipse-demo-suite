/**
 * Cache Service
 * Shared caching utility for inventory services
 */

import type { CacheEntry } from './types';

export class CacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTimeout: number;

  constructor(cacheTimeoutMs: number = 3 * 60 * 1000) {
    this.cacheTimeout = cacheTimeoutMs;
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// Shared cache instance for all inventory services
export const inventoryCache = new CacheService();
