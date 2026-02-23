// Supabase Edge Function: generate-report
// Purpose: Generate PDF reports for sales, inventory, compliance, and audit logs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

// Types
interface ReportRequest {
  reportId: string;
  dispensaryId: string;
  reportType: 'daily_sales' | 'inventory' | 'compliance' | 'audit' | 'custom';
  startDate: string;
  endDate: string;
  filters?: Record<string, any>;
}

interface ReportData {
  title: string;
  sections: ReportSection[];
  summary?: Record<string, any>;
}

interface ReportSection {
  title: string;
  type: 'table' | 'chart' | 'text' | 'summary';
  data: any;
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
    const requestData: ReportRequest = await req.json();
    const { reportId, dispensaryId, reportType, startDate, endDate, filters } = requestData;

    // Verify user has access to this dispensary
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

    // Check view_reports permission
    if (!userData.permissions?.view_reports && userData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update report status to processing
    await supabase
      .from('reports')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    // Fetch report data based on type
    const reportData = await fetchReportData(
      dispensaryId,
      reportType,
      startDate,
      endDate,
      filters
    );

    // Generate PDF
    const pdfBytes = await generatePDF(reportData, reportType, startDate, endDate);

    // Upload PDF to storage
    const fileName = `reports/${dispensaryId}/${reportId}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(fileName);

    // Update report status to completed
    await supabase
      .from('reports')
      .update({
        status: 'completed',
        processing_completed_at: new Date().toISOString(),
        file_url: urlData.publicUrl,
        file_size_bytes: pdfBytes.length,
      })
      .eq('id', reportId);

    // Log audit event
    await supabase.rpc('create_audit_log', {
      p_dispensary_id: dispensaryId,
      p_user_id: user.id,
      p_user_email: user.email,
      p_user_role: userData.role,
      p_action: 'create',
      p_resource_type: 'report',
      p_resource_id: reportId,
      p_new_values: { report_type: reportType, file_url: urlData.publicUrl },
    });

    return new Response(
      JSON.stringify({
        success: true,
        reportId,
        fileUrl: urlData.publicUrl,
        fileSize: pdfBytes.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Report generation error:', error);

    // Update report status to failed
    const requestData = await req.json().catch(() => ({}));
    if (requestData.reportId) {
      await supabase
        .from('reports')
        .update({
          status: 'failed',
          error_message: error.message,
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', requestData.reportId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Fetch report data based on type
async function fetchReportData(
  dispensaryId: string,
  reportType: string,
  startDate: string,
  endDate: string,
  filters?: Record<string, any>
): Promise<ReportData> {
  switch (reportType) {
    case 'daily_sales':
      return await fetchDailySalesReport(dispensaryId, startDate, endDate);
    case 'inventory':
      return await fetchInventoryReport(dispensaryId, filters);
    case 'compliance':
      return await fetchComplianceReport(dispensaryId, startDate, endDate);
    case 'audit':
      return await fetchAuditReport(dispensaryId, startDate, endDate, filters);
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
}

// Daily Sales Report
async function fetchDailySalesReport(
  dispensaryId: string,
  startDate: string,
  endDate: string
): Promise<ReportData> {
  const { data: salesData, error } = await supabase
    .from('mv_daily_sales_summary')
    .select('*')
    .eq('dispensary_id', dispensaryId)
    .gte('sale_date', startDate)
    .lte('sale_date', endDate)
    .order('sale_date', { ascending: false });

  if (error) throw error;

  const totalRevenue = salesData.reduce((sum, day) => sum + parseFloat(day.total_revenue), 0);
  const totalTransactions = salesData.reduce((sum, day) => sum + day.total_transactions, 0);
  const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  return {
    title: 'Daily Sales Report',
    summary: {
      'Total Revenue': `$${totalRevenue.toFixed(2)}`,
      'Total Transactions': totalTransactions,
      'Average Transaction': `$${avgTransactionValue.toFixed(2)}`,
      'Days in Period': salesData.length,
    },
    sections: [
      {
        title: 'Daily Breakdown',
        type: 'table',
        data: salesData.map(day => ({
          Date: day.sale_date,
          Transactions: day.total_transactions,
          Revenue: `$${parseFloat(day.total_revenue).toFixed(2)}`,
          'Avg Value': `$${parseFloat(day.avg_transaction_value).toFixed(2)}`,
          Customers: day.unique_customers,
        })),
      },
    ],
  };
}

// Inventory Report
async function fetchInventoryReport(
  dispensaryId: string,
  filters?: Record<string, any>
): Promise<ReportData> {
  let query = supabase
    .from('products')
    .select('*')
    .eq('dispensary_id', dispensaryId)
    .eq('is_active', true);

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  const { data: products, error } = await query.order('name');

  if (error) throw error;

  const totalValue = products.reduce(
    (sum, p) => sum + p.quantity_on_hand * parseFloat(p.retail_price),
    0
  );
  const totalCost = products.reduce(
    (sum, p) => sum + p.quantity_on_hand * parseFloat(p.cost_price),
    0
  );
  const lowStockCount = products.filter(p => p.quantity_on_hand <= p.low_stock_threshold).length;

  return {
    title: 'Inventory Report',
    summary: {
      'Total Products': products.length,
      'Total Retail Value': `$${totalValue.toFixed(2)}`,
      'Total Cost Value': `$${totalCost.toFixed(2)}`,
      'Low Stock Items': lowStockCount,
    },
    sections: [
      {
        title: 'Product Inventory',
        type: 'table',
        data: products.map(p => ({
          SKU: p.sku,
          Name: p.name,
          Category: p.category,
          'On Hand': p.quantity_on_hand,
          'Cost': `$${parseFloat(p.cost_price).toFixed(2)}`,
          'Retail': `$${parseFloat(p.retail_price).toFixed(2)}`,
          'Total Value': `$${(p.quantity_on_hand * parseFloat(p.retail_price)).toFixed(2)}`,
        })),
      },
    ],
  };
}

// Compliance Report
async function fetchComplianceReport(
  dispensaryId: string,
  startDate: string,
  endDate: string
): Promise<ReportData> {
  const { data: flags, error } = await supabase
    .from('compliance_flags')
    .select('*, resolved_by:users(full_name)')
    .eq('dispensary_id', dispensaryId)
    .gte('flagged_at', startDate)
    .lte('flagged_at', endDate)
    .order('flagged_at', { ascending: false });

  if (error) throw error;

  const unresolvedCount = flags.filter(f => !f.resolved_at).length;
  const resolvedCount = flags.filter(f => f.resolved_at).length;

  return {
    title: 'Compliance Report',
    summary: {
      'Total Flags': flags.length,
      'Unresolved': unresolvedCount,
      'Resolved': resolvedCount,
      'Resolution Rate': `${flags.length > 0 ? ((resolvedCount / flags.length) * 100).toFixed(1) : 0}%`,
    },
    sections: [
      {
        title: 'Compliance Flags',
        type: 'table',
        data: flags.map(f => ({
          'Flagged Date': new Date(f.flagged_at).toLocaleDateString(),
          Type: f.flag_type,
          Severity: f.severity,
          Title: f.title,
          Status: f.resolved_at ? 'Resolved' : 'Open',
          'Resolved By': f.resolved_by?.full_name || 'N/A',
        })),
      },
    ],
  };
}

// Audit Report
async function fetchAuditReport(
  dispensaryId: string,
  startDate: string,
  endDate: string,
  filters?: Record<string, any>
): Promise<ReportData> {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .eq('dispensary_id', dispensaryId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (filters?.action) {
    query = query.eq('action', filters.action);
  }

  if (filters?.resource_type) {
    query = query.eq('resource_type', filters.resource_type);
  }

  const { data: logs, error } = await query
    .order('created_at', { ascending: false })
    .limit(1000); // Limit to prevent huge reports

  if (error) throw error;

  return {
    title: 'Audit Log Report',
    summary: {
      'Total Events': logs.length,
      'Date Range': `${startDate} to ${endDate}`,
      'Unique Users': new Set(logs.map(l => l.user_id)).size,
    },
    sections: [
      {
        title: 'Audit Events',
        type: 'table',
        data: logs.map(l => ({
          Timestamp: new Date(l.created_at).toLocaleString(),
          User: l.user_email,
          Role: l.user_role,
          Action: l.action,
          Resource: l.resource_type,
          Status: l.status,
        })),
      },
    ],
  };
}

// Generate PDF from report data
async function generatePDF(
  reportData: ReportData,
  reportType: string,
  startDate: string,
  endDate: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  let yPosition = height - 50;

  // Header
  page.drawText(reportData.title, {
    x: 50,
    y: yPosition,
    size: 24,
    font: timesRomanBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;

  page.drawText(`Period: ${startDate} to ${endDate}`, {
    x: 50,
    y: yPosition,
    size: 12,
    font: timesRomanFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  yPosition -= 10;

  page.drawText(`Generated: ${new Date().toLocaleString()}`, {
    x: 50,
    y: yPosition,
    size: 12,
    font: timesRomanFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  yPosition -= 40;

  // Summary section
  if (reportData.summary) {
    page.drawText('Summary', {
      x: 50,
      y: yPosition,
      size: 16,
      font: timesRomanBold,
    });
    yPosition -= 25;

    for (const [key, value] of Object.entries(reportData.summary)) {
      page.drawText(`${key}: ${value}`, {
        x: 70,
        y: yPosition,
        size: 12,
        font: timesRomanFont,
      });
      yPosition -= 20;

      if (yPosition < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 50;
      }
    }
    yPosition -= 20;
  }

  // Sections
  for (const section of reportData.sections) {
    if (yPosition < 100) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = height - 50;
    }

    page.drawText(section.title, {
      x: 50,
      y: yPosition,
      size: 14,
      font: timesRomanBold,
    });
    yPosition -= 25;

    // Simple table rendering (limited to fit in PDF)
    if (section.type === 'table' && Array.isArray(section.data)) {
      const maxRows = Math.min(section.data.length, 20); // Limit rows per page
      for (let i = 0; i < maxRows; i++) {
        const row = section.data[i];
        const rowText = Object.values(row).join(' | ');

        if (yPosition < 50) {
          page = pdfDoc.addPage([595.28, 841.89]);
          yPosition = height - 50;
        }

        page.drawText(rowText.substring(0, 80), {
          x: 70,
          y: yPosition,
          size: 10,
          font: timesRomanFont,
        });
        yPosition -= 15;
      }

      if (section.data.length > maxRows) {
        page.drawText(`... and ${section.data.length - maxRows} more rows`, {
          x: 70,
          y: yPosition,
          size: 10,
          font: timesRomanFont,
          color: rgb(0.5, 0.5, 0.5),
        });
        yPosition -= 20;
      }
    }
  }

  // Footer
  const pages = pdfDoc.getPages();
  pages.forEach((p, i) => {
    p.drawText(`Page ${i + 1} of ${pages.length}`, {
      x: width / 2 - 30,
      y: 30,
      size: 10,
      font: timesRomanFont,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  return await pdfDoc.save();
}
