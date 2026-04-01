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

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

type FilterType = 'month' | 'year' | 'custom';

export default function AnalyticsView({ tasks, meta }: { tasks: Task[], meta: Meta }) {
  // --- Local State for Filtering ---
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [selectedMonth, setSelectedMonth] = useState(meta.currentMonth); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString()); // YYYY
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  // --- Theme Styling ---
  const textColor = '#374151';
  const gridColor = '#e5e7eb';
  const tooltipBg = 'rgba(255,255,255,0.9)';
  const tooltipText = '#000';

  // --- Logic to get date range ---
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
      start = customRange.start ? new Date(customRange.start) : new Date(0);
      end = customRange.end ? new Date(customRange.end) : new Date();
    }

    // Generate date strings within range
    const rangeDates: string[] = [];
    const curr = new Date(start);
    while (curr <= end) {
      rangeDates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    // Calculate totals per task for Bar/Pie
    const taskTotals = tasks.map(t => {
      return rangeDates.reduce((acc, date) => acc + (t.history[date] ? 1 : 0), 0);
    });

    // Calculate daily volume for Line Chart
    const dailyVolume = rangeDates.map(date => {
      return tasks.filter(t => t.history[date]).length;
    });

    return {
      labels: tasks.map(t => t.name),
      taskTotals,
      dailyVolume,
      timelineLabels: rangeDates.map(d => d.slice(5)) // MM-DD for readability
    };
  }, [tasks, filterType, selectedMonth, selectedYear, customRange]);

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { 
      legend: { display: false },
      tooltip: { backgroundColor: tooltipBg, titleColor: tooltipText, bodyColor: tooltipText, borderColor: gridColor, borderWidth: 1 }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
      x: { grid: { display: false }, ticks: { color: textColor } }
    }
  };

  const pieOptions = {
    ...chartOptions,
    scales: {}, 
    plugins: { 
      ...chartOptions.plugins,
      legend: { display: true, position: 'right' as const, labels: { color: textColor } } 
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 bg-gray-50 transition-colors">
      {/* FILTER BAR */}
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(['month', 'year', 'custom'] as FilterType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                filterType === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {filterType === 'month' && (
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 ring-blue-500/20"
          />
        )}

        {filterType === 'year' && (
          <input 
            type="number" 
            min="2000" 
            max="2099"
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 ring-blue-500/20"
          />
        )}

        {filterType === 'custom' && (
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={customRange.start} 
              onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 ring-blue-500/20"
            />
            <span className="text-gray-400">to</span>
            <input 
              type="date" 
              value={customRange.end} 
              onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 ring-blue-500/20"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 shadow-sm p-5 rounded-xl min-h-[380px] flex flex-col transition-colors">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Completion by Task</h4>
          <div className="flex-1 relative">
            <Bar 
              data={{ 
                labels: filteredData.labels, 
                datasets: [{ backgroundColor: '#3b82f6', borderRadius: 6, data: filteredData.taskTotals }] 
              }} 
              options={chartOptions} 
            />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 shadow-sm p-5 rounded-xl min-h-[380px] flex flex-col transition-colors">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Volume Distribution</h4>
          <div className="flex-1 relative">
            <Doughnut 
              data={{ 
                labels: filteredData.labels, 
                datasets: [{ 
                  backgroundColor: ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7'], 
                  data: filteredData.taskTotals, 
                  borderColor: '#fff', 
                  borderWidth: 2 
                }] 
              }} 
              options={pieOptions} 
            />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 shadow-sm p-5 rounded-xl min-h-[380px] flex flex-col md:col-span-2 transition-colors">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Activity Pulse Trend</h4>
          <div className="flex-1 relative">
            <Line 
              data={{ 
                labels: filteredData.timelineLabels, 
                datasets: [{ 
                  borderColor: '#22c55e', 
                  tension: 0.4, 
                  data: filteredData.dailyVolume, 
                  fill: true, 
                  backgroundColor: 'rgba(34,197,94,0.05)' 
                }] 
              }} 
              options={chartOptions} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}