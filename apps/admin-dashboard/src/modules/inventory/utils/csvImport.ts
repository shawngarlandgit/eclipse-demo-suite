import Papa from 'papaparse';

/**
 * CSV Import Utility for The Neon Pipe Product Import
 * Handles parsing, validation, and transformation of POS export data
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CSVRow {
  id: string;
  handle: string;
  sku: string;
  composite_name: string;
  composite_sku: string;
  composite_quantity: string;
  name: string;
  description: string;
  product_category: string;
  variant_option_one_name: string;
  variant_option_one_value: string;
  variant_option_two_name: string;
  variant_option_two_value: string;
  variant_option_three_name: string;
  variant_option_three_value: string;
  tags: string;
  supply_price: string;
  retail_price: string;
  loyalty_value: string;
  loyalty_value_default: string;
  account_code: string;
  account_code_purchase: string;
  brand_name: string;
  supplier_name: string;
  supplier_code: string;
  active: string;
  track_inventory: string;
  outlet_tax_The_Neon_Pipe: string;
  inventory_The_Neon_Pipe: string;
  reorder_point_The_Neon_Pipe: string;
  restock_level_The_Neon_Pipe: string;
}

export interface TransformedProduct {
  dispensary_id: string;
  sku: string;
  name: string;
  product_type: string;
  brand: string | null;
  description: string | null;
  cost_price: number;
  retail_price: number;
  quantity_on_hand: number;
  low_stock_threshold: number;
  is_active: boolean;
  strain_name: string | null;
  thc_pct: number | null;
  cbd_pct: number | null;
  vendor: string | null;
}

export interface ImportValidationResult {
  valid: TransformedProduct[];
  errors: ImportError[];
  warnings: ImportWarning[];
  duplicates: string[];
  categoryDistribution: Record<string, number>;
}

export interface ImportError {
  row: number;
  sku: string;
  field: string;
  message: string;
  originalValue: string;
}

export interface ImportWarning {
  row: number;
  sku: string;
  message: string;
}

export interface ImportProgress {
  current: number;
  total: number;
  percentage: number;
  currentBatch: number;
  totalBatches: number;
}

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ sku: string; message: string }>;
}

// ============================================================================
// CATEGORY MAPPING
// ============================================================================

/**
 * Maps CSV categories to detailed database product_type values
 * Using snake_case for database consistency
 */
const CATEGORY_MAP: Record<string, string> = {
  // Glass & Pipes
  'Hand Pipes': 'glass_pipe',
  'Water pipes': 'water_pipe',
  'Hookahs and shisha': 'hookah',
  'Nector Collectors/Tips': 'nectar_collector',

  // Smoking Accessories
  'Papers/Wraps/Cones/Tips 2025': 'papers_wraps',
  'Grinders': 'grinder',
  'Rolling Tray': 'rolling_tray',
  'Dab Tools': 'dab_tool',
  'Smoking Accessories': 'smoking_accessory',
  'Torches And Lighters': 'lighter',
  'Storage': 'storage',
  'Cleaner': 'cleaning',
  'Scales': 'scale',
  'Parts': 'parts',
  'Incense': 'incense',

  // Vapes & Electronic
  'Electronic Vapes': 'electronic_vape',
  'Vaporizer': 'vaporizer',
  'THC Vape battery': 'vape_battery',
  'Disposable Vapes': 'disposable_vape',
  'Coils': 'vape_parts',
  'E-JUICE': 'e_juice',

  // CBD & Wellness
  'CBD': 'cbd',
  'Kratom': 'kratom',
  'Natural Remedies': 'natural_remedy',

  // Extraction
  'Extraction': 'extraction',

  // Merchandise & Other
  'Clothing': 'apparel',
  'Jewelry': 'jewelry',
  'Tapestry': 'tapestry',
  'Knives': 'knife',
  'Gifts': 'gift',
  'Miscellaneous': 'miscellaneous',

  // Cannabis products - will be further parsed by name
  'Cannabis products': 'cannabis',
};

/**
 * Parse cannabis product names to determine specific type
 */
