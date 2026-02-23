import { supabase } from '../supabase/client';
import { log } from '../../utils/logger';

/**
 * Strains Service
 * Fetches strain data from Supabase including images
 */

export interface Strain {
  id?: string;
  name: string;
  slug: string;
  strain_type: 'indica' | 'sativa' | 'hybrid';
  description: string | null;
  image_url: string | null;
  thc_min: number | null;
  thc_max: number | null;
  cbd_min: number | null;
  cbd_max: number | null;
  effects: string[];
  flavors: string[];
  medical_uses: string[];
  source?: string;
  created_at?: string;
}

/**
 * Fetch strains from Supabase
 */
export async function getStrains(limit: number = 50): Promise<Strain[]> {
  try {
    const { data, error } = await supabase
      .from('strains')
      .select('*')
      .limit(limit);

    if (error) {
      log.error('Error fetching strains from Supabase', error, 'StrainsService');
      return [];
    }

    return data || [];
  } catch (error) {
    log.error('Error in getStrains', error, 'StrainsService');
    return [];
  }
}

/**
 * Fetch a single strain by slug
 */
export async function getStrainBySlug(slug: string): Promise<Strain | null> {
  try {
    const { data, error } = await supabase
      .from('strains')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      log.error('Error fetching strain by slug', error, 'StrainsService');
      return null;
    }

    return data;
  } catch (error) {
    log.error('Error in getStrainBySlug', error, 'StrainsService');
    return null;
  }
}

/**
 * Get strain image URL from Supabase storage
 * Falls back to a placeholder if no image exists
 */
export function getStrainImageUrl(slug: string): string {
  // Try multiple possible image formats
  const baseUrl = 'https://pxvsjlrpjpxxovbpfpxo.supabase.co/storage/v1/object/public';

  // Common patterns for strain images
  const possiblePaths = [
    `${baseUrl}/strain-images/${slug}.webp`,
    `${baseUrl}/strain-images/${slug}.jpg`,
    `${baseUrl}/strain-images/${slug}.png`,
    `${baseUrl}/strains/${slug}.webp`,
    `${baseUrl}/strains/${slug}.jpg`,
  ];

  // Return first path - we'll handle errors in the component
  return possiblePaths[0];
}

export const strainsService = {
  getStrains,
  getStrainBySlug,
  getStrainImageUrl,
};

export default strainsService;
