export interface LabTestResults {
  testedDate?: string;
  labName?: string;
  batchNumber?: string;
  thcPercentage: number;
  cbdPercentage?: number;
  totalCannabinoids?: number;
  terpenes?: {
    name: string;
    percentage: number;
  }[];
  totalTerpenes?: number;
  passed?: boolean;
  contaminants?: {
    pesticides: boolean;
    heavyMetals: boolean;
    microbials: boolean;
    residualSolvents: boolean;
  };
}

export interface Product {
  _id: string;
  name: string;
  category: string; // 'Flower', 'Edibles', 'Vapes', etc.
  imageUrl?: string;
  strainType: string;
  thcContent: number;
  price: number;
  stockLevel: string; // 'High', 'Medium', 'Low', 'Out'
  description?: string;
  effects?: string[]; // e.g., ['sleepy', 'relaxed']
  // Lab testing data from OCP
  labResults?: LabTestResults;
  genetics?: string; // Parent strains
  grower?: string; // Cultivator/Brand
  // Enhanced strain info
  strainInfo?: {
    flavorProfile?: string[];
    aromas?: string[];
    medicalUses?: string[];
    bestTimeOfUse?: string;
    onset?: string;
    duration?: string;
    parentage?: string;
    breeder?: string;
  };
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  pickupTime: string;
  status: 'pending' | 'confirmed' | 'ready' | 'completed';
  timestamp: number;
}

export interface PatientReview {
  _id: string;
  productId: string;
  userId: string;
  rating: number;
  effects: string[];
  comment?: string;
  timestamp: number;
  productName?: string; // Helper for UI
}

export interface EffectOption {
  id: string;
  label: string;
}

export interface UserPreferences {
  effects: string[];
  productTypes: string[];
  priceRange: { min: number; max: number };
  notifications: boolean;
}

export const PRODUCT_CATEGORIES = [
  { id: 'Flower', label: 'Flower' },
  { id: 'Pre-rolls', label: 'Pre-rolls' },
  { id: 'Edibles', label: 'Edibles' },
  { id: 'Vapes', label: 'Vapes' },
  { id: 'Concentrates', label: 'Concentrates' },
];

export const AVAILABLE_EFFECTS: EffectOption[] = [
  { id: 'euphoric', label: 'Euphoric' },
  { id: 'sleepy', label: 'Sleepy' },
  { id: 'focused', label: 'Focused' },
  { id: 'relaxed', label: 'Relaxed' },
  { id: 'creative', label: 'Creative' },
  { id: 'energetic', label: 'Energetic' },
  { id: 'pain-relief', label: 'Pain Relief' },
  { id: 'happy', label: 'Happy' }
];
