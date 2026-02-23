# Real-Time Subscription Strategy

## Overview

This document outlines the complete real-time subscription strategy for the Cannabis Admin Dashboard using Supabase Real-time.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │ Dashboard  │  │ Inventory  │  │ Compliance Monitor   │  │
│  │ Component  │  │ Component  │  │ Component            │  │
│  └────┬───────┘  └────┬───────┘  └──────────┬───────────┘  │
│       │               │                      │               │
└───────┼───────────────┼──────────────────────┼───────────────┘
        │               │                      │
        │               │                      │
        ↓               ↓                      ↓
┌─────────────────────────────────────────────────────────────┐
│              Supabase Realtime Channels                      │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │ dashboard: │  │ inventory: │  │ compliance:          │  │
│  │ {disp_id}  │  │ {disp_id}  │  │ {disp_id}            │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
        │               │                      │
        │               │                      │
        ↓               ↓                      ↓
┌─────────────────────────────────────────────────────────────┐
│           PostgreSQL Replication Log (WAL)                   │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │transactions│  │  products  │  │ compliance_flags     │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Tables with Real-time Broadcasting

### 1. Transactions Table
**Purpose**: Live sales updates, revenue tracking

**Events to Broadcast**:
- `INSERT`: New sale completed
- `UPDATE`: Transaction void/return
- `DELETE`: Transaction removal (rare)

**Use Cases**:
- Dashboard revenue counter
- Recent transactions list
- Sales notifications

### 2. Products Table
**Purpose**: Inventory level monitoring, low stock alerts

**Events to Broadcast**:
- `UPDATE`: Inventory quantity change
- `INSERT`: New product added
- `DELETE`: Product removed

**Use Cases**:
- Low stock alerts
- Inventory dashboard
- Stock level indicators

### 3. Compliance Flags Table
**Purpose**: Immediate compliance alerts

**Events to Broadcast**:
- `INSERT`: New compliance issue
- `UPDATE`: Flag resolved
- `DELETE`: Flag removed

**Use Cases**:
- Compliance dashboard
- Alert notifications
- Manager notifications

### 4. Customers Table (Limited)
**Purpose**: New customer tracking

**Events to Broadcast**:
- `INSERT`: New customer registration

**Use Cases**:
- Customer acquisition tracking
- Loyalty program enrollments

### 5. Users Table (Admin Only)
**Purpose**: Staff changes monitoring

**Events to Broadcast**:
- `INSERT`: New staff member
- `UPDATE`: Role/permission changes
- `DELETE`: Staff removal

**Use Cases**:
- Admin dashboard
- Staff management interface

## Channel Naming Convention

### Pattern
```
{resource}:{dispensary_id}[:{optional_specifier}]
```

### Examples
```typescript
// Dashboard channel (multiple tables)
`dashboard:550e8400-e29b-41d4-a716-446655440000`

// Inventory-specific channel
`inventory:550e8400-e29b-41d4-a716-446655440000`

// Compliance-specific channel
`compliance:550e8400-e29b-41d4-a716-446655440000`

// Product-specific channel (single product updates)
`product:550e8400-e29b-41d4-a716-446655440000:product_id`

// Transaction history (for a specific customer)
`transactions:550e8400-e29b-41d4-a716-446655440000:customer_id`
```

## Multi-Tenant Filtering Strategy

### Critical Security Rule
**ALWAYS filter by `dispensary_id` to prevent cross-tenant data leaks.**

### Filter Syntax

```typescript
// Correct: Filter by dispensary_id
.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'transactions',
    filter: `dispensary_id=eq.${dispensaryId}`, // REQUIRED
  },
  handler
)

// Incorrect: No filter (receives ALL tenants' data)
.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'transactions',
    // Missing filter - SECURITY RISK
  },
  handler
)
```

### Additional Filters

