"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useFocusSystem } from "./useFocusSystem";

export default function SessionTimer() {
  const {
    timeRemaining, focusedTime, initialSessionTime,
    isActive, isPaused, mode, sessions,
    isSessionComplete, setIsSessionComplete,
    startSession, pauseSession, stopSession, exitFocusMode,
    setMode, setTimeRemaining, setInitialSessionTime, setActiveTask
  } = useFocusSystem();

  const [smartAlert, setSmartAlert] = useState<string | null>(null);

  useEffect(() => {
    if (isSessionComplete) exitFocusMode();
  }, [isSessionComplete, exitFocusMode]);

  // --- SMART PREDICTIVE INTELLIGENCE ---
  const avgDistractionTime = useMemo(() => {
    let totalSeconds = 0;
    let count = 0;
    sessions.forEach(s => {
      if (s.distractions?.length > 0) {
        const firstDist = (s.distractions[0].timestamp - s.startTime) / 1000;
        if (firstDist > 0) { totalSeconds += firstDist; count++; }
      }
    });
    return count > 0 ? Math.floor(totalSeconds / count) : -1;
  }, [sessions]);

  useEffect(() => {
    if (isActive && avgDistractionTime > 60) {
      if (focusedTime === avgDistractionTime - 60) {
        setSmartAlert("⚠️ Stay sharp! You usually lose focus around this mark.");
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setTimeout(() => setSmartAlert(null), 10000); 
      }
    }
  }, [focusedTime, isActive, avgDistractionTime]);

  useEffect(() => {
    if (isActive && !isPaused && timeRemaining > 0 && timeRemaining < 10) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    }
  }, [timeRemaining, isActive, isPaused]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || isSessionComplete) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!isActive || isPaused) startSession();
        else pauseSession();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isActive, isPaused, isSessionComplete, startSession, pauseSession]);

  // --- FORMATTERS & DYNAMIC STYLES ---
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getModeLabel = () => {
    if (mode === "pomodoro") return "Pomodoro • 25 min";
    if (mode === "deepWork") return "Deep Work • 90 min";
    const mins = Math.floor(initialSessionTime / 60);
    return `Custom • ${mins} min`;
  };

  const getDynamicColor = () => {
    const progressRemaining = initialSessionTime > 0 ? timeRemaining / initialSessionTime : 1; 
    if (progressRemaining > 0.6) return "text-green-500";
    if (progressRemaining > 0.3) return "text-yellow-500";
    if (progressRemaining > 0.15) return "text-orange-500";
    return "text-red-500 animate-pulse scale-105 transition-transform duration-300"; 
  };

  const getStateText = () => {
    if (!isActive) return "Ready to begin";
    if (isPaused) return "Paused – resume to continue";
    if (timeRemaining < 120) return "Finish strong!";
    return "Deep focus in progress";
  };

  // --- PROGRESS RING CALCS ---
  const circleRadius = 110; 
  const circumference = 2 * Math.PI * circleRadius;
  
  const rawProgress = initialSessionTime > 0 
    ? (initialSessionTime - timeRemaining) / initialSessionTime 
    : 0;
  const progress = Math.min(Math.max(rawProgress, 0), 1);
  const strokeDashoffset = circumference * (1 - progress);

  const handleStartBreak = () => {
    setIsSessionComplete(false);
    setMode("custom");
    setTimeRemaining(5 * 60); 
    setInitialSessionTime(5 * 60); 
    setActiveTask("Rest & Recharge");
    setTimeout(() => startSession(), 50);
  };

  const handleDismissCompletion = () => {
    stopSession(false);
    setIsSessionComplete(false);
    exitFocusMode(); 
    if (mode === "pomodoro") {
      setTimeRemaining(25 * 60);
      setInitialSessionTime(25 * 60);
    }
    if (mode === "deepWork") {
      setTimeRemaining(90 * 60);
      setInitialSessionTime(90 * 60);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center py-10 sm:py-12 md:py-16 border rounded-xl transition-all duration-700 relative overflow-hidden ${
      isActive && timeRemaining < 120 && !isPaused
        ? "bg-red-50/10 border-red-200 shadow-[0_0_50px_rgba(239,68,68,0.4)]"
        : isActive && !isPaused 
          ? "bg-green-50/30 border-green-200 shadow-[0_0_40px_rgba(34,197,94,0.1)]" 
          : "bg-white border-gray-200 shadow-sm"
    }`}>
      
      {smartAlert && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-amber-100 border border-amber-300 text-amber-800 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg shadow-lg text-center animate-in fade-in slide-in-from-top-4 z-20 flex items-center justify-center gap-2">
          <span className="animate-bounce">⚡</span> {smartAlert}
        </div>
      )}

      {isSessionComplete && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Session Complete!
          </h2>
          <p className="text-sm text-gray-500 mb-8 max-w-[250px] mx-auto">
            Excellent discipline. Take a moment to recharge.
          </p>
          
          <div className="flex flex-col gap-3 w-full max-w-[220px]">
            <button 
              onClick={handleStartBreak} 
              className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md"
            >
              Start 5m Break
            </button>
            <button 
              onClick={handleDismissCompletion} 
              className="w-full py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 border border-gray-200 active:scale-[0.98] transition-all"
            >
              Done for Now
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-5 md:top-6 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
        {getModeLabel()}
      </div>

      <div className="relative flex items-center justify-center mt-6 mb-8 w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px]">
        
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          <circle cx="50%" cy="50%" r={circleRadius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
          
          {/* 🔥 FIX: The CSS transition logic here prevents the "stuttering" effect */}
          <circle 
            cx="50%" cy="50%" r={circleRadius} 
            stroke="url(#progressGradient)" strokeWidth="8" fill="transparent" 
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" 
            style={{ 
              transformOrigin: "50% 50%",
              transition: isActive && !isPaused ? "stroke-dashoffset 1s linear" : "none" 
            }}
          />
        </svg>

        <div className={`absolute z-10 flex flex-col items-center justify-center transition-colors duration-500 ${getDynamicColor()}`}>
          <div className="text-6xl sm:text-7xl md:text-8xl font-semibold tracking-tighter tabular-nums leading-none">
            {formatTime(timeRemaining)}
          </div>
          
          <div className="text-[11px] sm:text-xs font-medium text-gray-500 mt-3 md:mt-4 flex items-center justify-center gap-2 bg-white/80 px-3 py-1 rounded-full border border-gray-100 shadow-sm">
            <span className={`w-2 h-2 rounded-full transition-colors ${isActive && !isPaused ? "bg-green-500 animate-pulse" : isActive && isPaused ? "bg-orange-500" : "bg-gray-300"}`}></span>
            {getStateText()}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[280px] sm:max-w-none sm:w-auto px-4 sm:px-0 z-10">
        {!isActive || isPaused ? (
          <button onClick={startSession} className="w-full sm:w-auto px-10 py-3.5 sm:py-3 bg-gray-900 text-white text-sm md:text-base font-semibold rounded-xl hover:bg-black transition-all shadow-md active:scale-[0.98]">
            {isPaused ? "▶ Resume Focus" : "▶ Start Session"}
          </button>
        ) : (
          <button onClick={pauseSession} className="w-full sm:w-auto px-10 py-3.5 sm:py-3 bg-orange-100 text-orange-700 border border-orange-200 text-sm md:text-base font-semibold rounded-xl hover:bg-orange-200 transition-all active:scale-[0.98]">
            ⏸ Pause
          </button>
        )}

        {isActive && (
          <div className="flex sm:flex-row gap-3 w-full sm:w-auto">
            <button onClick={() => stopSession(false)} className="flex-1 sm:flex-none px-6 py-3.5 sm:py-3 bg-red-50 text-red-600 border border-red-200 text-sm md:text-base font-semibold rounded-xl hover:bg-red-100 transition-all active:scale-[0.98]">
              ⏹ End
            </button>
            <button onClick={() => { stopSession(false); setTimeout(startSession, 100); }} title="Restart Session" className="px-4 py-3.5 sm:py-3 bg-gray-100 text-gray-600 border border-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] shrink-0">
              ↺
            </button>
          </div>
        )}
      </div>

      <div className="hidden sm:block absolute bottom-4 text-[10px] text-gray-400 font-medium">
        Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-500 font-mono shadow-sm">Space</kbd> to play/pause
      </div>

    </div>
  );
}