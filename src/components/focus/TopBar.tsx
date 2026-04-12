"use client";

import React, { useState, useEffect } from "react";
import { useFocusSystem } from "./useFocusSystem";
import { FocusMode } from "./types";
import { Play, Pause, Square, Maximize, Minimize, Circle } from "lucide-react";

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

  // 🔥 1 & 2. STRICT COLOR SYSTEM APPLIED (Communicates State)
  const getStatus = () => {
    if (!isActive) return { 
      label: "Idle", 
      iconColor: "text-gray-400", 
      text: "text-gray-500", 
      pill: "bg-gray-50 border-gray-200" 
    };
    if (isActive && isPaused) return { 
      label: "Paused", 
      iconColor: "text-amber-500", 
      text: "text-amber-700", 
      pill: "bg-amber-50 border-amber-200" 
    };
    return { 
      label: "In Focus", 
      iconColor: "text-green-500 animate-pulse", 
      text: "text-green-700", 
      pill: "bg-green-50 border-green-200" 
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
    // 🔥 5. REMOVED GRADIENTS: Clean white professional card, subtle shadow
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden">
      
      <div className="p-4 md:p-5">
        {/* 🔥 7. MOBILE UX: Stack layout on mobile, grid on desktop */}
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-3 lg:items-center mt-1">
          
          {/* ==========================================
              ZONE 1: SETUP (Left)
          ========================================== */}
          <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start order-2 lg:order-1 w-full lg:w-auto">
            
            {/* 🔥 4. MODE SELECTOR: Neutral base, pure blue selection */}
            <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
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
                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-200/50"}
                      ${isActive && !isSelected ? "opacity-40 cursor-not-allowed hidden sm:block" : ""}
                      ${!isActive ? "hover:scale-[1.03] active:scale-95" : ""}
                    `}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* 🔥 CUSTOM MODE UX: Neutralized (No more flashy red/orange) */}
            {mode === "custom" && !isActive && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-2 py-1.5 rounded-xl animate-in fade-in slide-in-from-left-2 duration-200">
                <input
                  type="number"
                  value={customMinutes}
                  onChange={handleCustomTimeChange}
                  placeholder="0"
                  className="w-10 bg-transparent text-sm text-gray-800 font-bold text-center focus:outline-none placeholder:text-gray-300"
                />
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">min</span>
                
                <div className="flex gap-1 ml-1 border-l border-gray-200 pl-2">
                  {PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => { 
                        setCustomMinutes(p); 
                        if (setTimeRemaining) setTimeRemaining(p * 60); 
                        if (setInitialSessionTime) setInitialSessionTime(p * 60); 
                      }}
                      className="text-[10px] font-bold text-gray-600 px-2 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-transform duration-150 active:scale-95 hover:scale-[1.05] shadow-sm"
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
            <div className="text-[10px] uppercase text-gray-400 font-extrabold tracking-widest mb-1">
              Current Focus
            </div>
            {/* 🔥 Task display color logic refined */}
            <div className={`text-lg md:text-xl font-bold tracking-tight truncate max-w-[300px] lg:max-w-full mx-auto px-4 transition-colors duration-300 ${
              isActive 
                ? "text-green-700"
                : activeTaskId 
                  ? "text-gray-900"
                  : "text-gray-500"
            }`}>
              {displayTask}
            </div>
          </div>

          {/* ==========================================
              ZONE 3: CONTROLS & STATUS (Right/Bottom)
          ========================================== */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 order-3 w-full lg:w-auto">
            
            {/* 🔥 3. BUTTON HIERARCHY: Primary Blue, Secondary Amber, Danger Red */}
            {isActive && (
              <div className="flex items-center gap-2 shrink-0 animate-in fade-in zoom-in-95 duration-200">
                {isPaused ? (
                  <button 
                    onClick={startSession}
                    className="h-10 px-4 flex items-center gap-1.5 rounded-xl font-bold text-sm bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 transition-transform duration-150 hover:scale-[1.03] active:scale-95 shadow-sm"
                  >
                    <Play size={16} className="fill-white" />
                    Resume
                  </button>
                ) : (
                  <button 
                    onClick={pauseSession}
                    className="h-10 px-4 flex items-center gap-1.5 rounded-xl font-bold text-sm bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200 transition-transform duration-150 hover:scale-[1.03] active:scale-95 shadow-sm"
                  >
                    <Pause size={16} className="fill-amber-700" />
                    Pause
                  </button>
                )}

                <button 
                  onClick={() => stopSession(false)} 
                  className="h-10 px-4 flex items-center gap-1.5 rounded-xl font-bold text-sm bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-transform duration-150 hover:scale-[1.03] active:scale-95 shadow-sm"
                >
                  <Square size={14} className="fill-red-700" />
                  Stop
                </button>
              </div>
            )}

            {/* 🔥 3. STATUS PILL: Simplified borders and colors */}
            <div className={`flex items-center gap-2 h-10 px-3 md:px-4 rounded-xl border shadow-sm transition-colors ${status.pill}`}>
              <Circle size={10} className={`${status.iconColor} fill-current`} />
              <span className={`text-[10px] md:text-xs font-extrabold uppercase tracking-wider ${status.text}`}>
                {status.label}
              </span>
            </div>

            <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>

            {/* 🔥 FULLSCREEN: Icon only, neutral hover */}
            <button 
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="h-10 w-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-transform duration-150 active:scale-95 hover:scale-[1.05] shrink-0"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}