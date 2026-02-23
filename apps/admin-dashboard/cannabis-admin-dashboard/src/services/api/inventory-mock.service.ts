import type {
  ProductWithInventory,
  ProductBatch,
  InventorySummary,
  ComplianceAlert,
  StockLevelInfo,
} from '../../modules/inventory/types/index';
import { createClient } from '@supabase/supabase-js';

/**
 * Mock Inventory Service
 * Generates realistic inventory data using strain information from budtender MVP
 */

// Product categories
const PRODUCT_TYPES = ['flower', 'pre-roll', 'concentrate', 'edible', 'vape', 'topical'] as const;

// Vendors
const VENDORS = [
  'Green Valley Farms',
  'Mountain High Cultivation',
  'Coastal Cannabis Co',
  'Urban Garden',
  'Sunset Growers',
];

interface StrainFromDB {
  id: string;
  name: string;
  slug: string;
  strain_type: 'indica' | 'sativa' | 'hybrid';
  description: string | null;
  image_url: string | null;
  thc_min: number | null;
  thc_max: number | null;
  cbd_min: number | null;
  cbd_max: number | null;
}

class MockInventoryService {
  private products: ProductWithInventory[] = [];
  private batches: ProductBatch[] = [];
  private strainsFromDB: StrainFromDB[] = [];
  private initialized = false;
  private readonly version = '2.0'; // Increment to force data regeneration

  constructor() {
    // Don't initialize immediately - wait for first call
    console.log(`MockInventoryService v${this.version} initialized`);
  }

  /**
   * Reset the service to force reloading data
   */
  reset() {
    this.products = [];
    this.batches = [];
    this.strainsFromDB = [];
    this.initialized = false;
    console.log('Inventory service reset - data will reload on next request');
  }

  /**
   * Ensure service is initialized
   */
  private async ensureInitialized() {
    if (this.initialized) return;

    await this.loadStrainsFromSupabase();
    this.initialized = true;
  }

  /**
   * Load strains from Supabase - only those with images
   */
  private async loadStrainsFromSupabase() {
    try {
      console.log('Loading strains from Supabase...');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('Supabase URL:', supabaseUrl);

      if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase credentials not found');
        return;
      }

      // Create Supabase client directly here
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch strains with images only
      const { data: strains, error } = await supabase
        .from('strains')
        .select('id, name, slug, strain_type, description, image_url, thc_min, thc_max, cbd_min, cbd_max')
        .not('image_url', 'is', null)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading strains from Supabase:', error);
      }

