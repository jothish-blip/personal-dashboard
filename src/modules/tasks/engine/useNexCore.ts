"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'; 
import { Task, Log, Meta, NexState } from '../types';
import { useNotificationSystem } from '@/notifications/engine/useNotificationSystem'; 
import { handleTaskUpdate, handleGlobalState } from '@/notifications/engine/nexNotificationBrain';
import { getSupabaseClient } from "@/lib/supabase";

const KEY = 'NEXSPACE_V12_PRO_FINAL';
const OFFLINE_QUEUE_KEY = "nex_offline_queue";

type QueueAction =
  | { type: "ADD"; payload: any; retryCount?: number }
  | { type: "UPDATE"; id: string; payload: any; retryCount?: number }
  | { type: "DELETE"; id: string; retryCount?: number };

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

export function useNexCore() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { addNotification } = useNotificationSystem(currentUser?.id);

  const [state, setState] = useState<NexState>({
    tasks: [],
    logs: [],
    meta: {
      currentMonth: new Date().toISOString().slice(0, 7),
      isFocus: false,
      theme: 'dark',
      lockedDates: [],
      rollbackUsedDates: [],
    },
  });
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const cleanupRef = useRef<(() => void) | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const userRef = useRef<User | null>(null); 

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  const debouncedSave = (key: string, data: any) => {
    if (!debounceRef.current) {
      debounceRef.current = setTimeout(() => {
        localStorage.setItem(key, JSON.stringify(data));
        debounceRef.current = null;
      }, 1000);
    }
  };

  const logAction = async (action: string, name: string, detail: string) => {
    const user = userRef.current;
    const supabase = getSupabaseClient();
    const id = crypto.randomUUID();
    const time = new Date().toISOString();

    const newLog = { id, action, name, detail, time };

    setState(prev => {
      const newState = {
        ...prev,
        logs: [newLog, ...prev.logs].slice(0, 100)
      };
      debouncedSave(KEY, newState);
      return newState;
    });

    if (!user || !supabase) return;

    const { error } = await (supabase as any)
      .from("audit_logs")
      .insert({ id, user_id: user.id, action, name, detail, time });

    if (error) console.error("Audit log sync error:", error.message || error);
  };

  const fetchLogsFromDB = async () => {
    const user = userRef.current;
    if (!user) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data, error } = await (supabase as any)
      .from("audit_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("time", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Audit fetch error:", error.message || error);
      return;
    }

    setState(prev => {
      const newState = { ...prev, logs: data || [] };
      debouncedSave(KEY, newState);
      return newState;
    });
  };

  const addToQueue = (action: QueueAction) => {
    const queue: QueueAction[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    queue.push({ ...action, retryCount: 0 });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  };

  const processQueue = async () => {
    const queue: QueueAction[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    if (queue.length === 0) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setIsSyncing(true);
    let remainingQueue: QueueAction[] = [];

    for (let i = 0; i < queue.length; i++) {
      const action = queue[i];
      action.retryCount = (action.retryCount || 0) + 1;

      if (action.retryCount > 3) continue;

      try {
        const table = ((supabase as any).from("tasks"));
        if (action.type === "ADD") {
          const { data: exists } = await table.select("id").eq("id", action.payload.id).maybeSingle();
          if (!exists) {
            const { error } = await table.insert(action.payload);
            if (error) throw error;
          }
        } else if (action.type === "UPDATE") {
          const { error } = await table.update(action.payload).eq("id", action.id);
          if (error) throw error;
        } else if (action.type === "DELETE") {
          const { error } = await table.delete().eq("id", action.id);
          if (error) throw error;
        }
      } catch (e) {
        remainingQueue.push(action);
        continue; 
      }
    }

    if (remainingQueue.length === 0) {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      addNotification("system", "Sync Complete", "Offline actions have been synced to the cloud.", "medium");
    } else {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
    }
    setIsSyncing(false);
  };

  const fetchTasksFromDB = async () => {
    const user = userRef.current;
    if (!user) return;

    const supabase = getSupabaseClient();
    if (!supabase) return; 

    const { data, error } = await ((supabase as any).from("tasks")).select("*").eq("user_id", user.id);
    
    if (error) {
      console.error("Fetch error:", error.message || error);
      addNotification("system", "Sync Error", "Failed to fetch tasks", "high");
      return;
    }

    const newTasks = (data as any[] || []).map(t => ({
      id: t.id,
      name: t.name,
      group: t.group_name,
      history: t.history || {}
    }));

    setState(prev => {
      const newState = { ...prev, tasks: newTasks };
      debouncedSave(KEY, newState);
      return newState;
    });
  };

  const setupRealtime = () => {
    const user = userRef.current;
    if (!user) return null; 

    const supabase = getSupabaseClient();
    if (!supabase) return null; 
    
    if (cleanupRef.current) cleanupRef.current();

    const channelName = `realtime-${user.id}`;
    
    const existingChannels = supabase.getChannels();
    existingChannels.forEach((c) => {
      if (c.topic === `realtime:${channelName}`) {
        supabase.removeChannel(c);
      }
    });

    const channel = supabase.channel(channelName);

    channel.on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` }, () => {
      fetchTasksFromDB();
    });

    channel.on("postgres_changes", { event: "*", schema: "public", table: "audit_logs", filter: `user_id=eq.${user.id}` }, () => {
      fetchLogsFromDB();
    });

    channel.subscribe();

    const cleanup = () => {
      supabase.removeChannel(channel);
    };

    cleanupRef.current = cleanup;
    return cleanup;
  };

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return; 

    const handleAuthChange = async (session: Session | null) => {
      const newUser = session?.user ?? null;
      
      if (newUser?.id !== userRef.current?.id) {
        userRef.current = newUser;
        setCurrentUser(newUser); 
        
        if (newUser) {
          await fetchTasksFromDB();
          await fetchLogsFromDB();
          setupRealtime(); 
        } else {
          if (cleanupRef.current) cleanupRef.current();
          setState(prev => ({ ...prev, tasks: [], logs: [] })); 
        }
      }
    };

    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => {
      handleAuthChange(res.data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      handleAuthChange(session);
    });

    return () => {
      listener?.subscription?.unsubscribe();
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      if (typeof window === "undefined") return;
      setLoading(true);
      
      const saved = localStorage.getItem(KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as NexState;
          setState(prev => ({
            ...prev,
            meta: { ...parsed.meta, currentMonth: parsed.meta?.currentMonth || getTodayLocal().slice(0, 7) },
            logs: parsed.logs || [],
            tasks: prev.tasks.length === 0 ? (parsed.tasks || []) : prev.tasks
          }));
        } catch (e) { console.error(e); }
      }

      setMounted(true);
      setLoading(false);
      
      if (navigator.onLine) processQueue();
    };

    init();

    const handleOnline = () => {
      addNotification("system", "Back Online", "Connection restored. Syncing data...", "low");
      processQueue();
      fetchTasksFromDB();
      fetchLogsFromDB();
    };
    
    const handleOffline = () => addNotification("system", "Offline", "No internet connection. Actions will be queued.", "high");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      cleanupRef.current?.(); 
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleSilentRefresh = async () => {
      await fetchTasksFromDB();
      await fetchLogsFromDB();
    };

    window.addEventListener("nexspace-refresh", handleSilentRefresh);

    return () => {
      window.removeEventListener("nexspace-refresh", handleSilentRefresh);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine && userRef.current) {
        handleGlobalState(addNotification, state.tasks, []);
      }
    }, 30000); 

    return () => clearInterval(interval);
  }, [state.tasks, addNotification]);

  const currentStreak = useMemo(() => {
    if (state.tasks.length === 0) return 0;
    
    let streak = 0;
    const todayStr = getTodayLocal();
    const d = new Date(todayStr);

    const isDayActive = (dateStr: string) => state.tasks.some(t => t.history?.[dateStr]);

    let currentDateStr = todayStr;
    
    if (!isDayActive(currentDateStr)) {
      d.setDate(d.getDate() - 1);
      currentDateStr = d.toISOString().split('T')[0];
      if (!isDayActive(currentDateStr)) return 0;
    }

    while (isDayActive(currentDateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
      currentDateStr = d.toISOString().split('T')[0];
    }

    return streak;
  }, [state.tasks]);

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

    setState(prev => {
      if (prev.tasks.some(t => t.id === newId)) return prev;
      const newState = {
        ...prev,
        tasks: [...prev.tasks, { id: newId, name: name.trim(), group: groupName, history: {} }]
      };
      debouncedSave(KEY, newState);
      return newState;
    });

    await logAction("CREATE", name.trim(), `Created new objective in ${groupName}`);

    const supabase = getSupabaseClient();
    
    if (!navigator.onLine || !supabase) { 
      addToQueue({ type: "ADD", payload: newTaskDB });
      return;
    }

    const { error } = await ((supabase as any).from("tasks")).insert(newTaskDB);
    if (error) {
      addToQueue({ type: "ADD", payload: newTaskDB });
    }
  };

  const renameTask = async (id: string, newName: string) => {
    if (!newName.trim()) return;

    const user = userRef.current;
    if (!user) return;

    setState(prev => {
      const updatedTasks = prev.tasks.map(t => t.id === id ? { ...t, name: newName.trim() } : t);
      const newState = { ...prev, tasks: updatedTasks };
      debouncedSave(KEY, newState);
      return newState;
    });

    await logAction("UPDATE", newName.trim(), `Renamed objective`);

    const supabase = getSupabaseClient();
    if (!navigator.onLine || !supabase) {
      addToQueue({ type: "UPDATE", id, payload: { name: newName.trim() } });
      return;
    }

    const { error } = await ((supabase as any).from("tasks")).update({ name: newName.trim() }).eq("id", id);
    if (error) addToQueue({ type: "UPDATE", id, payload: { name: newName.trim() } });
  };

  const renameGroup = async (oldGroup: string, newGroup: string) => {
    if (!newGroup.trim() || oldGroup === newGroup.trim()) return;

    const user = userRef.current;
    if (!user) return;

    setState(prev => {
      const updatedTasks = prev.tasks.map(t => t.group === oldGroup ? { ...t, group: newGroup.trim() } : t);
      const newState = { ...prev, tasks: updatedTasks };
      debouncedSave(KEY, newState);
      return newState;
    });

    await logAction("UPDATE", newGroup.trim(), `Renamed group from ${oldGroup}`);

    const supabase = getSupabaseClient();
    if (!navigator.onLine || !supabase) {
      state.tasks.filter(t => t.group === oldGroup).forEach(t => {
        addToQueue({ type: "UPDATE", id: t.id, payload: { group_name: newGroup.trim() } });
      });
      return;
    }

    const { error } = await ((supabase as any).from("tasks"))
      .update({ group_name: newGroup.trim() })
      .eq("user_id", user.id)
      .eq("group_name", oldGroup);

    if (error) {
      state.tasks.filter(t => t.group === oldGroup).forEach(t => {
        addToQueue({ type: "UPDATE", id: t.id, payload: { group_name: newGroup.trim() } });
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

    setState(prev => {
      const newState = { ...prev, tasks: updatedTasksArray };
      debouncedSave(KEY, newState);
      return newState;
    });

    await logAction("TOGGLE", task.name, `Marked as ${status ? 'Complete' : 'Incomplete'} for ${dateStr}`);

    queueMicrotask(() => {
      window.dispatchEvent(new Event("nexspace-live-update"));
    });
    
    if (status) handleTaskUpdate(addNotification, updatedTasksArray, dateStr); 

    const supabase = getSupabaseClient();

    if (!navigator.onLine || !supabase) { 
      addToQueue({ type: "UPDATE", id, payload: { history: updatedHistory } });
      return;
    }

    const { error } = await ((supabase as any).from("tasks")).update({ history: updatedHistory }).eq("id", id);
    if (error) addToQueue({ type: "UPDATE", id, payload: { history: updatedHistory } });
  };

  const deleteTask = async (id: string) => {
    const user = userRef.current;
    if (!user) return;

    const taskToDelete = state.tasks.find(t => t.id === id);

    setState(prev => {
      const newState = { ...prev, tasks: prev.tasks.filter(t => t.id !== id) };
      debouncedSave(KEY, newState);
      return newState;
    });

    if (taskToDelete) {
      await logAction("DELETE", taskToDelete.name, "Permanently deleted objective");
    }

    const supabase = getSupabaseClient();
    if (!navigator.onLine || !supabase) { 
      addToQueue({ type: "DELETE", id });
      return;
    }

    const { error } = await ((supabase as any).from("tasks")).delete().eq("id", id);
    if (error) addToQueue({ type: "DELETE", id });
  };

  const lockToday = async () => {
    const today = getTodayLocal();
    let alreadyLocked = false;

    setState(prev => {
      if (prev.meta.lockedDates.includes(today)) {
        alreadyLocked = true;
        return prev;
      }
      const newState = { 
        ...prev, 
        meta: { ...prev.meta, lockedDates: [...new Set([...prev.meta.lockedDates, today])] }
      };
      debouncedSave(KEY, newState);
      return newState;
    });

    if (!alreadyLocked) {
      await logAction("SYSTEM", "Daily Lock", `Locked execution data for ${today}`);
    }
  };

  const unlockDate = async (dateStr: string) => {
    const today = getTodayLocal();
    let requiresUnlock = true;

    setState(prev => {
      if (dateStr !== today || prev.meta.rollbackUsedDates?.includes(dateStr) || !prev.meta.lockedDates.includes(dateStr)) {
        requiresUnlock = false;
        return prev;
      }
      const newState = { 
        ...prev, 
        meta: { ...prev.meta, lockedDates: prev.meta.lockedDates.filter(d => d !== dateStr), rollbackUsedDates: [...(prev.meta.rollbackUsedDates || []), dateStr] }
      };
      debouncedSave(KEY, newState);
      return newState;
    });

    if (requiresUnlock) {
      await logAction("SYSTEM", "Unlock", `Rollback utilized for ${dateStr}`);
    }
  };

  const setMonthYear = (value: string) => {
    setState(prev => {
      const newState = { ...prev, meta: { ...prev.meta, currentMonth: value } };
      debouncedSave(KEY, newState);
      return newState;
    });
  };

  const setFocus = (value: boolean) => {
    setState(prev => {
      const newState = { ...prev, meta: { ...prev.meta, isFocus: value } };
      debouncedSave(KEY, newState);
      return newState;
    });
  };

  const exportData = async () => {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nex-backup-${new Date().toISOString().slice(0,10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    
    await logAction("EXPORT", "Data Backup", "User exported full JSON state");
  };

  const addAuditLog = async (action: string, name: string, detail: string) => {
    await logAction(action, name, detail);
  };

  const clearAllLogs = async () => {
    if (!window.confirm("Delete all audit logs? This action cannot be undone.")) return;
    
    setState(prev => {
      const newState = { ...prev, logs: [] };
      debouncedSave(KEY, newState);
      return newState;
    });

    const user = userRef.current;
    const supabase = getSupabaseClient();
    
    if (user && supabase && navigator.onLine) {
      await (supabase as any).from("audit_logs").delete().eq("user_id", user.id);
    }
  };

  const deleteLog = async (id: string | number) => {
    setState(prev => {
      const newState = { ...prev, logs: prev.logs.filter(l => l.id !== id) };
      debouncedSave(KEY, newState);
      return newState;
    });

    const user = userRef.current;
    const supabase = getSupabaseClient();
    
    if (user && supabase && navigator.onLine) {
      await (supabase as any).from("audit_logs").delete().eq("id", id).eq("user_id", user.id);
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