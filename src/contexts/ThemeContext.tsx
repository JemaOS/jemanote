// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  /** Theme currently applied (system resolved to light or dark). */
  theme: ResolvedTheme;
  /** User preference, including the automatic "system" mode. */
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'jemanote-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
};

const getStoredMode = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    /* storage unavailable */
  }
  // New users follow the OS theme.
  return 'system';
};

const applyTheme = (resolved: ResolvedTheme) => {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  root.style.backgroundColor = resolved === 'dark' ? '#171717' : '#FAFAFA';
  if (document.body) {
    document.body.style.backgroundColor =
      resolved === 'dark' ? '#171717' : '#FAFAFA';
  }
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute('content', resolved === 'dark' ? '#171717' : '#FAFAFA');
  }
};

export function ThemeProvider({ children }: { readonly children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
  const [theme, setThemeState] = useState<ResolvedTheme>(() =>
    mode === 'system' ? getSystemTheme() : mode
  );

  useEffect(() => {
    const resolved = mode === 'system' ? getSystemTheme() : mode;
    setThemeState(resolved);
    applyTheme(resolved);

    if (mode !== 'system' || !window.matchMedia) return;

    const media = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      const next = event.matches ? 'dark' : 'light';
      setThemeState(next);
      applyTheme(next);
    };

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  const handleSetTheme = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    try {
      localStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    handleSetTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, handleSetTheme]);

  const value = useMemo(
    () => ({ theme, mode, toggleTheme, setTheme: handleSetTheme }),
    [theme, mode, toggleTheme, handleSetTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
