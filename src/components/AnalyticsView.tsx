"use client";

import { useState, useMemo } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Task, Meta } from '../types';
import { FilterType, getLocalDate, getISODay, FilteredData } from './analytics/utils';

import FilterBar from './analytics/FilterBar';
import SummaryCards from './analytics/SummaryCards';
import InsightsPanel from './analytics/InsightsPanel';
import ChartsGrid from './analytics/ChartsGrid';

export default function AnalyticsView({ tasks, meta }: { tasks: Task[], meta: Meta }) {
  const actualToday = getLocalDate(new Date());
  
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [selectedMonth, setSelectedMonth] = useState(meta.currentMonth);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [targetGoal, setTargetGoal] = useState<number>(100);

  // --- Logic: Advanced Temporal Aggregation ---
  const filteredData = useMemo<FilteredData>(() => {
    let start: Date, end: Date;
    let prevStart: Date, prevEnd: Date;

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
      prevStart = new Date(start.getTime() - duration - 86400000); 
      prevEnd = new Date(start.getTime() - 86400000);
    }

    const rangeDates: string[] = [];
    const curr = new Date(start);
    while (curr <= end) {
      rangeDates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

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

      const firstDayOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
      const weekNum = Math.ceil((d.getDate() + firstDayOfMonth) / 7);
      const weekLabel = `W${weekNum} ${monthNames[d.getMonth()]}`;
      
      weeklyPerformance[weekLabel] = (weeklyPerformance[weekLabel] || 0) + dailyCount;
      consistencyTrend.push(tasks.length === 0 ? 0 : (dailyCount / tasks.length) * 100);

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

    let cumulative = 0;
    const cumulativeActual = volumeData.map(v => { cumulative += v; return cumulative; });
    const cumulativeTarget = volumeData.map((_, i) => Math.round((targetGoal / volumeData.length) * (i + 1)));

    return {
      labels: tasks.map(t => t.name), taskTotals, volumeData, timelineLabels, consistencyTrend,
      weeklyPerformance: { labels: Object.keys(weeklyPerformance), values: Object.values(weeklyPerformance) },
      cumulativeActual, cumulativeTarget,
      stats: { totalCompletions, delta, activeDays, peakVolume, peakText, consistencyPercent, avgPerDay, worstDayInsight, zeroDays: zeroCount }
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

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F9FAFB]">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6 pb-24">
        
        {/* 1. SYSTEM STATUS BAR */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full shadow-inner ${filteredData.stats.consistencyPercent >= 70 ? 'bg-green-500' : filteredData.stats.consistencyPercent >= 40 ? 'bg-orange-500' : 'bg-red-500'}`} />
            <span className="text-sm font-bold text-gray-800">
              {filteredData.stats.consistencyPercent >= 70 ? "System Stable" : filteredData.stats.consistencyPercent >= 40 ? "System Fluctuating" : "System Degrading"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-gray-400" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Updated just now</span>
          </div>
        </div>

        {/* 2. ANOMALY DETECTION */}
        {anomaly && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-sm font-bold text-red-600 shadow-sm">
            <AlertTriangle size={18} /> {anomaly}
          </div>
        )}

        {/* 3. SMART FILTER BAR */}
        <FilterBar 
          filterType={filterType} setFilterType={setFilterType}
          selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear} setSelectedYear={setSelectedYear}
          customRange={customRange} setCustomRange={setCustomRange}
        />

        {/* 4. SUMMARY METRICS (🔥 FIXED: Passed momentum prop) */}
        <SummaryCards stats={filteredData.stats} momentum={momentum} />

        {/* 5. INSIGHT & FOCUS TARGET */}
        <InsightsPanel stats={filteredData.stats} momentum={momentum} loadLevel={loadLevel as 'High' | 'Moderate' | 'Low'} />

        {/* 6. PRIMARY CHARTS GRID */}
        <ChartsGrid data={filteredData} targetGoal={targetGoal} setTargetGoal={setTargetGoal} />
        
      </div>
    </div>
  );
}