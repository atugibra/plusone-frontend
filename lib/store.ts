"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OddsFormat = 'decimal' | 'fractional' | 'american';
export type Theme = 'dark' | 'light' | 'system';

interface AppSettings {
  oddsFormat: OddsFormat;
  defaultLeague: string;
  animationsEnabled: boolean;
  setOddsFormat: (format: OddsFormat) => void;
  setDefaultLeague: (leagueId: string) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
}

export const useStore = create<AppSettings>()(
  persist(
    (set) => ({
      oddsFormat: 'decimal',
      defaultLeague: '',
      animationsEnabled: true,
      
      setOddsFormat: (format) => set({ oddsFormat: format }),
      setDefaultLeague: (leagueId) => set({ defaultLeague: leagueId }),
      setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
    }),
    {
      name: 'plusone-settings',
    }
  )
);

export function formatOdds(decimalOdds: number, format: OddsFormat): string {
  if (format === 'decimal') {
    return decimalOdds.toFixed(2);
  }
  
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
    // Common fractions
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
    
    // If exact fraction is too far, just use decimal string for edge cases
    if (minErr > 0.1) return decimalOdds.toFixed(2);
    return `${best[0]}/${best[1]}`;
  }
  
  return decimalOdds.toFixed(2);
}
