"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Target, BarChart3, LineChart, History } from 'lucide-react';
import { Task, Meta } from '../types';
import { getSupabaseClient } from "@/lib/supabase";
import { useTheme } from "@/theme/ThemeProvider";

import {
  getLocalDate,
  calculateBestStreak,
} from "./utils";

import Metrics from "./components/Metrics/Metrics";
import Heatmap from "./components/Heatmap/Heatmap";

interface StatsProps {
  tasks: Task[];
  meta: Meta;
}

export default function StatsGrid({ tasks, meta }: StatsProps) {
  const { isDarkMode } = useTheme();
  const actualToday = getLocalDate(new Date());

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activePreset, setActivePreset] = useState<number>(30);
  const [targetGoal, setTargetGoal] = useState<number>(100);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return getLocalDate(d);
  });
  const [endDate, setEndDate] = useState(actualToday);

  const presets = [
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
    { label: '365D', days: 365 },
  ];

  useEffect(() => {
    const hasInitialized = localStorage.getItem('nexspace_onboarding_seen');
    if (!hasInitialized) setShowOnboarding(true);
  }, []);

  const handleInitialize = () => setShowOnboarding(false);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await (supabase as any)
        .from("daily_stats")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      setDailyStats(data || []);
    };

    fetchStats();
  }, [tasks]); 

  const applyPreset = (days: number) => {
    const end = getLocalDate(new Date());
    const startObj = new Date();
    startObj.setDate(startObj.getDate() - days + 1); 
    setStartDate(getLocalDate(startObj));
    setEndDate(end);
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

  const last60Days = useMemo(() => {
    const days = [];
    for (let i = 0; i < 60; i++) {
        const d = new Date(actualToday);
        d.setDate(d.getDate() - i);
        days.push(getLocalDate(d));
    }
    return days;
  }, [actualToday]);

  const totalTasks = tasks.length;

  const getDayPerf = (dateStr: string) => {
      if (totalTasks === 0) return 0;
      const done = tasks.filter(t => t.history?.[dateStr]).length;
      return done / totalTasks;
  };

  const getDayDone = (dateStr: string) => tasks.filter(t => t.history?.[dateStr]).length;

  // --- TRUTHFUL BEHAVIORAL ENGINE ---
  const {
      disciplineScore, discTrendDiff,
      consistencyScore, consistencyTrend,
      avgOutput14, avgOutTrendDiff,
      momentumScore, momentumTrend,
      zeroDays, currentStreak, previousStreak,
      totalReps, peakDay, heatmapData
  } = useMemo(() => {
      let zeroCount = 0;
      const dayCounts: Record<string, number> = {};
      let reps = 0;

      // Streaks Calculation
      let streak = 0;
      let prevStreak = 0;
      let countingCurrent = true;
      const streakDates = [...last60Days];
      
      for (let i = 0; i < streakDates.length; i++) {
          const dateStr = streakDates[i];
          const isActive = tasks.some(t => t.history?.[dateStr]);
          if (isActive) {
              if (countingCurrent) streak++;
              else prevStreak++;
          } else {
              if (i === 0 && dateStr === actualToday) continue;
              countingCurrent = false;
              if (prevStreak > 0) break;
          }
      }

      // Heatmap Data Preparation
      const heatmap = rangeDates.map(dateStr => {
          let dailyCount = getDayDone(dateStr);
          reps += dailyCount;
          dayCounts[dateStr] = dailyCount;

          const intensity = totalTasks === 0 ? 0 : dailyCount / totalTasks;
          const dayStat = dailyStats.find(s => s.date === dateStr);
          const scoreForDay = dayStat ? dayStat.score : 0;
          
          let mappedColor = isDarkMode ? "bg-emerald-500" : "bg-green-600";
          let borderClass = "border border-transparent";
          
          if (dailyCount === 0 && totalTasks > 0) {
              mappedColor = isDarkMode ? "bg-red-950/20" : "bg-red-50"; 
              borderClass = isDarkMode ? "border border-red-500/50 z-10" : "border border-red-500 z-10"; 
          } else if (intensity < 0.4) {
              mappedColor = "bg-yellow-400";
          } else if (intensity < 0.7) {
              mappedColor = isDarkMode ? "bg-emerald-600" : "bg-green-400";
          }

          return { 
              date: dateStr, 
              count: dailyCount, 
              delta: scoreForDay, 
              intensity,
              color: mappedColor,
              border: borderClass,
              jitter: (dateStr.charCodeAt(dateStr.length - 1) % 3)
          };
      });

      let peak = { date: '-', count: 0 };
      Object.entries(dayCounts).forEach(([d, c]) => {
          if (c > peak.count) peak = { date: d, count: c };
      });

      // 1. DISCIPLINE SCORE
      const disciplineWeights = [1.0, 0.95, 0.90, 0.85, 0.80, 0.75, 0.70, 0.65, 0.60, 0.55, 0.50, 0.45, 0.40, 0.35];
      let discTotalWeighted = 0;
      let discWeightSum = 0;
      for(let i=0; i<14; i++) {
          const perf = getDayPerf(last60Days[i]);
          discTotalWeighted += perf * disciplineWeights[i];
          discWeightSum += disciplineWeights[i];
      }
      let rawDiscipline = discWeightSum > 0 ? (discTotalWeighted / discWeightSum) * 100 : 0;

      const curr7D = [0,1,2,3,4,5,6].reduce((sum, i) => sum + getDayPerf(last60Days[i]), 0) / 7 * 100;
      const prev7D = [7,8,9,10,11,12,13].reduce((sum, i) => sum + getDayPerf(last60Days[i]), 0) / 7 * 100;
      
      let clampedDiscDiff = Math.max(-15, Math.min(15, curr7D - prev7D));
      rawDiscipline = (rawDiscipline * 0.75) + (curr7D * 0.25);

      // 2. CONSISTENCY SCORE
      let activeDaysCurr = 0, perfSumCurr = 0;
      for(let i=0; i<30; i++) {
          if (getDayDone(last60Days[i]) > 0) activeDaysCurr++;
          perfSumCurr += getDayPerf(last60Days[i]);
      }
      let rawConsistency = ((activeDaysCurr / 30) * 100 * 0.7) + ((perfSumCurr / 30) * 0.3 * 100);

      let activeDaysPrev = 0, perfSumPrev = 0;
      for(let i=30; i<60; i++) {
          if (getDayDone(last60Days[i]) > 0) activeDaysPrev++;
          perfSumPrev += getDayPerf(last60Days[i]);
      }
      const prevConsistency = ((activeDaysPrev / 30) * 100 * 0.7) + ((perfSumPrev / 30) * 0.3 * 100);
      let clampedConsDiff = Math.max(-20, Math.min(20, rawConsistency - prevConsistency));

      // 3. AVG OUTPUT
      let completed14 = 0, completedCurr7 = 0, completedPrev7 = 0;
      for(let i=0; i<14; i++) {
          const done = getDayDone(last60Days[i]);
          completed14 += done;
          if (i < 7) completedCurr7 += done;
          else completedPrev7 += done;
      }
      
      const avgOut14 = completed14 / 14;
      const curr7AvgOut = completedCurr7 / 7;
      const prev7AvgOut = completedPrev7 / 7;

      let clampedAvgOutTrend = Math.max(-5, Math.min(5, curr7AvgOut - prev7AvgOut));

      // 4. MOMENTUM SCORE
      const momWeights = [0.35, 0.25, 0.15, 0.10, 0.07, 0.05, 0.03];
      let rawMomentum = 0, prevRawMomentum = 0;
      for(let i=0; i<7; i++) {
          rawMomentum += getDayPerf(last60Days[i]) * momWeights[i] * 100;
          prevRawMomentum += getDayPerf(last60Days[i+7]) * momWeights[i] * 100;
      }
      
      let consecutiveZeros = 0;
      for(let i=0; i<last60Days.length; i++) {
          if (getDayDone(last60Days[i]) === 0) consecutiveZeros++;
          else break;
      }
      zeroCount = consecutiveZeros;
      if (consecutiveZeros >= 3) rawMomentum *= 0.5;
      else if (consecutiveZeros === 2) rawMomentum = Math.max(0, rawMomentum - 20);

      let consecutiveZerosPrev = 0;
      for(let i=7; i<60; i++) {
          if (getDayDone(last60Days[i]) === 0) consecutiveZerosPrev++;
          else break;
      }
      if (consecutiveZerosPrev >= 3) prevRawMomentum *= 0.5;
      else if (consecutiveZerosPrev === 2) prevRawMomentum = Math.max(0, prevRawMomentum - 20);

      let clampedMomTrendDiff = Math.max(-15, Math.min(15, rawMomentum - prevRawMomentum));

      // 5. STRONGER DECAY & PENALTY SYSTEMS (PER INACTIVE DAY)
      let inactiveDays = 0;
      for(let i=0; i<14; i++){
          if(getDayDone(last60Days[i]) === 0){
              inactiveDays++;
          }
      }

      if (totalTasks > 0 && inactiveDays > 0) {
          rawDiscipline *= Math.pow(0.82, inactiveDays);
          rawMomentum *= Math.pow(0.65, inactiveDays);
          rawConsistency *= Math.pow(0.90, inactiveDays);

          clampedDiscDiff -= inactiveDays * 1.5;
          clampedConsDiff -= inactiveDays * 1.2;
          clampedMomTrendDiff -= inactiveDays * 2.5;
      }

      // Suppress fake positive trends if absolute score is critically low
      if (rawDiscipline < 20 && clampedDiscDiff > 0) clampedDiscDiff *= 0.3;
      if (rawConsistency < 30 && clampedConsDiff > 0) clampedConsDiff *= 0.3;
      if (rawMomentum < 20 && clampedMomTrendDiff > 0) clampedMomTrendDiff *= 0.2;

      // Clamp AvgOutTrend to not exceed absolute average
      clampedAvgOutTrend = Math.max(-avgOut14, Math.min(avgOut14, clampedAvgOutTrend));

      return {
          disciplineScore: Math.round(rawDiscipline || 0),
          discTrendDiff: Number(clampedDiscDiff.toFixed(1)),
          consistencyScore: Math.round(rawConsistency || 0),
          consistencyTrend: Number(clampedConsDiff.toFixed(1)),
          avgOutput14: Number(avgOut14.toFixed(1)),
          avgOutTrendDiff: Number(clampedAvgOutTrend.toFixed(1)),
          momentumScore: Math.round(rawMomentum || 0),
          momentumTrend: Number(clampedMomTrendDiff.toFixed(1)),
          zeroDays: zeroCount,
          currentStreak: streak,
          previousStreak: prevStreak,
          totalReps: reps,
          peakDay: peak,
          heatmapData: heatmap,
      };
  }, [rangeDates, tasks, actualToday, dailyStats, isDarkMode, last60Days, totalTasks]);

  const goalProgress = Math.min(Math.round((totalReps / targetGoal) * 100), 100);
  const remainingTarget = Math.max(0, targetGoal - totalReps);
  const progressColor = goalProgress >= 100 ? "bg-emerald-500" : goalProgress < 50 ? "bg-red-500" : "bg-orange-500";
  const progressTextColor = goalProgress >= 100 ? "text-emerald-500" : goalProgress < 50 ? "text-red-500" : "text-orange-500";

  return (
    <div 
      className={`flex-1 px-4 md:px-8 pb-24 max-w-[1200px] mx-auto w-full flex flex-col gap-8 relative transition-colors duration-300 ${
        isDarkMode ? "bg-[#050505] text-white" : "bg-white text-gray-900"
      }`}
      style={{
        paddingTop: "calc(var(--navbar-h, 64px) + var(--tabs-h, 0px) + 0.5rem)"
      }}
    >

      {currentStreak === 0 && previousStreak >= 3 && zeroDays < 3 && (
        <div className={`border rounded-[20px] p-5 flex items-start gap-4 shadow-sm ${
          isDarkMode ? "bg-orange-950/20 border-orange-900/50" : "bg-orange-50 border-orange-200"
        }`}>
          <div className={`p-2.5 rounded-xl border shadow-sm mt-1 ${isDarkMode ? "bg-gray-900 border-orange-900/50" : "bg-white border-orange-200"}`}>
            <History className="text-orange-500" size={20} />
          </div>
          <div>
            <h3 className={`font-bold text-sm tracking-tight mb-1 ${isDarkMode ? "text-orange-400" : "text-orange-900"}`}>Streak Lost ⚠️</h3>
            <p className={`text-xs leading-relaxed font-medium ${isDarkMode ? "text-orange-500/80" : "text-orange-700"}`}>You had a <b>{previousStreak}-day streak</b> going. Restart the engine today before momentum fades entirely.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className={`border shadow-sm rounded-[20px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${
          isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
        }`}>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Performance Intelligence</h1>
            <p className={`text-[10px] mt-1 uppercase tracking-widest font-bold ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>Diagnostic Engine v2.0</p>
          </div>
          <div className={`flex gap-2 p-1 rounded-xl border ${isDarkMode ? "bg-black border-gray-800" : "bg-gray-100 border-gray-200"}`}>
            {presets.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.days)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activePreset === p.days 
                    ? (isDarkMode ? 'bg-gray-800 text-white shadow-md' : 'bg-white shadow-md text-gray-900') 
                    : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Metrics 
        consistencyPercent={consistencyScore} 
        consistencyDelta={consistencyTrend}
        avgPerDay={avgOutput14} 
        avgDelta={avgOutTrendDiff}
        disciplineScore={disciplineScore}
        disciplineDelta={discTrendDiff}
        momentum={momentumScore} 
        momentumDelta={momentumTrend}
        bestStreak={calculateBestStreak(tasks)} 
        currentGlobalStreak={currentStreak} 
        zeroDays={zeroDays} 
        peakDayCount={peakDay.count} 
        bestDayInsight={""} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className={`border shadow-sm rounded-[20px] p-6 flex flex-col gap-5 transition-colors ${
          isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
        }`}>
          <div className="flex justify-between items-center">
            <h3 className={`text-[10px] font-bold flex items-center uppercase tracking-widest ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
              <Target size={14} className="text-gray-500 mr-2" /> Volume Goal
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-gray-500">TARGET</span>
              <input 
                type="number" 
                value={targetGoal} 
                onChange={(e) => setTargetGoal(Number(e.target.value) || 1)} 
                className={`w-16 rounded-lg text-xs font-bold py-1 text-center outline-none border transition-all ${
                  isDarkMode ? "bg-black border-gray-800 text-white focus:border-gray-600" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-gray-400"
                }`} 
              />
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>{totalReps}</span>
              <span className="text-sm font-bold text-gray-500">/ {targetGoal}</span>
            </div>
            <div className="flex flex-col items-end">
                <div className={`text-lg font-bold leading-none ${progressTextColor}`}>
                {goalProgress}%
                </div>
                <div className="text-[10px] font-bold text-gray-500 mt-1">{remainingTarget} remaining</div>
            </div>
          </div>

          <div className={`w-full h-2 rounded-full overflow-hidden border relative ${isDarkMode ? "bg-black border-gray-800" : "bg-gray-100 border-gray-200"}`}>
            <div
              className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-out ${progressColor}`}
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>

        <div className={`border shadow-sm rounded-[20px] p-6 transition-colors ${
          isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
        }`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-[10px] font-bold uppercase tracking-widest flex items-center ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
              <BarChart3 size={14} className="mr-2"/> Output Trend
            </h3>
          </div>
          <div className="flex items-end gap-[6px] h-28 w-full px-6 overflow-hidden pt-4">
            {heatmapData.slice(-14).map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div
                  title={`${d.date}\nTasks: ${d.count}\nChange: ${d.delta !== null && d.delta > 0 ? '+' + d.delta : d.delta}`}
                  className={`w-full max-w-[12px] rounded-t-sm transition-all duration-300 cursor-pointer ${d.color} ${d.border}`}
                  style={{ height: `${Math.max(10, (d.intensity * 100) + d.jitter)}%` }}
                />
                {d.delta !== 0 && (
                  <span className={`text-[8px] font-bold mt-1 ${d.delta > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {d.delta > 0 ? `+${d.delta}` : d.delta}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-[9px] text-gray-500 mt-4 text-center font-bold uppercase tracking-widest">Daily output intensity (last 14 days)</p>
        </div>

        <div className={`border shadow-sm rounded-[20px] p-6 transition-colors ${
          isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
        }`}>
           <h3 className={`text-[10px] font-bold uppercase mb-6 tracking-widest flex items-center ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
             <LineChart size={14} className="mr-2"/> Stability Curve
           </h3>
           <div className="relative h-24 w-full px-6 flex items-end">
              <div className={`absolute inset-x-6 bottom-0 h-[1px] ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`} />
              {rangeDates.slice(-20).map((date, i, arr) => {
                const count = tasks.filter(t => t.history?.[date]).length;
                const value = tasks.length === 0 ? 0 : (count / tasks.length) * 100;
                const nextDate = arr[i + 1];
                const nextValue = nextDate ? (tasks.filter(t => t.history?.[nextDate]).length / tasks.length) * 100 : value;

                return (
                  <div key={i} className="relative flex-1 flex flex-col items-center h-full justify-end">
                    {nextDate && (
                      <div 
                        className={`absolute h-[2px] transition-all origin-left ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}
                        style={{ bottom: `${Math.max(15, value)}%`, width: "100%", transform: `rotate(${Math.atan2(nextValue - value, 100) * (180 / Math.PI)}deg)` }}
                      />
                    )}
                    <div className={`absolute w-2 h-2 rounded-full z-10 shadow-sm border ${isDarkMode ? "border-gray-900" : "border-white"} ${value >= 50 ? "bg-emerald-500" : "bg-red-500"}`} style={{ bottom: `${Math.max(15, value)}%`, transform: 'translateY(50%)' }} />
                  </div>
                );
              })}
           </div>
           <p className="text-[9px] text-gray-500 mt-4 text-center font-bold uppercase tracking-widest">Schedule Reliability Trend</p>
        </div>

        <div className="md:col-span-3">
          <Heatmap heatmapData={heatmapData} />
        </div>
      </div>
    </div>
  );
}