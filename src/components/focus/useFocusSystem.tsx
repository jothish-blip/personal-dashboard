"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { FocusState, FocusMode, FocusSession, ActiveSession, Distraction } from "./types";
import { useNotificationSystem } from '@/notifications/useNotificationSystem'; 
import { getSupabaseClient } from "@/lib/supabase"; 

const FocusContext = createContext<FocusState | undefined>(undefined);

const MODE_DURATIONS = {
  pomodoro: 25 * 60,
  deepWork: 90 * 60,
};

// 🔥 FIX 5: Strict Database Types
type DBFocusSession = {
  id: string;
  user_id: string;
  task_id: string | null;
  duration: number;
  completed: boolean;
  started_at: string;
};

// Persistent Locks (Prevents Notification Spam)
const acquireLock = (lockKey: string, cooldownMs: number): boolean => {
  if (typeof window === "undefined") return false;
  const last = Number(localStorage.getItem(lockKey) || 0);
  const now = Date.now();
  if (now - last > cooldownMs) {
    localStorage.setItem(lockKey, now.toString());
    return true;
  }
  return false;
};

export function FocusProvider({ children }: { children: ReactNode }) {
  const { addNotification } = useNotificationSystem();

  // 🔥 FIX 3: Initialize Supabase once
  const supabase = getSupabaseClient();

  // 🔥 FIX 2: Single Reusable User Fetcher
  const getUser = async () => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  };

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
  const isInitializing = useRef(false);

  // ✅ SCORING LOGIC
  const calculateFocusScore = (duration: number, distractions: Distraction[]) => {
    const distractionPenalty = distractions.length * 10;
    return Math.max(0, Math.round(100 - distractionPenalty + (Math.min(duration / 60, 100) * 0.2)));
  };

  const exitFocusMode = () => {
    setIsFocusMode(false);
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const enterFocusMode = () => {
    setIsFocusMode(true);
    if (typeof document !== 'undefined' && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  };

  // 🔥 FIX 6: Use Upsert to prevent duplicate entries
  const syncSessionToDB = async (session: FocusSession, isCompleted: boolean) => {
    try {
      const user = await getUser();
      if (!user || !supabase) return;

      const { error } = await supabase.from('focus_sessions').upsert({
        id: session.id,
        user_id: user.id,
        task_id: session.taskId || null,
        duration: session.durationSeconds,
        completed: isCompleted,
        started_at: new Date(session.startTime).toISOString()
      }, { onConflict: 'id' });

      if (error) console.error("Focus DB Sync Error:", error);
    } catch (err) {
      console.error("Focus DB Sync Exception:", err);
    }
  };

  // --- 🔥 FIX 4: REALTIME SYNC ---
  useEffect(() => {
    if (!supabase) return;

    let channel: any;

    const setupRealtime = async () => {
      const user = await getUser();
      if (!user) return;

      channel = supabase
        .channel("focus-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "focus_sessions",
            filter: `user_id=eq.${user.id}` // DB-level realtime filtering
          },
          async () => {
            // When a change happens, fetch the updated list
            const { data, error } = await supabase
              .from("focus_sessions")
              .select("*")
              .eq("user_id", user.id)
              .order("started_at", { ascending: false })
              .limit(30);

            if (data && !error) {
              const mappedHistory: FocusSession[] = (data as DBFocusSession[]).map(row => ({
                id: row.id,
                taskId: row.task_id,
                taskTitle: row.task_id || "Archived Focus",
                mode: "pomodoro",
                startTime: new Date(row.started_at).getTime(),
                endTime: new Date(row.started_at).getTime() + (row.duration * 1000),
                distractions: [],
                durationSeconds: row.duration,
                totalSessionSeconds: row.duration,
                date: new Date(row.started_at).toISOString(),
                score: row.completed ? 100 : 50,
              }));
              setSessionHistory(mappedHistory);
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- CROSS-TAB SYNC LOGIC (HARD RESET LAYER) ---
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (!e.newValue) return;

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

    if (isNatural) {
      localStorage.removeItem("focus_complete_signal");
      localStorage.setItem("focus_complete_signal", JSON.stringify({ time: Date.now() }));
    } else {
      localStorage.removeItem("focus_stop_signal");
      localStorage.setItem("focus_stop_signal", JSON.stringify({ time: Date.now(), type: "STOP" }));

      if (acquireLock('focus_abort_alert', 5000)) {
        addNotification('focus', 'Session Aborted ⚠️', 'Focus broken before completion. Regroup and try again.', 'high', '/focus');
      }
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

    // 🔥 SAVE TO DATABASE (Now uses Upsert)
    syncSessionToDB(completedSession, isNatural);

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
    if (isInitializing.current || typeof window === "undefined") return;
    isInitializing.current = true;

    const init = async () => {
      // 1. Fetch historical sessions from Supabase
      try {
        const user = await getUser();
        if (user && supabase) {
          const { data, error } = await supabase
            .from('focus_sessions')
            .select('*')
            .eq('user_id', user.id) // 🔥 FIX 1: Filter explicitly by User ID
            .order('started_at', { ascending: false })
            .limit(30);

          if (data && !error) {
            const mappedHistory: FocusSession[] = (data as DBFocusSession[]).map(row => ({
              id: row.id,
              taskId: row.task_id,
              taskTitle: row.task_id || "Archived Focus", 
              mode: "pomodoro",
              startTime: new Date(row.started_at).getTime(),
              endTime: new Date(row.started_at).getTime() + (row.duration * 1000),
              distractions: [], 
              durationSeconds: row.duration,
              totalSessionSeconds: row.duration,
              date: new Date(row.started_at).toISOString(),
              score: row.completed ? 100 : 50,
            }));
            setSessionHistory(mappedHistory);
          }
        }
      } catch (err) {
        console.error("Failed to fetch DB focus history", err);
      }

      // 2. Recover Active Timer from LocalStorage
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
              
              const recoveredSession = {
                ...data.currentSession,
                endTime: now,
                durationSeconds: (data.focusedTime || 0) + actualTimeSpent,
                totalSessionSeconds: (data.totalElapsed || 0) + timeAwaySeconds,
                date: new Date(data.currentSession.startTime).toISOString(),
                score: finalScore,
              };

              setSessionHistory(prev => {
                if (prev.some(s => s.id === data.currentSession.id)) return prev;
                return [recoveredSession, ...prev];
              });

              syncSessionToDB(recoveredSession, true);
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
      
      audioRef.current = new Audio("/sounds/alarm.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 1.0;
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
      
      setIsLoaded(true);
    };

    init();

    return () => {
      isInitializing.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- CONTINUOUS SAVE STATE ---
  useEffect(() => {
    if (isLoaded) {
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
  }, [currentSession, timeRemaining, initialSessionTime, isPaused, mode, isActive, isLoaded, focusedTime, totalElapsed, isSessionComplete]);

  // --- HARDWARE EVENT TRIGGERS ---
  useEffect(() => {
    if (isSessionComplete && !alarmPlayedRef.current) {
      alarmPlayedRef.current = true;
      
      if (audioRef.current) {
        audioRef.current.volume = 1.0;
        audioRef.current.play().catch(() => {});
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
      
      if (acquireLock('focus_complete_alert', 5000)) {
        addNotification(
          'focus', 
          'Focus Complete 🎉', 
          'Excellent discipline. Your session has ended. Time to reflect.', 
          'high',
          '/focus'
        );
      }
    } else if (!isSessionComplete) {
      alarmPlayedRef.current = false; 
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isSessionComplete, addNotification]);

  // --- TIMER DRIFT LOGIC ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      if (!lastTickRef.current) lastTickRef.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const deltaSeconds = (now - lastTickRef.current!) / 1000;
        
        if (deltaSeconds >= 1) {
          lastTickRef.current = now;
          const delta = Math.floor(deltaSeconds);
          
          setTotalElapsed((prev) => prev + delta);
          if (!isPaused) {
            setFocusedTime((prev) => prev + delta);
            setTimeRemaining((prev) => Math.max(0, prev - delta));
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, isActive, isPaused]);

  useEffect(() => {
    const handleFsChange = () => { if (!document.fullscreenElement) setIsFocusMode(false); };
    if (typeof document !== "undefined") {
      document.addEventListener("fullscreenchange", handleFsChange);
      return () => document.removeEventListener("fullscreenchange", handleFsChange);
    }
  }, []);

  // --- MODE CHANGE SYNC ---
  const setModeHandler = (newMode: FocusMode) => {
    if (isActive) return;
    setMode(newMode);
    if (newMode === "pomodoro") {
      setTimeRemaining(MODE_DURATIONS.pomodoro);
      setInitialSessionTime(MODE_DURATIONS.pomodoro);
    }
    if (newMode === "deepWork") {
      setTimeRemaining(MODE_DURATIONS.deepWork);
      setInitialSessionTime(MODE_DURATIONS.deepWork);
    }
  };

  // --- START SESSION LOCK ---
  const startSession = () => {
    setIsActive(true);
    setIsPaused(false);
    setIsSessionComplete(false);
    
    setInitialSessionTime(timeRemaining);
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

    if (acquireLock('focus_start_alert', 5000)) {
      addNotification('focus', 'Deep Work Initiated 🧠', 'Distractions suppressed. Maintain your focus.', 'low', '/focus');
    }
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
        setInitialSessionTime, 
        setMode: setModeHandler, 
        setActiveTask: setActiveTaskId,
        startSession, 
        pauseSession: () => {
          setIsPaused(true);
          if (acquireLock('focus_pause_alert', 5000)) {
            addNotification('focus', 'Session Paused ⏸️', 'Momentum halted. Return as soon as possible.', 'medium', '/focus');
          }
        }, 
        stopSession, 
        addDistraction: (reason: string) => {
          if (!currentSession) return;
          setCurrentSession((prev) => ({
            ...prev!,
            distractions: [...prev!.distractions, { id: crypto.randomUUID(), reason, timestamp: Date.now() }],
          }));
          if (acquireLock('focus_distraction_alert', 2000)) {
            addNotification('focus', 'Distraction Logged 📝', 'Acknowledged. Now return your attention to the task immediately.', 'low', '/focus');
          }
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