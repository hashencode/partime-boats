import React from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

void React

export const THEME_STORAGE_KEY = 'admin-theme-mode'
export const SEARCH_COMPACT_LAYOUT_STORAGE_KEY = 'admin-search-compact-layout'

export type ThemeMode = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

type ThemeContextValue = {
  mode: ThemeMode
  resolvedTheme: ResolvedTheme
  searchCompactLayout: boolean
  setMode: (mode: ThemeMode) => void
  setSearchCompactLayout: (enabled: boolean) => void
  toggleTheme: () => void
}

const FALLBACK_MODE: ThemeMode = 'system'
const VALID_MODES: ThemeMode[] = ['light', 'dark', 'system']

const ThemeContext = createContext<ThemeContextValue | null>(null)

const isThemeMode = (value: string | null): value is ThemeMode =>
  value !== null && VALID_MODES.includes(value as ThemeMode)

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const getStoredMode = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return FALLBACK_MODE
  }

  try {
    const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeMode(storedMode) ? storedMode : FALLBACK_MODE
  } catch {
    return FALLBACK_MODE
  }
}

const getStoredSearchCompactLayout = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(SEARCH_COMPACT_LAYOUT_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [mode, setMode] = useState<ThemeMode>(getStoredMode)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme)
  const [searchCompactLayout, setSearchCompactLayout] = useState<boolean>(getStoredSearchCompactLayout)

  const resolvedTheme = mode === 'system' ? systemTheme : mode

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const rootElement = document.documentElement
    rootElement.setAttribute('data-theme', resolvedTheme)
    rootElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode)
    } catch {
      // Ignore storage failures and keep runtime theme state available.
    }
  }, [mode])

  useEffect(() => {
    try {
      window.localStorage.setItem(SEARCH_COMPACT_LAYOUT_STORAGE_KEY, String(searchCompactLayout))
    } catch {
      // Ignore storage failures and keep runtime UI preference state available.
    }
  }, [searchCompactLayout])

  const toggleTheme = useCallback(() => {
    setMode((currentMode) => {
      const currentResolved = currentMode === 'system' ? getSystemTheme() : currentMode
      return currentResolved === 'dark' ? 'light' : 'dark'
    })
  }, [])

  const value = useMemo(
    () => ({ mode, resolvedTheme, searchCompactLayout, setMode, setSearchCompactLayout, toggleTheme }),
    [mode, resolvedTheme, searchCompactLayout, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }

  return context
}
