"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { AuthChangeEvent, Session, RealtimeChannel } from '@supabase/supabase-js';
import {
  FocusState,
  FocusMode,
  FocusSession,
  ActiveSession,
  Distraction,
} from "../types/types";
import { useNotificationSystem } from '@/notifications/engine/useNotificationSystem'; 
import { supabase } from "@/lib/supabase"; 

export type ExtendedActiveSession = ActiveSession & {
  extraStartTime?: number;
  completedAt?: number;
  initialDuration: number;
  pauseSegments?: { start: number; end?: number }[];
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

  const safeDistractions = Array.isArray(row.distractions) ? row.distractions : [];

  return {
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.task_id || "Archived Focus",
    mode: (row as any).mode ?? "pomodoro", 
    startTime,
    endTime: safeEndTime, 
    initialDuration: duration,
    initialSessionTime: duration,
    distractions: safeDistractions,
    durationSeconds: duration,
    totalSessionSeconds: duration,
    extraDuration: extra,
    actualDuration: duration + extra,
    date: new Date(startTime).toISOString(),
    score: row.score ?? (row.completed ? 100 : 50),
    distractionCount: safeDistractions.length,
    topDistraction: null,
    avgDistractionGap: 0,
  };
};

const mergeSessions = (local: ExtendedActiveSession | null, remote: ExtendedActiveSession): ExtendedActiveSession => {
  if (!local || local.id !== remote.id) return remote;
  
  const localSegments = local.pauseSegments || [];
  const remoteSegments = remote.pauseSegments || [];
  const pauseMap = new Map();
  
  [...remoteSegments, ...localSegments].forEach(seg => {
    const existing = pauseMap.get(seg.start);
    if (!existing || (!existing.end && seg.end)) {
      pauseMap.set(seg.start, seg);
    }
  });
  
  const mergedPauses = Array.from(pauseMap.values()).sort((a, b) => a.start - b.start);
  const localDists = Array.isArray(local.distractions) ? local.distractions : [];
  const remoteDists = Array.isArray(remote.distractions) ? remote.distractions : [];
  
  return {
    ...remote,
    extraStartTime: local.extraStartTime || remote.extraStartTime,
    completedAt: local.completedAt || remote.completedAt,
    pauseSegments: mergedPauses,
    distractions: localDists.length >= remoteDists.length ? localDists : remoteDists
  };
};

