"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Target, AlertTriangle, Activity, BrainCircuit, TrendingUp } from 'lucide-react';
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
    const hasInitialized = localStorage.getItem('nextask_onboarding_seen');
    if (!hasInitialized) setShowOnboarding(true);
  }, []);

  const handleInitialize = () => setShowOnboarding(false);

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
    totalReps, consistencyPercent, avgPerDay,
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
      totalReps: reps,
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
  const gap = targetGoal - totalReps;

  return (
    <div className="flex-1 p-4 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-6 pb-24 relative">
      
      {showOnboarding && <OnboardingFlow onComplete={handleInitialize} />}

      {/* HEADER & SMART RANGE SELECTOR */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Performance Insights</h1>
          <p className="text-xs text-gray-400 mt-0.5">Real-time range analytics</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.days)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'preset' && activePreset === p.days ? 'bg-white shadow-sm text-gray-900 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Metrics 
        consistencyPercent={consistencyPercent} avgPerDay={avgPerDay} momentum={momentum} 
        bestStreak={bestStreak} currentGlobalStreak={currentGlobalStreak} zeroDays={zeroDays} 
        peakDayCount={peakDay.count} bestDayInsight={bestDayInsight} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 🥇 HERO CARD: TARGET vs ACTUAL */}
        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-[20px] p-6 shadow-sm flex flex-col gap-5 md:col-span-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Target size={18} className="text-orange-500" />
              Target vs Actual
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Goal:</span>
              <input 
                type="number" 
                value={targetGoal} 
                onChange={(e) => setTargetGoal(Number(e.target.value) || 1)} 
                className="w-20 bg-white border border-gray-200 rounded-lg text-xs font-black px-2 py-1.5 text-center outline-none focus:ring-2 focus:ring-orange-200" 
              />
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-4xl font-black text-gray-900 tracking-tighter">
                {totalReps}
                <span className="text-lg text-gray-400 font-normal ml-2">/ {targetGoal}</span>
              </span>
              <span className="text-xs font-bold text-gray-400 mt-1">
                {gap > 0 ? `${gap} reps remaining to reach target` : "Target reached — entering bonus output"}
              </span>
            </div>
            <div className={`text-2xl font-black ${goalProgress >= 100 ? "text-green-600" : "text-orange-500"}`}>
              {goalProgress}%
            </div>
          </div>

          <div className="w-full bg-gray-200/50 h-3.5 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                goalProgress >= 100 ? "bg-green-500" : goalProgress >= 60 ? "bg-blue-500" : "bg-orange-400"
              }`}
              style={{ width: `${goalProgress}%` }}
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-xs font-bold text-gray-500 italic">
              {goalProgress >= 100 && "Target secured. You are in elite territory. 🔥"}
              {goalProgress >= 60 && goalProgress < 100 && "Maintaining pace. Keep pushing. ⚡"}
              {goalProgress < 60 && "Below target pace. Increase execution frequency. ⚠️"}
            </div>
            
            {/* 🚀 MINI TREND GRAPH (Sparkline) */}
            <div className="flex items-end gap-1 h-10 w-32">
              {heatmapData.slice(-12).map((d, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gray-200 rounded-t-sm transition-all hover:bg-orange-400 cursor-help"
                  style={{ height: `${Math.max(10, d.intensity * 100)}%` }}
                  title={`${d.date}: ${d.count} reps`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 🧠 BEHAVIORAL PATTERN DETECTION */}
        <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
            <BrainCircuit size={18} className="text-blue-500" /> Behavioral Pattern
          </h3>
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="mt-1">
              {worstDayInsight.includes('Slip') ? <AlertTriangle className="text-orange-500" size={20} /> : <TrendingUp className="text-green-500" size={20} />}
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Observation</div>
              <p className="text-sm font-bold text-gray-800 leading-relaxed">{worstDayInsight}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Heatmap Key</span>
               <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                  <span>Low</span>
                  <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                  <div className="w-3 h-3 bg-orange-200 rounded-sm"></div>
                  <div className="w-3 h-3 bg-orange-400 rounded-sm"></div>
                  <div className="w-3 h-3 bg-orange-600 rounded-sm"></div>
                  <span>High</span>
               </div>
            </div>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
                The heatmap visualizes your execution density over time. Darker orange cells represent days where you hit maximum tasks.
            </p>
        </div>
      </div>

      <Heatmap heatmapData={heatmapData} />

      {/* CLEAN INSIGHT BAR w/ RISK SCORE */}
      <div className="bg-white border border-gray-200 rounded-[25px] p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-md">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-black uppercase tracking-[0.2em]">Range Diagnosis</span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${riskScore === 'High' ? 'bg-red-100 text-red-600' : riskScore === 'Medium' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
              {riskScore} Behavioral Risk
            </span>
          </div>
          <p className="text-base font-bold text-gray-800 mt-3">
            {consistencyPercent < 40 && "⚠️ Critical inconsistency detected. Focus on showing up regardless of output volume."}
            {consistencyPercent >= 40 && consistencyPercent < 70 && "⚡ Fluctuating performance. Your baseline discipline needs stabilization."}
            {consistencyPercent >= 70 && consistencyPercent < 90 && "🔥 Strong execution. You are consistently hitting your primary objectives."}
            {consistencyPercent >= 90 && "🚀 Elite execution. You are operating at maximum efficiency within this range."}
          </p>
        </div>
        <div className="text-right bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 min-w-[140px]">
          <div className="text-3xl font-black text-gray-900">{totalReps}</div>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Reps</div>
        </div>
      </div>
    </div>
  );
}