      if (strains) {
        console.log(`Loaded ${strains.length} strains from Supabase (before filtering)`);

        // Filter out strains with invalid/placeholder images
        const validStrains = strains.filter(strain => {
          // Must have image_url
          if (!strain.image_url) return false;

          // Filter out placeholder/invalid URLs
          const url = strain.image_url.toLowerCase();
          if (url.includes('placeholder')) return false;
          if (url.includes('no-image')) return false;
          if (url.includes('default')) return false;
          if (url === '' || url === 'null') return false;

          // Must be a valid URL format
          if (!url.startsWith('http')) return false;

          return true;
        });

        // Take first 100 strains with valid images
        this.strainsFromDB = validStrains.slice(0, 100);
        console.log(`Filtered to ${this.strainsFromDB.length} strains with valid images`);
        console.log('Sample strain:', this.strainsFromDB[0]);
      } else {
        console.error('No strains returned from Supabase');
      }
    } catch (error) {
      console.error('Error in loadStrainsFromSupabase:', error);
    }

    // Generate mock data after attempting to load strains
    this.generateMockData();
  }

  private formatStrainName(name: string): string {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private formatProductType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  private generateMockData() {
    // Use ALL strains from Supabase that have images
    if (this.strainsFromDB.length === 0) {
      console.warn('No strains loaded from database');
      return;
    }

    console.log(`Generating inventory from ${this.strainsFromDB.length} strains`);
    console.log('Generation timestamp:', new Date().toISOString());

    this.strainsFromDB.forEach((strain, index) => {
      const basePrice = Math.random() * 30 + 20; // $20-50
      const productType = PRODUCT_TYPES[Math.floor(Math.random() * PRODUCT_TYPES.length)];
      const vendor = VENDORS[Math.floor(Math.random() * VENDORS.length)];

      const quantity = Math.floor(Math.random() * 200);
      const threshold = 50;

      // Use the average THC/CBD from the strain data
      const thcPercentage = strain.thc_max
        ? (strain.thc_min && strain.thc_max ? (strain.thc_min + strain.thc_max) / 2 : strain.thc_max)
        : Math.random() * 25 + 10; // Fallback to random if no data

      const cbdPercentage = strain.cbd_max
        ? (strain.cbd_min && strain.cbd_max ? (strain.cbd_min + strain.cbd_max) / 2 : strain.cbd_max)
        : Math.random() * 5; // Fallback to random if no data

      // Create product
      const product: ProductWithInventory = {
        id: `prod-${index + 1}`,
        dispensary_id: 'demo-dispensary-1',
        sku: `SKU-${String(index + 1).padStart(4, '0')}`,
        name: strain.name,
        product_type: productType,
        strain_name: strain.name,
        strain_type: strain.strain_type,
        description: strain.description || `Premium ${strain.strain_type} ${productType}`,
        vendor: vendor,
        quantity_on_hand: quantity,
        unit_of_measure: productType === 'flower' ? 'g' : productType === 'edible' ? 'unit' : 'ml',
        low_stock_threshold: threshold,
        reorder_point: threshold * 1.5,
        reorder_quantity: 100,
        price: parseFloat(basePrice.toFixed(2)),
        cost: parseFloat((basePrice * 0.6).toFixed(2)),
        is_active: Math.random() > 0.1, // 90% active
        thc_percentage: thcPercentage,
        cbd_percentage: cbdPercentage,
        image_url: strain.image_url,
        created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        batch_count: Math.floor(Math.random() * 5) + 1,
        effects: [], // Will be populated from strain data later if available
        flavors: [], // Will be populated from strain data later if available
      };

      this.products.push(product);

      // Create batches for this product
      const batchCount = Math.floor(Math.random() * 3) + 1;
      for (let b = 0; b < batchCount; b++) {
        // Mix of batch ages to create realistic expiration scenarios
        let receivedDate: Date;
        let expirationDate: Date;
        let testDate: Date;

        // FIRST 10 products: Guaranteed batches expiring soon (within 30 days)
        if (index < 10 && b === 0) {
          receivedDate = new Date(Date.now() - (150 + Math.random() * 30) * 24 * 60 * 60 * 1000); // 150-180 days ago
          expirationDate = new Date(Date.now() + (5 + Math.random() * 25) * 24 * 60 * 60 * 1000); // 5-30 days from now
          testDate = new Date(receivedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
        // NEXT 10 products (10-19): Guaranteed batches that need retesting (test date > 90 days ago)
        else if (index >= 10 && index < 20 && b === 0) {
          receivedDate = new Date(Date.now() - (120 + Math.random() * 60) * 24 * 60 * 60 * 1000); // 120-180 days ago
          expirationDate = new Date(receivedDate.getTime() + (180 + Math.random() * 180) * 24 * 60 * 60 * 1000);
          testDate = new Date(receivedDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Old test date (>90 days ago)
        }
        // Normal batches for everything else
        else {
          receivedDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
          expirationDate = new Date(receivedDate.getTime() + (180 + Math.random() * 180) * 24 * 60 * 60 * 1000);
          testDate = new Date(receivedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        }

        const batch: ProductBatch = {
          id: `batch-${index}-${b}`,
          dispensary_id: 'demo-dispensary-1',
          product_id: product.id,
          batch_number: `BT-${new Date().getFullYear()}-${String(index * 10 + b).padStart(4, '0')}`,
          received_date: receivedDate.toISOString().split('T')[0],
          expiration_date: expirationDate.toISOString().split('T')[0],
          quantity: Math.floor(quantity / batchCount),
          unit_cost: product.cost,
          status: Math.random() > 0.9 ? 'quarantine' : 'active',
          test_status: Math.random() > 0.2 ? 'passed' : 'pending',
          test_date: testDate.toISOString().split('T')[0],
          lab_name: 'Green Leaf Analytics',
          thc_percentage: thcPercentage,
          cbd_percentage: cbdPercentage,
          created_at: receivedDate.toISOString(),
          updated_at: new Date().toISOString(),
        };

        this.batches.push(batch);
      }
    });

    console.log(`Generated ${this.products.length} products from Supabase strains`);
  }

  // Simple hash function to get consistent "random" offset based on date string
  private hashDateRange(dateRange: { startDate: string; endDate: string }): number {
    const str = `${dateRange.startDate}-${dateRange.endDate}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  async getProducts(filters?: any, dateRange?: { startDate: string; endDate: string }): Promise<ProductWithInventory[]> {
    await this.ensureInitialized();
    await this.simulateDelay();

    let filtered = [...this.products];

    // TESTING: Show different set of 75 strains based on date range
    if (dateRange && this.products.length > 75) {
      const hash = this.hashDateRange(dateRange);
      const totalProducts = this.products.length;
      const offset = hash % (totalProducts - 75); // Offset to start selection

      // Select 75 products starting from the offset, wrapping around if needed
      filtered = [];
      for (let i = 0; i < 75; i++) {
        const index = (offset + i) % totalProducts;
        filtered.push(this.products[index]);
      }

      // Also vary quantities based on the hash for visual difference
      const seedMultiplier = (hash % 100) / 100; // 0-1 value
      filtered = filtered.map((p, idx) => ({
        ...p,
        quantity_on_hand: Math.max(0, Math.floor(p.quantity_on_hand * (0.5 + seedMultiplier + (idx % 10) * 0.05))),
      }));
    }

    // Apply filters
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        p.strain_name?.toLowerCase().includes(search)
      );
    }

    if (filters?.category && filters.category !== 'all') {
      filtered = filtered.filter(p => p.product_type === filters.category);
    }

    if (filters?.status === 'active') {
      filtered = filtered.filter(p => p.is_active);
    } else if (filters?.status === 'inactive') {
      filtered = filtered.filter(p => !p.is_active);
    }

    if (filters?.vendor && filters.vendor !== 'all') {
      filtered = filtered.filter(p => p.vendor === filters.vendor);
    }

    if (filters?.stockLevel && filters.stockLevel !== 'all') {
      filtered = filtered.filter(p => {
        const stockInfo = this.getStockLevelInfo(p.quantity_on_hand, p.low_stock_threshold);
        return stockInfo.level === filters.stockLevel;
      });
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getProductById(productId: string): Promise<ProductWithInventory> {
    await this.simulateDelay();
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

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

  async getVendors(): Promise<string[]> {
    await this.simulateDelay();
    return [...VENDORS];
  }

  async getBatches(filters?: any): Promise<ProductBatch[]> {
    await this.simulateDelay();

    let filtered = [...this.batches];

    if (filters?.productId && filters.productId !== 'all') {
      filtered = filtered.filter(b => b.product_id === filters.productId);
    }

    if (filters?.status && filters.status !== 'all') {
      filtered = filtered.filter(b => b.status === filters.status);
    }

    return filtered;
  }

  async getProductBatches(productId: string): Promise<ProductBatch[]> {
    await this.simulateDelay();
    return this.batches.filter(b => b.product_id === productId);
  }

  async getInventorySummary(dateRange?: { startDate: string; endDate: string }): Promise<InventorySummary> {
    await this.simulateDelay();

    // Calculate scale factor based on date range
    let scaleFactor = 1;
    if (dateRange) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      scaleFactor = daysDiff / 30;
    }

    const totalProducts = this.products.length;
    const activeProducts = this.products.filter(p => p.is_active).length;

    const totalInventoryValue = this.products.reduce((sum, p) => sum + (p.quantity_on_hand * p.price), 0) * scaleFactor;
    const totalCostValue = this.products.reduce((sum, p) => sum + (p.quantity_on_hand * p.cost), 0) * scaleFactor;

    const lowStockCount = this.products.filter(p =>
      p.is_active &&
      p.quantity_on_hand > 0 &&
      p.quantity_on_hand <= p.low_stock_threshold
    ).length;

    const criticalStockCount = this.products.filter(p => p.is_active && p.quantity_on_hand === 0).length;

    const totalBatches = this.batches.length;
    const quarantinedCount = this.batches.filter(b => b.status === 'quarantine').length;

    // Expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoonCount = this.batches.filter(b => {
      const expDate = new Date(b.expiration_date);
      return b.status === 'active' && expDate <= thirtyDaysFromNow && expDate >= new Date();
    }).length;

    // Needs retest (test date > 90 days ago)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const needsRetestCount = this.batches.filter(b => {
      const testDate = new Date(b.test_date || '');
      return b.status === 'active' && testDate < ninetyDaysAgo;
    }).length;

    return {
      total_products: totalProducts,
      active_products: activeProducts,
      total_inventory_value: totalInventoryValue,
      total_cost_value: totalCostValue,
      low_stock_count: lowStockCount,
      critical_stock_count: criticalStockCount,
      total_batches: totalBatches,
      expiring_soon_count: expiringSoonCount,
      needs_retest_count: needsRetestCount,
      quarantined_count: quarantinedCount,
      last_updated: new Date().toISOString(),
    };
  }

  async getComplianceAlerts(): Promise<ComplianceAlert[]> {
    await this.simulateDelay();

    const alerts: ComplianceAlert[] = [];

    // Expiring batches
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    this.batches.forEach(batch => {
      const expDate = new Date(batch.expiration_date);
      const product = this.products.find(p => p.id === batch.product_id);

      if (batch.status === 'active' && expDate <= thirtyDaysFromNow && expDate >= new Date() && product) {
        alerts.push({
          id: `expiring_${batch.id}`,
          type: 'expiring_soon',
          severity: 'warning',
          product_id: batch.product_id,
          batch_id: batch.id,
          message: `Batch ${batch.batch_number} for ${product.name} expires soon`,
          action_required: 'Review and potentially markdown or quarantine',
          created_at: new Date().toISOString(),
        });
      }

      if (expDate < new Date() && batch.status !== 'expired' && product) {
        alerts.push({
          id: `expired_${batch.id}`,
          type: 'expired',
          severity: 'critical',
          product_id: batch.product_id,
          batch_id: batch.id,
          message: `Batch ${batch.batch_number} for ${product.name} has expired`,
          action_required: 'Quarantine batch immediately',
          created_at: new Date().toISOString(),
        });
      }
    });

    // Low stock alerts
    this.products.filter(p => p.is_active && p.quantity_on_hand <= p.low_stock_threshold).forEach(product => {
      alerts.push({
        id: `low_stock_${product.id}`,
        type: 'low_stock',
        severity: product.quantity_on_hand === 0 ? 'critical' : 'warning',
        product_id: product.id,
        batch_id: null,
        message: `${product.name} is ${product.quantity_on_hand === 0 ? 'out of stock' : 'low on stock'}`,
        action_required: 'Reorder product',
        created_at: new Date().toISOString(),
      });
    });

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  }
}

export const mockInventoryService = new MockInventoryService();
