import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, Target } from 'lucide-react';
import { FilteredData } from './utils';

interface InsightsProps {
  stats: FilteredData['stats'];
  momentum: number;
  loadLevel: 'High' | 'Moderate' | 'Low';
}

export default function InsightsPanel({ stats, momentum, loadLevel }: InsightsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white border border-gray-200 rounded-[20px] p-5 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Performance Insight</span>
          <p className="text-sm font-semibold text-gray-800 mt-2">
            {stats.totalCompletions === 0 ? "No activity — system inactive." : 
             stats.peakVolume > 5 ? "High intensity detected — maintain momentum." : "Moderate activity — increase consistency."}
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6">
          <div className="flex items-center gap-2">
            {momentum > 0 && <TrendingUp size={14} className="text-green-500" />}
            {momentum < 0 && <TrendingDown size={14} className="text-red-500" />}
            {momentum === 0 && <Minus size={14} className="text-gray-400" />}
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Trend Direction</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} className={loadLevel === 'High' ? 'text-green-500' : loadLevel === 'Moderate' ? 'text-orange-500' : 'text-red-500'} />
            <span className={`text-xs font-bold uppercase tracking-widest ${loadLevel === 'High' ? 'text-green-600' : loadLevel === 'Moderate' ? 'text-orange-500' : 'text-red-500'}`}>
              {loadLevel} Load
            </span>
          </div>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-[20px] p-5 shadow-sm flex flex-col justify-center">
        <span className="text-xs text-orange-500 font-black uppercase tracking-widest flex items-center gap-2">
          <Target size={14} /> Focus Zone
        </span>
        <p className="text-sm font-bold text-orange-900 mt-2 leading-relaxed">
          {stats.worstDayInsight}
        </p>
      </div>
    </div>
  );
}