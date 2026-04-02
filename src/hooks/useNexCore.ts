"use client";

import { useState, useEffect } from 'react';
import { Task, Log, Meta, NexState } from '../types';

const KEY = 'NEXTASK_V12_PRO_FINAL';

/**
 * Helper: Reliable Local Date String (YYYY-MM-DD)
 */
const getTodayLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export function useNexCore() {
  const [state, setState] = useState<NexState>({
    tasks: [],
    logs: [],
    meta: {
      currentMonth: new Date().toISOString().slice(0, 7),
      isFocus: false,
      theme: 'dark', // Defaulting to dark as per preference
      lockedDates: [],
      rollbackUsedDates: [],
    },
  });
  const [mounted, setMounted] = useState(false);

  // 1. Initial Load with Data Sanitization
  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as NexState;
        
        // --- DATA SANITIZATION ---
        // 1. Guarantee Safe Meta
        parsed.meta = {
          currentMonth: parsed.meta?.currentMonth || getTodayLocal().slice(0, 7),
          isFocus: parsed.meta?.isFocus ?? false,
          theme: parsed.meta?.theme || 'dark',
          lockedDates: parsed.meta?.lockedDates || [],
          rollbackUsedDates: parsed.meta?.rollbackUsedDates || []
        };

        // 2. Fix Legacy Logs (Add IDs if missing or duplicate)
        if (Array.isArray(parsed.logs)) {
          parsed.logs = parsed.logs.map((log, i) => ({
            ...log,
            id: (log.id && log.id !== "") 
              ? log.id 
              : `${Date.now()}-legacy-${i}-${Math.random().toString(36).slice(2, 5)}`
          }));
        } else {
          parsed.logs = [];
        }

        setState(parsed);
      } catch (e) {
        console.error("Storage corruption detected:", e);
      }
    }
    setMounted(true);
  }, []);

  // 2. Functional State Updater (Prevents stale closure bugs)
  const saveState = (updater: (prev: NexState) => NexState) => {
    setState(prev => {
      const newState = updater(prev);
      localStorage.setItem(KEY, JSON.stringify(newState));
      return newState;
    });
  };

  /**
   * FIXED: Strong Unique ID Generation
   */
  const logAction = (action: string, name: string, detail: string, currentState: NexState): Log[] => {
    const newLog: Log = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, // Strong ID
      time: new Date().toLocaleString(), 
      action, 
      name, 
      detail
    };
    return [newLog, ...currentState.logs].slice(0, 100); // Increased log capacity slightly
  };

  // --- ACTIONS ---

  const lockToday = () => {
    const today = getTodayLocal();
    saveState(prev => {
      if (prev.meta.lockedDates.includes(today)) return prev;

      const updatedState: NexState = {
        ...prev,
        meta: {
          ...prev.meta,
          lockedDates: [...new Set([...prev.meta.lockedDates, today])]
        }
      };
      updatedState.logs = logAction("LOCK", "User", `Locked ${today}`, updatedState);
      return updatedState;
    });
  };

  const unlockDate = (dateStr: string) => {
    const today = getTodayLocal();
    saveState(prev => {
      if (dateStr !== today) return prev;

      const alreadyUsed = prev.meta.rollbackUsedDates || [];
      const isLocked = prev.meta.lockedDates.includes(dateStr);

      if (alreadyUsed.includes(dateStr) || !isLocked) return prev;

      const updatedState: NexState = {
        ...prev,
        meta: {
          ...prev.meta,
          lockedDates: prev.meta.lockedDates.filter(d => d !== dateStr),
          rollbackUsedDates: [...alreadyUsed, dateStr]
        }
      };

      updatedState.logs = logAction("ROLLBACK", "User", `Unlocked ${dateStr}`, updatedState);
      return updatedState;
    });
  };

  const toggleTask = (id: number, dateStr: string) => {
    saveState(prev => {
      if (prev.meta.lockedDates.includes(dateStr)) return prev;

      const targetTask = prev.tasks.find(t => t.id === id);
      if (!targetTask) return prev;

      const status = !targetTask.history[dateStr];
      const updatedTasks = prev.tasks.map(task => {
        if (task.id !== id) return task;
        return {
          ...task,
          history: { ...task.history, [dateStr]: status }
        };
      });

      const updatedState: NexState = { ...prev, tasks: updatedTasks };
      updatedState.logs = logAction("TOGGLE", targetTask.name, status ? "DONE" : "OPEN", updatedState);
      return updatedState;
    });
  };

  const addTask = (name: string, group: string) => {
    if (!name.trim()) return;
    saveState(prev => {
      const newTask: Task = { 
        id: Date.now(), 
        name: name.trim(), 
        group: (group.trim() || "GENERAL").toUpperCase(), 
        history: {} 
      };
      const updatedState = { ...prev, tasks: [...prev.tasks, newTask] };
      updatedState.logs = logAction("CREATE", newTask.name, newTask.group, updatedState);
      return updatedState;
    });
  };

  const deleteTask = (id: number) => {
    if (!window.confirm("Delete objective?")) return;
    saveState(prev => {
      const task = prev.tasks.find(t => t.id === id);
      const updatedState = { ...prev, tasks: prev.tasks.filter(t => t.id !== id) };
      if (task) updatedState.logs = logAction("DELETE", task.name, "Removed", updatedState);
      return updatedState;
    });
  };

  const addAuditLog = (detail: string) => {
    saveState(prev => {
      const updatedState = { ...prev };
      updatedState.logs = logAction("USER_ACTION", "System", detail, updatedState);
      return updatedState;
    });
  };

  const setFocus = (value: boolean) => {
    saveState(prev => ({
      ...prev,
      meta: { ...prev.meta, isFocus: value }
    }));
  };

  const setMonthYear = (value: string) => {
    saveState(prev => ({
      ...prev,
      meta: { ...prev.meta, currentMonth: value }
    }));
  };

  const exportData = () => {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nex-backup-${new Date().toISOString().slice(0,10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return {
    state,
    mounted,
    addTask,
    deleteTask,
    toggleTask,
    lockToday,
    unlockDate,
    addAuditLog,
    setFocus,
    setMonthYear,
    exportData
  };
}