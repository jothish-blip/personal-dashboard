"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { FocusState, FocusMode, FocusSession, ActiveSession, Distraction } from "./types";
import { useNotificationSystem } from '@/notifications/useNotificationSystem'; 
import { getSupabaseClient } from "@/lib/supabase"; 

export type ExtendedActiveSession = ActiveSession & {
  extraStartTime?: number;
  completedAt?: number;
  initialDuration: number;
};

const FocusContext = createContext<FocusState | undefined>(undefined);

const MODE_DURATIONS = {
  pomodoro: 25 * 60,
  deepWork: 90 * 60,
};

type DBFocusSession = {
  id: string;
  user_id: string;
  task_id: string | null;
  duration: number;
  completed: boolean;
  started_at: string;
  extra_duration?: number;
};

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

const mapDBSessionToFocusSession = (row: DBFocusSession): FocusSession => {
  const startTime = new Date(row.started_at).getTime();
  const duration = row.duration;
  const extra = row.extra_duration || 0;

  return {
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.task_id || "Archived Focus",
    mode: (row as any).mode ?? "pomodoro", 
    startTime,
    endTime: startTime + duration * 1000,
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
  const [authInitialized, setAuthInitialized] = useState(false);
  const { addNotification } = useNotificationSystem(currentUser?.id);

  const [mode, setMode] = useState<FocusMode>("pomodoro");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(MODE_DURATIONS.pomodoro);
  const [initialSessionTime, setInitialSessionTime] = useState(MODE_DURATIONS.pomodoro);
  const [focusedTime, setFocusedTime] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [extraTime, setExtraTime] = useState(0);
  
  const [currentSession, setCurrentSession] = useState<ExtendedActiveSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<FocusSession[]>([]);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmPlayedRef = useRef(false);

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

  const fetchSessionsFromDB = useCallback(async (): Promise<boolean> => {
    setIsLoaded(false);

    if (!currentUser?.id || !supabase) {
      setIsLoaded(true);
      return false;
    }

    const { data: historyData, error: historyError } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', currentUser.id) 
      .order('started_at', { ascending: false });

    if (historyError) {
      console.error("❌ DB FETCH FAILED:", historyError);
    } else if (historyData) {
      setSessionHistory(historyData.map(mapDBSessionToFocusSession));
    }

    const { data: activeData } = await supabase
      .from('focus_active_sessions')
      .select('session')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (activeData?.session) {
      const s = activeData.session as ExtendedActiveSession;

      setCurrentSession(s);
      setIsActive(true);
      setMode(s.mode);

      const elapsed = Math.floor((Date.now() - s.startTime) / 1000);
      const duration = s.initialDuration || initialSessionTime;

      setInitialSessionTime(duration);
      setTimeRemaining(Math.max(0, duration - elapsed));

      if (s.completedAt && s.extraStartTime) {
        setIsSessionComplete(true);
        setExtraTime(Math.floor((Date.now() - s.extraStartTime) / 1000));
      } else {
        setIsSessionComplete(false);
        setExtraTime(0);
      }
    } else {
      setCurrentSession(null);
      setIsActive(false);
      setIsSessionComplete(false);
      setExtraTime(0);
    }

    setIsLoaded(true);
    return !!activeData?.session;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, currentUser]);

  const syncSessionToDB = async (session: FocusSession, isCompleted: boolean) => {
    try {
      if (!currentUser?.id) {
        console.error("❌ No user → abort save");
        return;
      }
      if (!supabase) return;

      const payload = {
        id: session.id,
        user_id: currentUser.id,
        task_id: session.taskId || null,
        duration: session.durationSeconds,
        extra_duration: session.extraDuration || 0,
        completed: isCompleted,
        started_at: new Date(session.startTime).toISOString()
      };

      const { data } = await supabase
        .from('focus_sessions')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .throwOnError(); 

    } catch (err) {
      console.error("❌ DB SAVE FAILED (Exception):", err);
    }
  };

  useEffect(() => {
    if (!supabase) return;

    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setCurrentUser(data.session?.user || null);
      setAuthInitialized(true);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const user = session?.user ?? null;
        setCurrentUser(user);
        setAuthInitialized(true);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!authInitialized) return;

    if (authInitialized && currentUser?.id) {
      fetchSessionsFromDB();
    } else if (!currentUser) {
      setCurrentSession(null);
      setSessionHistory([]);
      setIsActive(false);
      setIsSessionComplete(false);
      setExtraTime(0);
      setIsLoaded(true);
      localStorage.removeItem("focus_active_session"); 
    }
  }, [currentUser, authInitialized, fetchSessionsFromDB]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/alarm.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 1.0;
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && currentUser?.id) {
        fetchSessionsFromDB(); 
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchSessionsFromDB, currentUser]);

  useEffect(() => {
    if (!isActive || !currentSession || !currentUser?.id || typeof window === "undefined") return;

    const interval = setInterval(async () => {
      if (!supabase) return;

      try {
        await supabase
          .from("focus_active_sessions")
          .update({ last_seen: new Date().toISOString() })
          .eq("user_id", currentUser.id);
      } catch (e) {
        console.error("Active Session Last Seen Update Failed", e);
      }
    }, 10000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, currentSession, currentUser]);

  useEffect(() => {
    if (!supabase || !currentUser?.id) return;

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
            const session = payload.new.session as ExtendedActiveSession;
            
            setCurrentSession(prev => ({
              ...session,
              extraStartTime: session.extraStartTime ?? prev?.extraStartTime,
              completedAt: session.completedAt ?? prev?.completedAt,
            }));
            
            setIsActive(true);
            setMode(session.mode);
            setIsPaused(false);

            const sessionDuration = session.initialDuration || initialSessionTime;
            setInitialSessionTime(sessionDuration);
            
            const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
            setTimeRemaining(Math.max(0, sessionDuration - elapsed));

            if (session.completedAt && session.extraStartTime) {
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
        setIsSessionComplete(true);
      }
    };

    window.addEventListener("storage", handleStorageSync);
    return () => window.removeEventListener("storage", handleStorageSync);
  }, []);

  const stopSession = async (isNatural = false) => {
    if (!currentUser?.id) {
      console.error("❌ No user → abort save");
      return; 
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    alarmPlayedRef.current = true; 

    if (!currentSession) return;

    if (currentSession?.extraStartTime) {
      setIsSessionComplete(false);
    }

    const finalElapsed = getElapsedTime();
    
    const finalExtraTime = currentSession.extraStartTime 
      ? Math.floor((Date.now() - currentSession.extraStartTime) / 1000) 
      : 0;

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
      topDistraction: null, 
      avgDistractionGap: 0, 
    };

    setSessionHistory((prev) => {
        const alreadySaved = prev.some(s => s.id === completedSession.id);
        if (!alreadySaved) return [completedSession, ...prev];
        return prev;
    });

    await syncSessionToDB(completedSession, true);

    if (currentUser && supabase) {
      await supabase.from("focus_active_sessions").delete().eq("user_id", currentUser.id);
    }

    setCurrentSession(null);
    setFocusedTime(0);
    setTotalElapsed(0);
    
    setIsSessionComplete(false);
    setExtraTime(0);
    
    if (mode === "pomodoro") setTimeRemaining(MODE_DURATIONS.pomodoro);
    if (mode === "deepWork") setTimeRemaining(MODE_DURATIONS.deepWork);

    await fetchSessionsFromDB(); 
  };

  useEffect(() => {
    if (isSessionComplete && !alarmPlayedRef.current) {
      alarmPlayedRef.current = true;
      
      if (audioRef.current) {
        audioRef.current.volume = 1.0;
        audioRef.current.play().catch(() => {});
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
      
      if (acquireLock('focus_complete_alert', 5000)) {
        addNotification('focus', 'Goal Reached', 'You hit your target! Entering Extra Focus mode.', 'high', '/focus');
      }
    } else if (!isSessionComplete && audioRef.current?.paused === false) { 
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isSessionComplete, addNotification]); 

  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      const rem = getRemainingTime();
      const elapsed = getElapsedTime();

      setTimeRemaining(rem);
      setFocusedTime(elapsed);
      setTotalElapsed(elapsed);

      if (currentSession?.completedAt && currentSession?.extraStartTime) {
        const extra = Math.floor((Date.now() - currentSession.extraStartTime) / 1000);
        setExtraTime(extra);
      }

      if (currentSession) {
        localStorage.setItem("focus_active_session", JSON.stringify({
          ...currentSession,
          completedAt: currentSession.completedAt,
          extraStartTime: currentSession.extraStartTime
        }));
      }

      if (rem <= 0 && currentSession && !currentSession.completedAt) {
        const now = Date.now();
        
        alarmPlayedRef.current = false; 

        const updatedSession: ExtendedActiveSession = {
          ...currentSession,
          completedAt: now,
          extraStartTime: now
        };

        setCurrentSession(updatedSession);
        
        setIsSessionComplete(true);
        setTimeout(() => {
          setIsSessionComplete(true);
        }, 0);

        localStorage.setItem("focus_active_session", JSON.stringify(updatedSession));

        (async () => {
          if (currentUser?.id && supabase) {
            try {
              await supabase.from("focus_active_sessions").update({
                session: updatedSession
              }).eq("user_id", currentUser.id).throwOnError();
            } catch (err) {
              console.error("❌ Failed to update active session state in DB:", err);
            }
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

  const startSession = async () => {
    if (!currentUser?.id || !supabase) {
      addNotification('system', 'Auth Error', 'User not authenticated.', 'high');
      return;
    }

    alarmPlayedRef.current = false;

    if (audioRef.current) {
      audioRef.current.play().then(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }).catch(() => {});
    }

    const { data: existing } = await supabase
      .from("focus_active_sessions")
      .select("session")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (existing?.session) {
      const remoteSession = existing.session as ExtendedActiveSession;
      setCurrentSession(remoteSession);
      setIsActive(true);
      setIsPaused(false);
      
      const sessionDuration = remoteSession.initialDuration || initialSessionTime;
      setInitialSessionTime(sessionDuration);
      
      const elapsed = Math.floor((Date.now() - remoteSession.startTime) / 1000);
      setTimeRemaining(Math.max(0, sessionDuration - elapsed));

      if (remoteSession.completedAt && remoteSession.extraStartTime) {
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
    
    const newSession: ExtendedActiveSession = {
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
      addNotification('focus', 'Deep Work Initiated', 'Distractions suppressed. Maintain your focus.', 'low', '/focus');
    }

    try {
      await supabase.from("focus_active_sessions").upsert({
        user_id: currentUser.id,
        session: newSession,
        last_seen: new Date().toISOString()
      }).throwOnError();
    } catch (err) {
      console.error("❌ Failed to start active session in DB:", err);
    }
  };

  return (
    <FocusContext.Provider
      value={{
        isActive, isPaused, mode, timeRemaining, initialSessionTime, focusedTime,
        totalElapsed, activeTaskId, isFocusMode,
        currentSession,
        extraTime, 
        distractions: currentSession?.distractions || [],
        sessions: sessionHistory,
        isSessionComplete,
        isLoaded, 
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
            addNotification('focus', 'Session Paused', 'Momentum halted. Return as soon as possible.', 'medium', '/focus');
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
            addNotification('focus', 'Distraction Logged', 'Acknowledged. Now return your attention to the task immediately.', 'low', '/focus');
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
      } as any}
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