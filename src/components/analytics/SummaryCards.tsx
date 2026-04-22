"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Activity, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Info, 
  AlertTriangle 
} from 'lucide-react';
import { FilteredData } from './utils';

// 🔥 FIX: Changed from interface extends to a type intersection
// This prevents the Turbopack parsing error while keeping exact same functionality
type ExtendedStats = FilteredData['stats'] & {
  consistencyDelta: number;
  activeDelta: number;
  avgDelta: number;
};

interface SummaryCardsProps {
  stats: ExtendedStats;
  momentum: number;
  isSyncing?: boolean;
}

function SummaryCards({ stats, momentum, isSyncing = false }: SummaryCardsProps) {
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, []);

  const toggleHelp = (id: string) => {
    setActiveHelp(prev => prev === id ? null : id);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[20px] shadow-sm overflow-hidden">

      {/* 🔥 HEADER */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between p-4 text-left outline-none"
      >
        <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">
          Insights
        </span>

        <span className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          <TrendingUp size={16} className="text-gray-400" />
        </span>
      </button>

      {/* 🔥 COLLAPSIBLE CONTENT */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100 p-4 pt-0" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          
          {/* 🔴 GLOBAL WARNING BANNER */}
          {momentum < 0 && stats.consistencyPercent < 50 && (
            <div className="col-span-full bg-red-50 border border-red-200 text-red-600 text-sm font-bold p-3 rounded-xl flex items-center gap-2 shadow-sm animate-in fade-in">
              <AlertTriangle size={18} />
              ⚠️ Execution collapsing — recent drop detected. Take corrective action.
            </div>
          )}

          {/* 🟢 1. MOMENTUM CARD */}
          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Momentum</span>
                {momentum > 0 && <span className="text-green-500 text-[10px] font-black">↑</span>}
                {momentum < 0 && <span className="text-red-500 text-[10px] font-black">↓</span>}
                <button onClick={() => toggleHelp("momentum")} className="text-gray-300 hover:text-gray-600 transition-colors outline-none">
                  <Info size={12} />
                </button>
              </div>
              <Activity size={16} className="text-gray-400" />
            </div>
            <h3 className={`text-2xl font-black ${momentum > 0 ? "text-green-600" : momentum < 0 ? "text-red-500" : "text-gray-500"}`}>
              {momentum > 0 ? `+${momentum}` : momentum === 0 ? "0" : momentum}
            </h3>
            <span className="text-[10px] font-bold mt-1 text-gray-400">
              vs yesterday
            </span>

            {activeHelp === "momentum" && (
              <div className="mt-2 text-[11px] text-gray-500 animate-in fade-in duration-200">
                Change compared to yesterday.
              </div>
            )}
          </div>
          
          {/* 2. TOTAL DONE */}
          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Done</span>
                {stats.delta > 0 && <span className="text-green-500 text-[10px] font-black">↑</span>}
                {stats.delta < 0 && <span className="text-red-500 text-[10px] font-black">↓</span>}
                <button onClick={() => toggleHelp("total")} className="text-gray-300 hover:text-gray-600 transition-colors outline-none">
                  <Info size={12} />
                </button>
              </div>
              <CheckCircle2 size={16} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-black text-gray-800 flex items-end gap-2">
              {stats.totalCompletions}
            </h3>
            <div className="flex flex-col mt-1">
              <div className={`text-[10px] font-bold ${stats.delta > 0 ? 'text-green-600' : stats.delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {stats.delta > 0 && `+${stats.delta}`}
                {stats.delta < 0 && `${stats.delta}`}
                {stats.delta === 0 && `0`}
              </div>
              {isSyncing && (
                <span className="text-[9px] text-gray-400 font-bold mt-1 animate-pulse">
                  Syncing...
                </span>
              )}
            </div>

            {activeHelp === "total" && (
              <div className="mt-2 text-[11px] text-gray-500 animate-in fade-in duration-200">
                Total completed tasks in selected range.
              </div>
            )}
          </div>
          
          {/* 3. CONSISTENCY */}
          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Consistency</span>
                {stats.consistencyDelta > 0 && <span className="text-green-500 text-[10px] font-black">↑</span>}
                {stats.consistencyDelta < 0 && <span className="text-red-500 text-[10px] font-black">↓</span>}
                <button onClick={() => toggleHelp("consistency")} className="text-gray-300 hover:text-gray-600 transition-colors outline-none">
                  <Info size={12} />
                </button>
              </div>
              <Activity size={16} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-black text-gray-800">
              {stats.consistencyPercent}%
            </h3>
            <div className={`text-[10px] font-bold mt-1 ${
              stats.consistencyDelta > 0 ? 'text-green-600' :
              stats.consistencyDelta < 0 ? 'text-red-500' :
              'text-gray-400'
            }`}>
              {stats.consistencyDelta > 0 && `+${stats.consistencyDelta}%`}
              {stats.consistencyDelta < 0 && `${stats.consistencyDelta}%`}
              {stats.consistencyDelta === 0 && "0"}
            </div>

            {activeHelp === "consistency" && (
              <div className="mt-2 text-[11px] text-gray-500 animate-in fade-in duration-200">
                How regularly you complete tasks.
              </div>
            )}
          </div>

          {/* 4. ACTIVE DAYS */}
          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Days</span>
                {stats.activeDelta > 0 && <span className="text-green-500 text-[10px] font-black">↑</span>}
                {stats.activeDelta < 0 && <span className="text-red-500 text-[10px] font-black">↓</span>}
                <button onClick={() => toggleHelp("active")} className="text-gray-300 hover:text-gray-600 transition-colors outline-none">
                  <Info size={12} />
                </button>
              </div>
              <CalendarIcon size={16} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-black text-gray-800">
              {stats.activeDays} <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Days</span>
            </h3>
            <div className={`text-[10px] font-bold mt-1 ${
              stats.activeDelta > 0 ? 'text-green-600' :
              stats.activeDelta < 0 ? 'text-red-500' :
              'text-gray-400'
            }`}>
              {stats.activeDelta > 0 && `+${stats.activeDelta}`}
              {stats.activeDelta < 0 && `${stats.activeDelta}`}
              {stats.activeDelta === 0 && "0"}
            </div>

            {activeHelp === "active" && (
              <div className="mt-2 text-[11px] text-gray-500 animate-in fade-in duration-200">
                Days you actually worked.
              </div>
            )}
          </div>
          
          {/* 5. PEAK VELOCITY */}
          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Peak Velocity</span>
                <button onClick={() => toggleHelp("peak")} className="text-gray-300 hover:text-gray-600 transition-colors outline-none">
                  <Info size={12} />
                </button>
              </div>
              <TrendingUp size={16} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-black text-gray-800">
              {stats.peakVolume} <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Reps</span>
            </h3>
            <span className="text-[10px] font-bold mt-1 text-gray-400">
              {stats.peakText}
            </span>

            {activeHelp === "peak" && (
              <div className="mt-2 text-[11px] text-gray-500 animate-in fade-in duration-200">
                Your highest output day in this range.
              </div>
            )}
          </div>

          {/* 6. AVG / DAY */}
          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg / Day</span>
                {stats.avgDelta > 0 && <span className="text-green-500 text-[10px] font-black">↑</span>}
                {stats.avgDelta < 0 && <span className="text-red-500 text-[10px] font-black">↓</span>}
                <button onClick={() => toggleHelp("avg")} className="text-gray-300 hover:text-gray-600 transition-colors outline-none">
                  <Info size={12} />
                </button>
              </div>
              <Activity size={16} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-black text-gray-800">{stats.avgPerDay}</h3>
            <div className={`text-[10px] font-bold mt-1 ${
              stats.avgDelta > 0 ? 'text-green-600' :
              stats.avgDelta < 0 ? 'text-red-500' :
              'text-gray-400'
            }`}>
              {stats.avgDelta > 0 && `+${stats.avgDelta}`}
              {stats.avgDelta < 0 && `${stats.avgDelta}`}
              {stats.avgDelta === 0 && "0"}
            </div>

            {activeHelp === "avg" && (
              <div className="mt-2 text-[11px] text-gray-500 animate-in fade-in duration-200">
                Average tasks per active day.
              </div>
            )}
          </div>

          {/* 7. WEAKEST DAY */}
          <div className="bg-red-50 p-5 rounded-[16px] border border-red-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Weakest Day</span>
                <button onClick={() => toggleHelp("weak")} className="text-red-300 hover:text-red-600 transition-colors outline-none">
                  <Info size={12} />
                </button>
              </div>
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <h3 className="text-[13px] font-bold text-red-600 leading-snug mt-1">
              {stats.worstDayInsight}
            </h3>
            
            {stats.consistencyPercent < 40 && (
              <div className="mt-2 text-[10px] text-red-500 font-bold flex items-center gap-1 bg-red-100/50 p-1.5 rounded-lg w-max border border-red-100">
                ⚠️ System instability
              </div>
            )}

            {activeHelp === "weak" && (
              <div className="mt-2 text-[11px] text-red-500 animate-in fade-in duration-200">
                Where your pattern breaks the most.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default React.memo(SummaryCards);