function parseCannabisCategoryFromName(name: string): string {
  const lowerName = name.toLowerCase();

  // Pre-rolls
  if (lowerName.includes('pre-roll') || lowerName.includes('preroll') ||
      lowerName.includes('pre roll') || lowerName.includes('joint') ||
      lowerName.includes('blunt') || lowerName.includes('dog walker')) {
    return 'pre_roll';
  }

  // Concentrates
  if (lowerName.includes('shatter') || lowerName.includes('wax') ||
      lowerName.includes('dab') || lowerName.includes('rosin') ||
      lowerName.includes('badder') || lowerName.includes('crumble') ||
      lowerName.includes('live resin') || lowerName.includes('cured resin') ||
      lowerName.includes('diamonds') || lowerName.includes('sauce') ||
      lowerName.includes('budder')) {
    return 'concentrate';
  }

  // Cartridges & Vapes
  if (lowerName.includes('cart') || lowerName.includes('distillate') ||
      lowerName.includes('pod') || lowerName.includes('510')) {
    return 'vape';
  }

  // Edibles
  if (lowerName.includes('edible') || lowerName.includes('gummy') ||
      lowerName.includes('chocolate') || lowerName.includes('brownie') ||
      lowerName.includes('cookie') || lowerName.includes('candy') ||
      (lowerName.includes('mg') && !lowerName.includes('gram'))) {
    return 'edible';
  }

  // Topicals
  if (lowerName.includes('cream') || lowerName.includes('lotion') ||
      lowerName.includes('balm') || lowerName.includes('salve') ||
      lowerName.includes('topical')) {
    return 'topical';
  }

  // Tinctures
  if (lowerName.includes('tincture') || lowerName.includes('oil') ||
      lowerName.includes('drops') || lowerName.includes('rso')) {
    return 'tincture';
  }

  // Kief
  if (lowerName.includes('kief')) {
    return 'kief';
  }

  // Default to flower
  return 'flower';
}

/**
 * Map a CSV category to the database product_type
 */
function mapCategory(csvCategory: string, productName: string): string {
  // Handle empty or whitespace categories
  const trimmedCategory = csvCategory?.trim() || '';

  if (!trimmedCategory) {
    // Try to infer from product name
    const lowerName = productName.toLowerCase();
    if (lowerName.includes('pipe')) return 'glass_pipe';
    if (lowerName.includes('bong') || lowerName.includes('water')) return 'water_pipe';
    if (lowerName.includes('grinder')) return 'grinder';
    if (lowerName.includes('paper') || lowerName.includes('cone')) return 'papers_wraps';
    if (lowerName.includes('tray')) return 'rolling_tray';
    return 'miscellaneous';
  }

  // Check direct mapping
  const mapped = CATEGORY_MAP[trimmedCategory];

  if (mapped === 'cannabis') {
    // Further parse cannabis products by name
    return parseCannabisCategoryFromName(productName);
  }

  if (mapped) {
    return mapped;
  }

  // Fuzzy matching for unmapped categories
  const lowerCategory = trimmedCategory.toLowerCase();

  if (lowerCategory.includes('pipe')) return 'glass_pipe';
  if (lowerCategory.includes('bong') || lowerCategory.includes('water')) return 'water_pipe';
  if (lowerCategory.includes('vape') || lowerCategory.includes('cartridge')) return 'vape';
  if (lowerCategory.includes('paper') || lowerCategory.includes('wrap') || lowerCategory.includes('cone')) return 'papers_wraps';
  if (lowerCategory.includes('grinder')) return 'grinder';
  if (lowerCategory.includes('dab')) return 'dab_tool';
  if (lowerCategory.includes('clean')) return 'cleaning';
  if (lowerCategory.includes('lighter') || lowerCategory.includes('torch')) return 'lighter';
  if (lowerCategory.includes('storage') || lowerCategory.includes('jar') || lowerCategory.includes('container')) return 'storage';

  // Default to miscellaneous
  return 'miscellaneous';
}

// ============================================================================
// CSV PARSING
// ============================================================================

/**
 * Parse a CSV file and return raw rows
 */
export async function parseCSV(file: File): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Filter out malformed rows
        const validRows = results.data.filter(row => row.sku || row.name);
        resolve(validRows);
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

/**
 * Parse CSV content string directly (for testing or server-side)
 */
