// Supabase Edge Function: sync-pos
// Purpose: Synchronize transactions and inventory with POS systems (Square, Clover, etc.)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Types
interface POSSyncRequest {
  dispensaryId: string;
  posSystem: 'square' | 'clover' | 'lightspeed' | 'generic';
  syncType: 'transactions' | 'inventory' | 'both';
  startDate?: string;
  endDate?: string;
}

interface POSTransaction {
  id: string;
  timestamp: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: string;
  items: POSTransactionItem[];
  customerId?: string;
}

interface POSTransactionItem {
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
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
    const requestData: POSSyncRequest = await req.json();
    const { dispensaryId, posSystem, syncType, startDate, endDate } = requestData;

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

    // Get POS integration config
    const { data: integration, error: integrationError } = await supabase
      .from('api_integrations')
      .select('*')
      .eq('dispensary_id', dispensaryId)
      .eq('integration_type', 'pos')
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'POS integration not configured' }),
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
    const apiKey = await supabase.rpc('decrypt_api_key', {
      encrypted_key: integration.api_key_encrypted,
    }).then(res => res.data);

    // Perform sync based on type and POS system
    let syncResults;
    switch (syncType) {
      case 'transactions':
        syncResults = await syncTransactions(
          dispensaryId,
          posSystem,
          apiKey,
          integration.config,
          startDate,
          endDate
        );
        break;
      case 'inventory':
        syncResults = await syncInventory(
          dispensaryId,
          posSystem,
          apiKey,
          integration.config
        );
        break;
      case 'both':
        const transactionResults = await syncTransactions(
          dispensaryId,
          posSystem,
          apiKey,
          integration.config,
          startDate,
          endDate
        );
        const inventoryResults = await syncInventory(
          dispensaryId,
          posSystem,
          apiKey,
          integration.config
        );
        syncResults = { transactions: transactionResults, inventory: inventoryResults };
        break;
      default:
        throw new Error(`Unknown sync type: ${syncType}`);
    }

    // Update integration status
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
      p_resource_type: 'pos_integration',
      p_resource_id: integration.id,
      p_new_values: { pos_system: posSystem, sync_type: syncType, results: syncResults },
    });

    return new Response(
      JSON.stringify({
        success: true,
        posSystem,
        syncType,
        results: syncResults,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('POS sync error:', error);

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
        .eq('integration_type', 'pos');
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Sync transactions from POS system
async function syncTransactions(
  dispensaryId: string,
  posSystem: string,
  apiKey: string,
  config: any,
  startDate?: string,
  endDate?: string
): Promise<any> {
  // Fetch transactions from POS
  const posTransactions = await fetchPOSTransactions(
    posSystem,
    apiKey,
    config,
    startDate,
    endDate
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const posTransaction of posTransactions) {
    try {
      // Check if transaction already exists
      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('dispensary_id', dispensaryId)
        .eq('pos_terminal_id', posTransaction.id)
        .single();

      if (existingTransaction) {
        skipped++;
        continue;
      }

      // Find or create customer
      let customerId = null;
      if (posTransaction.customerId) {
        const customerHash = await hashPII(posTransaction.customerId);
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('dispensary_id', dispensaryId)
          .eq('email_hash', customerHash)
          .single();

        if (customer) {
          customerId = customer.id;
        } else if (!customerError) {
          // Create new customer
          const { data: newCustomer } = await supabase
            .from('customers')
            .insert({
              dispensary_id: dispensaryId,
              email_hash: customerHash,
              first_name_initial: posTransaction.customerId.charAt(0).toUpperCase(),
            })
            .select('id')
            .single();

          customerId = newCustomer?.id;
        }
      }

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          dispensary_id: dispensaryId,
          customer_id: customerId,
          transaction_number: `POS-${posTransaction.id}`,
          transaction_type: 'sale',
          subtotal: posTransaction.subtotal,
          tax_amount: posTransaction.tax,
          discount_amount: posTransaction.discount,
          total_amount: posTransaction.total,
          payment_method: posTransaction.paymentMethod,
          pos_terminal_id: posTransaction.id,
          transaction_date: posTransaction.timestamp,
        })
        .select('id')
        .single();

      if (transactionError) throw transactionError;

      // Create transaction items
      for (const item of posTransaction.items) {
        // Find product by SKU
        const { data: product } = await supabase
          .from('products')
          .select('id, name, category, retail_price, cost_price')
          .eq('dispensary_id', dispensaryId)
          .eq('sku', item.productSku)
          .single();

        if (!product) {
          console.warn(`Product not found for SKU: ${item.productSku}`);
          continue;
        }

        // Create transaction item
        await supabase.from('transaction_items').insert({
          transaction_id: transaction.id,
          product_id: product.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount_amount: item.discount,
          line_total: item.total,
          product_snapshot: {
            name: product.name,
            category: product.category,
            retail_price: product.retail_price,
            cost_price: product.cost_price,
          },
        });
      }

      created++;
    } catch (err) {
      console.error(`Error syncing transaction ${posTransaction.id}:`, err);
      errors++;
    }
  }

  return {
    total: posTransactions.length,
    created,
    updated,
    skipped,
    errors,
  };
}

// Sync inventory from POS system
async function syncInventory(
  dispensaryId: string,
  posSystem: string,
  apiKey: string,
  config: any
): Promise<any> {
  // Fetch inventory from POS
  const posInventory = await fetchPOSInventory(posSystem, apiKey, config);

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const item of posInventory) {
    try {
      // Find product by SKU
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, quantity_on_hand')
        .eq('dispensary_id', dispensaryId)
        .eq('sku', item.sku)
        .single();

      if (productError || !product) {
        notFound++;
        continue;
      }

      // Update quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ quantity_on_hand: item.quantity })
        .eq('id', product.id);

      if (updateError) throw updateError;

      updated++;
    } catch (err) {
      console.error(`Error syncing inventory for ${item.sku}:`, err);
      errors++;
    }
  }

  return {
    total: posInventory.length,
    updated,
    not_found: notFound,
    errors,
  };
}

