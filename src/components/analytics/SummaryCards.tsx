import React from 'react';
import { CheckCircle2, Activity, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import { FilteredData } from './utils';

export default function SummaryCards({ stats }: { stats: FilteredData['stats'] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Done</span>
          <CheckCircle2 size={16} className="text-green-500" />
        </div>
        <h3 className="text-2xl font-black text-gray-800">{stats.totalCompletions}</h3>
        <span className={`text-[10px] font-bold mt-1 ${stats.delta > 0 ? 'text-green-600' : stats.delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
          {stats.delta > 0 ? `+${stats.delta}` : stats.delta} vs last period
        </span>
      </div>
      
      <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Consistency</span>
          <Activity size={16} className={stats.consistencyPercent >= 70 ? 'text-green-500' : stats.consistencyPercent >= 40 ? 'text-orange-500' : 'text-red-500'} />
        </div>
        <h3 className={`text-2xl font-black ${stats.consistencyPercent >= 70 ? 'text-green-600' : stats.consistencyPercent >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
          {stats.consistencyPercent}%
        </h3>
        <span className="text-[10px] font-bold mt-1 text-gray-400 uppercase tracking-widest">Of total possible</span>
      </div>

      <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Days</span>
          <CalendarIcon size={16} className="text-orange-500" />
        </div>
        <h3 className="text-2xl font-black text-gray-800">{stats.activeDays} <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Days</span></h3>
        <span className="text-[10px] font-bold mt-1 text-gray-400 uppercase tracking-widest">With execution</span>
      </div>
      
      <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Peak Velocity</span>
          <TrendingUp size={16} className="text-green-600" />
        </div>
        <h3 className="text-2xl font-black text-gray-800">{stats.peakVolume} <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Reps</span></h3>
        <span className="text-[10px] font-bold mt-1 text-orange-500">{stats.peakText}</span>
      </div>
    </div>
  );
}