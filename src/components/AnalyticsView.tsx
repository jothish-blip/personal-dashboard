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
import { TrendingUp, TrendingDown, CheckCircle2, Calendar as CalendarIcon, AlertCircle, Activity, Clock, Target, AlertTriangle, Minus } from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

type FilterType = 'month' | 'year' | 'custom';

const getLocalDate = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
};

const getISODay = (date: Date) => {
  const day = date.getDay();
  return day === 0 ? 7 : day; 
};

export default function AnalyticsView({ tasks, meta }: { tasks: Task[], meta: Meta }) {
  const actualToday = getLocalDate(new Date());
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [selectedMonth, setSelectedMonth] = useState(meta.currentMonth);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [targetGoal, setTargetGoal] = useState<number>(100);

  // --- Logic: Advanced Temporal Aggregation ---
  const filteredData = useMemo(() => {
    let start: Date, end: Date;
    let prevStart: Date, prevEnd: Date;

    // Current Range Calculation
    if (filterType === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      start = new Date(y, m - 1, 1);
      end = new Date(y, m, 0);
      
      prevStart = new Date(y, m - 2, 1);
      prevEnd = new Date(y, m - 1, 0);
    } else if (filterType === 'year') {
      const y = parseInt(selectedYear);
      start = new Date(y, 0, 1);
      end = new Date(y, 11, 31);

      prevStart = new Date(y - 1, 0, 1);
      prevEnd = new Date(y - 1, 11, 31);
    } else {
      start = customRange.start ? new Date(customRange.start) : new Date();
      end = customRange.end ? new Date(customRange.end) : new Date();

      const duration = end.getTime() - start.getTime();
      prevStart = new Date(start.getTime() - duration - 86400000); // Shift back by duration + 1 day
      prevEnd = new Date(start.getTime() - 86400000);
    }

    const rangeDates: string[] = [];
    const curr = new Date(start);
    while (curr <= end) {
      rangeDates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    // Previous Range Execution for Delta Calculation
    const prevRangeDates: string[] = [];
    const pCurr = new Date(prevStart);
    while (pCurr <= prevEnd) {
      prevRangeDates.push(pCurr.toISOString().split('T')[0]);
      pCurr.setDate(pCurr.getDate() + 1);
    }

    let prevTotalCompletions = 0;
    tasks.forEach(t => {
      prevRangeDates.forEach(d => {
        if (t.history?.[d]) prevTotalCompletions++;
      });
    });

    const taskTotals = tasks.map(t => 
      rangeDates.reduce((acc, date) => acc + (t.history?.[date] ? 1 : 0), 0)
    );

    let timelineLabels: string[] = [];
    let volumeData: number[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const weekdayMisses = Array(7).fill(0);
    const weekdayTotals = Array(7).fill(0);
    let zeroCount = 0;

    const consistencyTrend: number[] = [];
    const weeklyPerformance: Record<string, number> = {};

    rangeDates.forEach(dateStr => {
      const d = new Date(dateStr);
      let dailyCount = 0;
      
      tasks.forEach(t => {
        if (t.history?.[dateStr]) dailyCount++;
      });

      if (dailyCount === 0) zeroCount++;

      // Weekly Data (Fixed alignment to month start day)
      const firstDayOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
      const weekNum = Math.ceil((d.getDate() + firstDayOfMonth) / 7);
      const weekLabel = `W${weekNum} ${monthNames[d.getMonth()]}`;
      
      weeklyPerformance[weekLabel] = (weeklyPerformance[weekLabel] || 0) + dailyCount;

      // Consistency Data
      consistencyTrend.push(tasks.length === 0 ? 0 : (dailyCount / tasks.length) * 100);

      // Insights Data
      const isoDay = getISODay(d) - 1; 
      weekdayTotals[isoDay] += tasks.length;
      weekdayMisses[isoDay] += (tasks.length - dailyCount);
    });

    if (filterType === 'month') {
      timelineLabels = rangeDates.map(d => d.slice(8));
      volumeData = rangeDates.map(date => tasks.filter(t => t.history?.[date]).length);
    } else if (filterType === 'year') {
      const monthlyMap: Record<string, number> = {};
      rangeDates.forEach(date => {
        const mIdx = new Date(date).getMonth();
        const mKey = monthNames[mIdx];
        const count = tasks.filter(t => t.history?.[date]).length;
        monthlyMap[mKey] = (monthlyMap[mKey] || 0) + count;
      });
      timelineLabels = monthNames;
      volumeData = monthNames.map(m => monthlyMap[m] || 0);
    } else {
      if (rangeDates.length > 30) {
        timelineLabels = Object.keys(weeklyPerformance);
        volumeData = Object.values(weeklyPerformance);
      } else {
        timelineLabels = rangeDates.map(d => d.slice(5));
        volumeData = rangeDates.map(date => tasks.filter(t => t.history?.[date]).length);
      }
    }

    const totalCompletions = taskTotals.reduce((a, b) => a + b, 0);
    const delta = totalCompletions - prevTotalCompletions;
    const activeDays = volumeData.filter(v => v > 0).length;
    
    // Peak Logic & Context
    const peakVolume = Math.max(...(volumeData.length ? volumeData : [0]));
    const peakIndex = volumeData.indexOf(peakVolume);
    const peakLabel = timelineLabels[peakIndex] || '';
    const peakText = filterType === 'year' ? `in ${peakLabel}` : `on ${peakLabel}`;
    
    const totalPossible = rangeDates.length * (tasks.length || 1);
    const consistencyPercent = totalPossible === 0 ? 0 : Math.round((totalCompletions / totalPossible) * 100);
    const avgPerDay = rangeDates.length ? Math.round((totalCompletions / rangeDates.length) * 10) / 10 : 0;

    let worstDayIdx = 0;
    let worstMissRate = 0;
    weekdayTotals.forEach((total, i) => {
      if (total > 0) {
        const missRate = weekdayMisses[i] / total;
        if (missRate > worstMissRate) { worstMissRate = missRate; worstDayIdx = i; }
      }
    });

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const worstDayInsight = worstMissRate > 0.4 
      ? `Slip pattern on ${dayNames[worstDayIdx]}s (${Math.round(worstMissRate * 100)}% miss rate)`
      : "Execution is evenly distributed";

    // Goal vs Actual Cumulative
    let cumulative = 0;
    const cumulativeActual = volumeData.map(v => { cumulative += v; return cumulative; });
    const cumulativeTarget = volumeData.map((_, i) => Math.round((targetGoal / volumeData.length) * (i + 1)));

    return {
      labels: tasks.map(t => t.name),
      taskTotals,
      volumeData,
      timelineLabels,
      consistencyTrend,
      weeklyPerformance: { labels: Object.keys(weeklyPerformance), values: Object.values(weeklyPerformance) },
      cumulativeActual,
      cumulativeTarget,
      stats: { 
        totalCompletions, delta, activeDays, peakVolume, peakText, 
        consistencyPercent, avgPerDay, worstDayInsight, zeroDays: zeroCount 
      }
    };
  }, [tasks, filterType, selectedMonth, selectedYear, customRange, targetGoal]);

  const momentum = useMemo(() => {
    const todayCount = tasks.filter(t => t.history?.[actualToday]).length;
    const d = new Date(actualToday);
    d.setDate(d.getDate() - 1);
    const yesterdayCount = tasks.filter(t => t.history?.[getLocalDate(d)]).length;
    return todayCount - yesterdayCount;
  }, [tasks, actualToday]);

  const anomaly = momentum < 0 && filteredData.stats.consistencyPercent < 50
    ? "Performance drop detected. Intervention required."
    : filteredData.stats.zeroDays > 2
    ? "Execution gaps increasing. Chain is breaking."
    : null;

  const loadLevel = filteredData.stats.avgPerDay > tasks.length * 0.7 ? "High" :
                    filteredData.stats.avgPerDay > tasks.length * 0.4 ? "Moderate" : "Low";

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#fff', titleColor: '#000', bodyColor: '#666', borderColor: '#e5e7eb', borderWidth: 1 } },
    scales: { y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { color: '#9ca3af', font: { size: 10, weight: 700 } } }, x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 10, weight: 700 } } } }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F9FAFB]">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6 pb-24">
        
        {/* 1. SYSTEM STATUS BAR */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full shadow-inner ${
              filteredData.stats.consistencyPercent >= 70 ? 'bg-green-500' :
              filteredData.stats.consistencyPercent >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`} />
            <span className="text-sm font-bold text-gray-800">
              {filteredData.stats.consistencyPercent >= 70 ? "System Stable" : 
               filteredData.stats.consistencyPercent >= 40 ? "System Fluctuating" : "System Degrading"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-gray-400" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Updated just now
            </span>
          </div>
        </div>

        {/* 2. ANOMALY DETECTION */}
        {anomaly && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-sm font-bold text-red-600 shadow-sm">
            <AlertTriangle size={18} />
            {anomaly}
          </div>
        )}

        {/* 3. SMART FILTER BAR */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-white border border-gray-200 rounded-[20px] shadow-sm">
          <div className="flex gap-2">
            {(['month', 'year', 'custom'] as FilterType[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${
                  filterType === t ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {filterType === 'month' && <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm font-bold outline-none focus:border-orange-400 text-gray-700" />}
            {filterType === 'year' && <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm font-bold w-24 outline-none focus:border-orange-400 text-gray-700" />}
            {filterType === 'custom' && (
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-md border border-gray-200">
                <input type="date" value={customRange.start} onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} className="bg-transparent text-xs font-bold p-1 outline-none text-gray-700" />
                <span className="text-gray-300 font-bold">→</span>
                <input type="date" value={customRange.end} onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} className="bg-transparent text-xs font-bold p-1 outline-none text-gray-700" />
              </div>
            )}
          </div>
        </div>

        {/* 4. SUMMARY METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Done</span>
              <CheckCircle2 size={16} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-800">{filteredData.stats.totalCompletions}</h3>
            <span className={`text-[10px] font-bold mt-1 ${filteredData.stats.delta > 0 ? 'text-green-600' : filteredData.stats.delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {filteredData.stats.delta > 0 ? `+${filteredData.stats.delta}` : filteredData.stats.delta} vs last period
            </span>
          </div>
          
          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Consistency</span>
              <Activity size={16} className={filteredData.stats.consistencyPercent >= 70 ? 'text-green-500' : filteredData.stats.consistencyPercent >= 40 ? 'text-orange-500' : 'text-red-500'} />
            </div>
            <h3 className={`text-2xl font-black ${filteredData.stats.consistencyPercent >= 70 ? 'text-green-600' : filteredData.stats.consistencyPercent >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
              {filteredData.stats.consistencyPercent}%
            </h3>
            <span className="text-[10px] font-bold mt-1 text-gray-400 uppercase tracking-widest">Of total possible</span>
          </div>

          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Days</span>
              <CalendarIcon size={16} className="text-orange-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-800">{filteredData.stats.activeDays} <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Days</span></h3>
            <span className="text-[10px] font-bold mt-1 text-gray-400 uppercase tracking-widest">With execution</span>
          </div>
          
          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Peak Velocity</span>
              <TrendingUp size={16} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-800">{filteredData.stats.peakVolume} <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Reps</span></h3>
            <span className="text-[10px] font-bold mt-1 text-orange-500">{filteredData.stats.peakText}</span>
          </div>
        </div>

        {/* 5. INSIGHT & FOCUS TARGET */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* General Insight with Trend & Load */}
          <div className="bg-white border border-gray-200 rounded-[20px] p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Performance Insight</span>
              <p className="text-sm font-semibold text-gray-800 mt-2">
                {filteredData.stats.totalCompletions === 0 ? "No activity — system inactive." : 
                 filteredData.stats.peakVolume > 5 ? "High intensity detected — maintain momentum." : "Moderate activity — increase consistency."}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6">
              <div className="flex items-center gap-2">
                {momentum > 0 && <TrendingUp size={14} className="text-green-500" />}
                {momentum < 0 && <TrendingDown size={14} className="text-red-500" />}
                {momentum === 0 && <Minus size={14} className="text-gray-400" />}
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Trend Direction</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={14} className={loadLevel === 'High' ? 'text-green-500' : loadLevel === 'Moderate' ? 'text-orange-500' : 'text-red-500'} />
                <span className={`text-xs font-bold uppercase tracking-widest ${loadLevel === 'High' ? 'text-green-600' : loadLevel === 'Moderate' ? 'text-orange-500' : 'text-red-500'}`}>
                  {loadLevel} Load
                </span>
              </div>
            </div>
          </div>

          {/* Focus Zone */}
          <div className="bg-orange-50 border border-orange-200 rounded-[20px] p-5 shadow-sm flex flex-col justify-center">
            <span className="text-xs text-orange-500 font-black uppercase tracking-widest flex items-center gap-2">
              <Target size={14} /> Focus Zone
            </span>
            <p className="text-sm font-bold text-orange-900 mt-2 leading-relaxed">
              {filteredData.stats.worstDayInsight}
            </p>
          </div>
        </div>

        {/* 6. PRIMARY CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* BAR CHART: Intensity */}
          <div className="bg-white border border-gray-200 p-6 rounded-[20px] shadow-sm min-h-[380px] flex flex-col">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Objective Intensity</h4>
            {filteredData.stats.totalCompletions > 0 ? (
              <div className="flex-1 relative">
                <Bar 
                  data={{ 
                    labels: filteredData.labels, 
                    datasets: [{ 
                      backgroundColor: filteredData.taskTotals.map(v => v === Math.max(...filteredData.taskTotals) ? '#16a34a' : '#fed7aa'),
                      borderRadius: 6, 
                      data: filteredData.taskTotals 
                    }] 
                  }} 
                  options={chartOptions} 
                />
              </div>
            ) : <EmptyState />}
          </div>

          {/* DOUGHNUT: Focus Split */}
          <div className="bg-white border border-gray-200 p-6 rounded-[20px] shadow-sm min-h-[380px] flex flex-col">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Focus Split</h4>
            {filteredData.stats.totalCompletions > 0 ? (
              <div className="flex-1 relative">
                <Doughnut 
                  data={{ 
                    labels: filteredData.labels, 
                    datasets: [{ 
                      backgroundColor: ['#16a34a', '#f97316', '#ef4444', '#fdba74', '#86efac'], 
                      data: filteredData.taskTotals, 
                      borderWidth: 0, hoverOffset: 10
                    }] 
                  }} 
                  options={{ ...chartOptions, scales: {}, plugins: { ...chartOptions.plugins, legend: { display: true, position: 'bottom', labels: { font: { size: 10, weight: 'bold' }, color: '#9ca3af', boxWidth: 12, padding: 20 } }}}} 
                />
              </div>
            ) : <EmptyState />}
          </div>

          {/* LINE CHART: Activity Pulse */}
          <div className="bg-white border border-gray-200 p-6 rounded-[20px] shadow-sm min-h-[380px] flex flex-col lg:col-span-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
              Daily Output (Tasks Completed)
            </h4>
            {filteredData.stats.totalCompletions > 0 ? (
              <div className="flex-1 relative">
                <Line 
                  data={{ 
                    labels: filteredData.timelineLabels, 
                    datasets: [{ 
                      borderColor: '#f97316', 
                      borderWidth: 3, pointRadius: 0, pointHoverRadius: 6, pointBackgroundColor: '#f97316',
                      tension: 0.4, data: filteredData.volumeData, fill: true, 
                      backgroundColor: (context: any) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                        gradient.addColorStop(0, 'rgba(249, 115, 22, 0.15)');
                        gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
                        return gradient;
                      } 
                    }] 
                  }} 
                  options={chartOptions} 
                />
              </div>
            ) : <EmptyState />}
          </div>

          {/* LINE CHART: Consistency Trend (Zoned) */}
          <div className="bg-white border border-gray-200 p-6 rounded-[20px] shadow-sm min-h-[340px] flex flex-col">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Consistency Trend (%)</h4>
            {filteredData.stats.totalCompletions > 0 ? (
              <div className="flex-1 relative">
                <Line 
                  data={{
                    labels: filteredData.timelineLabels,
                    datasets: [{
                      data: filteredData.consistencyTrend,
                      borderColor: '#16a34a',
                      tension: 0.4, fill: true, pointRadius: 0, borderWidth: 3,
                      backgroundColor: (context: any) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return 'rgba(22, 163, 74, 0.1)';
                        
                        // Zoned gradient based on chart height mapping 0-100%
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.25)');    // Red (Low: 0-40)
                        gradient.addColorStop(0.4, 'rgba(249, 115, 22, 0.25)'); // Orange (Mid: 40-70)
                        gradient.addColorStop(0.7, 'rgba(22, 163, 74, 0.25)');  // Green (High: 70-100)
                        return gradient;
                      }
                    }]
                  }}
                  options={{...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 100 } }}}
                />
              </div>
            ) : <EmptyState />}
          </div>

          {/* BAR CHART: Weekly Performance */}
          <div className="bg-white border border-gray-200 p-6 rounded-[20px] shadow-sm min-h-[340px] flex flex-col">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Weekly Performance</h4>
            {filteredData.weeklyPerformance.values.length > 0 && Math.max(...filteredData.weeklyPerformance.values) > 0 ? (
              <div className="flex-1 relative">
                <Bar 
                  data={{
                    labels: filteredData.weeklyPerformance.labels,
                    datasets: [{
                      data: filteredData.weeklyPerformance.values,
                      backgroundColor: filteredData.weeklyPerformance.values.map(v => v === Math.max(...filteredData.weeklyPerformance.values) ? '#16a34a' : '#fdba74'),
                      borderRadius: 8
                    }]
                  }}
                  options={chartOptions}
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
                <input type="number" value={targetGoal} onChange={(e) => setTargetGoal(Number(e.target.value))} className="w-16 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs font-bold outline-none text-center text-gray-700" />
              </div>
            </div>
            {filteredData.stats.totalCompletions > 0 ? (
              <div className="flex-1 relative">
                <Line 
                  data={{
                    labels: filteredData.timelineLabels,
                    datasets: [
                      {
                        label: 'Actual Volume',
                        data: filteredData.cumulativeActual,
                        borderColor: '#16a34a',
                        backgroundColor: 'transparent',
                        borderWidth: 3, tension: 0.1, pointRadius: 0
                      },
                      {
                        label: 'Target Pace',
                        data: filteredData.cumulativeTarget,
                        borderColor: '#9ca3af',
                        borderDash: [5, 5],
                        borderWidth: 2, tension: 0, pointRadius: 0, fill: false
                      }
                    ]
                  }}
                  options={{...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: true, position: 'top', labels: { font: { size: 10, weight: 'bold' }, color: '#9ca3af', boxWidth: 16 } } }}}
                />
              </div>
            ) : <EmptyState />}
          </div>

        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
      <AlertCircle size={32} className="text-gray-300 mb-4" />
      <p className="text-sm font-bold text-gray-600">No execution recorded for this range</p>
      <p className="text-xs font-bold text-gray-400 mt-1">Adjust filters or resume tasks.</p>
    </div>
  );
}