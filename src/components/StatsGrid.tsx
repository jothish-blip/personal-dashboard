"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Target, AlertTriangle, Activity, BrainCircuit, TrendingUp, 
  TrendingDown, Zap, ChevronUp, ChevronDown, Minus, Info,
  CheckCircle2, BarChart3, LineChart, Sparkles, ShieldCheck,
  Thermometer, MessageSquare, Fingerprint, History
} from 'lucide-react';
import { Task, Meta } from '../types';
import { getSupabaseClient } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeProvider";

import { getLocalDate, getISODay, calculateBestStreak } from './stats/utils';
import OnboardingFlow from './stats/OnboardingFlow';
import Metrics from './stats/Metrics';
import Heatmap from './stats/Heatmap';

interface StatsProps {
  tasks: Task[];
  meta: Meta;
}

const InfoHint = ({ text }: { text: string }) => {
  const { isDarkMode } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`transition-colors ${isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
      >
        <Info size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div className={`absolute z-[100] bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 border rounded-xl p-3 text-[11px] leading-relaxed shadow-lg animate-in fade-in zoom-in-95 ${
            isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-200 text-gray-600"
          }`}>
            {text}
            <div className={`absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent ${isDarkMode ? "border-t-gray-800" : "border-t-white"}`} />
          </div>
        </>
      )}
    </div>
  );
};

export default function StatsGrid({ tasks, meta }: StatsProps) {
  const { isDarkMode } = useTheme();
  const actualToday = getLocalDate(new Date());

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activePreset, setActivePreset] = useState<number>(30);
  const [targetGoal, setTargetGoal] = useState<number>(100);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [showDisciplineBreakdown, setShowDisciplineBreakdown] = useState(false);
  
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
    const hasInitialized = localStorage.getItem('nextask_onboarding_seen');
    if (!hasInitialized) setShowOnboarding(true);
  }, []);

  const handleInitialize = () => setShowOnboarding(false);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
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

  const {
    totalReps, consistencyPercent, avgPerActiveDay,
    peakDay, heatmapData, zeroDays, currentStreak, previousStreak
  } = useMemo(() => {
    let reps = 0, zeroCount = 0;
    const dayCounts: Record<string, number> = {};

    let streak = 0;
    let prevStreak = 0;
    let countingCurrent = true;
    
    const streakDates = [...rangeDates].reverse();
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

    const heatmap = rangeDates.map(dateStr => {
      let dailyCount = 0;
      tasks.forEach(t => {
        if (t.history?.[dateStr]) { dailyCount++; reps++; }
      });
      if (dailyCount === 0) zeroCount++;
      dayCounts[dateStr] = dailyCount;

      const intensity = tasks.length === 0 ? 0 : dailyCount / tasks.length;
      const dayStat = dailyStats.find(s => s.date === dateStr);
      const scoreForDay = dayStat ? dayStat.score : 0;
      
      let mappedColor = isDarkMode ? "bg-emerald-500" : "bg-green-600";
      let borderClass = "border border-transparent";
      
      if (dailyCount === 0 && tasks.length > 0) {
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

    const activeDaysCount = rangeDates.filter(date => tasks.some(t => t.history?.[date])).length;
    const actualConsistency = rangeDates.length === 0 ? 0 : Math.round((activeDaysCount / rangeDates.length) * 100);
    const avgPerActive = activeDaysCount === 0 ? 0 : Math.round((reps / activeDaysCount) * 10) / 10;

    return {
      totalReps: reps,
      consistencyPercent: actualConsistency,
      avgPerActiveDay: avgPerActive,
      peakDay: peak, 
      heatmapData: heatmap, 
      zeroDays: zeroCount,
      currentStreak: streak,
      previousStreak: prevStreak
    };
  }, [rangeDates, tasks, actualToday, dailyStats, isDarkMode]);

  const yesterday = new Date(actualToday);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = getLocalDate(yesterday);

  const scoreDelta = useMemo(() => {
    if (dailyStats.length < 2) return null;
    const todayStat = dailyStats.find(s => s.date === actualToday);
    const yesterdayStat = dailyStats.find(s => s.date === yStr);
    if (!todayStat || !yesterdayStat) return null;
    return todayStat.score - yesterdayStat.score;
  }, [dailyStats, actualToday, yStr]);

  const getIntensityColor = (delta: number | null, type: 'bg' | 'text') => {
      if (delta === null) return type === 'bg' ? 'bg-transparent text-transparent' : 'text-transparent';
      if (delta > 10) return type === 'bg' ? (isDarkMode ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' : 'bg-green-100 border-green-300 text-green-700') : (isDarkMode ? 'text-emerald-400' : 'text-green-600');
      if (delta > 0) return type === 'bg' ? (isDarkMode ? 'bg-emerald-900/10 border-emerald-800/50 text-emerald-500' : 'bg-green-50 border-green-200 text-green-500') : (isDarkMode ? 'text-emerald-500' : 'text-green-500');
      if (delta < -10) return type === 'bg' ? (isDarkMode ? 'bg-red-950/30 border-red-800 text-red-400' : 'bg-red-100 border-red-300 text-red-700') : (isDarkMode ? 'text-red-400' : 'text-red-600');
      if (delta < 0) return type === 'bg' ? (isDarkMode ? 'bg-red-900/10 border-red-800/50 text-red-500' : 'bg-red-50 border-red-200 text-red-500') : (isDarkMode ? 'text-red-500' : 'text-red-500');
      return type === 'bg' ? (isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400') : 'text-gray-400';
  };

  const momentum = useMemo(() => {
    if (dailyStats.length === 0) return 0;
    const todayStat = dailyStats.find(s => s.date === actualToday);
    const tScore = todayStat ? todayStat.score : 0;
    const past3Days = [1, 2, 3].map(days => {
      const d = new Date(actualToday);
      d.setDate(d.getDate() - days);
      return getLocalDate(d);
    });
    const recentStats = dailyStats.filter(s => past3Days.includes(s.date));
    const avg3DayScore = recentStats.length 
        ? recentStats.reduce((sum, s) => sum + s.score, 0) / recentStats.length 
        : 0;
    return Math.round(tScore - avg3DayScore);
  }, [dailyStats, actualToday]);

  const consistencyDelta = useMemo(() => {
    const prevRangeEnd = new Date(startDate);
    prevRangeEnd.setDate(prevRangeEnd.getDate() - 1);
    const prevRangeStart = new Date(prevRangeEnd);
    prevRangeStart.setDate(prevRangeStart.getDate() - rangeDates.length + 1);

    const prevRangeDates: string[] = [];
    let curr = new Date(prevRangeStart);
    while (curr <= prevRangeEnd) {
      prevRangeDates.push(getLocalDate(curr));
      curr.setDate(curr.getDate() + 1);
    }

    const prevActiveDays = prevRangeDates.filter(date => tasks.some(t => t.history?.[date])).length;
    const prevConsistency = prevRangeDates.length === 0 ? 0 : Math.round((prevActiveDays / prevRangeDates.length) * 100);
    return consistencyPercent - prevConsistency;
  }, [rangeDates, tasks, consistencyPercent, startDate]);

  const disciplineDelta = scoreDelta || 0;

  const { disciplineScore, breakdown } = useMemo(() => {
    const inactivityPenalty = zeroDays * 5;
    const streakDecay = zeroDays >= 3 ? zeroDays * 2 : 0;
    const consistencyPoints = consistencyPercent * 0.6;
    const basePoints = Math.max(0, 20 - inactivityPenalty);
    const momentumPoints = momentum > 0 ? 10 : momentum < 0 ? -5 : 5;

    let score = consistencyPoints + basePoints + momentumPoints - streakDecay;
    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    return {
        disciplineScore: finalScore,
        breakdown: {
            consistency: Math.round(consistencyPoints),
            momentum: momentumPoints,
            inactivity: -(inactivityPenalty + streakDecay)
        }
    };
  }, [consistencyPercent, zeroDays, momentum]);

  const riskScore = useMemo(() => {
    if (disciplineScore < 40) return 'High';
    if (disciplineScore < 70) return 'Medium';
    return 'Low';
  }, [disciplineScore]);

  const dailySummary = useMemo(() => {
    if (zeroDays >= 3) return "System failure detected due to prolonged inactivity. Entering recovery mode.";
    if (scoreDelta !== null && scoreDelta < -10) return "Severe drop in daily impact detected. Course correct immediately.";
    if (momentum < 0) return "Output velocity dropping compared to recent baseline. Reduce friction points.";
    if (consistencyPercent > 80) return "Execution parameters optimal. You are reinforcing a highly stable habit loop.";
    return "Stable progress detected. The primary directive is eliminating system inconsistency.";
  }, [zeroDays, momentum, consistencyPercent, scoreDelta]);

  const focusPrediction = useMemo(() => {
    if (momentum > 0 && consistencyPercent > 70) return "High momentum probability. You are positioned to perform at peak capacity tomorrow.";
    if (momentum < 0 || zeroDays >= 3) return "Forecast critical. Isolate focus strictly on completing one micro-task tomorrow.";
    return "Forecast stable. Consistency remains the primary growth lever.";
  }, [momentum, consistencyPercent, zeroDays]);

  const burnoutRisk = useMemo(() => {
    if (avgPerActiveDay > 7 && momentum < 0) return "High Burnout Risk";
    if (avgPerActiveDay > 6) return "Moderate Burnout Risk";
    return "Stable Load";
  }, [avgPerActiveDay, momentum]);

  const motivation = useMemo(() => {
    if (zeroDays >= 3) return "Execution chain broken. Identity reset required. Restart immediately with 1 small task.";
    if (currentStreak === 0 && previousStreak >= 3) return `You lost a ${previousStreak}-day streak. Do not let the gap widen. Reboot today.`;
    const isDropping = momentum < 0;
    if (avgPerActiveDay > 7 && isDropping) return "High load detected. Initiate recovery protocols. Rest is part of discipline.";
    if (currentStreak >= 7) return `Protect the ${currentStreak}-day streak. Keep the unbroken chain.`;
    if (isDropping) return "Execution slipping. Reset parameters now before the day closes.";
    return "System in optimal control. Execute operations without hesitation.";
  }, [zeroDays, momentum, avgPerActiveDay, currentStreak, previousStreak]);

  const behaviorType = useMemo(() => {
    if (zeroDays >= 3) return "Recovery Phase";
    if (consistencyPercent > 85) return "Consistent Executor";
    if (zeroDays > 4) return "Irregular Performer";
    if (avgPerActiveDay > 5) return "High-Intensity Burst";
    return "Building Discipline";
  }, [consistencyPercent, zeroDays, avgPerActiveDay]);

  const goalProgress = Math.min(Math.round((totalReps / targetGoal) * 100), 100);
  const remainingTarget = Math.max(0, targetGoal - totalReps);
  const progressColor = goalProgress >= 100 ? "bg-emerald-500" : goalProgress < 50 ? "bg-red-500" : "bg-orange-500";
  const progressTextColor = goalProgress >= 100 ? "text-emerald-500" : goalProgress < 50 ? "text-red-500" : "text-orange-500";

  return (
    <div 
      // 🔥 FIX: Changed px/pb to prevent top-padding double stacking and set the gap tighter
      className={`flex-1 px-4 md:px-8 pb-24 max-w-[1200px] mx-auto w-full flex flex-col gap-8 relative transition-colors duration-300 ${
        isDarkMode ? "bg-[#050505] text-white" : "bg-white text-gray-900"
      }`}
      style={{
        // 🔥 FIX: Reduced the gap from 1.5rem to 0.5rem so it sits much higher and closer to the navbar
        paddingTop: "calc(var(--navbar-h, 64px) + var(--tabs-h, 0px) + 0.5rem)"
      }}
    >
      
      {showOnboarding && <OnboardingFlow onComplete={handleInitialize} />}

      {/* BEHAVIORAL WARNINGS */}
      {zeroDays >= 3 && (
        <div className={`border rounded-[20px] p-5 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 ${
          isDarkMode ? "bg-red-950/20 border-red-900/50" : "bg-red-50 border-red-200"
        }`}>
          <div className={`p-2.5 rounded-xl border shadow-sm mt-1 ${isDarkMode ? "bg-gray-900 border-red-900/50" : "bg-white border-red-200"}`}>
            <AlertTriangle className="text-red-500" size={20} />
          </div>
          <div>
            <h3 className={`font-bold text-sm tracking-tight mb-1 ${isDarkMode ? "text-red-400" : "text-red-900"}`}>Inactivity Detected</h3>
            <p className={`text-xs leading-relaxed font-medium ${isDarkMode ? "text-red-500/80" : "text-red-700"}`}>You missed {zeroDays} days in this range. Discipline score was heavily penalized. <br/><b>Recovery Mode Activated:</b> Goal is to complete 1 task today.</p>
          </div>
        </div>
      )}

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

      {/* HEADER SECTION */}
      <div className="space-y-4">
        <div className={`border shadow-sm rounded-[20px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${
          isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Performance Intelligence</h1>
              {scoreDelta !== null && scoreDelta !== 0 && (
                <div className={`flex items-center gap-2 text-sm font-extrabold px-3 py-1 rounded-full border transition-all ${getIntensityColor(scoreDelta, 'bg')}`}>
                  {scoreDelta > 0 ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  <span className="text-lg">
                    {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
                  </span>
                </div>
              )}
            </div>
            <p className={`text-[10px] mt-1 uppercase tracking-widest font-bold ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>Diagnostic Engine v2.0</p>
            <p className={`text-[11px] font-semibold mt-1 ${scoreDelta !== null ? getIntensityColor(scoreDelta, 'text') : 'text-gray-500'}`}>
              {scoreDelta !== null && scoreDelta !== 0 && (
                scoreDelta > 0
                  ? `+${scoreDelta} improvement from yesterday`
                  : `${scoreDelta} drop from yesterday`
              )}
            </p>
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

      {/* 🥇 PRIMARY INTELLIGENCE LAYER */}
      <div className="space-y-4">
        <p className={`text-[10px] uppercase font-bold tracking-widest px-1 ${isDarkMode ? "text-gray-600" : "text-gray-500"}`}>Primary Signals</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className={`md:col-span-2 bg-gradient-to-r ${isDarkMode ? "from-emerald-900 to-[#0a0a0a]" : "from-emerald-500 to-emerald-600"} rounded-[24px] p-6 text-white shadow-md flex items-center gap-4 group relative overflow-hidden`}>
            <div className={`border p-3 rounded-2xl group-hover:rotate-12 transition-transform z-10 backdrop-blur-sm ${isDarkMode ? "bg-emerald-500/20 border-emerald-500/30" : "bg-white/20 border-white/10"}`}>
                <Sparkles size={24} className="text-white" />
            </div>
            <div className="z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-1">Current Directive</p>
                <p className="text-lg font-semibold leading-snug">{motivation}</p>
            </div>
          </div>

          <div 
             className={`border shadow-sm rounded-[24px] p-6 transition-all duration-200 flex flex-col justify-center relative group cursor-pointer ${
               isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
             }`}
             onMouseEnter={() => setShowDisciplineBreakdown(true)}
             onMouseLeave={() => setShowDisciplineBreakdown(false)}
          >
            <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 flex items-center gap-1 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                Discipline Score <Info size={10} className="text-gray-400"/>
            </p>
            <div className="flex items-baseline gap-1">
              <p className={`text-4xl font-black leading-none ${isDarkMode ? "text-white" : "text-gray-900"}`}>{disciplineScore}</p>
              <p className="text-sm font-bold text-gray-400">/ 100</p>
            </div>
            <div className={`mt-3 inline-block w-max text-[10px] font-black px-2 py-0.5 rounded-md border ${
               disciplineScore >= 70 ? (isDarkMode ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50" : "bg-green-50 text-green-600 border-green-200") : 
               disciplineScore <= 40 ? (isDarkMode ? "bg-red-950/30 text-red-400 border-red-900/50" : "bg-red-50 text-red-600 border-red-200") : 
               (isDarkMode ? "bg-gray-800 text-gray-400 border-gray-700" : "bg-gray-50 text-gray-600 border-gray-200")
            }`}>
              {disciplineScore >= 70 ? "ELITE" : disciplineScore <= 40 ? "AT RISK" : "STABLE"}
            </div>

            {showDisciplineBreakdown && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl p-4 shadow-xl z-50 text-xs font-medium border animate-in fade-in slide-in-from-top-2 ${
                  isDarkMode ? "bg-[#1a1a1a] text-gray-300 border-gray-800" : "bg-gray-900 text-white border-gray-700"
                }`}>
                    <p className="font-bold text-[10px] uppercase tracking-widest text-gray-500 mb-2 border-b border-gray-700/50 pb-2">Score Breakdown</p>
                    <div className="flex justify-between py-1"><span>Consistency Base</span> <span className="text-emerald-400">+{breakdown.consistency}</span></div>
                    <div className="flex justify-between py-1"><span>Momentum Shift</span> <span className={breakdown.momentum > 0 ? "text-emerald-400" : "text-red-400"}>{breakdown.momentum > 0 ? '+' : ''}{breakdown.momentum}</span></div>
                    <div className="flex justify-between py-1 border-t border-gray-700/50 mt-1 pt-2"><span>Inactivity Penality</span> <span className="text-red-400">{breakdown.inactivity}</span></div>
                </div>
            )}
          </div>

          <div className={`border shadow-sm rounded-[24px] p-6 transition-all duration-200 flex flex-col justify-center relative ${
            isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
          }`}>
            <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 flex items-center gap-1 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>Daily Impact</p>
            <div className="flex flex-col mt-1">
              <p className={`text-5xl font-black tracking-tight ${
                scoreDelta !== null && scoreDelta > 0 ? "text-emerald-500" :
                scoreDelta !== null && scoreDelta < 0 ? "text-red-500" : "text-gray-600"
              }`}>
                {scoreDelta !== null && scoreDelta !== 0 ? (scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta) : "-"}
              </p>
              {scoreDelta !== null && scoreDelta !== 0 && (
                <p className={`text-xs font-bold mt-2 uppercase tracking-widest ${scoreDelta > 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {scoreDelta > 0 ? "GAIN" : "LOSS"}
                </p>
              )}
            </div>
            <p className="text-[10px] font-bold text-gray-500 mt-3 tracking-widest uppercase">Compared to Yesterday</p>
          </div>
        </div>

        {/* 🥈 SECONDARY INTELLIGENCE LAYER */}
        <p className={`text-[10px] uppercase font-bold tracking-widest px-1 mt-6 ${isDarkMode ? "text-gray-600" : "text-gray-500"}`}>Interpretation & Forecast</p>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className={`md:col-span-2 border shadow-sm rounded-[20px] p-5 flex items-start gap-4 transition-colors ${
            isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
          }`}>
            <div className={`p-2.5 rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <BrainCircuit size={18} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
            </div>
            <div>
                <span className={`font-bold block text-[10px] uppercase mb-1 tracking-tight ${isDarkMode ? "text-gray-400" : "text-gray-900"}`}>AI Summary</span>
                <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>{dailySummary}</p>
            </div>
          </div>

          <div className={`${zeroDays >= 3 ? 'bg-red-500' : 'bg-gray-900'} rounded-[20px] p-5 text-white flex flex-col justify-between hover:shadow-md transition-all shadow-sm relative overflow-hidden`}>
            <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-white/70">
                <Zap size={14} /> Forecast
            </div>
            <p className="text-xs font-bold mt-2 leading-relaxed z-10">{focusPrediction}</p>
          </div>

          <div className={`border shadow-sm rounded-[20px] p-5 transition-colors ${
            isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
          }`}>
            <p className={`text-[10px] uppercase font-bold tracking-tight mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>Burnout Signal</p>
            <div className="flex items-center gap-2">
                <Thermometer size={16} className={burnoutRisk === "Stable Load" ? "text-emerald-500" : "text-orange-500"} />
                <span className={`text-xs font-bold uppercase ${
                    burnoutRisk === "High Burnout Risk" ? "text-red-500" :
                    burnoutRisk === "Moderate Burnout Risk" ? "text-orange-500" :
                    "text-emerald-500"
                }`}>
                    {burnoutRisk}
                </span>
            </div>
          </div>
        </div>
      </div>

      <Metrics 
        consistencyPercent={consistencyPercent} 
        consistencyDelta={consistencyDelta}
        avgPerDay={avgPerActiveDay} 
        avgDelta={momentum}
        disciplineScore={disciplineScore}
        disciplineDelta={disciplineDelta}
        momentum={momentum} 
        bestStreak={calculateBestStreak(tasks)} 
        currentGlobalStreak={currentStreak} 
        zeroDays={zeroDays} 
        peakDayCount={peakDay.count} 
        bestDayInsight={""} 
      />

      {/* DATA VISUALIZATION LAYER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TARGET VS ACTUAL */}
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

        {/* BEHAVIORAL RISK AUDIT */}
        <div className={`border shadow-sm rounded-[20px] p-6 transition-colors ${
          isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
        }`}>
          <div className="flex justify-between items-center mb-4">
             <h3 className={`text-[10px] font-bold flex items-center uppercase tracking-widest ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
               <ShieldCheck size={14} className="text-gray-500 mr-2" /> Behavioral Risk
             </h3>
             <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
               riskScore === 'High' ? 'bg-red-950/30 text-red-400 border-red-900/50' : 
               riskScore === 'Medium' ? 'bg-orange-950/30 text-orange-400 border-orange-900/50' : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50'
             }`}>
               {riskScore} Risk
             </div>
          </div>
          <div className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
            isDarkMode ? "bg-black border-gray-800" : "bg-gray-50 border-gray-200"
          }`}>
            <div className={`p-2.5 rounded-xl border shadow-sm ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
              <Activity className={zeroDays >= 3 ? "text-red-500" : "text-blue-500"} size={18} />
            </div>
            <div>
              <p className={`text-sm font-bold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>{behaviorType}</p>
              <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-tight">
                {zeroDays >= 3 ? "Severe friction detected. Habit collapsing." : zeroDays > 2 ? "Friction detected in range" : "Habit structural integrity is high"}
              </div>
            </div>
          </div>
        </div>

        {/* CHARTS */}
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

        <div className="md:col-span-2">
          <Heatmap heatmapData={heatmapData} />
        </div>
      </div>
    </div>
  );
}