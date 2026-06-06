"use client";

import React, { useState } from "react";
import { useFocusSystem } from "../../engine/useFocusSystem";
import { FocusMode } from "../../types/types";
import { Circle } from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

const MODES = [
  { key: "pomodoro", label: "Pomodoro" },
  { key: "deepWork", label: "Deep Work" },
  { key: "custom", label: "Custom" },
] as const;

const PRESETS = [10, 25, 45, 90];

export default function TopBar() {
  const { 
    mode, setMode, isActive, isPaused, activeTaskId, currentSession,
    setTimeRemaining, setInitialSessionTime 
  } = useFocusSystem();

  const { isDarkMode } = useTheme();

  const [customMinutes, setCustomMinutes] = useState<number | "">("");

  // 🔥 STRICT COLOR SYSTEM APPLIED (Supports Light & Dark Modes perfectly)
  const getStatus = () => {
    if (!isActive) return { 
      label: "Idle", 
      iconColor: isDarkMode ? "text-zinc-600" : "text-gray-400", 
      text: isDarkMode ? "text-zinc-500" : "text-gray-500", 
      pill: isDarkMode ? "bg-black border-white/[0.05]" : "bg-gray-50 border-gray-200" 
    };
    if (isActive && isPaused) return { 
      label: "Paused", 
      iconColor: isDarkMode ? "text-amber-500" : "text-amber-500", 
      text: isDarkMode ? "text-amber-400" : "text-amber-700", 
      pill: isDarkMode ? "bg-amber-950/20 border-amber-900/40" : "bg-amber-50 border-amber-200" 
    };
    return { 
      label: "In Focus", 
      iconColor: `animate-pulse ${isDarkMode ? "text-emerald-400" : "text-emerald-500"}`, 
      text: isDarkMode ? "text-emerald-400" : "text-emerald-700", 
      pill: isDarkMode ? "bg-emerald-950/20 border-emerald-900/40" : "bg-emerald-50 border-emerald-200" 
    };
  };

  const status = getStatus();
  const displayTask = isActive && currentSession ? currentSession.taskTitle : (activeTaskId || "Unbound Session");

  const handleModeSelect = (newMode: FocusMode) => {
    setMode(newMode);
    if (newMode === "custom" && setTimeRemaining && setInitialSessionTime) {
      const minutes = typeof customMinutes === "number" ? customMinutes : 0;
      setTimeRemaining(minutes * 60);
      setInitialSessionTime(minutes * 60); 
    }
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setCustomMinutes("");
      if (setTimeRemaining) setTimeRemaining(0);
      if (setInitialSessionTime) setInitialSessionTime(0); 
      return;
    }
    let num = Math.min(600, Math.max(1, parseInt(val) || 1));
    setCustomMinutes(num);
    if (mode === "custom" && setTimeRemaining && setInitialSessionTime) {
      setTimeRemaining(num * 60);
      setInitialSessionTime(num * 60); 
    }
  };

  return (
    <div className={`border rounded-2xl transition-colors duration-300 relative overflow-hidden mx-1 sm:mx-0 ${
      isDarkMode ? "bg-[#050505] border-white/[0.04] shadow-none" : "bg-white border-gray-200 shadow-sm"
    }`}>
      
      <div className="p-3 sm:p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:items-center">
          
          {/* ==========================================
              ZONE 1: SETUP (Left)
          ========================================== */}
          <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start order-2 lg:order-1 w-full lg:w-auto">
            
            {/* Mode Selector */}
            <div className={`grid grid-cols-3 p-1 rounded-xl w-full sm:w-fit transition-colors duration-300 ${
              isDarkMode ? "bg-black border border-white/[0.04]" : "bg-gray-100 border border-transparent"
            }`}>
              {MODES.map((m) => {
                const isSelected = mode === m.key;
                return (
                  <button
                    key={m.key}
                    disabled={isActive}
                    onClick={() => handleModeSelect(m.key as FocusMode)}
                    className={`
                      px-2 sm:px-4 py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all tracking-wide
                      ${isSelected 
                        ? (isDarkMode 
                            ? "bg-white/[0.04] text-orange-400 border border-white/[0.06] shadow-inner" 
                            : "bg-white text-blue-700 shadow-sm border border-blue-200") 
                        : (isDarkMode 
                            ? "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]" 
                            : "text-gray-600 hover:text-blue-600 hover:bg-gray-200/50")}
                      ${isActive && !isSelected ? "opacity-40 cursor-not-allowed" : ""}
                      ${!isActive ? "active:scale-95" : ""}
                    `}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Mode Time Input */}
            {mode === "custom" && !isActive && (
              <div className={`flex items-center gap-2 px-2 py-1.5 rounded-xl animate-in fade-in slide-in-from-left-2 duration-200 transition-colors ${
                isDarkMode ? "bg-black border border-white/[0.04]" : "bg-gray-50 border border-gray-200"
              }`}>
                <input
                  type="number"
                  value={customMinutes}
                  onChange={handleCustomTimeChange}
                  placeholder="0"
                  className={`w-10 bg-transparent text-sm font-bold text-center focus:outline-none transition-colors ${
                    isDarkMode ? "text-white placeholder:text-zinc-600" : "text-gray-900 placeholder:text-gray-300"
                  }`}
                />
                <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors ${
                  isDarkMode ? "text-zinc-500" : "text-gray-400"
                }`}>min</span>
                
                <div className={`flex gap-1 ml-1 pl-2 border-l transition-colors ${
                  isDarkMode ? "border-white/[0.05]" : "border-gray-200"
                }`}>
                  {PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => { 
                        setCustomMinutes(p); 
                        if (setTimeRemaining) setTimeRemaining(p * 60); 
                        if (setInitialSessionTime) setInitialSessionTime(p * 60); 
                      }}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-transform duration-150 active:scale-95 hover:scale-[1.05] shadow-sm border ${
                        isDarkMode 
                          ? "bg-black border-white/[0.05] text-zinc-400 hover:bg-white/[0.05] hover:text-white" 
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ==========================================
              ZONE 2: CURRENT FOCUS (Center)
          ========================================== */}
          <div className="text-center order-1 lg:order-2 flex flex-col justify-center w-full">
            <div className={`text-[10px] uppercase font-extrabold tracking-widest mb-1 transition-colors ${
              isDarkMode ? "text-zinc-500" : "text-gray-400"
            }`}>
              Current Focus
            </div>
            <div className={`text-lg md:text-xl font-bold tracking-tight break-words px-2 lg:max-w-full mx-auto transition-colors duration-300 ${
              isActive 
                ? (isDarkMode ? "text-emerald-400" : "text-emerald-700")
                : activeTaskId 
                  ? (isDarkMode ? "text-white" : "text-gray-900")
                  : (isDarkMode ? "text-zinc-500" : "text-gray-500")
            }`}>
              {displayTask}
            </div>
          </div>

          {/* ==========================================
              ZONE 3: STATUS (Right)
          ========================================== */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-3 order-3 w-full lg:w-auto">
            
            {/* STATUS PILL */}
            <div className={`flex items-center gap-2 h-10 px-4 rounded-xl border shadow-sm transition-colors duration-300 ${status.pill}`}>
              <Circle size={10} className={`${status.iconColor} fill-current`} />
              <span className={`text-[10px] md:text-xs font-extrabold uppercase tracking-wider ${status.text}`}>
                {status.label}
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}