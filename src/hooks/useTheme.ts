import type { Theme } from '../theme/ThemeProvider';
import { useThemeContext } from '../theme/ThemeProvider';

export function useTheme(): Theme {
  return useThemeContext();
}
