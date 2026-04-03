"use client";

import React, { useState, useMemo } from 'react';
import { 
  Flame, Target, AlertTriangle, 
  TrendingUp, TrendingDown, Calendar, BrainCircuit, Activity
} from 'lucide-react';
import { Task, Meta } from '../types';

interface StatsProps {
  tasks: Task[];
  meta: Meta;
}

const getLocalDate = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
};

const getISODay = (date: Date) => {
  const day = date.getDay();
  return day === 0 ? 7 : day; 
};

// Global Helpers
const calculateBestStreak = (tasks: Task[]) => {
  let max = 0;
  tasks.forEach(t => {
    if (!t.history) return;
    const dates = Object.keys(t.history).sort();
    let currentStreak = 0;
    let lastDate: string | null = null;
    
    dates.forEach(d => {
      if (t.history![d]) {
        if (!lastDate) currentStreak = 1;
        else {
          const diff = Math.round((new Date(d).getTime() - new Date(lastDate).getTime()) / 86400000);
          if (diff === 1) currentStreak++;
          else currentStreak = 1;
        }
        max = Math.max(max, currentStreak);
        lastDate = d;
      }
    });
  });
  return max;
};

export default function StatsGrid({ tasks, meta }: StatsProps) {
  const actualToday = getLocalDate(new Date());

  // --- UI STATE ---
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [activePreset, setActivePreset] = useState<number>(30);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return getLocalDate(d);
  });
  const [endDate, setEndDate] = useState(actualToday);
  const [targetGoal, setTargetGoal] = useState<number>(100);

  // --- SMART RANGE SELECTOR LOGIC ---
  const presets = [
    { label: "7D", days: 7 },
    { label: "30D", days: 30 },
    { label: "90D", days: 90 },
    { label: "365D", days: 365 },
  ];

  const applyPreset = (days: number) => {
    const end = getLocalDate(new Date());
    const startObj = new Date();
    startObj.setDate(startObj.getDate() - days + 1); 
    setStartDate(getLocalDate(startObj));
    setEndDate(end);
    setMode('preset');
    setActivePreset(days);
  };

  // --- DATA ENGINE ---
  const rangeDates = useMemo(() => {
    const dates: string[] = [];
    let curr = new Date(startDate);
    const end = new Date(endDate);
    while (curr <= end) {
      dates.push(getLocalDate(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  }, [startDate, endDate]);

  const {
    totalReps,
    totalPossible,
    consistencyPercent,
    avgPerDay,
    peakDay,
    heatmapData,
    worstDayInsight,
    bestDayInsight,
    zeroDays
  } = useMemo(() => {
    let reps = 0;
    let zeroCount = 0;
    const possible = rangeDates.length * (tasks.length || 1);
    const dayCounts: Record<string, number> = {};
    
    const weekdayMisses = Array(7).fill(0);
    const weekdayTotals = Array(7).fill(0);
    const weekdayHits = Array(7).fill(0);

    const heatmap = rangeDates.map(dateStr => {
      let dailyCount = 0;
      tasks.forEach(t => {
        if (t.history?.[dateStr]) {
          dailyCount++;
          reps++;
        }
      });

      if (dailyCount === 0) zeroCount++;

      dayCounts[dateStr] = dailyCount;

      const dateObj = new Date(dateStr);
      const isoDay = getISODay(dateObj) - 1; 
      weekdayTotals[isoDay] += tasks.length;
      weekdayHits[isoDay] += dailyCount;
      weekdayMisses[isoDay] += (tasks.length - dailyCount);

      return {
        date: dateStr,
        count: dailyCount,
        intensity: tasks.length === 0 ? 0 : dailyCount / tasks.length
      };
    });

    let peak = { date: '-', count: 0 };
    Object.entries(dayCounts).forEach(([d, c]) => {
      if (c > peak.count) peak = { date: d, count: c };
    });

    let worstDayIdx = 0;
    let worstMissRate = 0;
    let bestDayIdx = 0;
    let bestHitRate = 0;

    weekdayTotals.forEach((total, i) => {
      if (total > 0) {
        const missRate = weekdayMisses[i] / total;
        if (missRate > worstMissRate) {
          worstMissRate = missRate;
          worstDayIdx = i;
        }

        const hitRate = weekdayHits[i] / total;
        if (hitRate > bestHitRate) {
          bestHitRate = hitRate;
          bestDayIdx = i;
        }
      }
    });

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const wInsight = worstMissRate > 0.4 
      ? `Slip pattern on ${dayNames[worstDayIdx]}s (${Math.round(worstMissRate * 100)}% miss rate)`
      : "Execution is evenly distributed";

    const bInsight = `${dayNames[bestDayIdx]} strongest`;

    return {
      totalReps: reps,
      totalPossible: possible === 0 ? 1 : possible,
      consistencyPercent: possible === 0 ? 0 : Math.round((reps / possible) * 100),
      avgPerDay: rangeDates.length ? Math.round((reps / rangeDates.length) * 10) / 10 : 0,
      peakDay: peak,
      heatmapData: heatmap,
      worstDayInsight: wInsight,
      bestDayInsight: bInsight,
      zeroDays: zeroCount
    };
  }, [rangeDates, tasks]);

  // --- MOMENTUM & STREAKS ---
  const momentum = useMemo(() => {
    const todayCount = tasks.filter(t => t.history?.[actualToday]).length;
    const d = new Date(actualToday);
    d.setDate(d.getDate() - 1);
    const yesterdayStr = getLocalDate(d);
    const yesterdayCount = tasks.filter(t => t.history?.[yesterdayStr]).length;
    return todayCount - yesterdayCount;
  }, [tasks, actualToday]);

  const bestStreak = useMemo(() => calculateBestStreak(tasks), [tasks]);

  const currentGlobalStreak = useMemo(() => {
    let streak = 0;
    let d = new Date(actualToday);
    let dateStr = getLocalDate(d);
    
    let activeToday = tasks.some(t => t.history?.[dateStr]);
    
    d.setDate(d.getDate() - 1);
    let prevStr = getLocalDate(d);
    let activeYesterday = tasks.some(t => t.history?.[prevStr]);

    if (!activeToday && !activeYesterday) return 0;
    if (activeToday) streak++;

    while (tasks.some(t => t.history?.[prevStr])) {
      streak++;
      d.setDate(d.getDate() - 1);
      prevStr = getLocalDate(d);
    }
    return streak;
  }, [tasks, actualToday]);

  // --- AI RISK SCORE ---
  const riskScore = useMemo(() => {
    if (zeroDays > 3) return 'High';
    if (momentum < 0) return 'Medium';
    return 'Low';
  }, [zeroDays, momentum]);

  // --- HELPERS FOR UI ---
  const getColorClass = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 0.3) return 'bg-orange-200';
    if (intensity < 0.6) return 'bg-orange-400';
    if (intensity < 0.9) return 'bg-green-400';
    return 'bg-green-600';
  };

  const goalProgress = Math.min(Math.round((totalReps / targetGoal) * 100), 100);

  return (
    <div className="flex-1 p-4 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-6 pb-24">
      
      {/* HEADER & SMART RANGE SELECTOR */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">
            Performance Insights
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Range analytics
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            {presets.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.days)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  mode === 'preset' && activePreset === p.days 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- REFINED METRICS HIERARCHY --- */}
      <div className="flex flex-col gap-4">
        
        {/* PRIMARY METRIC ROW (High Impact) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Consistency */}
          <div className="border border-gray-200 rounded-[20px] p-6 bg-white shadow-sm flex flex-col justify-center items-center text-center">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Consistency</span>
            <div className={`text-3xl font-black mt-3 ${consistencyPercent >= 70 ? 'text-green-600' : consistencyPercent >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
              {consistencyPercent}%
            </div>
          </div>

          {/* Avg / Day */}
          <div className="border border-gray-200 rounded-[20px] p-6 bg-white shadow-sm flex flex-col justify-center items-center text-center">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5"><Activity size={14} /> Avg / Day</span>
            <div className="text-3xl font-black mt-3 text-orange-600">
              {avgPerDay}
            </div>
          </div>

          {/* Momentum */}
          <div className="border border-gray-200 rounded-[20px] p-6 bg-white shadow-sm flex flex-col justify-center items-center text-center">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Momentum</span>
            <div className={`text-3xl font-black mt-3 flex items-center gap-1.5 ${momentum > 0 ? 'text-green-600' : momentum < 0 ? 'text-red-500' : 'text-gray-500'}`}>
              {momentum > 0 && <TrendingUp size={24} strokeWidth={3} />}
              {momentum < 0 && <TrendingDown size={24} strokeWidth={3} />}
              {momentum > 0 ? `+${momentum}` : momentum}
            </div>
          </div>
        </div>

        {/* SECONDARY METRIC ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Peak Streak */}
          <div className="border border-gray-200 rounded-[16px] p-4 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-semibold">Peak Streak</span>
              <Flame size={16} className="text-orange-500" />
            </div>
            <div className="text-xl font-bold mt-2 text-orange-600">
              {bestStreak}
            </div>
          </div>

          {/* Current Streak */}
          <div className="border border-gray-200 rounded-[16px] p-4 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-semibold">Active Streak</span>
            </div>
            <div className="text-xl font-bold mt-2 text-gray-800">
              {currentGlobalStreak}
            </div>
          </div>

          {/* Zero Days */}
          <div className="border border-gray-200 rounded-[16px] p-4 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-semibold">Zero Days</span>
            </div>
            <div className={`text-xl font-bold mt-2 ${zeroDays > 0 ? 'text-red-500' : 'text-green-600'}`}>
              {zeroDays}
            </div>
          </div>

          {/* Merged Peak Output */}
          <div className="border border-gray-200 rounded-[16px] p-4 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-semibold">Peak Output</span>
            </div>
            <div className="text-xl font-bold mt-1 text-gray-800 flex items-end gap-2">
              {peakDay.count} <span className="text-[10px] text-gray-400 font-semibold mb-1 uppercase">reps</span>
            </div>
            <div className="text-[10px] font-bold mt-1 text-orange-500 uppercase tracking-widest">
              {bestDayInsight}
            </div>
          </div>
        </div>
      </div>

      {/* MID SECTION: Target Goal & AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* GOAL TRACKING (Color Fixed) */}
        <div className="bg-white border border-gray-200 rounded-[20px] p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Target size={16} className="text-gray-500" /> Target vs Actual</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-400 uppercase">Target:</span>
              <input 
                type="number" 
                value={targetGoal} 
                onChange={(e) => setTargetGoal(Number(e.target.value) || 1)} 
                className="w-16 bg-gray-50 border border-gray-200 rounded text-xs font-bold px-2 py-1 outline-none text-center"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold text-gray-800">{totalReps} <span className="text-sm text-gray-400 font-normal">/ {targetGoal}</span></span>
              <span className={`text-sm font-bold ${goalProgress >= 100 ? 'text-green-600' : 'text-gray-600'}`}>{goalProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${goalProgress >= 100 ? 'bg-green-500' : 'bg-orange-400'}`} 
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* PATTERN DETECTION */}
        <div className="bg-white border border-gray-200 rounded-[20px] p-5 flex flex-col justify-center">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
            <BrainCircuit size={16} className="text-gray-500" /> Pattern Detection
          </h3>
          <div className="flex gap-3 items-start">
            <div className="mt-0.5">
              {worstDayInsight.includes('Slip') ? <AlertTriangle size={16} className="text-orange-500" /> : <Activity size={16} className="text-green-500" />}
            </div>
            <p className="text-sm font-semibold text-gray-700 leading-relaxed">
              {worstDayInsight}
            </p>
          </div>
        </div>
      </div>

      {/* HEATMAP */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Calendar size={16} className="text-gray-500" /> Execution Map</h3>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase">
            <span>Less</span>
            <div className="w-3 h-3 rounded-[3px] bg-gray-100"></div>
            <div className="w-3 h-3 rounded-[3px] bg-orange-200"></div>
            <div className="w-3 h-3 rounded-[3px] bg-orange-400"></div>
            <div className="w-3 h-3 rounded-[3px] bg-green-400"></div>
            <div className="w-3 h-3 rounded-[3px] bg-green-600"></div>
            <span>More</span>
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
          <div className="min-w-max flex flex-col gap-1">
            <div 
              className="grid gap-1.5" 
              style={{ 
                gridTemplateRows: 'repeat(7, 1fr)', 
                gridAutoFlow: 'column',
                gridAutoColumns: '14px' 
              }}
            >
              {heatmapData.map((day) => (
                <div 
                  key={day.date} 
                  title={`${day.date}: ${day.count} reps`}
                  className={`w-[14px] h-[14px] rounded-[3px] transition-colors ${getColorClass(day.intensity)}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CLEAN INSIGHT BAR w/ RISK SCORE */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Insight
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
              riskScore === 'High' ? 'bg-red-50 text-red-500' :
              riskScore === 'Medium' ? 'bg-orange-50 text-orange-600' :
              'bg-green-50 text-green-600'
            }`}>
              {riskScore} Risk
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-700 mt-2">
            {consistencyPercent < 40
              ? "Low consistency — fix routine immediately."
              : consistencyPercent < 70
              ? "Inconsistent execution — improve baseline discipline."
              : consistencyPercent < 90
              ? "Strong performance — maintain current pace."
              : "Elite execution — operating at maximum efficiency."}
          </p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black text-gray-800">
            {totalReps}
          </div>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Total Output
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}} />

    </div>
  );
}