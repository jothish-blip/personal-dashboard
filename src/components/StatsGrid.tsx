"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Target, AlertTriangle, Activity, BrainCircuit } from 'lucide-react';
import { Task, Meta } from '../types';

import { getLocalDate, getISODay, calculateBestStreak } from './stats/utils';
import OnboardingFlow from './stats/OnboardingFlow';
import Metrics from './stats/Metrics';
import Heatmap from './stats/Heatmap';

interface StatsProps {
  tasks: Task[];
  meta: Meta;
}

export default function StatsGrid({ tasks, meta }: StatsProps) {
  const actualToday = getLocalDate(new Date());

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [activePreset, setActivePreset] = useState<number>(30);
  const [targetGoal, setTargetGoal] = useState<number>(100);
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return getLocalDate(d);
  });
  const [endDate, setEndDate] = useState(actualToday);

  useEffect(() => {
    const hasInitialized = localStorage.getItem('nextask_workspace_init_v08');
    if (!hasInitialized) setShowOnboarding(true);
  }, []);

  const handleInitialize = () => {
    localStorage.setItem('nextask_workspace_init_v08', 'true');
    setShowOnboarding(false);
  };

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
    totalReps, totalPossible, consistencyPercent, avgPerDay,
    peakDay, heatmapData, worstDayInsight, bestDayInsight, zeroDays
  } = useMemo(() => {
    let reps = 0, zeroCount = 0;
    const possible = rangeDates.length * (tasks.length || 1);
    const dayCounts: Record<string, number> = {};
    const weekdayMisses = Array(7).fill(0);
    const weekdayTotals = Array(7).fill(0);
    const weekdayHits = Array(7).fill(0);

    const heatmap = rangeDates.map(dateStr => {
      let dailyCount = 0;
      tasks.forEach(t => {
        if (t.history?.[dateStr]) { dailyCount++; reps++; }
      });
      if (dailyCount === 0) zeroCount++;
      dayCounts[dateStr] = dailyCount;
      const dateObj = new Date(dateStr);
      const isoDay = getISODay(dateObj) - 1; 
      weekdayTotals[isoDay] += tasks.length;
      weekdayHits[isoDay] += dailyCount;
      weekdayMisses[isoDay] += (tasks.length - dailyCount);
      return { date: dateStr, count: dailyCount, intensity: tasks.length === 0 ? 0 : dailyCount / tasks.length };
    });

    let peak = { date: '-', count: 0 };
    Object.entries(dayCounts).forEach(([d, c]) => {
      if (c > peak.count) peak = { date: d, count: c };
    });

    let worstDayIdx = 0, worstMissRate = 0, bestDayIdx = 0, bestHitRate = 0;
    weekdayTotals.forEach((total, i) => {
      if (total > 0) {
        const missRate = weekdayMisses[i] / total;
        if (missRate > worstMissRate) { worstMissRate = missRate; worstDayIdx = i; }
        const hitRate = weekdayHits[i] / total;
        if (hitRate > bestHitRate) { bestHitRate = hitRate; bestDayIdx = i; }
      }
    });

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const wInsight = worstMissRate > 0.4 ? `Slip pattern on ${dayNames[worstDayIdx]}s (${Math.round(worstMissRate * 100)}% miss rate)` : "Execution is evenly distributed";
    const bInsight = `${dayNames[bestDayIdx]} strongest`;

    return {
      totalReps: reps, totalPossible: possible === 0 ? 1 : possible,
      consistencyPercent: possible === 0 ? 0 : Math.round((reps / possible) * 100),
      avgPerDay: rangeDates.length ? Math.round((reps / rangeDates.length) * 10) / 10 : 0,
      peakDay: peak, heatmapData: heatmap, worstDayInsight: wInsight, bestDayInsight: bInsight, zeroDays: zeroCount
    };
  }, [rangeDates, tasks]);

  const momentum = useMemo(() => {
    const todayCount = tasks.filter(t => t.history?.[actualToday]).length;
    const d = new Date(actualToday);
    d.setDate(d.getDate() - 1);
    const yesterdayCount = tasks.filter(t => t.history?.[getLocalDate(d)]).length;
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
      streak++; d.setDate(d.getDate() - 1); prevStr = getLocalDate(d);
    }
    return streak;
  }, [tasks, actualToday]);

  const riskScore = useMemo(() => {
    if (zeroDays > 3) return 'High';
    if (momentum < 0) return 'Medium';
    return 'Low';
  }, [zeroDays, momentum]);

  const goalProgress = Math.min(Math.round((totalReps / targetGoal) * 100), 100);

  return (
    <div className="flex-1 p-4 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-6 pb-24 relative">
      
      {showOnboarding && <OnboardingFlow tasks={tasks} meta={meta} onComplete={handleInitialize} />}

      {/* HEADER & SMART RANGE SELECTOR */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Performance Insights</h1>
          <p className="text-xs text-gray-400 mt-0.5">Range analytics</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            {presets.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.days)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${mode === 'preset' && activePreset === p.days ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Metrics 
        consistencyPercent={consistencyPercent} avgPerDay={avgPerDay} momentum={momentum} 
        bestStreak={bestStreak} currentGlobalStreak={currentGlobalStreak} zeroDays={zeroDays} 
        peakDayCount={peakDay.count} bestDayInsight={bestDayInsight} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GOAL TRACKING */}
        <div className="bg-white border border-gray-200 rounded-[20px] p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Target size={16} className="text-gray-500" /> Target vs Actual</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-400 uppercase">Target:</span>
              <input type="number" value={targetGoal} onChange={(e) => setTargetGoal(Number(e.target.value) || 1)} className="w-16 bg-gray-50 border border-gray-200 rounded text-xs font-bold px-2 py-1 outline-none text-center" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold text-gray-800">{totalReps} <span className="text-sm text-gray-400 font-normal">/ {targetGoal}</span></span>
              <span className={`text-sm font-bold ${goalProgress >= 100 ? 'text-green-600' : 'text-gray-600'}`}>{goalProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${goalProgress >= 100 ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${goalProgress}%` }} />
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
            <p className="text-sm font-semibold text-gray-700 leading-relaxed">{worstDayInsight}</p>
          </div>
        </div>
      </div>

      <Heatmap heatmapData={heatmapData} />

      {/* CLEAN INSIGHT BAR w/ RISK SCORE */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Insight</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${riskScore === 'High' ? 'bg-red-50 text-red-500' : riskScore === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
              {riskScore} Risk
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-700 mt-2">
            {consistencyPercent < 40 ? "Low consistency — fix routine immediately." : consistencyPercent < 70 ? "Inconsistent execution — improve baseline discipline." : consistencyPercent < 90 ? "Strong performance — maintain current pace." : "Elite execution — operating at maximum efficiency."}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-gray-800">{totalReps}</div>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Output</div>
        </div>
      </div>
    </div>
  );
}