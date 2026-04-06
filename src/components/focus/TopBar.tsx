"use client";

import React, { useState, useEffect } from "react";
import { useFocusSystem } from "./useFocusSystem";
import { FocusMode } from "./types";

const MODES = [
  {
    key: "pomodoro",
    label: "Pomodoro",
    activeClass: "bg-orange-100 text-orange-600 border-orange-300",
  },
  {
    key: "deepWork",
    label: "Deep Work",
    activeClass: "bg-green-100 text-green-600 border-green-300",
  },
  {
    key: "custom",
    label: "Custom",
    activeClass: "bg-red-100 text-red-600 border-red-300",
  },
] as const;

const PRESETS = [10, 25, 45, 90];

export default function TopBar() {
  const { 
    mode, setMode, isActive, isPaused, activeTaskId, currentSession,
    startSession, pauseSession, stopSession, setTimeRemaining 
  } = useFocusSystem();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<number | "">("");

  const getStatus = () => {
    if (!isActive) return { label: "Idle", color: "bg-gray-300" };
    if (isActive && isPaused) return { label: "Paused", color: "bg-orange-500" };
    return { label: "In Focus", color: "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" };
  };

  const status = getStatus();

  // ✅ Read the intent accurately based on the new architecture
  const displayTask = isActive && currentSession ? currentSession.taskTitle : (activeTaskId || "Unbound Session");

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(console.error);
    } else {
      document.exitFullscreen?.().catch(console.error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleModeSelect = (newMode: FocusMode) => {
    setMode(newMode);
    
    if (newMode === "custom" && setTimeRemaining) {
      if (typeof customMinutes === "number" && customMinutes > 0) {
        setTimeRemaining(customMinutes * 60);
      } else {
        setTimeRemaining(0); 
      }
    }
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (val === "") {
      setCustomMinutes("");
      if (setTimeRemaining) setTimeRemaining(0);
      return;
    }

    let num = parseInt(val);
    if (isNaN(num)) return;

    if (num < 1) num = 1;
    if (num > 600) num = 600;

    setCustomMinutes(num);

    if (mode === "custom" && setTimeRemaining) {
      setTimeRemaining(num * 60);
    }
  };

  const applyPreset = (minutes: number) => {
    setCustomMinutes(minutes);
    if (setTimeRemaining) setTimeRemaining(minutes * 60);
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between bg-white border border-gray-200 p-3 md:p-4 rounded-xl shadow-sm transition-all">
      
      {/* LEFT: MODE SWITCH & CUSTOM CONTROLS */}
      <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {MODES.map((m) => {
          const isSelected = mode === m.key;

          return (
            <div key={m.key} className="flex items-center gap-1.5 shrink-0">
              <button
                disabled={isActive}
                onClick={() => handleModeSelect(m.key as FocusMode)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-md transition-all border whitespace-nowrap
                  ${isSelected ? m.activeClass : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}
                  ${isActive && !isSelected ? "opacity-50 cursor-not-allowed hidden sm:block" : ""}
                `}
              >
                {m.label}
              </button>

              {/* CUSTOM SETTINGS (Input + Presets) */}
              {isSelected && m.key === "custom" && !isActive && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200 ml-1">
                  
                  {/* Input */}
                  <div className="flex items-center bg-red-50 border border-red-200 rounded-md px-2 py-1.5">
                    <input
                      type="number"
                      min="1"
                      max="600"
                      value={customMinutes}
                      onChange={handleCustomTimeChange}
                      placeholder="min"
                      className="w-12 bg-transparent text-sm text-red-700 font-semibold text-center focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-red-300 placeholder:font-normal"
                    />
                  </div>

                  {/* Presets */}
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md p-1">
                    {PRESETS.map((p) => (
                      <button
                        key={p}
                        onClick={() => applyPreset(p)}
                        className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CENTER: SESSION INFO */}
      {isActive && (
        <div className="flex-1 hidden sm:flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
            Current Target
          </div>
          {/* ✅ FIX: Properly rendering the string-based Intent */}
          <div className="text-sm font-medium text-gray-900 truncate max-w-[200px] md:max-w-[300px]">
            {displayTask}
          </div>
        </div>
      )}

      {/* RIGHT: CONTROLS & STATUS */}
      <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto shrink-0">
        
        {isActive && (
          <div className="flex gap-2">
            <button 
              onClick={isPaused ? startSession : pauseSession}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-all active:scale-95 ${
                isPaused 
                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                  : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
              }`}
            >
              {isPaused ? "▶ Resume" : "⏸ Pause"}
            </button>
            <button 
              onClick={() => stopSession(false)} // ✅ FIX: Prevents passing the React MouseEvent
              className="px-4 py-2 text-sm font-medium rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all active:scale-95"
            >
              ⏹ End
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 border-l border-gray-200 pl-3 md:pl-4">
          <div className="font-medium flex items-center gap-2 text-gray-500">
            <span className={`w-2 h-2 rounded-full transition-colors shrink-0 ${status.color}`}></span>
            <span className="text-xs sm:text-sm whitespace-nowrap">{status.label}</span>
          </div>

          <button 
            onClick={toggleFullscreen}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors shrink-0"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? "↙️" : "↗️"} 
          </button>
        </div>

      </div>
    </div>
  );
}