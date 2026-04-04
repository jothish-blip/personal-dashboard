import React from 'react';
import { Activity, TrendingUp, TrendingDown, Flame } from 'lucide-react';

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
  return (
    <div className="flex flex-col gap-4">
      {/* PRIMARY METRIC ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-[20px] p-6 bg-white shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Consistency</span>
          <div className={`text-3xl font-black mt-3 ${consistencyPercent >= 70 ? 'text-green-600' : consistencyPercent >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
            {consistencyPercent}%
          </div>
        </div>

        <div className="border border-gray-200 rounded-[20px] p-6 bg-white shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5"><Activity size={14} /> Avg / Day</span>
          <div className="text-3xl font-black mt-3 text-orange-600">
            {avgPerDay}
          </div>
        </div>

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