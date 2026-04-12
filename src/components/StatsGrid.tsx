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
          <div className="absolute z-[100] bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 bg-white border border-gray-200 rounded-xl p-3 text-[11px] leading-relaxed text-gray-600 shadow-xl animate-in fade-in zoom-in-95">
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
    if (zeroDays > 2) return "You underperformed due to missed days. Consistency matters more than intensity.";
    if (momentum < 0) return "Your output dropped compared to yesterday. Reduce friction and restart small.";
    if (consistencyPercent > 80) return "Strong execution. You are reinforcing a stable habit loop.";
    return "Decent progress. The next step is eliminating inconsistency.";
  }, [zeroDays, momentum, consistencyPercent]);

  const burnoutRisk = useMemo(() => {
    if (avgPerActiveDay > 7 && momentum < 0) return "High Burnout Risk";
    if (avgPerActiveDay > 6) return "Moderate Burnout Risk";
    return "Stable Load";
  }, [avgPerActiveDay, momentum]);

  const motivation = useMemo(() => {
    if (consistencyPercent > 80) return "Discipline compounds. Keep showing up.";
    if (zeroDays > 2) return "One small step today breaks the pattern.";
    if (momentum < 0) return "Reset. Restart. Rebuild.";
    return "Stay consistent. That’s the real edge.";
  }, [consistencyPercent, zeroDays, momentum]);

  const behaviorType = useMemo(() => {
    if (consistencyPercent > 85) return "Consistent Executor";
    if (zeroDays > 4) return "Irregular Performer";
    if (avgPerActiveDay > 5) return "High-Intensity Burst";
    return "Building Discipline";
  }, [consistencyPercent, zeroDays, avgPerActiveDay]);

  const focusPrediction = useMemo(() => {
    if (momentum > 0 && consistencyPercent > 70)
      return "Strong momentum. You are likely to perform at peak capacity tomorrow.";
    if (momentum < 0)
      return "Execution is slowing. Focus on completing just one small task tomorrow.";
    return "Prediction stable. Consistency is the primary growth lever right now.";
  }, [momentum, consistencyPercent]);

  const goalProgress = Math.min(Math.round((totalReps / targetGoal) * 100), 100);

  return (
    <div className="flex-1 p-4 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8 pb-24 relative bg-white">
      
      {showOnboarding && <OnboardingFlow onComplete={handleInitialize} />}

      {/* HEADER SECTION */}
      <div className="space-y-4">
        <div className="bg-white border border-gray-100 rounded-[20px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Performance Intelligence</h1>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 ${momentum >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {momentum > 0 ? <ChevronUp size={12}/> : momentum < 0 ? <ChevronDown size={12}/> : <Minus size={12}/>}
                {momentum !== 0 ? Math.abs(momentum) : 'Stable'}
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Diagnostic Engine v2.0</p>
          </div>
          <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
            {presets.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.days)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activePreset === p.days ? 'bg-white shadow-md text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
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
        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest px-1">Primary Signals</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Motivation - PRIMARY */}
          <div className="md:col-span-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[24px] p-6 text-white shadow-lg shadow-blue-100 flex items-center gap-4 hover:scale-[1.01] transition-all duration-200 group">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md group-hover:rotate-12 transition-transform">
                <Sparkles size={24} className="text-white" />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Current Motivation</p>
                <p className="text-lg font-semibold leading-snug">{motivation}</p>
            </div>
          </div>

          {/* Discipline Score - PRIMARY */}
          <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-center">
            <p className="text-[10px] text-blue-500 uppercase font-bold tracking-widest mb-1">Discipline Score</p>
            <div className="flex items-baseline gap-1">
              <p className="text-4xl font-black text-gray-900 leading-none">{disciplineScore}</p>
              <p className="text-sm font-bold text-gray-300">/ 100</p>
            </div>
            <div className={`mt-3 inline-block w-max text-[10px] font-black px-2 py-0.5 rounded-md ${
              disciplineScore > 80 ? "bg-green-500 text-white" : "bg-blue-500 text-white"
            }`}>
              {disciplineScore > 80 ? "ELITE" : disciplineScore > 50 ? "STABLE" : "AT RISK"}
            </div>
          </div>
        </div>

        {/* 🥈 SECONDARY INTELLIGENCE LAYER */}
        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest px-1 mt-6">Interpretation & Forecast</p>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="md:col-span-2 bg-white border border-gray-100 rounded-[20px] p-5 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <BrainCircuit size={18} className="text-gray-500" />
            </div>
            <div>
                <span className="font-bold text-gray-900 block text-[10px] uppercase mb-1 tracking-tight">AI Summary</span>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">{dailySummary}</p>
            </div>
          </div>

          <div className="bg-orange-500 rounded-[20px] p-5 text-white shadow-md flex flex-col justify-between hover:scale-[1.01] transition-all">
            <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest opacity-80">
                <Zap size={14} /> Forecast
            </div>
            <p className="text-xs font-bold mt-2 leading-relaxed">{focusPrediction}</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight mb-2">Burnout Signal</p>
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
        currentGlobalStreak={0} 
        zeroDays={zeroDays} 
        peakDayCount={peakDay.count} 
        bestDayInsight={""} 
      />

      {/* DATA VISUALIZATION LAYER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TARGET VS ACTUAL */}
        <div className="bg-white border border-gray-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-bold text-gray-900 flex items-center uppercase tracking-widest">
              <Target size={14} className="text-orange-500 mr-2" /> Volume Goal
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-gray-400">TARGET</span>
              <input 
                type="number" 
                value={targetGoal} 
                onChange={(e) => setTargetGoal(Number(e.target.value) || 1)} 
                className="w-16 bg-gray-50 border-none rounded-lg text-xs font-bold py-1 text-center outline-none focus:ring-1 focus:ring-orange-200" 
              />
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-gray-900">{totalReps}</span>
              <span className="text-sm font-bold text-gray-300">/ {targetGoal}</span>
            </div>
            <div className={`text-lg font-bold ${goalProgress >= 100 ? "text-green-500" : "text-orange-500"}`}>
              {goalProgress}%
            </div>
          </div>

          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${goalProgress >= 100 ? "bg-green-500" : "bg-orange-500"}`}
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>

        {/* BEHAVIORAL RISK AUDIT */}
        <div className="bg-white border border-gray-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-[10px] font-bold text-gray-900 flex items-center uppercase tracking-widest">
               <ShieldCheck size={14} className="text-blue-500 mr-2" /> Behavioral Risk
             </h3>
             <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
               riskScore === 'High' ? 'bg-red-500 text-white' : 
               riskScore === 'Medium' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
             }`}>
               {riskScore} Risk
             </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="p-2.5 bg-white rounded-xl shadow-sm">
              <Activity className="text-blue-500" size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{behaviorType}</p>
              <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">
                {zeroDays > 2 ? "Friction detected in range" : "Habit structural integrity is high"}
              </div>
            </div>
          </div>
        </div>

        {/* CHARTS */}
        <div className="bg-white border border-gray-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
              <BarChart3 size={14} className="mr-2"/> Output Trend
            </h3>
          </div>
          <div className="flex items-end gap-[6px] h-24 w-full px-6 overflow-hidden">
            {heatmapData.slice(-14).map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div
                  title={`${d.date}: ${d.count} tasks`}
                  className={`w-full max-w-[12px] rounded-t-sm transition-all duration-300 hover:brightness-110 cursor-pointer ${
                    d.intensity === 0 ? "bg-red-100" : 
                    d.intensity < 0.4 ? "bg-orange-500" : 
                    d.intensity < 0.7 ? "bg-blue-500" : "bg-green-500"
                  }`}
                  style={{ height: `${Math.max(10, (d.intensity * 100) + d.jitter)}%` }}
                />
              </div>
            ))}
          </div>
          <p className="text-[9px] text-gray-400 mt-4 text-center font-bold uppercase tracking-widest">Daily output intensity (last 14 days)</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all">
           <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-6 tracking-widest flex items-center">
             <LineChart size={14} className="mr-2"/> Stability Curve
           </h3>
           <div className="relative h-24 w-full px-6 flex items-end">
              <div className="absolute inset-x-6 bottom-0 h-[1px] bg-gray-100" />
              {rangeDates.slice(-20).map((date, i, arr) => {
                const count = tasks.filter(t => t.history?.[date]).length;
                const value = tasks.length === 0 ? 0 : (count / tasks.length) * 100;
                const nextDate = arr[i + 1];
                const nextValue = nextDate ? (tasks.filter(t => t.history?.[nextDate]).length / tasks.length) * 100 : value;

                return (
                  <div key={i} className="relative flex-1 flex flex-col items-center h-full justify-end">
                    {nextDate && (
                      <div 
                        className="absolute h-[1.5px] bg-blue-100 transition-all origin-left"
                        style={{ bottom: `${Math.max(15, value)}%`, width: "100%", transform: `rotate(${Math.atan2(nextValue - value, 100) * (180 / Math.PI)}deg)` }}
                      />
                    )}
                    <div className="absolute w-2 h-2 bg-blue-500 rounded-full border-2 border-white z-10 shadow-sm" style={{ bottom: `${Math.max(15, value)}%`, transform: 'translateY(50%)' }} />
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