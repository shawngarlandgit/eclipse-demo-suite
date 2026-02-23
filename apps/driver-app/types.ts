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
  priceRange: { min: number; max: number };
  notifications: boolean;
}

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
