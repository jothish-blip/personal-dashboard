"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { FocusState, FocusMode, FocusSession, ActiveSession, Distraction } from "./types";

const FocusContext = createContext<FocusState | undefined>(undefined);

const MODE_DURATIONS = {
  pomodoro: 25 * 60,
  deepWork: 90 * 60,
};

export function FocusProvider({ children }: { children: ReactNode }) {
  // --- CONFIG STATE ---
  const [mode, setMode] = useState<FocusMode>("pomodoro");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  // --- TIMER STATE ---
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(MODE_DURATIONS.pomodoro);
  const [initialSessionTime, setInitialSessionTime] = useState(MODE_DURATIONS.pomodoro);
  const [focusedTime, setFocusedTime] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  
  // --- DATA MODELS ---
  const [currentSession, setCurrentSession] = useState<ActiveSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<FocusSession[]>([]);
  
  // --- UI & SYSTEM STATE ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  
  const lastTickRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmPlayedRef = useRef(false);

  // ✅ SCORING LOGIC
  const calculateFocusScore = (duration: number, distractions: Distraction[]) => {
    const distractionPenalty = distractions.length * 10;
    return Math.max(0, Math.round(100 - distractionPenalty + (Math.min(duration / 60, 100) * 0.2)));
  };

  // ✅ SW NOTIFICATION TRIGGER
  const triggerSWNotification = (title: string, body: string) => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({
          type: "SHOW_FOCUS_NOTIFICATION",
          title,
          body
        });
      });
    }
  };

  const exitFocusMode = () => {
    setIsFocusMode(false);
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const enterFocusMode = () => {
    setIsFocusMode(true);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  };

  // --- 🔥 CROSS-TAB SYNC LOGIC (HARD RESET LAYER) ---
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (!e.newValue) return;

      // 1. Remote Stop Signal
      if (e.key === "focus_stop_signal") {
        try {
          const data = JSON.parse(e.newValue);
          if (data.type === "STOP") {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            alarmPlayedRef.current = false;
            setIsSessionComplete(false);
            setIsActive(false);
            setCurrentSession(null);
            setFocusedTime(0);
            setTotalElapsed(0);
            exitFocusMode();
          }
        } catch (err) {}
      }
      
      // 2. Remote Completion Signal
      if (e.key === "focus_complete_signal") {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        alarmPlayedRef.current = false;
        setIsSessionComplete(true);
        setIsActive(false);
        setCurrentSession(null);
        exitFocusMode();
      }
    };

    window.addEventListener("storage", handleStorageSync);
    return () => window.removeEventListener("storage", handleStorageSync);
  }, []);

  const stopSession = (isNatural = false) => {
    // 🔥 FORCE STOP AUDIO LOCALLY
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    alarmPlayedRef.current = false;

    if (!currentSession) return;

    setIsActive(false);
    setIsPaused(false);
    lastTickRef.current = null;
    exitFocusMode();

    // 🔥 CROSS-TAB BROADCAST
    if (isNatural) {
      localStorage.removeItem("focus_complete_signal");
      localStorage.setItem("focus_complete_signal", JSON.stringify({ time: Date.now() }));
    } else {
      localStorage.removeItem("focus_stop_signal");
      localStorage.setItem("focus_stop_signal", JSON.stringify({
        time: Date.now(),
        type: "STOP"
      }));
    }

    const endTime = Date.now();
    const score = calculateFocusScore(focusedTime, currentSession.distractions);

    const completedSession: FocusSession = {
      ...currentSession,
      endTime,
      durationSeconds: focusedTime,
      totalSessionSeconds: totalElapsed,
      date: new Date(currentSession.startTime).toISOString(),
      score,
    };

    setSessionHistory((prev) => {
        const alreadySaved = prev.some(s => s.id === completedSession.id);
        if (!alreadySaved) return [completedSession, ...prev];
        return prev;
    });

    setCurrentSession(null);
    setFocusedTime(0);
    setTotalElapsed(0);
    
    if (isNatural) {
      setIsSessionComplete(true);
    } else {
      if (mode === "pomodoro") setTimeRemaining(MODE_DURATIONS.pomodoro);
      if (mode === "deepWork") setTimeRemaining(MODE_DURATIONS.deepWork);
    }
  };

  // --- PERSISTENCE & RECOVERY INIT ---
  useEffect(() => {
    const savedHistory = localStorage.getItem("focus_sessions");
    if (savedHistory) {
      try { setSessionHistory(JSON.parse(savedHistory)); } 
      catch (e) { console.error("History parse fail", e); }
    }

    const savedActive = localStorage.getItem("focus_active_session");
    if (savedActive) {
      try {
        const data = JSON.parse(savedActive);
        setCurrentSession(data.currentSession);
        setInitialSessionTime(data.initialSessionTime);
        setMode(data.mode);
        setIsPaused(data.isPaused);
        setActiveTaskId(data.currentSession?.taskId || null);

        if (data.isPaused) {
          setIsActive(true);
          setTimeRemaining(data.timeRemaining);
          setFocusedTime(data.focusedTime || 0);
          setTotalElapsed(data.totalElapsed || 0);
        } else {
          const now = Date.now();
          const timeAwaySeconds = Math.round((now - data.lastTickTime) / 1000);
          const newRemaining = Math.max(0, data.timeRemaining - timeAwaySeconds);
          const actualTimeSpent = Math.max(0, data.timeRemaining - newRemaining);

          setTimeRemaining(newRemaining);
          setFocusedTime((data.focusedTime || 0) + actualTimeSpent);
          setTotalElapsed((data.totalElapsed || 0) + timeAwaySeconds);

          if (newRemaining <= 0) {
            setIsSessionComplete(true);
            setIsActive(false);
            
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.muted = false;
                audioRef.current.volume = 1.0;
                audioRef.current.play().catch(() => {});
              }
            }, 500);

            const finalScore = calculateFocusScore((data.focusedTime || 0) + actualTimeSpent, data.currentSession.distractions || []);
            setSessionHistory(prev => {
              if (prev.some(s => s.id === data.currentSession.id)) return prev;
              return [{
                ...data.currentSession,
                endTime: now,
                durationSeconds: (data.focusedTime || 0) + actualTimeSpent,
                totalSessionSeconds: (data.totalElapsed || 0) + timeAwaySeconds,
                date: new Date(data.currentSession.startTime).toISOString(),
                score: finalScore,
              }, ...prev];
            });
            setCurrentSession(null);
            localStorage.removeItem("focus_active_session");
            exitFocusMode();
          } else {
            setIsActive(true);
          }
        }
      } catch (e) {
        localStorage.removeItem("focus_active_session");
      }
    }
    
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/alarm.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 1.0;
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
    setIsLoaded(true);
  }, []);

  // --- CONTINUOUS SAVE STATE ---
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("focus_sessions", JSON.stringify(sessionHistory));
      if (isActive && currentSession) {
        localStorage.setItem("focus_active_session", JSON.stringify({
          currentSession,
          timeRemaining,
          initialSessionTime,
          isPaused,
          mode,
          focusedTime,
          totalElapsed,
          lastTickTime: Date.now() 
        }));
      } else if (!isActive && !isSessionComplete) {
        localStorage.removeItem("focus_active_session");
      }
    }
  }, [sessionHistory, currentSession, timeRemaining, initialSessionTime, isPaused, mode, isActive, isLoaded, focusedTime, totalElapsed, isSessionComplete]);

  // --- HARDWARE EVENT TRIGGERS ---
  useEffect(() => {
    if (isSessionComplete && !alarmPlayedRef.current) {
      alarmPlayedRef.current = true;
      if (audioRef.current) {
        audioRef.current.volume = 1.0;
        audioRef.current.play().catch(() => {});
      }
      if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
      triggerSWNotification("Focus Complete 🎉", "Excellent discipline. Your session has ended.");
    } else if (!isSessionComplete) {
      alarmPlayedRef.current = false; 
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isSessionComplete]);

  // --- TIMER INTERVAL ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      if (!lastTickRef.current) lastTickRef.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const deltaSeconds = Math.round((now - lastTickRef.current!) / 1000);
        if (deltaSeconds >= 1) {
          lastTickRef.current = now;
          setTotalElapsed((prev) => prev + deltaSeconds);
          if (!isPaused) {
            setFocusedTime((prev) => prev + deltaSeconds);
            setTimeRemaining((prev) => Math.max(0, prev - deltaSeconds));
          }
        }
      }, 1000);
    } else {
      lastTickRef.current = null;
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  useEffect(() => {
    if (isActive && !isPaused && timeRemaining <= 0) {
      stopSession(true); 
    }
  }, [timeRemaining, isActive, isPaused]);

  useEffect(() => {
    const handleFsChange = () => { if (!document.fullscreenElement) setIsFocusMode(false); };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // --- ✅ HANDLERS DEFINITION ---
  const setModeHandler = (newMode: FocusMode) => {
    if (isActive) return;
    setMode(newMode);
    if (newMode === "pomodoro") setTimeRemaining(MODE_DURATIONS.pomodoro);
    if (newMode === "deepWork") setTimeRemaining(MODE_DURATIONS.deepWork);
  };

  const startSession = () => {
    setIsActive(true);
    setIsPaused(false);
    setIsSessionComplete(false);
    lastTickRef.current = Date.now();
    setCurrentSession({
      id: crypto.randomUUID(),
      taskId: activeTaskId,
      taskTitle: activeTaskId || "Untitled Focus",
      mode,
      startTime: Date.now(),
      distractions: [],
    });
    enterFocusMode();
  };

  return (
    <FocusContext.Provider
      value={{
        isActive, isPaused, mode, timeRemaining, initialSessionTime, focusedTime,
        totalElapsed, activeTaskId, isFocusMode,
        currentSession,
        distractions: currentSession?.distractions || [],
        sessions: sessionHistory,
        isSessionComplete, 
        setIsSessionComplete, 
        enterFocusMode, exitFocusMode,
        setTimeRemaining, 
        setMode: setModeHandler, // ✅ FIXED: setModeHandler is now correctly scoped
        setActiveTask: setActiveTaskId,
        startSession, 
        pauseSession: () => setIsPaused(true), 
        stopSession, 
        addDistraction: (reason: string) => {
          if (!currentSession) return;
          setCurrentSession((prev) => ({
            ...prev!,
            distractions: [...prev!.distractions, { id: crypto.randomUUID(), reason, timestamp: Date.now() }],
          }));
        },
        undoDistraction: () => {
          if (!currentSession || !currentSession.distractions.length) return;
          setCurrentSession((prev) => ({
            ...prev!,
            distractions: prev!.distractions.slice(0, -1),
          }));
        },
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export const useFocusSystem = () => {
  const context = useContext(FocusContext);
  if (!context) throw new Error("useFocusSystem must be used within FocusProvider");
  return context;
};