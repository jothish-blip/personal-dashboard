"use client";

import React, { useState, useMemo } from "react";
import { useFocusSystem } from "../../engine/useFocusSystem";
import { Distraction, FocusSession } from "../../types/types";
import { ChevronDown, ChevronUp, AlertCircle, Play, Pause, Info, TrendingUp } from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

type DateFilter = "all" | "today" | "yesterday" | "week" | "custom";

const getDateStr = (ts: number) => {
  return new Date(ts).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
};

export default function SessionHistory() {
  const { sessions: contextSessions, isLoaded } = useFocusSystem();
  const { isDarkMode } = useTheme();
  
  // 🔥 Only keep sessions that are 1 minute (60s) or longer.
  const typedSessions = useMemo(() => {
    const allSessions = (contextSessions || []) as FocusSession[];
    return allSessions.filter(s => {
      const totalFocusTime = (s.durationSeconds || 0) + (s.extraDuration || 0);
      return totalFocusTime >= 60; // 1-Minute Rule
    });
  }, [contextSessions]);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<DateFilter>("all");
  const [customDate, setCustomDate] = useState<Date>(new Date());

  // 🔥 Smart formatter: Shows seconds if < 1m, or combined if needed, drops seconds if cleanly on the minute
  const formatCleanDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m > 0 && s > 0) return `${m}m ${s}s`;
    if (m > 0) return `${m}m`;
    return `${s}s`;
  };

  const formatStartTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).toUpperCase();
  };

  const formatEndTime = (session: FocusSession) => {
    const fallbackEnd = session.startTime + (session.actualDuration * 1000);
    const end = session.endTime || fallbackEnd;
    
    return new Date(end).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).toUpperCase();
  };

  const formatMode = (mode: string) => {
    if (mode === "deepWork") return "Deep Work";
    if (mode === "pomodoro") return "Pomodoro";
    return "Custom";
  };

  const getSessionClassification = (distractionCount: number, mode: string, initialSessionTime: number, isDark: boolean) => {
    const isDeepWork = mode === "deepWork" || initialSessionTime > 1800;
    
    if (isDeepWork) {
      if (distractionCount <= 2) return { label: "Deep Focus", style: isDark ? "bg-emerald-950/30 text-emerald-400 border border-emerald-900/50" : "bg-emerald-50 text-emerald-700 border border-emerald-200" };
      if (distractionCount <= 6) return { label: "Stable", style: isDark ? "bg-blue-950/30 text-blue-400 border border-blue-900/50" : "bg-blue-50 text-blue-700 border border-blue-200" };
      if (distractionCount <= 10) return { label: "Attention Shifted", style: isDark ? "bg-orange-950/30 text-orange-400 border border-orange-900/50" : "bg-orange-50 text-orange-700 border border-orange-200" };
      return { label: "Interrupted", style: isDark ? "bg-red-950/30 text-red-400 border border-red-900/50" : "bg-red-50 text-red-700 border border-red-200" };
    } else {
      if (distractionCount === 0) return { label: "Deep Focus", style: isDark ? "bg-emerald-950/30 text-emerald-400 border border-emerald-900/50" : "bg-emerald-50 text-emerald-700 border border-emerald-200" };
      if (distractionCount <= 3) return { label: "Stable", style: isDark ? "bg-blue-950/30 text-blue-400 border border-blue-900/50" : "bg-blue-50 text-blue-700 border border-blue-200" };
      if (distractionCount <= 6) return { label: "Attention Shifted", style: isDark ? "bg-orange-950/30 text-orange-400 border border-orange-900/50" : "bg-orange-50 text-orange-700 border border-orange-200" };
      return { label: "Interrupted", style: isDark ? "bg-red-950/30 text-red-400 border border-red-900/50" : "bg-red-50 text-red-700 border border-red-200" };
    }
  };

  const getTopDistraction = (distractions: Distraction[]) => {
    if (!distractions || distractions.length === 0) return null;
    const counts = distractions.reduce<Record<string, number>>((acc, d: Distraction) => {
      acc[d.reason] = (acc[d.reason] || 0) + 1;
      return acc;
    }, {});
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { reason: sorted[0][0], count: sorted[0][1] } : null;
  };

  const groupTimestamps = (distractions: Distraction[]) => {
    const grouped = distractions.reduce<Record<string, number>>((acc, d) => {
      const timeStr = new Date(d.timestamp).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: '2-digit', minute: '2-digit' });
      acc[timeStr] = (acc[timeStr] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped);
  };

  const { todayStr, yesterdayStr, weekStart } = useMemo(() => {
    const now = Date.now();
    const tStr = getDateStr(now);
    
    const yestDate = new Date();
    yestDate.setDate(yestDate.getDate() - 1);
    const yStr = getDateStr(yestDate.getTime());

    const wStart = new Date();
    wStart.setDate(wStart.getDate() - 6);
    wStart.setHours(0, 0, 0, 0);

    return { todayStr: tStr, yesterdayStr: yStr, weekStart: wStart };
  }, []);
  
  const filteredSessions = useMemo(() => {
    const isInFilter = (s: FocusSession) => {
      if (filter === "all") return true;

      const d = getDateStr(s.startTime);
      switch (filter) {
        case "today":
          return d === todayStr;
        case "yesterday":
          return d === yesterdayStr;
        case "week":
          return new Date(s.startTime) >= weekStart;
        case "custom":
          return d === getDateStr(customDate.getTime());
        default:
          return true;
      }
    };

    return typedSessions.filter(isInFilter);
  }, [typedSessions, filter, customDate, todayStr, yesterdayStr, weekStart]);

  const sortedSessions = useMemo(() => {
    return [...filteredSessions].sort((a: FocusSession, b: FocusSession) => b.startTime - a.startTime);
  }, [filteredSessions]);

  const dailySummary = useMemo(() => {
    if (sortedSessions.length === 0) return null;
    let totalFocus = 0;
    let totalQualitySum = 0;
    let allDistractions: Distraction[] = [];

    sortedSessions.forEach(s => {
      const focusDur = s.durationSeconds || 0;
      const extraDur = s.extraDuration || 0;
      const totalDur = Math.max(1, ((s.endTime || (s.startTime + s.actualDuration * 1000)) - s.startTime) / 1000);
      const pausedDur = Math.max(0, totalDur - (focusDur + extraDur));
      
      const quality = (focusDur + pausedDur) > 0 ? Math.round((focusDur / (focusDur + pausedDur)) * 100) : 0;
      
      totalFocus += focusDur + extraDur;
      totalQualitySum += quality;
      if (s.distractions) allDistractions = [...allDistractions, ...s.distractions];
    });

    const avgQuality = Math.round(totalQualitySum / sortedSessions.length);
    const topIssue = getTopDistraction(allDistractions);

    let insight = "Consistent session quality.";
    if (avgQuality > 85) insight = "Strong focus consistency.";
    else if (allDistractions.length > 5) insight = "Frequent attention shifts.";
    
    return {
      sessions: sortedSessions.length,
      focusMins: Math.floor(totalFocus / 60),
      avgQuality,
      topIssue: topIssue?.reason || "None",
      insight
    };
  }, [sortedSessions]);

  const groupedSessions = useMemo(() => {
    const groups = sortedSessions.reduce<Record<string, FocusSession[]>>((acc, session: FocusSession) => {
      const dObj = new Date(session.startTime); 
      const dateKey = getDateStr(session.startTime);
      
      let dateLabel = "";
      if (dateKey === todayStr) {
        dateLabel = "Today";
      } else if (dateKey === yesterdayStr) {
        dateLabel = "Yesterday";
      } else {
        const dStr = dObj.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", month: "short", day: "numeric" });
        const dayStr = dObj.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short" });
        dateLabel = `${dStr} • ${dayStr}`;
      }

      if (!acc[dateLabel]) acc[dateLabel] = [];
      acc[dateLabel].push(session);
      return acc;
    }, {});

    Object.keys(groups).forEach(key => {
      groups[key].sort((a: FocusSession, b: FocusSession) => b.startTime - a.startTime);
    });

    return groups;
  }, [sortedSessions, todayStr, yesterdayStr]);

  return (
    <div className={`p-5 rounded-xl h-full max-h-[700px] flex flex-col font-sans transition-colors duration-300 border ${
      isDarkMode ? "bg-black border-white/[0.04] text-white/90" : "bg-white border-gray-200 text-gray-900"
    }`}>
      
      <div className="flex items-center justify-between mb-5 shrink-0">
        <h2 className={`text-sm font-semibold ${isDarkMode ? "text-white/90" : "text-gray-900"}`}>Session History</h2>
      </div>

      <div className="shrink-0 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {(["all", "today", "yesterday", "week", "custom"] as DateFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap border ${
                filter === f
                  ? (isDarkMode 
                      ? "bg-orange-950/30 text-orange-400 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]" 
                      : "bg-gray-900 text-white border-transparent shadow-sm")
                  : (isDarkMode 
                      ? "bg-black text-gray-400 hover:text-gray-300 hover:bg-white/[0.03] border-transparent" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent")
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filter === "custom" && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-1">
            <input
              type="date"
              className={`px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 transition-colors duration-300 border ${
                isDarkMode 
                  ? "bg-black border-white/[0.04] text-gray-300 focus:ring-white/[0.06] [color-scheme:dark]" 
                  : "bg-gray-50 border-gray-200 text-gray-700 focus:ring-blue-500/20"
              }`}
              value={getDateStr(customDate.getTime())}
              onChange={(e) => {
                if (e.target.value) {
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    setCustomDate(new Date(year, month - 1, day));
                }
              }}
            />
          </div>
        )}
      </div>

      {dailySummary && (
        <div className={`mb-6 p-4 rounded-xl flex flex-col gap-3 shrink-0 border transition-colors ${
          isDarkMode ? "bg-black border-white/[0.04]" : "bg-gray-50 border-gray-200"
        }`}>
          <div className="flex justify-between items-center">
            <span className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Summary Overview</span>
            <span className={`text-[10px] flex items-center gap-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}><TrendingUp size={12} /> {dailySummary.insight}</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase tracking-widest mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Sessions</span>
              <span className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{dailySummary.sessions}</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase tracking-widest mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Focused</span>
              <span className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{dailySummary.focusMins}m</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase tracking-widest mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Quality</span>
              <span className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{dailySummary.avgQuality}%</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase tracking-widest mb-1 truncate ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Top Issue</span>
              <span className={`text-sm font-medium truncate pt-0.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{dailySummary.topIssue}</span>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar relative">
        
        {!isLoaded ? (
          <div className={`flex flex-col items-center justify-center py-10 h-full animate-pulse ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            <span className={`w-5 h-5 border-2 rounded-full animate-spin mb-3 ${isDarkMode ? "border-white/[0.04] border-t-gray-400" : "border-gray-200 border-t-gray-500"}`}></span>
            <span className="text-xs font-medium">Loading history...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-12 h-full animate-in fade-in ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            <Info size={24} className="mb-3 opacity-50" />
            <span className="text-sm font-medium">No valid sessions logged</span>
            <span className="text-xs text-center mt-1.5 opacity-80">
              {filter === "today" 
                ? "Start a session (> 1 min) to see your data here." 
                : "No valid data recorded for this time period."}
            </span>
          </div>
        ) : (
          Object.entries(groupedSessions).map(([dateLabel, daySessions]) => (
            <div key={dateLabel} className="mb-8 relative">
              
              <h3 className={`text-[10px] font-bold uppercase tracking-widest sticky top-0 py-2 z-20 mb-4 transition-colors ${
                isDarkMode ? "text-gray-500 bg-black/95" : "text-gray-500 bg-white/95"
              }`}>
                {dateLabel}
              </h3>

              <div className="flex flex-col gap-4">
                {daySessions.map((session: FocusSession, index: number) => {
                  
                  const dists = Array.isArray(session.distractions) ? session.distractions : []; 
                  const distCount = dists.length || 0;
                  // @ts-ignore
                  const pauseTimeline = session.pauseTimeline || [];
                  const hasPauses = pauseTimeline.length > 0;
                  const canExpand = distCount > 0 || hasPauses;
                  
                  const rawEndTime = session.endTime || (session.startTime + session.actualDuration * 1000);
                  const totalDuration = Math.max(1, (rawEndTime - session.startTime) / 1000);
                  
                  const focusedDur = session.durationSeconds || 0;
                  const extraDur = session.extraDuration || 0;
                  const actualDur = session.actualDuration || 0;

                  const totalFocusDuration =
                    actualDur > focusedDur
                      ? actualDur
                      : focusedDur + (actualDur >= focusedDur + extraDur ? 0 : extraDur);

                  const displayExtra = totalFocusDuration - focusedDur;
                  const pausedDuration = Math.max(0, totalDuration - (focusedDur + extraDur));
                  
                  const focusQuality = (focusedDur + pausedDuration) > 0 
                    ? Math.round((focusedDur / (focusedDur + pausedDuration)) * 100) 
                    : 0;
                  
                  const classification = getSessionClassification(distCount, session.mode, session.initialSessionTime || 1500, isDarkMode);
                  const isExpanded = expandedId === session.id;
                  const isLast = index === daySessions.length - 1;
                  const hasExtraFlow = extraDur > 30;

                  return (
                    <div key={session.id} className="flex gap-4 relative group">
                      
                      {/* Left Time Column with Paused Duration */}
                      <div className={`w-[65px] shrink-0 flex flex-col items-end text-[10px] font-medium pt-1.5 opacity-80 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                        <span>{formatStartTime(session.startTime)}</span>
                        <div className="flex flex-col items-center justify-center h-5 my-0.5 opacity-40">
                           <span className="text-[8px]">↓</span>
                        </div>
                        <span>{formatEndTime(session)}</span>
                        
                        {pausedDuration >= 5 && (
                          <span className={`text-[9px] mt-1.5 whitespace-nowrap text-center leading-tight ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                            {formatCleanDuration(pausedDuration)} paused
                          </span>
                        )}
                      </div>

                      {/* Line & Dot */}
                      <div className="relative flex flex-col items-center">
                        <div className={`w-px absolute top-3 z-0 ${isLast ? `h-full bg-gradient-to-b to-transparent ${isDarkMode ? "from-white/[0.04]" : "from-gray-200"}` : `h-full ${isDarkMode ? "bg-white/[0.04]" : "bg-gray-200"}`}`}></div>
                        <div className={`w-2 h-2 rounded-full z-10 mt-2 ring-4 shadow-sm transition-transform duration-300 group-hover:scale-125 ${isDarkMode ? "ring-black" : "ring-white"} ${
                          hasExtraFlow ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                        }`}></div>
                      </div>

                      {/* Main Card */}
                      <div className="flex-1 pb-2 min-w-0">
                        <div
                          className={`p-3.5 rounded-xl transition-all relative overflow-hidden border ${
                            isExpanded 
                              ? (isDarkMode ? "bg-black border-white/[0.06] shadow-lg" : "bg-white border-blue-200 ring-1 ring-blue-50 shadow-md") 
                              : (isDarkMode ? "bg-black border-white/[0.04] hover:bg-white/[0.02] hover:border-white/[0.06]" : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300")
                          }`}
                        >
                          {/* Top Row: Title, Badges, Percentage */}
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col gap-1.5 pr-2 min-w-0">
                              <span className={`text-sm font-medium truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {session.taskTitle ||
                                session.taskId ||
                                "Untitled Focus"}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                <span className={`text-[9px] px-2 py-0.5 rounded font-medium whitespace-nowrap ${classification.style}`}>
                                  {classification.label}
                                </span>
                                {hasExtraFlow && (
                                  <span className={`text-[9px] font-medium px-2 py-0.5 border rounded whitespace-nowrap ${
                                    isDarkMode ? "bg-purple-950/30 border-purple-900/50 text-purple-400" : "bg-purple-100 border-purple-200 text-purple-700"
                                  }`}>
                                    Goal Completed • +{Math.floor(extraDur / 60)}m Extra Focus
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Focus Quality Rating */}
                            <div className="flex flex-col items-end shrink-0">
                              <span className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{focusQuality}%</span>
                              <span className={`text-[8px] uppercase tracking-widest mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Quality</span>
                            </div>
                          </div>

                          {/* Simplified Subtext */}
                          <div className={`text-[11px] flex flex-wrap items-center gap-1.5 mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            <span className={`font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{formatCleanDuration(focusedDur)} Focused</span>
                            
                            {displayExtra > 0 && (
                              <>
                                <span className="opacity-40">•</span>
                                <span className={isDarkMode ? "text-purple-400" : "text-purple-600"}>+{formatCleanDuration(displayExtra)} Extra</span>
                              </>
                            )}
                            
                            {pausedDuration >= 5 && (
                              <>
                                <span className="opacity-40">•</span>
                                <span className={isDarkMode ? "text-yellow-500/80" : "text-yellow-600"}>{formatCleanDuration(pausedDuration)} Paused</span>
                              </>
                            )}

                            <span className="opacity-40">•</span>
                            <span>{formatCleanDuration(totalFocusDuration)} Total</span>
                            
                            <span className="opacity-40">•</span>
                            <span>{formatMode(session.mode)}</span>

                            {distCount > 0 && (
                              <>
                                <span className="opacity-40">•</span>
                                <span>Attention shifts: {distCount}</span>
                              </>
                            )}
                          </div>

                          {/* Visual Timeline Bar */}
                          <div className={`w-full h-1 rounded-full overflow-hidden flex mt-3 mb-1 ${isDarkMode ? "bg-white/[0.03]" : "bg-gray-100"}`}>
                            <div
                              className="bg-orange-500"
                              style={{ width: `${(focusedDur / totalDuration) * 100}%` }}
                            />
                            {pausedDuration > 0 && (
                              <div
                                className={isDarkMode ? "bg-yellow-500/50" : "bg-yellow-400"}
                                style={{ width: `${(pausedDuration / totalDuration) * 100}%` }}
                              />
                            )}
                            {hasExtraFlow && (
                              <div
                                className="bg-purple-500"
                                style={{ width: `${(extraDur / totalDuration) * 100}%` }}
                              />
                            )}
                          </div>

                          {/* Expander Toggle */}
                          {canExpand && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : session.id)}
                              className={`text-[10px] font-medium flex items-center gap-1 transition-colors mt-3 w-fit ${
                                isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-blue-600"
                              }`}
                            >
                              {isExpanded ? <><ChevronUp size={12} /> Hide details</> : <><ChevronDown size={12} /> View details</>}
                            </button>
                          )}

                          {/* EXPANDED AREA */}
                          {isExpanded && canExpand && (
                            <div className={`mt-3 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-200 ${
                              isDarkMode ? "border-white/[0.04]" : "border-gray-100"
                            }`}>
                              <div className="flex flex-col gap-5">
                                
                                {/* Distraction Details (ALL DISTRACTIONS SHOWN) */}
                                {distCount > 0 && (
                                  <div>
                                    <div className="flex items-center justify-between mb-3">
                                      <span className={`text-[11px] font-medium flex items-center gap-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                        <AlertCircle size={12} /> Distraction Timeline
                                      </span>
                                    </div>
                                    
                                    <div className={`border rounded-lg p-3 ${isDarkMode ? "bg-black border-white/[0.04]" : "bg-gray-50 border-gray-200"}`}>
                                      {/* Top Issue highlight */}
                                      {getTopDistraction(dists) && (
                                        <div className={`text-xs font-medium mb-3 border-b pb-3 flex items-center justify-between ${
                                          isDarkMode ? "text-gray-300 border-white/[0.04]" : "text-gray-700 border-gray-200"
                                        }`}>
                                          <span>
                                            Top trigger: <span className={isDarkMode ? "text-white ml-1" : "text-gray-900 ml-1"}>{getTopDistraction(dists)?.reason}</span>
                                          </span>
                                          <span className={`text-[10px] px-2 py-0.5 rounded-md ${
                                            isDarkMode ? "text-gray-500 bg-white/[0.04]" : "text-gray-500 bg-gray-200"
                                          }`}>
                                            {getTopDistraction(dists)?.count} occurrences
                                          </span>
                                        </div>
                                      )}
                                      
                                      {/* Exact List of All Distractions */}
                                      <div className="flex flex-col gap-1.5">
                                        {dists.map((d: Distraction, i: number) => (
                                          <div key={d.id || i} className={`flex justify-between items-center transition-colors border px-3 py-2 rounded-lg ${
                                            isDarkMode ? "bg-black hover:bg-white/[0.02] border-white/[0.04]" : "bg-white hover:bg-gray-50 border-gray-100"
                                          }`}>
                                            <span className={`text-[11px] font-medium truncate pr-4 ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>{d.reason}</span>
                                            <span className={`text-[10px] font-mono shrink-0 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                              {new Date(d.timestamp).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Pause Timeline */}
                                {hasPauses && (
                                  <div>
                                    <div className={`text-[11px] font-medium mb-2 flex items-center gap-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                      <Pause size={12} /> Pause Timeline
                                    </div>
                                    
                                    <div className={`space-y-1.5 p-2 rounded-lg border ${isDarkMode ? "bg-black border-white/[0.04]" : "bg-gray-50 border-gray-200"}`}>
                                      {[...pauseTimeline].sort((a: any, b: any) => a.start - b.start).map((seg: any, i: number) => {
                                        const start = new Date(seg.start);
                                        const end = seg.end ? new Date(seg.end) : null;
                                        const durationSeconds = seg.end ? Math.floor((seg.end - seg.start) / 1000) : 0;

                                        return (
                                          <div key={i} className={`text-[10px] flex justify-between items-center px-2 py-1.5 rounded transition-colors ${
                                            isDarkMode ? "text-gray-400 hover:bg-white/[0.02]" : "text-gray-600 hover:bg-white"
                                          }`}>
                                            <div className="flex items-center gap-2 font-mono">
                                              <span>{start.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: '2-digit', minute: '2-digit' })}</span>
                                              <span className={isDarkMode ? "text-gray-600" : "text-gray-300"}>→</span>
                                              <span>{end ? end.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: '2-digit', minute: '2-digit' }) : "Active"}</span>
                                            </div>
                                            
                                            {end && (
                                              <span className={isDarkMode ? "text-gray-500" : "text-gray-500"}>
                                                {formatCleanDuration(durationSeconds)} pause
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
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