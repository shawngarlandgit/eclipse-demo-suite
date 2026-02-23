import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Cannabis Flower/Leaf Icon (Vecteezy attribution required)
export const FlowerIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 2000 2000"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Cannabis leaf - adapted from Vecteezy */}
    <g fill="currentColor">
      {/* Center stem and top leaf */}
      <path d="M999.796875 1141.238281 C 999.796875 1141.238281 797.226562 782.789062 1015.878906 398.949219 L 1015.878906 522.671875 C 1015.878906 522.671875 879.253906 766.921875 999.796875 1141.238281" />
      {/* Right upper leaf */}
      <path d="M999.835938 1141.648438 C 999.835938 1141.648438 1144.808594 809.710938 1530.300781 760.558594 L 1443.308594 825.960938 C 1443.308594 825.960938 1199.320312 859.011719 999.835938 1141.648438" />
      {/* Right lower leaf */}
      <path d="M1000.179688 1141.699219 C 1000.179688 1141.699219 1039.71875 1321.171875 1226.761719 1383.519531 L 1189.878906 1342.421875 C 1189.878906 1342.421875 1071.691406 1301.988281 1000.179688 1141.699219" />
      {/* Left upper leaf */}
      <path d="M1000.160156 1141.648438 C 1000.160156 1141.648438 855.191406 809.710938 469.699219 760.558594 L 556.691406 825.960938 C 556.691406 825.960938 800.675781 859.011719 1000.160156 1141.648438" />
      {/* Left lower leaf */}
      <path d="M999.816406 1141.699219 C 999.816406 1141.699219 960.285156 1321.171875 773.242188 1383.519531 L 810.113281 1342.421875 C 810.113281 1342.421875 928.304688 1301.988281 999.816406 1141.699219" />
      {/* Stem details */}
      <path d="M1022.339844 588.171875 L 1019.988281 765.308594 C 1024.011719 766.941406 1026.851562 770.871094 1026.851562 775.480469 C 1026.851562 780.179688 1023.878906 784.191406 1019.71875 785.738281 L 1018.699219 862.601562 C 1023.390625 863.851562 1026.851562 868.109375 1026.851562 873.191406 C 1026.851562 878.378906 1023.25 882.710938 1018.421875 883.859375 L 1017.519531 951.238281 C 1022.800781 952.03125 1026.851562 956.570312 1026.851562 962.070312 C 1026.851562 967.671875 1022.660156 972.28125 1017.238281 972.949219 L 1015.878906 1075.011719 C 1173.199219 791.910156 1022.339844 588.171875 1022.339844 588.171875" />
      {/* Stem nodes */}
      <path d="M1015.878906 764.511719 C 1009.820312 764.511719 1004.910156 769.421875 1004.910156 775.480469 C 1004.910156 781.539062 1009.820312 786.449219 1015.878906 786.449219 C 1017.230469 786.449219 1018.519531 786.191406 1019.71875 785.738281 L 1019.988281 765.308594 C 1018.71875 764.789062 1017.339844 764.511719 1015.878906 764.511719" />
      <path d="M1015.878906 862.21875 C 1009.820312 862.21875 1004.910156 867.128906 1004.910156 873.191406 C 1004.910156 879.25 1009.820312 884.160156 1015.878906 884.160156 C 1016.761719 884.160156 1017.601562 884.050781 1018.421875 883.859375 L 1018.699219 862.601562 C 1017.800781 862.359375 1016.859375 862.21875 1015.878906 862.21875" />
      <path d="M1015.878906 951.101562 C 1009.820312 951.101562 1004.910156 956.011719 1004.910156 962.070312 C 1004.910156 968.128906 1009.820312 973.039062 1015.878906 973.039062 C 1016.339844 973.039062 1016.789062 973.011719 1017.238281 972.949219 L 1017.519531 951.238281 C 1016.988281 951.160156 1016.441406 951.101562 1015.878906 951.101562" />
    </g>
  </svg>
);

// Pre-roll/Joint Icon
export const PrerollIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Joint body */}
    <path
      d="M6 18L18 6"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Filter tip */}
    <path
      d="M4 20L6 18"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      opacity="0.7"
    />
    {/* Smoke wisps */}
    <path
      d="M19 5C19.5 4 20 3 19.5 2"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.5"
    />
    <path
      d="M20.5 4.5C21 3.5 21 2.5 20.5 1.5"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
);

// Edibles/Gummy Icon
export const EdibleIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Gummy bear shape */}
    <ellipse cx="12" cy="16" rx="5" ry="4" fill="currentColor" />
    {/* Head */}
    <circle cx="12" cy="9" r="4" fill="currentColor" />
    {/* Ears */}
    <circle cx="9" cy="6" r="1.5" fill="currentColor" />
    <circle cx="15" cy="6" r="1.5" fill="currentColor" />
    {/* Arms */}
    <ellipse cx="6.5" cy="14" rx="1.5" ry="2.5" fill="currentColor" opacity="0.9" />
    <ellipse cx="17.5" cy="14" rx="1.5" ry="2.5" fill="currentColor" opacity="0.9" />
    {/* Eyes */}
    <circle cx="10.5" cy="9" r="0.8" fill="currentColor" opacity="0.3" />
    <circle cx="13.5" cy="9" r="0.8" fill="currentColor" opacity="0.3" />
  </svg>
);

// Vape/Cartridge Icon
export const VapeIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Cartridge body */}
    <rect x="9" y="8" width="6" height="12" rx="1" fill="currentColor" />
    {/* Mouthpiece */}
    <rect x="10" y="4" width="4" height="4" rx="1" fill="currentColor" opacity="0.8" />
    {/* Window showing oil */}
    <rect x="10.5" y="10" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.4" />
    {/* Threading at bottom */}
    <rect x="10" y="20" width="4" height="2" rx="0.5" fill="currentColor" opacity="0.7" />
    {/* Vapor cloud */}
    <path
      d="M12 2C12.5 1.5 13 1 12.5 0.5"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
);

// Concentrates/Extract Icon (Diamond/Crystal shape)
export const ConcentrateIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Diamond shape */}
    <path
      d="M12 2L4 9L12 22L20 9L12 2Z"
      fill="currentColor"
      opacity="0.9"
    />
    {/* Top facets */}
    <path
      d="M12 2L4 9H20L12 2Z"
      fill="currentColor"
      opacity="0.7"
    />
    {/* Center line highlight */}
    <path
      d="M12 2V9L4 9M12 9L20 9M12 9V22"
      stroke="currentColor"
      strokeWidth="0.5"
      opacity="0.3"
    />
    {/* Shine */}
    <path
      d="M8 7L10 5"
      stroke="white"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
);

// Export all icons as a map for easy access
export const ProductCategoryIcons: Record<string, React.FC<IconProps>> = {
  'Flower': FlowerIcon,
  'Pre-rolls': PrerollIcon,
  'Edibles': EdibleIcon,
  'Vapes': VapeIcon,
  'Concentrates': ConcentrateIcon,
};
