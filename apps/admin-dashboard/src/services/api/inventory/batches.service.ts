/**
 * Batches Service
 * Handles product batch CRUD operations
 */

import { supabase } from '../../supabase/client';
import type { ProductBatch, BatchFilters } from '../../../modules/inventory/types/index';

export class BatchesService {
  constructor(private getDispensaryId: () => string) {}

  /**
   * Get all batches with optional filters
   */
  async getBatches(filters?: Partial<BatchFilters>): Promise<ProductBatch[]> {
    let query = supabase
      .from('product_batches')
      .select(`
        *,
        product:products(*)
      `)
      .eq('dispensary_id', this.getDispensaryId())
      .order('received_date', { ascending: false });

    // Apply filters
    if (filters?.search) {
      query = query.ilike('batch_number', `%${filters.search}%`);
    }

    if (filters?.productId && filters.productId !== 'all') {
      query = query.eq('product_id', filters.productId);
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.testStatus && filters.testStatus !== 'all') {
      query = query.eq('test_status', filters.testStatus);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch batches: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get batches for a specific product
   */
  async getProductBatches(productId: string): Promise<ProductBatch[]> {
    const { data, error } = await supabase
      .from('product_batches')
      .select('*')
      .eq('product_id', productId)
      .eq('dispensary_id', this.getDispensaryId())
      .order('received_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch product batches: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create new batch
   */
  async createBatch(batch: Partial<ProductBatch>): Promise<ProductBatch> {
    const { data, error } = await supabase
      .from('product_batches')
      .insert({
        ...batch,
        dispensary_id: this.getDispensaryId(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create batch: ${error.message}`);
    }

    return data;
  }

  /**
   * Update batch status
   */
  async updateBatchStatus(batchId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('product_batches')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', batchId)
      .eq('dispensary_id', this.getDispensaryId());

    if (error) {
      throw new Error(`Failed to update batch status: ${error.message}`);
    }
  }
}
