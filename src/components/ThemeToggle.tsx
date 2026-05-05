"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      onClick={toggleTheme}
      className="p-2 rounded-full transition-all duration-300 ease-in-out text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 active:scale-90"
    >
      {isDarkMode ? (
        <Sun size={18} className="rotate-0 scale-100 transition-all duration-300" />
      ) : (
        <Moon size={18} className="rotate-0 scale-100 transition-all duration-300" />
      )}
    </button>
  );
}