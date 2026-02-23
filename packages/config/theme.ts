/**
 * Theme Configuration
 *
 * WHITE-LABEL SETUP:
 * Update these colors to match the dispensary's brand.
 * All three apps will use these colors.
 */

export interface ThemeColors {
  // Primary brand color
  primary: string;
  primaryHover: string;
  primaryLight: string;

  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;

  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;

  // Border colors
  border: string;
  borderLight: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Overlay
  overlay: string;
}

/**
 * CURRENT THEME CONFIGURATION
 *
 * Hazy Moose: Forest green theme with dark backgrounds
 */
export const COLORS: ThemeColors = {
  // Primary - Forest Green
  primary: "#4E8C71",
  primaryHover: "#3D7A5D",
  primaryLight: "rgba(78, 140, 113, 0.1)",

  // Backgrounds - Dark forest theme
  background: "#1A2421",
  backgroundSecondary: "#232C33",
  backgroundTertiary: "#2D3748",

  // Text
  text: "#FFFFFF",
  textSecondary: "#A0AEC0",
  textMuted: "#718096",

  // Borders
  border: "#2D3748",
  borderLight: "#4A5568",

  // Status
  success: "#48BB78",
  warning: "#ECC94B",
  error: "#F56565",
  info: "#4299E1",

  // Overlay
  overlay: "rgba(26, 36, 33, 0.85)",
};

/**
 * CSS Custom Properties
 * Use these in your stylesheets or Tailwind config
 */
export const CSS_VARIABLES = `
  :root {
    --color-primary: ${COLORS.primary};
    --color-primary-hover: ${COLORS.primaryHover};
    --color-primary-light: ${COLORS.primaryLight};

    --color-background: ${COLORS.background};
    --color-background-secondary: ${COLORS.backgroundSecondary};
    --color-background-tertiary: ${COLORS.backgroundTertiary};

    --color-text: ${COLORS.text};
    --color-text-secondary: ${COLORS.textSecondary};
    --color-text-muted: ${COLORS.textMuted};

    --color-border: ${COLORS.border};
    --color-border-light: ${COLORS.borderLight};

    --color-success: ${COLORS.success};
    --color-warning: ${COLORS.warning};
    --color-error: ${COLORS.error};
    --color-info: ${COLORS.info};

    --color-overlay: ${COLORS.overlay};
  }
`;

/**
 * Tailwind CSS color extension
 * Add this to your tailwind.config.js
 */
export const TAILWIND_COLORS = {
  brand: {
    DEFAULT: COLORS.primary,
    hover: COLORS.primaryHover,
    light: COLORS.primaryLight,
  },
  background: {
    DEFAULT: COLORS.background,
    secondary: COLORS.backgroundSecondary,
    tertiary: COLORS.backgroundTertiary,
  },
};

/**
 * Chakra UI theme extension
 * Use this in the admin dashboard
 */
export const CHAKRA_COLORS = {
  brand: {
    50: "#E6F4ED",
    100: "#C1E3D3",
    200: "#98D1B6",
    300: "#6EBF99",
    400: "#4E8C71", // primary
    500: "#4E8C71",
    600: "#3D7A5D",
    700: "#2D5A45",
    800: "#1D3B2D",
    900: "#0D1C15",
  },
};
