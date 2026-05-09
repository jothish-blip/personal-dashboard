"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useFocusSystem } from "../../engine/useFocusSystem";
import { FocusSession } from "../../types/types";

const calculateAvgDistractionTime = (sessions: FocusSession[]): number | null => {
  const { totalSeconds, count } = sessions.reduce(
    (acc, s) => {
      if (s.distractions && s.distractions.length > 0) {
        const firstDist = (s.distractions[0].timestamp - s.startTime) / 1000;
        if (firstDist > 0) {
          acc.totalSeconds += firstDist;
          acc.count++;
        }
      }
      return acc;
    },
    { totalSeconds: 0, count: 0 }
  );

  return count > 0 ? Math.floor(totalSeconds / count) : null;
};

export default function SessionTimer() {
  const {
    timeRemaining, focusedTime, initialSessionTime,
    isActive, isPaused, mode, sessions,
    isSessionComplete, setIsSessionComplete,
    startSession, pauseSession, stopSession, exitFocusMode,
    setMode, setTimeRemaining, setInitialSessionTime, setActiveTask,
    getRemainingTime, currentSession,
    extraTime 
  } = useFocusSystem();

  const [smartAlert, setSmartAlert] = useState<string | null>(null);

  const typedSessions = useMemo(() => sessions as FocusSession[], [sessions]);

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

  const avgDistractionTime = useMemo(() => {
    return calculateAvgDistractionTime(typedSessions);
  }, [typedSessions]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isActive && avgDistractionTime !== null && avgDistractionTime > 60) {
      if (Math.abs(focusedTime - (avgDistractionTime - 60)) < 2) {
        setSmartAlert("⚠️ Stay sharp! You usually lose focus around this mark.");
        
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        
        timeout = setTimeout(() => setSmartAlert(null), 10000); 
      }
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [focusedTime, isActive, avgDistractionTime]);

  const isExtraMode = !!currentSession?.completedAt;

  const displayTime = useMemo(() => {
    if (currentSession?.completedAt) {
      return extraTime; 
    }
    if (currentSession) {
      return getRemainingTime();
    }
    return timeRemaining;
  }, [currentSession, getRemainingTime, timeRemaining, extraTime]);

  useEffect(() => {
    if (isActive && !isPaused && !isExtraMode && displayTime > 0 && displayTime < 10) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    }
  }, [displayTime, isActive, isPaused, isExtraMode]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (isExtraMode) return; // 🔥 Disabled in extra mode
        if (!isActive || isPaused) startSession();
        else pauseSession();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isActive, isPaused, isExtraMode, startSession, pauseSession]);

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
    if (isExtraMode) return "text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.2)]"; 

    const progressRemaining = initialSessionTime > 0 ? displayTime / initialSessionTime : 1; 
    
    if (progressRemaining > 0.6) return "text-green-500";
    if (progressRemaining > 0.3) return "text-yellow-500";
    if (progressRemaining > 0.15) return "text-orange-500";
    return "text-red-500 animate-pulse scale-105 transition-transform duration-300"; 
  };

  const getStateText = () => {
    if (!isActive) return "Ready to begin";
    if (isPaused) return "Paused — your time is frozen";
    if (isExtraMode) return "You're beyond your goal — keep going if it matters"; 
    if (displayTime < 120) return "Finish strong!";
    return "Deep focus in progress";
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
    <div className={`flex flex-col items-center justify-center py-10 sm:py-12 md:py-16 border rounded-xl transition-all duration-700 ease-out relative overflow-hidden ${
      isExtraMode && isActive && !isPaused
        ? "bg-purple-50/10 border-purple-200/50 shadow-[0_0_50px_rgba(168,85,247,0.15)]"
        : isActive && displayTime < 120 && !isPaused && !isExtraMode
          ? "bg-red-50/10 border-red-200 shadow-[0_0_50px_rgba(239,68,68,0.4)]"
          : isActive && !isPaused 
            ? "bg-green-50/30 border-green-200 shadow-[0_0_40px_rgba(34,197,94,0.1)]" 
            : "bg-white border-gray-200 shadow-sm"
    }`}>
      
      {smartAlert && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-amber-100 border border-amber-300 text-amber-800 text-xs sm:text-sm font-medium px-4 py-2 rounded-lg shadow-lg text-center animate-in fade-in slide-in-from-top-4 z-20 flex items-center justify-center gap-2">
          <span className="animate-bounce">⚡</span> {smartAlert}
        </div>
      )}

      <div className="absolute top-5 md:top-6 text-[10px] md:text-xs font-medium text-gray-400/80 uppercase tracking-widest flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
        {getModeLabel()}
      </div>

      {isExtraMode && (
        <div className="absolute top-14 mt-1 flex flex-col items-center z-10 transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-2">
          <div className="text-purple-600 bg-purple-50/80 px-3 py-1.5 rounded-full border border-purple-200/50 text-xs sm:text-sm font-medium shadow-sm flex items-center gap-1.5">
            🔥 You chose to keep going
          </div>
          <div className="text-[10px] text-purple-400/80 mt-1.5 font-medium text-center leading-tight">
            You pushed beyond your limit — strong focus.<br/>
            (This time won't count toward your initial goal)
          </div>
        </div>
      )}

      {isInterrupted && !isExtraMode && (
        <div className="absolute top-14 mt-1 text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200 text-xs sm:text-sm font-medium z-10 shadow-sm animate-pulse">
          ✔️ Session interrupted — resume where you left
        </div>
      )}

      <div className="relative flex items-center justify-center mt-6 mb-8 w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px]">
        
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            
            <linearGradient id="extraModeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
          </defs>

          <circle cx="50%" cy="50%" r={circleRadius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100/50" />
          
          <circle 
            cx="50%" cy="50%" r={circleRadius} 
            stroke={isExtraMode ? "url(#extraModeGradient)" : "url(#progressGradient)"} 
            strokeWidth="8" fill="transparent" 
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" 
            className={isExtraMode ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all duration-1000 ease-out" : "transition-all duration-1000 ease-linear"}
            style={{ 
              transformOrigin: "50% 50%"
            }}
          />
        </svg>

        <div className={`absolute z-10 flex flex-col items-center justify-center transition-colors duration-500 ease-out ${getDynamicColor()}`}>
          <div className="text-6xl sm:text-7xl md:text-8xl font-semibold tracking-tighter tabular-nums leading-none">
            {formatTime(displayTime)}
          </div>
          
          {isExtraMode && (
            <span className="text-[10px] text-purple-400 mt-2 uppercase tracking-widest font-semibold opacity-80">
              Extra Time
            </span>
          )}
          
          <div className="text-[11px] sm:text-xs font-medium text-gray-500/80 mt-3 md:mt-4 flex items-center justify-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
            <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              isActive && !isPaused && isExtraMode ? "bg-purple-500" 
              : isActive && !isPaused ? "bg-green-500 animate-pulse" 
              : isActive && isPaused ? "bg-orange-400" 
              : "bg-gray-300"
            }`}></span>
            {getStateText()}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[280px] sm:max-w-none sm:w-auto px-4 sm:px-0 z-10">
        {isExtraMode ? (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
            <button
              onClick={() => {
                if(confirm("Are you sure you want to stop your extra focus?")) stopSession(true);
              }}
              className="w-full sm:w-auto px-10 py-3.5 bg-red-50 text-red-600 border border-red-200 text-sm md:text-base font-medium rounded-xl hover:bg-red-100 transition-all duration-300 ease-out active:scale-[0.98]"
            >
              ⏹ Stop Extra Focus
            </button>
            <button
              onClick={() => {
                if(confirm("Count this extra time and end session?")) stopSession(true);
              }}
              className="w-full sm:w-auto px-10 py-3.5 bg-purple-50 text-purple-700 border border-purple-200 text-sm md:text-base font-medium rounded-xl hover:bg-purple-100 transition-all duration-300 ease-out active:scale-[0.98] shadow-sm"
            >
              ✔ Count This Time
            </button>
          </div>
        ) : (
          <>
            {!isActive || isPaused ? (
              <button
                onClick={startSession}
                className="w-full sm:w-auto px-10 py-3.5 bg-gray-900 text-white text-sm md:text-base font-medium rounded-xl hover:bg-black transition-all duration-300 ease-out shadow-md active:scale-[0.98]"
              >
                {isPaused || isInterrupted ? "▶ Resume Focus" : "▶ Start Session"}
              </button>
            ) : (
              <button
                onClick={pauseSession}
                className="w-full sm:w-auto px-10 py-3.5 bg-orange-50 text-orange-700 border border-orange-200 text-sm md:text-base font-medium rounded-xl hover:bg-orange-100 transition-all duration-300 ease-out active:scale-[0.98]"
              >
                ⏸ Pause
              </button>
            )}

            {isActive && (
              <div className="flex sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={() => stopSession(false)}
                  className="flex-1 sm:flex-none px-6 py-3.5 bg-red-50 text-red-600 border border-red-200 text-sm md:text-base font-medium rounded-xl hover:bg-red-100 transition-all duration-300 ease-out active:scale-[0.98]"
                >
                  ⏹ End
                </button>
                <button 
                  onClick={() => { stopSession(false); setTimeout(startSession, 100); }} 
                  title="Restart Session" 
                  className="px-4 py-3.5 bg-gray-50 text-gray-500 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-100 transition-all duration-300 ease-out active:scale-[0.98] shrink-0"
                >
                  ↺
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="hidden sm:block absolute bottom-4 text-[10px] text-gray-400/60 font-medium z-10">
        Press <kbd className="px-1.5 py-0.5 bg-gray-50 border border-gray-200 rounded text-gray-400 font-mono shadow-sm mx-0.5">Space</kbd> to play/pause
      </div>

    </div>
  );
}