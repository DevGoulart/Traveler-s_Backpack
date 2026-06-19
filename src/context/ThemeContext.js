import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { initDatabase, getDatabase } from '../database/init';
import * as settingsRepo from '../database/repositories/settingsRepository';
import { lightColors, darkColors } from '../theme/colors';

const THEME_KEY = 'theme_mode';

const ThemeContext = createContext(null);

async function loadStoredTheme() {
  await initDatabase();
  const db = await getDatabase();
  return settingsRepo.getSetting(db, THEME_KEY);
}

async function persistTheme(mode) {
  await initDatabase();
  const db = await getDatabase();
  await settingsRepo.setSetting(db, THEME_KEY, mode);
}

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadStoredTheme()
      .then((stored) => {
        if (stored === 'dark' || stored === 'light') {
          setMode(stored);
        } else if (systemScheme === 'dark') {
          setMode('dark');
        }
      })
      .finally(() => setReady(true));
  }, [systemScheme]);

  const isDark = mode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const setTheme = useCallback(async (newMode) => {
    const resolved = newMode === 'dark' ? 'dark' : 'light';
    setMode(resolved);
    await persistTheme(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  const value = useMemo(
    () => ({ colors, isDark, mode, setTheme, toggleTheme, ready }),
    [colors, isDark, mode, setTheme, toggleTheme, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
