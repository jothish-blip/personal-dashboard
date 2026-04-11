"use client";

import React, { useMemo } from 'react';
import { FilteredData } from './utils';
import EmptyState from './EmptyState';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

interface ChartsGridProps {
  data: FilteredData;
  targetGoal: number;
  setTargetGoal: (val: number) => void;
}

export default function ChartsGrid({ data, targetGoal, setTargetGoal }: ChartsGridProps) {
  
  // 🚀 PART 2: Generate unique colors using Golden Angle distribution
  const dynamicColors = useMemo(() => {
    return data.labels.map((_, i) => {
      const hue = (i * 137.5) % 360; // Evenly spaced hues
      return `hsl(${hue}, 70%, 60%)`;
    });
  }, [data.labels]);

  // 🧠 Sorting logic for the legend (Most focused tasks first)
  const sortedLegendData = useMemo(() => {
    const total = data.taskTotals.reduce((a, b) => a + b, 0);
    return data.labels.map((label, i) => ({
      label,
      value: data.taskTotals[i],
      color: dynamicColors[i],
      percent: total > 0 ? Math.round((data.taskTotals[i] / total) * 100) : 0
    })).sort((a, b) => b.value - a.value);
  }, [data, dynamicColors]);

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { 
      legend: { display: false }, 
      tooltip: { 
        backgroundColor: '#fff', 
        titleColor: '#000', 
        bodyColor: '#666', 
        borderColor: '#e5e7eb', 
        borderWidth: 1,
        padding: 12,
        boxPadding: 6
      } 
    },
    scales: { 
      y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { color: '#9ca3af', font: { size: 10, weight: 700 } } }, 
      x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 10, weight: 700 } } } 
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* BAR CHART: Intensity */}
      <div className="bg-white border border-gray-200 p-6 rounded-[20px] shadow-sm min-h-[380px] flex flex-col">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Objective Intensity</h4>
        {data.stats.totalCompletions > 0 ? (
          <div className="flex-1 relative">
            <Bar 
              data={{ 
                labels: data.labels, 
                datasets: [{ 
                  backgroundColor: data.taskTotals.map((v, i) => v === Math.max(...data.taskTotals) ? '#16a34a' : dynamicColors[i]),
                  borderRadius: 6, data: data.taskTotals 
                }] 
              }} 
              options={chartOptions as any} 
            />
          </div>
        ) : <EmptyState />}
      </div>

      {/* DOUGHNUT: Focus Split with Scrollable Legend */}
      <div className="bg-white border border-gray-200 p-6 rounded-[20px] shadow-sm min-h-[420px] flex flex-col transition-all hover:border-gray-300">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Focus Distribution</h4>
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
                  ...chartOptions, 
                  scales: {}, 
                  plugins: { ...chartOptions.plugins, legend: { display: false }}} as any} 
              />
            </div>

            {/* 🚀 PART 1: CUSTOM SCROLLABLE LEGEND */}
            <div className="mt-6 flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar max-h-[160px]">
              {sortedLegendData.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-xs text-gray-600 font-bold group-hover:text-gray-900">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-black text-gray-400 uppercase">{item.percent}%</span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : <EmptyState />}
      </div>

      {/* LINE CHART: Activity Pulse */}
      <div className="bg-white border border-gray-200 p-6 rounded-[20px] shadow-sm min-h-[380px] flex flex-col lg:col-span-2">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Daily Output (Tasks Completed)</h4>
        {data.stats.totalCompletions > 0 ? (
          <div className="flex-1 relative">
            <Line 
              data={{ 
                labels: data.timelineLabels, 
                datasets: [{ 
                  borderColor: '#f97316', borderWidth: 3, pointRadius: 0, pointHoverRadius: 6, pointBackgroundColor: '#f97316',
                  tension: 0.4, data: data.volumeData, fill: true, 
                  backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(249, 115, 22, 0.15)');
                    gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
                    return gradient;
                  } 
                }] 
              }} 
              options={chartOptions as any} 
            />
          </div>
        ) : <EmptyState />}
      </div>

      {/* LINE CHART: Consistency Trend */}
      <div className="bg-white border border-gray-200 p-6 rounded-[20px] shadow-sm min-h-[340px] flex flex-col">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Consistency Trend (%)</h4>
        {data.stats.totalCompletions > 0 ? (
          <div className="flex-1 relative">
            <Line 
              data={{
                labels: data.timelineLabels,
                datasets: [{
                  data: data.consistencyTrend, borderColor: '#16a34a',
                  tension: 0.4, fill: true, pointRadius: 0, borderWidth: 3,
                  backgroundColor: (context: any) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return 'rgba(22, 163, 74, 0.1)';
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
                    gradient.addColorStop(0.4, 'rgba(249, 115, 22, 0.25)');
                    gradient.addColorStop(0.7, 'rgba(22, 163, 74, 0.25)');
                    return gradient;
                  }
                }]
              }}
              options={{...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 100 } }} as any}
            />
          </div>
        ) : <EmptyState />}
      </div>

      {/* BAR CHART: Weekly Performance */}
      <div className="bg-white border border-gray-200 p-6 rounded-[20px] shadow-sm min-h-[340px] flex flex-col">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Weekly Performance</h4>
        {data.weeklyPerformance.values.length > 0 && Math.max(...data.weeklyPerformance.values) > 0 ? (
          <div className="flex-1 relative">
            <Bar 
              data={{
                labels: data.weeklyPerformance.labels,
                datasets: [{
                  data: data.weeklyPerformance.values,
                  backgroundColor: data.weeklyPerformance.values.map(v => v === Math.max(...data.weeklyPerformance.values) ? '#16a34a' : '#fdba74'),
                  borderRadius: 8
                }]
              }}
              options={chartOptions as any}
            />
          </div>
        ) : <EmptyState />}
      </div>

      {/* LINE CHART: Goal vs Actual (Cumulative) */}
      <div className="bg-white border border-gray-200 p-6 rounded-[20px] shadow-sm min-h-[380px] flex flex-col lg:col-span-2">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cumulative Goal Tracking</h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Target:</span>
            <input type="number" value={targetGoal} onChange={(e) => setTargetGoal(Number(e.target.value))} className="w-16 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs font-bold outline-none text-center text-gray-700 focus:border-green-500" />
          </div>
        </div>
        {data.stats.totalCompletions > 0 ? (
          <div className="flex-1 relative">
            <Line 
              data={{
                labels: data.timelineLabels,
                datasets: [
                  { label: 'Actual Volume', data: data.cumulativeActual, borderColor: '#16a34a', backgroundColor: 'transparent', borderWidth: 3, tension: 0.1, pointRadius: 0 },
                  { label: 'Target Pace', data: data.cumulativeTarget, borderColor: '#9ca3af', borderDash: [5, 5], borderWidth: 2, tension: 0, pointRadius: 0, fill: false }
                ]
              }}
              options={{...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: true, position: 'top', labels: { font: { size: 10, weight: 'bold' }, color: '#9ca3af', boxWidth: 16 } } }} as any}
            />
          </div>
        ) : <EmptyState />}
      </div>
    </div>
  );
}