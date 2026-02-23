/**
 * Products Service
 * Handles product CRUD operations and stock level calculations
 */

import { supabase } from '../../supabase/client';
import type {
  ProductWithInventory,
  InventoryFilters,
  StockLevelInfo,
} from '../../../modules/inventory/types/index';
import type { DbProduct } from './types';

export class ProductsService {
  constructor(private getDispensaryId: () => string) {}

  /**
   * Get all products with inventory information
   */
  async getProducts(filters?: Partial<InventoryFilters>): Promise<ProductWithInventory[]> {
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        image_url,
        strain_name,
        strain_type,
        product_type,
        thc_pct,
        cbd_pct,
        cbg_pct,
        thca_pct,
        quantity_on_hand,
        low_stock_threshold,
        reorder_level,
        retail_price,
        cost_price,
        is_active,
        vendor,
        created_at
      `)
      .eq('dispensary_id', this.getDispensaryId())
      .order('name', { ascending: true })
      .limit(500);

    // Apply filters
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,strain_name.ilike.%${filters.search}%`);
    }

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('product_type', filters.category);
    }

    if (filters?.status === 'active') {
      query = query.eq('is_active', true);
    } else if (filters?.status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (filters?.vendor && filters.vendor !== 'all') {
      query = query.eq('vendor', filters.vendor);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ProductsService] Query error:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    // Map database columns to UI expected names and add batch_count
    const productsWithBatchCount = ((data || []) as DbProduct[]).map((product) => ({
      ...product,
      price: product.retail_price,
      cost: product.cost_price,
      batch_count: 0,
    }));

    // Filter by stock level client-side
    let products = productsWithBatchCount;
    if (filters?.stockLevel && filters.stockLevel !== 'all') {
      products = products.filter((product) => {
        const stockInfo = this.getStockLevelInfo(
          product.quantity_on_hand,
          product.low_stock_threshold
        );
        return stockInfo.level === filters.stockLevel;
      });
    }

    return products;
  }

  /**
   * Get single product with full details
   */
  async getProductById(productId: string): Promise<ProductWithInventory> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('dispensary_id', this.getDispensaryId())
      .single();

    if (error) {
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    // Map database columns to UI expected names
    return {
      ...data,
      price: data.retail_price,
      cost: data.cost_price,
      batch_count: 0,
    };
  }

  /**
   * Get stock level classification
   */
  getStockLevelInfo(quantity: number, threshold: number): StockLevelInfo {
    const percentage = threshold > 0 ? (quantity / threshold) * 100 : 100;

    if (quantity === 0) {
      return {
        level: 'critical',
        percentage: 0,
        color: 'red',
        label: 'Out of Stock',
      };
    } else if (percentage < 50) {
      return {
        level: 'critical',
        percentage,
        color: 'red',
        label: 'Critical',
      };
    } else if (percentage < 100) {
      return {
        level: 'low',
        percentage,
        color: 'yellow',
        label: 'Low Stock',
      };
    } else if (percentage < 200) {
      return {
        level: 'normal',
        percentage,
        color: 'green',
        label: 'Normal',
      };
    } else {
      return {
        level: 'high',
        percentage,
        color: 'blue',
        label: 'High Stock',
      };
    }
  }

  /**
   * Get available vendors for filtering
   */
  async getVendors(): Promise<string[]> {
    const { data, error } = await supabase
      .from('products')
      .select('vendor')
      .eq('dispensary_id', this.getDispensaryId())
      .not('vendor', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch vendors: ${error.message}`);
    }

    const vendors = [
      ...new Set(data.map((p) => p.vendor).filter(Boolean) as string[]),
    ];
    return vendors.sort();
  }
}
