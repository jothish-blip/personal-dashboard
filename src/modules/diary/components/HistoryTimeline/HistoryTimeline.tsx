"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Calendar,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
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
  Clock
} from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

export default function HistoryTimeline({ system }: any) {
  // FIXED: Properly destructure allEntries from the system object
  const { allEntries: entries = {} } = system || {};
  const { isDarkMode } = useTheme();

  // FIXED: Default to "all" time so history is visible immediately
  const [rangeFilter, setRangeFilter] = useState<"7d" | "30d" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [jumpDate, setJumpDate] = useState("");
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const actualToday = new Date().toISOString().split("T")[0];

  // ==========================================================================
  // DATA PROCESSING
  // ==========================================================================
  
  const historyDates = useMemo(() => {
    if (!entries || Object.keys(entries).length === 0) return [];
    const allDates = Object.keys(entries);

    // Keep full archive. Limit removed.
    let filtered = allDates
      .filter((d) => d <= actualToday)
      .sort()
      .reverse();

    if (rangeFilter === "7d") {
      filtered = filtered.slice(0, 7);
    } else if (rangeFilter === "30d") {
      filtered = filtered.slice(0, 30);
    }

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
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return textToSearch.includes(q);
      });
    }

    return filtered;
  }, [entries, rangeFilter, searchQuery, actualToday]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, string[]> = {};
    
    historyDates.forEach((dateStr) => {
      const d = new Date(dateStr);
      const monthYear = d.toLocaleString("default", { month: "long", year: "numeric" }).toUpperCase();
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(dateStr);
    });

    return groups;
  }, [historyDates]);

  const onThisDayMatches = useMemo(() => {
    if (!entries) return [];
    
    const matches: {
      date: string;
      label: string;
      entry: any;
    }[] = [];
    
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

    checkPastDate(1, 0, "1 year ago today");
    checkPastDate(0, 6, "6 months ago today");
    checkPastDate(0, 2, "2 months ago today");
    checkPastDate(0, 1, "1 month ago today");

    return matches;
  }, [entries, actualToday]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) => {
      const updated = new Set(prev);
      if (updated.has(date)) {
        updated.delete(date);
      } else {
        updated.add(date);
      }
      return updated;
    });
  };

  const handleExpandAll = () => {
    setExpandedDates(new Set(historyDates));
  };

  const handleCollapseAll = () => {
    setExpandedDates(new Set());
  };

  const handleJumpDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setJumpDate(date);
    if (date) {
      setTimeout(() => {
        const element = document.getElementById(`entry-${date}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          setExpandedDates((prev) => {
            const updated = new Set(prev);
            updated.add(date);
            return updated;
          });
        }
      }, 100);
    }
  };

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const getPreviewSnippet = (entry: any) => {
    if (entry.evening) return `“${entry.evening}”`;
    if (entry.learning) return `“${entry.learning}”`;
    if (entry.morning) return `“${entry.morning}”`;
    if (entry.win) return `“${entry.win}”`;
    return null;
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

  return (
    <div className={`w-full max-w-5xl mx-auto rounded-[24px] border p-4 sm:p-6 md:p-8 transition-colors ${
      isDarkMode ? "bg-black border-white/[0.08]" : "bg-white border-gray-200"
    }`}>
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isDarkMode ? "bg-white/[0.04]" : "bg-gray-100"}`}>
            <History size={20} className={isDarkMode ? "text-zinc-300" : "text-gray-600"} />
          </div>
          <div>
            <h2 className={`text-xl font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Reflection Archive
            </h2>
            <p className={`text-[13px] ${isDarkMode ? "text-zinc-500" : "text-gray-500"}`}>
              {historyDates.length} entries recorded
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Jump Search */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors ${
            isDarkMode ? "bg-black border-white/[0.08] focus-within:bg-white/[0.03]" : "bg-white border-gray-200"
          }`}>
            <Calendar size={14} className={isDarkMode ? "text-zinc-500" : "text-gray-400"} />
            <input 
              type="date" 
              value={jumpDate}
              onChange={handleJumpDate}
              className={`bg-transparent text-[13px] outline-none ${isDarkMode ? "text-zinc-300 [color-scheme:dark]" : "text-gray-700"}`}
            />
          </div>

          <div className={`flex items-center gap-1 p-1 rounded-xl border ${isDarkMode ? "border-white/[0.08] bg-black" : "border-gray-200 bg-gray-50"}`}>
            {(["7d", "30d", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRangeFilter(r)}
                className={`px-3 py-1 text-[12px] font-semibold rounded-lg transition-all ${
                  rangeFilter === r
                    ? isDarkMode ? "bg-white/[0.08] text-white shadow-sm" : "bg-white text-gray-900 shadow-sm"
                    : isDarkMode ? "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]" : "text-gray-500 hover:bg-gray-200"
                }`}
              >
                {r === "all" ? "All Time" : r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
        <div className={`flex-1 flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border transition-colors ${
          isDarkMode ? "bg-black border-white/[0.08] focus-within:bg-white/[0.03]" : "bg-white border-gray-200 focus-within:bg-gray-50"
        }`}>
          <Search size={16} className={isDarkMode ? "text-zinc-500" : "text-gray-400"} />
          <input
            type="text"
            placeholder="Search patterns, lessons, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-transparent text-[14px] outline-none ${
              isDarkMode ? "text-white placeholder-zinc-600" : "text-gray-900 placeholder-gray-400"
            }`}
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button 
            onClick={handleExpandAll}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold border transition-colors ${
              isDarkMode ? "bg-black border-white/[0.08] text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Maximize2 size={14} /> Expand All
          </button>
          <button 
            onClick={handleCollapseAll}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold border transition-colors ${
              isDarkMode ? "bg-black border-white/[0.08] text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Minimize2 size={14} /> Collapse
          </button>
        </div>
      </div>

      {/* ON THIS DAY BANNER */}
      {onThisDayMatches.length > 0 && searchQuery === "" && rangeFilter === "all" && (
        <div className="mb-10 space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Clock size={16} className="text-orange-500" />
            <h3 className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? "text-orange-500/90" : "text-orange-600"}`}>
              On This Day
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {onThisDayMatches.map(({ date, label, entry }) => (
              <div 
                key={`on-this-day-${date}`}
                onClick={() => {
                  setJumpDate(date);
                  setTimeout(() => {
                    const el = document.getElementById(`entry-${date}`);
                    if(el) {
                       el.scrollIntoView({ behavior: "smooth", block: "center" });
                       setExpandedDates((prev) => {
                         const updated = new Set(prev);
                         updated.add(date);
                         return updated;
                       });
                    }
                  }, 50);
                }}
                className={`p-4 rounded-[20px] border cursor-pointer transition-all ${
                  isDarkMode 
                    ? "bg-black border-orange-500/20 hover:border-orange-500/40 hover:bg-white/[0.02]" 
                    : "bg-orange-50/30 border-orange-200 hover:border-orange-300 hover:bg-orange-50"
                }`}
              >
                <div className={`text-[11px] font-bold uppercase tracking-wide mb-2 ${isDarkMode ? "text-orange-500/70" : "text-orange-600/70"}`}>
                  {label} • {new Date(date).toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <div className={`text-[14px] italic line-clamp-2 ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>
                  {getPreviewSnippet(entry) || "Reflected on this day."}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIMELINE RENDER */}
      <div className="space-y-12">
        {Object.keys(groupedByMonth).length === 0 ? (
          <div className={`py-12 text-center text-[14px] ${isDarkMode ? "text-zinc-600" : "text-gray-400"}`}>
            No reflections found for this filter.
          </div>
        ) : (
          Object.entries(groupedByMonth).map(([monthYear, dates]) => (
            <div key={monthYear} className="space-y-6">
              
              {/* Month Divider */}
              <div className="flex items-center gap-4">
                <h3 className={`text-[12px] font-bold uppercase tracking-widest ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
                  {monthYear}
                </h3>
                <div className={`flex-1 h-px ${isDarkMode ? "bg-white/[0.06]" : "bg-gray-100"}`} />
              </div>

              {/* Entries for Month */}
              <div className="space-y-4">
                {dates.map((dateStr) => {
                  const entry = entries[dateStr];
                  if (!entry) return null;

                  const isExpanded = expandedDates.has(dateStr);
                  const d = new Date(dateStr);
                  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                  const dayNum = d.getDate();
                  
                  const snippet = getPreviewSnippet(entry);

                  return (
                    <div 
                      key={dateStr} 
                      id={`entry-${dateStr}`}
                      className={`rounded-[20px] border overflow-hidden transition-all duration-300 ${
                        isDarkMode 
                          ? `bg-black border-white/[0.08] ${isExpanded ? "border-white/[0.12] shadow-[0_4px_20px_rgba(0,0,0,0.4)]" : "hover:border-white/[0.12] hover:bg-white/[0.03]"}`
                          : `bg-white border-gray-200 ${isExpanded ? "shadow-md" : "hover:shadow-sm"}`
                      }`}
                    >
                      {/* Card Header (Clickable) */}
                      <div 
                        onClick={() => toggleExpand(dateStr)}
                        className={`p-4 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl border shrink-0 ${
                            isDarkMode ? "bg-white/[0.03] border-white/[0.08] text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                          }`}>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 leading-none mb-1">{dayName}</span>
                            <span className="text-[18px] font-bold leading-none">{dayNum}</span>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-3">
                              {/* Stat Icons */}
                              <div className="flex gap-2 items-center">
                                {entry.mood && getMoodIcon(entry.mood)}
                                {entry.energy && getEnergyIcon(entry.energy)}
                                {entry.sleep && getSleepIcon(entry.sleep)}
                              </div>
                              
                              {/* Tags */}
                              {entry.tags && entry.tags.length > 0 && (
                                <div className="hidden sm:flex items-center gap-1.5 border-l pl-3 border-inherit">
                                  {entry.tags.slice(0, 2).map((tag: string) => (
                                    <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                                      isDarkMode ? "bg-white/[0.03] border-white/[0.08] text-zinc-400" : "bg-gray-100 border-transparent text-gray-600"
                                    }`}>
                                      {tag}
                                    </span>
                                  ))}
                                  {entry.tags.length > 2 && (
                                    <span className={`text-[10px] font-semibold ${isDarkMode ? "text-zinc-600" : "text-gray-400"}`}>
                                      +{entry.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Preview Snippet */}
                            {!isExpanded && snippet && (
                              <p className={`text-[13px] italic truncate max-w-[280px] sm:max-w-[400px] md:max-w-[500px] ${
                                isDarkMode ? "text-zinc-500" : "text-gray-500"
                              }`}>
                                {snippet}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className={`p-2 rounded-full transition-colors self-end md:self-auto ${
                          isDarkMode ? "text-zinc-500 hover:bg-white/[0.06] hover:text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                        }`}>
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className={`p-4 md:p-6 border-t ${isDarkMode ? "border-white/[0.08]" : "border-gray-100"}`}>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Positive/Learning */}
                            <div className="space-y-6">
                              {entry.win && (
                                <div>
                                  <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? "text-green-500/80" : "text-green-600"}`}>Biggest Win</h4>
                                  <p className={`text-[14px] leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>{entry.win}</p>
                                </div>
                              )}
                              
                              {entry.learning && (
                                <div>
                                  <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? "text-blue-500/80" : "text-blue-600"}`}>Today's Lesson</h4>
                                  <p className={`text-[14px] leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>{entry.learning}</p>
                                </div>
                              )}

                              {entry.morning && (
                                <div>
                                  <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? "text-orange-500/80" : "text-orange-600"}`}>Morning Intent</h4>
                                  <p className={`text-[14px] leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>{entry.morning}</p>
                                </div>
                              )}
                            </div>
                            {entry.afternoon && (
                            <div>
                                <h4
                        className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${
                          isDarkMode
                      ? "text-yellow-500/80"
                   : "text-yellow-600"
                   }`}
                    >
                  Afternoon Reflection
                   </h4>

                         <p
                   className={`text-[14px] leading-relaxed ${
                        isDarkMode
                    ? "text-zinc-300"
                     : "text-gray-700"
                       }`}
                     >
                 {entry.afternoon}
                   </p>
                       </div>
                         )}

                            {/* Friction/Adjustment */}
                            <div className="space-y-6">
                              {entry.frictions && entry.frictions.length > 0 && entry.frictions[0] && (
                                <div>
                                  <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? "text-red-500/80" : "text-red-600"}`}>Friction</h4>
                                  <p className={`text-[14px] leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>{entry.frictions[0]}</p>
                                </div>
                              )}

                              {entry.improvement && (
                                <div>
                                  <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? "text-purple-500/80" : "text-purple-600"}`}>Tomorrow Adjustment</h4>
                                  <p className={`text-[14px] leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>{entry.improvement}</p>
                                </div>
                              )}

                              {entry.evening && (
                                <div>
                                  <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? "text-indigo-500/80" : "text-indigo-600"}`}>Evening Reflection</h4>
                                  <p className={`text-[14px] leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>{entry.evening}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Full Tags Row */}
                          {entry.tags && entry.tags.length > 0 && (
                            <div className={`mt-8 pt-5 border-t flex flex-wrap gap-2 ${isDarkMode ? "border-white/[0.04]" : "border-gray-100"}`}>
                              {entry.tags.map((tag: string) => (
                                <span key={tag} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border ${
                                  isDarkMode ? "bg-white/[0.03] border-white/[0.08] text-zinc-400" : "bg-gray-50 border-gray-200 text-gray-600"
                                }`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}