export function FocusProvider({ children }: { children: ReactNode }) {
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
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  const [dailyGoal, setDailyGoal] = useState(3 * 3600);

  const currentSessionRef = useRef<ExtendedActiveSession | null>(null);
  const isActiveRef = useRef(false);
  const isPausedRef = useRef(false);
  const initialSessionTimeRef = useRef(initialSessionTime);
  
  const playedSessionRef = useRef<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isFetchingRef = useRef(false);
  const alarmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchSessionsRef = useRef<() => Promise<boolean>>(async () => false);

  useEffect(() => { currentSessionRef.current = currentSession; }, [currentSession]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { initialSessionTimeRef.current = initialSessionTime; }, [initialSessionTime]);

  // ─── LOCAL STORAGE: SCOPED TO CURRENT USER ───
  useEffect(() => {
    if (typeof window !== "undefined" && currentUser?.id) {
      // 1. Scoped played sessions
      const playedSessions = JSON.parse(localStorage.getItem(`played_sessions_${currentUser.id}`) || "[]");
      playedSessionRef.current = new Set(playedSessions);

      // 2. Scoped daily goal
      const savedGoal = localStorage.getItem(`daily_goal_${currentUser.id}`);
      if (savedGoal) setDailyGoal(Number(savedGoal));
      else setDailyGoal(3 * 3600); // Default to 3 hrs if not set
    }
  }, [currentUser?.id]);

  const updateDailyGoal = useCallback((seconds: number) => {
    // Math checks guardrail inputs (between 1 hour and 16 hours limit)
    const safeSeconds = Math.max(3600, Math.min(16 * 3600, seconds)); 
    setDailyGoal(safeSeconds);
    
    if (currentUser?.id) {
      localStorage.setItem(`daily_goal_${currentUser.id}`, safeSeconds.toString());
    }
  }, [currentUser?.id]);

  const stopAlarm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (alarmTimeoutRef.current) {
      clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }
  }, []);

  const startExtraFocus = useCallback(() => {
    if (!isActiveRef.current || !currentUser?.id) return;

    stopAlarm();

    const session = currentSessionRef.current;
    if (!session) return;

    playedSessionRef.current.add(session.id);
    const MAX = 20;
    const updated = Array.from(playedSessionRef.current).slice(-MAX);
    playedSessionRef.current = new Set(updated);
    
    localStorage.setItem(`played_sessions_${currentUser.id}`, JSON.stringify(updated));

    if (!session.extraStartTime) {
      const s = { ...session, extraStartTime: Date.now() };
      setCurrentSession(s);
      currentSessionRef.current = s;
      localStorage.setItem(`focus_active_session_${currentUser.id}`, JSON.stringify(s));
      
      (supabase as any).from("focus_active_sessions").update({ session: s }).eq("user_id", currentUser.id).then();
    }
  }, [currentUser?.id, stopAlarm]);

  const triggerSessionComplete = useCallback((sessionId: string) => {
    if (playedSessionRef.current.has(sessionId)) return;
    setIsSessionComplete(true);
  }, []);

  const getPausedTime = useCallback((session: ExtendedActiveSession, since: number = 0) => {
    return (session.pauseSegments || []).reduce((acc, seg) => {
      const segStart = Math.max(seg.start, since);
      const segEnd = seg.end || Date.now(); 
      if (segEnd <= segStart) return acc;
      return acc + (segEnd - segStart);
    }, 0);
  }, []);

  const getElapsedTime = useCallback(() => {
    const session = currentSessionRef.current;
    if (!session) return 0;
    
    const elapsedMs = Date.now() - session.startTime - getPausedTime(session);
    return Math.max(0, Math.floor(elapsedMs / 1000));
  }, [getPausedTime]);

  const getRemainingTime = useCallback(() => {
    const session = currentSessionRef.current;
    if (!session) return initialSessionTimeRef.current;
    
    const elapsed = getElapsedTime();
    return Math.max(0, (session.initialDuration || initialSessionTimeRef.current) - elapsed);
  }, [getElapsedTime]);

  const getExtraTime = useCallback(() => {
    const session = currentSessionRef.current;
    if (!session?.extraStartTime) return 0;
    const extraMs = Date.now() - session.extraStartTime - getPausedTime(session, session.extraStartTime);
    return Math.max(0, Math.floor(extraMs / 1000));
  }, [getPausedTime]);

  const calculateFocusScore = (duration: number, distractions: Distraction[]) => {
    const distractionPenalty = distractions.length * 10;
    return Math.max(0, Math.round(100 - distractionPenalty + (Math.min(duration / 60, 100) * 0.2)));
  };

  const fetchSessionsFromDB = useCallback(async (): Promise<boolean> => {
    if (isFetchingRef.current) return false;
    isFetchingRef.current = true;
    setIsLoaded(false);

    try {
      if (!currentUser?.id) {
        setIsLoaded(true);
        return false;
      }

      const { data: historyData, error: historyError } = await (supabase as any).from('focus_sessions')
        .select('*')
        .eq('user_id', currentUser.id) 
        .order('started_at', { ascending: false });

      if (historyError) {
        console.error("❌ DB FETCH FAILED:", historyError);
      } else if (historyData) {
        setSessionHistory(historyData.map(mapDBSessionToFocusSession));
      }

      const { data: activeData } = await (supabase as any).from('focus_active_sessions')
        .select('session')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (activeData?.session) {
        const remoteSession = activeData.session as ExtendedActiveSession;
        const merged = mergeSessions(currentSessionRef.current, remoteSession);

        setCurrentSession(merged);
        setIsActive(true);
        setMode(merged.mode);

        const segments = merged.pauseSegments || [];
        const lastSegment = segments[segments.length - 1];
        setIsPaused(!!(lastSegment && !lastSegment.end)); 

        const duration = merged.initialDuration || initialSessionTime;
        setInitialSessionTime(duration);

        if (merged.completedAt) {
          triggerSessionComplete(merged.id);
        }
        
      } else {
        setCurrentSession(null);
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
  }, [currentUser, triggerSessionComplete]);

  useEffect(() => {
    fetchSessionsRef.current = fetchSessionsFromDB;
  }, [fetchSessionsFromDB]);

  const syncSessionToDB = async (session: FocusSession, isCompleted: boolean, retries = 2) => {
    try {
      if (!currentUser?.id) return;

      const payload = {
        id: session.id,
        user_id: currentUser.id,
        task_id: session.taskId || null,
        duration: session.durationSeconds,
        extra_duration: session.extraDuration || 0,
        completed: isCompleted,
        started_at: new Date(session.startTime).toISOString(),
        ended_at: new Date(session.endTime).toISOString(),
        distractions: JSON.parse(JSON.stringify(
          Array.isArray(session.distractions) ? session.distractions : []
        )),
        score: session.score || 0                
      };

      await (supabase as any).from('focus_sessions')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .throwOnError(); 

    } catch (err) {
      console.error("❌ DB SAVE FAILED:", err);
      if (retries > 0) {
        setTimeout(() => syncSessionToDB(session, isCompleted, retries - 1), 1000);
      }
    }
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const user = session?.user ?? null;
        setCurrentUser(user);
        setAuthInitialized(true);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

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
      // Clean up generic state, but scoped states stay orphaned until login again
    }
  }, [currentUser, authInitialized, fetchSessionsFromDB]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/alarm.mp3");
      audioRef.current.volume = 1.0;
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
    return () => stopAlarm();
  }, [stopAlarm]);

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
      try {
        await (supabase as any).from("focus_active_sessions")
          .update({ last_seen: new Date().toISOString() })
          .eq("user_id", currentUser.id)
          .throwOnError();
      } catch (e) {}
    }, 30000); 

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, currentSession, currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;

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
            localStorage.removeItem(`focus_active_session_${currentUser.id}`); 
          } else if (payload.new?.session) {
            const remoteSession = payload.new.session as ExtendedActiveSession;
            const merged = mergeSessions(currentSessionRef.current, remoteSession);
            
            setCurrentSession(merged);
            setIsActive(true);
            setMode(merged.mode);
            
            const segments = merged.pauseSegments || [];
            const lastSegment = segments[segments.length - 1];
            setIsPaused(!!(lastSegment && !lastSegment.end));

            const sessionDuration = merged.initialDuration || initialSessionTimeRef.current;
            setInitialSessionTime(sessionDuration);

            if (merged.completedAt) {
              triggerSessionComplete(merged.id);
            }

            localStorage.setItem(`focus_active_session_${currentUser.id}`, JSON.stringify(merged));
          }
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [currentUser?.id, triggerSessionComplete]); 

  // ─── SCOPED MULTI-TAB SYNC ───
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (!e.newValue || !currentUser?.id) return;

      if (e.key === `focus_stop_signal_${currentUser.id}`) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.type === "STOP") {
            stopAlarm(); 
            setIsSessionComplete(false);
            setExtraTime(0);
            setIsActive(false);
            setCurrentSession(null);
            setFocusedTime(0);
            setTotalElapsed(0);
            localStorage.removeItem(`focus_active_session_${currentUser.id}`);
          }
        } catch (err) {}
      }
      
      if (e.key === `focus_complete_signal_${currentUser.id}`) {
        stopAlarm(); 
        setIsSessionComplete(false);
      }
    };

    window.addEventListener("storage", handleStorageSync);
    return () => window.removeEventListener("storage", handleStorageSync);
  }, [stopAlarm, currentUser?.id]); 

  const stopSession = async (saveExtraTime = false) => {
    setIsSessionComplete(false);
    stopAlarm(); 

    if (!currentUser?.id) return; 
    
    const latestRefSession = currentSessionRef.current;
    if (!latestRefSession) return;

    const latestSessionStr = localStorage.getItem(`focus_active_session_${currentUser.id}`);
    let finalSession = latestRefSession;
    
    if (latestSessionStr && latestRefSession) {
      try {
        const parsed = JSON.parse(latestSessionStr) as ExtendedActiveSession;
        if (parsed.id === latestRefSession.id) { 
          finalSession = parsed;
        }
      } catch (e) {}
    }

    const finalElapsed = Math.min(getElapsedTime(), finalSession.initialDuration || initialSessionTimeRef.current);
    const finalExtraTime = (saveExtraTime && finalSession.extraStartTime) ? getExtraTime() : 0;
    
    const endTime = Date.now();
    const totalDuration = (endTime - finalSession.startTime) / 1000;
    const pausedTime = Math.max(0, totalDuration - (finalElapsed + finalExtraTime));

    if (currentSession) {
      currentSession.completedAt = undefined;
      currentSession.extraStartTime = undefined;
    }

    setIsActive(false);
    setIsPaused(false);

    localStorage.removeItem(`focus_active_session_${currentUser.id}`);

    if (saveExtraTime) {
      localStorage.removeItem(`focus_complete_signal_${currentUser.id}`);
      localStorage.setItem(`focus_complete_signal_${currentUser.id}`, JSON.stringify({ time: Date.now() }));
      localStorage.removeItem(`focus_checkpoint_${currentUser.id}`); 
    } else {
      localStorage.removeItem(`focus_stop_signal_${currentUser.id}`);
      localStorage.setItem(`focus_stop_signal_${currentUser.id}`, JSON.stringify({ time: Date.now(), type: "STOP" }));

      localStorage.setItem(`focus_checkpoint_${currentUser.id}`, JSON.stringify({
        sessionId: finalSession.id,
        remaining: timeRemaining,
        initialTime: initialSessionTime, 
        stoppedAt: Date.now()
      }));

      if (acquireLock(`focus_abort_alert_${finalSession.id}`, 5000)) {
        addNotification('focus', 'Session Ended', 'Logging your focus time to history.', 'medium', '/focus');
      }
    }

    const finalDistractions = Array.isArray(finalSession.distractions) ? finalSession.distractions : [];
    const score = calculateFocusScore(finalElapsed, finalDistractions);

    const completedSession: FocusSession = {
      ...finalSession,
      initialDuration: finalSession.initialDuration || initialSessionTime,
      endTime,
      durationSeconds: finalElapsed,
      totalSessionSeconds: totalDuration, 
      extraDuration: finalExtraTime, 
      actualDuration: finalElapsed + finalExtraTime,
      date: new Date(finalSession.startTime).toISOString(),
      score,
      distractionCount: finalDistractions.length,
      topDistraction: null, 
      avgDistractionGap: 0, 
      // @ts-ignore
      pausedDuration: pausedTime 
    };

    if (sessionHistory.some(s => s.id === completedSession.id)) {
      return;
    }

    setSessionHistory((prev) => {
        const alreadySaved = prev.some(s => s.id === completedSession.id);
        if (!alreadySaved) return [completedSession, ...prev];
        return prev;
    });

    await syncSessionToDB(completedSession, true);

    if (currentUser) {
      await (supabase as any).from("focus_active_sessions").delete().eq("user_id", currentUser.id);
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
    const interval = setInterval(() => {
      const session = currentSessionRef.current;
      
      if (!session) {
          if (isActiveRef.current) {
            setIsActive(false);
          }
          return;
      }

      if (session.startTime > Date.now()) return;

      const rem = getRemainingTime();
      const elapsed = getElapsedTime();

      setTimeRemaining(rem);
      setFocusedTime(elapsed);
      setTotalElapsed(elapsed);

      if (session.completedAt && session.extraStartTime) {
        setExtraTime(getExtraTime());
      }

      const isActuallyComplete =
        !isPausedRef.current && 
        rem <= 0 &&
        !session.completedAt &&
        !playedSessionRef.current.has(session.id);

      if (isActuallyComplete && currentUser?.id) {
        const now = Date.now();
        
        const updatedSession: ExtendedActiveSession = {
          ...session,
          completedAt: now,
        };

        setCurrentSession(updatedSession);
        currentSessionRef.current = updatedSession; 
        
        localStorage.setItem(`focus_active_session_${currentUser.id}`, JSON.stringify(updatedSession));
        
        setIsSessionComplete(true);

        if (audioRef.current) {
          audioRef.current.loop = true;
          audioRef.current.volume = 1.0;
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([300, 100, 300, 100, 300]);
        }

        if (acquireLock(`focus_complete_alert_${updatedSession.id}`, 15000)) {
          addNotification(
            'focus',
            'Goal Reached',
            'You hit your target! Entering Extra Focus mode.',
            'high',
            '/focus'
          );
        }

        if (alarmTimeoutRef.current) {
          clearTimeout(alarmTimeoutRef.current);
        }

        alarmTimeoutRef.current = setTimeout(startExtraFocus, 10000);

        (async () => {
          if (currentUser?.id) {
            try {
              await (supabase as any).from("focus_active_sessions").update({
                session: updatedSession
              }).eq("user_id", currentUser.id).throwOnError(); 
            } catch (err) {}
          }
        })();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser?.id, getRemainingTime, getElapsedTime, triggerSessionComplete, getPausedTime, getExtraTime, stopAlarm, startExtraFocus, addNotification]); 

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
    if (!currentUser?.id) {
      addNotification('system', 'Auth Error', 'User not authenticated.', 'high');
      return;
    }

    if (audioRef.current) {
      audioRef.current.muted = true;
      audioRef.current.play()
        .then(() => {
          stopAlarm(); 
          if (audioRef.current) audioRef.current.muted = false;
        })
        .catch(() => {});
    }

    const { data: existing } = await (supabase as any).from("focus_active_sessions")
      .select("session")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (existing?.session) {
      const remoteSession = existing.session as ExtendedActiveSession;
      let updatedSession = { ...remoteSession };

      const segments = updatedSession.pauseSegments || [];
      const last = segments[segments.length - 1];

      // Resume logic
      if (last && !last.end) {
        last.end = Date.now();
        updatedSession.pauseSegments = segments;
        
        updatedSession.completedAt = undefined;
        updatedSession.extraStartTime = undefined;
      }

      setCurrentSession(updatedSession);
      currentSessionRef.current = updatedSession;
      setIsActive(true);
      isActiveRef.current = true;
      setIsPaused(false);
      isPausedRef.current = false;
      setIsSessionComplete(false); 
      
      const sessionDuration = updatedSession.initialDuration || initialSessionTime;
      setInitialSessionTime(sessionDuration);

      localStorage.setItem(`focus_active_session_${currentUser.id}`, JSON.stringify(updatedSession));
      
      try {
        await (supabase as any).from("focus_active_sessions").update({ session: updatedSession }).eq("user_id", currentUser.id).throwOnError();
      } catch (err) {}

      return; 
    }

    setIsActive(true);
    isActiveRef.current = true;
    setIsPaused(false);
    isPausedRef.current = false;
    setIsSessionComplete(false);
    setExtraTime(0);
    
    localStorage.removeItem(`focus_checkpoint_${currentUser.id}`);
    setInitialSessionTime(timeRemaining);
    
    const newSession: ExtendedActiveSession = {
      id: crypto.randomUUID(),
      taskId: activeTaskId,
      taskTitle: activeTaskId || "Untitled Focus",
      mode,
      startTime: Date.now(),
      distractions: [],
      pauseSegments: [],
      initialDuration: timeRemaining
    };
    
    playedSessionRef.current.delete(newSession.id);
    localStorage.setItem(`played_sessions_${currentUser.id}`, JSON.stringify(Array.from(playedSessionRef.current)));
    
    setCurrentSession(newSession);
    currentSessionRef.current = newSession;
    localStorage.setItem(`focus_active_session_${currentUser.id}`, JSON.stringify(newSession));

    if (acquireLock(`focus_start_alert_${newSession.id}`, 5000)) {
      addNotification('focus', 'Deep Work Initiated', 'Distractions suppressed. Maintain your focus.', 'low', '/focus');
    }

    try {
      await (supabase as any).from("focus_active_sessions").upsert({
        user_id: currentUser.id,
        session: newSession,
        last_seen: new Date().toISOString()
      }).throwOnError(); 
    } catch (err) {}
  };

  return (
    <FocusContext.Provider
      value={{
        currentUser, 
        isActive, isPaused, mode, timeRemaining, initialSessionTime, focusedTime,
        totalElapsed, activeTaskId,
        currentSession,
        extraTime, 
        distractions: Array.isArray(currentSession?.distractions) ? currentSession.distractions : [],
        sessions: sessionHistory,
        isSessionComplete,
        isLoaded, 
        dailyGoal, 
        updateDailyGoal, 
        setIsSessionComplete, 
        setTimeRemaining, 
        setInitialSessionTime, 
        setMode: setModeHandler, 
        setActiveTask: setActiveTaskId,
        startSession, 
        
        stopAlarm,
        startExtraFocus,

        pauseSession: () => {
          if (!currentSession || isPausedRef.current || !currentUser?.id) return; 

          setIsSessionComplete(false);
          stopAlarm(); 

          const updatedSession = {
            ...currentSession,
            pauseSegments: [
              ...(currentSession.pauseSegments || []),
              { start: Date.now() }
            ],
            completedAt: undefined, 
          };

          setCurrentSession(updatedSession);
          currentSessionRef.current = updatedSession;
          setIsPaused(true);
          isPausedRef.current = true;
          
          localStorage.setItem(`focus_active_session_${currentUser.id}`, JSON.stringify(updatedSession));
          
          if (currentUser?.id) {
            (async () => {
              try {
                await (supabase as any).from("focus_active_sessions").update({ session: updatedSession }).eq("user_id", currentUser.id).throwOnError();
              } catch (e) {}
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
          if (!currentUser?.id) return;
          setCurrentSession((prev) => {
            if (!prev) return prev;
            
            const base = currentSessionRef.current?.distractions || [];
        
            const updatedDistractions = [
              ...base,
              {
                id: crypto.randomUUID(),
                reason,
                timestamp: Date.now(),
              }
            ];
        
            const updated = {
              ...prev,
              distractions: updatedDistractions,
            };
        
            localStorage.setItem(`focus_active_session_${currentUser.id}`, JSON.stringify(updated));
            
            if (currentUser?.id) {
              (async () => {
                try {
                  await (supabase as any).from("focus_active_sessions").update({ session: updated }).eq("user_id", currentUser.id).throwOnError();
                } catch (e) {}
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
          if (!currentUser?.id) return;
          setCurrentSession((prev) => {
            if (!prev) return prev;
            
            const list = Array.isArray(prev.distractions) ? prev.distractions : [];
            
            const updated = {
              ...prev,
              distractions: list.length > 0 ? list.slice(0, -1) : [],
            };
            
            localStorage.setItem(`focus_active_session_${currentUser.id}`, JSON.stringify(updated));
            
            if (currentUser?.id) {
              (async () => {
                try {
                  await (supabase as any).from("focus_active_sessions").update({ session: updated }).eq("user_id", currentUser.id).throwOnError();
                } catch (e) {}
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