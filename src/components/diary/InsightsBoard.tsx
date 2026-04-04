import React from 'react';
import { Activity, Zap, BrainCircuit, BarChart3 } from 'lucide-react';
import { getLocalDate } from './types';

export default function InsightsBoard({ system }: any) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white border border-gray-200 rounded-[20px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Activity size={14} className="text-green-500" /> Task Execution</span>
            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest ${system.consistency >= 70 ? 'bg-green-50 text-green-700' : system.consistency >= 40 ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'}`}>
              {system.consistency}% Consistency
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-800">{system.doneCount} <span className="text-sm text-gray-400 font-medium">/ {system.totalCount} completed</span></div>
            {system.missedTasks.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {system.missedTasks.map((t: any) => (
                  <span key={t.id} className="text-[10px] font-semibold bg-gray-50 border border-gray-200 text-gray-500 px-2 py-0.5 rounded">{t.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border border-gray-200 rounded-[20px] p-5 shadow-sm flex flex-col justify-center relative overflow-hidden col-span-1 md:col-span-2">
          <div className="absolute -right-4 -bottom-4 opacity-10"><BrainCircuit size={120} /></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2"><Zap size={14} className="text-orange-500" /> AI Insight + Patterns</span>
              <p className="text-sm font-semibold text-gray-800 leading-relaxed">{system.aiInsight}</p>
              {system.detectedPatterns.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {system.detectedPatterns.map((p: string, i: number) => (
                    <span key={i} className="text-[10px] bg-white px-3 py-1 rounded-2xl border border-orange-200 text-orange-700 font-medium">{p}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right text-xs">
              <span className="font-medium text-gray-500">Energy vs Output</span>
              <p className="text-emerald-600 font-semibold mt-1">{system.energyOutputCorrelation}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm mt-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><BarChart3 size={14} className="text-purple-500" /> Visual Life Graph</span>
          <span className="text-xs text-emerald-600">Last 7 days • {system.weeklySummary.focusDistribution}</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, i) => {
            const d = getLocalDate(new Date(Date.now() - i * 86400000));
            const e = system.allEntries[d];
            if (!e || e.isMissed) {
              return <div key={d} className="flex flex-col items-center gap-1 text-[10px]">
                <div className="h-24 w-full bg-gray-100 rounded-3xl flex items-end justify-center text-gray-300 text-[9px]">—</div>
                <span className="font-medium text-gray-400">{d.slice(5)}</span>
              </div>;
            }
            const moodHeight = e.mood === 'good' ? '90%' : e.mood === 'neutral' ? '55%' : '20%';
            const energyHeight = e.energy === 'high' ? '90%' : e.energy === 'medium' ? '60%' : '25%';
            return (
              <div key={d} className="flex flex-col items-center gap-1 text-[10px]">
                <div className="relative w-full h-24 flex items-end justify-center gap-1">
                  <div className={`w-4 rounded-t-3xl transition-all ${e.mood === 'good' ? 'bg-green-400' : e.mood === 'neutral' ? 'bg-amber-400' : 'bg-red-400'}`} style={{ height: moodHeight }} />
                  <div className={`w-4 rounded-t-3xl transition-all ${e.energy === 'high' ? 'bg-emerald-400' : e.energy === 'medium' ? 'bg-orange-400' : 'bg-red-400'}`} style={{ height: energyHeight }} />
                </div>
                <span className="font-medium text-gray-400">{d.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}