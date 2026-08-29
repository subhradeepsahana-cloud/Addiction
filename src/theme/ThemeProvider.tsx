import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { palettes, ColorPalette, ThemeName } from './colors';
import { spacing, radii, typography, minTouchTarget, motionDurations } from './tokens';

type Theme = {
  name: ThemeName;
  colors: ColorPalette;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  minTouchTarget: number;
  motion: typeof motionDurations;
};

const ThemeContext = createContext<Theme | null>(null);

function buildTheme(name: ThemeName): Theme {
  return {
    name,
    colors: palettes[name],
    spacing,
    radii,
    typography,
    minTouchTarget,
    motion: motionDurations,
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const theme = useMemo(() => buildTheme(scheme === 'dark' ? 'dark' : 'light'), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
