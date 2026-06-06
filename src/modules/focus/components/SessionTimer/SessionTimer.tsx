"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useFocusSystem } from "../../engine/useFocusSystem";
import { Play, Pause, Square, Check, Sparkles } from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

export default function SessionTimer() {
  const {
    timeRemaining,
    initialSessionTime,
    isActive,
    isPaused,
    mode,
    isSessionComplete,
    startSession,
    pauseSession,
    stopSession,
    setTimeRemaining,
    getRemainingTime,
    currentSession,
    extraTime,
  } = useFocusSystem();

  const { isDarkMode } = useTheme();

  // Custom Modal State
  const [activeModal, setActiveModal] = useState<"pause" | "endNormal" | "endExtra" | null>(null);

  useEffect(() => {
    if (currentSession) {
      const remaining = getRemainingTime();
      setTimeRemaining(remaining);
    }
  }, [currentSession, getRemainingTime, setTimeRemaining]);

  useEffect(() => {
    if (isActive && !currentSession) {
      console.error("SessionTimer: Active state true but currentSession is null. State desync detected.");
    }
  }, [isActive, currentSession]);

  const isExtraMode = !!currentSession?.completedAt;

  // Reset to initial time when session is completely inactive and not paused
  const displayTime = useMemo(() => {
    if (!isActive && !isPaused && !isExtraMode) {
      return initialSessionTime;
    }
    if (currentSession?.completedAt) {
      return extraTime;
    }
    if (currentSession) {
      return getRemainingTime();
    }
    return timeRemaining;
  }, [currentSession, getRemainingTime, timeRemaining, extraTime, isActive, isPaused, isExtraMode, initialSessionTime]);

  // Subtle Haptic feedback when time is running out (mobile only)
  useEffect(() => {
    if (isActive && !isPaused && !isExtraMode && displayTime > 0 && displayTime < 10) {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
    }
  }, [displayTime, isActive, isPaused, isExtraMode]);

  // Spacebar controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      if (activeModal) return; // Disable spacebar toggle when a modal is open
      
      if (e.code === "Space") {
        e.preventDefault();
        if (isExtraMode) return;
        if (!isActive || isPaused) {
          startSession();
        } else {
          handlePause();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isActive, isPaused, isExtraMode, startSession, activeModal]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getModeLabel = () => {
    if (mode === "pomodoro") return "Pomodoro • Goal: 25 min";
    if (mode === "deepWork") return "Deep Work • Goal: 90 min";
    const mins = Math.floor(initialSessionTime / 60);
    return `Custom • Goal: ${mins} min`;
  };

  const getDynamicColor = () => {
    if (isExtraMode) return isDarkMode ? "text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "text-purple-600 drop-shadow-[0_0_15px_rgba(168,85,247,0.2)]";
    if (isActive && displayTime < 120 && !isExtraMode) return isDarkMode ? "text-red-400 scale-[1.02] transition-transform duration-300 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "text-red-500 scale-[1.02] transition-transform duration-300 drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]";
    return isDarkMode ? "text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.2)]" : "text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.15)]";
  };

  const getStateText = () => {
    if (!isActive) return "Ready when you are";
    if (isPaused) return "Paused. Pick up where you left off.";
    if (isExtraMode) return "Goal completed. Continue if the work needs you.";
    if (displayTime < 120) return "Almost there";
    return "You're in flow";
  };

  const handlePause = () => {
    pauseSession();
    setActiveModal("pause");
  };

  const handleResume = () => {
    startSession();
    setActiveModal(null);
  };

  const circleRadius = 110;
  const circumference = 2 * Math.PI * circleRadius;

  const rawProgress = isExtraMode
    ? 1
    : initialSessionTime > 0
    ? (initialSessionTime - displayTime) / initialSessionTime
    : 0;

  const progress = Math.min(Math.max(rawProgress, 0), 1);
  const strokeDashoffset = circumference * (1 - progress);
  const isInterrupted = !isActive && currentSession && !isSessionComplete;

  return (
    <>
      <div
        className={`flex flex-col items-center justify-center py-10 sm:py-12 md:py-16 rounded-2xl transition-all duration-700 ease-out relative overflow-hidden border ${
          isExtraMode && isActive && !isPaused
            ? (isDarkMode ? "bg-gradient-to-b from-black to-purple-950/20 border-purple-900/30 shadow-[0_0_50px_rgba(168,85,247,0.1)]" : "bg-purple-50/30 border-purple-200 shadow-[0_0_50px_rgba(168,85,247,0.1)]")
            : isActive && displayTime < 120 && !isPaused && !isExtraMode
            ? (isDarkMode ? "bg-gradient-to-b from-black to-red-950/20 border-red-900/30 shadow-[0_0_50px_rgba(239,68,68,0.15)]" : "bg-red-50/30 border-red-200 shadow-[0_0_50px_rgba(239,68,68,0.15)]")
            : isActive && !isPaused
            ? (isDarkMode ? "bg-gradient-to-b from-black to-emerald-950/20 border-emerald-900/30 shadow-[0_0_40px_rgba(16,185,129,0.05)]" : "bg-emerald-50/30 border-emerald-200 shadow-[0_0_40px_rgba(16,185,129,0.05)]")
            : (isDarkMode ? "bg-black border-white/[0.04] shadow-none" : "bg-white border-gray-200 shadow-sm")
        }`}
      >
        <div className={`absolute top-5 md:top-6 text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive && !isPaused ? (isDarkMode ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500 animate-pulse') : (isDarkMode ? 'bg-white/[0.06]' : 'bg-gray-300')}`}></span>
          {getModeLabel()}
        </div>

        {isExtraMode && (
          <div className="absolute top-14 mt-1 flex flex-col items-center z-10 transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-2">
            <div className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors ${
              isDarkMode ? "bg-purple-950/40 text-purple-400 border-purple-900/50" : "bg-purple-100 text-purple-700 border-purple-200"
            }`}>
              <Sparkles size={14} /> Goal completed
            </div>
            <div className={`text-[10px] mt-1.5 font-medium text-center leading-tight transition-colors ${isDarkMode ? "text-purple-500/80" : "text-purple-600/70"}`}>
              Extra time is being tracked separately.
            </div>
          </div>
        )}

        {isInterrupted && !isExtraMode && (
          <div className={`absolute top-14 mt-1 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold z-10 flex items-center gap-1.5 animate-pulse transition-colors ${
            isDarkMode ? "bg-amber-950/30 text-amber-400 border-amber-900/50" : "bg-orange-100 text-orange-700 border-orange-200"
          }`}>
            <Check size={14} /> Session interrupted — resume when ready
          </div>
        )}

        {/* PROGRESS RING */}
        <div className="relative flex items-center justify-center mt-6 mb-8 w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px]">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-xl">
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>

              <linearGradient id="extraModeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#9333ea" />
              </linearGradient>

              <linearGradient id="criticalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>

            {/* Background Track Circle */}
            <circle
              cx="50%"
              cy="50%"
              r={circleRadius}
              strokeWidth="6"
              fill="transparent"
              stroke="currentColor"
              className={`transition-colors ${isDarkMode ? "text-white/[0.04]" : "text-gray-100"}`}
            />

            {/* Active Progress Circle */}
            <circle
              cx="50%"
              cy="50%"
              r={circleRadius}
              stroke={
                isExtraMode 
                  ? "url(#extraModeGradient)" 
                  : (isActive && displayTime < 120 && !isPaused) 
                  ? "url(#criticalGradient)" 
                  : "url(#progressGradient)"
              }
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
              style={{ transformOrigin: "50% 50%" }}
            />
          </svg>

          {/* TIMER TEXT */}
          <div className={`absolute z-10 flex flex-col items-center justify-center transition-colors duration-500 ease-out ${getDynamicColor()}`}>
            <div className="text-6xl sm:text-7xl md:text-8xl font-[550] tracking-tighter tabular-nums leading-none">
              {formatTime(displayTime)}
            </div>

            {isExtraMode && (
              <span className={`text-[10px] mt-2 uppercase tracking-widest font-bold opacity-90 transition-colors ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>
                Extra Time
              </span>
            )}

            <div className={`text-[11px] sm:text-xs font-medium mt-4 flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-colors ${
              isDarkMode ? "bg-black border-white/[0.04] text-gray-400" : "bg-neutral-50 border-neutral-200 text-gray-600"
            }`}>
              <span
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  isActive && !isPaused && isExtraMode
                    ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                    : isActive && !isPaused && displayTime < 120
                    ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                    : isActive && !isPaused
                    ? (isDarkMode ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]")
                    : isActive && isPaused
                    ? "bg-yellow-500"
                    : "bg-gray-400"
                }`}
              ></span>
              {getStateText()}
            </div>
          </div>
        </div>

        {/* PRIMARY CONTROLS */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[280px] sm:max-w-none sm:w-auto px-4 sm:px-0 z-10">
          {isExtraMode ? (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
              <button
                onClick={() => setActiveModal("endExtra")}
                className={`w-full sm:w-auto px-10 py-3.5 flex items-center justify-center gap-2 font-semibold rounded-xl transition-all shadow-md active:scale-[0.98] ${
                  isDarkMode ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-gray-900 text-white hover:bg-black"
                }`}
              >
                <Check size={18} /> Complete Session
              </button>
            </div>
          ) : (
            <>
              {!isActive || isPaused ? (
                <button
                  onClick={isPaused ? handleResume : startSession}
                  className={`w-full sm:w-auto px-10 py-3.5 flex items-center justify-center gap-2 font-semibold rounded-xl transition-all shadow-md active:scale-[0.98] ${
                    isDarkMode ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-gray-900 text-white hover:bg-black"
                  }`}
                >
                  <Play size={18} className="fill-current" /> {isPaused || isInterrupted ? "Resume Focus" : "Start Session"}
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className={`w-full sm:w-auto px-10 py-3.5 border flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-[0.98] ${
                    isDarkMode ? "bg-black border-white/[0.04] text-gray-300 hover:bg-white/[0.03]" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Pause size={18} className="fill-current" /> Pause
                </button>
              )}

              {isActive && (
                <div className="flex sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveModal("endNormal")}
                    className={`flex-1 sm:flex-none px-6 py-3.5 border flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-[0.98] ${
                      isDarkMode ? "bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25" : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    <Square size={16} className="fill-current" /> End
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className={`hidden sm:block absolute bottom-4 text-[10px] font-medium z-10 transition-colors opacity-50 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Press{" "}
          <kbd className={`px-1.5 py-0.5 border rounded font-mono shadow-sm mx-0.5 transition-colors ${
            isDarkMode ? "bg-black border-white/[0.04] text-gray-400" : "bg-gray-100 border-gray-200 text-gray-500"
          }`}>
            Space
          </kbd>{" "}
          to play/pause
        </div>
      </div>

      {/* =======================================================================
          UPGRADED GLASSMORPHISM MODALS (BLACK-OUT ISOLATED OVERLAYS)
      ========================================================================*/}

      {/* 1. Pause Modal */}
      {activeModal === "pause" && (
        <div className="fixed inset-0 z-[999999] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <div className={`max-w-md w-full border shadow-2xl rounded-3xl p-8 text-center flex flex-col items-center animate-in zoom-in-95 duration-200 ${
            isDarkMode ? "bg-black border-white/[0.04]" : "bg-white border-gray-200"
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors ${
              isDarkMode ? "bg-orange-500/10 text-orange-500" : "bg-orange-100 text-orange-600"
            }`}>
              <Pause size={28} className="fill-current" />
            </div>
            <h2 className={`text-2xl md:text-3xl font-bold mb-2 tracking-tight transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Taking a break?
            </h2>
            <p className={`mb-8 text-sm md:text-base transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              You still have <span className={`font-bold transition-colors ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>{formatTime(displayTime)}</span> remaining.
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleResume}
                className={`w-full px-6 py-4 font-semibold rounded-xl transition-all shadow-md active:scale-[0.98] text-base flex items-center justify-center gap-2 ${
                  isDarkMode ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-gray-900 text-white hover:bg-black"
                }`}
              >
                <Play size={18} className="fill-current" /> Resume Focus
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  stopSession(false);
                }}
                className={`w-full px-6 py-4 border font-semibold rounded-xl transition-all active:scale-[0.98] ${
                  isDarkMode ? "bg-black border-white/[0.04] text-gray-300 hover:bg-white/[0.03]" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                End Session Early
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. End Normal Session Modal */}
      {activeModal === "endNormal" && (
        <div className="fixed inset-0 z-[999999] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <div className={`max-w-md w-full border shadow-2xl rounded-3xl p-8 text-center flex flex-col items-center animate-in zoom-in-95 duration-200 ${
            isDarkMode ? "bg-black border-white/[0.04]" : "bg-white border-gray-200"
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors ${
              isDarkMode ? "bg-red-500/10 text-red-500" : "bg-red-50 text-red-600"
            }`}>
              <Square size={24} className="fill-current" />
            </div>
            <h2 className={`text-2xl md:text-3xl font-bold mb-2 tracking-tight transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              End Session?
            </h2>
            <p className={`mb-8 text-sm md:text-base transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              You haven't reached your target yet. Are you sure you want to stop?
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => {
                  setActiveModal(null);
                  stopSession(false);
                }}
                className={`w-full px-6 py-4 font-semibold rounded-xl transition-all shadow-md active:scale-[0.98] text-base border ${
                  isDarkMode ? "bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25" : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                }`}
              >
                Yes, End Session
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className={`w-full px-6 py-4 border font-semibold rounded-xl transition-all active:scale-[0.98] ${
                  isDarkMode ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-gray-900 text-white hover:bg-black"
                }`}
              >
                Cancel & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. End Extra Focus Modal */}
      {activeModal === "endExtra" && (
        <div className="fixed inset-0 z-[999999] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <div className={`max-w-md w-full border shadow-2xl rounded-3xl p-8 text-center flex flex-col items-center animate-in zoom-in-95 duration-200 ${
            isDarkMode ? "bg-black border-white/[0.04]" : "bg-white border-gray-200"
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors ${
              isDarkMode ? "bg-purple-500/10 text-purple-400" : "bg-purple-100 text-purple-600"
            }`}>
              <Sparkles size={28} className="fill-current" />
            </div>
            <h2 className={`text-2xl md:text-3xl font-bold mb-2 tracking-tight transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Goal Reached
            </h2>
            <p className={`mb-6 text-sm md:text-base transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              You successfully pushed beyond your planned focus time.
            </p>

            <div className={`rounded-2xl p-5 w-full mb-8 flex flex-col gap-3 text-left shadow-inner border transition-colors ${
              isDarkMode ? "bg-black border-white/[0.04] shadow-none" : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-500">Target Goal:</span>
                <span className={`transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>{Math.floor(initialSessionTime / 60)} min</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className={`transition-colors ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>Extra Focus:</span>
                <span className={`transition-colors ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>+{formatTime(extraTime)}</span>
              </div>
              <div className={`h-px w-full my-1 transition-colors ${isDarkMode ? "bg-white/[0.04]" : "bg-gray-200"}`}></div>
              <div className="flex justify-between items-center text-base font-bold">
                <span className={`transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>Total Time:</span>
                <span className={`transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>{formatTime(initialSessionTime + extraTime)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => {
                  setActiveModal(null);
                  stopSession(true);
                }}
                className={`w-full px-6 py-4 font-semibold rounded-xl transition-all shadow-md active:scale-[0.98] text-base ${
                  isDarkMode ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-gray-900 text-white hover:bg-black"
                }`}
              >
                Save Total Time & End
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  stopSession(false); 
                }}
                className={`w-full px-6 py-4 border font-semibold rounded-xl transition-all active:scale-[0.98] ${
                  isDarkMode ? "bg-black border-white/[0.04] text-gray-400 hover:bg-white/[0.03]" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                Discard Extra Time
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}