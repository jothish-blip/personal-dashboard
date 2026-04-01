"use client";

import { useState, useEffect } from 'react';
import { Task, Log, Meta, NexState } from '../types';

const KEY = 'NEXTASK_V12_PRO_FINAL';

export function useNexCore() {
  const [state, setState] = useState<NexState>({
    tasks: [],
    logs: [],
    meta: {
      currentMonth: new Date().toISOString().slice(0, 7),
      isFocus: false,
      theme: 'light',
    },
  });
  const [mounted, setMounted] = useState(false);

  // 1. Load initial data from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      try {
        // Explicitly cast the parsed JSON to NexState to satisfy TypeScript
        const parsed = JSON.parse(saved) as NexState;
        
        if (!parsed.meta) {
          parsed.meta = { currentMonth: new Date().toISOString().slice(0, 7), isFocus: false, theme: 'light' };
        }
        
        // Ensure the theme is strictly 'light' or 'dark'
        if (parsed.meta.theme !== 'dark' && parsed.meta.theme !== 'light') {
          parsed.meta.theme = 'light';
        }
        
        setState(parsed);
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
    setMounted(true);
  }, []);

  // 2. Sync Theme to the HTML Document
  useEffect(() => {
    if (state.meta.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.meta.theme]);

  const saveState = (newState: NexState) => {
    setState(newState);
    localStorage.setItem(KEY, JSON.stringify(newState));
  };

  const logAction = (action: string, name: string, detail: string, currentState: NexState): Log[] => {
    const newLog: Log = { time: new Date().toLocaleString(), action, name, detail };
    const updatedLogs = [newLog, ...currentState.logs];
    return updatedLogs;
  };

  const setMonthYear = (month: string) => {
    const newState: NexState = { ...state, meta: { ...state.meta, currentMonth: month } };
    saveState(newState);
  };

  const setFocus = (isFocus: boolean) => {
    const newState: NexState = { ...state, meta: { ...state.meta, isFocus } };
    saveState(newState);
  };

  const toggleTheme = () => {
    const newTheme = state.meta.theme === 'light' ? 'dark' : 'light';
    const newState: NexState = { ...state, meta: { ...state.meta, theme: newTheme } };
    saveState(newState);
  };

  const addTask = (name: string, group: string) => {
    if (!name.trim()) return;
    const finalGroup = (group.trim() || "GENERAL").toUpperCase();
    const newTask: Task = { id: Date.now(), name: name.trim(), group: finalGroup, history: {} };
    
    const newState: NexState = { ...state, tasks: [...state.tasks, newTask] };
    newState.logs = logAction("CREATE", newTask.name, finalGroup, newState);
    saveState(newState);
  };

  const deleteTask = (id: number) => {
    if (!window.confirm("Confirm deletion of task and all history?")) return;
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;

    const newState: NexState = { ...state, tasks: state.tasks.filter((t) => t.id !== id) };
    newState.logs = logAction("DELETE", task.name, "Removed", newState);
    saveState(newState);
  };

  const toggleTask = (id: number, dateStr: string) => {
    const newState: NexState = { ...state };
    const taskIndex = newState.tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) return;

    const task = newState.tasks[taskIndex];
    const newStatus = !task.history[dateStr];
    
    newState.tasks[taskIndex] = {
      ...task,
      history: { ...task.history, [dateStr]: newStatus }
    };
    
    newState.logs = logAction("TOGGLE", task.name, newStatus ? "COMPLETED" : "REOPENED", newState);
    saveState(newState);
  };

  const clearLogs = () => {
    if (!window.confirm("Purge audit logs?")) return;
    const newState: NexState = { ...state, logs: [] };
    saveState(newState);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          // Explicitly cast to NexState here as well
          const data = JSON.parse(result) as NexState;
          if (data.tasks) {
            if (!data.meta) {
              data.meta = { currentMonth: new Date().toISOString().slice(0, 7), isFocus: false, theme: 'light' };
            }
            if (data.meta.theme !== 'dark' && data.meta.theme !== 'light') {
              data.meta.theme = 'light';
            }
            saveState(data);
          }
        }
      } catch (err) {
        alert("Invalid File Format.");
      }
    };
    reader.readAsText(file);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NexTask_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return {
    state,
    mounted,
    setMonthYear,
    setFocus,
    toggleTheme,
    addTask,
    deleteTask,
    toggleTask,
    clearLogs,
    importData,
    exportData,
  };
}