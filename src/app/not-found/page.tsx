"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SearchX, ArrowLeft, Home, Grid, BookOpen, Calendar } from "lucide-react";
import ThemeToggle from "@/theme/ThemeToggle";

export default function NotFoundPage() {
  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${
      isDarkMode ? "bg-[#050505]" : "bg-[#F9FAFB]"
    }`}>
      <div className="max-w-lg w-full text-center space-y-8">
        
        {/* ICON */}
        <div className="relative inline-block">
          <div className={`absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse ${
            isDarkMode ? "bg-red-900/50" : "bg-red-100"
          }`} />
          <div className={`relative p-8 rounded-[2rem] shadow-lg border transition-colors ${
            isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-slate-100"
          }`}>
            <SearchX size={56} className="text-red-500 mx-auto" />
          </div>
        </div>

        {/* TEXT */}
        <div className="space-y-3">
          <h1 className={`text-5xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>404</h1>
          <h2 className={`text-lg font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-300" : "text-slate-800"}`}>
            Route Not Found
          </h2>
          <p className={`text-sm leading-relaxed max-w-sm mx-auto ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>
            The requested route does not exist or has been moved.  
            You can navigate back or continue to another module.
          </p>
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button 
            onClick={() => window.history.back()}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 font-semibold rounded-xl transition-all active:scale-95 border ${
              isDarkMode 
                ? "bg-[#111111] border-gray-800 text-gray-300 hover:bg-[#1a1a1a]" 
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ArrowLeft size={16} /> Go Back
          </button>

          {/* 🔥 FIXED DASHBOARD BUTTON: Hex colors bypass the global.css bg-white override */}
          <Link 
            href="/"
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 font-semibold rounded-xl transition-all active:scale-95 shadow-md ${
              isDarkMode 
                ? "bg-[#ffffff] text-[#000000] hover:bg-[#e5e7eb]" 
                : "bg-slate-900 text-white hover:bg-black"
            }`}
          >
            <Home size={16} /> Dashboard
          </Link>
        </div>

        {/* SMART NAVIGATION (VERY IMPORTANT UX) */}
        <div className={`pt-6 border-t ${isDarkMode ? "border-gray-800" : "border-slate-200"}`}>
          <p className={`text-xs uppercase tracking-widest mb-3 ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>
            Quick Navigation
          </p>

          <div className="grid grid-cols-3 gap-3">
            <Link 
              href="/matrix" 
              className={`p-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-colors border ${
                isDarkMode 
                  ? "bg-[#111111] border-gray-800 hover:bg-[#1a1a1a] text-gray-300" 
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <Grid size={16} className={isDarkMode ? "text-gray-400" : "text-gray-500"} /> Matrix
            </Link>

            <Link 
              href="/diary" 
              className={`p-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-colors border ${
                isDarkMode 
                  ? "bg-[#111111] border-gray-800 hover:bg-[#1a1a1a] text-gray-300" 
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <BookOpen size={16} className={isDarkMode ? "text-gray-400" : "text-gray-500"} /> Diary
            </Link>

            <Link 
              href="/Planner" 
              className={`p-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-colors border ${
                isDarkMode 
                  ? "bg-[#111111] border-gray-800 hover:bg-[#1a1a1a] text-gray-300" 
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <Calendar size={16} className={isDarkMode ? "text-gray-400" : "text-gray-500"} /> Planner
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

function useTheme(): { isDarkMode: boolean } {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const getStoredTheme = () => {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem("theme");
    };

    const updateTheme = () => {
      const storedTheme = getStoredTheme();
      if (storedTheme === "dark") {
        setIsDarkMode(true);
      } else if (storedTheme === "light") {
        setIsDarkMode(false);
      } else {
        setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
      }
    };

    updateTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => setIsDarkMode(event.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return { isDarkMode };
}
