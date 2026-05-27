"use client";

import React, { useState, useMemo } from "react";
import { useFocusSystem } from "../../engine/useFocusSystem";
import { Distraction, FocusSession } from "../../types/types";
import { ChevronDown, ChevronUp, AlertCircle, Play, Pause, Info, TrendingUp } from "lucide-react";

type DateFilter = "all" | "today" | "yesterday" | "week" | "custom";

const getDateStr = (ts: number) => {
  return new Date(ts).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
};

export default function SessionHistory() {
  const { sessions: contextSessions, isLoaded } = useFocusSystem();
  
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

  const getSessionClassification = (distractionCount: number, mode: string, initialSessionTime: number) => {
    const isDeepWork = mode === "deepWork" || initialSessionTime > 1800;
    
    if (isDeepWork) {
      if (distractionCount <= 2) return { label: "Deep Focus", style: "bg-green-100 text-green-700 dark:text-white/80 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.08]" };
      if (distractionCount <= 6) return { label: "Stable", style: "bg-blue-100 text-blue-700 dark:text-white/60 dark:bg-white/[0.02] border border-transparent dark:border-white/[0.04]" };
      if (distractionCount <= 10) return { label: "Attention Shifted", style: "bg-orange-100 text-orange-700 dark:text-orange-400 dark:bg-orange-400/10 border border-transparent dark:border-orange-500/20" };
      return { label: "Interrupted", style: "bg-red-100 text-red-700 dark:text-red-400 dark:bg-red-500/10 border border-transparent dark:border-red-500/20" };
    } else {
      if (distractionCount === 0) return { label: "Deep Focus", style: "bg-green-100 text-green-700 dark:text-white/80 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.08]" };
      if (distractionCount <= 3) return { label: "Stable", style: "bg-blue-100 text-blue-700 dark:text-white/60 dark:bg-white/[0.02] border border-transparent dark:border-white/[0.04]" };
      if (distractionCount <= 6) return { label: "Attention Shifted", style: "bg-orange-100 text-orange-700 dark:text-orange-400 dark:bg-orange-400/10 border border-transparent dark:border-orange-500/20" };
      return { label: "Interrupted", style: "bg-red-100 text-red-700 dark:text-red-400 dark:bg-red-500/10 border border-transparent dark:border-red-500/20" };
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
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/[0.06] p-5 rounded-xl h-full max-h-[700px] flex flex-col font-sans text-gray-900 dark:text-white/90">
      
      <div className="flex items-center justify-between mb-5 shrink-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">Session History</h2>
      </div>

      <div className="shrink-0 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {(["all", "today", "yesterday", "week", "custom"] as DateFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap border ${
                filter === f
                  ? "bg-gray-900 text-white border-transparent dark:bg-orange-500/10 dark:text-orange-500 dark:border-orange-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                  : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200 dark:bg-white/[0.02] dark:text-white/60 dark:border-white/[0.06] dark:hover:bg-white/[0.06] dark:hover:text-white/80"
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
              className="border border-gray-200 dark:border-white/[0.1] px-3 py-1.5 rounded-lg text-xs text-gray-700 dark:text-white/80 bg-gray-50 dark:bg-[#070707] focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-1 dark:focus:ring-white/20 dark:[color-scheme:dark]"
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
        <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-[#070707] border border-gray-200 dark:border-white/[0.06] flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-white/60 font-medium">Summary Overview</span>
            <span className="text-[10px] text-gray-400 dark:text-white/40 flex items-center gap-1"><TrendingUp size={12} /> {dailySummary.insight}</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 dark:text-white/40 uppercase tracking-widest mb-1">Sessions</span>
              <span className="text-base font-semibold text-gray-900 dark:text-white/90">{dailySummary.sessions}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 dark:text-white/40 uppercase tracking-widest mb-1">Focused</span>
              <span className="text-base font-semibold text-gray-900 dark:text-white/90">{dailySummary.focusMins}m</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 dark:text-white/40 uppercase tracking-widest mb-1">Quality</span>
              <span className="text-base font-semibold text-gray-900 dark:text-white/90">{dailySummary.avgQuality}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 dark:text-white/40 uppercase tracking-widest mb-1 truncate">Top Issue</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white/90 truncate pt-0.5">{dailySummary.topIssue}</span>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar relative">
        
        {!isLoaded ? (
          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-white/40 py-10 h-full animate-pulse">
            <span className="w-5 h-5 border-2 border-gray-200 dark:border-white/20 border-t-gray-500 dark:border-t-white/60 rounded-full animate-spin mb-3"></span>
            <span className="text-xs font-medium">Loading history...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-white/40 py-12 h-full animate-in fade-in">
            <Info size={24} className="mb-3 opacity-50 dark:opacity-30" />
            <span className="text-sm font-medium text-gray-500 dark:text-white/60">No valid sessions logged</span>
            <span className="text-xs text-center mt-1.5 opacity-80 dark:opacity-60">
              {filter === "today" 
                ? "Start a session (> 1 min) to see your data here." 
                : "No valid data recorded for this time period."}
            </span>
          </div>
        ) : (
          Object.entries(groupedSessions).map(([dateLabel, daySessions]) => (
            <div key={dateLabel} className="mb-8 relative">
              
              <h3 className="text-[10px] font-bold dark:font-medium text-gray-500 dark:text-white/40 uppercase tracking-widest sticky top-0 bg-white/95 dark:bg-black/95 backdrop-blur-md py-2 z-20 mb-4">
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
                  
                  // 🔥 Updated Focus Quality Formula
                  const focusQuality = (focusedDur + pausedDuration) > 0 
                    ? Math.round((focusedDur / (focusedDur + pausedDuration)) * 100) 
                    : 0;
                  
                  const classification = getSessionClassification(distCount, session.mode, session.initialSessionTime || 1500);
                  const isExpanded = expandedId === session.id;
                  const isLast = index === daySessions.length - 1;
                  const hasExtraFlow = extraDur > 30;

                  return (
                    <div key={session.id} className="flex gap-4 relative group">
                      
                      {/* Left Time Column with Paused Duration */}
                      <div className="w-[65px] shrink-0 flex flex-col items-end text-[10px] font-medium text-gray-500 dark:text-white/40 pt-1.5 opacity-80">
                        <span>{formatStartTime(session.startTime)}</span>
                        <div className="flex flex-col items-center justify-center h-5 my-0.5 opacity-40 dark:opacity-30">
                           <span className="text-[8px]">↓</span>
                        </div>
                        <span>{formatEndTime(session)}</span>
                        
                        {/* Explicit Paused indicator under timestamps */}
                        {pausedDuration >= 5 && (
                          <span className="text-[9px] text-gray-400 dark:text-white/30 mt-1.5 whitespace-nowrap text-center leading-tight">
                            {formatCleanDuration(pausedDuration)} paused
                          </span>
                        )}
                      </div>

                      {/* Line & Dot */}
                      <div className="relative flex flex-col items-center">
                        <div className={`w-px absolute top-3 z-0 ${isLast ? 'h-full bg-gradient-to-b from-gray-200 dark:from-white/[0.08] to-transparent' : 'h-full bg-gray-200 dark:bg-white/[0.08]'}`}></div>
                        <div className={`w-2 h-2 rounded-full z-10 mt-2 ring-4 ring-white dark:ring-black shadow-sm transition-transform duration-300 group-hover:scale-125 ${
                          hasExtraFlow ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-blue-500 dark:bg-orange-500 dark:shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                        }`}></div>
                      </div>

                      {/* Main Card */}
                      <div className="flex-1 pb-2 min-w-0">
                        <div
                          className={`p-3.5 bg-white dark:bg-[#070707] rounded-xl transition-all relative overflow-hidden border ${
                            isExpanded ? "border-blue-200 shadow-md ring-1 ring-blue-50 dark:ring-0 dark:bg-[#0B0B0B] dark:border-white/[0.1] dark:shadow-lg" : "border-gray-200 dark:border-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:border-gray-300 dark:hover:border-white/[0.08]"
                          }`}
                        >
                          {/* Top Row: Title, Badges, Percentage */}
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col gap-1.5 pr-2 min-w-0">
                              <span className="text-sm font-medium text-gray-900 dark:text-white/90 truncate">
                                {session.taskTitle ||
                                session.taskId ||
                                "Untitled Focus"}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                <span className={`text-[9px] px-2 py-0.5 rounded font-medium whitespace-nowrap ${classification.style}`}>
                                  {classification.label}
                                </span>
                                {hasExtraFlow && (
                                  <span className="text-[9px] font-medium px-2 py-0.5 bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 rounded whitespace-nowrap">
                                    Goal Completed • +{Math.floor(extraDur / 60)}m Extra Focus
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Focus Quality Rating */}
                            <div className="flex flex-col items-end shrink-0">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white/90">{focusQuality}%</span>
                              <span className="text-[8px] text-gray-400 dark:text-white/40 uppercase tracking-widest mt-0.5">Quality</span>
                            </div>
                          </div>

                          {/* Simplified Subtext (Restored Paused Value) */}
                          <div className="text-[11px] text-gray-500 dark:text-white/50 flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="font-medium text-gray-700 dark:text-white/80">{formatCleanDuration(focusedDur)} Focused</span>
                            
                            {displayExtra > 0 && (
                              <>
                                <span className="opacity-40">•</span>
                                <span className="text-purple-600 dark:text-purple-400">+{formatCleanDuration(displayExtra)} Extra</span>
                              </>
                            )}
                            
                            {/* Restored Paused Time in Subtext */}
                            {pausedDuration >= 5 && (
                              <>
                                <span className="opacity-40">•</span>
                                <span className="text-yellow-600 dark:text-yellow-500/80">{formatCleanDuration(pausedDuration)} Paused</span>
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
                          <div className="w-full h-1 bg-gray-100 dark:bg-white/[0.04] rounded-full overflow-hidden flex mt-3 mb-1">
                            <div
                              className="bg-blue-500 dark:bg-orange-500"
                              style={{ width: `${(focusedDur / totalDuration) * 100}%` }}
                            />
                            {pausedDuration > 0 && (
                              <div
                                className="bg-yellow-400 dark:bg-yellow-500/50"
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
                              className="text-[10px] text-gray-500 dark:text-white/40 hover:text-blue-600 dark:hover:text-white/70 font-medium flex items-center gap-1 transition-colors mt-3 w-fit"
                            >
                              {isExpanded ? <><ChevronUp size={12} /> Hide details</> : <><ChevronDown size={12} /> View details</>}
                            </button>
                          )}

                          {/* EXPANDED AREA */}
                          {isExpanded && canExpand && (
                            <div className="mt-3 pt-4 border-t border-gray-100 dark:border-white/[0.06] animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className="flex flex-col gap-5">
                                
                                {/* Distraction Details (ALL DISTRACTIONS SHOWN) */}
                                {distCount > 0 && (
                                  <div>
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="text-[11px] font-medium text-gray-500 dark:text-white/60 flex items-center gap-1.5">
                                        <AlertCircle size={12} /> Distraction Timeline
                                      </span>
                                    </div>
                                    
                                    <div className="bg-gray-50 dark:bg-[#050505] border border-gray-200 dark:border-white/[0.06] rounded-lg p-3">
                                      {/* Top Issue highlight */}
                                      {getTopDistraction(dists) && (
                                        <div className="text-xs font-medium text-gray-700 dark:text-white/80 mb-3 border-b border-gray-200 dark:border-white/[0.06] pb-3 flex items-center justify-between">
                                          <span>
                                            Top trigger: <span className="text-gray-900 dark:text-white ml-1">{getTopDistraction(dists)?.reason}</span>
                                          </span>
                                          <span className="text-gray-500 dark:text-white/40 text-[10px] px-2 py-0.5 bg-gray-200 dark:bg-white/[0.04] rounded-md">
                                            {getTopDistraction(dists)?.count} occurrences
                                          </span>
                                        </div>
                                      )}
                                      
                                      {/* Exact List of All Distractions */}
                                      <div className="flex flex-col gap-1.5">
                                        {dists.map((d: Distraction, i: number) => (
                                          <div key={d.id || i} className="flex justify-between items-center bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors border border-gray-100 dark:border-white/[0.04] px-3 py-2 rounded-lg">
                                            <span className="text-[11px] text-gray-800 dark:text-white/80 font-medium truncate pr-4">{d.reason}</span>
                                            <span className="text-[10px] text-gray-400 dark:text-white/40 font-mono shrink-0">
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
                                    <div className="text-[11px] font-medium text-gray-500 dark:text-white/60 mb-2 flex items-center gap-1.5">
                                      <Pause size={12} /> Pause Timeline
                                    </div>
                                    
                                    <div className="space-y-1.5 bg-gray-50 dark:bg-[#050505] p-2 rounded-lg border border-gray-200 dark:border-white/[0.06]">
                                      {[...pauseTimeline].sort((a: any, b: any) => a.start - b.start).map((seg: any, i: number) => {
                                        const start = new Date(seg.start);
                                        const end = seg.end ? new Date(seg.end) : null;
                                        const durationSeconds = seg.end ? Math.floor((seg.end - seg.start) / 1000) : 0;

                                        return (
                                          <div key={i} className="text-[10px] flex justify-between items-center px-2 py-1.5 rounded transition-colors text-gray-600 dark:text-white/60 hover:bg-white dark:hover:bg-white/[0.03]">
                                            <div className="flex items-center gap-2 font-mono">
                                              <span>{start.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: '2-digit', minute: '2-digit' })}</span>
                                              <span className="text-gray-300 dark:text-white/20">→</span>
                                              <span>{end ? end.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: '2-digit', minute: '2-digit' }) : "Active"}</span>
                                            </div>
                                            
                                            {end && (
                                              <span className="text-gray-500 dark:text-white/40">
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