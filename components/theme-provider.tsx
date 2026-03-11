'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type OddsFormat = 'decimal' | 'fractional' | 'american'
export type Theme = 'dark' | 'light' | 'system'

interface AppSettings {
  theme: Theme
  oddsFormat: OddsFormat
  defaultLeague: string
  animationsEnabled: boolean
  setTheme: (theme: Theme) => void
  setOddsFormat: (format: OddsFormat) => void
  setDefaultLeague: (leagueId: string) => void
  setAnimationsEnabled: (enabled: boolean) => void
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
}

const SettingsContext = createContext<AppSettings>(defaultSettings)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [oddsFormat, setOddsFormatState] = useState<OddsFormat>('decimal')
  const [defaultLeague, setDefaultLeagueState] = useState<string>('')
  const [animationsEnabled, setAnimationsEnabledState] = useState<boolean>(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const storedTheme = localStorage.getItem('plusone-theme') as Theme
      if (storedTheme) setThemeState(storedTheme)

      const storedFormat = localStorage.getItem('plusone-odds') as OddsFormat
      if (storedFormat) setOddsFormatState(storedFormat)

      const storedLeague = localStorage.getItem('plusone-league')
      if (storedLeague !== null) setDefaultLeagueState(storedLeague)

      const storedAnimations = localStorage.getItem('plusone-animations')
      if (storedAnimations !== null) setAnimationsEnabledState(storedAnimations === 'true')
    } catch (e) {
      console.error("Failed to load settings:", e)
    }
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('plusone-theme', newTheme)
    applyTheme(newTheme)
  }

  const setOddsFormat = (newFormat: OddsFormat) => {
    setOddsFormatState(newFormat)
    localStorage.setItem('plusone-odds', newFormat)
  }

  const setDefaultLeague = (newLeague: string) => {
    setDefaultLeagueState(newLeague)
    localStorage.setItem('plusone-league', newLeague)
  }

  const setAnimationsEnabled = (enabled: boolean) => {
    setAnimationsEnabledState(enabled)
    localStorage.setItem('plusone-animations', String(enabled))
  }

  useEffect(() => {
    if (mounted) {
      applyTheme(theme)
    }
  }, [theme, mounted])

  const applyTheme = (t: Theme) => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    if (t === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(t)
    }
  }

  return (
    <SettingsContext.Provider value={{
      theme, oddsFormat, defaultLeague, animationsEnabled,
      setTheme, setOddsFormat, setDefaultLeague, setAnimationsEnabled
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useStore = () => useContext(SettingsContext)
