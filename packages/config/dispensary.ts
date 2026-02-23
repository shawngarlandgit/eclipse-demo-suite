/**
 * Dispensary Configuration
 *
 * WHITE-LABEL SETUP:
 * To customize for a new dispensary, update the values below.
 * This single file controls branding across all three apps.
 */

export interface DispensaryConfig {
  // Basic Info
  name: string;
  tagline: string;
  legalName: string;
  licenseNumber: string;

  // Contact
  phone: string;
  email: string;
  website: string;

  // Location
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Branding
  logo: string;
  logoLight?: string;  // For dark backgrounds
  favicon: string;

  // Features enabled
  features: {
    delivery: boolean;
    pickup: boolean;
    loyalty: boolean;
    ageGate: boolean;
    medicalOnly: boolean;
    recreationalAllowed: boolean;
  };

  // Delivery settings
  delivery: {
    minOrder: number;
    fee: number;
    freeDeliveryMin: number;
    radiusMiles: number;
    estimatedMinutes: {
      min: number;
      max: number;
    };
  };

  // Tax rate
  taxRate: number;

  // Social media
  social?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };

  // Hours of operation
  hours: {
    [key: string]: { open: string; close: string } | 'closed';
  };
}

/**
 * CURRENT DISPENSARY CONFIGURATION
 *
 * Change these values to white-label for a different dispensary.
 */
export const DISPENSARY: DispensaryConfig = {
  // Basic Info
  name: "Hazy Moose",
  tagline: "Craft Cannabis, Delivered",
  legalName: "Hazy Moose Cannabis Co., LLC",
  licenseNumber: "OR-REC-12345",

  // Contact
  phone: "(503) 555-MOOSE",
  email: "hello@hazymoose.com",
  website: "https://hazymoose.com",

  // Location
  address: {
    street: "420 Forest Lane",
    city: "Portland",
    state: "OR",
    zip: "97201"
  },
  coordinates: {
    lat: 45.5152,
    lng: -122.6784
  },

  // Branding
  logo: "/assets/logo.svg",
  logoLight: "/assets/logo-light.svg",
  favicon: "/favicon.ico",

  // Features
  features: {
    delivery: true,
    pickup: true,
    loyalty: true,
    ageGate: true,
    medicalOnly: false,
    recreationalAllowed: true,
  },

  // Delivery
  delivery: {
    minOrder: 25,
    fee: 5,
    freeDeliveryMin: 75,
    radiusMiles: 10,
    estimatedMinutes: {
      min: 30,
      max: 60,
    },
  },

  // Tax
  taxRate: 0.20, // 20% Oregon cannabis tax

  // Social
  social: {
    instagram: "hazymoose",
    facebook: "hazymoosecannabis",
  },

  // Hours
  hours: {
    monday: { open: "10:00", close: "21:00" },
    tuesday: { open: "10:00", close: "21:00" },
    wednesday: { open: "10:00", close: "21:00" },
    thursday: { open: "10:00", close: "21:00" },
    friday: { open: "10:00", close: "22:00" },
    saturday: { open: "10:00", close: "22:00" },
    sunday: { open: "11:00", close: "19:00" },
  },
};

// Helper functions
export function getDispensaryName(): string {
  return DISPENSARY.name;
}

export function isDeliveryEnabled(): boolean {
  return DISPENSARY.features.delivery;
}

export function isPickupEnabled(): boolean {
  return DISPENSARY.features.pickup;
}

export function getDeliveryFee(subtotal: number): number {
  if (subtotal >= DISPENSARY.delivery.freeDeliveryMin) {
    return 0;
  }
  return DISPENSARY.delivery.fee;
}

export function calculateTax(subtotal: number): number {
  return subtotal * DISPENSARY.taxRate;
}

export function isOpen(date: Date = new Date()): boolean {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[date.getDay()];
  const hours = DISPENSARY.hours[dayName];

  if (hours === 'closed') return false;

  const now = date.getHours() * 60 + date.getMinutes();
  const [openHour, openMin] = hours.open.split(':').map(Number);
  const [closeHour, closeMin] = hours.close.split(':').map(Number);

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return now >= openTime && now < closeTime;
}
