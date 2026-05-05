"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return a placeholder of the exact same size before hydration to prevent layout shift
  if (!mounted) {
    return <div className="w-[38px] h-[38px]" />; 
  }

  return (
    <button
      type="button"
      aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      onClick={toggleTheme}
      className={`p-2 rounded-full border shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center group ${
        isDarkMode 
          ? "bg-[#111111] border-gray-800 text-gray-300" 
          : "bg-white border-gray-200 text-gray-600"
      }`}
    >
      {isDarkMode ? (
        <Sun size={18} className="group-hover:text-orange-400 transition-colors" />
      ) : (
        <Moon size={18} className="group-hover:text-indigo-500 transition-colors" />
      )}
    </button>
  );
}