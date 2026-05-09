"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sun, Moon, Monitor, LucideIcon, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

type ThemeMode = "light" | "dark" | "system";

interface ThemeOption {
  mode: ThemeMode;
  icon: LucideIcon;
  label: string;
}

export default function AppearancePage() {
  const { themeMode, setThemeMode, isDarkMode } = useTheme();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isPulsing, setIsPulsing] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const options: ThemeOption[] = [
    { mode: "light", icon: Sun, label: "Light" },
    { mode: "dark", icon: Moon, label: "Dark" },
    { mode: "system", icon: Monitor, label: "System" },
  ];

  useEffect(() => {
    setMounted(true);
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  const handleThemeChange = (mode: ThemeMode) => {
    if (themeMode === mode) return; 
    
    setThemeMode(mode);
    setToastMsg(`Theme set to ${mode}`);
    setIsPulsing(true);

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 1800);

    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => setIsPulsing(false), 500);
  };

  const previewIsDark = themeMode === "system" ? isDarkMode : themeMode === "dark";

  return (
    <div className={`max-w-xl mx-auto px-4 py-12 space-y-10 relative z-0 transition-all duration-700 will-change-transform ${
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
    }`}>
      
      {/* Premium Toast */}
      <div 
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-sm font-bold shadow-2xl transition-all duration-500 ease-out z-50 flex items-center gap-3 border ${
          isDarkMode 
            ? "bg-[#1a1a1a] text-white border-gray-800 shadow-black" 
            : "bg-white text-gray-900 border-gray-100 shadow-gray-200"
        } ${
          toastMsg ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
      >
        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
            <CheckCircle2 size={12} className="text-white" />
        </div>
        {toastMsg}
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h1 className={`text-4xl font-black tracking-tight transition-colors duration-500 ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}>
          Appearance
        </h1>
        <p className={`text-base font-medium transition-colors duration-500 ${
          isDarkMode ? "text-gray-500" : "text-gray-500"
        }`}>
          Personalize your workspace aesthetic.
        </p>
      </div>

      {/* Premium Segmented Control */}
      <div 
        className={`grid grid-cols-3 gap-2 p-1.5 rounded-[22px] border transition-all duration-500 ${
          isDarkMode ? "bg-[#0f0f0f] border-gray-800" : "bg-gray-100 border-gray-200"
        }`}
      >
        {options.map(({ mode, icon: Icon, label }) => {
          const active = themeMode === mode;

          return (
            <button
              key={mode}
              onClick={() => handleThemeChange(mode)}
              className={`relative flex flex-col items-center justify-center py-4 rounded-[18px] transition-all duration-300 ${
                active
                  ? (isDarkMode 
                      ? "bg-[#1a1a1a] text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] border-gray-700" 
                      : "bg-white text-gray-900 shadow-[0_4px_15px_rgba(0,0,0,0.05)] border-transparent") + " border scale-[1.02] z-10"
                  : (isDarkMode 
                      ? "text-gray-500 hover:text-gray-300" 
                      : "text-gray-500 hover:text-gray-800") + " hover:bg-black/5"
              }`}
            >
              <Icon size={18} className={`mb-1.5 transition-colors ${active ? "text-orange-500" : ""}`} />
              <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
              
              {mode === "system" && (
                <span className={`text-[9px] mt-0.5 font-bold opacity-60 uppercase ${active ? "block" : "hidden sm:block"}`}>
                  {isDarkMode ? "Dark" : "Light"}
                </span>
              )}

              {active && (
                <div className="absolute bottom-1 w-1 h-1 bg-orange-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Live Preview Interface */}
      <div className="space-y-4">
        <div className={`flex items-center gap-2 px-1`}>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>Live Preview</span>
        </div>
        
        <div className={`rounded-[32px] border overflow-hidden transition-all duration-700 ease-in-out hover:scale-[1.01] ${
          isDarkMode 
            ? "shadow-[0_40px_80px_rgba(0,0,0,0.7)] border-gray-800" 
            : "shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-gray-200"
        } ${
          isPulsing ? "ring-4 ring-orange-500/20" : "ring-1 ring-transparent"
        }`}>
          
          <div className={`h-72 flex flex-col transition-colors duration-700 ease-in-out ${
            previewIsDark ? "bg-[#050505]" : "bg-white"
          }`}>
            
            {/* Fake Navbar */}
            <div className={`h-14 flex items-center px-6 border-b transition-colors duration-700 ${
              previewIsDark ? "bg-[#0a0a0a] border-gray-800" : "bg-gray-50 border-gray-100"
            }`}>
              <div className={`w-24 h-2 rounded-full ${previewIsDark ? "bg-gray-800" : "bg-gray-200"}`} />
              <div className="ml-auto flex gap-3">
                <div className={`w-8 h-2 rounded-full ${previewIsDark ? "bg-gray-800" : "bg-gray-200"}`} />
                <div className={`w-4 h-4 rounded-full ${previewIsDark ? "bg-gray-800" : "bg-gray-200"}`} />
              </div>
            </div>

            {/* Fake Content */}
            <div className="flex-1 p-8 space-y-6">
              <div className="space-y-3">
                <div className={`h-3 w-48 rounded-full ${previewIsDark ? "bg-gray-800" : "bg-gray-200"}`} />
                <div className={`h-2 w-full rounded-full ${previewIsDark ? "bg-gray-900" : "bg-gray-100"}`} />
                <div className={`h-2 w-5/6 rounded-full ${previewIsDark ? "bg-gray-900" : "bg-gray-100"}`} />
              </div>
              
              {/* Fake Interactive Button */}
              <div className={`mt-8 h-14 rounded-2xl border flex items-center px-5 transition-all duration-700 ${
                previewIsDark 
                  ? "bg-orange-500/5 border-orange-500/20" 
                  : "bg-orange-500/5 border-orange-500/10"
              }`}>
                <div className="w-5 h-5 rounded-full border-2 border-orange-500" />
                <div className="ml-4 h-2.5 w-32 rounded-full bg-orange-500/40" />
                <div className="ml-auto w-8 h-1.5 rounded-full bg-orange-500/20" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}