// Centralized color definitions for exposure levels
// Update these values to change colors across the entire application

// Primary brand colors
export const PRIMARY_TEAL = '#9CBB04';
export const PRIMARY_NAVY = '#404B69';
export const BACKGROUND_COLOR = '#F7F7F7';

export const EXPOSURE_COLORS = {
  lowExposure: '#9CBB04', // Standard site green
  monitorOnly: '#f5c236', // Yellow
  payAttention: '#db2c1d', // Red
  notDetected: '#9ca3af', // gray-400
} as const;

// Tailwind class helpers for exposure colors
export const EXPOSURE_COLOR_CLASSES = {
  lowExposure: {
    text: 'text-[#9CBB04]',
    bg: 'bg-[#9CBB04]',
    border: 'border-[#9CBB04]',
    bgLight: 'bg-[#9CBB04]/10',
    borderLight: 'border-[#9CBB04]/30',
    borderMedium: 'border-[#9CBB04]/50',
  },
  monitorOnly: {
    text: 'text-[#f5c236]',
    bg: 'bg-[#f5c236]',
    border: 'border-[#f5c236]',
    bgLight: 'bg-[#f5c236]/10',
    borderLight: 'border-[#f5c236]/30',
    borderMedium: 'border-[#f5c236]/50',
  },
  payAttention: {
    text: 'text-[#db2c1d]',
    bg: 'bg-[#db2c1d]',
    border: 'border-[#db2c1d]',
    bgLight: 'bg-[#db2c1d]/10',
    borderLight: 'border-[#db2c1d]/30',
    borderMedium: 'border-[#db2c1d]/50',
  },
  notDetected: {
    text: 'text-gray-500',
    bg: 'bg-gray-400',
    border: 'border-gray-300',
    bgLight: 'bg-gray-50',
    borderLight: 'border-gray-200',
    borderMedium: 'border-gray-300',
  },
} as const;

