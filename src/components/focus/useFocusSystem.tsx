"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { FocusState, FocusMode, FocusSession, ActiveSession, Distraction } from "./types";
import { useNotificationSystem } from '@/notifications/useNotificationSystem'; 
import { getSupabaseClient } from "@/lib/supabase"; 

const FocusContext = createContext<FocusState | undefined>(undefined);

const MODE_DURATIONS = {
  pomodoro: 25 * 60,
  deepWork: 90 * 60,
};

// Strict Database Types
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
  const supabase = getSupabaseClient();
    // ✅ FIRST declare user
  const [currentUser, setCurrentUser] = useState<any>(null);

  // ✅ THEN use it
  const { addNotification } = useNotificationSystem(currentUser?.id);

  // Single Reusable User Fetcher (for non-effect callbacks)
  const getUser = async () => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  };

  // --- CONFIG STATE ---
  const [mode, setMode] = useState<FocusMode>("pomodoro");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  // --- TIMER STATE (Internal) ---
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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmPlayedRef = useRef(false);
  const isInitializing = useRef(false);

  // 🔥 CLEAN DERIVED VALUES
  const getElapsedTime = useCallback(() => {
    if (!currentSession) return 0;
    return Math.floor((Date.now() - currentSession.startTime) / 1000);
  }, [currentSession]);

  // ✅ FIX 1: Allow custom time to be respected instead of defaulting to 90 min
  const getRemainingTime = useCallback(() => {
    if (!currentSession) return initialSessionTime;

    let total = initialSessionTime;
    if (currentSession.mode === "pomodoro") total = MODE_DURATIONS.pomodoro;
    else if (currentSession.mode === "deepWork") total = MODE_DURATIONS.deepWork;

    const elapsed = getElapsedTime();
    return Math.max(0, total - elapsed);
  }, [currentSession, initialSessionTime, getElapsedTime]);

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

  // 🔹 FETCH HISTORY FUNCTION
  const fetchSessionsFromDB = useCallback(async () => {
    const user = await getUser();
    if (!user || !supabase) return;

    // 1. Fetch History
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user.id)
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

    // 2. Fetch Active Session (Safety Net)
    const { data: activeData } = await supabase
      .from('focus_active_sessions')
      .select('session')
      .eq('user_id', user.id)
      .maybeSingle();

    if (activeData?.session) {
      const remoteSession = activeData.session;
      setCurrentSession(remoteSession);
      setIsActive(true);
      setMode(remoteSession.mode);
      setIsPaused(false); 
      
      // ✅ FIX 2: Allow custom time to be calculated correctly when pulling from DB
      let total = initialSessionTime;
      if (remoteSession.mode === 'pomodoro') total = MODE_DURATIONS.pomodoro;
      else if (remoteSession.mode === 'deepWork') total = MODE_DURATIONS.deepWork;

      const elapsed = Math.floor((Date.now() - remoteSession.startTime) / 1000);
      setTimeRemaining(Math.max(0, total - elapsed));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, initialSessionTime]); // Added initialSessionTime as dependency for the fix

  // 🔹 SYNC HISTORY TO DB
  const syncSessionToDB = async (session: FocusSession, isCompleted: boolean) => {
    try {
      const user = await getUser();
      if (!user || !supabase) return;

      await supabase.from('focus_sessions').upsert({
        id: session.id,
        user_id: user.id,
        task_id: session.taskId || null,
        duration: session.durationSeconds,
        completed: isCompleted,
        started_at: new Date(session.startTime).toISOString()
      }, { onConflict: 'id' });
    } catch (err) {
      console.error("Focus DB Sync Exception:", err);
    }
  };

  // 🔹 AUTHENTICATION STATE LISTENER
  useEffect(() => {
    if (!supabase) return;

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const user = session?.user ?? null;
        setCurrentUser(user);

        if (user) {
          fetchSessionsFromDB(); // 🔥 reload
        } else {
          setCurrentSession(null);
          setSessionHistory([]);
          setIsActive(false);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase, fetchSessionsFromDB]);

  // 🔹 TWO-LAYER REALTIME SYNC (History + Active)
  useEffect(() => {
    if (!supabase || !currentUser) return;

    const channel = supabase
      .channel(`focus-${currentUser.id}`)
      
      // Layer 1: History Log Sync
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "focus_sessions",
          filter: `user_id=eq.${currentUser.id}`
        },
        () => {
          fetchSessionsFromDB();
        }
      )
      
      // Layer 2: Active Session Sync
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "focus_active_sessions",
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload: any) => {
          if (payload.eventType === "DELETE") {
            setIsActive(false);
            setCurrentSession(null);
            exitFocusMode();
          } else if (payload.new?.session) {
            const session = payload.new.session;
            setCurrentSession(session);
            setIsActive(true);
            setMode(session.mode);
            setIsPaused(false);

            // ✅ FIX 3: Respect custom time in Realtime sync
            let total = initialSessionTime;
            if (session.mode === "pomodoro") total = MODE_DURATIONS.pomodoro;
            else if (session.mode === "deepWork") total = MODE_DURATIONS.deepWork;

            const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
            setTimeRemaining(Math.max(0, total - elapsed));
          }
        }
      )
      // 🔥 subscribe MUST BE LAST
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUser, fetchSessionsFromDB, initialSessionTime]); // Added initialSessionTime

  // 🔹 15-SECOND PERIODIC SYNC (Fallback Safety Net)
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        fetchSessionsFromDB();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchSessionsFromDB]);

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

  // 🔹 STOP SESSION (Updates Local & DB)
  const stopSession = async (isNatural = false) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    alarmPlayedRef.current = false;

    if (!currentSession) return;

    // Grab exactly how long the user was focusing based on DB timestamps
    const finalElapsed = getElapsedTime();

    setIsActive(false);
    setIsPaused(false);
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
    const score = calculateFocusScore(finalElapsed, currentSession.distractions);

    const completedSession: FocusSession = {
      ...currentSession,
      endTime,
      durationSeconds: finalElapsed,
      totalSessionSeconds: finalElapsed,
      date: new Date(currentSession.startTime).toISOString(),
      score,
    };

    setSessionHistory((prev) => {
        const alreadySaved = prev.some(s => s.id === completedSession.id);
        if (!alreadySaved) return [completedSession, ...prev];
        return prev;
    });

    syncSessionToDB(completedSession, isNatural);

    const user = await getUser();
    if (user && supabase) {
      await supabase.from("focus_active_sessions").delete().eq("user_id", user.id);
    }

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
      await fetchSessionsFromDB();

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

  // 🔥 SIMPLIFIED TIMESTAMP-BASED TICK ENGINE
  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      // 1. Calculate strictly from timestamps
      const rem = getRemainingTime();
      const elapsed = getElapsedTime();

      // 2. Sync internal React states for consumers
      setTimeRemaining(rem);
      setFocusedTime(elapsed);
      setTotalElapsed(elapsed);

      // 3. Auto Stop Trigger
      if (rem <= 0) {
        stopSession(true); 
      }
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPaused, getRemainingTime, getElapsedTime]);

  useEffect(() => {
    const handleFsChange = () => { if (!document.fullscreenElement) setIsFocusMode(false); };
    if (typeof document !== "undefined") {
      document.addEventListener("fullscreenchange", handleFsChange);
      return () => document.removeEventListener("fullscreenchange", handleFsChange);
    }
  }, []);

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

  // 🔹 START SESSION (Updates Local & DB)
  const startSession = async () => {
    const user = await getUser();
    if (!user || !supabase) {
      addNotification('system', 'Auth Error', 'User not authenticated.', 'high');
      return;
    }

    const { data: existing } = await supabase
      .from("focus_active_sessions")
      .select("session")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.session) {
      return; // Already running
    }

    setIsActive(true);
    setIsPaused(false);
    setIsSessionComplete(false);
    
    setInitialSessionTime(timeRemaining);
    
    const newSession = {
      id: crypto.randomUUID(),
      taskId: activeTaskId,
      taskTitle: activeTaskId || "Untitled Focus",
      mode,
      startTime: Date.now(),
      distractions: [],
    };
    
    setCurrentSession(newSession);
    enterFocusMode();

    if (acquireLock('focus_start_alert', 5000)) {
      addNotification('focus', 'Deep Work Initiated 🧠', 'Distractions suppressed. Maintain your focus.', 'low', '/focus');
    }

    // Upsert Active Session to DB
    await supabase.from("focus_active_sessions").upsert({
      user_id: user.id,
      session: newSession
    });
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
        getElapsedTime,     // Exposing Derived Elapsed
        getRemainingTime,   // Exposing Derived Remaining
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