// ═════════════════════════════════════════════════════════════════════════
//  SELAH — LIGHT & DARK MODE
//  Every screen reads its colors from here, so the whole app switches at once.
//  Modes: 'system' (match the phone), 'light', 'dark'. The choice is remembered.
// ═════════════════════════════════════════════════════════════════════════
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStoragePackage from '@react-native-async-storage/async-storage';

const AsyncStorage = AsyncStoragePackage?.default || AsyncStoragePackage;
const STORAGE_KEY = '@selah_theme_mode';

export const PALETTES = {
  light: {
    bg: '#F8F9FA', // app background
    surface: '#FFFFFF', // cards, sheets, tab bar
    surfaceAlt: '#EEF0F4', // pills, search fields, soft panels
    surfaceStrong: '#E2E6EC', // stronger fills, tracks
    border: '#E5E7EB',
    inverse: '#12141A', // dark buttons and active pills (white text sits on these)
    text: '#0F1115', // main text
    ink: '#12141A', // icons and strong labels
    textSecondary: '#4B5160',
    textMuted: '#717886',
    textSubtle: '#8A919E',
    textFaint: '#9AA0AC',
    warnBg: '#FFFBEB',
    warnBorder: '#FDE68A',
    warnText: '#92400E'
  },
  dark: {
    bg: '#0B0D12',
    surface: '#151922',
    surfaceAlt: '#1E232D',
    surfaceStrong: '#2A303C',
    border: '#272D39',
    inverse: '#3B4254',
    text: '#F3F4F6',
    ink: '#E8EAEE',
    textSecondary: '#C3C8D2',
    textMuted: '#A3AAB7',
    textSubtle: '#8C94A3',
    textFaint: '#6B7280',
    warnBg: '#2A220E',
    warnBorder: '#5B4714',
    warnText: '#FCD34D'
  }
};

const ThemeContext = createContext({
  mode: 'system',
  scheme: 'light',
  colors: PALETTES.light,
  setMode: () => {}
});

export function ThemeProvider({ children }) {
  const phoneScheme = useColorScheme();
  const [mode, setModeState] = useState('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') setModeState(saved);
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((next) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const scheme = mode === 'system' ? (phoneScheme === 'dark' ? 'dark' : 'light') : mode;
  const value = useMemo(() => ({ mode, scheme, colors: PALETTES[scheme], setMode }), [mode, scheme, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** { mode, scheme, colors, setMode } */
export const useTheme = () => useContext(ThemeContext);

/** The current color palette */
export const useColors = () => useContext(ThemeContext).colors;

/** Builds a screen's StyleSheet for the current mode (rebuilt only when the mode changes) */
export function useThemedStyles(factory) {
  const { colors, scheme } = useContext(ThemeContext);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(colors), [factory, scheme]);
}
