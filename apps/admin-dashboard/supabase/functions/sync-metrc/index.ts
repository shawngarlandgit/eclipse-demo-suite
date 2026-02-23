// Supabase Edge Function: sync-metrc
// Purpose: Synchronize product data with Metrc state compliance system

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Types
interface MetrcSyncRequest {
  dispensaryId: string;
  syncType: 'full' | 'incremental' | 'products' | 'inventory' | 'sales';
  productIds?: string[];
}

interface MetrcConfig {
  apiUrl: string;
  licenseNumber: string;
  apiKey: string;
  userKey: string;
  state: string;
}

interface MetrcProduct {
  Id: number;
  Name: string;
  ProductCategoryName: string;
  ProductCategoryType: string;
  UnitOfMeasureName: string;
  Strain?: string;
  AdministrationMethod?: string;
  UnitThcContent?: number;
  UnitCbdContent?: number;
  UnitWeight?: number;
  IsActive: boolean;
}

interface MetrcPackage {
  Id: number;
  Label: string;
  PackageType: string;
  ProductId: number;
  ProductName: string;
  Quantity: number;
  UnitOfMeasureName: string;
  Item: {
    ProductCategoryName: string;
    Strain: string;
  };
  IsFinished: boolean;
  FinishedDate?: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Authenticate request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const requestData: MetrcSyncRequest = await req.json();
    const { dispensaryId, syncType, productIds } = requestData;

    // Verify user has access
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('dispensary_id, role, permissions')
      .eq('id', user.id)
      .single();

