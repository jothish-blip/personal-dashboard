"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useFocusSystem } from "../../engine/useFocusSystem";
import { Play, Pause, Square, Check, Sparkles } from "lucide-react";

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
    if (isExtraMode) return "text-purple-600 dark:text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.2)] dark:drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]";
    if (isActive && displayTime < 120 && !isExtraMode) return "text-red-500 scale-[1.02] transition-transform duration-300 drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]";
    return "text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:drop-shadow-[0_0_25px_rgba(249,115,22,0.3)]";
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
        className={`flex flex-col items-center justify-center py-10 sm:py-12 md:py-16 rounded-2xl transition-all duration-700 ease-out relative overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-[#070707] dark:border-white/[0.06] ${
          isExtraMode && isActive && !isPaused
            ? "dark:shadow-[0_0_80px_rgba(168,85,247,0.15)] shadow-[0_0_40px_rgba(168,85,247,0.1)]"
            : isActive && displayTime < 120 && !isPaused && !isExtraMode
            ? "dark:shadow-[0_0_80px_rgba(239,68,68,0.15)] shadow-[0_0_40px_rgba(239,68,68,0.15)]"
            : isActive && !isPaused
            ? "dark:shadow-[0_0_80px_rgba(249,115,22,0.12)] shadow-[0_0_40px_rgba(249,115,22,0.1)]"
            : "dark:shadow-none"
        }`}
      >
        <div className="absolute top-5 md:top-6 text-[10px] md:text-xs font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isActive && !isPaused ? 'bg-orange-500 animate-pulse' : 'bg-gray-300 dark:bg-white/20'}`}></span>
          {getModeLabel()}
        </div>

        {isExtraMode && (
          <div className="absolute top-14 mt-1 flex flex-col items-center z-10 transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-2">
            <div className="text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-500/20 text-xs sm:text-sm font-semibold flex items-center gap-1.5">
              <Sparkles size={14} /> Goal completed
            </div>
            <div className="text-[10px] text-purple-600/70 dark:text-purple-400/60 mt-1.5 font-medium text-center leading-tight">
              Extra time is being tracked separately.
            </div>
          </div>
        )}

        {isInterrupted && !isExtraMode && (
          <div className="absolute top-14 mt-1 text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-500/20 text-xs sm:text-sm font-semibold z-10 flex items-center gap-1.5">
            <Check size={14} /> Session interrupted — resume where you left
          </div>
        )}

        {/* PROGRESS RING */}
        <div className="relative flex items-center justify-center mt-6 mb-8 w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px]">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-xl">
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" />
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
              strokeWidth="4"
              fill="transparent"
              className="stroke-gray-100 dark:stroke-white/[0.04]"
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
              strokeWidth="4"
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
              <span className="text-[10px] text-purple-600 dark:text-purple-400 mt-2 uppercase tracking-widest font-bold opacity-90">
                Extra Time
              </span>
            )}

            <div className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-white/50 mt-4 flex items-center justify-center gap-2">
              <span
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  isActive && !isPaused && isExtraMode
                    ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                    : isActive && !isPaused && displayTime < 120
                    ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                    : isActive && !isPaused
                    ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                    : isActive && isPaused
                    ? "bg-yellow-500 dark:bg-white/40"
                    : "bg-gray-300 dark:bg-white/20"
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
                className="w-full sm:w-auto px-10 py-3.5 flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all shadow-md hover:shadow-lg hover:shadow-purple-600/20 active:scale-[0.98]"
              >
                <Check size={18} /> Complete Session
              </button>
            </div>
          ) : (
            <>
              {!isActive || isPaused ? (
                <button
                  onClick={isPaused ? handleResume : startSession}
                  className="w-full sm:w-auto px-10 py-3.5 flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all shadow-md hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]"
                >
                  <Play size={18} className="fill-current" /> {isPaused || isInterrupted ? "Resume Focus" : "Start Session"}
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="w-full sm:w-auto px-10 py-3.5 flex items-center justify-center gap-2 bg-gray-100 border border-transparent text-gray-700 hover:bg-gray-200 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white/90 dark:hover:bg-white/[0.08] font-semibold rounded-xl transition-all active:scale-[0.98]"
                >
                  <Pause size={18} className="fill-current" /> Pause
                </button>
              )}

              {isActive && (
                <div className="flex sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveModal("endNormal")}
                    className="flex-1 sm:flex-none px-6 py-3.5 flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/20 font-semibold rounded-xl transition-all active:scale-[0.98]"
                  >
                    <Square size={16} className="fill-current" /> End
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="hidden sm:block absolute bottom-4 text-[10px] text-gray-400 dark:text-white/30 font-medium z-10">
          Press{" "}
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] rounded text-gray-500 dark:text-white/50 font-mono shadow-sm mx-0.5">
            Space
          </kbd>{" "}
          to play/pause
        </div>
      </div>

      {/* =======================================================================
          UPGRADED GLASSMORPHISM MODALS
      ========================================================================*/}

      {/* 1. Pause Modal */}
      {activeModal === "pause" && (
        <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white dark:bg-[#070707] border border-gray-200 dark:border-white/[0.08] shadow-2xl rounded-3xl p-8 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 flex items-center justify-center mb-6">
              <Pause size={28} className="fill-current" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              Taking a break?
            </h2>
            <p className="text-gray-500 dark:text-white/60 mb-8 text-sm md:text-base">
              You still have <span className="font-bold text-orange-600 dark:text-orange-400">{formatTime(displayTime)}</span> remaining.
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleResume}
                className="w-full px-6 py-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] text-base flex items-center justify-center gap-2"
              >
                <Play size={18} className="fill-current" /> Resume Focus
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  stopSession(false);
                }}
                className="w-full px-6 py-4 bg-transparent text-gray-500 hover:bg-gray-100 dark:text-white/40 dark:hover:bg-white/[0.04] dark:hover:text-white font-semibold rounded-xl transition-all active:scale-[0.98]"
              >
                End Session Early
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. End Normal Session Modal */}
      {activeModal === "endNormal" && (
        <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white dark:bg-[#070707] border border-gray-200 dark:border-white/[0.08] shadow-2xl rounded-3xl p-8 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 flex items-center justify-center mb-6">
              <Square size={24} className="fill-current" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              End Session?
            </h2>
            <p className="text-gray-500 dark:text-white/60 mb-8 text-sm md:text-base">
              You haven't reached your target yet. Are you sure you want to stop?
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => {
                  setActiveModal(null);
                  stopSession(false);
                }}
                className="w-full px-6 py-4 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98] text-base"
              >
                Yes, End Session
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="w-full px-6 py-4 bg-gray-100 border border-transparent text-gray-700 hover:bg-gray-200 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white/90 dark:hover:bg-white/[0.08] font-semibold rounded-xl transition-all active:scale-[0.98]"
              >
                Cancel & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. End Extra Focus Modal */}
      {activeModal === "endExtra" && (
        <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white dark:bg-[#070707] border border-gray-200 dark:border-white/[0.08] shadow-2xl rounded-3xl p-8 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6">
              <Sparkles size={28} className="fill-current" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              Goal Reached
            </h2>
            <p className="text-gray-500 dark:text-white/60 mb-6 text-sm md:text-base">
              You successfully pushed beyond your planned focus time.
            </p>

            <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-5 w-full mb-8 flex flex-col gap-3 text-left shadow-inner dark:shadow-none">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-500 dark:text-white/50">Target Goal:</span>
                <span className="text-gray-900 dark:text-white/90">{Math.floor(initialSessionTime / 60)} min</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-purple-600 dark:text-purple-400">Extra Focus:</span>
                <span className="text-purple-600 dark:text-purple-400">+{formatTime(extraTime)}</span>
              </div>
              <div className="h-px bg-gray-200 dark:bg-white/[0.06] w-full my-1"></div>
              <div className="flex justify-between items-center text-base font-bold">
                <span className="text-gray-900 dark:text-white">Total Time:</span>
                <span className="text-gray-900 dark:text-white">{formatTime(initialSessionTime + extraTime)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => {
                  setActiveModal(null);
                  stopSession(true);
                }}
                className="w-full px-6 py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98] text-base"
              >
                Save Total Time & End
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  stopSession(false); 
                }}
                className="w-full px-6 py-4 bg-transparent border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/60 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] dark:hover:text-white transition-all active:scale-[0.98]"
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