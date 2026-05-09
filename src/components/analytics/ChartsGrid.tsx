"use client";

import React, { useMemo } from 'react';
import { FilteredData } from './utils'; // Adjust path if needed
import EmptyState from './EmptyState'; // Adjust path if needed
import { useTheme } from "@/theme/ThemeProvider"; // 🔥 Consuming theme state
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

// Extended to include dailyDeltas passed from AnalyticsView
interface ExtendedFilteredData extends FilteredData {
  dailyDeltas: number[];
}

interface ChartsGridProps {
  data: ExtendedFilteredData;
  targetGoal: number;
  setTargetGoal: (val: number) => void;
}

export default function ChartsGrid({ data, targetGoal, setTargetGoal }: ChartsGridProps) {
  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state
  
  // Golden Angle distribution for category/task specific charts
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

  // --- BASE CHART OPTIONS (Dynamic for Dark Mode) ---
  const baseChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { 
      legend: { display: false }, 
      tooltip: { 
        backgroundColor: isDarkMode ? '#111111' : '#fff', 
        titleColor: isDarkMode ? '#ffffff' : '#000', 
        bodyColor: isDarkMode ? '#a1a1aa' : '#666', 
        borderColor: isDarkMode ? '#374151' : '#e5e7eb', 
        borderWidth: 1,
        padding: 12,
        boxPadding: 6
      } 
    },
    scales: { 
      y: { 
        beginAtZero: true, 
        grid: { color: isDarkMode ? '#1f2937' : '#f3f4f6' }, 
        ticks: { color: isDarkMode ? '#6b7280' : '#9ca3af', font: { size: 10, weight: 700 } } 
      }, 
      x: { 
        grid: { display: false }, 
        ticks: { color: isDarkMode ? '#6b7280' : '#9ca3af', font: { size: 10, weight: 700 } } 
      } 
    }
  };

  // --- DELTA CHART OPTIONS (Includes Zero Line & Custom Tooltips) ---
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
            ? (isDarkMode ? '#ffffff' : '#000000') // Hard zero line
            : (isDarkMode ? '#1f2937' : '#f3f4f6'), 
        },
        ticks: { color: isDarkMode ? '#6b7280' : '#9ca3af', font: { size: 10, weight: 700 } }
      }
    }
  };

  // Shared container class to reduce repetition
  const cardClass = `border p-6 rounded-[20px] shadow-sm flex flex-col transition-colors ${
    isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
  }`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* BAR CHART: Objective Intensity */}
      <div className={`${cardClass} min-h-[380px]`}>
        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          Objective Intensity
        </h4>
        {data.stats.totalCompletions > 0 ? (
          <div className="flex-1 relative">
            <Bar 
              data={{ 
                labels: data.labels, 
                datasets: [{ 
                  backgroundColor: data.taskTotals.map((v, i) => v === Math.max(...data.taskTotals) ? '#16a34a' : dynamicColors[i]),
                  borderRadius: 6, 
                  data: data.taskTotals 
                }] 
              }} 
              options={baseChartOptions as any} 
            />
          </div>
        ) : <EmptyState />}
      </div>

      {/* DOUGHNUT: Focus Split with Scrollable Legend */}
      <div className={`${cardClass} min-h-[420px] hover:border-gray-300`}>
        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          Focus Distribution
        </h4>
        {data.stats.totalCompletions > 0 ? (
          <>
            <div className="h-48 relative">
              <Doughnut 
                data={{ 
                  labels: data.labels, 
                  datasets: [{ 
                    backgroundColor: dynamicColors, 
                    data: data.taskTotals, borderWidth: 0, hoverOffset: 12
                  }] 
                }} 
                options={{ 
                  ...baseChartOptions, 
                  scales: {}, 
                  plugins: { ...baseChartOptions.plugins, legend: { display: false }}
                } as any} 
              />
            </div>

            <div className="mt-6 flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar max-h-[160px]">
              {sortedLegendData.map((item, i) => (
                <div key={i} className={`flex items-center justify-between p-2 rounded-lg transition-colors group ${
                  isDarkMode ? "hover:bg-[#1a1a1a]" : "hover:bg-gray-50"
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className={`truncate text-xs font-bold ${
                      isDarkMode ? "text-gray-400 group-hover:text-gray-200" : "text-gray-600 group-hover:text-gray-900"
                    }`}>
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-black text-gray-400 uppercase">{item.percent}%</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-500"
                    }`}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : <EmptyState />}
      </div>

      {/* 🔥 LINE CHART: Daily Output (DELTA DRIVEN) */}
      <div className={`${cardClass} min-h-[380px] lg:col-span-2`}>
        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          Daily Output (Net Momentum)
        </h4>
        {data.stats.totalCompletions > 0 && data.dailyDeltas ? (
          <div className="flex-1 relative">
            <Line 
              data={{ 
                labels: data.timelineLabels, 
                datasets: [{ 
                  data: data.dailyDeltas,
                  borderWidth: 2, 
                  pointRadius: 0, 
                  pointHoverRadius: 6,
                  tension: 0.4,
                  fill: false,
                  // Dynamic segment coloring for the line
                  segment: {
                    borderColor: (ctx: any) => ctx.p1.parsed.y >= 0 ? '#16a34a' : '#ef4444'
                  },
                  // Dynamic point coloring for hover
                  pointBackgroundColor: (ctx: any) => {
                    const value = ctx.raw;
                    return value >= 0 ? '#16a34a' : '#ef4444';
                  }
                }] 
              }} 
              options={deltaChartOptions as any} 
            />
          </div>
        ) : <EmptyState />}
      </div>

      {/* 🔥 LINE CHART: Consistency Trend */}
      <div className={`${cardClass} min-h-[340px]`}>
        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          Consistency Trend (%)
        </h4>
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
                  borderWidth: 3,
                  segment: {
                    // Green if consistency is solid (>= 60), red if dropping
                    borderColor: (ctx: any) => ctx.p1.parsed.y >= 60 ? '#16a34a' : '#ef4444'
                  }
                }]
              }}
              options={{...baseChartOptions, scales: { ...baseChartOptions.scales, y: { ...baseChartOptions.scales.y, max: 100 } }} as any}
            />
          </div>
        ) : <EmptyState />}
      </div>

      {/* 🔥 BAR CHART: Weekly Performance (Week-over-Week Comparison) */}
      <div className={`${cardClass} min-h-[340px]`}>
        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          Weekly Growth Tracker
        </h4>
        {data.weeklyPerformance.values.length > 0 && Math.max(...data.weeklyPerformance.values) > 0 ? (
          <div className="flex-1 relative">
            <Bar 
              data={{
                labels: data.weeklyPerformance.labels,
                datasets: [{
                  data: data.weeklyPerformance.values,
                  backgroundColor: data.weeklyPerformance.values.map((v, i, arr) => {
                    const prev = arr[i - 1] || 0;
                    return v >= prev ? '#16a34a' : '#ef4444';
                  }),
                  borderRadius: 8
                }]
              }}
              options={baseChartOptions as any}
            />
          </div>
        ) : <EmptyState />}
      </div>

      {/* LINE CHART: Goal vs Actual (Cumulative) */}
      <div className={`${cardClass} min-h-[380px] lg:col-span-2`}>
        <div className="flex justify-between items-center mb-6">
          <h4 className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            Cumulative Goal Tracking
          </h4>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Target:</span>
            <input 
              type="number" 
              value={targetGoal} 
              onChange={(e) => setTargetGoal(Number(e.target.value))} 
              className={`w-16 border rounded px-2 py-1 text-xs font-bold outline-none text-center transition-all ${
                isDarkMode 
                  ? "bg-[#1a1a1a] border-gray-700 text-gray-200 focus:border-gray-500 focus:bg-[#222222]" 
                  : "bg-gray-50 border-gray-200 text-gray-700 focus:border-green-500 focus:bg-white"
              }`} 
            />
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
                    data: data.cumulativeActual, 
                    borderColor: '#16a34a', 
                    backgroundColor: 'transparent', 
                    borderWidth: 3, 
                    tension: 0.1, 
                    pointRadius: 0 
                  },
                  { 
                    label: 'Target Pace', 
                    data: data.cumulativeTarget, 
                    borderColor: isDarkMode ? '#4b5563' : '#9ca3af', 
                    borderDash: [5, 5], 
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
                    labels: { font: { size: 10, weight: 'bold' }, color: isDarkMode ? '#9ca3af' : '#9ca3af', boxWidth: 16 } 
                  } 
                } 
              } as any}
            />
          </div>
        ) : <EmptyState />}
      </div>
    </div>
  );
}