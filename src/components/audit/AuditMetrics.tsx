"use client";

import React from 'react';
import { Zap, Activity, Clock, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AuditMetricsProps {
  focusScore: number;
  focusDelta: number; // 🔥 Today vs Yesterday
  instabilityIndex: number;
  instabilityDelta: number; // 🔥 Change in churn
  peakHour: number | null;
  topTasks: [string, number][];
}

export default function AuditMetrics({ 
  focusScore, 
  focusDelta, 
  instabilityIndex, 
  instabilityDelta, 
  peakHour, 
  topTasks 
}: AuditMetricsProps) {

  // Efficiency Helpers
  const getTrendColor = (delta: number) => {
    if (delta > 0) return "text-green-600";
    if (delta < 0) return "text-red-500";
    return "text-gray-400";
  };

  const getBgTrend = (delta: number) => {
    if (delta > 0) return "bg-green-50 text-green-600";
    if (delta < 0) return "bg-red-50 text-red-600";
    return "bg-gray-50 text-gray-500";
  };

  // Stability Helpers (Inverted: Decrease is Good)
  const getInstabilityColor = (delta: number) => {
    if (delta < 0) return "text-green-600"; // improving
    if (delta > 0) return "text-red-500";   // worsening
    return "text-gray-400";
  };

  const getInstabilityBg = (delta: number) => {
    if (delta < 0) return "bg-green-50 text-green-600";
    if (delta > 0) return "bg-red-50 text-red-600";
    return "bg-gray-50 text-gray-500";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. EFFICIENCY CARD */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-xl transition-colors duration-500 ${getBgTrend(focusDelta)}`}>
            <Zap size={16} />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              Efficiency {focusDelta > 0 ? <TrendingUp size={10} /> : focusDelta < 0 ? <TrendingDown size={10} /> : null}
            </span>
          </div>
        </div>
        <h4 className="text-3xl font-black text-gray-900">{focusScore}%</h4>
        <div className={`text-[11px] font-bold mt-1 flex items-center gap-1 ${getTrendColor(focusDelta)}`}>
          {focusDelta > 0 && `+${focusDelta}% Increased`}
          {focusDelta < 0 && `${focusDelta}% Decreased`}
          {focusDelta === 0 && <><Minus size={10}/> No Change</>}
        </div>
        <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Focus Score</p>
      </div>

      {/* 2. STABILITY CARD (Logic Inverted) */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-xl transition-colors duration-500 ${getInstabilityBg(instabilityDelta)}`}>
            <Activity size={16} />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              Stability {instabilityDelta < 0 ? <TrendingUp size={10} className="text-green-500" /> : instabilityDelta > 0 ? <TrendingDown size={10} className="text-red-500" /> : null}
            </span>
          </div>
        </div>
        <h4 className="text-3xl font-black text-gray-900">{instabilityIndex}%</h4>
        <div className={`text-[11px] font-bold mt-1 flex items-center gap-1 ${getInstabilityColor(instabilityDelta)}`}>
          {instabilityDelta > 0 && `+${instabilityDelta}% Worsened`}
          {instabilityDelta < 0 && `${instabilityDelta}% Improved`}
          {instabilityDelta === 0 && <><Minus size={10}/> Stable</>}
        </div>
        <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Volatility Index</p>
      </div>

      {/* 3. PEAK TIME CARD */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-orange-50 text-orange-500 rounded-xl"><Clock size={16} /></div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Peak Time</span>
        </div>
        <h4 className="text-3xl font-black text-gray-900 uppercase">
          {peakHour !== null ? `${peakHour}:00` : '--'}
        </h4>
        <p className="text-[11px] font-bold mt-1 text-gray-500">
          {peakHour !== null
            ? peakHour < 12
              ? "Morning Execution Peak"
              : peakHour < 18
              ? "Afternoon Execution Peak"
              : "Evening Execution Peak"
            : "No recorded activity"}
        </p>
        <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Most Active Hour</p>
      </div>

      {/* 4. TOP TASKS CARD */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-gray-400" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Top Objectives</h3>
        </div>
        <div className="space-y-2 flex-1">
          {topTasks.map(([name, count], i) => (
            <div key={name} className="flex justify-between items-center text-[13px]">
              <span className="flex items-center gap-2 font-bold text-gray-700 truncate max-w-[130px]">
                <span className="text-gray-300 text-[10px] font-black">0{i + 1}</span>
                {name}
              </span>
              <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-black text-gray-500">
                {count}
              </span>
            </div>
          ))}
          {topTasks.length === 0 && (
            <span className="text-xs text-gray-400 font-medium">Insufficient Data</span>
          )}
        </div>
      </div>

    </div>
  );
}