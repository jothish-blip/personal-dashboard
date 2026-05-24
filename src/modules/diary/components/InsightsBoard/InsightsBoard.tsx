"use client";

import React, { useMemo } from 'react';
import { BarChart3, Activity, BookOpen, Zap, PenTool } from 'lucide-react';
import { useTheme } from "@/theme/ThemeProvider";

export default function InsightsBoard({ system }: any) {
  const { isDarkMode } = useTheme();
  
  const allEntries = system.allEntries || {};
  const currentEntry = system.currentEntry || {};
  const currentStreak = system.currentStreak || 0;
  
  // --- REALITY SNAPSHOT CALCULATIONS ---
  const stats = useMemo(() => {
    const dates = Object.keys(allEntries);
    let written = 0;
    let skipped = 0;
    
    dates.forEach(d => {
      if (allEntries[d].isMissed) skipped++;
      else written++;
    });
    
    const total = written + skipped;
    const consistency = total > 0 ? Math.round((written / total) * 100) : 0;

    // Today Status
    const sections = ['morning', 'afternoon', 'evening', 'learning', 'tomorrow'];
    const completedCount = sections.filter(s => currentEntry[s] && currentEntry[s].trim().length > 0).length;

    // Rhythm & Depth (Last 14 days for rhythm, 7 for depth)
    const last14 = dates.sort().reverse().slice(0, 14);
    const last7 = last14.slice(0, 7);
    
    const energyCount: Record<string, number> = {};
    const moodCount: Record<string, number> = {};
    
    let totalChars = 0;
    let writtenDaysLast7 = 0;
    let sectionsWrittenThisWeek = 0;

    last14.forEach(d => {
      const e = allEntries[d];
      if (!e || e.isMissed) return;
      
      if (e.energy) energyCount[e.energy] = (energyCount[e.energy] || 0) + 1;
      if (e.mood) moodCount[e.mood] = (moodCount[e.mood] || 0) + 1;
      
      if (last7.includes(d)) {
        writtenDaysLast7++;
        sections.forEach(s => {
          if (e[s] && e[s].trim().length > 0) {
            totalChars += e[s].length;
            sectionsWrittenThisWeek++;
          }
        });
      }
    });

    const getTop = (obj: Record<string, number>) => Object.entries(obj).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    const avgChars = writtenDaysLast7 > 0 ? totalChars / writtenDaysLast7 : 0;
    let depthLabel = "Brief";
    if (avgChars > 400) depthLabel = "Detailed";
    else if (avgChars > 150) depthLabel = "Moderate";
    if (writtenDaysLast7 === 0) depthLabel = "No Data";

    return {
      written,
      skipped,
      consistency,
      completedCount,
      topEnergy: getTop(energyCount),
      topMood: getTop(moodCount),
      depthLabel,
      sectionsWrittenThisWeek
    };
  }, [allEntries, currentEntry]);

  // --- 30 DAY GRAPH GENERATION ---
  const graphDays = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const dObj = new Date();
      dObj.setDate(dObj.getDate() - (29 - i));
      const offset = dObj.getTimezoneOffset();
      const localD = new Date(dObj.getTime() - offset * 60000);
      const dStr = localD.toISOString().split('T')[0];
      
      return {
        dateStr: dStr,
        label: new Date(localD).toLocaleDateString('en-US', { weekday: 'narrow', day: 'numeric' }),
        entry: allEntries[dStr]
      };
    });
  }, [allEntries]);

  // --- STYLING HELPERS ---
  const cardClass = `p-6 rounded-[24px] border shadow-sm flex flex-col justify-between transition-colors ${
    isDarkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-white border-gray-200"
  }`;
  
  const labelClass = `text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-4 ${
    isDarkMode ? "text-gray-500" : "text-gray-400"
  }`;

  const valueClass = `text-3xl font-black tracking-tight ${
    isDarkMode ? "text-gray-100" : "text-gray-900"
  }`;

  const subTextClass = `text-xs font-medium mt-2 ${
    isDarkMode ? "text-gray-500" : "text-gray-500"
  }`;

  return (
    <div className="space-y-6 mt-6 text-left">
      
      {/* 1️⃣ TOP ROW: OBJECTIVE REALITY SNAPSHOT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        
        {/* Journal Activity */}
        <div className={cardClass}>
          <span className={labelClass}>
            <Activity size={14} /> Journal Activity
          </span>
          <div>
            <div className="flex items-end gap-2">
              <span className={valueClass}>{stats.consistency}%</span>
            </div>
            <div className={subTextClass}>
              <span className={isDarkMode ? "text-gray-300 font-bold" : "text-gray-700 font-bold"}>{stats.written}</span> written • {stats.skipped} skipped
            </div>
          </div>
        </div>

        {/* Today Status */}
        <div className={cardClass}>
          <span className={labelClass}>
            <BookOpen size={14} /> Today
          </span>
          <div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                {stats.completedCount}
              </span>
              <span className={`text-lg font-bold ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
                / 5
              </span>
            </div>
            <div className={subTextClass}>
              {stats.completedCount === 5 
                ? "All sections completed" 
                : stats.completedCount === 0 
                ? "Not started yet" 
                : "Sections written"}
            </div>
          </div>
        </div>

        {/* Current Rhythm */}
        <div className={cardClass}>
          <span className={labelClass}>
            <Zap size={14} /> Current Rhythm
          </span>
          <div>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-black ${isDarkMode ? "text-orange-400" : "text-orange-500"}`}>
                {currentStreak}
              </span>
              <span className={`text-sm font-bold pb-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                day streak
              </span>
            </div>
            <div className={subTextClass}>
              Trend: <span className="capitalize font-bold">{stats.topEnergy !== 'N/A' ? stats.topEnergy : 'Mixed'}</span> energy
            </div>
          </div>
        </div>

        {/* Reflection Depth */}
        <div className={cardClass}>
          <span className={labelClass}>
            <PenTool size={14} /> Writing Habit
          </span>
          <div>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-black capitalize ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>
                {stats.depthLabel}
              </span>
            </div>
            <div className={subTextClass}>
              <span className={isDarkMode ? "text-gray-300 font-bold" : "text-gray-700 font-bold"}>{stats.sectionsWrittenThisWeek}</span> reflections this week
            </div>
          </div>
        </div>

      </div>

      {/* 2️⃣ BOTTOM ROW: 30-DAY MONTHLY GRAPH */}
      <div className={`p-6 rounded-[24px] border shadow-sm ${isDarkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-white border-gray-200"}`}>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
              <BarChart3 size={16} className={isDarkMode ? "text-indigo-400" : "text-indigo-500"} /> Monthly Reflection Graph
            </span>
            <p className={`text-xs font-medium ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
              Your mood and energy levels over the last 30 days.
            </p>
          </div>

          <div className={`flex gap-4 p-2.5 rounded-xl border shrink-0 ${isDarkMode ? "bg-[#111111] border-gray-800" : "bg-gray-50 border-gray-100"}`}>
            <div className={`flex items-center gap-2 text-[10px] font-bold tracking-widest ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" /> MOOD
            </div>
            <div className={`flex items-center gap-2 text-[10px] font-bold tracking-widest ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm" /> ENERGY
            </div>
          </div>
        </div>

        {/* Graph Area */}
        <div className={`overflow-x-auto pb-4 scrollbar-hide border-t pt-8 ${isDarkMode ? "border-gray-800" : "border-gray-50"}`}>
          <div className="flex gap-2.5 min-w-[900px] h-48 items-end px-2">
            
            {graphDays.map((dayData) => {
              const e = dayData.entry;
              
              // No Log State
              if (!e || e.isMissed) {
                return (
                  <div key={dayData.dateStr} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className={`w-full h-36 border border-dashed rounded-lg flex items-center justify-center transition-colors ${
                      isDarkMode ? "bg-[#111111]/50 border-gray-800 group-hover:bg-[#1a1a1a]" : "bg-gray-50 border-gray-200 group-hover:bg-gray-100"
                    }`}>
                      <span className={`text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity rotate-[-90deg] ${
                        isDarkMode ? "text-gray-600" : "text-gray-400"
                      }`}>N/A</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
                      {dayData.label.split(' ')[1]}
                    </span>
                  </div>
                );
              }

              // Logged State
              const moodH = e.mood === 'good' ? '100%' : e.mood === 'neutral' ? '60%' : '30%';
              const energyH = e.energy === 'high' ? '100%' : e.energy === 'medium' ? '65%' : '35%';

              return (
                <div key={dayData.dateStr} className="flex-1 flex flex-col items-center gap-3 group cursor-default">
                  <div 
                    className="relative w-full h-36 flex items-end justify-center gap-1"
                    title={`Mood: ${e.mood}, Energy: ${e.energy}`}
                  >
                    {/* Background Track */}
                    <div className={`absolute inset-x-0.5 bottom-0 h-full rounded-t-lg -z-10 transition-colors ${
                      isDarkMode ? "bg-gray-900/40 group-hover:bg-gray-800/60" : "bg-gray-50 opacity-60 group-hover:bg-gray-100"
                    }`} />
                    
                    {/* Bars */}
                    <div className="w-[35%] bg-emerald-400 rounded-t-[4px] transition-all shadow-sm group-hover:brightness-110" style={{ height: moodH }} />
                    <div className="w-[35%] bg-orange-400 rounded-t-[4px] transition-all shadow-sm group-hover:brightness-110" style={{ height: energyH }} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                    isDarkMode ? "text-gray-500 group-hover:text-gray-300" : "text-gray-500 group-hover:text-gray-900"
                  }`}>
                    {dayData.label.split(' ')[1]}
                  </span>
                </div>
              );
            })}

          </div>
        </div>
      </div>

    </div>
  );
}