```typescript
// Specific product updates
filter: `dispensary_id=eq.${dispensaryId}&id=eq.${productId}`

// Low stock products only
filter: `dispensary_id=eq.${dispensaryId}&quantity_on_hand=lte.10`

// Unresolved compliance flags
filter: `dispensary_id=eq.${dispensaryId}&resolved_at=is.null`

// Today's transactions
filter: `dispensary_id=eq.${dispensaryId}&transaction_date=gte.${today}`
```

## Connection Limits & Performance

### Supabase Limits

| Plan       | Concurrent Connections | Messages/Second |
|------------|------------------------|-----------------|
| Free       | 2                      | 100             |
| Pro        | 500                    | Unlimited       |
| Enterprise | Custom                 | Unlimited       |

### Optimization Strategies

#### 1. Channel Multiplexing
**Combine multiple subscriptions into one channel:**

```typescript
// Instead of:
const channel1 = supabase.channel(`transactions:${dispensaryId}`);
const channel2 = supabase.channel(`products:${dispensaryId}`);
const channel3 = supabase.channel(`compliance:${dispensaryId}`);

// Do this:
const channel = supabase
  .channel(`dashboard:${dispensaryId}`)
  .on('postgres_changes', { event: 'INSERT', table: 'transactions', filter }, handleTransaction)
  .on('postgres_changes', { event: 'UPDATE', table: 'products', filter }, handleProduct)
  .on('postgres_changes', { event: 'INSERT', table: 'compliance_flags', filter }, handleCompliance)
  .subscribe();
```

#### 2. Channel Reuse
**Share channels across components:**

```typescript
// Create singleton channel manager
class ChannelManager {
  private channels: Map<string, RealtimeChannel> = new Map();

  getChannel(channelName: string): RealtimeChannel {
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, supabase.channel(channelName));
    }
    return this.channels.get(channelName)!;
  }

  cleanup(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }
}

// Usage in React
const channelManager = new ChannelManager();

function DashboardComponent() {
  useEffect(() => {
    const channel = channelManager.getChannel(`dashboard:${dispensaryId}`);
    channel.on('postgres_changes', config, handler);

    return () => {
      // Don't unsubscribe if other components use it
      // channelManager.cleanup() only when app unmounts
    };
  }, []);
}
```

#### 3. Throttling & Debouncing
**Prevent excessive updates:**

```typescript
import { debounce } from 'lodash';

const debouncedUpdate = debounce((payload) => {
  updateDashboard(payload);
}, 500); // Wait 500ms after last change

channel.on('postgres_changes', config, (payload) => {
  debouncedUpdate(payload);
});
```

#### 4. Selective Subscriptions
**Only subscribe to what's visible:**

```typescript
function InventoryPage() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) return; // Don't subscribe if tab not active

    const channel = supabase
      .channel(`inventory:${dispensaryId}`)
      .on('postgres_changes', config, handler)
      .subscribe();

    return () => channel.unsubscribe();
  }, [isVisible]);

  // Detect tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
}
```

## Implementation Examples

