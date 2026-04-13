import React from 'react';
import { BarChart3 } from 'lucide-react';
import { getLocalDate } from './types';

export default function InsightsBoard({ system }: any) {
  // Safe fallbacks to prevent undefined errors
  const detectedPatterns = system.detectedPatterns || [];
  const weeklySummary = system.weeklySummary || { dominantMood: 'Neutral', focusDistribution: 'No data' };
  const currentEntry = system.currentEntry || {};

  return (
    <div className="space-y-6 mt-6 text-left">
      
      {/* 1️⃣ TOP ROW: REALITY SNAPSHOT & PATTERNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        
        {/* Today Snapshot */}
        <div className="bg-white border border-gray-200 rounded-[24px] p-6 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">
            Today Snapshot
          </span>
          <div className="flex flex-wrap gap-2.5">
            {currentEntry.energy && (
              <span className="px-3 py-1.5 text-[11px] font-bold bg-yellow-50 text-yellow-600 rounded-full uppercase tracking-wider">
                ⚡ {currentEntry.energy}
              </span>
            )}
            {currentEntry.sleep && (
              <span className="px-3 py-1.5 text-[11px] font-bold bg-blue-50 text-blue-600 rounded-full uppercase tracking-wider">
                💤 {currentEntry.sleep}
              </span>
            )}
            {currentEntry.executionQuality && (
              <span className="px-3 py-1.5 text-[11px] font-bold bg-green-50 text-green-600 rounded-full uppercase tracking-wider">
                🎯 {currentEntry.executionQuality}
              </span>
            )}
            {currentEntry.momentum && (
              <span className="px-3 py-1.5 text-[11px] font-bold bg-purple-50 text-purple-600 rounded-full uppercase tracking-wider">
                🔄 {currentEntry.momentum}
              </span>
            )}
            {currentEntry.dayStructure && (
              <span className="px-3 py-1.5 text-[11px] font-bold bg-gray-100 text-gray-600 rounded-full uppercase tracking-wider">
                📊 {currentEntry.dayStructure}
              </span>
            )}
            {!currentEntry.energy && !currentEntry.sleep && !currentEntry.executionQuality && (
              <span className="text-xs text-gray-400 font-medium italic py-1">No behavior logged today.</span>
            )}
          </div>
        </div>

        {/* Day Quality */}
        <div className="bg-white border border-gray-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">
            Day Quality
          </span>
          <p className="text-xl font-black text-gray-900 tracking-tight">
            {(currentEntry.goalAlignment || 0) > 70
              ? "Strong execution day"
              : (currentEntry.goalAlignment || 0) < 40
              ? "Low execution day"
              : "Moderate execution"}
          </p>
        </div>

        {/* Pattern Signals */}
        {detectedPatterns.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-[24px] p-6 shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">
              Pattern Signals
            </span>
            <div className="flex flex-col gap-2">
              {detectedPatterns.slice(0, 3).map((p: string, i: number) => (
                <div key={i} className="text-[11px] font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl leading-snug tracking-wide">
                  {p}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-center items-center text-center">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Pattern Signals
            </span>
            <span className="text-xs text-gray-400 font-medium">Log 4-5 days to reveal patterns.</span>
          </div>
        )}

      </div>

      {/* 2️⃣ BOTTOM ROW: VISUAL LIFE GRAPH */}
      <div className="bg-white border border-gray-200 rounded-[24px] p-6 shadow-sm mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
              <BarChart3 size={14} className="text-indigo-500" /> Weekly Summary
            </span>
            <div className="text-xs text-gray-500 font-medium">
              Mood: <span className="text-gray-900 font-bold uppercase tracking-wide">{weeklySummary.dominantMood}</span> • 
              Focus: <span className="text-gray-900 font-bold uppercase tracking-wide">{weeklySummary.focusDistribution}</span>
            </div>
            <p className="text-[11px] font-bold text-gray-400 mt-2 tracking-wide uppercase">
              Weekly behavior trend
            </p>
          </div>

          <div className="flex gap-4 p-2 bg-gray-50 rounded-xl border border-gray-100 shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 tracking-widest">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" /> MOOD
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 tracking-widest">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm" /> ENERGY
            </div>
          </div>
        </div>

        {/* Graph Area */}
        <div className="overflow-x-auto pb-2 scrollbar-hide border-t border-gray-50 pt-6">
          <div className="grid grid-cols-7 gap-3 min-w-[600px] h-44 sm:h-40 items-end px-2">
            {Array.from({ length: 7 }, (_, i) => {
              // Ensure IST bounds for consistency
              const dObj = new Date();
              dObj.setDate(dObj.getDate() - (6 - i));
              const offset = dObj.getTimezoneOffset();
              const localD = new Date(dObj.getTime() - offset * 60000);
              const d = localD.toISOString().split('T')[0];
              
              const e = system.allEntries?.[d];
              const dateLabel = new Date(localD).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

              if (!e || e.isMissed) {
                return (
                  <div key={d} className="flex flex-col items-center gap-3">
                    <div className="h-32 sm:h-28 w-full bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 font-medium text-[10px]">No Log</div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{dateLabel}</span>
                  </div>
                );
              }

              const moodH = e.mood === 'good' ? '100%' : e.mood === 'neutral' ? '60%' : '30%';
              const energyH = e.energy === 'high' ? '100%' : e.energy === 'medium' ? '65%' : '35%';

              return (
                <div key={d} className="flex flex-col items-center gap-3 group">
                  <div 
                    className="relative w-full h-32 sm:h-28 flex items-end justify-center gap-1.5 px-2"
                    title={`Mood: ${e.mood}, Energy: ${e.energy}`}
                  >
                    <div className="absolute inset-x-1 bottom-0 h-full bg-gray-50 rounded-t-lg -z-10 opacity-60" />
                    <div className="w-3 bg-emerald-400 rounded-t-md transition-all shadow-sm" style={{ height: moodH }} />
                    <div className="w-3 bg-orange-400 rounded-t-md transition-all shadow-sm" style={{ height: energyH }} />
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{dateLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}