/**
 * OCP Violations Scraper
 * Scrapes compliance violation data from Maine OCP website and syncs to Convex
 *
 * Run: node scripts/scrape-ocp-violations.js
 *
 * Prerequisites:
 *   npm install cheerio convex
 */

import * as cheerio from 'cheerio';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

// Convex deployment URL
const CONVEX_URL = 'https://fiery-cheetah-41.convex.cloud';

// OCP Compliance Data URL
const OCP_BASE_URL = 'https://www.maine.gov/dafs/ocp/open-data/medical-use/compliance-data';
const OCP_DOCUMENT_BASE = 'https://www.maine.gov/dafs/ocp/sites/maine.gov.dafs.ocp/files/inline-files/';

/**
 * Extract last name from full name
 * "Deena E. Burgess" -> "Burgess"
 * "John Smith Jr." -> "Smith" (handles suffixes)
 */
function extractLastName(fullName) {
  if (!fullName) return '';

  // Remove common suffixes
  const cleaned = fullName
    .replace(/\s+(Jr\.?|Sr\.?|II|III|IV)$/i, '')
    .trim();

  const parts = cleaned.split(/\s+/);
  return parts[parts.length - 1];
}

/**
 * Construct document URL based on document type
 * Settlement: "{RegNumber}, {LastName} - Settlement.pdf"
 * Suspension: "{LastName}, {RegNumber}_Redacted.pdf"
 */
function constructDocumentUrl(registrationNumber, registrantName, documentType) {
  const lastName = extractLastName(registrantName);

  if (!lastName || !registrationNumber) {
    return null;
  }

  let filename;
  if (documentType.toLowerCase().includes('settlement')) {
    // Pattern: CGR26995, Dunham - Settlement.pdf
    filename = `${registrationNumber}%2C%20${lastName}%20-%20Settlement.pdf`;
  } else {
    // Pattern: Brynes, CGE2389_Redacted.pdf (Suspension)
    filename = `${lastName}%2C%20${registrationNumber}_Redacted.pdf`;
  }

  return OCP_DOCUMENT_BASE + filename;
}

/**
 * Parse a single violations table from HTML
 */
function parseViolationsTable($, table) {
  const violations = [];

  $(table).find('tbody tr').each((_, row) => {
    const cells = $(row).find('td');

    if (cells.length >= 5) {
      const date = $(cells[0]).text().trim();
      const registrant = $(cells[1]).text().trim();
      const registrationNumber = $(cells[2]).text().trim();
      const action = $(cells[3]).text().trim();
      const settledFineAmount = $(cells[4]).text().trim();

      // Get document info from link if present
      let documentType = 'Unknown';
      let documentUrl = null;

      const link = $(cells[5]).find('a');
      if (link.length > 0) {
        documentType = link.text().trim() || 'Document';
        documentUrl = link.attr('href');

        // If no href, try to construct it
        if (!documentUrl) {
          documentUrl = constructDocumentUrl(registrationNumber, registrant, documentType);
        }

        // Make relative URLs absolute
        if (documentUrl && !documentUrl.startsWith('http')) {
          documentUrl = 'https://www.maine.gov' + documentUrl;
        }
      } else {
        // No link found, try to construct based on action type
        if (action.toLowerCase().includes('suspend')) {
          documentType = 'Suspension';
        } else if (action.toLowerCase().includes('fine') || action.toLowerCase().includes('settle')) {
          documentType = 'Settlement Agreement';
        }
        documentUrl = constructDocumentUrl(registrationNumber, registrant, documentType);
      }

      if (date && registrationNumber) {
        violations.push({
          date,
          registrant,
          registrationNumber,
          action,
          settledFineAmount: settledFineAmount || 'N/A',
          documentType,
          documentUrl,
        });
      }
    }
  });

  return violations;
}

/**
 * Fetch and parse a page of violations
 */
