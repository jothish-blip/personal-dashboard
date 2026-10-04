"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'; 
import { Task, Log, Meta, NexState } from '../types';
import { useNotificationSystem } from '@/notifications/engine/useNotificationSystem'; 
import { handleTaskUpdate, handleGlobalState } from '@/notifications/engine/nexNotificationBrain';
import { getSupabaseClient } from "@/lib/supabase";

export const getTasksCacheKey = (userId: string) => `NEXSPACE_TASKS_CACHE_${userId}`;
export const getOfflineQueueKey = (userId: string) => `nex_offline_queue_${userId}`;

type QueueAction =
  | { type: "ADD"; payload: any; retryCount?: number }
  | { type: "UPDATE"; id: string; payload: any; retryCount?: number }
  | { type: "DELETE"; id: string; retryCount?: number }
  | { type: "LOG"; payload: any; retryCount?: number };

const getTodayLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

const checkMomentum = (tasks: Task[], dateStr: string) => {
  const total = tasks.length;
  const done = tasks.filter(t => t.history[dateStr] === true).length;
  const pending = total - done;
  const percentage = total > 0 ? (done / total) * 100 : 0;

  if (percentage === 100 && total > 0) return { title: "Perfect Execution 🏆", body: "All objectives completed today. Elite performance.", priority: 'high' };
  if (percentage >= 70 && pending > 0) return { title: "Almost There 🚀", body: `${pending} tasks left. Finish strong.`, priority: 'medium' };
  if (total > 5 && percentage < 30) return { title: "Momentum Warning ⚠️", body: `Only ${done}/${total} done. Regain your velocity.`, priority: 'high' };
  return null;
};

const getInitialMeta = (): Meta => ({
  currentMonth: getTodayLocal().slice(0, 7),
  isFocus: false,
  theme: 'dark',
  lockedDates: [],
  rollbackUsedDates: [],
});

let globalNexState: NexState = {
  tasks: [],
  logs: [],
  meta: getInitialMeta(),
};
const globalNexSubscribers = new Set<React.Dispatch<React.SetStateAction<NexState>>>();
let globalRealtimeChannel: any = null;
let isProcessingQueue = false;
let globalMomentumInterval: NodeJS.Timeout | null = null;
let globalCurrentUserId: string | null = null;

const setGlobalState = (action: React.SetStateAction<NexState>) => {
  const nextState = typeof action === "function" ? (action as any)(globalNexState) : action;
  globalNexState = nextState;
  globalNexSubscribers.forEach(set => set(nextState));
};

