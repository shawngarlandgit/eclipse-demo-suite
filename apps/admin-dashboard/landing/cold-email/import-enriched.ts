/**
 * Import enriched prospects from Google Sheets CSV into Convex
 */

import * as fs from 'fs';
import * as path from 'path';

// Read the enriched CSV
const csvPath = '/Users/shawngarland/Downloads/Maine Dispensary Outreach - CannaConnectDispensary Name_License Number_Email Address_Phone_Website_Contact Method_City_Status_Notes - Sheet1.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV (no header row based on the data)
const lines = csvContent.split('\n');
const prospects: any[] = [];
const seenLicenses = new Set<string>();

for (const line of lines) {
  if (!line.trim()) continue;

  // Parse CSV with potential commas in quoted fields
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  const [
    dispensaryName,
    licenseNumber,
    email,
    phone,
    website,
    contactMethod,
    city,
    status,
    notes
  ] = values;

  // Skip if no dispensary name
  if (!dispensaryName) continue;

  // Get primary license (first one if multiple)
  const primaryLicense = licenseNumber?.split('/')[0]?.trim();

  // Skip duplicates by license
  if (primaryLicense && seenLicenses.has(primaryLicense)) {
    console.log(`Skipping duplicate: ${dispensaryName} (${primaryLicense})`);
    continue;
  }
  if (primaryLicense) seenLicenses.add(primaryLicense);

  // Map to Convex schema
  prospects.push({
    dispensaryName: dispensaryName.trim(),
    licenseNumber: primaryLicense || undefined,
    email: email || undefined,
    phone: phone || undefined,
    website: website || undefined,
    city: city || undefined,
    source: 'google_sheets_enriched',
    tags: status === 'Ready to Contact' ? ['enriched', 'ready'] : ['enriched', 'pending_research'],
    notes: notes || undefined,
  });
}

// Separate by readiness
const readyToContact = prospects.filter(p => p.email && p.tags.includes('ready'));
const needsResearch = prospects.filter(p => !p.email || !p.tags.includes('ready'));

// Output
const output = {
  prospects,
  summary: {
    total: prospects.length,
    readyToContact: readyToContact.length,
    needsResearch: needsResearch.length,
    withEmail: prospects.filter(p => p.email).length,
    withPhone: prospects.filter(p => p.phone).length,
    withWebsite: prospects.filter(p => p.website).length,
  }
};

console.log('\n=== IMPORT SUMMARY ===');
console.log(`Total unique prospects: ${output.summary.total}`);
console.log(`Ready to contact (have email): ${output.summary.readyToContact}`);
console.log(`Needs research: ${output.summary.needsResearch}`);
console.log(`With phone: ${output.summary.withPhone}`);
console.log(`With website: ${output.summary.withWebsite}`);

// Write JSON for Convex import
const outputPath = '/Users/shawngarland/cannabis-admin-dashboard/landing/cold-email/prospects-enriched.json';
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log('\n✅ Wrote prospects-enriched.json');
console.log('\nReady to contact:');
readyToContact.forEach(p => {
  console.log(`  - ${p.dispensaryName} (${p.email})`);
});
