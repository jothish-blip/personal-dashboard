"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Task, Meta } from "../types";

// --- TIMEZONE GUARD: MUST MATCH MATRIX VIEW ---
const getLocalDate = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - (offset * 60000));
  return local.toISOString().split('T')[0];
};

export default function StatsGrid({ tasks, meta }: { tasks: Task[], meta: Meta }) {
  const [mode, setMode] = useState<'month' | 'year' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState(meta.currentMonth);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(getLocalDate(new Date()));
  const [endDate, setEndDate] = useState(getLocalDate(new Date()));
  const [today, setToday] = useState(getLocalDate(new Date()));

  useEffect(() => {
    const interval = setInterval(() => {
      const newToday = getLocalDate(new Date());
      setToday(prev => (prev !== newToday ? newToday : prev));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isInSelectedRange = useMemo(() => (date: string) => {
    if (mode === 'month') return date.startsWith(selectedMonth);
    if (mode === 'year') return date.startsWith(String(selectedYear));
    if (mode === 'custom') return date >= startDate && date <= endDate;
    return false;
  }, [mode, selectedMonth, selectedYear, startDate, endDate]);

  // --- 1. STREAK: REAL-TIME CONTINUITY ---
  const streak = useMemo(() => {
    let count = 0;
    // Check up to 365 days back
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = getLocalDate(d);

      const hasActivity = tasks.some(t => t.history?.[ds] === true);

      // Rule: If checking today and it's empty, we don't break yet (allow today to be finished)
      // If checking yesterday or before and it's empty, the streak is officially broken.
      if (!hasActivity) {
        if (ds === today) continue; 
        else break;
      }
      count++;
    }
    return count;
  }, [tasks, today]);

  // --- 2. CONSISTENCY & EFFICIENCY (PAST DAYS ONLY) ---
  const aggregates = useMemo(() => {
    let activeDaysCount = 0;
    let totalPossibleDays = 0;
    let totalEfficiencySum = 0;
    let totalReps = 0;
    const dayCheckins: Record<string, number> = {};

    // Scan last 365 days to find matches for the selected range
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = getLocalDate(d);

      if (!isInSelectedRange(ds)) continue;

      // We only calculate consistency/efficiency for completed days (Past Days)
      // to avoid "diluting" the average with today's partial progress.
      if (ds < today) {
        totalPossibleDays++;
        const completedToday = tasks.filter(t => t.history?.[ds] === true).length;
        
        if (completedToday > 0) {
          activeDaysCount++;
          if (tasks.length > 0) {
            totalEfficiencySum += (completedToday / tasks.length);
          }
        }
      }

      // Total Reps & Peaks include today
      const completedAnytime = tasks.filter(t => t.history?.[ds] === true).length;
      if (completedAnytime > 0) {
        dayCheckins[ds] = completedAnytime;
        totalReps += completedAnytime;
      }
    }

    const consistencyPercent = totalPossibleDays > 0 
      ? Math.round((activeDaysCount / totalPossibleDays) * 100) 
      : 0;

    const efficiencyPercent = activeDaysCount > 0 
      ? Math.round((totalEfficiencySum / totalPossibleDays) * 100) 
      : 0;

    const peak = Object.values(dayCheckins).length > 0 ? Math.max(...Object.values(dayCheckins)) : 0;

    return { 
      consistencyPercent, 
      efficiencyPercent, 
      peak, 
      totalReps, 
      activeDaysCount, 
      totalPossibleDays 
    };
  }, [tasks, isInSelectedRange, today]);

  return (
    <div className="flex flex-col bg-gray-50 shrink-0 border-b border-gray-200">
      {/* FILTER TABS */}
      <div className="px-5 pt-5 flex flex-wrap items-center gap-3">
        <div className="flex bg-gray-200 p-1 rounded-xl">
          {(['month', 'year', 'custom'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMode(t)}
              className={`px-5 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-tight ${
                mode === t ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {mode === 'month' && (
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold bg-white outline-none" />
          )}
          {mode === 'year' && (
            <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold bg-white w-20 outline-none" />
          )}
          {mode === 'custom' && (
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-2 py-1">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="text-[10px] font-bold outline-none bg-transparent" />
              <span className="text-gray-300 font-bold">→</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="text-[10px] font-bold outline-none bg-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* ANALYTICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
        <div className="border border-gray-200 p-5 rounded-2xl text-center bg-white shadow-sm">
          <div className="text-3xl font-black text-blue-600">{streak}</div>
          <div className="text-[10px] text-gray-400 uppercase mt-1 font-black tracking-widest">Streak</div>
        </div>

        <div className="border border-gray-200 p-5 rounded-2xl text-center bg-white shadow-sm">
          <div className="text-3xl font-black text-purple-600">{aggregates.consistencyPercent}%</div>
          <div className="text-[10px] text-gray-400 uppercase mt-1 font-black tracking-widest">Consistency</div>
          <div className="text-[9px] text-gray-300 font-bold mt-1 uppercase">
            {aggregates.activeDaysCount} / {aggregates.totalPossibleDays} Days
          </div>
        </div>

        <div className="border border-gray-200 p-5 rounded-2xl text-center bg-white shadow-sm">
          <div className="text-3xl font-black text-gray-900">{aggregates.peak}</div>
          <div className="text-[10px] text-gray-400 uppercase mt-1 font-black tracking-widest">Peak Reps</div>
        </div>

        <div className="border border-gray-200 p-5 rounded-2xl text-center bg-white shadow-sm">
          <div className="text-3xl font-black text-green-600">{aggregates.efficiencyPercent}%</div>
          <div className="text-[10px] text-gray-400 uppercase mt-1 font-black tracking-widest">Efficiency</div>
        </div>
      </div>

      {/* FOOTER INSIGHT */}
      <div className="px-5 pb-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-between items-center px-8 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Output</span>
            <span className="text-[10px] font-bold text-gray-600">
              {mode === 'custom' ? `${startDate} to ${endDate}` : (mode === 'month' ? selectedMonth : selectedYear)}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-gray-900">{aggregates.totalReps}</div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Total Completions</div>
          </div>
        </div>
      </div>
    </div>
  );
}