"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider"; // Adjust path if needed

export default function AppearancePage() {
  const { isDarkMode, themeMode, setThemeMode } = useTheme();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
      
      {/* Header */}
      <div>
        <h1 className={`text-2xl md:text-3xl font-bold transition-colors ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}>
          Appearance
        </h1>
        <p className={`text-sm mt-1 ${
          isDarkMode ? "text-gray-500" : "text-gray-500"
        }`}>
          Customize how NexTask looks on your device.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className={`text-sm font-semibold uppercase tracking-wide ${
          isDarkMode ? "text-gray-600" : "text-gray-400"
        }`}>
          Theme Preference
        </h2>

        {/* Theme Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Light Mode Card */}
          <button
            onClick={() => setThemeMode("light")}
            className={`flex flex-col items-center justify-center p-6 border rounded-2xl transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md ${
              themeMode === "light"
                ? isDarkMode
                  ? "border-orange-500 bg-[#111111] ring-1 ring-orange-500 text-orange-400"
                  : "border-orange-500 bg-orange-50/50 ring-1 ring-orange-500 text-orange-600"
                : isDarkMode
                ? "border-gray-800 bg-[#111111] text-gray-400 hover:text-white"
                : "border-gray-200 bg-white text-gray-500 hover:text-gray-900"
            }`}
          >
            <Sun size={32} className="mb-3" />
            <span className="font-bold text-sm">Light Mode</span>
          </button>

          {/* Dark Mode Card */}
          <button
            onClick={() => setThemeMode("dark")}
            className={`flex flex-col items-center justify-center p-6 border rounded-2xl transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md ${
              themeMode === "dark"
                ? isDarkMode
                  ? "border-orange-500 bg-[#111111] ring-1 ring-orange-500 text-orange-400"
                  : "border-orange-500 bg-orange-50/50 ring-1 ring-orange-500 text-orange-600"
                : isDarkMode
                ? "border-gray-800 bg-[#111111] text-gray-400 hover:text-white"
                : "border-gray-200 bg-white text-gray-500 hover:text-gray-900"
            }`}
          >
            <Moon size={32} className="mb-3" />
            <span className="font-bold text-sm">Dark Mode</span>
          </button>

          {/* System Default Card */}
          <button
            onClick={() => setThemeMode("system")}
            className={`flex flex-col items-center justify-center p-6 border rounded-2xl transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md ${
              themeMode === "system"
                ? isDarkMode
                  ? "border-orange-500 bg-[#111111] ring-1 ring-orange-500 text-orange-400"
                  : "border-orange-500 bg-orange-50/50 ring-1 ring-orange-500 text-orange-600"
                : isDarkMode
                ? "border-gray-800 bg-[#111111] text-gray-400 hover:text-white"
                : "border-gray-200 bg-white text-gray-500 hover:text-gray-900"
            }`}
          >
            <Monitor size={32} className="mb-3" />
            <span className="font-bold text-sm">System Default</span>
          </button>

        </div>

        <p className={`text-xs mt-2 font-medium ${
          isDarkMode ? "text-gray-500" : "text-gray-400"
        }`}>
          System Default will automatically match your Windows/macOS operating system appearance.
        </p>
      </div>

    </div>
  );
}