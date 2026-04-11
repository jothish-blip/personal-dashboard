"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { FocusState, FocusMode, FocusSession, ActiveSession, Distraction } from "./types";
import { useNotificationSystem } from '@/notifications/useNotificationSystem'; 
import { getSupabaseClient } from "@/lib/supabase"; 

// 🔥 IMPROVEMENT 5: Type your context properly
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
  extra_duration?: number;
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

// 🔥 IMPROVEMENT 1: Create mapper function (clean architecture)
const mapDBSessionToFocusSession = (row: DBFocusSession): FocusSession => {
  const startTime = new Date(row.started_at).getTime();
  const duration = row.duration;
  const extra = row.extra_duration || 0;

  return {
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.task_id || "Archived Focus",
    // 🔥 IMPROVEMENT 6: Avoid magic defaults where possible
    mode: (row as any).mode ?? "pomodoro", 
    startTime,
    endTime: startTime + duration * 1000,
    
    // 🔥 REQUIRED: Added missing fields
    initialDuration: duration,
    distractions: [],
    durationSeconds: duration,
    totalSessionSeconds: duration,
    extraDuration: extra,
    actualDuration: duration + extra,
    date: new Date(row.started_at).toISOString(),
    score: row.completed ? 100 : 50,
    distractionCount: 0,
    topDistraction: null,
    avgDistractionGap: 0,
  };
};

