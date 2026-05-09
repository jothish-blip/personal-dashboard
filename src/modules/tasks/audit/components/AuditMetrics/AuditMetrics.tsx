"use client";

import React from 'react';
import { Zap, Activity, Clock, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTheme } from "@/theme/ThemeProvider";
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
  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state

  // Efficiency Helpers
  const getTrendColor = (delta: number) => {
    if (delta > 0) return isDarkMode ? "text-emerald-400" : "text-green-600";
    if (delta < 0) return isDarkMode ? "text-red-400" : "text-red-500";
    return isDarkMode ? "text-gray-500" : "text-gray-400";
  };

  const getBgTrend = (delta: number) => {
    if (delta > 0) return isDarkMode ? "bg-emerald-950/30 text-emerald-400" : "bg-green-50 text-green-600";
    if (delta < 0) return isDarkMode ? "bg-red-950/30 text-red-400" : "bg-red-50 text-red-600";
    return isDarkMode ? "bg-gray-800 text-gray-400" : "bg-gray-50 text-gray-500";
  };

  // Stability Helpers (Inverted: Decrease is Good)
  const getInstabilityColor = (delta: number) => {
    if (delta < 0) return isDarkMode ? "text-emerald-400" : "text-green-600"; // improving
    if (delta > 0) return isDarkMode ? "text-red-400" : "text-red-500";   // worsening
    return isDarkMode ? "text-gray-500" : "text-gray-400";
  };

  const getInstabilityBg = (delta: number) => {
    if (delta < 0) return isDarkMode ? "bg-emerald-950/30 text-emerald-400" : "bg-green-50 text-green-600";
    if (delta > 0) return isDarkMode ? "bg-red-950/30 text-red-400" : "bg-red-50 text-red-600";
    return isDarkMode ? "bg-gray-800 text-gray-400" : "bg-gray-50 text-gray-500";
  };

  // Base card styling
  const cardClass = `border rounded-[20px] p-6 shadow-sm flex flex-col transition-colors duration-300 ${
    isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
  }`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. EFFICIENCY CARD */}
      <div className={cardClass}>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-xl transition-colors duration-500 ${getBgTrend(focusDelta)}`}>
            <Zap size={16} />
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              Efficiency {focusDelta > 0 ? <TrendingUp size={10} /> : focusDelta < 0 ? <TrendingDown size={10} /> : null}
            </span>
          </div>
        </div>
        <h4 className={`text-3xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>{focusScore}%</h4>
        <div className={`text-[11px] font-bold mt-1 flex items-center gap-1 ${getTrendColor(focusDelta)}`}>
          {focusDelta > 0 && `+${focusDelta}% Increased`}
          {focusDelta < 0 && `${focusDelta}% Decreased`}
          {focusDelta === 0 && <><Minus size={10}/> No Change</>}
        </div>
        <p className={`text-[10px] font-bold uppercase mt-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Focus Score</p>
      </div>

      {/* 2. STABILITY CARD (Logic Inverted) */}
      <div className={cardClass}>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-xl transition-colors duration-500 ${getInstabilityBg(instabilityDelta)}`}>
            <Activity size={16} />
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              Stability {instabilityDelta < 0 ? <TrendingUp size={10} className={isDarkMode ? "text-emerald-500" : "text-green-500"} /> : instabilityDelta > 0 ? <TrendingDown size={10} className={isDarkMode ? "text-red-500" : "text-red-500"} /> : null}
            </span>
          </div>
        </div>
        <h4 className={`text-3xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>{instabilityIndex}%</h4>
        <div className={`text-[11px] font-bold mt-1 flex items-center gap-1 ${getInstabilityColor(instabilityDelta)}`}>
          {instabilityDelta > 0 && `+${instabilityDelta}% Worsened`}
          {instabilityDelta < 0 && `${instabilityDelta}% Improved`}
          {instabilityDelta === 0 && <><Minus size={10}/> Stable</>}
        </div>
        <p className={`text-[10px] font-bold uppercase mt-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Volatility Index</p>
      </div>

      {/* 3. PEAK TIME CARD */}
      <div className={cardClass}>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-xl ${isDarkMode ? "bg-orange-950/30 text-orange-400" : "bg-orange-50 text-orange-500"}`}>
            <Clock size={16} />
          </div>
          <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Peak Time</span>
        </div>
        <h4 className={`text-3xl font-black uppercase ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          {peakHour !== null ? `${peakHour}:00` : '--'}
        </h4>
        <p className={`text-[11px] font-bold mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          {peakHour !== null
            ? peakHour < 12
              ? "Morning Execution Peak"
              : peakHour < 18
              ? "Afternoon Execution Peak"
              : "Evening Execution Peak"
            : "No recorded activity"}
        </p>
        <p className={`text-[10px] font-bold uppercase mt-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Most Active Hour</p>
      </div>

      {/* 4. TOP TASKS CARD */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
          <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Top Objectives</h3>
        </div>
        <div className="space-y-2 flex-1">
          {topTasks.map(([name, count], i) => (
            <div key={name} className="flex justify-between items-center text-[13px]">
              <span className={`flex items-center gap-2 font-bold truncate max-w-[130px] ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                <span className={`text-[10px] font-black ${isDarkMode ? "text-gray-600" : "text-gray-300"}`}>0{i + 1}</span>
                {name}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isDarkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                {count}
              </span>
            </div>
          ))}
          {topTasks.length === 0 && (
            <span className={`text-xs font-medium ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>Insufficient Data</span>
          )}
        </div>
      </div>

    </div>
  );
}