export function useNexCore() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { addNotification } = useNotificationSystem(currentUser?.id);

  const [state, setState] = useState<NexState>(globalNexState);
  
  useEffect(() => {
    globalNexSubscribers.add(setState);
    return () => { globalNexSubscribers.delete(setState); };
  }, []);
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const cleanupRef = useRef<(() => void) | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const userRef = useRef<User | null>(null); 

  // Cleanup timers & channels on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  // Debounced cache saving scoped to authenticated user
  const debouncedSave = useCallback((key: string, data: any) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
          console.error("Local cache save failed:", e);
        }
      }
      debounceRef.current = null;
    }, 500);
  }, []);

  // Save audit log to Supabase & local state
  const logAction = async (action: string, name: string, detail: string) => {
    const user = userRef.current;
    if (!user) return;

    const supabase = getSupabaseClient();
    const id = crypto.randomUUID();
    const time = new Date().toISOString();

    const newLog: Log = { id, action, name, detail, time };

    setGlobalState(prev => {
      const newState = {
        ...prev,
        logs: [newLog, ...prev.logs].slice(0, 100)
      };
      debouncedSave(getTasksCacheKey(user.id), newState);
      return newState;
    });

    const record = { id, user_id: user.id, action, name, detail, time };

    if (!navigator.onLine || !supabase) {
      addToQueue(user.id, { type: "LOG", payload: record });
      return;
    }

    const { error } = await (supabase as any)
      .from("audit_logs")
      .insert(record);

    if (error) {
      console.error("Audit log sync error:", error.message || error);
      addToQueue(user.id, { type: "LOG", payload: record });
    }
  };

  // Fetch audit logs and authoritative lock dates from Supabase
  const fetchLogsAndMetaFromDB = async (userId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data, error } = await (supabase as any)
      .from("audit_logs")
      .select("*")
      .eq("user_id", userId)
      .order("time", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Audit fetch error:", error.message || error);
      return;
    }

    const allLogs = (data as any[] || []);
    
    // Derive user-specific daily locks and rollback state from audit_logs
    const systemLogs = allLogs.filter((l: any) => l.action === "SYSTEM");
    const lockedSet = new Set<string>();
    const rollbackSet = new Set<string>();

    const chronological = [...systemLogs].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    for (const log of chronological) {
      const dateStr = log.detail?.trim();
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

      if (log.name === "Daily Lock") {
        lockedSet.add(dateStr);
      } else if (log.name === "Unlock") {
        lockedSet.delete(dateStr);
        rollbackSet.add(dateStr);
      }
    }

    // Keep user-facing logs (non-SYSTEM or all)
    const userFacingLogs: Log[] = allLogs
      .filter((l: any) => l.action !== "SYSTEM")
      .map(l => ({ id: l.id, action: l.action, name: l.name, detail: l.detail, time: l.time }));

    setGlobalState(prev => {
      const newState: NexState = {
        ...prev,
        logs: userFacingLogs,
        meta: {
          ...prev.meta,
          lockedDates: Array.from(lockedSet),
          rollbackUsedDates: Array.from(rollbackSet),
        }
      };
      debouncedSave(getTasksCacheKey(userId), newState);
      return newState;
    });
  };

  // Add mutation to user-scoped offline queue
  const addToQueue = (userId: string, action: QueueAction) => {
    if (typeof window === "undefined") return;
    const queueKey = getOfflineQueueKey(userId);
    try {
      const queue: QueueAction[] = JSON.parse(localStorage.getItem(queueKey) || "[]");
      queue.push({ ...action, retryCount: 0 });
      localStorage.setItem(queueKey, JSON.stringify(queue));
    } catch (e) {
      console.error("Failed to add to offline queue:", e);
    }
  };

  // Process only this authenticated user's offline queue
  const processQueue = async (userId: string) => {
    if (typeof window === "undefined" || isProcessingQueue) return;
    isProcessingQueue = true;
    const queueKey = getOfflineQueueKey(userId);
    let queue: QueueAction[] = [];
    try {
      queue = JSON.parse(localStorage.getItem(queueKey) || "[]");
    } catch (e) {
      isProcessingQueue = false;
      return;
    }

    if (queue.length === 0) {
      isProcessingQueue = false;
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      isProcessingQueue = false;
      return;
    }

    setIsSyncing(true);
    const remainingQueue: QueueAction[] = [];

    for (let i = 0; i < queue.length; i++) {
      const action = queue[i];
      action.retryCount = (action.retryCount || 0) + 1;

      if (action.retryCount > 3) continue;

      try {
        if (action.type === "ADD") {
          const table = (supabase as any).from("tasks");
          const { data: exists } = await table.select("id").eq("id", action.payload.id).maybeSingle();
          if (!exists) {
            const { error } = await table.insert({ ...action.payload, user_id: userId });
            if (error) throw error;
          }
        } else if (action.type === "UPDATE") {
          const { error } = await (supabase as any)
            .from("tasks")
            .update(action.payload)
            .eq("id", action.id)
            .eq("user_id", userId);
          if (error) throw error;
        } else if (action.type === "DELETE") {
          const { error } = await (supabase as any)
            .from("tasks")
            .delete()
            .eq("id", action.id)
            .eq("user_id", userId);
          if (error) throw error;
        } else if (action.type === "LOG") {
          const { error } = await (supabase as any)
            .from("audit_logs")
            .insert({ ...action.payload, user_id: userId });
          if (error) throw error;
        }
      } catch (e) {
        remainingQueue.push(action);
      }
    }

    if (remainingQueue.length === 0) {
      localStorage.removeItem(queueKey);
      addNotification("system", "Sync Complete", "Offline actions have been synced to the cloud.", "medium");
    } else {
      localStorage.setItem(queueKey, JSON.stringify(remainingQueue));
    }
    setIsSyncing(false);
    isProcessingQueue = false;
  };

  // Authoritative task fetch from Supabase
  const fetchTasksFromDB = async (userId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return; 

    const { data, error } = await (supabase as any)
      .from("tasks")
      .select("*")
      .eq("user_id", userId);
    
    if (error) {
      console.error("Fetch tasks error:", error.message || error);
      addNotification("system", "Sync Error", "Failed to fetch tasks", "high");
      return;
    }

    const newTasks: Task[] = (data as any[] || []).map(t => ({
      id: t.id,
      name: t.name,
      group: t.group_name,
      history: t.history || {}
    }));

    setGlobalState(prev => {
      const newState = { ...prev, tasks: newTasks };
      debouncedSave(getTasksCacheKey(userId), newState);
      return newState;
    });
  };

  // Realtime subscription scoped to authenticated user ID
  const setupRealtime = (userId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return null; 
    
    if (globalRealtimeChannel && globalCurrentUserId === userId) return;
    if (globalRealtimeChannel) {
      supabase.removeChannel(globalRealtimeChannel);
      globalRealtimeChannel = null;
    }

    const channelName = `realtime-${userId}`;
    const channel = supabase.channel(channelName);
    
    globalRealtimeChannel = channel;
    globalCurrentUserId = userId;

    channel.on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` }, () => {
      fetchTasksFromDB(userId);
    });

    channel.on("postgres_changes", { event: "*", schema: "public", table: "audit_logs", filter: `user_id=eq.${userId}` }, () => {
      fetchLogsAndMetaFromDB(userId);
    });

    channel.subscribe();

    const cleanup = () => {
      // We don't remove the channel here because other components might still be using the hook.
      // We only clean it up in Auth change or globally if needed.
    };

    cleanupRef.current = cleanup;
    return cleanup;

  };
  // AUTH STATE ORCHESTRATION: strictly avoid race conditions
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return; 

    // Purge any legacy global keys discovered in the app
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem('NEXSPACE_V12_PRO_FINAL');
        localStorage.removeItem('nex_offline_queue');
        localStorage.removeItem('nexspace_tasks');
      } catch (e) {}
    }

    const handleAuthChange = async (session: Session | null) => {
      const newUser = session?.user ?? null;
      
      if (newUser?.id !== userRef.current?.id) {
        userRef.current = newUser;
        setCurrentUser(newUser); 
        
        if (newUser) {
          // 1. Try loading user-specific cache for instant UI responsiveness
          const userCacheKey = getTasksCacheKey(newUser.id);
          const cached = typeof window !== "undefined" ? localStorage.getItem(userCacheKey) : null;
          if (cached) {
            try {
              const parsed = JSON.parse(cached) as NexState;
              const todayMonth = getTodayLocal().slice(0, 7);
              setGlobalState({
                tasks: parsed.tasks || [],
                logs: parsed.logs || [],
                meta: {
                  ...getInitialMeta(),
                  ...(parsed.meta || {}),
                  currentMonth: todayMonth,
                },
              });
            } catch (e) {
              console.error("Cache parse error:", e);
            }
          } else {
            // Fresh state for new user
            setGlobalState({
              tasks: [],
              logs: [],
              meta: getInitialMeta(),
            });
          }

          setLoading(false);
          setMounted(true);

          // 2. Fetch authoritative data from database
          await Promise.all([
            fetchTasksFromDB(newUser.id),
            fetchLogsAndMetaFromDB(newUser.id),
          ]);

          // 3. Setup realtime and process offline queue
          setupRealtime(newUser.id);
          if (navigator.onLine) {
            processQueue(newUser.id);
          }
        } else {
          // User signed out: zero out in-memory state immediately
          if (cleanupRef.current) cleanupRef.current();
          setGlobalState({
            tasks: [],
            logs: [],
            meta: getInitialMeta(),
          });
          setLoading(false);
          setMounted(true);
        }
      }
    };

    // Initial session retrieval
    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => {
      handleAuthChange(res.data.session);
    });

    // Realtime auth listener
    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      handleAuthChange(session);
    });

    // Listen for custom logout event
    const handleLogoutEvent = () => {
      if (cleanupRef.current) cleanupRef.current();
      userRef.current = null;
      setCurrentUser(null);
      setGlobalState({
        tasks: [],
        logs: [],
        meta: getInitialMeta(),
      });
    };

    window.addEventListener("nexspace-logout", handleLogoutEvent);

    return () => {
      listener?.subscription?.unsubscribe();
      window.removeEventListener("nexspace-logout", handleLogoutEvent);
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => {
      addNotification("system", "Back Online", "Connection restored. Syncing data...", "low");
      const user = userRef.current;
      if (user) {
        processQueue(user.id);
        fetchTasksFromDB(user.id);
        fetchLogsAndMetaFromDB(user.id);
      }
    };
    
    const handleOffline = () => addNotification("system", "Offline", "No internet connection. Actions will be queued.", "high");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [addNotification]);

  // Auto-sync month on rollover
  useEffect(() => {
    const syncMonth = () => {
      const todayMonth = getTodayLocal().slice(0, 7);
      const user = userRef.current;

      setGlobalState(prev => {
        if (prev.meta.currentMonth === todayMonth) return prev;
        const next = {
          ...prev,
          meta: {
            ...prev.meta,
            currentMonth: todayMonth,
          },
        };
        if (user) debouncedSave(getTasksCacheKey(user.id), next);
        return next;
      });
    };

    syncMonth();
    window.addEventListener("focus", syncMonth);
    return () => window.removeEventListener("focus", syncMonth);
  }, [debouncedSave]);

  // Silent refresh listener
  useEffect(() => {
    const handleSilentRefresh = async () => {
      const user = userRef.current;
      if (user) {
        await Promise.all([
          fetchTasksFromDB(user.id),
          fetchLogsAndMetaFromDB(user.id),
        ]);
      }
    };

    window.addEventListener("nexspace-refresh", handleSilentRefresh);
    return () => window.removeEventListener("nexspace-refresh", handleSilentRefresh);
  }, []);

  // Streak calculation strictly derived from user's tasks
  const currentStreak = useMemo(() => {
    if (state.tasks.length === 0) return 0;
    
    let streak = 0;
    let currentDateStr = getTodayLocal();

    const isDayActive = (dateStr: string) => state.tasks.some(t => t.history?.[dateStr]);

    const getPreviousDayStr = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d - 1);
      const yy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    };

    if (!isDayActive(currentDateStr)) {
      currentDateStr = getPreviousDayStr(currentDateStr);
      if (!isDayActive(currentDateStr)) return 0;
    }

    while (isDayActive(currentDateStr)) {
      streak++;
      currentDateStr = getPreviousDayStr(currentDateStr);
    }

    return streak;
  }, [state.tasks]);

  // Periodic momentum checks
  useEffect(() => {
    if (!globalMomentumInterval) {
      globalMomentumInterval = setInterval(() => {
        if (navigator.onLine && globalCurrentUserId) {
          handleGlobalState(addNotification, globalNexState.tasks, [], globalCurrentUserId);
        }
      }, 30000); 
    }
    return () => {
      // Intentionally leaving interval alive across component unmounts until total app unmount
    };
  }, [addNotification]);

  // Task Mutations
  const addTask = async (name: string, group: string) => {
    if (!name.trim()) return;
    
    const user = userRef.current;
    if (!user) {
      addNotification("system", "Auth Error", "User not ready. Try again.", "high");
      return;
    }

    const newId = crypto.randomUUID(); 
    const groupName = (group.trim() || "GENERAL").toUpperCase();
    const newTaskDB = { id: newId, name: name.trim(), group_name: groupName, history: {}, user_id: user.id };

    setGlobalState(prev => {
      if (prev.tasks.some(t => t.id === newId)) return prev;
      const newState = {
        ...prev,
        tasks: [...prev.tasks, { id: newId, name: name.trim(), group: groupName, history: {} }]
      };
      debouncedSave(getTasksCacheKey(user.id), newState);
      return newState;
    });

    await logAction("CREATE", name.trim(), `Created new objective in ${groupName}`);

    const supabase = getSupabaseClient();
    
    if (!navigator.onLine || !supabase) { 
      addToQueue(user.id, { type: "ADD", payload: newTaskDB });
      return;
    }

    const { error } = await ((supabase as any).from("tasks")).insert(newTaskDB);
    if (error) {
      addToQueue(user.id, { type: "ADD", payload: newTaskDB });
    }
  };

  const renameTask = async (id: string, newName: string) => {
    if (!newName.trim()) return;

    const user = userRef.current;
    if (!user) return;

    setGlobalState(prev => {
      const updatedTasks = prev.tasks.map(t => t.id === id ? { ...t, name: newName.trim() } : t);
      const newState = { ...prev, tasks: updatedTasks };
      debouncedSave(getTasksCacheKey(user.id), newState);
      return newState;
    });

    await logAction("UPDATE", newName.trim(), `Renamed objective`);

    const supabase = getSupabaseClient();
    if (!navigator.onLine || !supabase) {
      addToQueue(user.id, { type: "UPDATE", id, payload: { name: newName.trim() } });
      return;
    }

    const { error } = await ((supabase as any).from("tasks"))
      .update({ name: newName.trim() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) addToQueue(user.id, { type: "UPDATE", id, payload: { name: newName.trim() } });
  };

  const renameGroup = async (oldGroup: string, newGroup: string) => {
    if (!newGroup.trim() || oldGroup === newGroup.trim()) return;

    const user = userRef.current;
    if (!user) return;

    setGlobalState(prev => {
      const updatedTasks = prev.tasks.map(t => t.group === oldGroup ? { ...t, group: newGroup.trim() } : t);
      const newState = { ...prev, tasks: updatedTasks };
      debouncedSave(getTasksCacheKey(user.id), newState);
      return newState;
    });

    await logAction("UPDATE", newGroup.trim(), `Renamed group from ${oldGroup}`);

    const supabase = getSupabaseClient();
    if (!navigator.onLine || !supabase) {
      state.tasks.filter(t => t.group === oldGroup).forEach(t => {
        addToQueue(user.id, { type: "UPDATE", id: t.id, payload: { group_name: newGroup.trim() } });
      });
      return;
    }

    const { error } = await ((supabase as any).from("tasks"))
      .update({ group_name: newGroup.trim() })
      .eq("user_id", user.id)
      .eq("group_name", oldGroup);

    if (error) {
      state.tasks.filter(t => t.group === oldGroup).forEach(t => {
        addToQueue(user.id, { type: "UPDATE", id: t.id, payload: { group_name: newGroup.trim() } });
      });
    }
  };

  const toggleTask = async (id: string, dateStr: string) => {
    if (state.meta.lockedDates.includes(dateStr)) {
      addNotification('system', 'Access Denied', 'Cannot modify finalized logs.', 'high');
      return;
    }
    
    const user = userRef.current;
    if (!user) {
      addNotification("system", "Auth Error", "User not ready. Try again.", "high");
      return;
    }

    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const status = !task.history[dateStr];
    const updatedHistory = { ...task.history, [dateStr]: status };
    const updatedTasksArray = state.tasks.map(t => t.id === id ? { ...t, history: updatedHistory } : t);

    setGlobalState(prev => {
      const newState = { ...prev, tasks: updatedTasksArray };
      debouncedSave(getTasksCacheKey(user.id), newState);
      return newState;
    });

    await logAction("TOGGLE", task.name, `Marked as ${status ? 'Complete' : 'Incomplete'} for ${dateStr}`);

    queueMicrotask(() => {
      window.dispatchEvent(new Event("nexspace-live-update"));
    });
    
    if (status && userRef.current) handleTaskUpdate(addNotification, updatedTasksArray, dateStr, userRef.current.id); 

    const supabase = getSupabaseClient();

    if (!navigator.onLine || !supabase) { 
      addToQueue(user.id, { type: "UPDATE", id, payload: { history: updatedHistory } });
      return;
    }

    const { error } = await ((supabase as any).from("tasks"))
      .update({ history: updatedHistory })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) addToQueue(user.id, { type: "UPDATE", id, payload: { history: updatedHistory } });
  };

  const deleteTask = async (id: string) => {
    const user = userRef.current;
    if (!user) return;

    const taskToDelete = state.tasks.find(t => t.id === id);

    setGlobalState(prev => {
      const newState = { ...prev, tasks: prev.tasks.filter(t => t.id !== id) };
      debouncedSave(getTasksCacheKey(user.id), newState);
      return newState;
    });

    if (taskToDelete) {
      await logAction("DELETE", taskToDelete.name, "Permanently deleted objective");
    }

    const supabase = getSupabaseClient();
    if (!navigator.onLine || !supabase) { 
      addToQueue(user.id, { type: "DELETE", id });
      return;
    }

    const { error } = await ((supabase as any).from("tasks"))
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) addToQueue(user.id, { type: "DELETE", id });
  };

  // Lock Today: updates local state, user cache, and persists to Supabase audit_logs
  const lockToday = async () => {
    const user = userRef.current;
    if (!user) return;

    const today = getTodayLocal();
    let alreadyLocked = false;

    setGlobalState(prev => {
      if (prev.meta.lockedDates.includes(today)) {
        alreadyLocked = true;
        return prev;
      }
      const updatedMeta = { 
        ...prev.meta, 
        lockedDates: [...new Set([...prev.meta.lockedDates, today])] 
      };
      const newState = { ...prev, meta: updatedMeta };
      debouncedSave(getTasksCacheKey(user.id), newState);
      return newState;
    });

    if (!alreadyLocked) {
      await logAction("SYSTEM", "Daily Lock", today);
    }
  };

  // Unlock Date: uses rollback token, updates local state, user cache, and persists to Supabase audit_logs
  const unlockDate = async (dateStr: string) => {
    const user = userRef.current;
    if (!user) return;

    const today = getTodayLocal();
    let requiresUnlock = true;

    setGlobalState(prev => {
      if (dateStr !== today || prev.meta.rollbackUsedDates?.includes(dateStr) || !prev.meta.lockedDates.includes(dateStr)) {
        requiresUnlock = false;
        return prev;
      }
      const updatedMeta = { 
        ...prev.meta, 
        lockedDates: prev.meta.lockedDates.filter(d => d !== dateStr), 
        rollbackUsedDates: [...(prev.meta.rollbackUsedDates || []), dateStr] 
      };
      const newState = { ...prev, meta: updatedMeta };
      debouncedSave(getTasksCacheKey(user.id), newState);
      return newState;
    });

    if (requiresUnlock) {
      await logAction("SYSTEM", "Unlock", dateStr);
    }
  };

  const setMonthYear = (value: string) => {
    const user = userRef.current;
    setGlobalState(prev => {
      if (prev.meta.currentMonth === value) return prev;
      const next = { ...prev, meta: { ...prev.meta, currentMonth: value } };
      if (user) debouncedSave(getTasksCacheKey(user.id), next);
      return next;
    });
  };

  const setFocus = (value: boolean) => {
    const user = userRef.current;
    setGlobalState(prev => {
      const newState = { ...prev, meta: { ...prev.meta, isFocus: value } };
      if (user) debouncedSave(getTasksCacheKey(user.id), newState);
      return newState;
    });
  };

  const exportData = async () => {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nex-backup-${getTodayLocal()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    
    await logAction("EXPORT", "Data Backup", "User exported full JSON state");
  };

  const addAuditLog = async (action: string, name: string, detail: string) => {
    await logAction(action, name, detail);
  };

  // Clears user-facing logs without deleting SYSTEM lock records
  const clearAllLogs = async () => {
    const user = userRef.current;
    if (!user) return;

    if (!window.confirm("Delete all audit logs? This action cannot be undone.")) return;
    
    setGlobalState(prev => {
      const newState = { ...prev, logs: [] };
      debouncedSave(getTasksCacheKey(user.id), newState);
      return newState;
    });

    const supabase = getSupabaseClient();
    if (supabase && navigator.onLine) {
      await (supabase as any)
        .from("audit_logs")
        .delete()
        .eq("user_id", user.id)
        .neq("action", "SYSTEM");
    }
  };

  const deleteLog = async (id: string | number) => {
    const user = userRef.current;
    if (!user) return;

    setGlobalState(prev => {
      const newState = { ...prev, logs: prev.logs.filter(l => l.id !== id) };
      debouncedSave(getTasksCacheKey(user.id), newState);
      return newState;
    });

    const supabase = getSupabaseClient();
    if (supabase && navigator.onLine) {
      await (supabase as any)
        .from("audit_logs")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
    }
  };

  return {
    state,
    mounted,
    loading,
    isSyncing, 
    addTask,
    renameTask,
    renameGroup,
    deleteTask,
    toggleTask,
    lockToday,
    unlockDate,
    setFocus,
    setMonthYear,
    exportData,
    checkMomentum,
    addAuditLog,
    clearAllLogs,
    deleteLog,
    currentUser,
    currentStreak 
  };
}