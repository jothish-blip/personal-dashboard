"use client";

import React, { useState } from "react";
import { useFocusSystem } from "../../engine/useFocusSystem";
import { FocusMode } from "../../types/types";
import { Circle } from "lucide-react";

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

  const [customMinutes, setCustomMinutes] = useState<number | "">("");

  // 🔥 STRICT COLOR SYSTEM APPLIED (Supports Light & Dark Modes perfectly)
  const getStatus = () => {
    if (!isActive) return { 
      label: "Idle", 
      iconColor: "text-gray-400 dark:text-white/30", 
      text: "text-gray-500 dark:text-white/50", 
      pill: "bg-gray-50 border-gray-200 dark:bg-white/[0.02] dark:border-white/[0.06]" 
    };
    if (isActive && isPaused) return { 
      label: "Paused", 
      iconColor: "text-amber-500 dark:text-yellow-500", 
      text: "text-amber-700 dark:text-yellow-500", 
      pill: "bg-amber-50 border-amber-200 dark:bg-yellow-500/10 dark:border-yellow-500/20" 
    };
    return { 
      label: "In Focus", 
      iconColor: "text-green-500 dark:text-green-400 animate-pulse", 
      text: "text-green-700 dark:text-green-400", 
      pill: "bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/20" 
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
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm hover:shadow-md dark:shadow-none transition-shadow duration-300 relative overflow-hidden mx-1 sm:mx-0">
      
      <div className="p-3 sm:p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:items-center">
          
          {/* ==========================================
              ZONE 1: SETUP (Left)
          ========================================== */}
          <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start order-2 lg:order-1 w-full lg:w-auto">
            
            {/* Mode Selector */}
            <div className="grid grid-cols-3 bg-gray-100 dark:bg-white/[0.02] border border-transparent dark:border-white/[0.06] p-1 rounded-xl w-full sm:w-fit">
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
                        ? "bg-white text-blue-700 shadow-sm border border-blue-200 dark:bg-orange-500/10 dark:text-orange-500 dark:border-orange-500/20 dark:shadow-[0_0_15px_rgba(249,115,22,0.1)]" 
                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-200/50 dark:text-white/50 dark:hover:text-white/90 dark:hover:bg-white/[0.04]"}
                      ${isActive && !isSelected ? "opacity-40 cursor-not-allowed" : ""}
                      ${!isActive ? "hover:scale-[1.03] active:scale-95" : ""}
                    `}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Mode Time Input */}
            {mode === "custom" && !isActive && (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#070707] border border-gray-200 dark:border-white/[0.06] px-2 py-1.5 rounded-xl animate-in fade-in slide-in-from-left-2 duration-200">
                <input
                  type="number"
                  value={customMinutes}
                  onChange={handleCustomTimeChange}
                  placeholder="0"
                  className="w-10 bg-transparent text-sm text-gray-800 dark:text-white/90 font-bold text-center focus:outline-none placeholder:text-gray-300 dark:placeholder:text-white/20"
                />
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-white/40">min</span>
                
                <div className="flex gap-1 ml-1 border-l border-gray-200 dark:border-white/[0.06] pl-2">
                  {PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => { 
                        setCustomMinutes(p); 
                        if (setTimeRemaining) setTimeRemaining(p * 60); 
                        if (setInitialSessionTime) setInitialSessionTime(p * 60); 
                      }}
                      className="text-[10px] font-bold text-gray-600 dark:text-white/60 px-2 py-1 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-white/[0.06] hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/[0.04] dark:hover:text-white/90 transition-transform duration-150 active:scale-95 hover:scale-[1.05] shadow-sm"
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
            <div className="text-[10px] uppercase text-gray-400 dark:text-white/40 font-extrabold tracking-widest mb-1">
              Current Focus
            </div>
            <div className={`text-lg md:text-xl font-bold tracking-tight break-words px-2 lg:max-w-full mx-auto transition-colors duration-300 ${
              isActive 
                ? "text-green-700 dark:text-green-400"
                : activeTaskId 
                  ? "text-gray-900 dark:text-white/90"
                  : "text-gray-500 dark:text-white/40"
            }`}>
              {displayTask}
            </div>
          </div>

          {/* ==========================================
              ZONE 3: STATUS (Right)
          ========================================== */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-3 order-3 w-full lg:w-auto">
            
            {/* STATUS PILL */}
            <div className={`flex items-center gap-2 h-10 px-4 rounded-xl border shadow-sm transition-colors ${status.pill}`}>
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