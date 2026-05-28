import type { StatusAluguel } from '../types/order';

export const colors = {
  // Primary brand colors
  primary: '#4CAF50',
  primaryLight: '#81C784',
  primaryDark: '#388E3C',
  primaryGreen: '#4CAF50',
  primaryYellow: '#FFC107',

  // Secondary / accent
  secondary: '#FFC107',
  secondaryDark: '#FFA000',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',

  // Text
  textPrimary: '#333333',
  textSecondary: '#5F5F5F',
  textInverse: '#FFFFFF',
  textDisabled: '#B0B8C1',

  // Borders
  border: '#E5E7EB',
  borderFocused: '#4CAF50',

  // Feedback
  error: '#EF4444',
  errorLight: '#FEE2E2',
  danger: '#EF4444',
  success: '#4CAF50',
  successLight: '#DCFCE7',
  warning: '#FFC107',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Misc
  gray: '#5F5F5F',
  lightGreen: '#81C784',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  skeleton: '#E5E7EB',
} as const;

/**
 * Status color mapping for order statuses.
 * Each status maps to a distinct color for visual differentiation.
 * Validates: Requirements 8.4, 11.3 (Property 21)
 */
export const statusColors: Record<StatusAluguel, { background: string; text: string }> = {
  AGUARDANDO_ENTREGA: { background: '#FEF3C7', text: '#92400E' },
  EM_USO: { background: '#DBEAFE', text: '#1E40AF' },
  AGUARDANDO_RETIRADA: { background: '#FDE9D9', text: '#9A3412' },
  FINALIZADO: { background: '#DCFCE7', text: '#166534' },
};

export type Colors = typeof colors;
export type StatusColors = typeof statusColors;
