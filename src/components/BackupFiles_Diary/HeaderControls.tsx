import React, { useMemo } from 'react';
import { BookOpen } from 'lucide-react';

export default function HeaderControls({ system }: any) {
  const e = system.currentEntry || {};

  // --- Formatting ---
  const formattedEnergy = e.energy 
    ? e.energy.charAt(0).toUpperCase() + e.energy.slice(1)
    : '—';

  const todayLabel = new Date().toLocaleDateString('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // --- Core Calculations ---
  const dayScore = useMemo(() => {
    const consistencyCalc = (system.consistency || 0) * 0.4;
    const alignCalc = (e.goalAlignment || 50) * 0.4;
    const distractCalc = ((100 - (e.distractionLevel || 0)) * 0.2);
    return Math.round(consistencyCalc + alignCalc + distractCalc);
  }, [system.consistency, e.goalAlignment, e.distractionLevel]);

  const trend = useMemo(() => {
    if (!system.allEntries) return 'same';
    
    // Calculate previous day securely
    const prevDateObj = new Date(system.selectedDate || new Date());
    prevDateObj.setDate(prevDateObj.getDate() - 1);
    const offset = prevDateObj.getTimezoneOffset();
    const localPrevDate = new Date(prevDateObj.getTime() - offset * 60000);
    const prevDateStr = localPrevDate.toISOString().split('T')[0];

    const prevEntry = system.allEntries[prevDateStr];
    const prevAlign = prevEntry?.goalAlignment || 50;
    const currAlign = e.goalAlignment || 50;

    if (currAlign > prevAlign) return 'up';
    if (currAlign < prevAlign) return 'down';
    return 'same';
  }, [system.selectedDate, system.allEntries, e.goalAlignment]);

  // --- Integrity Logic ---
  const hasData = e.goalAlignment !== undefined || system.consistency !== undefined;

  return (
    <header className="flex flex-col gap-5 pb-6 border-b border-gray-100 text-left">
      
      {/* --- TOP ROW: IDENTITY --- */}
      <div className="flex items-center gap-3">
        <div className="bg-orange-500 p-2.5 rounded-xl text-white shadow-sm shrink-0">
          <BookOpen size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Nextask Life Engine
          </h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">
            {todayLabel}
          </p>
        </div>
      </div>

      {/* --- SECOND ROW: CLEAN METRICS BAR --- */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-white border border-gray-200 rounded-2xl px-5 py-3.5 shadow-sm">
        
        {/* Day Score */}
        <div className="flex items-center gap-2">
          <div className="text-lg font-bold text-gray-900">
            {dayScore}
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Score
          </span>
        </div>

        <div className="h-4 w-[1px] bg-gray-200 hidden sm:block" />

        {/* Streak */}
        <div className="text-sm text-orange-600 font-semibold">
          🔥 {system.currentStreak || 0}d
        </div>

        <div className="h-4 w-[1px] bg-gray-200 hidden sm:block" />

        {/* Consistency */}
        <div className="text-sm font-semibold">
          ✅ {hasData ? (
            <span className="text-blue-600">{system.consistency || 0}%</span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>

        <div className="h-4 w-[1px] bg-gray-200 hidden sm:block" />

        {/* Energy */}
        <div className="text-sm text-amber-600 font-semibold uppercase">
          ⚡ {formattedEnergy}
        </div>

        <div className="h-4 w-[1px] bg-gray-200 hidden sm:block" />

        {/* Trend Indicator */}
        <span 
          title="Alignment trend vs yesterday"
          className={`text-base font-bold ${
            trend === 'up' ? 'text-emerald-500' : 
            trend === 'down' ? 'text-red-500' : 
            'text-gray-400'
          }`}
        >
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
        </span>

      </div>

      {/* --- THIRD ROW: MATRIX ENGINE STATUS --- */}
      <div className="flex flex-col gap-2 mt-1 px-1">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          System Readiness
        </h3>
        <div className="flex items-center gap-2.5">
          {/* Status Indicator Dot */}
          <div className="relative flex h-2.5 w-2.5">
            {e.energy !== 'low' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${e.energy === 'low' ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
          </div>
          
          {/* Dynamic Status Text */}
          <p className="text-sm text-gray-700 font-medium">
            {e.energy === 'low' || e.distractionLevel > 70
              ? "Burnout risk detected. Scale back operations and prioritize recovery." 
              : "Matrix Engine online. Discipline and alignment tracking operating normally."}
          </p>
        </div>
      </div>
      
    </header>
  );
}