async function fetchViolationsPage(url) {
  console.log(`Fetching: ${url}`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Find all tables that look like violation tables
  const tables = $('table');
  let allViolations = [];

  tables.each((_, table) => {
    const violations = parseViolationsTable($, table);
    if (violations.length > 0) {
      allViolations = allViolations.concat(violations);
    }
  });

  // Find pagination links for additional pages
  const paginationLinks = [];
  $('a').each((_, link) => {
    const href = $(link).attr('href');
    if (href && href.includes('page=')) {
      const fullUrl = href.startsWith('http') ? href : `https://www.maine.gov${href}`;
      if (!paginationLinks.includes(fullUrl)) {
        paginationLinks.push(fullUrl);
      }
    }
  });

  return { violations: allViolations, paginationLinks };
}

/**
 * Scrape all violation pages
 */
async function scrapeAllViolations() {
  const allViolations = [];
  const visitedUrls = new Set();
  const urlsToVisit = [OCP_BASE_URL];

  while (urlsToVisit.length > 0) {
    const url = urlsToVisit.shift();

    if (visitedUrls.has(url)) continue;
    visitedUrls.add(url);

    try {
      const { violations, paginationLinks } = await fetchViolationsPage(url);
      console.log(`  Found ${violations.length} violations on this page`);

      allViolations.push(...violations);

      // Add new pagination links to queue
      for (const link of paginationLinks) {
        if (!visitedUrls.has(link)) {
          urlsToVisit.push(link);
        }
      }
    } catch (error) {
      console.error(`  Error fetching ${url}:`, error.message);
    }

    // Small delay between requests to be polite
    if (urlsToVisit.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Deduplicate by registration number + date
  const seen = new Set();
  const uniqueViolations = allViolations.filter(v => {
    const key = `${v.registrationNumber}-${v.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return uniqueViolations;
}

/**
 * Sync violations to Convex using npx convex run
 */
async function syncToConvex(violations) {
  console.log(`\nSyncing ${violations.length} violations to Convex...`);

  // Batch violations in groups of 50 to avoid payload size issues
  const BATCH_SIZE = 50;
  let totalSynced = 0;
  let totalSkipped = 0;
  let allErrors = [];

  for (let i = 0; i < violations.length; i += BATCH_SIZE) {
    const batch = violations.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(violations.length / BATCH_SIZE);

    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} violations)...`);

    // Use npx convex run to call the internal function
    const { execSync } = await import('child_process');

    const args = JSON.stringify({
      violations: batch,
      programType: 'medical',
    });

    try {
      const result = execSync(
        `npx convex run maineDataInternal:syncViolations '${args.replace(/'/g, "'\\''")}'`,
        {
          encoding: 'utf-8',
          cwd: '/Users/shawngarland/cannabis-admin-dashboard',
          timeout: 60000,
        }
      );

      // Parse result
      const parsed = JSON.parse(result);
      totalSynced += parsed.synced || 0;
      totalSkipped += parsed.skipped || 0;
      if (parsed.errors && parsed.errors.length > 0) {
        allErrors.push(...parsed.errors);
      }

      console.log(`    ✓ ${parsed.synced} synced, ${parsed.skipped} skipped`);
    } catch (error) {
      console.error(`    ✗ Batch failed:`, error.message);
      allErrors.push(`Batch ${batchNum} failed: ${error.message}`);
    }
  }

  return { synced: totalSynced, skipped: totalSkipped, errors: allErrors };
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Maine OCP Violations Scraper');
  console.log('='.repeat(60));
  console.log();

  try {
    // Scrape violations
    console.log('Step 1: Scraping OCP Compliance Data...\n');
    const violations = await scrapeAllViolations();

    console.log(`\nTotal unique violations found: ${violations.length}`);

    if (violations.length === 0) {
      console.log('\nNo violations found. The page structure may have changed.');
      console.log('Please check the OCP website manually.');
      process.exit(1);
    }

    // Show sample
    console.log('\nSample violation:');
    console.log(JSON.stringify(violations[0], null, 2));

    // Summary by action type
    const actionCounts = {};
    for (const v of violations) {
      const action = v.action || 'Unknown';
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    }
    console.log('\nViolations by action:');
    for (const [action, count] of Object.entries(actionCounts)) {
      console.log(`  ${action}: ${count}`);
    }

    // Sync to Convex
    console.log('\nStep 2: Syncing to Convex...\n');
    const result = await syncToConvex(violations);

    console.log('\n' + '='.repeat(60));
    console.log('Sync complete!');
    console.log(`  Total synced: ${result.synced}`);
    console.log(`  Total skipped (duplicates): ${result.skipped}`);
    console.log(`  Errors: ${result.errors.length}`);
    if (result.errors.length > 0) {
      console.log('\nFirst 5 errors:');
      result.errors.slice(0, 5).forEach(e => console.log(`  - ${e}`));
    }

  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

// Run
main();