// Fetch transactions from specific POS system
async function fetchPOSTransactions(
  posSystem: string,
  apiKey: string,
  config: any,
  startDate?: string,
  endDate?: string
): Promise<POSTransaction[]> {
  switch (posSystem) {
    case 'square':
      return await fetchSquareTransactions(apiKey, config, startDate, endDate);
    case 'clover':
      return await fetchCloverTransactions(apiKey, config, startDate, endDate);
    default:
      throw new Error(`Unsupported POS system: ${posSystem}`);
  }
}

// Fetch inventory from specific POS system
async function fetchPOSInventory(
  posSystem: string,
  apiKey: string,
  config: any
): Promise<Array<{ sku: string; quantity: number }>> {
  switch (posSystem) {
    case 'square':
      return await fetchSquareInventory(apiKey, config);
    case 'clover':
      return await fetchCloverInventory(apiKey, config);
    default:
      throw new Error(`Unsupported POS system: ${posSystem}`);
  }
}

// Square POS Integration
async function fetchSquareTransactions(
  apiKey: string,
  config: any,
  startDate?: string,
  endDate?: string
): Promise<POSTransaction[]> {
  const locationId = config.location_id;
  const baseUrl = config.sandbox ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com';

  const response = await fetch(`${baseUrl}/v2/orders/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Square-Version': '2024-01-18',
    },
    body: JSON.stringify({
      location_ids: [locationId],
      query: {
        filter: {
          date_time_filter: {
            created_at: {
              start_at: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              end_at: endDate || new Date().toISOString(),
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Square API error: ${response.statusText}`);
  }

  const data = await response.json();

  return data.orders?.map((order: any) => ({
    id: order.id,
    timestamp: order.created_at,
    total: parseFloat(order.total_money?.amount || 0) / 100,
    subtotal: parseFloat(order.net_amounts?.subtotal_money?.amount || 0) / 100,
    tax: parseFloat(order.total_tax_money?.amount || 0) / 100,
    discount: parseFloat(order.total_discount_money?.amount || 0) / 100,
    paymentMethod: order.tenders?.[0]?.type || 'unknown',
    items: order.line_items?.map((item: any) => ({
      productSku: item.catalog_object_id || item.name,
      productName: item.name,
      quantity: parseInt(item.quantity),
      unitPrice: parseFloat(item.base_price_money?.amount || 0) / 100,
      discount: parseFloat(item.total_discount_money?.amount || 0) / 100,
      total: parseFloat(item.total_money?.amount || 0) / 100,
    })) || [],
    customerId: order.customer_id,
  })) || [];
}

