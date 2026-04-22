"use client";

import { useState, useMemo } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Task, Meta } from '../types';
import { FilterType, getLocalDate, getISODay, FilteredData } from './analytics/utils';

import FilterBar from './analytics/FilterBar';
import SummaryCards from './analytics/SummaryCards';
import InsightsPanel from './analytics/InsightsPanel';
import ChartsGrid from './analytics/ChartsGrid';

// Extend the type to safely include the new delta arrays, net performance, and card deltas
type ExtendedFilteredData = Omit<FilteredData, 'stats'> & {
  dailyDeltas: number[];
  deltaTrend: number[];
  netPerformance: number;
  stats: FilteredData['stats'] & {
    consistencyDelta: number;
    activeDelta: number;
    avgDelta: number;
  };
};

export default function AnalyticsView({ tasks, meta }: { tasks: Task[], meta: Meta }) {
  const actualToday = getLocalDate(new Date());
  
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [selectedMonth, setSelectedMonth] = useState(meta.currentMonth);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [targetGoal, setTargetGoal] = useState<number>(100);

  // --- Logic: Advanced Temporal Aggregation ---
  const filteredData = useMemo<ExtendedFilteredData>(() => {
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

    // True Daily Momentum Trend
    const dailyDeltas: number[] = [];

    rangeDates.forEach((dateStr) => {
      const d = new Date(dateStr);
      let dailyCount = 0;
      
      tasks.forEach(t => {
        if (t.history?.[dateStr]) dailyCount++;
      });

      if (dailyCount === 0) zeroCount++;

      // Daily Delta Calculation
      const todayCount = tasks.filter(t => t.history?.[dateStr]).length;
      const prevDate = new Date(dateStr);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevStr = prevDate.toISOString().split("T")[0];
      const prevCount = tasks.filter(t => t.history?.[prevStr]).length;
      dailyDeltas.push(todayCount - prevCount);

      const firstDayOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
      const weekNum = Math.ceil((d.getDate() + firstDayOfMonth) / 7);
      const weekLabel = `W${weekNum} ${monthNames[d.getMonth()]}`;
      
      weeklyPerformance[weekLabel] = (weeklyPerformance[weekLabel] || 0) + dailyCount;
      consistencyTrend.push(tasks.length === 0 ? 0 : (dailyCount / tasks.length) * 100);

      const isoDay = getISODay(d) - 1; 
      weekdayTotals[isoDay] += tasks.length;
      weekdayMisses[isoDay] += (tasks.length - dailyCount);
    });

    // Net Performance
    const netPerformance = dailyDeltas.reduce((acc, d) => acc + d, 0);

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
    
    const peakVolume = Math.max(...(volumeData.length ? volumeData : [0]));
    const peakIndex = volumeData.indexOf(peakVolume);
    const peakLabel = timelineLabels[peakIndex] || '';
    const peakText = filterType === 'year' ? `in ${peakLabel}` : `on ${peakLabel}`;
    
    const totalPossible = rangeDates.length * (tasks.length || 1);
    const consistencyPercent = totalPossible === 0 ? 0 : Math.round((totalCompletions / totalPossible) * 100);
    
    // Fix Avg/Day logic to only count active days
    const activeDays = rangeDates.filter(date =>
      tasks.some(t => t.history?.[date])
    ).length;
    
    const avgPerDay = activeDays === 0
      ? 0
      : Math.round((totalCompletions / activeDays) * 10) / 10;

    // 🔥 FIX: Calculate PREVIOUS range metrics to generate real deltas for the SummaryCards
    const prevActiveDays = prevRangeDates.filter(date => tasks.some(t => t.history?.[date])).length;
    const prevAvgPerDay = prevActiveDays === 0 ? 0 : Math.round((prevTotalCompletions / prevActiveDays) * 10) / 10;
    const prevTotalPossible = prevRangeDates.length * (tasks.length || 1);
    const prevConsistencyPercent = prevTotalPossible === 0 ? 0 : Math.round((prevTotalCompletions / prevTotalPossible) * 100);

    const consistencyDelta = consistencyPercent - prevConsistencyPercent;
    const activeDelta = activeDays - prevActiveDays;
    const avgDelta = Math.round((avgPerDay - prevAvgPerDay) * 10) / 10;

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
      labels: tasks.map(t => t.name), 
      taskTotals, 
      volumeData, 
      timelineLabels, 
      consistencyTrend,
      weeklyPerformance: { labels: Object.keys(weeklyPerformance), values: Object.values(weeklyPerformance) },
      cumulativeActual, 
      cumulativeTarget,
      dailyDeltas,
      deltaTrend: dailyDeltas, // Map for downstream charts
      netPerformance,
      stats: { 
        totalCompletions, 
        delta, 
        activeDays, 
        peakVolume, 
        peakText, 
        consistencyPercent, 
        avgPerDay, 
        worstDayInsight, 
        zeroDays: zeroCount,
        consistencyDelta, // Added
        activeDelta,      // Added
        avgDelta          // Added
      }
    } as ExtendedFilteredData;
  }, [tasks, filterType, selectedMonth, selectedYear, customRange, targetGoal]);

  // Safely compute momentum
  const momentum = useMemo(() => {
    if (!tasks.length) return 0;

    const todayCount = tasks.filter(t => t.history?.[actualToday]).length;
    const d = new Date(actualToday);
    d.setDate(d.getDate() - 1);
    const yesterday = getLocalDate(d);
    const yesterdayCount = tasks.filter(t => t.history?.[yesterday]).length;

    return todayCount - yesterdayCount;
  }, [tasks, actualToday]);

  // True System Status based on Momentum
  const systemStatus = useMemo(() => {
    if (momentum < 0) return "Degrading";
    if (momentum > 0) return "Improving";
    return "Stable";
  }, [momentum]);

  // Strong Anomaly Detection using real Daily Deltas
  const anomaly = useMemo(() => {
    const recentDrop = filteredData.dailyDeltas.slice(-3).every(d => d < 0) && filteredData.dailyDeltas.length >= 3;

    if (recentDrop) return "3-day performance drop detected.";
    if (filteredData.stats.zeroDays >= 3) return "Multiple inactivity days detected.";
    if (momentum < 0) return "Recent performance decline.";

    return null;
  }, [filteredData.dailyDeltas, filteredData.stats.zeroDays, momentum]);

  const loadLevel = filteredData.stats.avgPerDay > tasks.length * 0.7 ? "High" :
                    filteredData.stats.avgPerDay > tasks.length * 0.4 ? "Moderate" : "Low";

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F9FAFB]">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6 pb-24">
        
        {/* 1. SYSTEM STATUS BAR */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full shadow-inner ${
              systemStatus === "Improving" ? "bg-green-500" :
              systemStatus === "Degrading" ? "bg-red-500" :
              "bg-gray-400"
            }`} />
            <span className="text-sm font-bold text-gray-800">
              {systemStatus === "Improving" && "System Improving"}
              {systemStatus === "Degrading" && "System Dropping"}
              {systemStatus === "Stable" && "System Stable"}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* NET PERFORMANCE BADGE */}
            <div className={`text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${
              filteredData.netPerformance > 0 ? "bg-green-50 text-green-600 border-green-200" :
              filteredData.netPerformance < 0 ? "bg-red-50 text-red-600 border-red-200" :
              "bg-gray-50 text-gray-500 border-gray-200"
            }`}>
              Net: {filteredData.netPerformance > 0 ? `+${filteredData.netPerformance}` : filteredData.netPerformance}
            </div>

            <div className="flex items-center gap-2">
              <Clock size={12} className="text-gray-400" />
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Updated just now</span>
            </div>
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

        {/* 4. SUMMARY METRICS */}
        <SummaryCards stats={filteredData.stats} momentum={momentum} />

        {/* 5. INSIGHT & FOCUS TARGET */}
        <InsightsPanel stats={filteredData.stats} momentum={momentum} loadLevel={loadLevel as 'High' | 'Moderate' | 'Low'} />

        {/* 6. PRIMARY CHARTS GRID */}
        {/* Pass filteredData which now contains the deltaTrend specifically for charting */}
        <ChartsGrid data={filteredData} targetGoal={targetGoal} setTargetGoal={setTargetGoal} />
        
      </div>
    </div>
  );
}