/**
 * Import Service
 * Handles CSV batch import operations for products
 */

import { supabase } from '../../supabase/client';
import type {
  TransformedProduct,
  ImportProgress,
  ImportResult,
} from '../../../modules/inventory/utils/csvImport';
import { chunkArray } from '../../../modules/inventory/utils/csvImport';
import { inventoryCache } from './cache.service';

export class ImportService {
  constructor(private getDispensaryId: () => string) {}

  /**
   * Batch import products from CSV data
   * Uses upsert to handle both new products and updates to existing SKUs
   */
  async importProducts(
    products: TransformedProduct[],
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const BATCH_SIZE = 50; // Supabase recommends batches of 50-100
    const results: ImportResult = {
      total: products.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    const batches = chunkArray(products, BATCH_SIZE);
    let processed = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      try {
        // Use upsert to handle both inserts and updates
        // Conflicts on (dispensary_id, sku) will update existing products
        const { data, error } = await supabase
          .from('products')
          .upsert(
            batch.map((p) => ({
              dispensary_id: p.dispensary_id,
              sku: p.sku,
              name: p.name,
              product_type: p.product_type,
              brand: p.brand,
              description: p.description,
              cost_price: p.cost_price,
              retail_price: p.retail_price,
              quantity_on_hand: p.quantity_on_hand,
              low_stock_threshold: p.low_stock_threshold,
              is_active: p.is_active,
              strain_name: p.strain_name,
              thc_pct: p.thc_pct,
              cbd_pct: p.cbd_pct,
              vendor: p.vendor,
              updated_at: new Date().toISOString(),
            })),
            {
              onConflict: 'dispensary_id,sku',
              ignoreDuplicates: false,
            }
          )
          .select('id');

        if (error) {
          console.error('Batch import error:', error);
          // Track individual failures from this batch
          batch.forEach((product) => {
            results.failed++;
            results.errors.push({
              sku: product.sku,
              message: error.message,
            });
          });
        } else {
          results.successful += data?.length || batch.length;
        }
      } catch (err) {
        console.error('Unexpected import error:', err);
        // Handle network/unexpected errors
        batch.forEach((product) => {
          results.failed++;
          results.errors.push({
            sku: product.sku,
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        });
      }

      processed += batch.length;

      // Report progress
      if (onProgress) {
        onProgress({
          current: processed,
          total: products.length,
          percentage: Math.round((processed / products.length) * 100),
          currentBatch: i + 1,
          totalBatches: batches.length,
        });
      }

      // Small delay between batches to avoid rate limiting
      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Clear cache after import to ensure fresh data
    inventoryCache.clear();

    return results;
  }
}
