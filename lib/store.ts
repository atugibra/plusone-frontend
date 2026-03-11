"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export type OddsFormat = 'decimal' | 'fractional' | 'american';
export type Theme = 'dark' | 'light' | 'system';

interface AppSettings {
  theme: Theme;
  oddsFormat: OddsFormat;
  defaultLeague: string;
  animationsEnabled: boolean;
  setTheme: (theme: Theme) => void;
  setOddsFormat: (format: OddsFormat) => void;
  setDefaultLeague: (leagueId: string) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  oddsFormat: 'decimal',
  defaultLeague: '',
  animationsEnabled: true,
  setTheme: () => {},
  setOddsFormat: () => {},
  setDefaultLeague: () => {},
  setAnimationsEnabled: () => {},
};

const SettingsContext = createContext<AppSettings>(defaultSettings);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [oddsFormat, setOddsFormatState] = useState<OddsFormat>('decimal');
  const [defaultLeague, setDefaultLeagueState] = useState<string>('');
  const [animationsEnabled, setAnimationsEnabledState] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const storedTheme = localStorage.getItem('plusone-theme') as Theme;
      if (storedTheme) setThemeState(storedTheme);

      const storedFormat = localStorage.getItem('plusone-odds') as OddsFormat;
      if (storedFormat) setOddsFormatState(storedFormat);

      const storedLeague = localStorage.getItem('plusone-league');
      if (storedLeague !== null) setDefaultLeagueState(storedLeague);

      const storedAnimations = localStorage.getItem('plusone-animations');
      if (storedAnimations !== null) setAnimationsEnabledState(storedAnimations === 'true');
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('plusone-theme', newTheme);
    applyTheme(newTheme);
  };

  const setOddsFormat = (newFormat: OddsFormat) => {
    setOddsFormatState(newFormat);
    localStorage.setItem('plusone-odds', newFormat);
  };

  const setDefaultLeague = (newLeague: string) => {
    setDefaultLeagueState(newLeague);
    localStorage.setItem('plusone-league', newLeague);
  };

  const setAnimationsEnabled = (enabled: boolean) => {
    setAnimationsEnabledState(enabled);
    localStorage.setItem('plusone-animations', String(enabled));
  };

  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
    }
  }, [theme, mounted]);

  const applyTheme = (t: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (t === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(t);
    }
  };

  return (
    <SettingsContext.Provider value={{
      theme, oddsFormat, defaultLeague, animationsEnabled,
      setTheme, setOddsFormat, setDefaultLeague, setAnimationsEnabled
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useStore = () => useContext(SettingsContext);

export function formatOdds(decimalOdds: number, format: OddsFormat): string {
  if (format === 'decimal') return decimalOdds.toFixed(2);
  
  if (format === 'american') {
    if (decimalOdds >= 2.0) {
      return `+${Math.round((decimalOdds - 1) * 100)}`;
    } else {
      return `-${Math.round(100 / (decimalOdds - 1))}`;
    }
  }
  
  // Fractional (simple approximation)
  if (format === 'fractional') {
    const p = decimalOdds - 1;
    const fractions = [
      [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1],
      [1, 2], [1, 3], [1, 4], [1, 5], 
      [2, 3], [3, 2], [3, 4], [4, 3], [5, 2], [2, 5], [5, 4], [4, 5], [6, 4], [6, 5],
      [7, 2], [2, 7], [7, 4], [4, 7], [8, 5], [5, 8], [9, 2], [2, 9], [9, 4], [4, 9]
    ];
    let best = fractions[0];
    let minErr = Math.abs(p - best[0]/best[1]);
    for (const f of fractions) {
      const err = Math.abs(p - f[0]/f[1]);
      if (err < minErr) {
        minErr = err;
        best = f;
      }
    }
    if (minErr > 0.1) return decimalOdds.toFixed(2);
    return `${best[0]}/${best[1]}`;
  }
  return decimalOdds.toFixed(2);
}
