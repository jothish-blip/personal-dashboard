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

export default function Metrics({
  consistencyPercent, avgPerDay, momentum, bestStreak,
  currentGlobalStreak, zeroDays, peakDayCount, bestDayInsight
}: MetricsProps) {

  // 🧮 DISCIPLINE SCORE CALCULATION
  const disciplineScore = useMemo(() => {
    // 1. Streak Score (How close are you to your best?)
    const streakScore = bestStreak > 0 
      ? Math.min(100, (currentGlobalStreak / bestStreak) * 100) 
      : 0;

    // 2. Zero Day Penalty (Heavy weight on avoiding zero days)
    const zeroPenalty = Math.max(0, 100 - (zeroDays * 12));

    // 3. Momentum Score (Current state of growth)
    const momentumScore = momentum > 0 ? 100 : momentum === 0 ? 60 : 30;

    // 4. Weighted Final Result
    return Math.round(
      (consistencyPercent * 0.4) + 
      (streakScore * 0.25) + 
      (zeroPenalty * 0.2) + 
      (momentumScore * 0.15)
    );
  }, [consistencyPercent, currentGlobalStreak, bestStreak, zeroDays, momentum]);

  return (
    <div className="flex flex-col gap-4">
      {/* PRIMARY METRIC ROW - UPDATED TO 4 COLS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* DISCIPLINE SCORE (HERO) */}
        <div className="border border-gray-200 rounded-[20px] p-6 bg-white shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck size={12} /> Discipline
          </span>
          
          <div className="relative w-16 h-16 mt-3">
            <div className="absolute inset-0 rounded-full border-4 border-gray-50"></div>
            <div 
              className={`absolute inset-0 rounded-full border-4 transition-all duration-1000 ${
                disciplineScore >= 75 ? 'border-green-500' : disciplineScore >= 50 ? 'border-orange-500' : 'border-red-500'
              }`}
              style={{
                clipPath: `inset(${100 - disciplineScore}% 0 0 0)`
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-gray-800">
              {disciplineScore}
            </div>
          </div>

          <div className="text-[10px] font-bold text-gray-500 mt-3 uppercase tracking-tighter">
             {disciplineScore >= 75 && "Unstoppable"}
             {disciplineScore >= 50 && disciplineScore < 75 && "Building Flow"}
             {disciplineScore < 50 && "Needs Reset"}
          </div>
        </div>

        <div className="border border-gray-200 rounded-[20px] p-6 bg-white shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Consistency</span>
          <div className={`text-3xl font-black mt-3 ${consistencyPercent >= 70 ? 'text-green-600' : consistencyPercent >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
            {consistencyPercent}%
          </div>
          <div className="text-[10px] text-gray-400 mt-2 uppercase">Frequency</div>
        </div>

        <div className="border border-gray-200 rounded-[20px] p-6 bg-white shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5"><Activity size={14} /> Avg / Day</span>
          <div className="text-3xl font-black mt-3 text-orange-600">
            {avgPerDay}
          </div>
          <div className="text-[10px] text-gray-400 mt-2 uppercase">Repetitions</div>
        </div>

        <div className="border border-gray-200 rounded-[20px] p-6 bg-white shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Momentum</span>
          <div className={`text-3xl font-black mt-3 flex items-center gap-1.5 ${momentum > 0 ? 'text-green-600' : momentum < 0 ? 'text-red-500' : 'text-gray-500'}`}>
            {momentum > 0 && <TrendingUp size={24} strokeWidth={3} />}
            {momentum < 0 && <TrendingDown size={24} strokeWidth={3} />}
            {momentum > 0 ? `+${momentum}` : momentum}
          </div>
          <div className="text-[10px] text-gray-400 mt-2 uppercase">Velocity</div>
        </div>
      </div>

      {/* SECONDARY METRIC ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-gray-200 rounded-[16px] p-4 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-semibold">Peak Streak</span>
            <Flame size={16} className="text-orange-500" />
          </div>
          <div className="text-xl font-bold mt-2 text-orange-600">{bestStreak}</div>
        </div>

        <div className="border border-gray-200 rounded-[16px] p-4 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-semibold">Active Streak</span>
          </div>
          <div className="text-xl font-bold mt-2 text-gray-800">{currentGlobalStreak}</div>
        </div>

        <div className="border border-gray-200 rounded-[16px] p-4 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-semibold">Zero Days</span>
          </div>
          <div className={`text-xl font-bold mt-2 ${zeroDays > 0 ? 'text-red-500' : 'text-green-600'}`}>
            {zeroDays}
          </div>
        </div>

        <div className="border border-gray-200 rounded-[16px] p-4 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-semibold">Peak Output</span>
          </div>
          <div className="text-xl font-bold mt-1 text-gray-800 flex items-end gap-2">
            {peakDayCount} <span className="text-[10px] text-gray-400 font-semibold mb-1 uppercase">reps</span>
          </div>
          <div className="text-[10px] font-bold mt-1 text-orange-500 uppercase tracking-widest">
            {bestDayInsight}
          </div>
        </div>
      </div>
    </div>
  );
}