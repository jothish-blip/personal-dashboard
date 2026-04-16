"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Target, AlertTriangle, Activity, BrainCircuit, TrendingUp, 
  TrendingDown, Zap, ChevronUp, ChevronDown, Minus, Info,
  CheckCircle2, BarChart3, LineChart, Sparkles, ShieldCheck,
  Thermometer, MessageSquare, Fingerprint
} from 'lucide-react';
import { Task, Meta } from '../types';

import { getLocalDate, getISODay, calculateBestStreak } from './stats/utils';
import OnboardingFlow from './stats/OnboardingFlow';
import Metrics from './stats/Metrics';
import Heatmap from './stats/Heatmap';

interface StatsProps {
  tasks: Task[];
  meta: Meta;
}

const InfoHint = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Info size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div className="absolute z-[100] bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 bg-white border border-gray-200 rounded-xl p-3 text-[11px] leading-relaxed text-gray-600 shadow-lg animate-in fade-in zoom-in-95">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white" />
          </div>
        </>
      )}
    </div>
  );
};

export default function StatsGrid({ tasks, meta }: StatsProps) {
  const actualToday = getLocalDate(new Date());

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activePreset, setActivePreset] = useState<number>(30);
  const [targetGoal, setTargetGoal] = useState<number>(100);
  
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
    peakDay, heatmapData, zeroDays
  } = useMemo(() => {
    let reps = 0, zeroCount = 0;
    const dayCounts: Record<string, number> = {};

    const heatmap = rangeDates.map(dateStr => {
      let dailyCount = 0;
      tasks.forEach(t => {
        if (t.history?.[dateStr]) { dailyCount++; reps++; }
      });
      if (dailyCount === 0) zeroCount++;
      dayCounts[dateStr] = dailyCount;
      
      return { 
        date: dateStr, 
        count: dailyCount, 
        intensity: tasks.length === 0 ? 0 : dailyCount / tasks.length,
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
      zeroDays: zeroCount
    };
  }, [rangeDates, tasks]);

  const momentum = useMemo(() => {
    const todayCount = tasks.filter(t => t.history?.[actualToday]).length;
    const d = new Date(actualToday);
    d.setDate(d.getDate() - 1);
    const yesterdayCount = tasks.filter(t => t.history?.[getLocalDate(d)]).length;
    return todayCount - yesterdayCount;
  }, [tasks, actualToday]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    const d = new Date(actualToday);
    
    let currentDateStr = getLocalDate(d);
    let todayActive = tasks.some(t => t.history?.[currentDateStr]);
    
    if (!todayActive) {
        d.setDate(d.getDate() - 1);
        currentDateStr = getLocalDate(d);
    }

    while (tasks.some(t => t.history?.[currentDateStr])) {
      streak++;
      d.setDate(d.getDate() - 1);
      currentDateStr = getLocalDate(d);
    }
    
    return streak;
  }, [tasks, actualToday]);

  // --- REFINED INTELLIGENCE LOGIC ---

  const disciplineScore = useMemo(() => {
    let score = 0;
    score += consistencyPercent * 0.6;
    score += Math.max(0, 20 - zeroDays * 5);
    score += momentum > 0 ? 10 : momentum < 0 ? -5 : 5;
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [consistencyPercent, zeroDays, momentum]);

  const riskScore = useMemo(() => {
    if (disciplineScore < 40) return 'High';
    if (disciplineScore < 70) return 'Medium';
    return 'Low';
  }, [disciplineScore]);

  const dailySummary = useMemo(() => {
    if (zeroDays > 2) return "System underperforming due to missed execution windows. Consistency takes priority over raw intensity.";
    if (momentum < 0) return "Output velocity dropping compared to previous cycle. Reduce friction points and initiate restart.";
    if (consistencyPercent > 80) return "Execution parameters optimal. You are reinforcing a highly stable habit loop.";
    return "Stable progress detected. The primary directive is eliminating system inconsistency.";
  }, [zeroDays, momentum, consistencyPercent]);

  const burnoutRisk = useMemo(() => {
    if (avgPerActiveDay > 7 && momentum < 0) return "High Burnout Risk";
    if (avgPerActiveDay > 6) return "Moderate Burnout Risk";
    return "Stable Load";
  }, [avgPerActiveDay, momentum]);

  const motivation = useMemo(() => {
    const hour = new Date().getHours();

    // --- TIME CONTEXT ---
    let timeContext = "";
    if (hour < 12) timeContext = "morning";
    else if (hour < 18) timeContext = "afternoon";
    else timeContext = "night";

    // --- PERFORMANCE STATE ---
    const isStruggling = zeroDays > 2 || consistencyPercent < 50;
    const isDropping = momentum < 0;
    const isStrong = consistencyPercent > 80 && momentum >= 0;
    const isBurningOut = avgPerActiveDay > 7 && momentum < 0;

    // --- STREAK CONTEXT ---
    if (currentStreak >= 7 && !isBurningOut) {
        return timeContext === "morning"
          ? `Protect the ${currentStreak}-day streak. Start strong.`
          : "Streak integrity verified. Keep the unbroken chain.";
    }

    if (currentStreak === 0 && isStruggling) {
        return timeContext === "morning"
           ? "Identity reset required. One completed task starts the engine."
           : "Zero streak detected. Execute a single task to reboot the system.";
    }

    // --- MOTIVATION ENGINE ---
    if (isBurningOut) {
      return timeContext === "night"
        ? "High load detected. Initiate recovery protocols. Rest is part of discipline."
        : "Reduce operational intensity. Sustain the system, not just the output.";
    }

    if (isStruggling) {
      return timeContext === "morning"
        ? "Initialize small operations today. One execution restarts momentum."
        : "Break the zero-day cycle. A single completion alters the trajectory.";
    }

    if (isDropping) {
      return timeContext === "afternoon"
        ? "Execution slipping. Reset parameters now before the day closes."
        : "Momentum drop detected. Isolate focus on finishing one core task.";
    }

    if (isStrong) {
      return timeContext === "morning"
        ? "System in optimal control. Execute operations without hesitation."
        : "Strong consistency threshold met. Continue stacking wins.";
    }

    return timeContext === "night"
      ? "Close the daily cycle with intent. Finish what matters."
      : "Maintain consistency. That is your primary structural advantage.";
  }, [consistencyPercent, zeroDays, momentum, avgPerActiveDay, currentStreak]);

  const behaviorType = useMemo(() => {
    if (consistencyPercent > 85) return "Consistent Executor";
    if (zeroDays > 4) return "Irregular Performer";
    if (avgPerActiveDay > 5) return "High-Intensity Burst";
    return "Building Discipline";
  }, [consistencyPercent, zeroDays, avgPerActiveDay]);

  const focusPrediction = useMemo(() => {
    if (momentum > 0 && consistencyPercent > 70)
      return "High momentum probability. You are positioned to perform at peak capacity tomorrow.";
    if (momentum < 0)
      return "Execution velocity slowing. Focus strictly on completing one micro-task tomorrow.";
    return "Forecast stable. Consistency remains the primary growth lever.";
  }, [momentum, consistencyPercent]);

  const goalProgress = Math.min(Math.round((totalReps / targetGoal) * 100), 100);

  return (
    <div className="flex-1 p-4 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8 pb-24 relative bg-white text-gray-900 selection:bg-gray-200">
      
      {showOnboarding && <OnboardingFlow onComplete={handleInitialize} />}

      {/* HEADER SECTION */}
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 shadow-sm rounded-[20px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Performance Intelligence</h1>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 ${momentum >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {momentum > 0 ? <ChevronUp size={12}/> : momentum < 0 ? <ChevronDown size={12}/> : <Minus size={12}/>}
                {momentum !== 0 ? Math.abs(momentum) : 'Stable'}
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">Diagnostic Engine v2.0</p>
          </div>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
            {presets.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.days)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activePreset === p.days ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* SYSTEM STATUS STRIP */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 flex justify-between items-center">
          <span className="flex items-center gap-2"><Fingerprint size={12}/> System Status</span>
          <span className={`${disciplineScore > 70 ? "text-green-500" : "text-orange-500"}`}>
            {disciplineScore > 70 ? "Optimized" : "Needs Stabilization"}
          </span>
        </div>
      </div>

      {/* 🥇 PRIMARY INTELLIGENCE LAYER */}
      <div className="space-y-4">
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest px-1">Primary Signals</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Motivation - PRIMARY */}
          <div className="md:col-span-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[24px] p-6 text-white shadow-md flex items-center gap-4 hover:shadow-lg transition-all duration-200 group relative overflow-hidden">
            <div className="bg-white/20 border border-white/10 p-3 rounded-2xl group-hover:rotate-12 transition-transform z-10 backdrop-blur-sm">
                <Sparkles size={24} className="text-white" />
            </div>
            <div className="z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-1">Current Directive</p>
                <p className="text-lg font-semibold leading-snug">{motivation}</p>
            </div>
          </div>

          {/* Discipline Score - PRIMARY */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-[24px] p-6 transition-all duration-200 flex flex-col justify-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Discipline Score</p>
            <div className="flex items-baseline gap-1">
              <p className="text-4xl font-black text-gray-900 leading-none">{disciplineScore}</p>
              <p className="text-sm font-bold text-gray-400">/ 100</p>
            </div>
            <div className={`mt-3 inline-block w-max text-[10px] font-black px-2 py-0.5 rounded-md border ${
              disciplineScore > 80 ? "bg-green-50 text-green-600 border-green-200" : "bg-blue-50 text-blue-600 border-blue-200"
            }`}>
              {disciplineScore > 80 ? "ELITE" : disciplineScore > 50 ? "STABLE" : "AT RISK"}
            </div>
          </div>
        </div>

        {/* 🥈 SECONDARY INTELLIGENCE LAYER */}
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest px-1 mt-6">Interpretation & Forecast</p>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="md:col-span-2 bg-white border border-gray-200 shadow-sm rounded-[20px] p-5 flex items-start gap-4">
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <BrainCircuit size={18} className="text-gray-500" />
            </div>
            <div>
                <span className="font-bold text-gray-900 block text-[10px] uppercase mb-1 tracking-tight">AI Summary</span>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">{dailySummary}</p>
            </div>
          </div>

          <div className="bg-orange-500 rounded-[20px] p-5 text-white flex flex-col justify-between hover:shadow-md transition-all shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-orange-100">
                <Zap size={14} /> Forecast
            </div>
            <p className="text-xs font-bold mt-2 leading-relaxed z-10">{focusPrediction}</p>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-[20px] p-5">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight mb-2">Burnout Signal</p>
            <div className="flex items-center gap-2">
                <Thermometer size={16} className={burnoutRisk === "Stable Load" ? "text-green-500" : "text-orange-500"} />
                <span className={`text-xs font-bold uppercase ${
                    burnoutRisk === "High Burnout Risk" ? "text-red-500" :
                    burnoutRisk === "Moderate Burnout Risk" ? "text-orange-500" :
                    "text-green-500"
                }`}>
                    {burnoutRisk}
                </span>
            </div>
          </div>
        </div>
      </div>

      <Metrics 
        consistencyPercent={consistencyPercent} 
        avgPerDay={avgPerActiveDay} 
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
        <div className="bg-white border border-gray-200 shadow-sm rounded-[20px] p-6 flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-bold text-gray-900 flex items-center uppercase tracking-widest">
              <Target size={14} className="text-gray-500 mr-2" /> Volume Goal
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-gray-500">TARGET</span>
              <input 
                type="number" 
                value={targetGoal} 
                onChange={(e) => setTargetGoal(Number(e.target.value) || 1)} 
                className="w-16 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg text-xs font-bold py-1 text-center outline-none focus:border-gray-400 focus:bg-white transition-all" 
              />
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-gray-900">{totalReps}</span>
              <span className="text-sm font-bold text-gray-400">/ {targetGoal}</span>
            </div>
            <div className={`text-lg font-bold ${goalProgress >= 100 ? "text-green-500" : "text-blue-500"}`}>
              {goalProgress}%
            </div>
          </div>

          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-200">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${goalProgress >= 100 ? "bg-green-500" : "bg-blue-500"}`}
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>

        {/* BEHAVIORAL RISK AUDIT */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-[20px] p-6">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-[10px] font-bold text-gray-900 flex items-center uppercase tracking-widest">
               <ShieldCheck size={14} className="text-gray-500 mr-2" /> Behavioral Risk
             </h3>
             <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
               riskScore === 'High' ? 'bg-red-50 text-red-600 border-red-200' : 
               riskScore === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200'
             }`}>
               {riskScore} Risk
             </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm">
              <Activity className="text-blue-500" size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{behaviorType}</p>
              <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-tight">
                {zeroDays > 2 ? "Friction detected in range" : "Habit structural integrity is high"}
              </div>
            </div>
          </div>
        </div>

        {/* CHARTS */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-[20px] p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center">
              <BarChart3 size={14} className="mr-2"/> Output Trend
            </h3>
          </div>
          <div className="flex items-end gap-[6px] h-24 w-full px-6 overflow-hidden">
            {heatmapData.slice(-14).map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div
                  title={`${d.date}: ${d.count} tasks`}
                  className={`w-full max-w-[12px] rounded-t-sm transition-all duration-300 cursor-pointer ${
                    d.intensity === 0 ? "bg-gray-100" : 
                    d.intensity < 0.4 ? "bg-gray-300" : 
                    d.intensity < 0.7 ? "bg-blue-400" : "bg-blue-600"
                  }`}
                  style={{ height: `${Math.max(10, (d.intensity * 100) + d.jitter)}%` }}
                />
              </div>
            ))}
          </div>
          <p className="text-[9px] text-gray-400 mt-4 text-center font-bold uppercase tracking-widest">Daily output intensity (last 14 days)</p>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-[20px] p-6">
           <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-6 tracking-widest flex items-center">
             <LineChart size={14} className="mr-2"/> Stability Curve
           </h3>
           <div className="relative h-24 w-full px-6 flex items-end">
              <div className="absolute inset-x-6 bottom-0 h-[1px] bg-gray-200" />
              {rangeDates.slice(-20).map((date, i, arr) => {
                const count = tasks.filter(t => t.history?.[date]).length;
                const value = tasks.length === 0 ? 0 : (count / tasks.length) * 100;
                const nextDate = arr[i + 1];
                const nextValue = nextDate ? (tasks.filter(t => t.history?.[nextDate]).length / tasks.length) * 100 : value;

                return (
                  <div key={i} className="relative flex-1 flex flex-col items-center h-full justify-end">
                    {nextDate && (
                      <div 
                        className="absolute h-[2px] bg-gray-300 transition-all origin-left"
                        style={{ bottom: `${Math.max(15, value)}%`, width: "100%", transform: `rotate(${Math.atan2(nextValue - value, 100) * (180 / Math.PI)}deg)` }}
                      />
                    )}
                    <div className="absolute w-2 h-2 bg-blue-500 rounded-full z-10 shadow-sm border border-white" style={{ bottom: `${Math.max(15, value)}%`, transform: 'translateY(50%)' }} />
                  </div>
                );
              })}
           </div>
           <p className="text-[9px] text-gray-400 mt-4 text-center font-bold uppercase tracking-widest">Schedule Reliability Trend</p>
        </div>

        <div className="md:col-span-2">
          <Heatmap heatmapData={heatmapData} />
        </div>
      </div>
    </div>
  );
}