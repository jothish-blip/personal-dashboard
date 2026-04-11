import React, { useMemo } from 'react';
import { Activity, TrendingUp, TrendingDown, Flame, ShieldCheck } from 'lucide-react';

interface MetricsProps {
  consistencyPercent: number;
  avgPerDay: number;
  momentum: number;
  bestStreak: number;
  currentGlobalStreak: number;
  zeroDays: number;
  peakDayCount: number;
  bestDayInsight: string;
}

// 🚀 STEP 1 — REUSABLE CIRCLE UI COMPONENT
const MetricCircle = ({ value, color, label }: { value: number, color: string, label?: string }) => (
  <div className="relative w-16 h-16 mt-3 group-hover:scale-105 transition-transform duration-300">
    <div className="absolute inset-0 rounded-full border-4 border-gray-100 shadow-inner"></div>
    <div 
      className={`absolute inset-0 rounded-full border-4 ${color} transition-all duration-1000 ease-out`}
      style={{
        clipPath: `inset(${100 - value}% 0 0 0)`
      }}
    ></div>
    <div className={`absolute inset-0 flex items-center justify-center text-sm font-black transition-colors ${color.replace('border', 'text')}`}>
      {label || `${value}%`}
    </div>
  </div>
);

export default function Metrics({
  consistencyPercent, avgPerDay, momentum, bestStreak,
  currentGlobalStreak, zeroDays, peakDayCount, bestDayInsight
}: MetricsProps) {

  // 🧮 NORMALIZATION CALCULATIONS
  const metrics = useMemo(() => {
    // Discipline Score
    const streakScore = bestStreak > 0 ? Math.min(100, (currentGlobalStreak / bestStreak) * 100) : 0;
    const zeroPenalty = Math.max(0, 100 - (zeroDays * 12));
    const momentumScore = momentum > 0 ? 100 : momentum === 0 ? 60 : 30;
    const disciplineScore = Math.round(
      (consistencyPercent * 0.4) + (streakScore * 0.25) + (zeroPenalty * 0.2) + (momentumScore * 0.15)
    );

    // Normalize Avg/Day (Assume 8-10 reps is "100% output")
    const avgNormalization = Math.min(100, Math.round((avgPerDay / 10) * 100));

    return { disciplineScore, avgNormalization };
  }, [consistencyPercent, currentGlobalStreak, bestStreak, zeroDays, momentum, avgPerDay]);

  return (
    <div className="flex flex-col gap-4">
      {/* PRIMARY METRIC ROW - CONSISTENT CIRCLE THEME */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* 🛡️ DISCIPLINE */}
        <div className="border border-gray-200 rounded-[20px] p-6 bg-white shadow-sm flex flex-col justify-center items-center text-center group hover:border-blue-200 transition-all cursor-help" title="Composite score of your overall reliability">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-blue-500" /> Discipline
          </span>
          <MetricCircle 
            value={metrics.disciplineScore} 
            color={metrics.disciplineScore >= 75 ? "border-green-500" : metrics.disciplineScore >= 40 ? "border-blue-500" : "border-red-500"} 
          />
          <div className={`text-[11px] font-bold mt-3 uppercase tracking-tight ${metrics.disciplineScore >= 40 ? 'text-blue-600' : 'text-red-500'}`}>
            {metrics.disciplineScore >= 75 ? "Elite" : metrics.disciplineScore >= 40 ? "Steady" : "Reset Needed"}
          </div>
        </div>

        {/* 🚀 STEP 2 — CONSISTENCY */}
        <div className="border border-gray-200 rounded-[20px] p-6 bg-white shadow-sm flex flex-col justify-center items-center text-center group hover:border-green-200 transition-all cursor-help" title="Percentage of active days in the current cycle">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Consistency</span>
          <MetricCircle 
            value={consistencyPercent} 
            color={consistencyPercent >= 70 ? "border-green-500" : consistencyPercent >= 40 ? "border-orange-500" : "border-red-500"} 
          />
          <div className="text-[11px] font-bold mt-3 text-gray-700 uppercase tracking-tight">
            {consistencyPercent >= 70 ? "Strong" : consistencyPercent >= 40 ? "Moderate" : "Low"}
          </div>
        </div>

        {/* 🚀 STEP 3 — AVG OUTPUT */}
        <div className="border border-gray-200 rounded-[20px] p-6 bg-white shadow-sm flex flex-col justify-center items-center text-center group hover:border-orange-200 transition-all cursor-help" title="Average tasks completed per active day">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5"><Activity size={12} className="text-orange-500" /> Avg Output</span>
          <MetricCircle 
            value={metrics.avgNormalization} 
            color="border-orange-500"
            label={`${avgPerDay}`}
          />
          <div className="text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-tighter">
            Reps / Day
          </div>
        </div>

        {/* 🚀 STEP 4 — MOMENTUM (Directional UI) */}
        <div className="border border-gray-200 rounded-[20px] p-6 bg-white shadow-sm flex flex-col justify-center items-center text-center group hover:border-purple-200 transition-all">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Momentum</span>
          <div className={`mt-4 mb-2 flex items-center justify-center transition-transform duration-500 group-hover:translate-y-[-4px] ${momentum > 0 ? 'text-green-500' : momentum < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {momentum > 0 ? <TrendingUp size={48} strokeWidth={3} /> : momentum < 0 ? <TrendingDown size={48} strokeWidth={3} /> : <Activity size={48} strokeWidth={2} />}
          </div>
          <div className={`text-2xl font-black ${momentum > 0 ? 'text-green-600' : momentum < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {momentum > 0 ? `+${momentum}` : momentum}
          </div>
          <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">Velocity</div>
        </div>
      </div>

      {/* SECONDARY METRIC ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-gray-200 rounded-[16px] p-4 bg-white hover:bg-gray-50 transition-colors">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-400 font-bold uppercase">Peak Streak</span>
            <Flame size={16} className="text-orange-500" />
          </div>
          <div className="text-xl font-black mt-2 text-orange-600">{bestStreak}</div>
        </div>

        <div className="border border-gray-200 rounded-[16px] p-4 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-400 font-bold uppercase">Active Streak</span>
          </div>
          <div className="text-xl font-black mt-2 text-gray-800">{currentGlobalStreak}</div>
        </div>

        <div className="border border-gray-200 rounded-[16px] p-4 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-400 font-bold uppercase">Zero Days</span>
          </div>
          <div className={`text-xl font-black mt-2 ${zeroDays > 0 ? 'text-red-500' : 'text-green-600'}`}>
            {zeroDays}
          </div>
        </div>

        <div className="border border-gray-200 rounded-[16px] p-4 bg-white relative overflow-hidden group">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-400 font-bold uppercase">Peak Output</span>
          </div>
          <div className="text-xl font-black mt-1 text-gray-800 flex items-end gap-2">
            {peakDayCount} <span className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-tighter">reps</span>
          </div>
          <div className="text-[9px] font-black mt-1 text-orange-500 uppercase tracking-widest leading-none">
            {bestDayInsight}
          </div>
          {/* Subtle accent bar for the "Best Day" */}
          <div className="absolute bottom-0 left-0 h-1 bg-orange-500 w-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        </div>
      </div>
    </div>
  );
}