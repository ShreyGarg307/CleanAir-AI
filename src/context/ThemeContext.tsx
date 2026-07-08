import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  largeText: boolean;
  toggleLargeText: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('cleanair_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  const [largeText, setLargeText] = useState<boolean>(() => {
    return localStorage.getItem('cleanair_largetext') === 'true';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('cleanair_theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    localStorage.setItem('cleanair_largetext', String(largeText));
  }, [largeText]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleLargeText = () => {
    setLargeText(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, largeText, toggleLargeText }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
