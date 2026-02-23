/**
 * Adjustments Service
 * Handles inventory adjustments and stock corrections
 */

import { supabase } from '../../supabase/client';
import type {
  InventoryAdjustment,
  AdjustmentType,
  StockTrendPoint,
} from '../../../modules/inventory/types/index';

export class AdjustmentsService {
  constructor(private getDispensaryId: () => string) {}

  /**
   * Create inventory adjustment
   */
  async createAdjustment(adjustment: {
    product_id: string;
    batch_id?: string;
    adjustment_type: AdjustmentType;
    quantity_delta: number;
    reason: string;
    notes?: string;
  }): Promise<InventoryAdjustment> {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    const { data, error } = await supabase
      .from('inventory_adjustments')
      .insert({
        ...adjustment,
        dispensary_id: this.getDispensaryId(),
        adjusted_by: userId,
        adjusted_at: new Date().toISOString(),
      })
      .select(`
        *,
        product:products(*),
        batch:product_batches(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create adjustment: ${error.message}`);
    }

    return data;
  }

  /**
   * Get adjustment history for a product
   */
  async getProductAdjustments(
    productId: string,
    limit: number = 50
  ): Promise<InventoryAdjustment[]> {
    const { data, error } = await supabase
      .from('inventory_adjustments')
      .select('*')
      .eq('product_id', productId)
      .eq('dispensary_id', this.getDispensaryId())
      .order('adjusted_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch adjustments: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get stock level trend for a product
   * Simulated data - in production this would use a database function or aggregation
   */
  async getStockTrend(
    _productId: string,
    days: number = 30
  ): Promise<StockTrendPoint[]> {
    // For now, return simulated data
    // In production, this would call a Supabase RPC function
    const trendData: StockTrendPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      trendData.push({
        date: date.toISOString().split('T')[0],
        quantity: Math.floor(Math.random() * 100) + 50,
        adjustments: Math.floor(Math.random() * 10),
        sales: Math.floor(Math.random() * 20),
      });
    }

    return trendData;
  }
}
