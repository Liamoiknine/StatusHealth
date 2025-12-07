// Centralized color definitions for exposure levels
// Update these values to change colors across the entire application

export const EXPOSURE_COLORS = {
  lowExposure: '#4ec99a', // Soft teal-green (darker, less light)
  monitorOnly: '#0f766e', // Dark teal (was pay attention)
  payAttention: '#C97C00', // Orange
  notDetected: '#9ca3af', // gray-400
} as const;

// Tailwind class helpers for exposure colors
export const EXPOSURE_COLOR_CLASSES = {
  lowExposure: {
    text: 'text-[#4ec99a]',
    bg: 'bg-[#4ec99a]',
    border: 'border-[#4ec99a]',
    bgLight: 'bg-[#4ec99a]/10',
    borderLight: 'border-[#4ec99a]/30',
    borderMedium: 'border-[#4ec99a]/50',
  },
  monitorOnly: {
    text: 'text-[#0f766e]',
    bg: 'bg-[#0f766e]',
    border: 'border-[#0f766e]',
    bgLight: 'bg-[#0f766e]/10',
    borderLight: 'border-[#0f766e]/30',
    borderMedium: 'border-[#0f766e]/50',
  },
  payAttention: {
    text: 'text-[#C97C00]',
    bg: 'bg-[#C97C00]',
    border: 'border-[#C97C00]',
    bgLight: 'bg-[#C97C00]/10',
    borderLight: 'border-[#C97C00]/30',
    borderMedium: 'border-[#C97C00]/50',
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

