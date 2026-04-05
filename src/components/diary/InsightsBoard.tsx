import React from 'react';
import { 
  Activity, 
  BarChart3, 
  AlertCircle, 
  Search
} from 'lucide-react';
import { getLocalDate } from './types';

export default function InsightsBoard({ system }: any) {
  // Safe fallbacks to prevent undefined errors
  const missedTasks = system.missedTasks || [];
  const detectedPatterns = system.detectedPatterns || [];
  const weeklySummary = system.weeklySummary || { dominantMood: 'Neutral', focusDistribution: 'No data' };

  // Simple suggestion logic grounded in raw data
  const getSuggestion = () => {
    if (system.consistency < 40) return "Scale back goals and focus on one key habit.";
    if (system.currentEntry?.energy === 'low') return "Prioritize high-impact, low-effort tasks today.";
    if (system.consistency > 80) return "Momentum is high. Maintain this current load.";
    return "Complete pending tasks to clear the mental stack.";
  };

  return (
    <div className="space-y-6 mt-6">
      
      {/* 1️⃣ TOP ROW: TASK REALITY & OBSERVATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        
        {/* Task Execution Card */}
        <div className="bg-white border border-gray-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Activity size={14} className="text-emerald-500" /> Task Execution
            </span>
            <h3 className="text-3xl font-black text-gray-900">
              {system.doneCount || 0} <span className="text-sm text-gray-400 font-medium">/ {system.totalCount || 0}</span>
            </h3>
            <p className="text-[11px] text-gray-500 mt-2 font-medium">
              {system.consistency >= 70 
                ? "Strong execution"
                : system.consistency >= 40 
                ? "Inconsistent progress"
                : "Low completion"}
            </p>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Integrity</span>
              <span className="text-xs font-bold text-gray-900">{system.consistency || 0}%</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${system.consistency || 0}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Daily Observation Card */}
        <div className="bg-white border border-gray-200 rounded-[24px] p-6 shadow-sm col-span-1 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Search size={14} className="text-gray-400" /> Daily Observation
            </span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter bg-gray-50 px-2 py-1 rounded">
              {system.energyOutputCorrelation || "Analyzing Data"}
            </span>
          </div>

          <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl">
            <p className="text-sm font-semibold text-gray-800 leading-relaxed">
              {system.aiInsight || "No patterns yet. Log mood, energy, and tasks to build insights."}
            </p>
            
            {/* Highly Visible Actionable Suggestion */}
            <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl">
              <p className="text-[10px] font-bold text-orange-500 uppercase mb-1">
                Suggestion
              </p>
              <p className="text-xs font-semibold text-orange-800">
                {system.recommendedAction || getSuggestion()}
              </p>
            </div>
          </div>

          {/* Pattern Indicators (Stacked & Important) */}
          {detectedPatterns.length > 0 && (
            <div className="mt-4 space-y-2">
              {detectedPatterns.map((p: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-gray-700 font-medium">
                  <AlertCircle size={14} className="text-gray-400 shrink-0" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2️⃣ BOTTOM ROW: VISUAL LIFE GRAPH */}
      <div className="bg-white border border-gray-200 rounded-[24px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
              <BarChart3 size={14} className="text-indigo-500" /> Weekly Summary
            </span>
            <div className="text-xs text-gray-500 font-medium">
              Mood: <span className="text-gray-900 font-bold uppercase">{weeklySummary.dominantMood}</span> • 
              Focus: <span className="text-gray-900 font-bold uppercase">{weeklySummary.focusDistribution}</span>
            </div>
            {/* Graph Context */}
            <p className="text-[11px] text-gray-400 mt-1">
              Last 7 days pattern of mood and energy
            </p>
          </div>

          <div className="flex gap-4 p-1.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> MOOD
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400" /> ENERGY
            </div>
          </div>
        </div>

        {/* Graph Area (Mobile Height Optimized) */}
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <div className="grid grid-cols-7 gap-3 min-w-[600px] h-44 sm:h-40 items-end px-2">
            {Array.from({ length: 7 }, (_, i) => {
              const d = getLocalDate(new Date(Date.now() - (6 - i) * 86400000));
              const e = system.allEntries?.[d];
              const dateLabel = new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

              if (!e || e.isMissed) {
                return (
                  <div key={d} className="flex flex-col items-center gap-3">
                    <div className="h-32 sm:h-28 w-full bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300 italic text-[10px]">No Log</div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{dateLabel}</span>
                  </div>
                );
              }

              const moodH = e.mood === 'good' ? '100%' : e.mood === 'neutral' ? '60%' : '30%';
              const energyH = e.energy === 'high' ? '100%' : e.energy === 'medium' ? '65%' : '35%';

              return (
                <div key={d} className="flex flex-col items-center gap-3 group">
                  <div 
                    className="relative w-full h-32 sm:h-28 flex items-end justify-center gap-1 px-2"
                    title={`Mood: ${e.mood}, Energy: ${e.energy}`}
                  >
                    <div className="absolute inset-x-1 bottom-0 h-full bg-gray-50 rounded-t-lg -z-10 opacity-50" />
                    <div className="w-2.5 bg-emerald-400 rounded-t-md transition-all shadow-sm" style={{ height: moodH }} />
                    <div className="w-2.5 bg-orange-400 rounded-t-md transition-all shadow-sm" style={{ height: energyH }} />
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">{dateLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}