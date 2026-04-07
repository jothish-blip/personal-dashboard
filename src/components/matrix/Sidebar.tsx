"use client";

import React, { useMemo } from 'react';
import { Activity, Flame, BarChart2, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { parseLocalDate } from './utils';

interface SidebarProps {
  overallDiff: number;
  consistencyScore: number;
  validDays: { date: string; label: string; count: number }[];
  chartMaxCount: number;
  bestGlobalStreak: number;
  globalWeekStats: { best: any; worst: any };
  compareCurrentWeek: { date: string; label: string; dayNum: string; count: number }[];
  comparePrevWeek: { date: string; count: number }[];
  weekOffset: number;
  setWeekOffset: React.Dispatch<React.SetStateAction<number>>;
  totalCurrent: number;
  actualToday: string;
}

export default function Sidebar({
  overallDiff, consistencyScore, validDays, chartMaxCount, bestGlobalStreak,
  globalWeekStats, compareCurrentWeek, comparePrevWeek, weekOffset, setWeekOffset,
  totalCurrent, actualToday
}: SidebarProps) {
  
  // 🔴 1. PRECOMPUTE TODAY DATE (Avoid expensive parsing in loops)
  const todayDateObj = useMemo(() => parseLocalDate(actualToday), [actualToday]);

  return (
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
              // 🔴 2. POTENTIAL DIVIDE-BY-ZERO FIX
              const heightPct = chartMaxCount === 0 ? 0 : (d.count / chartMaxCount) * 100;
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
            {/* 🟡 4. WEEK OFFSET BUTTON SPAM FIX (Clamped ranges) */}
            <button onClick={() => setWeekOffset(o => Math.max(o - 1, -52))} className="p-1 text-gray-400 hover:text-gray-800 hover:bg-white rounded transition-colors"><ChevronLeft size={14}/></button>
            <span className="text-[10px] font-bold w-16 text-center text-gray-600">{weekOffset === 0 ? 'THIS WEEK' : weekOffset < 0 ? `${Math.abs(weekOffset)}W AGO` : `${weekOffset}W NEXT`}</span>
            <button onClick={() => setWeekOffset(o => Math.min(o + 1, 12))} className="p-1 text-gray-400 hover:text-gray-800 hover:bg-white rounded transition-colors"><ChevronRight size={14}/></button>
          </div>
        </div>

        <div className="space-y-3">
          {compareCurrentWeek.map((day, i) => {
            // 🔴 3. UNSAFE ARRAY ACCESS FIX
            const prevCount = comparePrevWeek[i]?.count ?? 0;
            
            // 🔴 1. Using precomputed todayDateObj
            const isFuture = parseLocalDate(day.date) > todayDateObj;
            
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
  );
}