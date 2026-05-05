"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const THEME_STORAGE_KEY = "nextask_theme";

// Extracted DOM manipulation for reuse
function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Initial Load Logic
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    if (storedTheme === "light" || storedTheme === "dark") {
      setThemeModeState(storedTheme);
      setTheme(storedTheme);
      applyThemeToDOM(storedTheme);
    } else {
      setThemeModeState("system");
      const systemTheme = mediaQuery.matches ? "dark" : "light";
      setTheme(systemTheme);
      applyThemeToDOM(systemTheme);
    }

    // 2. Listen for System Theme Changes
    const handleChange = (e: MediaQueryListEvent) => {
      const currentStored = window.localStorage.getItem(THEME_STORAGE_KEY);
      // ONLY update if the user hasn't manually overridden it (i.e., they are in system mode)
      if (!currentStored) {
        const newSystemTheme = e.matches ? "dark" : "light";
        setTheme(newSystemTheme);
        applyThemeToDOM(newSystemTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    setMounted(true);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    document.documentElement.classList.add("theme-transition");
    setThemeModeState(mode);

    if (mode === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setTheme(systemTheme);
      applyThemeToDOM(systemTheme);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
      setTheme(mode);
      applyThemeToDOM(mode);
    }

    setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 350);
  };

  const toggleTheme = () => {
    document.documentElement.classList.add("theme-transition");

    setTheme((prev) => {
      const newTheme = prev === "dark" ? "light" : "dark";
      
      // Update both the mode and actual theme
      setThemeModeState(newTheme);
      window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      applyThemeToDOM(newTheme);
      
      return newTheme;
    });

    setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 350);
  };

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      isDarkMode: theme === "dark",
      toggleTheme,
      setThemeMode,
    }),
    [theme, themeMode]
  );

  // Prevent hydration mismatch on initial render
  if (!mounted) {
    return null; 
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}