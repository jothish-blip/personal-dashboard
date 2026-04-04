"use client";

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { AlertTriangle, Target } from 'lucide-react';
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
  deleteTask: (id: number) => void;
  toggleTask: (id: number, date: string) => void;
  lockToday: () => void;
  setMonthYear: (value: string) => void;
  addAuditLog: (detail: string) => void;
}

export default function MatrixView({ 
  tasks, meta, addTask, deleteTask, toggleTask, lockToday, setMonthYear 
}: MatrixProps) {
  
  const actualToday = getLocalDate(new Date()); 
  const [error, setError] = useState('');
  const [weekOffset, setWeekOffset] = useState(0); 
  const todayRef = useRef<HTMLTableCellElement | null>(null);

  const showError = useCallback((msg: string) => { 
    setError(msg); 
    setTimeout(() => setError(''), 3000); 
  }, []);

  // --- 1. DATA ENGINE ---
  const { todayData, yesterdayData } = useMemo(() => {
    const d = parseLocalDate(actualToday);
    d.setDate(d.getDate() - 1);
    const yesterday = getLocalDate(d);

    return {
      todayData: tasks.filter(t => t.history?.[actualToday]),
      yesterdayData: tasks.filter(t => t.history?.[yesterday]),
    };
  }, [tasks, actualToday]);

  const [year, month] = meta.currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

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

  const activeWeekIndex = useMemo(() => {
    return weeksInMonth.findIndex(week =>
      week.days.some(d => d && `${meta.currentMonth}-${d}` === actualToday)
    );
  }, [weeksInMonth, actualToday, meta.currentMonth]);

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
    let curr = 0, prev = 0, possible = 0;
    
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
    
    return { totalCurrent: curr, totalPrev: prev, consistencyScore: score, validDays: valid, weekAvg: avg, momentumScore: mom };
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

  const handleToggleSafe = useCallback((task: Task, dateStr: string) => {
    const selected = parseLocalDate(dateStr);
    const todayDate = parseLocalDate(actualToday);
  
    if (selected > todayDate) return showError(`Can't edit the future`);
    if (selected < todayDate) return showError(`Past days are locked`);
    if (meta.lockedDates?.includes(dateStr)) return showError(`Date is locked`);
  
    toggleTask(task.id, dateStr);
  }, [actualToday, meta.lockedDates, showError, toggleTask]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F9FAFB] text-gray-800 pb-24 relative pt-0 overscroll-y-contain">
      {error && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white border border-red-200 text-red-600 px-6 py-3 rounded-[20px] shadow-lg z-[100] text-sm font-bold flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <Header 
        todayDataLength={todayData.length}
        yesterdayDataLength={yesterdayData.length}
        tasksLength={tasks.length}
        globalWeekStats={globalWeekStats}
        meta={meta}
        setMonthYear={setMonthYear}
        addTask={addTask}
        showError={showError}
        lockToday={lockToday}
        actualToday={actualToday}
      />

      <div className="flex-1 flex flex-col xl:flex-row p-4 md:p-8 max-w-[1500px] mx-auto w-full gap-8">
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <Decisions 
            todayDataLength={todayData.length}
            weekAvg={weekAvg}
            tasksLength={tasks.length}
            momentumScore={momentumScore}
            patternInsight={patternInsight}
          />

          {tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-[20px] text-gray-400">
              <Target size={48} className="mb-4 opacity-30" />
              <p className="font-bold text-lg text-gray-600">No objectives set</p>
              <p className="text-sm">Add a new performance objective above to begin tracking.</p>
            </div>
          ) : (
            <Grid 
              tasks={tasks}
              meta={meta}
              groupedTasks={groupedTasks}
              groups={groups}
              weeksInMonth={weeksInMonth}
              visibleDays={visibleDays}
              actualToday={actualToday}
              todayRef={todayRef}
              handleToggleSafe={handleToggleSafe}
              deleteTask={deleteTask}
              activeWeekIndex={activeWeekIndex}
            />
          )}
        </div>

        <Sidebar 
          overallDiff={overallDiff}
          consistencyScore={consistencyScore}
          validDays={validDays}
          chartMaxCount={chartMaxCount}
          bestGlobalStreak={bestGlobalStreak}
          globalWeekStats={globalWeekStats}
          compareCurrentWeek={compareCurrentWeek}
          comparePrevWeek={comparePrevWeek}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          totalCurrent={totalCurrent}
          actualToday={actualToday}
        />
      </div>
    </div>
  );
}