/**
 * Strain Import Script
 * Imports strains from budtender-mvp unified-strains.json into the unified schema
 *
 * Run: node scripts/import-strains.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Effect mapping from text to enum values
const EFFECT_MAP = {
  // Positive effects -> effect_type enum
  relaxed: 'relaxation',
  relaxation: 'relaxation',
  calm: 'relaxation',
  happy: 'relaxation', // Maps to closest
  euphoric: 'energy', // Euphoria is energizing
  energetic: 'energy',
  energy: 'energy',
  uplifted: 'energy',
  focused: 'focus',
  focus: 'focus',
  alert: 'focus',
  creative: 'creativity',
  creativity: 'creativity',
  inspired: 'creativity',
  hungry: 'appetite',
  appetite: 'appetite',
  munchies: 'appetite',
  sleepy: 'sleep',
  sleep: 'sleep',
  drowsy: 'sleep',
  sedated: 'sleep',
  // Medical mappings
  pain: 'pain_relief',
  'pain relief': 'pain_relief',
  analgesic: 'pain_relief',
  anxiety: 'anxiety_relief',
  'anxiety relief': 'anxiety_relief',
  stress: 'anxiety_relief',
  'stress relief': 'anxiety_relief',
};

// Valid effect_type enum values
const VALID_EFFECTS = [
  'relaxation',
  'pain_relief',
  'anxiety_relief',
  'energy',
  'focus',
  'creativity',
  'appetite',
  'sleep',
];

function mapEffects(effects) {
  if (!Array.isArray(effects)) return [];

  const mapped = effects
    .map((e) => {
      const normalized = String(e).toLowerCase().trim();
      return EFFECT_MAP[normalized] || null;
    })
    .filter((e) => e && VALID_EFFECTS.includes(e));

  // Remove duplicates
  return [...new Set(mapped)];
}

function normalizeStrainType(type) {
  if (!type) return 'hybrid';
  const normalized = String(type).toLowerCase().trim();
  if (['indica', 'sativa', 'hybrid', 'cbd'].includes(normalized)) {
    return normalized;
  }
  // Map variations
  if (normalized.includes('indica')) return 'indica';
  if (normalized.includes('sativa')) return 'sativa';
  return 'hybrid';
}

function createSlug(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function transformStrain(strain) {
  // Map positive effects to primary/secondary
  const primaryEffects = mapEffects(strain.positive_effects?.slice(0, 3) || []);
  const secondaryEffects = mapEffects(strain.positive_effects?.slice(3) || []);

  // Map negative effects
  const negativeEffects = strain.negative_effects || [];

  // Map medical uses
  const medicalEffects = mapEffects(strain.medical_uses || []);

  // Combine primary effects with medical uses
  const allPrimary = [...new Set([...primaryEffects, ...medicalEffects])];

  return {
    name: strain.name?.replace(/-/g, ' ').trim() || 'Unknown',
    slug: strain.slug || createSlug(strain.name),
    strain_type: normalizeStrainType(strain.strain_type),

    // Cannabinoids (often missing in scraped data)
    thc_min: strain.thc_min || null,
    thc_max: strain.thc_max || null,
    cbd_min: strain.cbd_min || null,
    cbd_max: strain.cbd_max || null,
    cbg_percentage: null,
    cbn_percentage: null,

    // Terpenes
    primary_terpene: strain.terpenes?.[0] || null,
    secondary_terpene: strain.terpenes?.[1] || null,
    tertiary_terpene: strain.terpenes?.[2] || null,
    terpene_profile: strain.terpene_profile || null,

    // Effects
    primary_effects: allPrimary.slice(0, 4),
    secondary_effects: secondaryEffects.slice(0, 4),
    negative_effects: negativeEffects.slice(0, 5),
    flavors: (strain.flavors || []).slice(0, 10),

    // Medical
    medical_uses: (strain.medical_uses || []).slice(0, 10),

    // Metadata
    description: strain.description || null,
    lineage: strain.genetics || null,
    breeder: null,
    image_url: strain.image_url || null,

    // Tracking
    is_verified: strain.lab_tested || false,
    popularity_score: Math.min(100, Math.round((strain.palatability_score || 0) * 20)),
    recommendation_count: 0,
    purchase_count: 0,
  };
}

async function importStrains() {
  // Load environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
    console.log('Set these environment variables and run again:');
    console.log('  export SUPABASE_URL="your-project-url"');
    console.log('  export SUPABASE_SERVICE_KEY="your-service-key"');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Load strain data
  const strainsPath = path.join(__dirname, '../../budtender-mvp/data/unified-strains.json');

  if (!fs.existsSync(strainsPath)) {
    console.error(`Strain data not found at: ${strainsPath}`);
    process.exit(1);
  }

  console.log(`Loading strains from: ${strainsPath}`);
  const rawStrains = JSON.parse(fs.readFileSync(strainsPath, 'utf-8'));
  console.log(`Loaded ${rawStrains.length} strains`);

  // Transform strains
  const strains = rawStrains.map(transformStrain);

  // Deduplicate by slug
  const uniqueStrains = new Map();
  for (const strain of strains) {
    if (!uniqueStrains.has(strain.slug)) {
      uniqueStrains.set(strain.slug, strain);
    }
  }

  const finalStrains = Array.from(uniqueStrains.values());
  console.log(`After deduplication: ${finalStrains.length} unique strains`);

  // Import in batches
  const BATCH_SIZE = 100;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < finalStrains.length; i += BATCH_SIZE) {
    const batch = finalStrains.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase.from('strains').upsert(batch, {
      onConflict: 'slug',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      errors += batch.length;
    } else {
      imported += batch.length;
    }

    // Progress
    const progress = Math.round(((i + batch.length) / finalStrains.length) * 100);
    process.stdout.write(`\rProgress: ${progress}% (${imported} imported, ${errors} errors)`);
  }

  console.log(`\n\nImport complete!`);
  console.log(`  Total processed: ${finalStrains.length}`);
  console.log(`  Successfully imported: ${imported}`);
  console.log(`  Errors: ${errors}`);
}

// Run
importStrains().catch(console.error);
