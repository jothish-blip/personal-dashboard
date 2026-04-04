import React from 'react';
import { Zap, Activity, Clock, BarChart3 } from 'lucide-react';

interface AuditMetricsProps {
  focusScore: number;
  instabilityIndex: number;
  peakHour: number | null;
  topTasks: [string, number][];
}

export default function AuditMetrics({ focusScore, instabilityIndex, peakHour, topTasks }: AuditMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-green-50 text-green-600 rounded-xl"><Zap size={16} /></div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Efficiency</span>
        </div>
        <h4 className="text-2xl font-semibold text-gray-800">{focusScore}%</h4>
        <p className="text-xs text-gray-400 mt-1">Focus Score</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-red-50 text-red-600 rounded-xl"><Activity size={16} /></div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Stability</span>
        </div>
        <h4 className="text-2xl font-semibold text-gray-800">{instabilityIndex}%</h4>
        <p className="text-xs text-gray-400 mt-1">Volatility</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-orange-50 text-orange-500 rounded-xl"><Clock size={16} /></div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Peak Time</span>
        </div>
        <h4 className="text-2xl font-semibold text-gray-800 uppercase">
          {peakHour !== null ? `${peakHour}:00` : '--'}
        </h4>
        <p className="text-xs text-gray-400 mt-1">Active Hour</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-gray-400" />
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Top Tasks</h3>
        </div>
        <div className="space-y-3 mt-1">
          {topTasks.map(([name, count]) => (
            <div key={name} className="flex justify-between items-center text-[13px]">
              <span className="font-medium text-gray-700 truncate max-w-[130px]">{name}</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-500">{count}</span>
            </div>
          ))}
          {topTasks.length === 0 && (
            <span className="text-xs text-gray-400">No task data</span>
          )}
        </div>
      </div>
    </div>
  );
}