export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderLight: string;
  disabled: string;
  overlay: string;
  shadow: string;
  cardGradientStart: string;
  cardGradientMiddle: string;
  cardGradientEnd: string;
  statusBarStyle: 'light' | 'dark';
}

export const lightTheme: ThemeColors = {
  primary: '#10b981',
  primaryDark: '#059669',
  primaryLight: '#34d399',
  secondary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#f9fafb',
  backgroundSecondary: '#f3f4f6',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  disabled: '#d1d5db',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: '#000000',
  cardGradientStart: '#10b981',
  cardGradientMiddle: '#059669',
  cardGradientEnd: '#047857',
  statusBarStyle: 'dark',
};

export const darkTheme: ThemeColors = {
  primary: '#10b981',
  primaryDark: '#059669',
  primaryLight: '#34d399',
  secondary: '#60a5fa',
  success: '#10b981',
  warning: '#fbbf24',
  error: '#f87171',
  background: '#0f172a',
  backgroundSecondary: '#1e293b',
  surface: '#1e293b',
  surfaceElevated: '#334155',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  border: '#334155',
  borderLight: '#475569',
  disabled: '#475569',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: '#000000',
  cardGradientStart: '#059669',
  cardGradientMiddle: '#047857',
  cardGradientEnd: '#065f46',
  statusBarStyle: 'light',
};

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

export const themes: Record<ThemeMode, Theme> = {
  light: {
    mode: 'light',
    colors: lightTheme,
  },
  dark: {
    mode: 'dark',
    colors: darkTheme,
  },
};