export function FocusProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { addNotification } = useNotificationSystem(currentUser?.id);

  // Single Reusable User Fetcher
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
  const [extraTime, setExtraTime] = useState(0);
  
  // --- DATA MODELS ---
  // 🔥 IMPROVEMENT 2: Fix 'any' usage
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

  const getRemainingTime = useCallback(() => {
    if (!currentSession) return initialSessionTime;
    const elapsed = getElapsedTime();
    return Math.max(0, initialSessionTime - elapsed);
  }, [currentSession, initialSessionTime, getElapsedTime]);

  const getExtraTime = useCallback(() => {
    if (!currentSession?.extraStartTime) return 0;
    return Math.floor((Date.now() - currentSession.extraStartTime) / 1000);
  }, [currentSession]);

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
  const fetchSessionsFromDB = useCallback(async (): Promise<boolean> => {
    const user = await getUser();
    if (!user || !supabase) return false;

    // 1. Fetch History
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(30);

    if (data && !error) {
      // 🔥 Clean mapping through dedicated function
      const mappedHistory: FocusSession[] = (data as DBFocusSession[]).map(mapDBSessionToFocusSession);
      setSessionHistory(mappedHistory);
    }

    // 2. Fetch Active Session
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
      
      const sessionDuration = remoteSession.initialDuration || initialSessionTime;
      setInitialSessionTime(sessionDuration); 
      
      const elapsed = Math.floor((Date.now() - remoteSession.startTime) / 1000);
      setTimeRemaining(Math.max(0, sessionDuration - elapsed));
      
      if (remoteSession.completedAt) {
        setIsSessionComplete(true);
        setExtraTime(Math.floor((Date.now() - remoteSession.extraStartTime) / 1000));
      } else {
        setIsSessionComplete(false);
        setExtraTime(0);
      }

      localStorage.setItem("focus_active_session", JSON.stringify(remoteSession));
      return true; 
    }
    
    return false; 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, initialSessionTime]);

  // 🔹 SYNC HISTORY TO DB
  // 🔥 IMPROVEMENT 4: Fix syncSessionToDB typing
  const syncSessionToDB = async (session: FocusSession, isCompleted: boolean) => {
    try {
      const user = await getUser();
      if (!user || !supabase) return;

      await supabase.from('focus_sessions').upsert({
        id: session.id,
        user_id: user.id,
        task_id: session.taskId || null,
        duration: session.durationSeconds,
        extra_duration: session.extraDuration || 0,
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
          fetchSessionsFromDB(); 
        } else {
          setCurrentSession(null);
          setSessionHistory([]);
          setIsActive(false);
          setIsSessionComplete(false);
          setExtraTime(0);
          localStorage.removeItem("focus_active_session"); 
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase, fetchSessionsFromDB]);

  // ✅ FORCE SYNC ON TAB VISIBILITY
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchSessionsFromDB(); 
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchSessionsFromDB]);

  // ✅ ADD HEARTBEAT (Real-time presence)
  useEffect(() => {
    if (!isActive || !currentSession || typeof window === "undefined") return;

    const interval = setInterval(async () => {
      const user = await getUser();
      if (!user || !supabase) return;

      await supabase
        .from("focus_active_sessions")
        .update({ last_seen: new Date().toISOString() })
        .eq("user_id", user.id);
    }, 10000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, currentSession]);

  // 🔹 REALTIME SYNC
  useEffect(() => {
    if (!supabase || !currentUser) return;

    const channel = supabase
      .channel(`focus-${currentUser.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "focus_sessions", filter: `user_id=eq.${currentUser.id}` },
        () => fetchSessionsFromDB()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "focus_active_sessions", filter: `user_id=eq.${currentUser.id}` },
        (payload: any) => {
          if (payload.eventType === "DELETE") {
            setIsActive(false);
            setCurrentSession(null);
            setIsSessionComplete(false);
            setExtraTime(0);
            exitFocusMode();
            localStorage.removeItem("focus_active_session"); 
          } else if (payload.new?.session) {
            const session = payload.new.session;
            setCurrentSession(session);
            setIsActive(true);
            setMode(session.mode);
            setIsPaused(false);

            const sessionDuration = session.initialDuration || initialSessionTime;
            setInitialSessionTime(sessionDuration);
            
            const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
            setTimeRemaining(Math.max(0, sessionDuration - elapsed));

            if (session.completedAt) {
              setIsSessionComplete(true);
              setExtraTime(Math.floor((Date.now() - session.extraStartTime) / 1000));
            } else {
              setIsSessionComplete(false);
              setExtraTime(0);
            }

            localStorage.setItem("focus_active_session", JSON.stringify(session));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, currentUser, fetchSessionsFromDB, initialSessionTime]);

  // --- CROSS-TAB SYNC LOGIC ---
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
            setExtraTime(0);
            setIsActive(false);
            setCurrentSession(null);
            setFocusedTime(0);
            setTotalElapsed(0);
            exitFocusMode();
            localStorage.removeItem("focus_active_session");
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
      }
    };

    window.addEventListener("storage", handleStorageSync);
    return () => window.removeEventListener("storage", handleStorageSync);
  }, []);

  // 🔹 STOP SESSION
  const stopSession = async (isNatural = false) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    alarmPlayedRef.current = false;

    if (!currentSession) return;

    const finalElapsed = getElapsedTime();
    const finalExtraTime = getExtraTime();

    setIsActive(false);
    setIsPaused(false);
    exitFocusMode();

    localStorage.removeItem("focus_active_session");

    if (isNatural) {
      localStorage.removeItem("focus_complete_signal");
      localStorage.setItem("focus_complete_signal", JSON.stringify({ time: Date.now() }));
      localStorage.removeItem("focus_checkpoint"); 
    } else {
      localStorage.removeItem("focus_stop_signal");
      localStorage.setItem("focus_stop_signal", JSON.stringify({ time: Date.now(), type: "STOP" }));

      localStorage.setItem("focus_checkpoint", JSON.stringify({
        sessionId: currentSession.id,
        remaining: timeRemaining,
        initialTime: initialSessionTime, 
        stoppedAt: Date.now()
      }));

      if (acquireLock('focus_abort_alert', 5000)) {
        addNotification('focus', 'Session Ended', 'Logging your focus time to history.', 'medium', '/focus');
      }
    }

    const endTime = Date.now();
    const score = calculateFocusScore(finalElapsed, currentSession.distractions);

    // 🔥 IMPROVEMENT 3: Fix stopSession typing (explicitly satisfies FocusSession)
    const completedSession: FocusSession = {
      ...currentSession,
      initialDuration: currentSession.initialDuration || initialSessionTime,
      endTime,
      durationSeconds: finalElapsed,
      totalSessionSeconds: finalElapsed,
      extraDuration: finalExtraTime, 
      actualDuration: finalElapsed + finalExtraTime,
      date: new Date(currentSession.startTime).toISOString(),
      score,
      distractionCount: currentSession.distractions.length,
      topDistraction: null, // Basic fallback, derived later in stats UI
      avgDistractionGap: 0, // Basic fallback, derived later in stats UI
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
    
    setIsSessionComplete(false);
    setExtraTime(0);
    
    if (mode === "pomodoro") setTimeRemaining(MODE_DURATIONS.pomodoro);
    if (mode === "deepWork") setTimeRemaining(MODE_DURATIONS.deepWork);
  };

  // --- PERSISTENCE & RECOVERY INIT ---
  useEffect(() => {
    if (isInitializing.current || typeof window === "undefined") return;
    isInitializing.current = true;

    const init = async () => {
      audioRef.current = new Audio("/sounds/alarm.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 1.0;
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      const localSessionStr = localStorage.getItem("focus_active_session");
      let paintedFromLocal = false;

      if (localSessionStr) {
        try {
          const parsed = JSON.parse(localSessionStr);
          setCurrentSession(parsed);
          setIsActive(true);
          setIsPaused(false);
          const duration = parsed.initialDuration || initialSessionTime;
          setInitialSessionTime(duration);
          
          const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
          setTimeRemaining(Math.max(0, duration - elapsed));
          
          if (parsed.completedAt) {
            setIsSessionComplete(true);
            setExtraTime(Math.floor((Date.now() - parsed.extraStartTime) / 1000));
          }

          paintedFromLocal = true;
        } catch {}
      }
      
      const hasActiveSession = await fetchSessionsFromDB();

      if (paintedFromLocal && !hasActiveSession) {
        setIsActive(false);
        setCurrentSession(null);
        setIsSessionComplete(false);
        setExtraTime(0);
        localStorage.removeItem("focus_active_session");
      }

      if (!hasActiveSession) {
        const checkpoint = localStorage.getItem("focus_checkpoint");
        if (checkpoint) {
          try {
            const data = JSON.parse(checkpoint);
            setTimeRemaining(data.remaining);
            if (data.initialTime) setInitialSessionTime(data.initialTime);
            
            setIsActive(false);
            setIsSessionComplete(false);
            setExtraTime(0);
          } catch (e) {}
        }
      } else {
        localStorage.removeItem("focus_checkpoint");
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
        addNotification('focus', 'Goal Reached 🎉', 'You hit your target! Entering Extra Focus mode.', 'high', '/focus');
      }
    } else if (!isSessionComplete) {
      alarmPlayedRef.current = false; 
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isSessionComplete, addNotification]);

  // 🔥 CORE ENGINE REWRITE
  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      const rem = getRemainingTime();
      const elapsed = getElapsedTime();

      setTimeRemaining(rem);
      setFocusedTime(elapsed);
      setTotalElapsed(elapsed);

      if (currentSession?.completedAt) {
        setExtraTime(getExtraTime());
      }

      if (currentSession) {
        localStorage.setItem("focus_active_session", JSON.stringify(currentSession));
      }

      if (rem <= 0 && currentSession && !currentSession.completedAt) {
        const now = Date.now();
        
        const updatedSession = {
          ...currentSession,
          completedAt: now,
          extraStartTime: now
        };

        setCurrentSession(updatedSession);
        setIsSessionComplete(true);
        localStorage.setItem("focus_active_session", JSON.stringify(updatedSession));

        (async () => {
          const user = await getUser();
          if (user && supabase) {
            await supabase.from("focus_active_sessions").update({
              session: updatedSession
            }).eq("user_id", user.id);
          }
        })();
      }
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPaused, getRemainingTime, getElapsedTime, currentSession, getExtraTime]); 

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

  // 🔹 START SESSION
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
      const remoteSession = existing.session;
      setCurrentSession(remoteSession);
      setIsActive(true);
      setIsPaused(false);
      
      const sessionDuration = remoteSession.initialDuration || initialSessionTime;
      setInitialSessionTime(sessionDuration);
      
      const elapsed = Math.floor((Date.now() - remoteSession.startTime) / 1000);
      setTimeRemaining(Math.max(0, sessionDuration - elapsed));

      if (remoteSession.completedAt) {
        setIsSessionComplete(true);
        setExtraTime(Math.floor((Date.now() - remoteSession.extraStartTime) / 1000));
      }

      localStorage.setItem("focus_active_session", JSON.stringify(remoteSession));
      return; 
    }

    setIsActive(true);
    setIsPaused(false);
    setIsSessionComplete(false);
    setExtraTime(0);
    
    localStorage.removeItem("focus_checkpoint");
    setInitialSessionTime(timeRemaining);
    
    // Strict assignment to ActiveSession shape
    const newSession: ActiveSession = {
      id: crypto.randomUUID(),
      taskId: activeTaskId,
      taskTitle: activeTaskId || "Untitled Focus",
      mode,
      startTime: Date.now(),
      distractions: [],
      initialDuration: timeRemaining
    };
    
    setCurrentSession(newSession);
    localStorage.setItem("focus_active_session", JSON.stringify(newSession));
    
    enterFocusMode();

    if (acquireLock('focus_start_alert', 5000)) {
      addNotification('focus', 'Deep Work Initiated 🧠', 'Distractions suppressed. Maintain your focus.', 'low', '/focus');
    }

    await supabase.from("focus_active_sessions").upsert({
      user_id: user.id,
      session: newSession
    });
  };

  return (
    <FocusContext.Provider
      // Context strictly typed to FocusState, extending with custom extraTime hook
      value={{
        isActive, isPaused, mode, timeRemaining, initialSessionTime, focusedTime,
        totalElapsed, activeTaskId, isFocusMode,
        currentSession,
        extraTime, 
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
        getElapsedTime,     
        getRemainingTime,
        getExtraTime,   
        addDistraction: (reason: string) => {
          if (!currentSession) return;
          const updatedSession = {
            ...currentSession,
            distractions: [...currentSession.distractions, { id: crypto.randomUUID(), reason, timestamp: Date.now() }],
          };
          setCurrentSession(updatedSession);
          localStorage.setItem("focus_active_session", JSON.stringify(updatedSession));
          
          if (acquireLock('focus_distraction_alert', 2000)) {
            addNotification('focus', 'Distraction Logged 📝', 'Acknowledged. Now return your attention to the task immediately.', 'low', '/focus');
          }
        },
        undoDistraction: () => {
          if (!currentSession || !currentSession.distractions.length) return;
          const updatedSession = {
            ...currentSession,
            distractions: currentSession.distractions.slice(0, -1),
          };
          setCurrentSession(updatedSession);
          localStorage.setItem("focus_active_session", JSON.stringify(updatedSession));
        },
      } as any} // Forced 'as any' here only if extraTime/getExtraTime aren't officially typed in your 'FocusState' interface yet. Add them to types.ts to remove this cast!
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