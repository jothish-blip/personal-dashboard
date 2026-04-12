"use client";

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { 
  AlertTriangle, Target, Lock, Clock, Activity, Search, 
  ChevronLeft, ChevronRight, HelpCircle, Maximize, Minimize, 
  Plus, RotateCcw, Check, X 
} from 'lucide-react';
import { Task, Meta } from '../types';

import { getLocalDate, getISODay, parseLocalDate } from './matrix/utils';
import Header from './matrix/Header';
import Decisions from './matrix/Decisions';
import Grid from './matrix/Grid';
import Sidebar from './matrix/Sidebar';

interface MatrixProps {
  tasks: Task[];
  meta: Meta;
  addTask: (name: string, group: string) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string, date: string) => void;
  lockToday: () => void;
  setMonthYear: (value: string) => void;
  isLoaded?: boolean;
}

type ErrorType = 'lock' | 'future' | 'system' | '';

export default function MatrixView({ 
  tasks, meta, addTask, deleteTask, toggleTask, lockToday, setMonthYear, isLoaded = true 
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
  const [searchQuery, setSearchQuery] = useState("");
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddSuccess, setQuickAddSuccess] = useState(false); 
  
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{id: string, name: string} | null>(null);
  
  const todayRef = useRef<HTMLTableCellElement | null>(null);
  const pendingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => { scrollToToday(); }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => { if (pendingTimeout.current) clearTimeout(pendingTimeout.current); };
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

  const requestDelete = useCallback((id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    if (pendingDelete) deleteTask(pendingDelete.id);
    if (pendingTimeout.current) clearTimeout(pendingTimeout.current);
    
    setPendingDelete({ id, name: taskToDelete.name });
    pendingTimeout.current = setTimeout(() => {
      deleteTask(id);
      setPendingDelete(null);
    }, 5000);
  }, [tasks, pendingDelete, deleteTask]);

  const undoDelete = useCallback(() => {
    if (pendingTimeout.current) clearTimeout(pendingTimeout.current);
    setPendingDelete(null);
  }, []);

  const activeTasks = useMemo(() => tasks.filter(t => t.id !== pendingDelete?.id), [tasks, pendingDelete]);

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

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return activeTasks;
    const lowerQuery = searchQuery.toLowerCase();
    return activeTasks.filter(t => t.name.toLowerCase().includes(lowerQuery) || t.group.toLowerCase().includes(lowerQuery));
  }, [activeTasks, searchQuery]);

  const groupedTasks = useMemo(() => {
    const map: Record<string, Task[]> = {};
    filteredTasks.forEach(t => {
      if (!map[t.group]) map[t.group] = [];
      map[t.group].push(t);
    });
    return map;
  }, [filteredTasks]);

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
    
    // 🟢 FIXED: Using string comparison for bulletproof date logic
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

  const patternInsight = useMemo(() => {
    if (isFocusMode) return "";
    if (activeTasks.length === 0) return "Add objectives to begin pattern analysis.";
    const dayStats = Array.from({length: 7}, () => ({ possible: 0, done: 0 }));
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${meta.currentMonth}-${String(i).padStart(2, '0')}`;
      
      // 🟢 FIXED: Using string comparison
      if (dateStr > actualToday) break; 
      
      const isoDay = getISODay(new Date(year, month - 1, i)) - 1; 
      dayStats[isoDay].possible += activeTasks.length;
      dayStats[isoDay].done += completionMap[dateStr] || 0;
    }
    let worstDay = null, worstPct = 100;
    dayStats.forEach((stat, i) => {
      if (stat.possible > 0) {
        const pct = stat.done / stat.possible;
        if (pct < worstPct) { worstPct = pct; worstDay = i; }
      }
    });
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (worstDay !== null && worstPct < 0.4 && dayStats[worstDay].possible >= activeTasks.length * 3) {
      return `Critical slip pattern on ${dayNames[worstDay]}s. Adjust routine.`;
    }
    return "Momentum is stable across the board. Keep the chain.";
  }, [activeTasks.length, completionMap, daysInMonth, actualToday, meta.currentMonth, year, month, isFocusMode]);

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
    // 🟢 THE BULLETPROOF FIX: Use alphabetical string comparison! 
    // This perfectly evaluates YYYY-MM-DD without any timezone bugs.
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
    <div className={`flex-1 flex flex-col min-h-screen bg-white text-gray-800 pb-24 relative pt-0 overscroll-y-contain transition-colors duration-500`}>
      
      {showHelp && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-[24px] p-8 max-w-md w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-orange-500 mb-2">
              <div className="p-2 bg-orange-50 rounded-xl"><Target size={24} /></div>
              <h2 className="font-bold text-2xl text-gray-900">System Basics</h2>
            </div>
            <ul className="text-sm text-gray-600 space-y-4">
              <li className="flex gap-3"><Check size={18} className="text-green-500 shrink-0"/> <span><strong>Row = Objective:</strong> Track what matters.</span></li>
              <li className="flex gap-3"><Check size={18} className="text-green-500 shrink-0"/> <span><strong>Column = Day:</strong> Click a cell to log completion.</span></li>
              <li className="flex gap-3"><Check size={18} className="text-green-500 shrink-0"/> <span><strong>Flames = Streaks:</strong> Build unbroken chains. Green (4+ days), Orange (7+ days).</span></li>
              <li className="flex gap-3"><Check size={18} className="text-green-500 shrink-0"/> <span><strong>Locks = Accountability:</strong> Past days lock automatically unless you use a rollback token.</span></li>
              <li className="flex gap-3"><Plus size={18} className="text-blue-500 shrink-0"/> <span><strong>Quick Add:</strong> Use `#` to assign a group (e.g. `Read #Learning`).</span></li>
            </ul>
            <button onClick={() => setShowHelp(false)} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-orange-500 transition-colors">
              Got it, let's go
            </button>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl z-[150] text-sm flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <span>Deleted <strong>{pendingDelete.name}</strong></span>
          <button title="Undo delete" onClick={undoDelete} className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-bold bg-gray-800 px-3 py-1.5 rounded-lg transition-colors">
            <RotateCcw size={14}/> Undo
          </button>
        </div>
      )}

      <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 z-[100] pointer-events-none">
        {errors.map((err) => (
          <div key={err.id} className={`bg-white border px-6 py-3 rounded-[20px] shadow-xl text-sm font-bold flex items-center gap-3 transition-all duration-300
            ${err.type === 'lock' ? 'border-amber-200 text-amber-700' : err.type === 'future' ? 'border-blue-200 text-blue-700' : 'border-red-200 text-red-600'}`}
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

      <div className={`flex-1 flex flex-col xl:flex-row mx-auto w-full gap-8 transition-all duration-500 ${isFocusMode ? 'max-w-[1000px] p-2 md:p-4' : 'max-w-[1500px] p-4 md:p-8'}`}>
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          
          {!isFocusMode && (
            <Decisions 
              todayDataLength={todayDataLength} weekAvg={weekAvg} tasksLength={activeTasks.length}
              momentumScore={momentumScore} patternInsight={patternInsight}
            />
          )}

          {!isLoaded ? (
            <div className="bg-white border border-gray-200 rounded-[24px] p-6 animate-pulse min-h-[400px] shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <div className="flex justify-between items-center mb-6"><div className="h-6 bg-gray-200 rounded w-48"></div><div className="h-8 bg-gray-100 rounded-full w-24"></div></div>
              <div className="space-y-4">{[1, 2, 3, 4].map(i => (<div key={i} className="flex gap-4 items-center"><div className="h-12 bg-gray-100 rounded-xl w-1/4"></div><div className="h-12 bg-gray-50 rounded-xl flex-1"></div></div>))}</div>
            </div>
          ) : activeTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white border border-dashed border-gray-200 rounded-[24px] text-gray-400 min-h-[400px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all hover:border-orange-300">
              <div className="bg-orange-50 p-4 rounded-full mb-4"><Target size={48} className="text-orange-400" /></div>
              <p className="font-bold text-xl text-gray-800 mb-2">Start Tracking Your System</p>
              <p className="text-sm text-gray-500 mb-4 text-center">Add your first performance objective to begin analyzing.</p>
              <div className="flex items-center gap-2 mb-6 text-xs text-gray-400 font-medium">Try adding: <span className="bg-gray-100 px-2 py-1 rounded">Workout #Health</span> <span className="bg-gray-100 px-2 py-1 rounded">Reading #Mind</span></div>
              <div className="relative mt-4">
                <input type="text" placeholder="Workout #Health (Press Enter)..." value={quickAddName} onChange={e => setQuickAddName(e.target.value)} onKeyDown={handleQuickAdd} autoFocus
                  className={`pl-4 pr-10 py-3 border rounded-xl text-sm outline-none w-72 shadow-sm transition-all ${quickAddSuccess ? 'bg-green-50 border-green-400 animate-[scaleUp_0.2s_ease]' : 'bg-gray-50 border-gray-200 focus:border-orange-500 focus:bg-white'}`} />
                <button onClick={executeQuickAdd} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white bg-gray-900 rounded-lg hover:bg-orange-500 transition-colors"><Plus size={16}/></button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className={`flex flex-wrap items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.05)] gap-4 ${isFocusMode ? 'sticky top-2 z-50 shadow-md' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {meta.lockedDates?.includes(actualToday) ? (
                      <span className="text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md"><Lock size={12}/> Locked Mode</span>
                    ) : (
                      <span className="text-green-600 flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-md"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Active Tracking</span>
                    )}
                    <span className="hidden sm:inline text-gray-400 font-medium ml-1">Today • {actualToday}</span>
                  </div>
                  {!isFocusMode && <div className="h-4 w-[1px] bg-gray-200 hidden md:block"></div>}
                  {!isFocusMode && (
                    <div className="hidden lg:flex items-center">
                      {todayDataLength > yesterdayDataLength ? <span className="bg-green-50 text-green-600 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 drop-shadow-sm">🔥 Improved from yesterday</span> : 
                        todayDataLength < yesterdayDataLength ? <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">⚠️ Drop from yesterday</span> : 
                        <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded text-[10px] font-bold">➡️ Consistent volume</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {!isFocusMode && (
                    <>
                      <div className="relative hidden md:block group">
                        <input type="text" placeholder="Workout #Health (Press Enter)..." value={quickAddName} onChange={e => setQuickAddName(e.target.value)} onKeyDown={handleQuickAdd}
                          className={`pl-3 pr-3 py-1.5 border rounded-lg text-xs outline-none transition-all w-36 focus:w-56 ${quickAddSuccess ? 'bg-green-50 border-green-400 animate-[scaleUp_0.2s_ease]' : 'bg-gray-50 border-gray-200 focus:border-orange-400 focus:bg-white'}`} />
                      </div>
                      <div className="relative hidden lg:block">
                          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="text" placeholder="Filter..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-orange-400 focus:bg-white transition-all w-24 focus:w-32" />
                          {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={12}/></button>}
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button onClick={() => setWeekOffset(prev => Math.max(prev - 1, -4))} className="p-1 hover:bg-white text-gray-600 rounded transition-colors shadow-sm"><ChevronLeft size={14}/></button>
                    {!isFocusMode && <button onClick={() => { setWeekOffset(0); scrollToToday(); }} className="px-3 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors">Week {activeWeekIndex + 1}</button>}
                    <button onClick={() => setWeekOffset(prev => Math.min(prev + 1, 4))} className="p-1 hover:bg-white text-gray-600 rounded transition-colors shadow-sm"><ChevronRight size={14}/></button>
                  </div>
                  <div className="h-4 w-[1px] bg-gray-200"></div>
                  <button onClick={() => setIsFocusMode(!isFocusMode)} title="Toggle Focus Mode" className={`p-1.5 rounded-lg transition-colors ${isFocusMode ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100 text-gray-500'}`}>
                    {isFocusMode ? <Minimize size={16}/> : <Maximize size={16}/>}
                  </button>
                  <button onClick={() => setShowHelp(true)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><HelpCircle size={16}/></button>
                </div>
              </div>

              <Grid 
                tasks={filteredTasks}
                meta={meta}
                groupedTasks={groupedTasks}
                groups={groups}
                weeksInMonth={weeksInMonth}
                visibleDays={visibleDays}
                actualToday={actualToday}
                todayRef={todayRef}
                handleToggleSafe={handleToggleSafe}
                deleteTask={requestDelete} 
                activeWeekIndex={activeWeekIndex}
                showScrollHint={showScrollHint}
                dismissScrollHint={dismissScrollHint}
              />

            </div>
          )}
        </div>

        {(!isFocusMode || (!isMobile && isFocusMode)) && !isFocusMode && (
          <div className="w-full xl:w-[320px] shrink-0 sticky top-8 h-fit">
            <Sidebar 
              overallDiff={overallDiff} consistencyScore={consistencyScore} validDays={validDays} chartMaxCount={chartMaxCount}
              bestGlobalStreak={bestGlobalStreak} globalWeekStats={globalWeekStats} compareCurrentWeek={compareCurrentWeek}
              comparePrevWeek={comparePrevWeek} weekOffset={weekOffset} setWeekOffset={setWeekOffset}
              totalCurrent={totalCurrent} actualToday={actualToday}
            />
          </div>
        )}
      </div>
    </div>
  );
}