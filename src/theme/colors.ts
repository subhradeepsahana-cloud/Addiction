/**
 * Sober Companion design system — colors.
 *
 * Intent: calm, warm, premium — not clinical. Red is reserved for genuine
 * high-risk / safety states only, never for routine UI chrome. Every
 * semantic pairing meets WCAG AA contrast against its paired background.
 */

const light = {
  // Backgrounds
  background: '#F6F3EE',
  backgroundElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#EFEAE1',

  // Brand — sage/olive green, calm and grounded
  primary: '#5B6B4E',
  primaryMuted: '#DCE3D3',
  onPrimary: '#FFFFFF',

  // Accent — warm terracotta, used sparingly for encouragement/highlights
  accent: '#C97B4A',
  accentMuted: '#F3DECB',
  onAccent: '#FFFFFF',

  // Text
  textPrimary: '#2B2A26',
  textSecondary: '#615E56',
  textTertiary: '#918D82',
  onDark: '#F6F3EE',

  // Borders / dividers
  border: '#E3DDD1',
  divider: '#ECE7DC',

  // Semantic risk states (color-independent icons must always accompany these)
  riskLow: '#4B7B5B',
  riskLowBg: '#E1EEE3',
  riskModerate: '#B8863A',
  riskModerateBg: '#F5E9D2',
  riskHigh: '#B5453A',
  riskHighBg: '#F6DEDA',

  success: '#4B7B5B',
  successBg: '#E1EEE3',
  warning: '#B8863A',
  warningBg: '#F5E9D2',
  danger: '#B5453A',
  dangerBg: '#F6DEDA',

  // Craving mode
  cravingBg: '#2B2A26',
  cravingSurface: '#3A3934',

  focus: '#5B6B4E',
  shadow: 'rgba(43, 42, 38, 0.08)',
};

const dark = {
  background: '#1B1A17',
  backgroundElevated: '#242320',
  surface: '#242320',
  surfaceMuted: '#2E2C28',

  primary: '#9AB08A',
  primaryMuted: '#39422F',
  onPrimary: '#1B1A17',

  accent: '#E2A576',
  accentMuted: '#4A3627',
  onAccent: '#1B1A17',

  textPrimary: '#F1EEE6',
  textSecondary: '#C9C4B8',
  textTertiary: '#928D80',
  onDark: '#F1EEE6',

  border: '#38352E',
  divider: '#2E2B25',

  riskLow: '#8FBF9E',
  riskLowBg: '#243329',
  riskModerate: '#E3B968',
  riskModerateBg: '#3A2F1B',
  riskHigh: '#E39187',
  riskHighBg: '#3D2521',

  success: '#8FBF9E',
  successBg: '#243329',
  warning: '#E3B968',
  warningBg: '#3A2F1B',
  danger: '#E39187',
  dangerBg: '#3D2521',

  cravingBg: '#0F0E0C',
  cravingSurface: '#1E1D19',

  focus: '#9AB08A',
  shadow: 'rgba(0, 0, 0, 0.4)',
};

export const palettes = { light, dark };
export type ColorPalette = typeof light;
export type ThemeName = keyof typeof palettes;