async function fetchSquareInventory(
  apiKey: string,
  config: any
): Promise<Array<{ sku: string; quantity: number }>> {
  const locationId = config.location_id;
  const baseUrl = config.sandbox ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com';

  const response = await fetch(`${baseUrl}/v2/inventory/counts/batch-retrieve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Square-Version': '2024-01-18',
    },
    body: JSON.stringify({
      location_ids: [locationId],
    }),
  });

  if (!response.ok) {
    throw new Error(`Square API error: ${response.statusText}`);
  }

  const data = await response.json();

  return data.counts?.map((count: any) => ({
    sku: count.catalog_object_id,
    quantity: parseFloat(count.quantity || 0),
  })) || [];
}

// Clover POS Integration
async function fetchCloverTransactions(
  apiKey: string,
  config: any,
  startDate?: string,
  endDate?: string
): Promise<POSTransaction[]> {
  const merchantId = config.merchant_id;
  const baseUrl = config.sandbox
    ? 'https://sandbox.dev.clover.com'
    : 'https://api.clover.com';

  const startTime = startDate ? new Date(startDate).getTime() : Date.now() - 24 * 60 * 60 * 1000;
  const endTime = endDate ? new Date(endDate).getTime() : Date.now();

  const response = await fetch(
    `${baseUrl}/v3/merchants/${merchantId}/orders?filter=createdTime>=${startTime}&filter=createdTime<=${endTime}&expand=lineItems`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Clover API error: ${response.statusText}`);
  }

  const data = await response.json();

  return data.elements?.map((order: any) => ({
    id: order.id,
    timestamp: new Date(order.createdTime).toISOString(),
    total: parseFloat(order.total || 0) / 100,
    subtotal: parseFloat(order.amount || 0) / 100,
    tax: parseFloat(order.taxAmount || 0) / 100,
    discount: 0,
    paymentMethod: order.payments?.elements?.[0]?.cardTransaction?.type || 'unknown',
    items: order.lineItems?.elements?.map((item: any) => ({
      productSku: item.item?.id || item.name,
      productName: item.name,
      quantity: item.unitQty || 1,
      unitPrice: parseFloat(item.price || 0) / 100,
      discount: 0,
      total: parseFloat(item.price || 0) / 100 * (item.unitQty || 1),
    })) || [],
    customerId: order.customers?.elements?.[0]?.id,
  })) || [];
}

async function fetchCloverInventory(
  apiKey: string,
  config: any
): Promise<Array<{ sku: string; quantity: number }>> {
  const merchantId = config.merchant_id;
  const baseUrl = config.sandbox
    ? 'https://sandbox.dev.clover.com'
    : 'https://api.clover.com';

  const response = await fetch(
    `${baseUrl}/v3/merchants/${merchantId}/items?expand=stockCount`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Clover API error: ${response.statusText}`);
  }

  const data = await response.json();

  return data.elements?.map((item: any) => ({
    sku: item.id,
    quantity: item.stockCount || 0,
  })) || [];
}

// Hash PII data
async function hashPII(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
