/**
 * Inventory Service
 *
 * This file re-exports from the modular inventory service structure.
 * The implementation has been refactored into smaller, focused modules:
 *
 * - inventory/products.service.ts  - Product CRUD and stock level calculations
 * - inventory/batches.service.ts   - Batch CRUD operations
 * - inventory/adjustments.service.ts - Inventory adjustments and stock trends
 * - inventory/compliance.service.ts - Compliance alerts and inventory summary
 * - inventory/import.service.ts    - CSV batch import functionality
 * - inventory/cache.service.ts     - Shared caching utility
 * - inventory/types.ts             - Internal database types
 *
 * The main facade in inventory/index.ts maintains backward compatibility
 * with all existing code that imports from this file.
 */

export {
  inventoryService,
  default,
  ProductsService,
  BatchesService,
  AdjustmentsService,
  ComplianceService,
  ImportService,
  CacheService,
  inventoryCache,
} from './inventory/index';
