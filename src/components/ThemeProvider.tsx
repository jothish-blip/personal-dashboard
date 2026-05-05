"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Initial Load Logic
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      applyThemeToDOM(storedTheme);
    } else {
      const systemTheme = mediaQuery.matches ? "dark" : "light";
      setTheme(systemTheme);
      applyThemeToDOM(systemTheme);
    }

    // 2. Listen for System Theme Changes
    const handleChange = (e: MediaQueryListEvent) => {
      const currentStored = window.localStorage.getItem(THEME_STORAGE_KEY);
      // ONLY update if the user hasn't manually overridden it
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

  const toggleTheme = () => {
    // Add smooth transition class just before changing the theme
    document.documentElement.classList.add("theme-transition");

    setTheme((prev) => {
      const newTheme = prev === "dark" ? "light" : "dark";
      
      // ONLY save to localStorage when the user actively clicks the toggle
      window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      applyThemeToDOM(newTheme);
      
      return newTheme;
    });

    // Remove the class right after the transition duration ends
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 350);
  };

  const value = useMemo(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      toggleTheme,
    }),
    [theme]
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