### 1. Dashboard Real-time Updates

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useDashboardRealtime(dispensaryId: string) {
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    todayTransactions: 0,
    lowStockAlerts: 0,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`dashboard:${dispensaryId}`)
      // New transactions
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `dispensary_id=eq.${dispensaryId}`,
        },
        (payload) => {
          const transaction = payload.new as any;
          if (transaction.transaction_type === 'sale') {
            setMetrics((prev) => ({
              ...prev,
              todayRevenue: prev.todayRevenue + parseFloat(transaction.total_amount),
              todayTransactions: prev.todayTransactions + 1,
            }));
          }
        }
      )
      // Low stock alerts
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `dispensary_id=eq.${dispensaryId}`,
        },
        (payload) => {
          const product = payload.new as any;
          const oldProduct = payload.old as any;

          // Check if product just went low stock
          if (
            product.quantity_on_hand <= product.low_stock_threshold &&
            oldProduct.quantity_on_hand > oldProduct.low_stock_threshold
          ) {
            setMetrics((prev) => ({
              ...prev,
              lowStockAlerts: prev.lowStockAlerts + 1,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [dispensaryId]);

  return metrics;
}
```

### 2. Inventory Monitoring

```typescript
export function useInventoryRealtime(dispensaryId: string) {
  const [lowStockProducts, setLowStockProducts] = useState<string[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`inventory:${dispensaryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `dispensary_id=eq.${dispensaryId}`,
        },
        (payload) => {
          const product = payload.new as any;

          if (product.quantity_on_hand <= product.low_stock_threshold) {
            setLowStockProducts((prev) => {
              if (!prev.includes(product.id)) {
                return [...prev, product.id];
              }
              return prev;
            });

            // Show notification
            showNotification({
              title: 'Low Stock Alert',
              message: `${product.name} is running low (${product.quantity_on_hand} left)`,
              type: 'warning',
            });
          } else {
            // Remove from low stock list if restocked
            setLowStockProducts((prev) => prev.filter((id) => id !== product.id));
          }
        }
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, [dispensaryId]);

  return { lowStockProducts };
}
```

### 3. Compliance Alerts

```typescript
export function useComplianceRealtime(dispensaryId: string) {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`compliance:${dispensaryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'compliance_flags',
          filter: `dispensary_id=eq.${dispensaryId}`,
        },
        async (payload) => {
          const flag = payload.new as any;

          // Add to alerts
          setAlerts((prev) => [flag, ...prev]);

          // Show critical notification
          if (flag.severity === 'violation') {
            showNotification({
              title: 'Compliance Violation',
              message: flag.title,
              type: 'error',
              persistent: true, // Don't auto-dismiss
            });

            // Play alert sound
            playAlertSound();

            // Send push notification to managers
            if (Notification.permission === 'granted') {
              new Notification('Compliance Violation', {
                body: flag.title,
                icon: '/alert-icon.png',
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'compliance_flags',
          filter: `dispensary_id=eq.${dispensaryId}`,
        },
        (payload) => {
          const flag = payload.new as any;

          // If resolved, remove from alerts
          if (flag.resolved_at) {
            setAlerts((prev) => prev.filter((a) => a.id !== flag.id));
          }
        }
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, [dispensaryId]);

  return { alerts };
}
```

### 4. Transaction Stream

```typescript
export function useTransactionStream(dispensaryId: string, limit: number = 10) {
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    // Fetch initial transactions
    const fetchInitial = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*, customer:customers(first_name_initial), processed_by:users(full_name)')
        .eq('dispensary_id', dispensaryId)
        .order('transaction_date', { ascending: false })
        .limit(limit);

      setRecentTransactions(data || []);
    };

    fetchInitial();

    // Subscribe to new transactions
    const channel = supabase
      .channel(`transactions:${dispensaryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `dispensary_id=eq.${dispensaryId}`,
        },
        async (payload) => {
          const transactionId = payload.new.id;

          // Fetch full transaction with relations
          const { data } = await supabase
            .from('transactions')
            .select('*, customer:customers(first_name_initial), processed_by:users(full_name)')
            .eq('id', transactionId)
            .single();

          if (data) {
            setRecentTransactions((prev) => [data, ...prev.slice(0, limit - 1)]);
          }
        }
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, [dispensaryId, limit]);

  return { recentTransactions };
}
```

## Error Handling & Reconnection

### Automatic Reconnection

Supabase automatically handles reconnection, but you should handle states:

```typescript
export function useRealtimeConnection(dispensaryId: string) {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    const channel = supabase
      .channel(`dashboard:${dispensaryId}`)
      .on('system', { event: 'CHANNEL_STATE_CHANGE' }, (payload) => {
        console.log('Channel state:', payload);
        if (payload.newState === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (payload.newState === 'CLOSED') {
          setStatus('disconnected');
        } else {
          setStatus('connecting');
        }
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, [dispensaryId]);

  return { status };
}
```

### Error Handling

```typescript
channel
  .on('postgres_changes', config, (payload) => {
    try {
      handleUpdate(payload);
    } catch (error) {
      console.error('Failed to handle realtime update:', error);
      // Log to error tracking service
      Sentry.captureException(error);
    }
  })
  .subscribe((status, err) => {
    if (err) {
      console.error('Subscription error:', err);
      // Retry or notify user
    }
  });
```

## Testing Real-time Subscriptions

### Manual Testing

```sql
-- Trigger a transaction insert
INSERT INTO transactions (
  dispensary_id,
  transaction_number,
  transaction_type,
  subtotal,
  tax_amount,
  total_amount,
  processed_by
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'TEST-001',
  'sale',
  100.00,
  10.00,
  110.00,
  current_setting('request.jwt.claims')::json->>'sub'
);

-- Trigger low stock update
UPDATE products
SET quantity_on_hand = 5
WHERE dispensary_id = '550e8400-e29b-41d4-a716-446655440000'
  AND id = 'product-id-here';

-- Trigger compliance flag
INSERT INTO compliance_flags (
  dispensary_id,
  flag_type,
  severity,
  title,
  description
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'inventory_discrepancy',
  'warning',
  'Inventory Mismatch',
  'System inventory does not match physical count'
);
```

### Automated Testing

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Real-time subscriptions', () => {
  let channel: RealtimeChannel;
  let receivedPayload: any;

  beforeAll(async () => {
    channel = supabase
      .channel('test-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
        filter: `dispensary_id=eq.${testDispensaryId}`,
      }, (payload) => {
        receivedPayload = payload;
      })
      .subscribe();

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for subscription
  });

  afterAll(() => {
    channel.unsubscribe();
  });

  it('should receive transaction insert', async () => {
    // Insert transaction
    await supabase.from('transactions').insert({
      dispensary_id: testDispensaryId,
      transaction_number: 'TEST-001',
      transaction_type: 'sale',
      subtotal: 100,
      tax_amount: 10,
      total_amount: 110,
    });

    // Wait for real-time event
    await new Promise((resolve) => setTimeout(resolve, 2000));

    expect(receivedPayload).toBeDefined();
    expect(receivedPayload.new.transaction_number).toBe('TEST-001');
  });
});
```

## Best Practices

1. **Always filter by `dispensary_id`** - Critical for multi-tenancy
2. **Multiplex channels** - Reduce connection count
3. **Debounce handlers** - Prevent excessive re-renders
4. **Unsubscribe on unmount** - Prevent memory leaks
5. **Handle errors gracefully** - Don't crash on network issues
6. **Test with production data volume** - Ensure performance at scale
7. **Monitor connection count** - Stay within plan limits
8. **Use presence for user awareness** - Show who's online
9. **Implement fallback polling** - If real-time fails, poll periodically
10. **Document all channels** - Maintain channel registry

## Troubleshooting

### Problem: Not Receiving Updates
**Solutions:**
1. Check filter syntax (must match PostgreSQL column names)
2. Verify RLS policies don't block the user
3. Ensure table has replica identity set to `FULL`
4. Check Supabase dashboard for real-time settings

### Problem: Too Many Connections
**Solutions:**
1. Use channel multiplexing
2. Unsubscribe unused channels
3. Share channels across components
4. Upgrade to Pro plan

### Problem: Delayed Updates
**Solutions:**
1. Check network latency
2. Verify database performance
3. Consider using broadcast for high-frequency updates
4. Optimize RLS policies

---

## Summary

This real-time strategy provides:
- Live dashboard updates
- Immediate compliance alerts
- Low stock notifications
- Transaction stream
- Efficient connection management
- Multi-tenant security
- Scalable architecture

Follow the patterns and best practices to build a responsive, real-time admin dashboard.
