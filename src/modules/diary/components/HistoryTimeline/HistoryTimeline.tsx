"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Calendar,
  ChevronDown,
  ChevronRight,
  History,
  Smile,
  Meh,
  Frown,
  BatteryFull,
  BatteryMedium,
  Battery,
  Moon,
  Cloud,
  CloudRain,
  Clock,
  Award,
  Hash,
  TrendingUp,
  Activity
} from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================
const getMode = (arr: any[]) => {
  if (!arr || !arr.length) return null;
  const counts: Record<string, number> = {};
  let max = 0, res = null;
  for (const item of arr) {
    if (!item) continue;
    counts[item] = (counts[item] || 0) + 1;
    if (counts[item] > max) {
      max = counts[item];
      res = item;
    }
  }
  return res;
};

const calculateStreak = (dateStrs: string[]) => {
  if (dateStrs.length === 0) return 0;
  const sorted = [...dateStrs].sort();
  let maxStreak = 1;
  let currentStreak = 1;
  let lastDate = new Date(sorted[0]);

  for (let i = 1; i < sorted.length; i++) {
    const currDate = new Date(sorted[i]);
    const diffTime = Math.abs(currDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
    lastDate = currDate;
  }
  return maxStreak;
};

const getMoodEmoji = (mood: string | null) => {
  if (mood === "good") return "😊";
  if (mood === "neutral") return "😐";
  if (mood === "bad") return "😔";
  return "—";
};

const getMoodIcon = (mood: string) => {
  if (mood === "good") return <Smile size={14} className="text-green-500" />;
  if (mood === "neutral") return <Meh size={14} className="text-zinc-500" />;
  if (mood === "bad") return <Frown size={14} className="text-red-500" />;
  return null;
};

const getEnergyIcon = (energy: string) => {
  if (energy === "high") return <BatteryFull size={14} className="text-emerald-500" />;
  if (energy === "medium") return <BatteryMedium size={14} className="text-orange-500" />;
  if (energy === "low") return <Battery size={14} className="text-red-500" />;
  return null;
};

const getSleepIcon = (sleep: string) => {
  if (sleep === "good") return <Moon size={14} className="text-indigo-500" />;
  if (sleep === "average") return <Cloud size={14} className="text-zinc-500" />;
  if (sleep === "poor") return <CloudRain size={14} className="text-red-500" />;
  return null;
};

export default function HistoryTimeline({ system }: any) {
  const { allEntries: entries = {} } = system || {};
  const { isDarkMode } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const actualToday = new Date().toISOString().split("T")[0];

  // Hierarchy Expansion States
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set([new Date().getFullYear().toString()]));
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Set initial expanded month based on current date
  useEffect(() => {
    const currentMonthKey = new Date().toLocaleString("default", { month: "long", year: "numeric" });
    setExpandedMonths(new Set([currentMonthKey]));
  }, []);

  // ==========================================================================
  // DATA PROCESSING
  // ==========================================================================
  
  const historyDates = useMemo(() => {
    if (!entries || Object.keys(entries).length === 0) return [];
    
    let filtered = Object.keys(entries)
      .filter((d) => d <= actualToday)
      .sort()
      .reverse();

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((d) => {
        const e = entries[d];
        if (!e) return false;
        const textToSearch = [
          e.win,
          ...(e.frictions || []),
          e.learning,
          e.improvement,
          e.morning,
          e.evening,
          ...(e.tags || []),
        ].filter(Boolean).join(" ").toLowerCase();
        return textToSearch.includes(q);
      });
    }

    return filtered;
  }, [entries, searchQuery, actualToday]);

  const archiveData = useMemo(() => {
    const data: Record<string, any> = {};

    historyDates.forEach((dateStr) => {
      const d = new Date(dateStr);
      const year = d.getFullYear().toString();
      const monthName = d.toLocaleString("default", { month: "long" });
      const monthKey = `${monthName} ${year}`;
      const weekNum = Math.ceil(d.getDate() / 7);
      const weekKey = `${monthKey}-W${weekNum}`;

      if (!data[year]) data[year] = { year, months: {}, count: 0 };
      if (!data[year].months[monthKey]) {
        data[year].months[monthKey] = { 
          monthKey, 
          monthName, 
          weeks: {}, 
          dates: [],
          stats: {} 
        };
      }
      if (!data[year].months[monthKey].weeks[weekKey]) {
        data[year].months[monthKey].weeks[weekKey] = { 
          weekKey, 
          weekLabel: `Week ${weekNum}`, 
          dates: [],
          stats: {} 
        };
      }

      data[year].count++;
      data[year].months[monthKey].dates.push(dateStr);
      data[year].months[monthKey].weeks[weekKey].dates.push(dateStr);
    });

    // Compute Stats per Month and Week
    Object.values(data).forEach((yearObj: any) => {
      Object.values(yearObj.months).forEach((monthObj: any) => {
        const mEntries = monthObj.dates.map((d: string) => entries[d]);
        monthObj.stats = {
          count: monthObj.dates.length,
          mood: getMode(mEntries.map((e: any) => e.mood)),
          topTag: getMode(mEntries.flatMap((e: any) => e.tags || [])),
          streak: calculateStreak(monthObj.dates)
        };

        Object.values(monthObj.weeks).forEach((weekObj: any) => {
          const wEntries = weekObj.dates.map((d: string) => entries[d]);
          weekObj.stats = {
            count: weekObj.dates.length,
            mood: getMode(wEntries.map((e: any) => e.mood)),
            energy: getMode(wEntries.map((e: any) => e.energy)),
            topTag: getMode(wEntries.flatMap((e: any) => e.tags || []))
          };
        });
      });
    });

    return data;
  }, [historyDates, entries]);

  const onThisDayMatches = useMemo(() => {
    if (!entries) return [];
    const matches: { date: string; label: string; entry: any }[] = [];
    const today = new Date(actualToday);

    const checkPastDate = (yearsAgo: number, monthsAgo: number, label: string) => {
      const targetDate = new Date(today);
      if (yearsAgo) targetDate.setFullYear(targetDate.getFullYear() - yearsAgo);
      if (monthsAgo) targetDate.setMonth(targetDate.getMonth() - monthsAgo);
      
      const dateStr = targetDate.toISOString().split("T")[0];
      if (entries[dateStr]) {
        matches.push({ date: dateStr, label, entry: entries[dateStr] });
      }
    };

    checkPastDate(1, 0, "1 year ago");
    checkPastDate(0, 6, "6 months ago");
    checkPastDate(0, 1, "1 month ago");

    return matches;
  }, [entries, actualToday]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const toggleSet = (set: Set<string>, setter: React.Dispatch<React.SetStateAction<Set<string>>>, val: string) => {
    setter((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });
  };

  const scrollToMonth = (monthKey: string) => {
    setExpandedMonths(prev => new Set(prev).add(monthKey));
    setTimeout(() => {
      document.getElementById(`month-${monthKey}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const getPreviewSnippet = (entry: any) => {
    if (entry.evening) return `“${entry.evening}”`;
    if (entry.learning) return `“${entry.learning}”`;
    if (entry.morning) return `“${entry.morning}”`;
    if (entry.win) return `“${entry.win}”`;
    return null;
  };

  return (
    <div className={`w-full max-w-[1500px] mx-auto min-h-screen p-4 sm:p-6 md:p-8 font-sans transition-colors ${
      isDarkMode ? "bg-black text-white" : "bg-white text-gray-900"
    }`}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 max-w-5xl">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isDarkMode ? "bg-white/[0.04] border border-white/[0.08]" : "bg-gray-50 border border-gray-200"}`}>
            <History size={24} className={isDarkMode ? "text-zinc-300" : "text-gray-600"} />
          </div>
          <div>
            <h1 className={`text-[2.5rem] font-bold tracking-tight leading-none ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Archive
            </h1>
            <p className={`text-[14px] font-medium mt-2 ${isDarkMode ? "text-zinc-500" : "text-gray-500"}`}>
              {historyDates.length} entries recorded over {Object.keys(archiveData).length} years
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border w-full md:w-80 transition-colors ${
          isDarkMode ? "bg-black border-white/[0.08] focus-within:bg-white/[0.03]" : "bg-white border-gray-200 focus-within:bg-gray-50"
        }`}>
          <Search size={16} className={isDarkMode ? "text-zinc-500" : "text-gray-400"} />
          <input
            type="text"
            placeholder="Search patterns or lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-transparent text-[14px] font-medium outline-none ${
              isDarkMode ? "text-white placeholder-zinc-600" : "text-gray-900 placeholder-gray-400"
            }`}
          />
        </div>
      </div>

      {/* MEMORY LANE */}
      {onThisDayMatches.length > 0 && searchQuery === "" && (
        <div className="mb-10 max-w-5xl">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-orange-500" />
            <h3 className={`text-xs font-bold uppercase tracking-[0.15em] ${isDarkMode ? "text-orange-500/90" : "text-orange-600"}`}>
              Memory Lane
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {onThisDayMatches.slice(0, 3).map(({ date, label, entry }) => (
              <div 
                key={`memory-${date}`}
                className={`p-5 rounded-[20px] border transition-all ${
                  isDarkMode 
                    ? "bg-gradient-to-br from-white/[0.03] to-transparent border-white/[0.08]" 
                    : "bg-gradient-to-br from-gray-50 to-white border-gray-200"
                }`}
              >
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
                  {label} • {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                <div className={`text-[14px] font-medium italic line-clamp-3 ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>
                  {getPreviewSnippet(entry) || "Reflected on this day."}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN LAYOUT: SIDEBAR + CONTENT */}
      <div className="flex flex-col lg:flex-row gap-12 items-start">
        
        {/* DESKTOP SIDEBAR NAVIGATION */}
        <div className="hidden lg:flex flex-col w-64 shrink-0 sticky top-8 space-y-6">
          <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-2 ${isDarkMode ? "text-zinc-600" : "text-gray-400"}`}>
            Timeline Jump
          </div>
          {Object.values(archiveData).sort((a: any, b: any) => Number(b.year) - Number(a.year)).map((yearObj: any) => (
            <div key={yearObj.year} className="space-y-2">
              <div 
                onClick={() => toggleSet(expandedYears, setExpandedYears, yearObj.year)}
                className={`flex items-center justify-between text-sm font-bold cursor-pointer select-none transition-colors ${
                  isDarkMode ? "text-white hover:text-orange-400" : "text-gray-900 hover:text-orange-600"
                }`}
              >
                {yearObj.year} <span className="text-[11px] text-zinc-500 font-medium bg-zinc-500/10 px-2 py-0.5 rounded-full">{yearObj.count}</span>
              </div>
              
              {expandedYears.has(yearObj.year) && (
                <div className={`pl-3 border-l-2 ml-1 flex flex-col gap-1 ${isDarkMode ? "border-white/[0.08]" : "border-gray-100"}`}>
                  {Object.values(yearObj.months).map((m: any) => (
                    <button
                      key={m.monthKey}
                      onClick={() => scrollToMonth(m.monthKey)}
                      className={`text-left text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        isDarkMode ? "text-zinc-400 hover:bg-white/[0.04] hover:text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {m.monthName} <span className="text-[10px] opacity-60 ml-1">({m.dates.length})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FEED CONTENT */}
        <div className="flex-1 w-full max-w-4xl space-y-16">
          {Object.keys(archiveData).length === 0 ? (
            <div className={`py-20 text-center text-[15px] font-medium ${isDarkMode ? "text-zinc-600" : "text-gray-400"}`}>
              No reflections match your search.
            </div>
          ) : (
            Object.values(archiveData).sort((a: any, b: any) => Number(b.year) - Number(a.year)).map((yearObj: any) => (
              <div key={yearObj.year} className="space-y-12">
                
                {/* Months Iteration */}
                {Object.values(yearObj.months).map((monthObj: any) => {
                  const isMonthExpanded = expandedMonths.has(monthObj.monthKey);

                  return (
                    <div key={monthObj.monthKey} id={`month-${monthObj.monthKey}`} className="space-y-6">
                      
                      {/* Premium Month Header */}
                      <div 
                        onClick={() => toggleSet(expandedMonths, setExpandedMonths, monthObj.monthKey)}
                        className={`p-6 rounded-[24px] border cursor-pointer transition-all select-none group ${
                          isDarkMode 
                            ? "bg-black border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.02]" 
                            : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h2 className={`text-2xl font-bold flex items-center gap-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            <Calendar size={22} className="text-orange-500" />
                            {monthObj.monthKey}
                          </h2>
                          <div className={`p-2 rounded-full transition-transform duration-300 ${isMonthExpanded ? "rotate-180" : ""} ${
                            isDarkMode ? "bg-white/[0.05] text-zinc-400 group-hover:text-white" : "bg-gray-100 text-gray-500 group-hover:text-gray-900"
                          }`}>
                            <ChevronDown size={18} />
                          </div>
                        </div>

                        {/* Month Analytics Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-white/[0.02] border-white/[0.04]" : "bg-gray-50/50 border-gray-100"}`}>
                            <div className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>Entries</div>
                            <div className={`text-xl font-bold flex items-center gap-2 ${textPrimaryClass(isDarkMode)}`}><Hash size={16} className="text-blue-500" /> {monthObj.stats.count}</div>
                          </div>
                          <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-white/[0.02] border-white/[0.04]" : "bg-gray-50/50 border-gray-100"}`}>
                            <div className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>Overall Mood</div>
                            <div className={`text-xl font-bold flex items-center gap-2 ${textPrimaryClass(isDarkMode)}`}>{getMoodEmoji(monthObj.stats.mood)} <span className="text-sm capitalize">{monthObj.stats.mood || "N/A"}</span></div>
                          </div>
                          <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-white/[0.02] border-white/[0.04]" : "bg-gray-50/50 border-gray-100"}`}>
                            <div className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>Top Focus</div>
                            <div className={`text-sm font-bold flex items-center gap-2 truncate ${textPrimaryClass(isDarkMode)}`}><TrendingUp size={16} className="text-purple-500 shrink-0" /> {monthObj.stats.topTag || "None"}</div>
                          </div>
                          <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-white/[0.02] border-white/[0.04]" : "bg-gray-50/50 border-gray-100"}`}>
                            <div className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>Best Streak</div>
                            <div className={`text-xl font-bold flex items-center gap-2 ${textPrimaryClass(isDarkMode)}`}><Award size={16} className="text-orange-500" /> {monthObj.stats.streak} Days</div>
                          </div>
                        </div>
                      </div>

                      {/* Weeks within Month */}
                      {isMonthExpanded && (
                        <div className="pl-2 md:pl-6 space-y-8 animate-in slide-in-from-top-2 duration-300 border-l-2 ml-4 md:ml-8" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                          {Object.values(monthObj.weeks).map((weekObj: any) => {
                            const isWeekExpanded = expandedWeeks.has(weekObj.weekKey);

                            return (
                              <div key={weekObj.weekKey} className="relative">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[27px] md:-left-[43px] top-4 w-3 h-3 rounded-full border-2 ${
                                  isDarkMode ? "bg-black border-zinc-700" : "bg-white border-gray-300"
                                }`} />

                                {/* Week Header Toggle */}
                                <div 
                                  onClick={() => toggleSet(expandedWeeks, setExpandedWeeks, weekObj.weekKey)}
                                  className={`flex items-center gap-4 py-2 cursor-pointer select-none group transition-colors rounded-xl px-3 -ml-3 ${
                                    isDarkMode ? "hover:bg-white/[0.03]" : "hover:bg-gray-50"
                                  }`}
                                >
                                  <div className={`p-1.5 rounded-lg transition-transform duration-200 ${isWeekExpanded ? "rotate-90 bg-orange-500/10 text-orange-500" : (isDarkMode ? "bg-white/[0.05] text-zinc-400" : "bg-gray-100 text-gray-500")}`}>
                                    <ChevronRight size={14} />
                                  </div>
                                  <h3 className={`text-[15px] font-bold ${isDarkMode ? "text-zinc-200" : "text-gray-800"}`}>
                                    {weekObj.weekLabel} <span className="text-xs font-medium opacity-50 ml-2">({weekObj.stats.count} Days)</span>
                                  </h3>
                                  
                                  {/* Week Mini-Stats */}
                                  <div className="hidden sm:flex items-center gap-3 ml-auto text-xs font-semibold">
                                    {weekObj.stats.mood && <span className={`flex items-center gap-1 ${isDarkMode ? "text-zinc-400" : "text-gray-500"}`}>{getMoodEmoji(weekObj.stats.mood)} Mode</span>}
                                    {weekObj.stats.topTag && <span className={`px-2 py-1 rounded border ${isDarkMode ? "bg-white/[0.02] border-white/[0.06] text-zinc-400" : "bg-white border-gray-200 text-gray-500"}`}>#{weekObj.stats.topTag}</span>}
                                  </div>
                                </div>

                                {/* Days within Week */}
                                {isWeekExpanded && (
                                  <div className="mt-4 space-y-3 pl-2 md:pl-4 animate-in slide-in-from-top-1 duration-200">
                                    {weekObj.dates.map((dateStr: string) => {
                                      const entry = entries[dateStr];
                                      const isDayExpanded = expandedDays.has(dateStr);
                                      const d = new Date(dateStr);
                                      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                                      const dayNum = d.getDate();
                                      const snippet = getPreviewSnippet(entry);

                                      return (
                                        <div 
                                          key={dateStr} 
                                          id={`entry-${dateStr}`}
                                          className={`rounded-[16px] border overflow-hidden transition-all duration-200 ${
                                            isDarkMode 
                                              ? `bg-[#0a0a0a] border-white/[0.06] ${isDayExpanded ? "border-white/[0.15]" : "hover:border-white/[0.12]"}`
                                              : `bg-white border-gray-200 ${isDayExpanded ? "shadow-md border-gray-300" : "hover:shadow-sm"}`
                                          }`}
                                        >
                                          {/* Day Header (Clickable) */}
                                          <div 
                                            onClick={() => toggleSet(expandedDays, setExpandedDays, dateStr)}
                                            className={`px-4 py-3 md:px-5 flex items-center justify-between gap-4 cursor-pointer select-none`}
                                          >
                                            <div className="flex items-center gap-4">
                                              <div className={`w-10 text-center shrink-0`}>
                                                <div className={`text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none mb-1 ${isDarkMode ? "text-zinc-400" : "text-gray-500"}`}>{dayName}</div>
                                                <div className={`text-[16px] font-bold leading-none ${isDarkMode ? "text-white" : "text-gray-900"}`}>{dayNum}</div>
                                              </div>

                                              <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-3">
                                                  <div className="flex gap-1.5 items-center">
                                                    {entry.mood && getMoodIcon(entry.mood)}
                                                    {entry.energy && getEnergyIcon(entry.energy)}
                                                  </div>
                                                  {entry.tags && entry.tags.length > 0 && (
                                                    <div className="hidden sm:flex items-center gap-1 border-l pl-3 border-inherit opacity-80">
                                                      {entry.tags.slice(0, 2).map((tag: string) => (
                                                        <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-wider ${
                                                          isDarkMode ? "bg-white/[0.05] text-zinc-300" : "bg-gray-100 text-gray-600"
                                                        }`}>{tag}</span>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                                
                                                {!isDayExpanded && snippet && (
                                                  <p className={`text-[12px] italic truncate max-w-[200px] sm:max-w-[300px] md:max-w-[450px] ${
                                                    isDarkMode ? "text-zinc-500" : "text-gray-500"
                                                  }`}>
                                                    {snippet}
                                                  </p>
                                                )}
                                              </div>
                                            </div>

                                            <div className={`p-1.5 rounded-full transition-colors ${
                                              isDarkMode ? "text-zinc-500 hover:bg-white/[0.06] hover:text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                                            }`}>
                                              {isDayExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </div>
                                          </div>

                                          {/* Expanded Day Content */}
                                          {isDayExpanded && (
                                            <div className={`p-4 md:p-5 border-t text-[13px] ${isDarkMode ? "border-white/[0.06] bg-[#0f0f0f]" : "border-gray-100 bg-gray-50/30"}`}>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-5">
                                                  {entry.win && (
                                                    <div>
                                                      <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isDarkMode ? "text-green-500/80" : "text-green-600"}`}>Biggest Win</h4>
                                                      <p className={`leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>{entry.win}</p>
                                                    </div>
                                                  )}
                                                  {entry.learning && (
                                                    <div>
                                                      <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isDarkMode ? "text-blue-500/80" : "text-blue-600"}`}>Today's Lesson</h4>
                                                      <p className={`leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>{entry.learning}</p>
                                                    </div>
                                                  )}
                                                  {entry.morning && (
                                                    <div>
                                                      <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isDarkMode ? "text-orange-500/80" : "text-orange-600"}`}>Morning Intent</h4>
                                                      <p className={`leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>{entry.morning}</p>
                                                    </div>
                                                  )}
                                                </div>
                                                <div className="space-y-5">
                                                  {entry.frictions && entry.frictions.length > 0 && entry.frictions[0] && (
                                                    <div>
                                                      <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isDarkMode ? "text-red-500/80" : "text-red-600"}`}>Friction</h4>
                                                      <p className={`leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>{entry.frictions[0]}</p>
                                                    </div>
                                                  )}
                                                  {entry.improvement && (
                                                    <div>
                                                      <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isDarkMode ? "text-purple-500/80" : "text-purple-600"}`}>Tomorrow Adjustment</h4>
                                                      <p className={`leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>{entry.improvement}</p>
                                                    </div>
                                                  )}
                                                  {entry.evening && (
                                                    <div>
                                                      <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isDarkMode ? "text-indigo-500/80" : "text-indigo-600"}`}>Evening Reflection</h4>
                                                      <p className={`leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>{entry.evening}</p>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                              {entry.tags && entry.tags.length > 0 && (
                                                <div className={`mt-6 pt-4 border-t flex flex-wrap gap-2 ${isDarkMode ? "border-white/[0.04]" : "border-gray-100"}`}>
                                                  {entry.tags.map((tag: string) => (
                                                    <span key={tag} className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                                      isDarkMode ? "bg-white/[0.03] border-white/[0.08] text-zinc-400" : "bg-white border-gray-200 text-gray-500"
                                                    }`}>{tag}</span>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Utility class helper
const textPrimaryClass = (isDark: boolean) => isDark ? "text-white" : "text-slate-900";