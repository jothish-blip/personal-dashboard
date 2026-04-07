"use client";

import { useState, useEffect } from 'react';
import { Task, Log, Meta, NexState } from '../types';
import { useNotificationSystem } from '@/notifications/useNotificationSystem'; 
import { handleTaskUpdate, handleGlobalState } from '@/notifications/nexNotificationBrain';

const KEY = 'NEXTASK_V12_PRO_FINAL';

/**
 * Helper: Reliable Local Date String (YYYY-MM-DD)
 */
const getTodayLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

// 🔥 HELPER: Persistent Locks (Prevents Notification Spam)
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

// --- SMART MOMENTUM INTELLIGENCE ---
const checkMomentum = (tasks: Task[], dateStr: string) => {
  const total = tasks.length;
  const done = tasks.filter(t => t.history[dateStr] === true).length;
  const pending = total - done;
  const percentage = total > 0 ? (done / total) * 100 : 0;

  if (percentage === 100 && total > 0) {
    return {
      title: "Perfect Execution 🏆",
      body: "All objectives completed today. Elite performance.",
      priority: 'high'
    };
  }

  if (percentage >= 70 && pending > 0) {
    return {
      title: "Almost There 🚀",
      body: `${pending} tasks left. Finish strong.`,
      priority: 'medium'
    };
  }

  if (total > 5 && percentage < 30) {
    return {
      title: "Momentum Warning ⚠️",
      body: `Only ${done}/${total} done. Regain your velocity.`,
      priority: 'high'
    };
  }

  return null;
};

export function useNexCore() {
  // ✅ Initialize Global Notification System
  const { addNotification } = useNotificationSystem();

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

  // 1. Initial Load, Data Sanitization & Boot Scan
  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    let loadedTasks: Task[] = [];
    let loadedLockedDates: string[] = [];

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as NexState;
        
        parsed.meta = {
          currentMonth: parsed.meta?.currentMonth || getTodayLocal().slice(0, 7),
          isFocus: parsed.meta?.isFocus ?? false,
          theme: parsed.meta?.theme || 'dark',
          lockedDates: parsed.meta?.lockedDates || [],
          rollbackUsedDates: parsed.meta?.rollbackUsedDates || []
        };

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
        loadedTasks = parsed.tasks || [];
        loadedLockedDates = parsed.meta.lockedDates;
      } catch (e) {
        console.error("Storage corruption detected:", e);
      }
    }
    
    setMounted(true);

    // 🔥 Boot-up System Scan happens securely once after data loads
    if (!sessionStorage.getItem("nex_boot_scanned") && loadedTasks.length > 0) {
      sessionStorage.setItem("nex_boot_scanned", "true");
      
      const today = getTodayLocal();
      const isLocked = loadedLockedDates.includes(today);
      
      if (!isLocked) {
        const pendingTasks = loadedTasks.filter(t => !t.history[today]);
        if (pendingTasks.length > 0) {
          const timer = setTimeout(() => {
            addNotification(
              'task', 
              'Unresolved Targets', 
              `You have ${pendingTasks.length} pending objectives for today. Maintain your momentum.`, 
              'high'
            );
          }, 5000);
        }
      }
    }
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. 🔥 CONTINUOUS DAILY REMAINING ENGINE
  useEffect(() => {
    if (!mounted || state.tasks.length === 0) return;

    const interval = setInterval(() => {
      const today = getTodayLocal();
      const pendingTasks = state.tasks.filter(t => !t.history[today]);

      if (pendingTasks.length > 0) {
        const hour = new Date().getHours();
        // Only remind during active execution hours (10 AM to 10 PM)
        if (hour >= 10 && hour <= 22) {
          if (acquireLock('tasks_pending_reminder', 2 * 60 * 60 * 1000)) { 
            addNotification(
              'task',
              'Pending Objectives ⏳',
              `${pendingTasks.length} tasks still pending today. Keep moving forward.`,
              'medium'
            );
          }
        }
      }
    }, 15 * 60 * 1000); // Check conditions every 15 mins

    return () => clearInterval(interval);
  }, [mounted, state.tasks, addNotification]);

  // 3. Functional State Updater 
  const saveState = (updater: (prev: NexState) => NexState) => {
    setState(prev => {
      const newState = updater(prev);
      localStorage.setItem(KEY, JSON.stringify(newState));
      
      // 🔥 Update the last activity timestamp for the Inactivity Engine
      localStorage.setItem("last_activity", Date.now().toString());
      
      return newState;
    });
  };

  const logAction = (action: string, name: string, detail: string, currentState: NexState): Log[] => {
    const newLog: Log = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      time: new Date().toLocaleString(), 
      action, 
      name, 
      detail
    };
    return [newLog, ...currentState.logs].slice(0, 100);
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
      
      addNotification('system', 'System Finalized', `Execution log for ${today} is now locked and read-only.`, 'high');
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
      addNotification('system', 'Rollback Applied', `The lock for ${dateStr} has been lifted. Edit with caution.`, 'medium');
      return updatedState;
    });
  };

  // 🔥 UPGRADED TOGGLE TASK 
  const toggleTask = (id: number, dateStr: string) => {
    saveState(prev => {
      if (prev.meta.lockedDates.includes(dateStr)) {
        addNotification('system', 'Access Denied', 'Cannot modify data in a finalized execution log.', 'high');
        return prev;
      }

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

      // ✅ Task Completed Flow
      if (status) {
        addNotification('task', 'Objective Secured', `"${targetTask.name}" completed.`, 'low');
        handleTaskUpdate(updatedTasks, dateStr);
      } 
      // ❌ Task Unchecked Flow
      else {
        const momentumAlert = checkMomentum(updatedTasks, dateStr);
        if (momentumAlert) {
          setTimeout(() => addNotification('task', momentumAlert.title, momentumAlert.body, momentumAlert.priority as any), 1000);
        }
      }

      handleGlobalState(updatedTasks);
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
      
      // ✅ FIX: Define the new tasks array as a variable so the Brain can read it
      const updatedTasks = [...prev.tasks, newTask];
      const updatedState = { ...prev, tasks: updatedTasks };
      
      updatedState.logs = logAction("CREATE", newTask.name, newTask.group, updatedState);
      
      addNotification('task', 'Objective Initiated', `New task "${newTask.name}" added to ${newTask.group}.`, 'low');
      
      // 🧠 Trigger Global Overload check
      handleGlobalState(updatedTasks);
      
      return updatedState;
    });
  };

  const deleteTask = (id: number) => {
    if (!window.confirm("Delete objective?")) return;
    saveState(prev => {
      const task = prev.tasks.find(t => t.id === id);
      const updatedTasks = prev.tasks.filter(t => t.id !== id);
      const updatedState = { ...prev, tasks: updatedTasks };
      
      if (task) {
        updatedState.logs = logAction("DELETE", task.name, "Removed", updatedState);
        addNotification('task', 'Data Purged', `Objective "${task.name}" has been removed from active memory.`, 'medium');
      }
      
      // 🧠 Trigger Global Overload check
      handleGlobalState(updatedTasks);
      
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
    saveState(prev => {
        if (value) {
            addNotification('system', 'Focus Mode Active', 'External distractions suppressed.', 'medium');
        }
        return {
            ...prev,
            meta: { ...prev.meta, isFocus: value }
        }
    });
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
    
    addNotification('system', 'Backup Successful', 'Your engine data has been exported securely.', 'low');
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
    exportData,
    checkMomentum
  };
}