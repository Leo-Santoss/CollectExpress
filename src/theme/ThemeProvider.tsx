import { createContext, ReactNode, useContext } from 'react';
import { colors, Colors, statusColors, StatusColors } from './colors';
import { radius, Radius } from './radius';
import { shadows, Shadows } from './shadows';
import { spacing, Spacing } from './spacing';
import { typography, Typography } from './typography';

export interface Theme {
  colors: Colors;
  statusColors: StatusColors;
  spacing: Spacing;
  typography: Typography;
  radius: Radius;
  shadows: Shadows;
}

export const defaultTheme: Theme = {
  colors,
  statusColors,
  spacing,
  typography,
  radius,
  shadows,
};

const ThemeContext = createContext<Theme>(defaultTheme);

interface ThemeProviderProps {
  children: ReactNode;
  theme?: Theme;
}

export function ThemeProvider({ children, theme = defaultTheme }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): Theme {
  const context = useContext(ThemeContext);
  return context;
}
