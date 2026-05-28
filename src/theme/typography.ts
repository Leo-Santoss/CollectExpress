export const typography = {
  // Structured access
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },

  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },

  lineHeight: {
    xs: 16,
    sm: 18,
    md: 22,
    lg: 28,
    xl: 34,
    xxl: 40,
  },

  // Flat access (backward compatibility)
  fontFamilyRegular: 'System',
  fontFamilyMedium: 'System',
  fontFamilyBold: 'System',

  fontSizeXs: 12,
  fontSizeSm: 14,
  fontSizeMd: 16,
  fontSizeLg: 20,
  fontSizeXl: 24,
  fontSizeXxl: 32,

  lineHeightSm: 18,
  lineHeightMd: 22,
  lineHeightLg: 28,
  lineHeightXl: 34,
} as const;

export type Typography = typeof typography;
