"use client";

import React, { useMemo, useState } from 'react';
import { FilteredData } from "../../utils";
import { useTheme } from "@/theme/ThemeProvider";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

interface ExtendedFilteredData extends FilteredData {
  dailyDeltas: number[];
}

interface ChartsGridProps {
  data: ExtendedFilteredData;
  targetGoal: number;
  setTargetGoal: (val: number) => void;
}

export default function ChartsGrid({ data, targetGoal, setTargetGoal }: ChartsGridProps) {
  const { isDarkMode } = useTheme(); 
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [showMoreMobile, setShowMoreMobile] = useState(false);
  
  const dynamicColors = useMemo(() => {
    return data.labels.map((_, i) => {
      const hue = (i * 137.5) % 360; 
      return `hsl(${hue}, 70%, 60%)`;
    });
  }, [data.labels]);

  const sortedLegendData = useMemo(() => {
    const total = data.taskTotals.reduce((a, b) => a + b, 0);
    return data.labels.map((label, i) => ({
      label,
      value: data.taskTotals[i],
      color: dynamicColors[i],
      percent: total > 0 ? Math.round((data.taskTotals[i] / total) * 100) : 0
    })).sort((a, b) => b.value - a.value);
  }, [data, dynamicColors]);

  const { cumulativeActual, cappedTarget, isWinning } = useMemo(() => {
    const timelineLabels = data.timelineLabels || [];
    const timelineLength = timelineLabels.length;
    
    const safeGoal = Math.max(targetGoal || 1, 1);
    const dailyTarget = timelineLength > 0 ? safeGoal / timelineLength : 0;

    const actual = data.cumulativeActual || [];
    const target = timelineLabels.map((_, i) => Math.round((i + 1) * dailyTarget));
    const capped = target.map((v) => Math.min(v, safeGoal));

    const lastActual = actual.length > 0 ? actual[actual.length - 1] : 0;
    const lastTarget = capped.length > 0 ? capped[capped.length - 1] : 0;
    const winning = lastActual >= lastTarget;

    return { 
      cumulativeActual: actual, 
      cappedTarget: capped, 
      isWinning: winning 
    };
  }, [data.timelineLabels, data.cumulativeActual, targetGoal]);

  const baseChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { 
      legend: { display: false }, 
      tooltip: { 
        backgroundColor: isDarkMode ? '#050505' : '#ffffff', 
        titleColor: isDarkMode ? '#ffffff' : '#111827', 
        bodyColor: isDarkMode ? '#a1a1aa' : '#4b5563', 
        borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', 
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        titleFont: { weight: 500 },
        bodyFont: { weight: 500 }
      } 
    },
    scales: { 
      y: { 
        beginAtZero: true, 
        grid: { color: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }, 
        ticks: { color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', font: { size: 10, weight: 500 } } 
      }, 
      x: { 
        grid: { display: false }, 
        ticks: { color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', font: { size: 10, weight: 500 } } 
      } 
    }
  };

  const deltaChartOptions = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.raw;
            if (val > 0) return `+${val} Increased`;
            if (val < 0) return `${val} Decreased`;
            return `0 No Change`;
          }
        }
      }
    },
    scales: {
      ...baseChartOptions.scales,
      y: {
        beginAtZero: true,
        grid: {
          color: (ctx: any) => ctx.tick.value === 0 
            ? (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') 
            : (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'), 
        },
        ticks: { color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', font: { size: 10, weight: 500 } }
      }
    }
  };

  // The true floating black card base
  const cardClass = `border p-5 rounded-[1.7rem] flex flex-col transition-all duration-200 ${
    isDarkMode 
      ? "bg-black/[0.72] border-white/[0.05] backdrop-blur-[24px] shadow-[0_14px_40px_rgba(0,0,0,0.18)] hover:bg-black/[0.75]" 
      : "bg-white/[0.75] border-black/[0.04] backdrop-blur-[24px] shadow-[0_14px_40px_rgba(0,0,0,0.06)] hover:bg-white"
  }`;

  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
      <p className={`text-sm font-medium ${isDarkMode ? "text-white/55" : "text-slate-500"}`}>No execution data yet.</p>
      <p className={`text-xs font-medium mt-1 ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>Complete tasks to unlock analytics.</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 md:gap-6 font-sans">
      
      {/* Top Priority Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        
        {/* Cumulative Goal Tracking */}
        <div className={`${cardClass} min-h-[380px]`}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <h3 className={`text-[14px] font-medium tracking-[-0.02em] ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Cumulative Goal Tracking
              </h3>
              {data.stats.totalCompletions > 0 && (
                <p className={`text-[11px] font-medium mt-1 ${isDarkMode ? "text-white/55" : "text-slate-500"}`}>
                  {data.stats.totalCompletions} / {targetGoal} completed &middot; {Math.max(0, targetGoal - data.stats.totalCompletions)} remaining
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isEditingGoal ? (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-[1rem] border transition-all ${
                  isDarkMode ? "bg-white/[0.04] border-white/[0.04]" : "bg-black/[0.03] border-black/[0.05]"
                }`}>
                  <span className={`text-[11px] font-medium ${isDarkMode ? "text-white/55" : "text-slate-500"}`}>Goal:</span>
                  <input 
                    type="number"
                    autoFocus
                    value={targetGoal} 
                    onChange={(e) => setTargetGoal(Number(e.target.value))} 
                    onBlur={() => setIsEditingGoal(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingGoal(false)}
                    className={`w-12 bg-transparent text-[11px] font-medium outline-none text-center ${isDarkMode ? "text-white" : "text-slate-900"}`} 
                  />
                  <span className={`text-[11px] font-medium ${isDarkMode ? "text-white/55" : "text-slate-500"}`}>/ period</span>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditingGoal(true)}
                  className={`px-4 py-1.5 rounded-[1rem] border text-[11px] font-medium transition-all ${
                    isDarkMode 
                      ? "bg-white/[0.04] border-white/[0.04] text-white hover:bg-white/[0.06]" 
                      : "bg-black/[0.03] border-black/[0.05] text-slate-700 hover:bg-black/[0.05]"
                  }`}
                >
                  Goal: {targetGoal} / period
                </button>
              )}
            </div>
          </div>
          {data.stats.totalCompletions > 0 ? (
            <div className="flex-1 relative">
              <Line 
                data={{
                  labels: data.timelineLabels,
                  datasets: [
                    { 
                      label: 'Actual Volume', 
                      data: cumulativeActual, 
                      borderColor: isWinning ? '#10b981' : '#f97316', 
                      backgroundColor: isWinning ? 'rgba(16, 185, 129, 0.08)' : 'rgba(249, 115, 22, 0.08)', 
                      borderWidth: 3, 
                      tension: 0.1, 
                      pointRadius: 0,
                      fill: true
                    },
                    { 
                      label: 'Target Pace', 
                      data: cappedTarget, 
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', 
                      borderDash: [6, 4], 
                      borderWidth: 2, 
                      tension: 0, 
                      pointRadius: 0, 
                      fill: false 
                    }
                  ]
                }}
                options={{
                  ...baseChartOptions, 
                  plugins: { 
                    ...baseChartOptions.plugins, 
                    legend: { 
                      display: true, 
                      position: 'top', 
                      labels: { font: { size: 10, weight: 500 }, color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', boxWidth: 12 } 
                    } 
                  } 
                } as any}
              />
            </div>
          ) : renderEmptyState()}
        </div>

        {/* Daily Output */}
        <div className={`${cardClass} min-h-[380px]`}>
          <h3 className={`text-[14px] font-medium tracking-[-0.02em] mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Daily Output (Net Momentum)
          </h3>
          {data.stats.totalCompletions > 0 && data.dailyDeltas ? (
            <div className="flex-1 relative">
              <Line 
                data={{ 
                  labels: data.timelineLabels, 
                  datasets: [{ 
                    data: data.dailyDeltas,
                    borderWidth: 2, 
                    pointRadius: 0, 
                    pointHoverRadius: 5,
                    tension: 0.4,
                    fill: false,
                    segment: {
                      borderColor: (ctx: any) => ctx.p1.parsed.y >= 0 ? '#10b981' : '#ef4444'
                    },
                    pointBackgroundColor: (ctx: any) => {
                      const value = ctx.raw;
                      return value >= 0 ? '#10b981' : '#ef4444';
                    }
                  }] 
                }} 
                options={deltaChartOptions as any} 
              />
            </div>
          ) : renderEmptyState()}
        </div>
      </div>

      {/* Mobile Collapse Toggle */}
      <div className="md:hidden flex justify-center mt-2 mb-2">
        <button 
          onClick={() => setShowMoreMobile(!showMoreMobile)}
          className={`text-[13px] font-medium px-6 py-2.5 rounded-[1rem] border transition-all ${
            isDarkMode 
              ? "bg-black/[0.72] border-white/[0.05] backdrop-blur-[20px] text-white" 
              : "bg-white border-black/[0.05] backdrop-blur-[20px] text-slate-700"
          }`}
        >
          {showMoreMobile ? "Hide Details" : "View More Analytics"}
        </button>
      </div>

      {/* Secondary & Tertiary Rows (Collapsible on Mobile) */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 ${showMoreMobile ? 'block' : 'hidden md:grid'}`}>
        
        {/* Consistency Trend */}
        <div className={`${cardClass} min-h-[340px]`}>
          <h3 className={`text-[14px] font-medium tracking-[-0.02em] mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Consistency Trend (%)
          </h3>
          {data.stats.totalCompletions > 0 ? (
            <div className="flex-1 relative">
              <Line 
                data={{
                  labels: data.timelineLabels,
                  datasets: [{
                    data: data.consistencyTrend, 
                    tension: 0.4, 
                    fill: false, 
                    pointRadius: 0, 
                    borderWidth: 2.5,
                    segment: {
                      borderColor: (ctx: any) => ctx.p1.parsed.y >= 60 ? '#10b981' : '#ef4444'
                    }
                  }]
                }}
                options={{...baseChartOptions, scales: { ...baseChartOptions.scales, y: { ...baseChartOptions.scales.y, max: 100 } }} as any}
              />
            </div>
          ) : renderEmptyState()}
        </div>

        {/* Weekly Growth Tracker */}
        <div className={`${cardClass} min-h-[340px]`}>
          <h3 className={`text-[14px] font-medium tracking-[-0.02em] mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Weekly Growth Tracker
          </h3>
          {data.weeklyPerformance.values.length > 0 && Math.max(...data.weeklyPerformance.values) > 0 ? (
            <div className="flex-1 relative">
              <Bar 
                data={{
                  labels: data.weeklyPerformance.labels,
                  datasets: [{
                    data: data.weeklyPerformance.values,
                    backgroundColor: data.weeklyPerformance.values.map((v, i, arr) => {
                      const prev = arr[i - 1] || 0;
                      return v >= prev ? '#10b981' : '#ef4444';
                    }),
                    borderRadius: 6
                  }]
                }}
                options={baseChartOptions as any}
              />
            </div>
          ) : renderEmptyState()}
        </div>

        {/* Focus Distribution */}
        <div className={`${cardClass} min-h-[420px]`}>
          <h3 className={`text-[14px] font-medium tracking-[-0.02em] mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Focus Distribution
          </h3>
          {data.stats.totalCompletions > 0 ? (
            <>
              <div className="h-48 relative">
                <Doughnut 
                  data={{ 
                    labels: data.labels, 
                    datasets: [{ 
                      backgroundColor: dynamicColors, 
                      data: data.taskTotals, 
                      borderWidth: 0, 
                      hoverOffset: 8
                    }] 
                  }} 
                  options={{ 
                    ...baseChartOptions, 
                    scales: {}, 
                    plugins: { ...baseChartOptions.plugins, legend: { display: false }}
                  } as any} 
                />
              </div>

              <div className="mt-6 flex-1 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar max-h-[160px]">
                {sortedLegendData.map((item, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded-lg transition-colors group ${
                    isDarkMode ? "hover:bg-white/[0.04]" : "hover:bg-black/[0.02]"
                  }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className={`truncate text-xs font-medium ${
                        isDarkMode ? "text-white/70 group-hover:text-white" : "text-slate-600 group-hover:text-slate-900"
                      }`}>
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-medium ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>
                        {item.percent}%
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        isDarkMode ? "bg-white/[0.05] text-white/80" : "bg-black/[0.04] text-slate-700"
                      }`}>
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : renderEmptyState()}
        </div>

        {/* Objective Intensity */}
        <div className={`${cardClass} min-h-[380px]`}>
          <h3 className={`text-[14px] font-medium tracking-[-0.02em] mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Objective Intensity
          </h3>
          {data.stats.totalCompletions > 0 ? (
            <div className="flex-1 relative">
              <Bar 
                data={{ 
                  labels: data.labels, 
                  datasets: [{ 
                    backgroundColor: data.taskTotals.map((v, i) => v === Math.max(...data.taskTotals) ? '#f97316' : dynamicColors[i]),
                    borderRadius: 4, 
                    data: data.taskTotals 
                  }] 
                }} 
                options={baseChartOptions as any} 
              />
            </div>
          ) : renderEmptyState()}
        </div>

      </div>
    </div>
  );
}