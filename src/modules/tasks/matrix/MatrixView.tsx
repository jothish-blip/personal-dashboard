"use client";

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { 
  AlertTriangle, Target, Lock, Clock, Search, 
  ChevronLeft, ChevronRight, HelpCircle, Maximize, Minimize, 
  Plus, Check, X 
} from 'lucide-react';
import { Task, Meta } from '../types';

import {
  getLocalDate,
  getISODay,
  parseLocalDate,
} from "./utils";

import Header from "./components/Header/Header";
import Decisions from "./components/Decisions/Decisions";
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
}

type ErrorType = 'lock' | 'future' | 'system' | '';

export default function MatrixView({ 
  tasks, meta, addTask, deleteTask, toggleTask, 
  renameTask = () => console.warn("renameTask missing in parent"), 
  renameGroup = () => console.warn("renameGroup missing in parent"), 
  lockToday, setMonthYear, isLoaded = true 
}: MatrixProps) {
  
  const actualToday = getLocalDate(new Date()); 
  
  const [isMobile, setIsMobile] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);

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
  
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // Safe Delete States
  const [pendingDelete, setPendingDelete] = useState<{id: string, name: string} | null>(null);
  const [confirmText, setConfirmText] = useState("");
  
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

  const showError = useCallback((msg: string, type: ErrorType = 'system') => { 
    const now = Date.now();
    if (now - lastErrorTime.current < 800) return; 
    lastErrorTime.current = now;
    const id = ++errorIdRef.current;
    
    setErrors(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setErrors(prev => prev.filter(e => e.id !== id)), 3000); 
  }, []);

  // Trigger Safe Delete Modal
  const requestDelete = useCallback((id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;
    setPendingDelete({ id, name: taskToDelete.name });
    setConfirmText("");
  }, [tasks]);

  const activeTasks = useMemo(() => tasks, [tasks]);

  const completionMap = useMemo(() => {
    const map: Record<string, number> = {};
    activeTasks.forEach(t => {
      Object.entries(t.history || {}).forEach(([date, done]) => {
        if (done) map[date] = (map[date] || 0) + 1;
      });
    });
    return map;
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

  const groupedTasks = useMemo(() => {
    const map: Record<string, Task[]> = {};
    activeTasks.forEach(t => {
      if (!map[t.group]) map[t.group] = [];
      map[t.group].push(t);
    });
    return map;
  }, [activeTasks]);

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

  const { totalCurrent, totalPrev, consistencyScore, validDays, weekAvg, momentumScore } = useMemo(() => {
    let curr = 0, prev = 0, possible = 0;
    
    const valid = compareCurrentWeek.filter(day => day.date <= actualToday);

    valid.forEach((day, i) => {
      curr += day.count;
      prev += comparePrevWeek[i].count;
      possible += activeTasks.length;
    });

    const score = possible === 0 ? 0 : Math.round((curr / possible) * 100);
    const avg = valid.length ? Math.round((curr / valid.length) * 10) / 10 : 0;
    const last3Days = valid.slice(-3);
    const mom = last3Days.length >= 2 ? last3Days[last3Days.length-1].count - last3Days[0].count : 0;
    
    return { totalCurrent: curr, totalPrev: prev, consistencyScore: score, validDays: valid, weekAvg: avg, momentumScore: mom };
  }, [compareCurrentWeek, comparePrevWeek, actualToday, activeTasks.length]);

  const overallDiff = totalCurrent - totalPrev;
  const chartMaxCount = Math.max(...validDays.map(d => d.count), 1);

  const bestGlobalStreak = useMemo(() => {
    if (isFocusMode || activeTasks.length === 0) return 0;
    let max = 0;
    activeTasks.forEach(t => {
      if (!t.history) return;
      const dates = Object.keys(t.history).sort();
      let currentStreak = 0;
      let lastDate: string | null = null;
      dates.forEach(d => {
        if (t.history![d]) {
          if (!lastDate) currentStreak = 1;
          else {
            const diff = Math.round((parseLocalDate(d).getTime() - parseLocalDate(lastDate).getTime()) / 86400000);
            if (diff === 1) currentStreak++;
            else currentStreak = 1;
          }
          max = Math.max(max, currentStreak);
          lastDate = d;
        }
      });
    });
    return max;
  }, [activeTasks, isFocusMode]);

  const currentStreak = useMemo(() => {
    if (activeTasks.length === 0) return 0;
  
    let streak = 0;
    const d = parseLocalDate(actualToday);
  
    const isDayActive = (dateStr: string) =>
      activeTasks.some(t => t.history?.[dateStr]);
  
    let currentDateStr = actualToday;
  
    // if today inactive → check yesterday
    if (!isDayActive(currentDateStr)) {
      d.setDate(d.getDate() - 1);
      currentDateStr = getLocalDate(d);
  
      if (!isDayActive(currentDateStr)) {
        return 0;
      }
    }
  
    while (isDayActive(currentDateStr)) {
      streak++;
  
      d.setDate(d.getDate() - 1);
      currentDateStr = getLocalDate(d);
    }
  
    return streak;
  }, [activeTasks, actualToday]);

  const globalWeekStats = useMemo(() => {
    if (isFocusMode || activeTasks.length === 0) return { best: null, worst: null };
    const stats = weeksInMonth.map(week => {
      const validD = week.days.filter(Boolean).length;
      const possible = validD * activeTasks.length;
      let done = 0;
      week.days.forEach(d => { if (d) done += completionMap[`${meta.currentMonth}-${d}`] || 0; });
      return { label: week.weekLabel, pct: possible ? (done / possible) * 100 : 0 };
    });
    return { best: stats.reduce((max, w) => w.pct > max.pct ? w : max, stats[0]), worst: stats.reduce((min, w) => w.pct < min.pct ? w : min, stats[0]) };
  }, [weeksInMonth, activeTasks.length, completionMap, meta.currentMonth, isFocusMode]);

  const visibleDays = useMemo(() => weeksInMonth.flatMap(w => w.days), [weeksInMonth]);

  const handleToggleSafe = useCallback((task: Task, dateStr: string) => {
    if (dateStr > actualToday) return showError(`Future dates are view-only`, 'future');
    
    if (dateStr < actualToday && !(meta.rollbackUsedDates || []).includes(dateStr)) {
      return showError(`Past days are locked. Use a rollback token to edit.`, 'lock');
    }
    
    if (meta.lockedDates?.includes(dateStr) && dateStr !== actualToday) {
      return showError(`This date is permanently locked`, 'lock');
    }
    
    toggleTask(task.id, dateStr);
  }, [actualToday, meta.lockedDates, meta.rollbackUsedDates, showError, toggleTask]);

  const executeQuickAdd = () => {
    if (!quickAddName.trim()) return;
    const parts = quickAddName.split('#');
    const name = parts[0].trim();
    const group = parts.length > 1 && parts[1].trim() ? parts[1].trim() : "General";
    if (name) {
      addTask(name, group);
      setQuickAddName("");
      setQuickAddSuccess(true);
      setTimeout(() => setQuickAddSuccess(false), 200);
    }
  };

  const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') executeQuickAdd();
  };

  const scrollToToday = () => todayRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

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

      {/* Safe Delete Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in" onClick={() => { setPendingDelete(null); setConfirmText(""); }}>
          <div className="bg-[var(--surface)] rounded-2xl p-8 max-w-md w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-500 mb-2">
              <div className="p-2 bg-red-500/10 rounded-xl"><AlertTriangle size={24} /></div>
              <h2 className="font-bold text-2xl text-[var(--foreground)]">Delete Task?</h2>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              This action cannot be undone. To confirm deletion, type <strong>{pendingDelete.name}</strong> below:
            </p>
            <input
              autoFocus
              type="text"
              placeholder={`Type "${pendingDelete.name}"`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full pl-4 pr-4 py-3 border border-[var(--border)] bg-[var(--surface-alt)] rounded-xl text-sm outline-none focus:border-red-500 focus:bg-[var(--surface)] text-[var(--foreground)] transition-all duration-200"
            />
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => { setPendingDelete(null); setConfirmText(""); }} 
                className="flex-1 py-3 bg-[var(--surface-alt)] text-[var(--foreground)] rounded-xl font-bold hover:bg-[var(--border)] active:scale-95 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                disabled={confirmText.trim() !== pendingDelete.name}
                onClick={() => {
                  deleteTask(pendingDelete.id);
                  setPendingDelete(null);
                  setConfirmText("");
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
          showError={(msg) => showError(msg, 'system')} lockToday={lockToday} actualToday={actualToday}
        />
      )}

      <div className={`flex-1 flex flex-col xl:flex-row mx-auto w-full gap-6 transition-all duration-500 ${isFocusMode ? 'max-w-[900px] p-2 md:p-4 justify-center' : 'max-w-[1400px] p-4 md:p-8'}`}>
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          
          {!isFocusMode && (
            <Decisions
              tasks={activeTasks}
              currentStreak={currentStreak}
              lockedDates={meta.lockedDates || []}
              isFocusMode={meta.isFocus}
            />
          )}

          {!isLoaded ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 animate-pulse min-h-[400px] shadow-sm hover:border-orange-400/30 transition-all duration-200">
              <div className="flex justify-between items-center mb-6"><div className="h-6 bg-[var(--surface-alt)] rounded w-48"></div><div className="h-8 bg-[var(--surface-alt)] rounded-full w-24"></div></div>
              <div className="space-y-4">{[1, 2, 3, 4].map(i => (<div key={i} className="flex gap-4 items-center"><div className="h-12 bg-[var(--surface-alt)] rounded-xl w-1/4"></div><div className="h-12 bg-[var(--surface-alt)] rounded-xl flex-1"></div></div>))}</div>
            </div>
          ) : activeTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-2xl text-[var(--muted)] min-h-[400px] shadow-sm transition-all duration-200 hover:border-orange-400/30">
              <div className="bg-indigo-500/10 p-4 rounded-full mb-4"><Target size={48} className="text-indigo-400" /></div>
              <p className="font-bold text-xl text-[var(--foreground)] mb-2">Start Tracking Your System</p>
              <p className="text-sm text-[var(--muted)] mb-4 text-center">Add your first performance objective to begin analyzing.</p>
              <div className="flex items-center gap-2 mb-6 text-xs text-[var(--muted)] font-medium">Try adding: <span className="bg-[var(--surface-alt)] text-[var(--foreground)] px-2 py-1 rounded">Workout #Health</span> <span className="bg-[var(--surface-alt)] text-[var(--foreground)] px-2 py-1 rounded">Reading #Mind</span></div>
              <div className="relative mt-4">
                <input type="text" placeholder="Workout #Health (Press Enter)..." value={quickAddName} onChange={e => setQuickAddName(e.target.value)} onKeyDown={handleQuickAdd} autoFocus
                  className={`pl-4 pr-10 py-3 border rounded-xl text-sm outline-none w-72 shadow-sm transition-all duration-200 ${quickAddSuccess ? 'bg-green-500/10 border-green-500 animate-[scaleUp_0.2s_ease]' : 'bg-[var(--surface-alt)] border-[var(--border)] focus:border-indigo-500 focus:bg-[var(--surface)] text-[var(--foreground)]'}`} />
                <button onClick={executeQuickAdd} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--background)] bg-[var(--foreground)] rounded-lg hover:bg-indigo-500 active:scale-95 transition-all duration-200"><Plus size={16}/></button>
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
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-md"><div className="w-2 h-2 bg-green-500 rounded-full"/> Active Tracking</span>
                    )}
                    <span className="hidden sm:inline text-[var(--muted)] font-medium ml-1">Today • {actualToday}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!isFocusMode && (
                    <div className="relative hidden md:block group">
                      <input type="text" placeholder="Workout #Health (Press Enter)..." value={quickAddName} onChange={e => setQuickAddName(e.target.value)} onKeyDown={handleQuickAdd}
                        className={`pl-3 pr-3 py-1.5 border rounded-lg text-xs outline-none transition-all duration-200 w-44 text-[var(--foreground)] ${quickAddSuccess ? 'bg-green-500/10 border-green-500 animate-[scaleUp_0.2s_ease]' : 'bg-[var(--surface-alt)] border-[var(--border)] focus:border-indigo-400 focus:bg-[var(--surface)]'}`} />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg p-1 shadow-sm">
                    <button onClick={() => setWeekOffset(prev => Math.max(prev - 1, -4))} className="p-1 hover:bg-[var(--surface)] text-[var(--muted)] rounded transition-colors active:scale-95"><ChevronLeft size={14}/></button>
                    {!isFocusMode && <button onClick={() => { setWeekOffset(0); scrollToToday(); }} className="px-3 text-[11px] font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors active:scale-95">Week {activeWeekIndex + 1}</button>}
                    <button onClick={() => setWeekOffset(prev => Math.min(prev + 1, 4))} className="p-1 hover:bg-[var(--surface)] text-[var(--muted)] rounded transition-colors active:scale-95"><ChevronRight size={14}/></button>
                  </div>
                  <div className="h-4 w-[1px] bg-[var(--border)]"></div>
                  <button onClick={() => setIsFocusMode(!isFocusMode)} title="Toggle Focus Mode" className={`p-1.5 rounded-lg transition-colors active:scale-95 ${isFocusMode ? 'bg-indigo-500/10 text-indigo-500' : 'hover:bg-[var(--surface-alt)] text-[var(--muted)]'}`}>
                    {isFocusMode ? <Minimize size={16}/> : <Maximize size={16}/>}
                  </button>
                </div>
              </div>

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

            </div>
          )}
        </div>
        {!isFocusMode && (
          <div
            className="
              w-full
              sm:w-full
              xl:w-[320px]
              max-w-full
              shrink-0
              order-2 xl:order-none
              xl:sticky
              xl:top-8
              h-fit
            "
          >
            <Sidebar/>
          </div>
        )}
      </div>

    </div>
  );
}