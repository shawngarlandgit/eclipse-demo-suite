/**
 * Import prospects from CSV into Convex
 *
 * Usage:
 *   cd /Users/shawngarland/cannabis-admin-dashboard
 *   npx convex run coldEmail:importProspects --args '{"prospects": [...]}'
 *
 * Or use the dashboard to manually insert.
 */

import * as fs from 'fs';
import * as path from 'path';

// Read the cleaned CSV
const csvPath = path.join(__dirname, 'prospects-cleaned.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvContent.split('\n');
const headers = lines[0].split(',');

const prospects = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const values = line.split(',');
  const prospect: any = {};

  headers.forEach((header, index) => {
    const key = header.trim();
    const value = values[index]?.trim();
    if (value) {
      prospect[key] = value;
    }
  });

  // Map to Convex schema
  prospects.push({
    dispensaryName: prospect.dispensary_name,
    licenseNumber: prospect.license_number,
    licenseExpiration: prospect.license_expiration,
    firstName: prospect.first_name || undefined,
    lastName: prospect.last_name || undefined,
    email: prospect.email || undefined,
    phone: prospect.phone || undefined,
    city: prospect.city || undefined,
    website: prospect.website || undefined,
    source: 'maine_ocp',
    tags: ['pilot_candidate'],
  });
}

// Output as JSON for Convex import
const output = {
  prospects,
  count: prospects.length,
};

console.log(JSON.stringify(output, null, 2));

// Also write to file for easy copy/paste
fs.writeFileSync(
  path.join(__dirname, 'prospects-for-convex.json'),
  JSON.stringify(output, null, 2)
);

console.log(`\n✅ Wrote ${prospects.length} prospects to prospects-for-convex.json`);
console.log('\nTo import into Convex:');
console.log('1. Go to https://dashboard.convex.dev/d/fiery-cheetah-41');
console.log('2. Click "Functions" → "coldEmail:importProspects"');
console.log('3. Paste the prospects array from prospects-for-convex.json');
