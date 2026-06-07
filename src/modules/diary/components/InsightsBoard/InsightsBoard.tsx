"use client";

import React, { useMemo, useState } from "react";
import { 
  BarChart3, ChevronDown, ChevronUp, Sparkles, X
} from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

export default function InsightsBoard({ system }: any) {
  const { isDarkMode } = useTheme();
  const [showPatterns, setShowPatterns] = useState(false);
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);
  
  const allEntries = system?.allEntries || {};
  const currentStreak = system?.streak || 0;
  
  // --- REALITY SNAPSHOT & NARRATIVE CALCULATIONS ---
  const { snapshot, timeline, deeperPatterns, hasData } = useMemo(() => {
    const dates = Object.keys(allEntries).sort();
    const hasData = dates.length > 0;
    
    if (!hasData) {
      return { snapshot: null, timeline: [], deeperPatterns: null, hasData: false };
    }

    const last30 = dates.slice(-30);
    const last14 = dates.slice(-14);
    const last7 = dates.slice(-7);
    const prev7 = dates.slice(-14, -7);
    
    const energyCount: Record<string, number> = {};
    const moodCount: Record<string, number> = {};
    
    last14.forEach(d => {
      const e = allEntries[d];
      if (!e || e.isMissed) return;
      if (e.energy) energyCount[e.energy] = (energyCount[e.energy] || 0) + 1;
      if (e.mood) moodCount[e.mood] = (moodCount[e.mood] || 0) + 1;
    });

    const getTop = (obj: Record<string, number>) => Object.entries(obj).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const topMood = getTop(moodCount);
    const topEnergy = getTop(energyCount);

    // --- Deeper Patterns (Narrative) ---
    let charsLast7 = 0;
    let charsPrev7 = 0;
    let moodScoreLast7 = 0;
    let moodScorePrev7 = 0;
    let daysWrittenLast7 = 0;
    let daysWrittenPrev7 = 0;
    
    const dayProductivity: Record<string, number> = {};
    const tagCount: Record<string, number> = {};
    const moodMap: Record<string, number> = { 'good': 3, 'neutral': 2, 'bad': 1 };
    const sections = ['morning', 'afternoon', 'evening', 'learning', 'tomorrow'];

    last7.forEach(d => {
      const e = allEntries[d];
      if (!e || e.isMissed) return;
      daysWrittenLast7++;
      
      const dayName = new Date(d).toLocaleDateString('en-US', { weekday: 'long' });
      let dayChars = 0;
      sections.forEach(s => { if (e[s]) dayChars += e[s].length; });
      charsLast7 += dayChars;
      
      dayProductivity[dayName] = (dayProductivity[dayName] || 0) + 1;
      if (e.mood) moodScoreLast7 += moodMap[e.mood.toLowerCase()] || 2;
      if (e.tags && Array.isArray(e.tags)) {
        e.tags.forEach((tag: string) => tagCount[tag] = (tagCount[tag] || 0) + 1);
      }
    });

    prev7.forEach(d => {
      const e = allEntries[d];
      if (!e || e.isMissed) return;
      daysWrittenPrev7++;
      sections.forEach(s => { if (e[s]) charsPrev7 += e[s].length; });
      if (e.mood) moodScorePrev7 += moodMap[e.mood.toLowerCase()] || 2;
    });

    const avgCharsLast7 = daysWrittenLast7 > 0 ? charsLast7 / daysWrittenLast7 : 0;
    const avgCharsPrev7 = daysWrittenPrev7 > 0 ? charsPrev7 / daysWrittenPrev7 : 0;
    const avgMoodLast7 = daysWrittenLast7 > 0 ? moodScoreLast7 / daysWrittenLast7 : 0;
    const avgMoodPrev7 = daysWrittenPrev7 > 0 ? moodScorePrev7 / daysWrittenPrev7 : 0;

    const topProductiveDay = getTop(dayProductivity);
    const topTag = getTop(tagCount);

    let habitText = "Writing consistency was steady.";
    if (avgCharsLast7 > avgCharsPrev7 * 1.2) habitText = "Writing became more detailed.";
    else if (avgCharsLast7 < avgCharsPrev7 * 0.8) habitText = "Reflections were shorter this week.";

    let moodText = "Mood felt stable.";
    if (avgMoodLast7 > avgMoodPrev7 * 1.1) moodText = "You seemed more positive than last week.";
    else if (avgMoodLast7 < avgMoodPrev7 * 0.9) moodText = "It was a slightly heavier week.";

    const gData = Array.from({ length: 30 }, (_, i) => {
      const dObj = new Date();
      dObj.setDate(dObj.getDate() - (29 - i));
      const dStr = dObj.toISOString().split('T')[0];
      const entry = allEntries[dStr];
      const month = dObj.toLocaleString('default', { month: 'short' });
      
      let sectionsWritten = 0;
      if (entry && !entry.isMissed) {
         sectionsWritten = sections.filter(s => entry[s] && entry[s].trim().length > 0).length;
      }
      return { dateStr: dStr, label: dObj.getDate(), month, entry, sectionsWritten, dObj };
    });

    return { 
      snapshot: { topMood, topEnergy }, 
      timeline: gData, 
      deeperPatterns: { topProductiveDay, topTag, habitText, moodText },
      hasData: true 
    };
  }, [allEntries]);

  // --- STYLING HELPERS ---
  const boxClass = `p-6 rounded-[24px] border shadow-sm ${isDarkMode ? "bg-[#0a0a0a] border-white/[0.08]" : "bg-white border-gray-200"}`;
  const textSub = isDarkMode ? "text-zinc-400" : "text-gray-500";
  const textMain = isDarkMode ? "text-white" : "text-gray-900";

  // --- EMPTY STATE ---
  if (!hasData || !snapshot || !deeperPatterns) {
    return (
      <div className={`p-12 text-center rounded-[24px] border mt-6 ${isDarkMode ? "bg-[#0a0a0a] border-white/[0.08]" : "bg-white border-gray-200"}`}>
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-orange-400 opacity-50" />
        <h3 className="text-xl font-bold mb-2">Blank Canvas</h3>
        <p className={textSub}>
          Write your first few reflections to start seeing the shape of your days.
        </p>
      </div>
    );
  }

  const selectedDayData = selectedDayStr ? timeline.find(t => t.dateStr === selectedDayStr) : null;

  return (
    <div className="space-y-6 mt-8 max-w-4xl mx-auto text-left">
      
      {/* 1️⃣ REFLECTION SNAPSHOT (Unified Narrative Block) */}
      <div className={boxClass}>
        <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDarkMode ? "text-indigo-400" : "text-indigo-500"}`}>
          <Sparkles size={14} /> Recently
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{snapshot.topMood === 'good' ? '😊' : snapshot.topMood === 'neutral' ? '😐' : '😔'}</span>
            <span className={`text-lg font-bold capitalize ${textMain}`}>Mostly {snapshot.topMood} Mood</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-white/10" />
          <div className="flex items-center gap-3">
            <span className="text-2xl">{snapshot.topEnergy === 'high' ? '⚡' : snapshot.topEnergy === 'low' ? '🪫' : '🔋'}</span>
            <span className={`text-lg font-bold capitalize ${textMain}`}>Mostly {snapshot.topEnergy} Energy</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-white/10" />
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <span className={`text-lg font-bold ${textMain}`}>{currentStreak} Day Reflection Streak</span>
          </div>
        </div>
      </div>

      {/* 2️⃣ TIMELINE HERO (Navigation & Visuals) */}
      <div className={boxClass}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${textMain}`}>
              <BarChart3 size={18} className="text-indigo-500" /> Mood & Energy Timeline
            </h3>
            <p className={`text-xs mt-1 ${textSub}`}>Click a day to view its reflection.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Mood</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400" /> Energy</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-1.5 min-w-full md:min-w-[800px] h-48 items-end px-2">
            {timeline.map((day, i) => {
              const e = day.entry;
              const isMissed = e?.isMissed;
              const noData = !e;
              const isSelected = selectedDayStr === day.dateStr;
              
              // Mobile UX: Hide the first 16 items on small screens to show only 14 days
              const mobileHideClass = i < 16 ? "hidden md:flex" : "flex";

              // Week markers
              const isWeekStart = (29 - i) % 7 === 0 && i !== 29;
              const weekNumber = Math.floor((29 - i) / 7) + 1;

              return (
                <div key={day.dateStr} className={`relative flex-1 flex-col items-center gap-2 group ${mobileHideClass}`}>
                  
                  {isWeekStart && (
                    <div className="absolute -top-6 -left-[3px] h-[calc(100%+24px)] w-px bg-dashed border-l border-dashed border-gray-200 dark:border-white/10 z-0">
                      <span className={`absolute -top-4 -left-1 text-[8px] font-bold uppercase tracking-wider ${isDarkMode ? "text-zinc-600" : "text-gray-300"}`}>
                        W{weekNumber}
                      </span>
                    </div>
                  )}

                  <button 
                    onClick={() => setSelectedDayStr(isSelected ? null : day.dateStr)}
                    className="relative w-full h-36 flex items-end justify-center gap-[2px] cursor-pointer hover:-translate-y-1 transition-transform z-10"
                    aria-label={`View entry for ${day.dateStr}`}
                  >
                    {/* Hover Tooltip (kept minimal since click opens drawer) */}
                    <div className="absolute bottom-[110%] w-max px-2 py-1 bg-black/90 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      {day.month} {day.label}
                    </div>

                    {e && !isMissed ? (
                      <>
                        <div className={`w-[45%] rounded-t-sm transition-all duration-300 ${isSelected ? "bg-emerald-300 ring-1 ring-emerald-500" : "bg-emerald-400"}`} 
                             style={{ height: e.mood === 'good' ? '90%' : e.mood === 'neutral' ? '50%' : '20%' }} />
                        <div className={`w-[45%] rounded-t-sm transition-all duration-300 ${isSelected ? "bg-orange-300 ring-1 ring-orange-500" : "bg-orange-400"}`} 
                             style={{ height: e.energy === 'high' ? '90%' : e.energy === 'medium' ? '50%' : '20%' }} />
                      </>
                    ) : (
                      <div className={`w-full h-full rounded-sm ${isMissed ? "bg-red-500/10 border-b-2 border-red-500/50" : isDarkMode ? "bg-white/[0.02]" : "bg-gray-50"}`} />
                    )}
                  </button>
                  
                  <div className={`text-center w-full flex flex-col items-center mt-2 text-[10px] font-bold ${isSelected ? "text-indigo-500" : isDarkMode ? "text-zinc-600" : "text-gray-400"}`}>
                    {day.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Mini-Drawer */}
        {selectedDayData && (
          <div className={`mt-6 p-5 rounded-xl border animate-in slide-in-from-top-2 fade-in duration-300 relative ${isDarkMode ? "bg-white/[0.02] border-white/10" : "bg-gray-50 border-gray-200"}`}>
            <button 
              onClick={() => setSelectedDayStr(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              <X size={16} className={textSub} />
            </button>
            
            <div className="mb-4">
              <h4 className={`text-sm font-bold ${textMain}`}>
                {selectedDayData.dObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h4>
              {selectedDayData.entry && !selectedDayData.entry.isMissed && (
                <div className={`text-xs mt-1 font-medium flex items-center gap-3 ${textSub}`}>
                  <span>Mood: <span className="capitalize text-emerald-500">{selectedDayData.entry.mood || 'N/A'}</span></span>
                  <span>Energy: <span className="capitalize text-orange-500">{selectedDayData.entry.energy || 'N/A'}</span></span>
                </div>
              )}
            </div>

            {!selectedDayData.entry ? (
               <p className={`text-sm italic ${textSub}`}>No reflection recorded for this day.</p>
            ) : selectedDayData.entry.isMissed ? (
               <p className={`text-sm italic text-red-400`}>This day was intentionally skipped.</p>
            ) : (
              <div className="space-y-4">
                {['morning', 'afternoon', 'evening'].map(section => {
                  const content = selectedDayData.entry[section];
                  if (!content) return null;
                  return (
                    <div key={section}>
                      <span className={`text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-1 block`}>{section}</span>
                      <p className={`text-sm leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>{content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3️⃣ RECENT PATTERNS (Collapsible List) */}
      <div className="mt-8 flex flex-col items-center">
        <button 
          onClick={() => setShowPatterns(!showPatterns)}
          className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${showPatterns ? "text-indigo-500" : textSub} hover:text-indigo-400`}
        >
          Recent Patterns
          {showPatterns ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showPatterns && (
          <div className={`w-full max-w-md mt-6 p-6 rounded-[24px] border shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 ${isDarkMode ? "bg-[#0a0a0a] border-white/[0.08]" : "bg-white border-gray-200"}`}>
            <ul className={`space-y-4 text-sm font-medium ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>
              <li className="flex items-start gap-3">
                <span className="text-lg w-6 text-center">📅</span>
                <span>Most active on <span className="font-bold">{deeperPatterns.topProductiveDay !== 'N/A' ? deeperPatterns.topProductiveDay : 'weekdays'}</span></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg w-6 text-center">🏷️</span>
                <span><span className="font-bold capitalize">"{deeperPatterns.topTag !== 'N/A' ? deeperPatterns.topTag : 'Life'}"</span> appeared most often</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg w-6 text-center">🌊</span>
                <span>{deeperPatterns.moodText}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg w-6 text-center">✍️</span>
                <span>{deeperPatterns.habitText}</span>
              </li>
            </ul>
          </div>
        )}
      </div>

    </div>
  );
}