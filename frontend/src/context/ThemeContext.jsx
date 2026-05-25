import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

function getInitialTheme() {
  const saved = localStorage.getItem('pawze-theme')
  if (saved === 'light' || saved === 'dark') return saved

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('pawze-theme', theme)
  }, [theme])

  const value = useMemo(() => ({
    theme,
    isLight: theme === 'light',
    isDark: theme === 'dark',
    toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark'),
  }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
