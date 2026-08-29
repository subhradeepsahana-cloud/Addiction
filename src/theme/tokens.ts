export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 22,
    xl: 28,
    xxl: 34,
    display: 40,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    md: 26,
    lg: 30,
    xl: 36,
    xxl: 42,
    display: 48,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

// Minimum touch target size per WCAG 2.5.5 / platform HIG guidance.
export const minTouchTarget = 44;

export const motionDurations = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;
