import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { getThemePreference, saveThemePreference } from '@/services/storage.service';
import { Theme, ThemeMode, themes } from '@/lib/constants/theme';

type ThemePreference = ThemeMode | 'system';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
  isSystemTheme: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

function getSystemTheme(): ThemeMode {
  const colorScheme = Appearance.getColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
}

function resolveThemeMode(preference: ThemePreference, systemTheme: ThemeMode): ThemeMode {
  return preference === 'system' ? systemTheme : preference;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(getSystemTheme());

  const themeMode = useMemo(
    () => {
      const resolved = resolveThemeMode(themePreference, systemTheme);
      console.log('Theme mode resolved:', { themePreference, systemTheme, resolved });
      return resolved;
    },
    [themePreference, systemTheme]
  );

  const theme = useMemo(() => themes[themeMode], [themeMode]);

  const isSystemTheme = themePreference === 'system';

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const stored = await getThemePreference();
        if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setThemePreferenceState(stored as ThemePreference);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }: { colorScheme: ColorSchemeName }) => {
      setSystemTheme(colorScheme === 'dark' ? 'dark' : 'light');
    });

    return () => subscription.remove();
  }, []);

  const setThemePreference = useCallback(async (preference: ThemePreference) => {
    try {
      console.log('Setting theme preference to:', preference);
      await saveThemePreference(preference);
      setThemePreferenceState(preference);
      console.log('Theme preference saved successfully');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, []);

  const toggleTheme = useCallback(async () => {
    const currentMode = resolveThemeMode(themePreference, systemTheme);
    const newMode: ThemeMode = currentMode === 'light' ? 'dark' : 'light';
    await setThemePreference(newMode);
  }, [themePreference, systemTheme, setThemePreference]);

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      themePreference,
      setThemePreference,
      toggleTheme,
      isSystemTheme,
    }),
    [theme, themeMode, themePreference, setThemePreference, toggleTheme, isSystemTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
