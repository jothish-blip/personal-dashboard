"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { AuthChangeEvent, Session, RealtimeChannel } from '@supabase/supabase-js';
import { FocusState, FocusMode, FocusSession, ActiveSession, Distraction } from "./types";
import { useNotificationSystem } from '@/notifications/useNotificationSystem'; 
import { getSupabaseClient } from "@/lib/supabase"; 

export type ExtendedActiveSession = ActiveSession & {
  extraStartTime?: number;
  completedAt?: number;
  initialDuration: number;
  pauseStartTime?: number;
  totalPausedDuration?: number;
};

const FocusContext = createContext<any>(undefined);

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
  ended_at?: string; 
  extra_duration?: number;
  distractions?: Distraction[];
  score?: number;               
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

const parseDBDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return 0;
  let safeStr = dateStr;
  if (!safeStr.endsWith('Z') && !safeStr.match(/[+-]\d{2}(:\d{2})?$/)) {
    safeStr += 'Z';
  }
  return new Date(safeStr).getTime();
};

const mapDBSessionToFocusSession = (row: DBFocusSession): FocusSession => {
  const startTime = parseDBDate(row.started_at);
  const duration = row.duration || 0;
  const extra = row.extra_duration || 0;

  const endTime = row.ended_at 
    ? parseDBDate(row.ended_at) 
    : startTime + (duration + extra) * 1000;

  const safeEndTime = endTime < startTime 
    ? startTime + (duration + extra) * 1000 
    : endTime;

  return {
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.task_id || "Archived Focus",
    mode: (row as any).mode ?? "pomodoro", 
    startTime,
    endTime: safeEndTime, 
    initialDuration: duration,
    distractions: row.distractions || [],
    durationSeconds: duration,
    totalSessionSeconds: duration,
    extraDuration: extra,
    actualDuration: duration + extra,
    date: new Date(startTime).toISOString(),
    score: row.score ?? (row.completed ? 100 : 50),
    distractionCount: row.distractions?.length || 0,
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

  const [dailyGoal, setDailyGoal] = useState(3 * 3600);

  const currentSessionRef = useRef<ExtendedActiveSession | null>(null);
  const isActiveRef = useRef(false);
  const isPausedRef = useRef(false);
  const initialSessionTimeRef = useRef(initialSessionTime);
  
  const playedSessionRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const playedSessions = JSON.parse(localStorage.getItem("played_sessions") || "[]");
      playedSessionRef.current = new Set(playedSessions);
    }
  }, []);

  useEffect(() => { currentSessionRef.current = currentSession; }, [currentSession]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { initialSessionTimeRef.current = initialSessionTime; }, [initialSessionTime]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("daily_goal");
      if (saved) setDailyGoal(Number(saved));
    }
  }, []);

  const updateDailyGoal = (seconds: number) => {
    setDailyGoal(seconds);
    localStorage.setItem("daily_goal", seconds.toString());
  };
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isFetchingRef = useRef(false);
  const alarmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchSessionsRef = useRef<() => Promise<boolean>>(async () => false);

  const triggerSessionComplete = useCallback((sessionId: string) => {
    if (playedSessionRef.current.has(sessionId)) return;
    setIsSessionComplete(true);
  }, []);

  const getElapsedTime = useCallback(() => {
    const session = currentSessionRef.current;
    if (!session) return 0;
    
    const now = session.pauseStartTime ? session.pauseStartTime : Date.now();
    const pausedTime = session.totalPausedDuration || 0;
    
    return Math.floor((now - session.startTime - pausedTime) / 1000);
  }, []);

  const getRemainingTime = useCallback(() => {
    const session = currentSessionRef.current;
    const initial = initialSessionTimeRef.current;
    if (!session) return initial;

    if (isPausedRef.current && session.pauseStartTime) {
      return Math.max(0, initial - Math.floor((session.pauseStartTime - session.startTime - (session.totalPausedDuration || 0)) / 1000));
    }

    const elapsed = getElapsedTime();
    return Math.max(0, initial - elapsed);
  }, [getElapsedTime]);

  const getExtraTime = useCallback(() => {
    const session = currentSessionRef.current;
    if (!session?.extraStartTime) return 0;
    return Math.floor((Date.now() - session.extraStartTime) / 1000);
  }, []);

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
      document.documentElement.requestFullscreen?.().catch((err) => {
        console.warn("Focus Mode fullscreen blocked (likely missing user gesture):", err);
      });
    }
  };

  const fetchSessionsFromDB = useCallback(async (): Promise<boolean> => {
    if (isFetchingRef.current) return false;
    isFetchingRef.current = true;
    setIsLoaded(false);

    try {
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

        setCurrentSession(prev => {
          if (prev && prev.id === s.id) return prev;
          return s;
        });

        setIsActive(true);
        setMode(s.mode);
        setIsPaused(!!s.pauseStartTime); 

        const duration = s.initialDuration || initialSessionTime;
        setInitialSessionTime(duration);

        if (s.completedAt && s.extraStartTime) {
          triggerSessionComplete(s.id);
          setExtraTime(Math.floor((Date.now() - s.extraStartTime) / 1000));
        } else {
          setExtraTime(0);
        }
      } else {
        setCurrentSession(prev => {
          if (prev) return prev;
          return null;
        });
        setIsActive(false);
        setIsSessionComplete(false);
        setExtraTime(0);
      }

      setIsLoaded(true);
      return !!activeData?.session;
    } finally {
      isFetchingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, currentUser, triggerSessionComplete]);

  useEffect(() => {
    fetchSessionsRef.current = fetchSessionsFromDB;
  }, [fetchSessionsFromDB]);

  const syncSessionToDB = async (session: FocusSession, isCompleted: boolean, retries = 2) => {
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
        started_at: new Date(session.startTime).toISOString(),
        ended_at: new Date(session.endTime).toISOString(),
        distractions: session.distractions || [],
        score: session.score || 0                
      };

      await supabase
        .from('focus_sessions')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .throwOnError(); 

    } catch (err) {
      console.error("❌ DB SAVE FAILED:", err);
      if (retries > 0) {
        console.log(`Retrying save... (${retries} left)`);
        setTimeout(() => syncSessionToDB(session, isCompleted, retries - 1), 1000);
      }
    }
  };

  useEffect(() => {
    if (!supabase) return;

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
    let timeoutId: NodeJS.Timeout;

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && currentUser?.id) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchSessionsFromDB(); 
        }, 500);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearTimeout(timeoutId);
    };
  }, [fetchSessionsFromDB, currentUser]);

  useEffect(() => {
    if (!isActive || !currentSession || !currentUser?.id || typeof window === "undefined") return;

    const interval = setInterval(async () => {
      if (!supabase) return;

      try {
        await supabase
          .from("focus_active_sessions")
          .update({ last_seen: new Date().toISOString() })
          .eq("user_id", currentUser.id)
          .throwOnError();
      } catch (e) {
        console.error("Active Session Last Seen Update Failed", e);
      }
    }, 30000); 

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, currentSession, currentUser]);

  useEffect(() => {
    if (!supabase || !currentUser?.id) return;

    const channelName = `focus-sync-${currentUser.id}`;

    const existingChannels = supabase.getChannels();
    existingChannels.forEach((c: RealtimeChannel) => {
      if (c.topic === `realtime:${channelName}`) {
        supabase.removeChannel(c);
      }
    });

    const channel = supabase.channel(channelName);

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "focus_sessions", filter: `user_id=eq.${currentUser.id}` },
        (payload: any) => {
          if (payload.eventType === "INSERT" || payload.eventType === "DELETE") {
            fetchSessionsRef.current();
          }
        }
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
            
            setCurrentSession(prev => {
              if (prev && prev.id === session.id) {
                return {
                  ...prev,
                  extraStartTime: session.extraStartTime ?? prev?.extraStartTime,
                  completedAt: session.completedAt ?? prev?.completedAt,
                  pauseStartTime: session.pauseStartTime ?? prev?.pauseStartTime,
                  totalPausedDuration: session.totalPausedDuration ?? prev?.totalPausedDuration
                };
              }
              return {
                ...session,
                extraStartTime: session.extraStartTime,
                completedAt: session.completedAt,
              };
            });
            
            setIsActive(true);
            setMode(session.mode);
            setIsPaused(!!session.pauseStartTime);

            const sessionDuration = session.initialDuration || initialSessionTimeRef.current;
            setInitialSessionTime(sessionDuration);

            if (session.completedAt && session.extraStartTime) {
              triggerSessionComplete(session.id);
              setExtraTime(Math.floor((Date.now() - session.extraStartTime) / 1000));
            } else {
              setExtraTime(0);
            }

            localStorage.setItem("focus_active_session", JSON.stringify(session));
          }
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [supabase, currentUser?.id, triggerSessionComplete]); 

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
      }
    };

    window.addEventListener("storage", handleStorageSync);
    return () => window.removeEventListener("storage", handleStorageSync);
  }, []); 

  const stopSession = async (isNatural = false) => {
    setIsSessionComplete(false);

    if (alarmTimeoutRef.current) {
      clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }

    if (!currentUser?.id) {
      console.error("❌ No user → abort save");
      return; 
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (!currentSession) return;

    const latestSessionStr = localStorage.getItem("focus_active_session");
    let finalSession = currentSession;
    
    if (latestSessionStr && currentSession) {
      try {
        const parsed = JSON.parse(latestSessionStr) as ExtendedActiveSession;
        if (parsed.id === currentSession.id) { 
          finalSession = parsed;
        }
      } catch (e) {
        console.error("Error parsing latest session fallback", e);
      }
    }

    const finalElapsed = getElapsedTime();
    
    const finalExtraTime = finalSession.extraStartTime 
      ? Math.floor((Date.now() - finalSession.extraStartTime) / 1000) 
      : 0;

    if (currentSession) {
      currentSession.completedAt = undefined;
      currentSession.extraStartTime = undefined;
    }

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
        sessionId: finalSession.id,
        remaining: timeRemaining,
        initialTime: initialSessionTime, 
        stoppedAt: Date.now()
      }));

      if (acquireLock(`focus_abort_alert_${finalSession.id}`, 5000)) {
        addNotification('focus', 'Session Ended', 'Logging your focus time to history.', 'medium', '/focus');
      }
    }

    const endTime = Date.now();
    const finalDistractions = Array.isArray(finalSession.distractions) ? finalSession.distractions : [];
    const score = calculateFocusScore(finalElapsed, finalDistractions);

    const completedSession: FocusSession = {
      ...finalSession,
      initialDuration: finalSession.initialDuration || initialSessionTime,
      endTime,
      durationSeconds: finalElapsed,
      totalSessionSeconds: finalElapsed,
      extraDuration: finalExtraTime, 
      actualDuration: finalElapsed + finalExtraTime,
      date: new Date(finalSession.startTime).toISOString(),
      score,
      distractionCount: finalDistractions.length,
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

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }, 0);
  };

  useEffect(() => {
    if (
      isSessionComplete && 
      isActive && 
      !isPaused && 
      currentSession?.id && 
      !playedSessionRef.current.has(currentSession.id)
    ) {
      
      playedSessionRef.current.add(currentSession.id);
      
      const MAX = 20;
      const updated = Array.from(playedSessionRef.current).slice(-MAX);
      playedSessionRef.current = new Set(updated);
      
      localStorage.setItem(
        "played_sessions",
        JSON.stringify(updated)
      );
  
      if (audioRef.current) {
        audioRef.current.loop = true; 
        audioRef.current.volume = 1.0;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
  
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([300, 100, 300, 100, 300]);
      }

      if (alarmTimeoutRef.current) {
         clearTimeout(alarmTimeoutRef.current);
      }

      alarmTimeoutRef.current = setTimeout(() => {
         if (audioRef.current) {
           audioRef.current.pause();
           audioRef.current.currentTime = 0;
         } 
      }, 10000);

      setTimeout(() => {
         if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
      }, 12000);
  
      if (currentSession?.id && acquireLock(`focus_complete_alert_${currentSession.id}`, 15000)) {
        addNotification(
          'focus',
          'Goal Reached',
          'You hit your target! Entering Extra Focus mode.',
          'high',
          '/focus'
        );
      }
  
    } else if (!isSessionComplete || isPaused) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
  
      if (alarmTimeoutRef.current) {
        clearTimeout(alarmTimeoutRef.current);
        alarmTimeoutRef.current = null;
      }
    }
  }, [isSessionComplete, isActive, isPaused, addNotification, currentSession]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isActiveRef.current) return;
      if (!isActiveRef.current || isPausedRef.current) return;
      const session = currentSessionRef.current;
      if (!session) return;

      const rem = getRemainingTime();
      const elapsed = getElapsedTime();

      setTimeRemaining(rem);
      setFocusedTime(elapsed);
      setTotalElapsed(elapsed);

      if (session.completedAt && session.extraStartTime) {
        const extra = Math.floor((Date.now() - session.extraStartTime) / 1000);
        setExtraTime(extra);
      }

      localStorage.setItem("focus_active_session", JSON.stringify(session));

      if (rem <= 0 && !session.completedAt && !isPausedRef.current) {
        const now = Date.now();
        
        const updatedSession: ExtendedActiveSession = {
          ...session,
          completedAt: now,
          extraStartTime: now
        };

        setCurrentSession(updatedSession);
        currentSessionRef.current = updatedSession; 
        
        triggerSessionComplete(updatedSession.id);

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
  }, [currentUser?.id, supabase, getRemainingTime, getElapsedTime, triggerSessionComplete]); 

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
      let updatedSession = { ...remoteSession };

      const pauseStart = remoteSession.pauseStartTime || currentSession?.pauseStartTime;
      
      if (pauseStart) {
        const pausedDuration = Date.now() - pauseStart;
        updatedSession.totalPausedDuration = 
          (remoteSession.totalPausedDuration || currentSession?.totalPausedDuration || 0) + pausedDuration;
        updatedSession.pauseStartTime = undefined;
      }

      setCurrentSession(updatedSession);
      setIsActive(true);
      setIsPaused(false);
      
      const sessionDuration = updatedSession.initialDuration || initialSessionTime;
      setInitialSessionTime(sessionDuration);

      if (updatedSession.completedAt && updatedSession.extraStartTime) {
        triggerSessionComplete(updatedSession.id);
        setExtraTime(Math.floor((Date.now() - updatedSession.extraStartTime) / 1000));
      }

      localStorage.setItem("focus_active_session", JSON.stringify(updatedSession));
      
      try {
        await supabase.from("focus_active_sessions").update({ session: updatedSession }).eq("user_id", currentUser.id).throwOnError();
      } catch (err) {}

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

    if (acquireLock(`focus_start_alert_${newSession.id}`, 5000)) {
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
        currentUser, 
        isActive, isPaused, mode, timeRemaining, initialSessionTime, focusedTime,
        totalElapsed, activeTaskId, isFocusMode,
        currentSession,
        extraTime, 
        distractions: currentSession?.distractions || [],
        sessions: sessionHistory,
        isSessionComplete,
        isLoaded, 
        dailyGoal, 
        updateDailyGoal, 
        setIsSessionComplete, 
        enterFocusMode, exitFocusMode,
        setTimeRemaining, 
        setInitialSessionTime, 
        setMode: setModeHandler, 
        setActiveTask: setActiveTaskId,
        startSession, 
        
        pauseSession: () => {
          if (!currentSession || currentSession.pauseStartTime) return; 

          const updatedSession = {
            ...currentSession,
            pauseStartTime: Date.now(),
          };

          setCurrentSession(updatedSession);
          setIsPaused(true);
          localStorage.setItem("focus_active_session", JSON.stringify(updatedSession));
          
          if (currentUser?.id && supabase) {
            (async () => {
              try {
                await supabase.from("focus_active_sessions").update({ session: updatedSession }).eq("user_id", currentUser.id).throwOnError();
              } catch (e) {
                console.error("Supabase pause error:", e);
              }
            })();
          }

          if (acquireLock(`focus_pause_alert_${updatedSession.id}`, 5000)) {
            addNotification('focus', 'Session Paused', 'Momentum halted. Return as soon as possible.', 'medium', '/focus');
          }
        }, 
        stopSession, 
        getElapsedTime,     
        getRemainingTime,
        getExtraTime,   

        addDistraction: (reason: string) => {
          setCurrentSession((prev) => {
            if (!prev) return prev;
        
            const updated = {
              ...prev,
              distractions: [
                ...(prev.distractions || []),
                {
                  id: crypto.randomUUID(),
                  reason,
                  timestamp: Date.now(),
                },
              ],
            };
        
            localStorage.setItem("focus_active_session", JSON.stringify(updated));
            
            if (currentUser?.id && supabase) {
              (async () => {
                try {
                  await supabase.from("focus_active_sessions").update({ session: updated }).eq("user_id", currentUser.id).throwOnError();
                } catch (e) {
                  console.error("Supabase add distraction error:", e);
                }
              })();
            }

            if (acquireLock(`focus_distraction_alert_${updated.id}`, 2000)) {
              addNotification(
                'focus',
                'Distraction Logged',
                'Acknowledged. Now return your attention to the task immediately.',
                'low',
                '/focus'
              );
            }

            return updated;
          });
        },
        undoDistraction: () => {
          setCurrentSession((prev) => {
            if (!prev || !prev.distractions?.length) return prev;
            
            const updated = {
              ...prev,
              distractions: prev.distractions.slice(0, -1),
            };
            
            localStorage.setItem("focus_active_session", JSON.stringify(updated));
            
            if (currentUser?.id && supabase) {
              (async () => {
                try {
                  await supabase.from("focus_active_sessions").update({ session: updated }).eq("user_id", currentUser.id).throwOnError();
                } catch (e) {
                  console.error("Supabase undo distraction error:", e);
                }
              })();
            }

            return updated;
          });
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