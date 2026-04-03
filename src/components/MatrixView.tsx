"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Save, Plus, X, Lock, ChevronLeft, ChevronRight, BarChart2, 
  CalendarDays, ArrowUpRight, ArrowDownRight, Minus, Activity,
  Target, AlertTriangle, Flame, Zap, Star
} from 'lucide-react';
import { Task, Meta } from '../types';

interface MatrixProps {
  tasks: Task[];
  meta: Meta;
  addTask: (name: string, group: string) => void;
  deleteTask: (id: number) => void;
  toggleTask: (id: number, date: string) => void;
  lockToday: () => void;
  setMonthYear: (value: string) => void;
  addAuditLog: (detail: string) => void;
}

// --- SECURE TIMEZONE ENGINE ---
const getLocalDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const getISODay = (date: Date) => {
  const day = date.getDay();
  return day === 0 ? 7 : day; 
};

// Safe local parser to prevent UTC midnight jumps
const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// --- STREAK ENGINE ---
const calculateCurrentStreak = (history: Record<string, boolean> | undefined, todayStr: string) => {
  if (!history) return 0;
  let streak = 0;
  
  const [y, m, d] = todayStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  
  if (history[todayStr]) streak++;
  
  dateObj.setDate(dateObj.getDate() - 1);
  let prevDateStr = getLocalDate(dateObj);
  
  if (!history[todayStr] && !history[prevDateStr]) return 0;
  
  while (history[prevDateStr]) {
    streak++;
    dateObj.setDate(dateObj.getDate() - 1);
    prevDateStr = getLocalDate(dateObj);
  }
  return streak;
};

