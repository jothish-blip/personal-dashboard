"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { FilteredData } from './utils';
import { useTheme } from "@/theme/ThemeProvider"; // 🔥 Consuming theme state

interface InsightsProps {
  stats: FilteredData['stats'];
  momentum: number;
  loadLevel: 'High' | 'Moderate' | 'Low';
}

export default function InsightsPanel({ stats, momentum, loadLevel }: InsightsProps) {
  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state

  // Collapse State & Mobile Behavior
  const [isOpen, setIsOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🔥 STEP 1: PERFORMANCE INSIGHT
  const insightText =
    stats.totalCompletions === 0
      ? "No activity yet."
      : momentum < 0 && stats.consistencyPercent < 50
      ? "Performance dropping. Pattern breaking."
      : momentum < 0
      ? "Recent decline detected."
      : momentum > 0 && stats.consistencyPercent >= 70
      ? "Strong execution trend."
      : momentum > 0
      ? "Improving steadily."
      : "Stable execution.";

  // 🔥 STEP 3: CARD COLOR STATE (Dynamic for Dark Mode)
  const performanceColor =
    momentum > 0 ? (isDarkMode ? "bg-emerald-950/20 border-emerald-900/50" : "bg-green-50 border-green-200") :
    momentum < 0 ? (isDarkMode ? "bg-red-950/20 border-red-900/50" : "bg-red-50 border-red-200") :
    (isDarkMode ? "bg-[#1a1a1a] border-gray-800" : "bg-gray-50 border-gray-200");

  // 🔥 STEP 4: LOAD LEVEL COLOR
  const loadColorClass =
    loadLevel === 'High' ? (isDarkMode ? 'text-emerald-500' : 'text-green-500') :
    loadLevel === 'Moderate' ? 'text-gray-500' :
    (isDarkMode ? 'text-orange-400' : 'text-orange-500');

  const loadTextColorClass =
    loadLevel === 'High' ? (isDarkMode ? 'text-emerald-400' : 'text-green-600') :
    loadLevel === 'Moderate' ? (isDarkMode ? 'text-gray-400' : 'text-gray-600') :
    (isDarkMode ? 'text-orange-400' : 'text-orange-600');

  return (
    <div className={`border rounded-[20px] shadow-sm overflow-hidden transition-colors ${
      isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
    }`}>
      
      {/* HEADER */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between p-4 text-left transition-colors outline-none ${
          isDarkMode ? "hover:bg-[#1a1a1a]" : "hover:bg-gray-50/50"
        }`}
      >
        <span className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Actionable Insights
        </span>

        {/* 🔥 STEP 7: DYNAMIC HEADER ICON */}
        <span className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""} ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          {momentum > 0 && <TrendingUp size={18} />}
          {momentum < 0 && <TrendingDown size={18} />}
          {momentum === 0 && <Minus size={18} />}
        </span>
      </button>

      {/* Preview when closed */}
      {!isOpen && (
        <div className={`px-4 pb-4 text-xs font-medium animate-in fade-in ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
          Tap to view system diagnostics
        </div>
      )}

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[500px] opacity-100 p-4 pt-0" : "max-h-0 opacity-0 px-4"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* --- CARD 1: PERFORMANCE INSIGHT --- */}
          <div className={`${performanceColor} border rounded-xl p-5 flex flex-col justify-between h-full transition-colors duration-300`}>
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                  Performance Diagnostic
                </span>
              </div>

              <p className={`text-sm font-semibold mt-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                {insightText}
              </p>

              {/* 🔥 STEP 5: URGENCY LINE */}
              {momentum < 0 && (
                <div className={`mt-3 text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-red-400" : "text-red-500"}`}>
                  ⚠ Immediate correction needed
                </div>
              )}
            </div>

            <div className={`mt-4 pt-4 border-t flex items-center gap-6 ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
              <div className="flex items-center gap-2">
                {momentum > 0 && <TrendingUp size={14} className={isDarkMode ? "text-emerald-500" : "text-green-500"} />}
                {momentum < 0 && <TrendingDown size={14} className={isDarkMode ? "text-red-500" : "text-red-500"} />}
                {momentum === 0 && <Minus size={14} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />}
                <span className={`text-xs font-bold uppercase tracking-widest ${
                  momentum > 0 ? (isDarkMode ? "text-emerald-400" : "text-green-600") : 
                  momentum < 0 ? (isDarkMode ? "text-red-400" : "text-red-600") : 
                  (isDarkMode ? "text-gray-500" : "text-gray-500")
                }`}>
                  {momentum > 0 ? "Up" : momentum < 0 ? "Down" : "Flat"}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Activity size={14} className={loadColorClass} />
                <span className={`text-xs font-bold uppercase tracking-widest ${loadTextColorClass}`}>
                  {loadLevel} Load
                </span>
              </div>
            </div>
          </div>

          {/* --- CARD 2: EXECUTION SIGNAL --- */}
          <div className={`${performanceColor} border rounded-xl p-5 flex flex-col justify-start h-full transition-colors duration-300`}>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                Execution Signal
              </span>
            </div>

            {/* 🔥 STEP 2: EXACT NUMBERS & DIRECTION */}
            <p className={`text-sm font-semibold mt-2 leading-relaxed ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
              {momentum > 0 && `+${momentum} improvement from yesterday`}
              {momentum < 0 && `${momentum} drop from yesterday`}
              {momentum === 0 && `No change from yesterday`}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}