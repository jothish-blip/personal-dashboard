"use client";

import React, { useState, useEffect } from "react";
import { useFocusSystem } from "./useFocusSystem";
import { FocusMode } from "./types";

const MODES = [
  { key: "pomodoro", label: "Pomodoro" },
  { key: "deepWork", label: "Deep Work" },
  { key: "custom", label: "Custom" },
] as const;

const PRESETS = [10, 25, 45, 90];

export default function TopBar() {
  const { 
    mode, setMode, isActive, isPaused, activeTaskId, currentSession,
    startSession, pauseSession, stopSession, setTimeRemaining, setInitialSessionTime 
  } = useFocusSystem();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<number | "">("");

  // 🔥 UPGRADED STATUS LOGIC WITH STRONGER COLORS
  const getStatus = () => {
    if (!isActive) return { 
      label: "Idle", 
      dot: "bg-gray-400", 
      text: "text-gray-600", 
      pill: "bg-gray-100 border-gray-200" 
    };
    if (isActive && isPaused) return { 
      label: "Paused", 
      dot: "bg-orange-500", 
      text: "text-orange-700", 
      pill: "bg-orange-100 border-orange-300" 
    };
    return { 
      label: "In Focus", 
      dot: "bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]", 
      text: "text-green-700", 
      pill: "bg-green-100 border-green-300" 
    };
  };

  const status = getStatus();
  const displayTask = isActive && currentSession ? currentSession.taskTitle : (activeTaskId || "Unbound Session");

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(console.error);
    } else {
      document.exitFullscreen?.().catch(console.error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
    // 🔥 PART 1, 8, 9: PREMIUM CONTAINER WITH GRADIENT BACKGROUND AND ACCENT LINE
    <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 border border-gray-200 rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition-all relative overflow-hidden">
      
      {/* 🔥 PART 8: TOP ACCENT LINE */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-green-400 to-orange-400"></div>
      
      <div className="p-4 md:p-5">
        {/* SPLIT INTO 3 CLEAR ZONES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-6 lg:gap-4 mt-1">
          
          {/* ==========================================
              ZONE 1: SETUP (Left)
          ========================================== */}
          <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start order-2 lg:order-1">
            
            {/* 🔥 PART 2: SEGMENTED CONTROL (BLUE THEME) */}
            <div className="flex bg-blue-100/60 p-1 rounded-xl w-fit shadow-inner">
              {MODES.map((m) => {
                const isSelected = mode === m.key;
                return (
                  <button
                    key={m.key}
                    disabled={isActive}
                    onClick={() => handleModeSelect(m.key as FocusMode)}
                    className={`
                      px-4 py-1.5 md:py-2 text-xs font-bold rounded-lg transition-all tracking-wide
                      ${isSelected 
                        ? "bg-white text-blue-700 shadow-sm border border-blue-200" 
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"}
                      ${isActive && !isSelected ? "opacity-40 cursor-not-allowed hidden sm:block" : ""}
                    `}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* 🔥 PART 6: CUSTOM MODE UX (ORANGE/RED ENERGY) */}
            {mode === "custom" && !isActive && (
              <div className="flex items-center gap-2 bg-gradient-to-br from-red-50 to-orange-50 border border-orange-200 px-2 py-1 rounded-xl animate-in fade-in slide-in-from-left-2 duration-200">
                <input
                  type="number"
                  value={customMinutes}
                  onChange={handleCustomTimeChange}
                  placeholder="0"
                  className="w-10 bg-transparent text-sm text-red-700 font-extrabold text-center focus:outline-none placeholder:text-red-300"
                />
                <span className="text-[10px] uppercase font-bold tracking-wider text-red-400">min</span>
                
                <div className="flex gap-1 ml-1 border-l border-orange-200 pl-2">
                  {PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => { 
                        setCustomMinutes(p); 
                        if (setTimeRemaining) setTimeRemaining(p * 60); 
                        if (setInitialSessionTime) setInitialSessionTime(p * 60); 
                      }}
                      className="text-[10px] font-bold text-red-600 px-2 py-1 rounded-lg bg-white border border-red-100 hover:bg-red-100 hover:border-red-200 transition-colors active:scale-95 shadow-sm"
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
          {/* 🔥 PART 3: HERO TASK WITH DYNAMIC COLOR FEEDBACK */}
          <div className="text-center order-1 lg:order-2 flex flex-col justify-center">
            <div className="text-[10px] uppercase text-gray-400 font-extrabold tracking-widest mb-1">
              Current Focus
            </div>
            <div className={`text-sm md:text-base font-extrabold truncate max-w-[300px] mx-auto px-4 transition-colors duration-300 ${
              isActive 
                ? "text-orange-600"
                : activeTaskId 
                  ? "text-blue-700"
                  : "text-gray-500"
            }`}>
              {displayTask}
            </div>
          </div>

          {/* ==========================================
              ZONE 3: CONTROLS & STATUS (Right)
          ========================================== */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 order-3">
            
            {/* 🔥 PART 5: COLOR-CODED INTUITIVE CONTROLS */}
            {isActive && (
              <div className="flex items-center gap-2 shrink-0 animate-in fade-in zoom-in-95 duration-200">
                <button 
                  onClick={isPaused ? startSession : pauseSession}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 shadow-sm border ${
                    isPaused 
                      ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200" 
                      : "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200"
                  }`}
                >
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <button 
                  onClick={() => stopSession(false)} 
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-all active:scale-95 shadow-sm"
                >
                  Stop
                </button>
              </div>
            )}

            {/* 🔥 PART 4: UPGRADED STATUS PILL */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-colors ${status.pill}`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${status.dot}`}></span>
              <span className={`text-[10px] md:text-xs font-extrabold uppercase tracking-wider ${status.text}`}>
                {status.label}
              </span>
            </div>

            <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>

            {/* 🔥 PART 7: FULLSCREEN BUTTON IMPROVEMENT */}
            <button 
              onClick={toggleFullscreen}
              className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-blue-600 transition-colors active:scale-95 px-2 py-1.5 rounded-lg hover:bg-blue-50 shrink-0"
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}