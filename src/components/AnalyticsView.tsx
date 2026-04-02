"use client";

import { useState, useMemo } from 'react';
import { Task, Meta } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { TrendingUp, CheckCircle2, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

type FilterType = 'month' | 'year' | 'custom';

export default function AnalyticsView({ tasks, meta }: { tasks: Task[], meta: Meta }) {
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [selectedMonth, setSelectedMonth] = useState(meta.currentMonth);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  // --- Logic: Advanced Temporal Aggregation ---
  const filteredData = useMemo(() => {
    let start: Date, end: Date;

    if (filterType === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      start = new Date(y, m - 1, 1);
      end = new Date(y, m, 0);
    } else if (filterType === 'year') {
      const y = parseInt(selectedYear);
      start = new Date(y, 0, 1);
      end = new Date(y, 11, 31);
    } else {
      start = customRange.start ? new Date(customRange.start) : new Date();
      end = customRange.end ? new Date(customRange.end) : new Date();
    }

    const rangeDates: string[] = [];
    const curr = new Date(start);
    while (curr <= end) {
      rangeDates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    // Task Totals (Bar/Pie)
    const taskTotals = tasks.map(t => 
      rangeDates.reduce((acc, date) => acc + (t.history[date] ? 1 : 0), 0)
    );

    // --- SMART TIMELINE AGGREGATION ---
    let timelineLabels: string[] = [];
    let volumeData: number[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    if (filterType === 'month') {
      // Show Day Numbers (1, 2, 3...)
      timelineLabels = rangeDates.map(d => d.slice(8));
      volumeData = rangeDates.map(date => tasks.filter(t => t.history[date]).length);
    } 
    else if (filterType === 'year') {
      // Group by Month (Jan, Feb...)
      const monthlyMap: Record<string, number> = {};
      
      rangeDates.forEach(date => {
        const mIdx = new Date(date).getMonth();
        const mKey = monthNames[mIdx];
        const count = tasks.filter(t => t.history[date]).length;
        monthlyMap[mKey] = (monthlyMap[mKey] || 0) + count;
      });

      timelineLabels = monthNames;
      volumeData = monthNames.map(m => monthlyMap[m] || 0);
    } 
    else {
      // Custom Range: Weekly if > 30 days
      if (rangeDates.length > 30) {
        const weeklyMap: Record<string, number> = {};
        rangeDates.forEach(date => {
          const d = new Date(date);
          const weekLabel = `W${Math.ceil(d.getDate() / 7)} ${monthNames[d.getMonth()]}`;
          const count = tasks.filter(t => t.history[date]).length;
          weeklyMap[weekLabel] = (weeklyMap[weekLabel] || 0) + count;
        });
        timelineLabels = Object.keys(weeklyMap);
        volumeData = Object.values(weeklyMap);
      } else {
        timelineLabels = rangeDates.map(d => d.slice(5));
        volumeData = rangeDates.map(date => tasks.filter(t => t.history[date]).length);
      }
    }

    const totalCompletions = taskTotals.reduce((a, b) => a + b, 0);
    const activeDays = volumeData.filter(v => v > 0).length;
    const peakVolume = Math.max(...(volumeData.length ? volumeData : [0]));

    return {
      labels: tasks.map(t => t.name),
      taskTotals,
      volumeData,
      timelineLabels,
      stats: { totalCompletions, activeDays, peakVolume }
    };
  }, [tasks, filterType, selectedMonth, selectedYear, customRange]);

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { 
      legend: { display: false },
      tooltip: { backgroundColor: '#fff', titleColor: '#000', bodyColor: '#666', borderColor: '#e5e7eb', borderWidth: 1 }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { color: '#9ca3af', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 10 } } }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#fcfcfc]">
      
      {/* 1. SMART FILTER BAR */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
          {(['month', 'year', 'custom'] as FilterType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                filterType === t ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {filterType === 'month' && <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 ring-blue-500/10" />}
          {filterType === 'year' && <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-28 outline-none" />}
          {filterType === 'custom' && (
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border">
              <input type="date" value={customRange.start} onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} className="bg-transparent text-xs p-1 outline-none" />
              <span className="text-gray-300">→</span>
              <input type="date" value={customRange.end} onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} className="bg-transparent text-xs p-1 outline-none" />
            </div>
          )}
        </div>
      </div>

      {/* 2. SUMMARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Done</p>
            <CheckCircle2 size={16} className="text-blue-500" />
          </div>
          <h3 className="text-3xl font-black text-gray-900">{filteredData.stats.totalCompletions}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Persistence</p>
            <CalendarIcon size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-3xl font-black text-gray-900">{filteredData.stats.activeDays} <span className="text-sm text-gray-400 font-medium">Days</span></h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Peak Velocity</p>
            <TrendingUp size={16} className="text-amber-500" />
          </div>
          <h3 className="text-3xl font-black text-gray-900">{filteredData.stats.peakVolume} <span className="text-sm text-gray-400 font-medium">Tasks</span></h3>
        </div>
      </div>

      {/* 3. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* BAR CHART: Highlight Top Task */}
        <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm min-h-[420px] flex flex-col">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Objective Intensity</h4>
          {filteredData.stats.totalCompletions > 0 ? (
            <div className="flex-1 relative">
              <Bar 
                data={{ 
                  labels: filteredData.labels, 
                  datasets: [{ 
                    backgroundColor: filteredData.taskTotals.map(v => v === Math.max(...filteredData.taskTotals) ? '#3b82f6' : '#e5e7eb'),
                    borderRadius: 12, 
                    data: filteredData.taskTotals 
                  }] 
                }} 
                options={chartOptions} 
              />
            </div>
          ) : <EmptyState />}
        </div>

        {/* DOUGHNUT: Distribution */}
        <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm min-h-[420px] flex flex-col">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Focus Split</h4>
          {filteredData.stats.totalCompletions > 0 ? (
            <div className="flex-1 relative">
              <Doughnut 
                data={{ 
                  labels: filteredData.labels, 
                  datasets: [{ 
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'], 
                    data: filteredData.taskTotals, 
                    borderWidth: 0,
                    hoverOffset: 20
                  }] 
                }} 
                options={{ ...chartOptions, scales: {}, plugins: { ...chartOptions.plugins, legend: { display: true, position: 'bottom' }}}} 
              />
            </div>
          ) : <EmptyState />}
        </div>

        {/* LINE CHART: Aggregated Pulse */}
        <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm min-h-[420px] flex flex-col lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {filterType === 'month' && "Daily Activity Pulse"}
              {filterType === 'year' && "Monthly Performance Trend"}
              {filterType === 'custom' && "Aggregated Activity Trend"}
            </h4>
          </div>
          {filteredData.stats.totalCompletions > 0 ? (
            <div className="flex-1 relative">
              <Line 
                data={{ 
                  labels: filteredData.timelineLabels, 
                  datasets: [{ 
                    borderColor: '#3b82f6', 
                    borderWidth: 4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    tension: 0.4, 
                    data: filteredData.volumeData, 
                    fill: true, 
                    backgroundColor: (context: any) => {
                      const ctx = context.chart.ctx;
                      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
                      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                      return gradient;
                    } 
                  }] 
                }} 
                options={chartOptions} 
              />
            </div>
          ) : <EmptyState />}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
      <AlertCircle size={40} className="text-gray-200 mb-4" />
      <p className="text-sm font-bold text-gray-400">No activity detected for this range</p>
      <p className="text-xs text-gray-300 mt-1">Try adjusting your filters or completing tasks.</p>
    </div>
  );
}