export function parseCSVString(content: string): CSVRow[] {
  const result = Papa.parse<CSVRow>(content, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data.filter(row => row.sku || row.name);
}

// ============================================================================
// TRANSFORMATION & VALIDATION
// ============================================================================

/**
 * Transform and validate CSV data for database import
 */
export function transformAndValidate(
  rows: CSVRow[],
  dispensaryId: string
): ImportValidationResult {
  const valid: TransformedProduct[] = [];
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const duplicates: string[] = [];
  const seenSkus = new Set<string>();
  const categoryDistribution: Record<string, number> = {};

  rows.forEach((row, index) => {
    const rowNum = index + 2; // Account for header row (1-based)

    // Skip header row if it slipped through
    if (row.sku === 'sku' || row.name === 'name') {
      return;
    }

    // Generate SKU if missing
    let sku = row.sku?.trim();
    if (!sku) {
      // Use handle or generate from name
      sku = row.handle?.trim() || `GEN-${rowNum}-${Date.now()}`;
      warnings.push({
        row: rowNum,
        sku,
        message: `Missing SKU, generated: ${sku}`,
      });
    }

    // Check for duplicate SKUs in CSV
    if (seenSkus.has(sku)) {
      duplicates.push(sku);
      warnings.push({
        row: rowNum,
        sku,
        message: `Duplicate SKU - will update existing product`,
      });
    }
    seenSkus.add(sku);

    // Validate product name
    const name = row.name?.trim();
    if (!name) {
      errors.push({
        row: rowNum,
        sku,
        field: 'name',
        message: 'Product name is required',
        originalValue: row.name || '',
      });
      return;
    }

    // Parse prices
    const costPrice = parseFloat(row.supply_price?.replace(/[^0-9.-]/g, '')) || 0;
    const retailPrice = parseFloat(row.retail_price?.replace(/[^0-9.-]/g, '')) || 0;

    if (retailPrice <= 0 && costPrice > 0) {
      warnings.push({
        row: rowNum,
        sku,
        message: `No retail price set, using cost price ($${costPrice.toFixed(2)})`,
      });
    }

    // Map category
    const productType = mapCategory(row.product_category, name);

    // Track category distribution
    categoryDistribution[productType] = (categoryDistribution[productType] || 0) + 1;

    // Parse low stock threshold
    const lowStockThreshold = parseInt(row.reorder_point_The_Neon_Pipe) || 10;

    // Determine if active
    const isActive = row.active !== '0' && row.active?.toLowerCase() !== 'false';

    // Build transformed product
    const product: TransformedProduct = {
      dispensary_id: dispensaryId,
      sku,
      name,
      product_type: productType,
      brand: row.brand_name?.trim() || null,
      description: row.description?.trim() || null,
      cost_price: costPrice,
      retail_price: retailPrice > 0 ? retailPrice : costPrice,
      quantity_on_hand: 0, // Always 0 per requirements - fresh inventory start
      low_stock_threshold: lowStockThreshold,
      is_active: isActive,
      strain_name: null, // Will be set for cannabis products if we can parse it
      thc_pct: null,
      cbd_pct: null,
      vendor: row.supplier_name?.trim() || null,
    };

    valid.push(product);
  });

  return {
    valid,
    errors,
    warnings,
    duplicates,
    categoryDistribution,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get a human-readable category label
 */
export function getCategoryLabel(productType: string): string {
  const labels: Record<string, string> = {
    // Cannabis
    flower: 'Flower',
    pre_roll: 'Pre-Roll',
    concentrate: 'Concentrate',
    edible: 'Edible',
    topical: 'Topical',
    tincture: 'Tincture',
    vape: 'Vape Cartridge',
    kief: 'Kief',

    // Glass & Pipes
    glass_pipe: 'Hand Pipe',
    water_pipe: 'Water Pipe',
    hookah: 'Hookah',
    nectar_collector: 'Nectar Collector',

    // Accessories
    papers_wraps: 'Papers & Wraps',
    grinder: 'Grinder',
    rolling_tray: 'Rolling Tray',
    dab_tool: 'Dab Tool',
    smoking_accessory: 'Smoking Accessory',
    lighter: 'Lighter/Torch',
    storage: 'Storage',
    cleaning: 'Cleaning',
    scale: 'Scale',
    parts: 'Parts',
    incense: 'Incense',

    // Vapes & Electronic
    electronic_vape: 'Electronic Vape',
    vaporizer: 'Vaporizer',
    vape_battery: 'Vape Battery',
    disposable_vape: 'Disposable Vape',
    vape_parts: 'Vape Parts',
    e_juice: 'E-Juice',

    // CBD & Wellness
    cbd: 'CBD',
    kratom: 'Kratom',
    natural_remedy: 'Natural Remedy',

    // Other
    extraction: 'Extraction',
    apparel: 'Apparel',
    jewelry: 'Jewelry',
    tapestry: 'Tapestry',
    knife: 'Knife',
    gift: 'Gift',
    miscellaneous: 'Miscellaneous',
    accessory: 'Accessory',
  };

  return labels[productType] || productType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Group categories for display
 */
export const CATEGORY_GROUPS = {
  cannabis: ['flower', 'pre_roll', 'concentrate', 'edible', 'topical', 'tincture', 'vape', 'kief'],
  glass: ['glass_pipe', 'water_pipe', 'hookah', 'nectar_collector'],
  accessories: ['papers_wraps', 'grinder', 'rolling_tray', 'dab_tool', 'smoking_accessory', 'lighter', 'storage', 'cleaning', 'scale', 'parts', 'incense'],
  electronic: ['electronic_vape', 'vaporizer', 'vape_battery', 'disposable_vape', 'vape_parts', 'e_juice'],
  wellness: ['cbd', 'kratom', 'natural_remedy'],
  other: ['extraction', 'apparel', 'jewelry', 'tapestry', 'knife', 'gift', 'miscellaneous'],
};

/**
 * Chunk an array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