export default function MatrixView({ 
  tasks, meta, addTask, deleteTask, toggleTask, lockToday, setMonthYear 
}: MatrixProps) {
  const actualToday = getLocalDate(new Date()); 

  const [taskName, setTaskName] = useState('');
  const [taskGroup, setTaskGroup] = useState('');
  const [error, setError] = useState('');
  const today = actualToday; 
  const [weekOffset, setWeekOffset] = useState(0); 
  const todayRef = useRef<HTMLTableCellElement | null>(null);

  // Swipe & Drag States
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<boolean | null>(null);

  const showError = useCallback((msg: string) => { 
    setError(msg); 
    setTimeout(() => setError(''), 3000); 
  }, []);

  // --- 1. DATA ENGINE ---
  const { todayData, yesterdayData } = useMemo(() => {
    const d = parseLocalDate(today);
    d.setDate(d.getDate() - 1);
    const yesterday = getLocalDate(d);

    return {
      todayData: tasks.filter(t => t.history?.[today]),
      yesterdayData: tasks.filter(t => t.history?.[yesterday]),
    };
  }, [tasks, today]);

  const [year, month] = meta.currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Performance: Memoized Group Mapping
  const groupedTasks = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(t => {
      if (!map[t.group]) map[t.group] = [];
      map[t.group].push(t);
    });
    return map;
  }, [tasks]);

  const groups = Object.keys(groupedTasks).sort();

  // --- 2. SMART WEEK ALIGNMENT ---
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

  // INITIALIZE ACTIVE WEEK SMARTLY
  const activeWeekIndex = useMemo(() => {
    return weeksInMonth.findIndex(week =>
      week.days.some(d => d && `${meta.currentMonth}-${d}` === actualToday)
    );
  }, [weeksInMonth, actualToday, meta.currentMonth]);

  const [selectedWeek, setSelectedWeek] = useState<number>(0);

  // FIX 1: Initial Week Bug - Set week safely after initial render
  useEffect(() => {
    if (activeWeekIndex !== -1) {
      setSelectedWeek(activeWeekIndex);
    }
  }, [activeWeekIndex]);

  // Global Mouse Up for drag-to-check
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setIsDragging(false);
      setDragAction(null);
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, []);

  // --- 3. WEEKLY COMPARISON ENGINE ---
  const { compareCurrentWeek, comparePrevWeek } = useMemo(() => {
    const baseDate = parseLocalDate(actualToday);
    const dayOfWeek = baseDate.getDay() || 7;
    baseDate.setDate(baseDate.getDate() - dayOfWeek + 1 + (weekOffset * 7));

    const currentWk = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = getLocalDate(d);
      return {
        date: dateStr,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: dateStr.slice(8),
        count: tasks.filter(t => t.history?.[dateStr]).length
      };
    });

    const prevWk = currentWk.map(day => {
      const d = parseLocalDate(day.date);
      d.setDate(d.getDate() - 7);
      const prevDateStr = getLocalDate(d);
      return {
        date: prevDateStr,
        count: tasks.filter(t => t.history?.[prevDateStr]).length
      };
    });

    return { compareCurrentWeek: currentWk, comparePrevWeek: prevWk };
  }, [tasks, weekOffset, actualToday]);

  // --- 4. ADVANCED ANALYTICS ---
  const { totalCurrent, totalPrev, consistencyScore, validDays, weekAvg, momentumScore } = useMemo(() => {
    let curr = 0;
    let prev = 0;
    let possible = 0;
    
    const valid = compareCurrentWeek.filter(day => parseLocalDate(day.date) <= parseLocalDate(actualToday));

    valid.forEach((day, i) => {
      curr += day.count;
      prev += comparePrevWeek[i].count;
      possible += tasks.length;
    });

    const score = possible === 0 ? 0 : Math.round((curr / possible) * 100);
    const avg = valid.length ? Math.round((curr / valid.length) * 10) / 10 : 0;
    
    const last3Days = valid.slice(-3);
    const mom = last3Days.length >= 2 
      ? last3Days[last3Days.length-1].count - last3Days[0].count 
      : 0;
    
    return { 
      totalCurrent: curr, 
      totalPrev: prev, 
      consistencyScore: score, 
      validDays: valid, 
      weekAvg: avg,
      momentumScore: mom
    };
  }, [compareCurrentWeek, comparePrevWeek, actualToday, tasks.length]);

  const overallDiff = totalCurrent - totalPrev;
  const chartMaxCount = Math.max(...validDays.map(d => d.count), 1);

  const bestGlobalStreak = useMemo(() => {
    let max = 0;
    tasks.forEach(t => {
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
  }, [tasks]);

  const patternInsight = useMemo(() => {
    if (tasks.length === 0) return "Add objectives to begin pattern analysis.";
    const dayStats = Array.from({length: 7}, () => ({ possible: 0, done: 0 }));
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${meta.currentMonth}-${String(i).padStart(2, '0')}`;
      if (parseLocalDate(dateStr) > parseLocalDate(actualToday)) break; 

      const isoDay = getISODay(new Date(year, month - 1, i)) - 1; 
      tasks.forEach(t => {
        dayStats[isoDay].possible++;
        if (t.history?.[dateStr]) dayStats[isoDay].done++;
      });
    }

    let worstDay = null;
    let worstPct = 100;
    dayStats.forEach((stat, i) => {
      if (stat.possible > 0) {
        const pct = stat.done / stat.possible;
        if (pct < worstPct) { worstPct = pct; worstDay = i; }
      }
    });

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (worstDay !== null && worstPct < 0.4 && dayStats[worstDay].possible >= tasks.length * 3) {
      return `Critical slip pattern on ${dayNames[worstDay]}s. Adjust routine.`;
    }
    return "Momentum is stable across the board. Keep the chain.";
  }, [tasks, daysInMonth, actualToday, meta.currentMonth, year, month]);

  const globalWeekStats = useMemo(() => {
    if (tasks.length === 0) return { best: null, worst: null };
    const stats = weeksInMonth.map(week => {
      const validD = week.days.filter(Boolean).length;
      const possible = validD * tasks.length;
      let done = 0;
      tasks.forEach(t => { week.days.forEach(d => { if (d && t.history?.[`${meta.currentMonth}-${d}`]) done++; }); });
      return { label: week.weekLabel, pct: possible ? (done / possible) * 100 : 0 };
    });
    return { 
      best: stats.reduce((max, w) => w.pct > max.pct ? w : max, stats[0]), 
      worst: stats.reduce((min, w) => w.pct < min.pct ? w : min, stats[0]) 
    };
  }, [weeksInMonth, tasks, meta.currentMonth]);

  const visibleDays = weeksInMonth.flatMap(w => w.days);

  // FIX 3: Safe toggle wrapper (Prevents extreme re-renders on drag)
  const handleToggleSafe = useCallback((task: Task, dateStr: string) => {
    const selected = parseLocalDate(dateStr);
    const todayDate = parseLocalDate(actualToday);
  
    if (selected > todayDate) return showError(`Can't edit the future`);
    if (selected < todayDate) return showError(`Past days are locked`);
    if (meta.lockedDates?.includes(dateStr)) return showError(`Date is locked`);
    
    // Premium App Feel: Haptic Feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  
    toggleTask(task.id, dateStr);
  }, [actualToday, meta.lockedDates, showError, toggleTask]);

  // --- DRAG TO CHECK HANDLERS ---
  const handlePointerDown = (e: React.PointerEvent, task: Task, dateStr: string, isDone: boolean, isDisabled: boolean) => {
    if (isDisabled) return;
    setIsDragging(true);
    setDragAction(!isDone);
    handleToggleSafe(task, dateStr);
    e.preventDefault(); // Prevents selection
  };

  const handlePointerEnter = (task: Task, dateStr: string, isDone: boolean, isDisabled: boolean) => {
    if (!isDragging || dragAction === null || isDisabled) return;
    if (isDone !== dragAction) handleToggleSafe(task, dateStr);
  };

  // --- SWIPE LOGIC ---
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (isDragging) return; // FIX 5: Prevent conflict with drag-to-check
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const threshold = 30; // FIX 2: Better sensitivity
    
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;

    if (isLeftSwipe && selectedWeek < weeksInMonth.length - 1) {
      setSelectedWeek(selectedWeek + 1);
    }
    if (isRightSwipe && selectedWeek > 0) {
      setSelectedWeek(selectedWeek - 1);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F9FAFB] text-gray-800 pb-24 relative pt-[120px] md:pt-[0px] touch-pan-y">
      
      {/* ERROR TOAST */}
      {error && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white border border-red-200 text-red-600 px-6 py-3 rounded-[20px] shadow-lg z-[100] text-sm font-bold flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* --- DESKTOP HEADER --- */}
      <div className="hidden md:block px-4 py-4 sticky top-[112px] z-[80] bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1500px] mx-auto flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Today</span>
                <span className="text-lg font-bold text-gray-800">{todayData.length} <span className="text-gray-400 font-normal">/ {tasks.length}</span></span>
              </div>
              <div className="h-8 w-[1px] bg-gray-200" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Yesterday</span>
                <span className="text-lg font-bold text-gray-500">{yesterdayData.length} <span className="text-gray-300 font-normal">/ {tasks.length}</span></span>
              </div>
              
              {tasks.length > 0 && globalWeekStats.best && (
                <>
                  <div className="h-8 w-[1px] bg-gray-200" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Month Trend</span>
                    <span className="text-sm font-semibold text-gray-600 mt-1">
                      Peak: <span className="text-green-600">{globalWeekStats.best.label}</span> <span className="text-gray-300 mx-1">|</span> Low: <span className="text-red-500">{globalWeekStats.worst.label}</span>
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1 hover:border-gray-300 transition-colors">
                <CalendarDays size={16} className="text-gray-400" />
                <input type="month" value={meta.currentMonth} onChange={(e) => setMonthYear(e.target.value)} className="outline-none text-sm font-bold text-gray-700 bg-transparent cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden sticky top-[112px] z-[80] bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <input type="month" value={meta.currentMonth} onChange={(e) => setMonthYear(e.target.value)} className="text-xs font-bold text-gray-600 uppercase tracking-widest bg-transparent outline-none mb-1" />
            <h1 className="text-2xl font-bold text-gray-800">Today</h1>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-gray-800">{todayData.length}</span>
            <span className="text-sm font-normal text-gray-400"> / {tasks.length}</span>
          </div>
        </div>
      </div>

      {/* --- SHARED CONTROL BAR --- */}
      <div className="p-4 sticky top-0 md:top-[176px] z-[70] bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 flex flex-col w-full">
            <div className="flex gap-2">
              <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="New performance objective..." className="flex-1 p-3 rounded-xl border border-gray-200 outline-none focus:border-orange-400 bg-white text-gray-800 text-sm font-semibold placeholder:text-gray-400" />
              <input type="text" value={taskGroup} onChange={(e) => setTaskGroup(e.target.value)} placeholder="GROUP" className="w-24 md:w-36 p-3 rounded-xl border border-gray-200 outline-none font-bold text-[10px] uppercase tracking-widest bg-gray-50 text-gray-600" />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => { if(!taskName.trim()) return showError("Objective required"); addTask(taskName, taskGroup || 'General'); setTaskName(''); }} className="flex-1 md:flex-none bg-white border border-gray-200 text-gray-800 px-6 py-3 rounded-xl font-bold text-xs tracking-widest hover:bg-gray-50 transition-colors">ADD</button>
            <button onClick={() => { if(meta.lockedDates?.includes(today) || tasks.length === 0) return; if(window.confirm(`Lock results for ${today}? This cannot be undone.`)) lockToday(); }} className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-xs tracking-widest flex items-center justify-center gap-2 transition-colors border ${meta.lockedDates?.includes(today) ? 'bg-gray-50 text-green-600 border-green-200' : 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'}`}>
              {meta.lockedDates?.includes(today) ? <Lock size={14} /> : <Save size={14} />} {meta.lockedDates?.includes(today) ? 'LOCKED' : 'SAVE DAY'}
            </button>
          </div>
        </div>
      </div>

      {/* --- CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col xl:flex-row p-4 md:p-8 max-w-[1500px] mx-auto w-full gap-8">
        
        {/* LEFT COLUMN (Decisions & Table) */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          
          {/* 🔥 DECISION LAYER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Efficiency Signal */}
            <div className="bg-white border border-gray-200 rounded-[20px] p-5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Efficiency</span>
                <span className={`text-xl font-bold mt-1 ${todayData.length === 0 ? 'text-red-500' : todayData.length < weekAvg ? 'text-orange-500' : 'text-green-600'}`}>
                  {todayData.length === 0 ? "Zero output" : `${todayData.length} Done`}
                </span>
                <span className="text-[10px] font-semibold text-gray-400 mt-1">
                  Wk Avg: <span className="text-gray-600">{weekAvg}/day</span>
                </span>
              </div>
              <div className="w-10 h-10 flex items-center justify-center">
                {todayData.length > weekAvg && <ArrowUpRight className="text-green-500" size={24} />}
                {todayData.length < weekAvg && todayData.length > 0 && <ArrowDownRight className="text-orange-500" size={24} />}
                {todayData.length === 0 && <Minus className="text-red-500" size={24} />}
              </div>
            </div>

            {/* Focus Recommendation */}
            <div className="bg-white border border-gray-200 rounded-[20px] p-5 flex flex-col justify-center">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Target size={12} /> Priority</span>
              <div className="mt-2 text-sm font-semibold text-gray-800">
                {tasks.length === 0 ? "Initialize objectives." :
                 todayData.length === 0 ? "Start execution. Momentum is zero." :
                 todayData.length < tasks.length / 2 ? "Below threshold. Push now." :
                 todayData.length < tasks.length ? "Positive pace. Maintain focus." :
                 "Execution complete."}
              </div>
            </div>

            {/* Pattern/Momentum Signal */}
            <div className="bg-white border border-gray-200 rounded-[20px] p-5 flex flex-col justify-center">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Zap size={12} className={momentumScore > 0 ? 'text-green-500' : momentumScore < 0 ? 'text-red-500' : 'text-orange-500'} /> 
                {momentumScore !== 0 ? 'Momentum Trend' : 'Pattern Insight'}
              </span>
              <div className="mt-2 text-sm font-semibold text-gray-800">
                {momentumScore > 0 ? "Upward trend detected. Maintain intensity." : 
                 momentumScore < 0 ? "Declining trend. Intervene immediately." : 
                 patternInsight}
              </div>
            </div>
          </div>

          {/* FIX 7: Empty State Handling */}
          {tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-[20px] text-gray-400">
              <Target size={48} className="mb-4 opacity-30" />
              <p className="font-bold text-lg text-gray-600">No objectives set</p>
              <p className="text-sm">Add a new performance objective above to begin tracking.</p>
            </div>
          ) : (
            <>
              {/* MAIN MATRIX TABLE (DESKTOP) */}
              <div className="bg-white border border-gray-200 rounded-[20px] overflow-hidden hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="sticky left-0 z-50 bg-gray-50 border-r border-gray-200 p-2 text-center align-middle"></th>
                        {weeksInMonth.map((week) => (
                          <th key={week.weekLabel} colSpan={7} className="text-center text-[10px] font-bold uppercase tracking-widest border-r border-gray-200 p-2 text-gray-500">
                            {week.weekLabel}
                          </th>
                        ))}
                      </tr>
                      <tr className="bg-white">
                        <th className="sticky left-0 z-50 bg-white border-b border-r border-gray-200 p-2 min-w-[340px]"></th>
                        {visibleDays.map((_, i) => (
                          <th key={`dayname-${i}`} className="border-b border-r border-gray-200 p-2 text-[9px] font-bold text-gray-500 text-center uppercase tracking-widest">
                            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i % 7]}
                          </th>
                        ))}
                      </tr>
                      <tr className="bg-white">
                        <th className="sticky left-0 z-50 bg-white border-b border-r border-gray-200 p-6 min-w-[340px]">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Objective Stream</span>
                        </th>
                        {visibleDays.map((day, i) => {
                          if (!day) return <th key={`pad-${i}`} className="border-b border-r border-gray-100 bg-gray-50/50"></th>;
                          const dateStr = `${meta.currentMonth}-${day}`;
                          const isTodayCol = dateStr === actualToday;
                          return (
                            <th key={day} ref={isTodayCol ? todayRef : null} className={`border-b border-r border-gray-100 p-3 text-[10px] font-bold text-center min-w-[50px] ${isTodayCol ? 'bg-orange-500 text-white z-10' : 'text-gray-400'}`}>
                              {parseInt(day)}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map(group => {
                        const groupTasks = groupedTasks[group];
                        if (!groupTasks || groupTasks.length === 0) return null;

                        return (
                          <React.Fragment key={group}>
                            <tr className="bg-gray-50">
                              <td className="sticky left-0 z-40 px-6 py-2 border-b border-r border-gray-200 bg-gray-50 font-bold text-[9px] text-gray-500 uppercase tracking-widest">{group}</td>
                              <td colSpan={visibleDays.length} className="border-b border-gray-200"></td>
                            </tr>
                            {groupTasks.map(task => {
                              const currentStreak = calculateCurrentStreak(task.history, actualToday);
                              const isElite = currentStreak >= 7;
                              const isGood = currentStreak >= 3 && currentStreak < 7;
                              const isAtRisk = !task.history?.[actualToday] && currentStreak > 0;
                              
                              const validPastDays = visibleDays.filter(d => d && parseLocalDate(`${meta.currentMonth}-${d}`) <= parseLocalDate(actualToday));
                              const donePastDays = validPastDays.filter(d => task.history?.[`${meta.currentMonth}-${d}`]);
                              const isPerfectWeek = validPastDays.length > 0 && donePastDays.length === validPastDays.length;

                              return (
                                <tr key={task.id} className="group hover:bg-gray-50 transition-colors">
                                  <td className="sticky left-0 z-40 bg-white border-b border-r border-gray-200 p-4">
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-bold text-gray-800 text-sm">{task.name}</span>
                                          {currentStreak > 0 && (
                                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${isElite ? 'bg-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.5)]' : isGood ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                              <Flame size={10} />
                                              <span>{currentStreak}d</span>
                                            </div>
                                          )}
                                          {isAtRisk && <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest">risk</span>}
                                          {isPerfectWeek && <Zap size={12} className="text-green-500" fill="currentColor" />}
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap">
                                          {weeksInMonth.map((week, i) => {
                                            let doneCount = 0, validD = 0;
                                            week.days.forEach(day => {
                                              if (!day) return;
                                              validD++;
                                              if (task.history?.[`${meta.currentMonth}-${day}`]) doneCount++;
                                            });
                                            const isPerfect = doneCount === validD && validD > 0;
                                            return (
                                              <div key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border ${isPerfect ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                                {week.weekLabel}: {doneCount}/{validD}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 p-1 transition-opacity"><X size={16}/></button>
                                    </div>
                                  </td>
                                  {visibleDays.map((day, i) => {
                                    if (!day) return <td key={`pad-box-${i}`} className="border-b border-r border-gray-50 bg-gray-50/50" />;
                                    const dateStr = `${meta.currentMonth}-${day}`;
                                    const isDone = !!task.history?.[dateStr];
                                    const isFuture = parseLocalDate(dateStr) > parseLocalDate(actualToday);
                                    const isPast = parseLocalDate(dateStr) < parseLocalDate(actualToday);
                                    const isLocked = meta.lockedDates?.includes(dateStr);
                                    const isDisabled = isFuture || isPast || isLocked;
                                    
                                    const tooltipMsg = isFuture ? "Future date locked" : isPast ? "Past date locked" : isLocked ? "Day is saved & locked" : "";

                                    return (
                                      <td key={day} className={`text-center border-b border-r border-gray-50 p-0 ${dateStr === actualToday ? 'bg-orange-50/30' : ''}`} title={tooltipMsg}>
                                        <div 
                                          className="h-14 flex items-center justify-center touch-none cursor-pointer"
                                          onPointerDown={(e) => handlePointerDown(e, task, dateStr, isDone, isDisabled)}
                                          onPointerEnter={() => handlePointerEnter(task, dateStr, isDone, isDisabled)}
                                          onClick={() => { if (!isDisabled && !isDragging) handleToggleSafe(task, dateStr); }} // FIX 6: Fallback
                                        >
                                          <input 
                                            type="checkbox" 
                                            checked={isDone} 
                                            onChange={() => {}} // Handled by pointer/click events
                                            className={`w-5 h-5 rounded border-gray-300 transition-all pointer-events-none accent-green-600 ${isDone ? 'opacity-80' : 'hover:scale-110'} ${isDisabled ? 'opacity-30 grayscale' : ''} ${isElite && isDone ? 'shadow-[0_0_10px_rgba(249,115,22,0.4)]' : ''}`} 
                                          />
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* MOBILE GROUP → WEEK → TASK STRUCTURE */}
              <div 
                className="md:hidden space-y-6 overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {groups.map(group => {
                  const groupTasks = groupedTasks[group];
                  if (!groupTasks || groupTasks.length === 0) return null;

                  return (
                    <div key={group} className="space-y-4">
                      {/* GROUP TITLE */}
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-2">
                        {group}
                      </div>

                      {/* WEEKS */}
                      {weeksInMonth.map((week, wIndex) => {
                        const isActiveWeek = selectedWeek === wIndex;
                        if (!isActiveWeek) return null;

                        // Weekly Progress Bar logic
                        const weekValidDays = week.days.filter(Boolean).length;
                        const totalWeekTasks = groupTasks.length * weekValidDays;
                        let completedWeekTasks = 0;
                        groupTasks.forEach(t => {
                          week.days.forEach(d => {
                            if (d && t.history?.[`${meta.currentMonth}-${d}`]) completedWeekTasks++;
                          });
                        });
                        const progressPct = totalWeekTasks === 0 ? 0 : (completedWeekTasks / totalWeekTasks) * 100;
                        const isPerfectGroupWeek = progressPct === 100 && totalWeekTasks > 0;

                        return (
                          // FIX 8: Animated properly only on key change (week swap)
                          <div key={`${week.weekLabel}-${selectedWeek}`} className="bg-white border border-gray-200 rounded-xl p-3 space-y-4 shadow-sm relative animate-in slide-in-from-right-4 fade-in duration-300">
                            
                            {/* WEEK HEADER */}
                            <div>
                              <div className="flex justify-between items-end mb-1">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                                  {week.weekLabel}
                                  {isPerfectGroupWeek && (
                                    <span className="flex items-center gap-1 text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200 animate-in zoom-in">
                                      <Star size={10} fill="currentColor" /> Perfect
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-bold text-gray-400">
                                  {progressPct.toFixed(0)}%
                                </div>
                              </div>
                              {/* Weekly Progress Bar */}
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${isPerfectGroupWeek ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${progressPct}%` }} />
                              </div>
                            </div>

                            {/* TASKS IN THIS GROUP */}
                            {groupTasks.map(task => {
                              return (
                                <div key={task.id} className="space-y-2 pb-2">
                                  {/* TASK NAME & DELETE */}
                                  <div className="flex justify-between items-center">
                                    <div className="text-sm font-semibold text-gray-800">
                                      {task.name}
                                    </div>
                                    <button onClick={() => deleteTask(task.id)} className="p-1 text-gray-300 hover:text-red-500"><X size={14}/></button>
                                  </div>

                                  {/* CHECKBOX 7-DAY GRID */}
                                  <div className="grid grid-cols-7 gap-1 relative">
                                    {week.days.map((day, i) => {
                                      if (!day) return <div key={i} className="flex-shrink-0" />;

                                      const dateStr = `${meta.currentMonth}-${day}`;
                                      const isDone = !!task.history?.[dateStr];

                                      const selected = parseLocalDate(dateStr);
                                      const todayDate = parseLocalDate(actualToday);

                                      const isFuture = selected > todayDate;
                                      const isPast = selected < todayDate;
                                      const isLocked = meta.lockedDates?.includes(dateStr);
                                      const isDisabled = isFuture || isPast || isLocked;
                                      const isToday = dateStr === actualToday;

                                      const tooltipMsg = isFuture ? "Future locked" : isPast ? "Past locked" : isLocked ? "Saved" : "";

                                      // FIX 4: Perfect Streak Line Logic
                                      const prevDayStr = i > 0 && week.days[i-1] ? `${meta.currentMonth}-${week.days[i-1]}` : null;
                                      const isPrevDone = prevDayStr && !!task.history?.[prevDayStr];

                                      // Heatmap Dynamic Colors
                                      const cStreak = calculateCurrentStreak(task.history, dateStr);
                                      const isEliteStreak = cStreak >= 7;
                                      const heatmapAccent = isEliteStreak ? 'accent-orange-500' : 'accent-green-500';
                                      const heatmapBg = isDone ? (isEliteStreak ? 'bg-orange-50' : 'bg-green-50') : 'bg-transparent';
                                      const glowClass = isDone && isEliteStreak ? 'shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse' : '';

                                      return (
                                        <div 
                                          key={day} 
                                          className={`relative flex flex-col items-center justify-center gap-1.5 py-1.5 rounded-lg flex-shrink-0 touch-none cursor-pointer ${heatmapBg} ${isToday ? "bg-orange-100 border border-orange-300" : "border border-transparent"}`}
                                          title={tooltipMsg}
                                          onPointerDown={(e) => handlePointerDown(e, task, dateStr, isDone, isDisabled)}
                                          onPointerEnter={() => handlePointerEnter(task, dateStr, isDone, isDisabled)}
                                          onClick={() => { if (!isDisabled && !isDragging) handleToggleSafe(task, dateStr); }} // FIX 6: Fallback
                                        >
                                          {/* FIX 4: Streak Connecting Line (Connects to previous box center seamlessly) */}
                                          {isDone && isPrevDone && (
                                            <div className={`absolute top-[50%] left-[-50%] w-[100%] h-[2px] z-0 pointer-events-none ${isEliteStreak ? 'bg-orange-300' : 'bg-green-300'}`} />
                                          )}

                                          {/* DAY LABEL */}
                                          <span className={`text-[9px] font-bold z-10 pointer-events-none ${isToday ? "text-orange-600" : isDone ? "text-gray-600" : "text-gray-400"}`}>
                                            {['M','T','W','T','F','S','S'][i]}
                                          </span>

                                          {/* CHECKBOX */}
                                          <input
                                            type="checkbox"
                                            checked={isDone}
                                            onChange={() => {}} // Handled by pointer/click events
                                            className={`w-5 h-5 rounded z-10 pointer-events-none ${heatmapAccent} ${glowClass} ${
                                              isDisabled ? "opacity-30 grayscale" : "transition-transform"
                                            }`}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* --- RIGHT PANEL (Analytics & Trends) --- */}
        <div className="w-full xl:w-[340px] flex-shrink-0 flex flex-col gap-6">
          
          {/* ANALYTICS HUD */}
          <div className="bg-white border border-gray-200 rounded-[20px] p-6 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Activity size={12} /> Performance HUD</span>
                <span className="text-sm font-bold text-gray-800">
                  {overallDiff > 0 ? `Improved +${overallDiff} vs last week` : overallDiff < 0 ? `Underperforming ${overallDiff}` : `Parity with last week`}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-[3px] border-green-500 flex items-center justify-center bg-white shadow-sm">
                  <span className="text-sm font-bold text-gray-800">{consistencyScore}%</span>
                </div>
                <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Consistency</span>
              </div>
            </div>

            {/* PERFORMANCE BAR CHART */}
            <div className="w-full mt-2">
              <div className="flex items-end justify-between h-20 gap-1.5 bg-gray-50 rounded-xl p-2 border border-gray-100">
                {validDays.map((d, i) => {
                  const heightPct = (d.count / chartMaxCount) * 100;
                  const isToday = d.date === actualToday;
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 gap-2 group">
                      <div className="w-full relative flex-1 flex items-end rounded-sm overflow-hidden bg-gray-200">
                        <div className={`w-full rounded-sm transition-all duration-700 ease-out ${isToday ? 'bg-orange-400' : 'bg-green-500'}`} style={{ height: `${heightPct}%` }} />
                      </div>
                      <span className={`text-[9px] font-bold uppercase ${isToday ? 'text-orange-500' : 'text-gray-400'}`}>{d.label.charAt(0)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STREAK & TREND FOOTER */}
            <div className="flex flex-col gap-2">
              {bestGlobalStreak > 1 && (
                <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600">All-Time Peak Streak</span>
                  <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-1 rounded-md text-xs font-bold border border-orange-100 shadow-[0_0_8px_rgba(249,115,22,0.2)]">
                    <Flame size={14} /> {bestGlobalStreak} Days
                  </div>
                </div>
              )}
              {globalWeekStats.worst && (
                <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500">Weakest Window:</span>
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{globalWeekStats.worst.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* WEEK COMPARISON ENGINE */}
          <div className="bg-white border border-gray-200 rounded-[20px] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2"><BarChart2 size={16} className="text-gray-500" /> Comparison</h2>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
                <button onClick={() => setWeekOffset(o => o - 1)} className="p-1 text-gray-400 hover:text-gray-800 hover:bg-white rounded transition-colors"><ChevronLeft size={14}/></button>
                <span className="text-[10px] font-bold w-16 text-center text-gray-600">{weekOffset === 0 ? 'THIS WEEK' : weekOffset < 0 ? `${Math.abs(weekOffset)}W AGO` : `${weekOffset}W NEXT`}</span>
                <button onClick={() => setWeekOffset(o => o + 1)} className="p-1 text-gray-400 hover:text-gray-800 hover:bg-white rounded transition-colors"><ChevronRight size={14}/></button>
              </div>
            </div>

            <div className="space-y-3">
              {compareCurrentWeek.map((day, i) => {
                const prevCount = comparePrevWeek[i].count;
                const isFuture = parseLocalDate(day.date) > parseLocalDate(actualToday);
                const diff = isFuture ? null : day.count - prevCount;
                const isToday = day.date === actualToday;
                
                return (
                  <div key={day.date} className={`flex items-center justify-between p-3 rounded-[16px] border transition-colors ${isToday ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-transparent'}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-orange-500' : 'text-gray-400'}`}>{day.label}</span>
                        <span className={`text-sm font-bold ${isToday ? 'text-orange-700' : 'text-gray-700'}`}>{day.dayNum}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-bold w-6 text-right ${isFuture ? 'text-gray-300' : 'text-gray-800'}`}>{isFuture ? '-' : day.count}</span>
                      <div className={`flex items-center justify-center w-14 py-1.5 rounded-md text-[10px] font-bold gap-1 ${diff === null ? 'bg-transparent text-gray-300' : diff > 0 ? 'bg-green-50 text-green-700 border border-green-200' : diff < 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                        {diff === null && <span>--</span>}
                        {diff !== null && diff > 0 && <><ArrowUpRight size={12} strokeWidth={3} /> +{diff}</>}
                        {diff !== null && diff < 0 && <><ArrowDownRight size={12} strokeWidth={3} /> {diff}</>}
                        {diff !== null && diff === 0 && <><Minus size={12} strokeWidth={3} /> 0</>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-500">Week Load Total:</span>
              <span className="font-bold text-gray-800">{totalCurrent}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}