    if (userError || userData.dispensary_id !== dispensaryId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check manage_integrations permission
    if (!userData.permissions?.manage_integrations && !['owner', 'admin'].includes(userData.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get Metrc integration config
    const { data: integration, error: integrationError } = await supabase
      .from('api_integrations')
      .select('*')
      .eq('dispensary_id', dispensaryId)
      .eq('integration_type', 'metrc')
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Metrc integration not configured' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (integration.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Metrc integration is not active' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update integration status
    await supabase
      .from('api_integrations')
      .update({
        status: 'syncing',
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    // Decrypt API credentials
    const metrcConfig: MetrcConfig = {
      apiUrl: integration.config.api_url || 'https://api-ca.metrc.com',
      licenseNumber: integration.config.license_number,
      apiKey: await decryptApiKey(integration.api_key_encrypted),
      userKey: await decryptApiKey(integration.api_secret_encrypted),
      state: integration.config.state || 'CA',
    };

    // Perform sync based on type
    let syncResults;
    switch (syncType) {
      case 'full':
        syncResults = await performFullSync(dispensaryId, metrcConfig);
        break;
      case 'incremental':
        syncResults = await performIncrementalSync(dispensaryId, metrcConfig);
        break;
      case 'products':
        syncResults = await syncProducts(dispensaryId, metrcConfig);
        break;
      case 'inventory':
        syncResults = await syncInventory(dispensaryId, metrcConfig);
        break;
      case 'sales':
        syncResults = await syncSales(dispensaryId, metrcConfig, productIds);
        break;
      default:
        throw new Error(`Unknown sync type: ${syncType}`);
    }

    // Update integration status to active
    await supabase
      .from('api_integrations')
      .update({
        status: 'active',
        last_sync_status: 'success',
        last_error: null,
        metadata: {
          ...integration.metadata,
          last_sync_results: syncResults,
        },
      })
      .eq('id', integration.id);

    // Log audit event
    await supabase.rpc('create_audit_log', {
      p_dispensary_id: dispensaryId,
      p_user_id: user.id,
      p_user_email: user.email,
      p_user_role: userData.role,
      p_action: 'sync',
      p_resource_type: 'metrc_integration',
      p_resource_id: integration.id,
      p_new_values: { sync_type: syncType, results: syncResults },
    });

    return new Response(
      JSON.stringify({
        success: true,
        syncType,
        results: syncResults,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Metrc sync error:', error);

    // Update integration status to error
    const requestData = await req.json().catch(() => ({}));
    if (requestData.dispensaryId) {
      await supabase
        .from('api_integrations')
        .update({
          status: 'error',
          last_sync_status: 'failure',
          last_error: error.message,
        })
        .eq('dispensary_id', requestData.dispensaryId)
        .eq('integration_type', 'metrc');
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Decrypt API key using Supabase function
async function decryptApiKey(encryptedKey: string): Promise<string> {
  const { data, error } = await supabase.rpc('decrypt_api_key', {
    encrypted_key: encryptedKey,
  });

  if (error) throw new Error(`Failed to decrypt API key: ${error.message}`);
  return data;
}

// Make authenticated Metrc API request
async function metrcRequest(
  config: MetrcConfig,
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const url = `${config.apiUrl}${endpoint}`;
  const auth = btoa(`${config.apiKey}:${config.userKey}`);

  const headers: HeadersInit = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Metrc API error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

// Perform full sync
async function performFullSync(
  dispensaryId: string,
  config: MetrcConfig
): Promise<any> {
  const productsResult = await syncProducts(dispensaryId, config);
  const inventoryResult = await syncInventory(dispensaryId, config);

  return {
    products: productsResult,
    inventory: inventoryResult,
  };
}

// Perform incremental sync (only changes since last sync)
async function performIncrementalSync(
  dispensaryId: string,
  config: MetrcConfig
): Promise<any> {
  // Get last sync time
  const { data: integration } = await supabase
    .from('api_integrations')
    .select('last_sync_at')
    .eq('dispensary_id', dispensaryId)
    .eq('integration_type', 'metrc')
    .single();

  const lastSyncDate = integration?.last_sync_at
    ? new Date(integration.last_sync_at).toISOString().split('T')[0]
    : null;

  // For now, perform full sync (incremental would filter by lastmodified)
  return await performFullSync(dispensaryId, config);
}

// Sync products from Metrc
async function syncProducts(
  dispensaryId: string,
  config: MetrcConfig
): Promise<any> {
  // Fetch active products from Metrc
  const metrcProducts: MetrcProduct[] = await metrcRequest(
    config,
    `/items/v1/active?licenseNumber=${config.licenseNumber}`,
    'GET'
  );

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const metrcProduct of metrcProducts) {
    try {
      // Map Metrc product to our schema
      const productData = {
        dispensary_id: dispensaryId,
        sku: `METRC-${metrcProduct.Id}`,
        name: metrcProduct.Name,
        category: mapMetrcCategory(metrcProduct.ProductCategoryName),
        brand: metrcProduct.Strain || 'Unknown',
        description: `${metrcProduct.ProductCategoryType} - ${metrcProduct.AdministrationMethod || ''}`,
        thc_percentage: metrcProduct.UnitThcContent || null,
        cbd_percentage: metrcProduct.UnitCbdContent || null,
        weight_grams: metrcProduct.UnitWeight || null,
        unit_type: metrcProduct.UnitOfMeasureName,
        metrc_id: metrcProduct.Id.toString(),
        is_active: metrcProduct.IsActive,
      };

      // Upsert product
      const { error } = await supabase
        .from('products')
        .upsert(
          productData,
          {
            onConflict: 'metrc_id',
            ignoreDuplicates: false,
          }
        );

      if (error) {
        console.error(`Error syncing product ${metrcProduct.Id}:`, error);
        errors++;
      } else {
        // Check if it was an insert or update
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('metrc_id', metrcProduct.Id.toString())
          .single();

        if (existing) {
          updated++;
        } else {
          created++;
        }
      }
    } catch (err) {
      console.error(`Error processing product ${metrcProduct.Id}:`, err);
      errors++;
    }
  }

  return {
    total: metrcProducts.length,
    created,
    updated,
    errors,
  };
}

// Sync inventory from Metrc packages
async function syncInventory(
  dispensaryId: string,
  config: MetrcConfig
): Promise<any> {
  // Fetch active packages (inventory) from Metrc
  const metrcPackages: MetrcPackage[] = await metrcRequest(
    config,
    `/packages/v1/active?licenseNumber=${config.licenseNumber}`,
    'GET'
  );

  // Group packages by product
  const inventoryMap = new Map<string, number>();

  for (const pkg of metrcPackages) {
    if (pkg.IsFinished) continue; // Skip finished packages

    const metrcId = pkg.ProductId.toString();
    const currentQty = inventoryMap.get(metrcId) || 0;
    inventoryMap.set(metrcId, currentQty + pkg.Quantity);
  }

  let updated = 0;
  let errors = 0;

  // Update inventory quantities
  for (const [metrcId, quantity] of inventoryMap.entries()) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ quantity_on_hand: Math.floor(quantity) })
        .eq('dispensary_id', dispensaryId)
        .eq('metrc_id', metrcId);

      if (error) {
        console.error(`Error updating inventory for ${metrcId}:`, error);
        errors++;
      } else {
        updated++;
      }
    } catch (err) {
      console.error(`Error processing inventory for ${metrcId}:`, err);
      errors++;
    }
  }

  return {
    total_packages: metrcPackages.length,
    products_updated: updated,
    errors,
  };
}

// Sync sales transactions to Metrc
async function syncSales(
  dispensaryId: string,
  config: MetrcConfig,
  productIds?: string[]
): Promise<any> {
  // Fetch recent transactions that need to be synced to Metrc
  let query = supabase
    .from('transactions')
    .select(`
      *,
      transaction_items (
        *,
        product:products (metrc_id, sku, name)
      )
    `)
    .eq('dispensary_id', dispensaryId)
    .is('metrc_id', null) // Only sync transactions not yet in Metrc
    .eq('transaction_type', 'sale')
    .order('transaction_date', { ascending: false })
    .limit(100);

  const { data: transactions, error } = await query;

  if (error) throw error;

  let synced = 0;
  let errors = 0;

  for (const transaction of transactions) {
    try {
      // Build Metrc sales receipt
      const salesReceipt = {
        SalesDateTime: transaction.transaction_date,
        SalesCustomerType: transaction.customer_id ? 'Consumer' : 'Anonymous',
        IdentificationMethod: 'Unknown',
        Transactions: transaction.transaction_items.map((item: any) => ({
          PackageLabel: item.product.metrc_id,
          Quantity: item.quantity,
          UnitOfMeasure: item.product_snapshot.unit_type || 'Each',
          TotalAmount: parseFloat(item.line_total),
        })),
      };

      // Post to Metrc
      await metrcRequest(
        config,
        `/sales/v1/receipts?licenseNumber=${config.licenseNumber}`,
        'POST',
        [salesReceipt]
      );

      // Update transaction with Metrc ID (would come from response in production)
      await supabase
        .from('transactions')
        .update({ metrc_id: `METRC-${transaction.id}` })
        .eq('id', transaction.id);

      synced++;
    } catch (err) {
      console.error(`Error syncing transaction ${transaction.id}:`, err);
      errors++;
    }
  }

  return {
    total: transactions.length,
    synced,
    errors,
  };
}

// Map Metrc category to our enum
function mapMetrcCategory(metrcCategory: string): string {
  const categoryMap: Record<string, string> = {
    'Buds': 'flower',
    'Flower': 'flower',
    'Pre-Rolls': 'pre_roll',
    'Concentrate': 'concentrate',
    'Edible': 'edible',
    'Topical': 'topical',
    'Tincture': 'tincture',
    'Vape': 'vape',
    'Capsules': 'edible',
  };

  return categoryMap[metrcCategory] || 'flower';
}

// Retry logic with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}
