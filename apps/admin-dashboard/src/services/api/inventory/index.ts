/**
 * Inventory Service Facade
 * Main entry point for all inventory-related operations
 * Maintains backward compatibility with the original monolithic service
 */

import type {
  ProductWithInventory,
  ProductBatch,
  InventoryAdjustment,
  InventoryFilters,
  BatchFilters,
  StockTrendPoint,
  ComplianceAlert,
  InventorySummary,
  AdjustmentType,
  StockLevelInfo,
} from '../../../modules/inventory/types/index';
import type {
  TransformedProduct,
  ImportProgress,
  ImportResult,
} from '../../../modules/inventory/utils/csvImport';

import { ProductsService } from './products.service';
import { BatchesService } from './batches.service';
import { AdjustmentsService } from './adjustments.service';
import { ComplianceService } from './compliance.service';
import { ImportService } from './import.service';
import { inventoryCache } from './cache.service';

// Get current dispensary ID from local storage or context
// In production, this would come from the authenticated user's context
function getCurrentDispensaryId(): string {
  // TODO: Get from auth context when multi-tenancy is implemented
  // The Neon Pipe dispensary ID
  return '06c18efa-32ce-44c3-8282-da807fefd23f';
}

/**
 * Inventory Service
 * Handles all inventory-related data operations including products, batches, adjustments, and compliance
 */
class InventoryService {
  private dispensaryId: string;
  private productsService: ProductsService;
  private batchesService: BatchesService;
  private adjustmentsService: AdjustmentsService;
  private complianceService: ComplianceService;
  private importService: ImportService;

  constructor() {
    this.dispensaryId = getCurrentDispensaryId();

    // Initialize all sub-services with a getter for dispensary ID
    const getDispensaryId = () => this.dispensaryId;
    this.productsService = new ProductsService(getDispensaryId);
    this.batchesService = new BatchesService(getDispensaryId);
    this.adjustmentsService = new AdjustmentsService(getDispensaryId);
    this.complianceService = new ComplianceService(getDispensaryId);
    this.importService = new ImportService(getDispensaryId);
  }

  // ============================================================================
  // PRODUCTS - Delegated to ProductsService
  // ============================================================================

  async getProducts(filters?: Partial<InventoryFilters>): Promise<ProductWithInventory[]> {
    return this.productsService.getProducts(filters);
  }

  async getProductById(productId: string): Promise<ProductWithInventory> {
    return this.productsService.getProductById(productId);
  }

  getStockLevelInfo(quantity: number, threshold: number): StockLevelInfo {
    return this.productsService.getStockLevelInfo(quantity, threshold);
  }

  async getVendors(): Promise<string[]> {
    return this.productsService.getVendors();
  }

  // ============================================================================
  // BATCHES - Delegated to BatchesService
  // ============================================================================

  async getBatches(filters?: Partial<BatchFilters>): Promise<ProductBatch[]> {
    return this.batchesService.getBatches(filters);
  }

  async getProductBatches(productId: string): Promise<ProductBatch[]> {
    return this.batchesService.getProductBatches(productId);
  }

  async createBatch(batch: Partial<ProductBatch>): Promise<ProductBatch> {
    return this.batchesService.createBatch(batch);
  }

  async updateBatchStatus(batchId: string, status: string): Promise<void> {
    return this.batchesService.updateBatchStatus(batchId, status);
  }

  // ============================================================================
  // INVENTORY ADJUSTMENTS - Delegated to AdjustmentsService
  // ============================================================================

  async createAdjustment(adjustment: {
    product_id: string;
    batch_id?: string;
    adjustment_type: AdjustmentType;
    quantity_delta: number;
    reason: string;
    notes?: string;
  }): Promise<InventoryAdjustment> {
    return this.adjustmentsService.createAdjustment(adjustment);
  }

  async getProductAdjustments(
    productId: string,
    limit: number = 50
  ): Promise<InventoryAdjustment[]> {
    return this.adjustmentsService.getProductAdjustments(productId, limit);
  }

  // ============================================================================
  // STOCK TRENDS - Delegated to AdjustmentsService
  // ============================================================================

  async getStockTrend(
    productId: string,
    days: number = 30
  ): Promise<StockTrendPoint[]> {
    return this.adjustmentsService.getStockTrend(productId, days);
  }

  // ============================================================================
  // COMPLIANCE & ALERTS - Delegated to ComplianceService
  // ============================================================================

  async getComplianceAlerts(): Promise<ComplianceAlert[]> {
    return this.complianceService.getComplianceAlerts();
  }

  async getInventorySummary(): Promise<InventorySummary> {
    return this.complianceService.getInventorySummary();
  }

  // ============================================================================
  // PRODUCT IMPORT - Delegated to ImportService
  // ============================================================================

  async importProducts(
    products: TransformedProduct[],
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    return this.importService.importProducts(products, onProgress);
  }

  // ============================================================================
  // DISPENSARY MANAGEMENT
  // ============================================================================

  setDispensaryId(dispensaryId: string): void {
    this.dispensaryId = dispensaryId;
    this.clearCache();
  }

  getDispensaryId(): string {
    return this.dispensaryId;
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  clearCache(): void {
    inventoryCache.clear();
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();
export default inventoryService;

// Re-export sub-services for direct access if needed
export { ProductsService } from './products.service';
export { BatchesService } from './batches.service';
export { AdjustmentsService } from './adjustments.service';
export { ComplianceService } from './compliance.service';
export { ImportService } from './import.service';
export { CacheService, inventoryCache } from './cache.service';
