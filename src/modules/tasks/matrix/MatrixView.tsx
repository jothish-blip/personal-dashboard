"use client";

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { 
  AlertTriangle, Target, Lock, Clock, Search, 
  ChevronLeft, ChevronRight, Maximize, Minimize, 
  Plus, Check
} from 'lucide-react';
import { Task, Meta } from '../types';

import {
  getLocalDate,
  getISODay,
  parseLocalDate,
} from "./utils";

import Header from "./components/Header/Header";
import Grid from "./components/Grid/Grid";
import Sidebar from "./components/Sidebar/Sidebar";

interface MatrixProps {
  tasks: Task[];
  meta: Meta;
  addTask: (name: string, group: string) => void | Promise<void>;
  deleteTask: (id: string) => void | Promise<void>;
  toggleTask: (id: string, date: string) => void | Promise<void>;
  renameTask?: (id: string, newName: string) => void | Promise<void>; 
  renameGroup?: (oldGroup: string, newGroup: string) => void | Promise<void>; 
  lockToday: () => void | Promise<void>;
  setMonthYear: (value: string) => void | Promise<void>;
  isLoaded?: boolean;
  userName?: string | null;
}

type ErrorType = 'lock' | 'future' | 'system' | '';

export default function MatrixView({ 
  tasks, meta, addTask, deleteTask, toggleTask, 
  renameTask = () => console.warn("renameTask missing in parent"), 
  renameGroup = () => console.warn("renameGroup missing in parent"), 
  lockToday, setMonthYear, isLoaded = true,
  userName = null 
}: MatrixProps) {
  
  const actualToday = getLocalDate(new Date()); 
  
  const [isMobile, setIsMobile] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);

  // --- Point 4: Async Safety ---
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && !localStorage.getItem('matrix_swipe_hint_seen')) {
        setShowScrollHint(true);
      }
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const dismissScrollHint = () => {
    if (showScrollHint) {
      setShowScrollHint(false);
      localStorage.setItem('matrix_swipe_hint_seen', 'true');
    }
  };

  const [errors, setErrors] = useState<{id: number, msg: string, type: ErrorType}[]>([]);
  const errorIdRef = useRef(0);
  const lastErrorTime = useRef(0);

  const [weekOffset, setWeekOffset] = useState(0); 
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddSuccess, setQuickAddSuccess] = useState(false); 
  
  // --- Point 9: Add Search ---
  const [searchQuery, setSearchQuery] = useState("");

  // --- Point 8: Focus Mode Persistence ---
  const [isFocusMode, setIsFocusMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('matrix_focus_mode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('matrix_focus_mode', String(isFocusMode));
  }, [isFocusMode]);

  const [showHelp, setShowHelp] = useState(false);
  
  // --- Point 13 & 5: Modern Undo Delete System w/ Stats ---
  const [hiddenTasks, setHiddenTasks] = useState<Set<string>>(new Set());
  const [undoToasts, setUndoToasts] = useState<{id: string, name: string, completions: number, timerId: NodeJS.Timeout}[]>([]);
  
  const todayRef = useRef<HTMLTableCellElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => { scrollToToday(); }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('matrix_help_seen_v2')) {
      setShowHelp(true);
      localStorage.setItem('matrix_help_seen_v2', 'true');
    }
  }, []);

  // --- Point 6: Error Toast Upgrade ---
  const showError = useCallback((msg: string, type: ErrorType = 'system') => { 
    const now = Date.now();
    if (now - lastErrorTime.current < 800) return; 
    lastErrorTime.current = now;
    const id = ++errorIdRef.current;
    
    const duration = type === 'future' ? 2500 : type === 'lock' ? 4000 : 5000;
    
    setErrors(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setErrors(prev => prev.filter(e => e.id !== id)), duration); 
  }, []);

  // Soft Delete Request
  const requestDelete = useCallback((id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    const completions = Object.values(taskToDelete.history || {}).filter(Boolean).length;
    
    // Hide instantly from UI
    setHiddenTasks(prev => new Set(prev).add(id));

    // Set 5-second timer for permanent destruction
    const timerId = setTimeout(() => {
      deleteTask(id);
      setUndoToasts(prev => prev.filter(t => t.id !== id));
      setHiddenTasks(prev => { 
        const n = new Set(prev); 
        n.delete(id); 
        return n; 
      });
    }, 5000);

    setUndoToasts(prev => [...prev, { id, name: taskToDelete.name, completions, timerId }]);
  }, [tasks, deleteTask]);

  const undoDelete = useCallback((id: string) => {
    setUndoToasts(prev => {
      const toast = prev.find(t => t.id === id);
      if (toast) clearTimeout(toast.timerId);
      return prev.filter(t => t.id !== id);
    });
    setHiddenTasks(prev => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  }, []);

  // Filter out softly deleted and searched tasks
  const activeTasks = useMemo(() => {
    let filtered = tasks.filter(t => !hiddenTasks.has(t.id));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.name.toLowerCase().includes(q) || t.group.toLowerCase().includes(q));
    }
    return filtered;
  }, [tasks, hiddenTasks, searchQuery]);

  // --- Point 14: Performance Improvement (Combined Loop) ---
  const { completionMap, groupedTasks } = useMemo(() => {
    const cMap: Record<string, number> = {};
    const gMap: Record<string, Task[]> = {};
    
    activeTasks.forEach(t => {
      if (!gMap[t.group]) gMap[t.group] = [];
      gMap[t.group].push(t);
      
      Object.entries(t.history || {}).forEach(([date, done]) => {
        if (done) cMap[date] = (cMap[date] || 0) + 1;
      });
    });
    
    return { completionMap: cMap, groupedTasks: gMap };
  }, [activeTasks]);

  const { todayDataLength, yesterdayDataLength } = useMemo(() => {
    const d = parseLocalDate(actualToday);
    d.setDate(d.getDate() - 1);
    const yesterday = getLocalDate(d);
    return {
      todayDataLength: completionMap[actualToday] || 0,
      yesterdayDataLength: completionMap[yesterday] || 0,
    };
  }, [completionMap, actualToday]);

  const [year, month] = meta.currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const groups = Object.keys(groupedTasks).sort();

  const weeksInMonth = useMemo(() => {
    const weeks: { weekLabel: string; days: (string | null)[] }[] = [];
    let currentWeek: (string | null)[] = [];
    let weekCount = 1;
    const firstDate = new Date(year, month - 1, 1);
    const firstISODay = getISODay(firstDate);

    for (let i = 1; i < firstISODay; i++) currentWeek.push(null);

    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = String(i).padStart(2, '0');
      const date = new Date(year, month - 1, i);
      const isoDay = getISODay(date);

      currentWeek.push(dayStr);

      if (isoDay === 7 || i === daysInMonth) {
        while (currentWeek.length < 7) currentWeek.push(null);
        weeks.push({ weekLabel: `W${weekCount}`, days: currentWeek });
        currentWeek = [];
        weekCount++;
      }
    }
    return weeks;
  }, [daysInMonth, year, month]);

  const activeWeekIndex = useMemo(() => {
    return weeksInMonth.findIndex(week =>
      week.days.some(d => d && `${meta.currentMonth}-${d}` === actualToday)
    );
  }, [weeksInMonth, actualToday, meta.currentMonth]);

  const { compareCurrentWeek, comparePrevWeek } = useMemo(() => {
    const baseDate = parseLocalDate(actualToday);
    const dayOfWeek = baseDate.getDay() || 7;
    baseDate.setDate(baseDate.getDate() - dayOfWeek + 1 + (weekOffset * 7));

    const currentWk = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = getLocalDate(d);
      return { date: dateStr, label: d.toLocaleDateString('en-US', { weekday: 'short' }), dayNum: dateStr.slice(8), count: completionMap[dateStr] || 0 };
    });

    const prevWk = currentWk.map(day => {
      const d = parseLocalDate(day.date);
      d.setDate(d.getDate() - 7);
      const prevDateStr = getLocalDate(d);
      return { date: prevDateStr, count: completionMap[prevDateStr] || 0 };
    });
    return { compareCurrentWeek: currentWk, comparePrevWeek: prevWk };
  }, [completionMap, weekOffset, actualToday]);

  const { consistencyScore } = useMemo(() => {
    let curr = 0, possible = 0;
    const valid = compareCurrentWeek.filter(day => day.date <= actualToday);
    valid.forEach((day) => {
      curr += day.count;
      possible += activeTasks.length;
    });
    const score = possible === 0 ? 0 : Math.round((curr / possible) * 100);
    return { consistencyScore: score };
  }, [compareCurrentWeek, actualToday, activeTasks.length]);

  const currentStreak = useMemo(() => {
    if (activeTasks.length === 0) return 0;
    let streak = 0;
    const d = parseLocalDate(actualToday);
    const isDayActive = (dateStr: string) => activeTasks.some(t => t.history?.[dateStr]);
    let currentDateStr = actualToday;

    if (!isDayActive(currentDateStr)) {
      d.setDate(d.getDate() - 1);
      currentDateStr = getLocalDate(d);
      if (!isDayActive(currentDateStr)) return 0;
    }

    while (isDayActive(currentDateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
      currentDateStr = getLocalDate(d);
    }
    return streak;
  }, [activeTasks, actualToday]);

  // TypeScript Fix Option 2
  const globalWeekStats = useMemo(() => {
    if (isFocusMode || activeTasks.length === 0) return {};
    const stats = weeksInMonth.map(week => {
      const validD = week.days.filter(Boolean).length;
      const possible = validD * activeTasks.length;
      let done = 0;
      week.days.forEach(d => { if (d) done += completionMap[`${meta.currentMonth}-${d}`] || 0; });
      return { label: week.weekLabel, pct: possible ? (done / possible) * 100 : 0 };
    });
    
    const bestW = stats.reduce((max, w) => w.pct > max.pct ? w : max, stats[0]);
    const worstW = stats.reduce((min, w) => w.pct < min.pct ? w : min, stats[0]);
    
    return { 
      best: { label: bestW.label, value: bestW.pct }, 
      worst: { label: worstW.label, value: worstW.pct } 
    };
  }, [weeksInMonth, activeTasks.length, completionMap, meta.currentMonth, isFocusMode]);

  const visibleDays = useMemo(() => weeksInMonth.flatMap(w => w.days), [weeksInMonth]);

  const handleToggleSafe = useCallback(async (task: Task, dateStr: string) => {
    if (dateStr > actualToday) return showError(`Future dates are view-only`, 'future');
    
    if (dateStr < actualToday && !(meta.rollbackUsedDates || []).includes(dateStr)) {
      return showError(`Past days are locked. Use a rollback token to edit.`, 'lock');
    }
    
    if (meta.lockedDates?.includes(dateStr) && dateStr !== actualToday) {
      return showError(`This date is permanently locked`, 'lock');
    }
    
    try {
      await toggleTask(task.id, dateStr);
    } catch (err) {
      showError("Failed to update task", "system");
    }
  }, [actualToday, meta.lockedDates, meta.rollbackUsedDates, showError, toggleTask]);

  // --- Point 2 & Point 3: Character Limits & Dupe Protect ---
  const executeQuickAdd = async (presetName?: string) => {
    const val = presetName || quickAddName;
    if (!val.trim()) return;
    
    const parts = val.split('#');
    const name = parts[0].trim().substring(0, 60); // 60 char limit
    const group = parts.length > 1 && parts[1].trim() ? parts[1].trim().substring(0, 20) : "General"; // 20 char limit
    
    if (!name) return;

    if (tasks.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      return showError("Task already exists", "system");
    }

    try {
      setIsSaving(true);
      await addTask(name, group);
      if (!presetName) setQuickAddName("");
      setQuickAddSuccess(true);
      setTimeout(() => setQuickAddSuccess(false), 200);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') executeQuickAdd();
  };

  const scrollToToday = () => todayRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

  // --- Point 12: Memoize Sidebar ---
  const memoizedSidebar = useMemo(() => (
    <Sidebar tasks={activeTasks} userName={userName} />
  ), [activeTasks, userName]);

  return (
    <div className={`flex-1 flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 relative pt-0 overscroll-y-contain transition-colors duration-500`}>
      
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in" onClick={() => setShowHelp(false)}>
          <div className="bg-[var(--surface)] rounded-2xl p-8 max-w-md w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-indigo-500 mb-2">
              <div className="p-2 bg-indigo-500/10 rounded-xl"><Target size={24} /></div>
              <h2 className="font-bold text-2xl text-[var(--foreground)]">System Basics</h2>
            </div>
            <ul className="text-sm text-[var(--muted)] space-y-4">
              <li className="flex gap-3"><Check size={18} className="text-green-500 shrink-0"/> <span><strong>Row = Objective:</strong> Track what matters.</span></li>
              <li className="flex gap-3"><Check size={18} className="text-green-500 shrink-0"/> <span><strong>Column = Day:</strong> Click a cell to log completion.</span></li>
              <li className="flex gap-3"><Check size={18} className="text-green-500 shrink-0"/> <span><strong>Flames = Streaks:</strong> Build unbroken chains. Green (4+ days), Orange (7+ days).</span></li>
              <li className="flex gap-3"><Check size={18} className="text-green-500 shrink-0"/> <span><strong>Locks = Accountability:</strong> Past days lock automatically unless you use a rollback token.</span></li>
              <li className="flex gap-3"><Plus size={18} className="text-indigo-500 shrink-0"/> <span><strong>Quick Add:</strong> Use `#` to assign a group (e.g. `Read #Learning`).</span></li>
            </ul>
            <button onClick={() => setShowHelp(false)} className="w-full py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-bold hover:bg-indigo-500 active:scale-95 transition-all duration-200">
              Got it, let's go
            </button>
          </div>
        </div>
      )}

      {/* Undo Delete Toasts */}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 z-[100] pointer-events-auto">
        {undoToasts.map((toast) => (
          <div key={toast.id} className="bg-[var(--surface)] border border-[var(--border)] px-6 py-3 rounded-[20px] shadow-xl text-sm font-bold flex items-center gap-3 transition-all duration-300 border-indigo-500/30 text-[var(--foreground)] animate-in slide-in-from-bottom-5">
            <span className="font-normal text-[var(--muted)]">
              Deleted <strong className="text-[var(--foreground)]">{toast.name}</strong> 
              {toast.completions > 0 && ` (${toast.completions} past completions)`}
            </span>
            <button 
              onClick={() => undoDelete(toast.id)} 
              className="ml-2 text-indigo-500 hover:text-indigo-400 font-bold uppercase tracking-wider text-xs bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
            >
              Undo
            </button>
          </div>
        ))}
      </div>

      {/* Errors */}
      <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 z-[100] pointer-events-none">
        {errors.map((err) => (
          <div key={err.id} className={`bg-[var(--surface)] border border-[var(--border)] px-6 py-3 rounded-[20px] shadow-xl text-sm font-bold flex items-center gap-3 transition-all duration-300
            ${err.type === 'lock' ? 'border-amber-500/30 text-amber-500' : err.type === 'future' ? 'border-blue-500/30 text-blue-500' : 'border-red-500/30 text-red-500'}`}
            style={{ animation: 'shake 0.4s ease-in-out' }}
          >
            {err.type === 'lock' && <Lock size={18} className="text-amber-500" />}
            {err.type === 'future' && <Clock size={18} className="text-blue-500" />}
            {err.type === 'system' && <AlertTriangle size={18} className="text-red-500" />}
            {err.msg}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(-50%); } 25% { transform: translateX(calc(-50% - 5px)); } 75% { transform: translateX(calc(-50% + 5px)); } }
        @keyframes scaleUp { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
      `}</style>

      {!isFocusMode && (
        <Header 
          todayDataLength={todayDataLength} yesterdayDataLength={yesterdayDataLength}
          tasksLength={activeTasks.length} globalWeekStats={globalWeekStats}
          meta={meta} setMonthYear={setMonthYear} addTask={addTask}
          showError={(msg) => showError(msg, 'system')} lockToday={lockToday} actualToday={actualToday} existingTaskNames={[]}        />
      )}

      <div className={`flex-1 flex flex-col xl:flex-row mx-auto w-full gap-6 transition-all duration-500 ${isFocusMode ? 'max-w-[900px] p-2 md:p-4 justify-center' : 'max-w-[1700px] p-4 md:p-8'}`}>
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">

          {!isLoaded ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 animate-pulse min-h-[400px] shadow-sm hover:border-orange-400/30 transition-all duration-200">
              <div className="flex justify-between items-center mb-6"><div className="h-6 bg-[var(--surface-alt)] rounded w-48"></div><div className="h-8 bg-[var(--surface-alt)] rounded-full w-24"></div></div>
              <div className="space-y-4">{[1, 2, 3, 4].map(i => (<div key={i} className="flex gap-4 items-center"><div className="h-12 bg-[var(--surface-alt)] rounded-xl w-1/4"></div><div className="h-12 bg-[var(--surface-alt)] rounded-xl flex-1"></div></div>))}</div>
            </div>
          ) : activeTasks.length === 0 && !searchQuery ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-2xl text-[var(--muted)] min-h-[400px] shadow-sm transition-all duration-200 hover:border-orange-400/30">
              <div className="bg-indigo-500/10 p-4 rounded-full mb-4"><Target size={48} className="text-indigo-400" /></div>
              <p className="font-bold text-xl text-[var(--foreground)] mb-2">Start Tracking Your System</p>
              <p className="text-sm text-[var(--muted)] mb-4 text-center">Add your first performance objective to begin analyzing.</p>
              
              {/* --- Point 7: Empty State Chips --- */}
              <div className="flex items-center gap-2 mb-6 text-xs text-[var(--muted)] font-medium">
                Try adding: 
                <button disabled={isSaving} onClick={() => executeQuickAdd("Workout #Health")} className="bg-[var(--surface-alt)] hover:bg-[var(--border)] text-[var(--foreground)] px-3 py-1.5 rounded-full transition-colors active:scale-95 disabled:opacity-50">Workout #Health</button> 
                <button disabled={isSaving} onClick={() => executeQuickAdd("Reading #Mind")} className="bg-[var(--surface-alt)] hover:bg-[var(--border)] text-[var(--foreground)] px-3 py-1.5 rounded-full transition-colors active:scale-95 disabled:opacity-50">Reading #Mind</button>
              </div>
              
              <div className="relative mt-4">
                <input type="text" placeholder="Workout #Health (Press Enter)..." value={quickAddName} onChange={e => setQuickAddName(e.target.value)} onKeyDown={handleQuickAdd} autoFocus disabled={isSaving} maxLength={80}
                  className={`pl-4 pr-10 py-3 border rounded-xl text-sm outline-none w-72 shadow-sm transition-all duration-200 disabled:opacity-50 ${quickAddSuccess ? 'bg-green-500/10 border-green-500 animate-[scaleUp_0.2s_ease]' : 'bg-[var(--surface-alt)] border-[var(--border)] focus:border-indigo-500 focus:bg-[var(--surface)] text-[var(--foreground)]'}`} />
                <button disabled={isSaving || !quickAddName.trim()} onClick={() => executeQuickAdd()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--background)] bg-[var(--foreground)] rounded-lg hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition-all duration-200"><Plus size={16}/></button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between bg-[var(--surface)]/90 backdrop-blur-xl border border-[var(--border)] rounded-2xl px-5 py-3 shadow-sm hover:border-orange-400/30 transition-all duration-200 gap-4 sticky top-2 z-30">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[11px] font-semibold">
                    {meta.lockedDates?.includes(actualToday) ? (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-md"><Lock size={12}/> Locked Mode</span>
                    ) : (
                      // --- Point 10: Better Stats Header ---
                      <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 bg-indigo-500/10 px-2 py-1 rounded-md">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"/> Consistency: {consistencyScore}%
                      </span>
                    )}
                    <span className="hidden sm:inline text-[var(--muted)] font-medium ml-1">Today • {actualToday} • Streak: {currentStreak}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!isFocusMode && (
                    <>
                      {/* --- Point 9: Search Field --- */}
                      <div className="relative hidden lg:flex items-center group">
                        <Search size={14} className="absolute left-3 text-[var(--muted)] group-focus-within:text-indigo-500 transition-colors" />
                        <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 border rounded-lg text-xs outline-none transition-all duration-200 w-32 focus:w-48 text-[var(--foreground)] bg-[var(--surface-alt)] border-[var(--border)] focus:border-indigo-400 focus:bg-[var(--surface)]" />
                      </div>

                      <div className="relative hidden md:block group">
                        <input type="text" placeholder="Quick Add (e.g. Read #Mind)..." value={quickAddName} onChange={e => setQuickAddName(e.target.value)} onKeyDown={handleQuickAdd} disabled={isSaving} maxLength={80}
                          className={`pl-3 pr-3 py-1.5 border rounded-lg text-xs outline-none transition-all duration-200 w-44 lg:w-56 text-[var(--foreground)] disabled:opacity-50 ${quickAddSuccess ? 'bg-green-500/10 border-green-500 animate-[scaleUp_0.2s_ease]' : 'bg-[var(--surface-alt)] border-[var(--border)] focus:border-indigo-400 focus:bg-[var(--surface)]'}`} />
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-center gap-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg p-1 shadow-sm">
                    {/* --- Point 1: Unlocked Week Offset Navigation --- */}
                    <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-1 hover:bg-[var(--surface)] text-[var(--muted)] rounded transition-colors active:scale-95"><ChevronLeft size={14}/></button>
                    {!isFocusMode && <button onClick={() => { setWeekOffset(0); scrollToToday(); }} className="px-3 text-[11px] font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors active:scale-95">Week {activeWeekIndex + 1}</button>}
                    <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-1 hover:bg-[var(--surface)] text-[var(--muted)] rounded transition-colors active:scale-95"><ChevronRight size={14}/></button>
                  </div>
                  <div className="h-4 w-[1px] bg-[var(--border)]"></div>
                  <button onClick={() => setIsFocusMode(!isFocusMode)} title="Toggle Focus Mode" className={`p-1.5 rounded-lg transition-colors active:scale-95 ${isFocusMode ? 'bg-indigo-500/10 text-indigo-500' : 'hover:bg-[var(--surface-alt)] text-[var(--muted)]'}`}>
                    {isFocusMode ? <Minimize size={16}/> : <Maximize size={16}/>}
                  </button>
                </div>
              </div>

              {activeTasks.length === 0 && searchQuery ? (
                <div className="py-20 text-center text-[var(--muted)] text-sm">No tasks match "{searchQuery}"</div>
              ) : (
                <div className="overflow-x-auto bg-[var(--background)]">
                  <Grid 
                    tasks={activeTasks}
                    meta={meta}
                    groupedTasks={groupedTasks}
                    groups={groups}
                    weeksInMonth={weeksInMonth}
                    visibleDays={visibleDays}
                    actualToday={actualToday}
                    todayRef={todayRef}
                    handleToggleSafe={handleToggleSafe}
                    deleteTask={requestDelete} 
                    renameTask={renameTask}
                    renameGroup={renameGroup}
                    activeWeekIndex={activeWeekIndex}
                    showScrollHint={showScrollHint}
                    dismissScrollHint={dismissScrollHint}
                  />
                </div>
              )}

            </div>
          )}
        </div>
        {!isFocusMode && (
          <div
            className="
              flex
              w-full
              xl:w-[320px]
              shrink-0
              order-2 xl:order-none
              xl:sticky
              xl:top-3
              xl:self-start
              xl:h-[calc(100vh-90px)]
              xl:overflow-hidden
            "
          >
            {memoizedSidebar}
          </div>
        )}
      </div>

    </div>
  );
}