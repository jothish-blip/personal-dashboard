"use client";

import React, { useState, useMemo } from "react";
import { useFocusSystem } from "./useFocusSystem";
import { Distraction, FocusSession } from "./types";

type DateFilter = "today" | "yesterday" | "week" | "custom";

// 🔥 IMPROVEMENT 1: Centralize date logic to prevent expensive re-creations
const getDateStr = (ts: number) => new Date(ts).toLocaleDateString("en-CA");

export default function SessionHistory() {
  const { sessions } = useFocusSystem();
  const typedSessions = sessions as FocusSession[];
  
  // State for mobile-friendly expandable details and filtering
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<DateFilter>("today");
  const [customDate, setCustomDate] = useState<Date>(new Date());

  // --- FORMATTERS ---
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  const formatStartTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // ✅ BUG FIX: Strongly typed and safe fallback for formatEndTime
  const formatEndTime = (session: FocusSession) => {
    const end = session.endTime ?? (session.startTime + session.durationSeconds * 1000);
    return new Date(end).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatMode = (mode: string) => {
    if (mode === "deepWork") return "Deep Work";
    if (mode === "pomodoro") return "Pomodoro";
    return "Custom";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  // --- INTELLIGENCE HELPERS ---
  const getSessionClassification = (distractionCount: number) => {
    if (distractionCount === 0) return { label: "Deep Focus", style: "bg-green-100 text-green-700" };
    if (distractionCount < 3) return { label: "Stable", style: "bg-blue-100 text-blue-700" };
    return { label: "Distracted", style: "bg-red-100 text-red-700" };
  };

  const getTopDistraction = (distractions: Distraction[]) => {
    if (!distractions || distractions.length === 0) return null;
    const counts = distractions.reduce<Record<string, number>>((acc, d: Distraction) => {
      acc[d.reason] = (acc[d.reason] || 0) + 1;
      return acc;
    }, {});
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
  };

  const getDistractionBreakdown = (distractions: Distraction[]) => {
    return distractions.reduce<Record<string, number>>((acc, d: Distraction) => {
      acc[d.reason] = (acc[d.reason] || 0) + 1;
      return acc;
    }, {});
  };

  // --- DATA PREPARATION ---

  // 🔥 IMPROVEMENT 3: Compute anchor dates once per render cycle
  const { todayStr, yesterdayStr, weekStart } = useMemo(() => {
    const tStr = new Date().toLocaleDateString("en-CA");
    
    const yestDate = new Date();
    yestDate.setDate(yestDate.getDate() - 1);
    const yStr = yestDate.toLocaleDateString("en-CA");

    const wStart = new Date();
    wStart.setDate(wStart.getDate() - 6);
    wStart.setHours(0, 0, 0, 0);

    return { todayStr: tStr, yesterdayStr: yStr, weekStart: wStart };
  }, []);
  
  // 1. Filter sessions based on selected range
  const filteredSessions = useMemo(() => {
    // 🔥 IMPROVEMENT 4: Clean extracted filter logic
    const isInFilter = (s: FocusSession) => {
      const d = getDateStr(s.startTime);
      switch (filter) {
        case "today":
          return d === todayStr;
        case "yesterday":
          return d === yesterdayStr;
        case "week":
          return new Date(s.startTime) >= weekStart;
        case "custom":
          return d === customDate.toLocaleDateString("en-CA");
        default:
          return true;
      }
    };

    return typedSessions.filter(isInFilter);
  }, [typedSessions, filter, customDate, todayStr, yesterdayStr, weekStart]);

  // 2. Sort filtered sessions newest first
  // 🔥 IMPROVEMENT 5: Memoized sorting logic
  const sortedSessions = useMemo(() => {
    return [...filteredSessions].sort((a: FocusSession, b: FocusSession) => b.startTime - a.startTime);
  }, [filteredSessions]);

  // 3. Group sessions by date
  const groupedSessions = useMemo(() => {
    // 🔥 IMPROVEMENT 2: Strongly typed reducer accumulator
    const groups = sortedSessions.reduce<Record<string, FocusSession[]>>((acc, session: FocusSession) => {
      const dateObj = new Date(session.startTime); 
      const dateKey = getDateStr(session.startTime);
      
      let dateLabel = "";
      if (dateKey === todayStr) dateLabel = "📅 Today";
      else if (dateKey === yesterdayStr) dateLabel = "🕓 Yesterday";
      else dateLabel = "📆 " + dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      if (!acc[dateLabel]) acc[dateLabel] = [];
      acc[dateLabel].push(session);
      return acc;
    }, {});

    // Sort inside group by startTime
    Object.keys(groups).forEach(key => {
      groups[key].sort((a: FocusSession, b: FocusSession) => b.startTime - a.startTime);
    });

    return groups;
  }, [sortedSessions, todayStr, yesterdayStr]);

  return (
    <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm h-full max-h-[600px] flex flex-col">
      
      {/* HEADER */}
      <h2 className="text-sm font-semibold text-gray-800 mb-4 shrink-0 flex items-center justify-between">
        <span>Session History</span>
        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {filteredSessions.length} total
        </span>
      </h2>

      {/* FILTER UI */}
      <div className="shrink-0 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {(["today", "yesterday", "week", "custom"] as DateFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                filter === f
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* CUSTOM DATE PICKER */}
        {filter === "custom" && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-1">
            <input
              type="date"
              className="border border-gray-200 px-3 py-1.5 rounded-lg text-xs text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={customDate.toISOString().split("T")[0]}
              onChange={(e) => {
                if (e.target.value) setCustomDate(new Date(e.target.value));
              }}
            />
          </div>
        )}
      </div>

      {/* SCROLLABLE LIST */}
      <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
        {filteredSessions.length === 0 ? (
          
          /* RICH EMPTY STATE */
          <div className="flex flex-col items-center justify-center text-gray-400 py-10 h-full">
            <span className="text-4xl mb-3 opacity-50">📭</span>
            <span className="text-sm font-medium text-gray-600">No sessions found.</span>
            <span className="text-xs text-center mt-1 max-w-[200px]">
              {filter === "today" 
                ? "Start a session to build your momentum today." 
                : "No data recorded for this time period."}
            </span>
          </div>

        ) : (
          Object.entries(groupedSessions).map(([dateLabel, daySessions]) => (
            <div key={dateLabel} className="mb-6 relative">
              
              {/* DATE GROUP HEADER */}
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 bg-white/95 backdrop-blur py-1.5 z-20 border-b border-gray-100 mb-4 shadow-[0_4px_10px_-10px_rgba(0,0,0,0.1)]">
                {dateLabel}
              </h3>

              {/* TIMELINE CONTAINER */}
              <div className="flex flex-col">
                {/* ✅ BUG FIX: Map specifically typed with FocusSession */}
                {daySessions.map((session: FocusSession, index: number) => {
                  const dists = session.distractions || []; 
                  const distCount = dists.length || 0;
                  const classification = getSessionClassification(distCount);
                  const isExpanded = expandedId === session.id;
                  const isLast = index === daySessions.length - 1;
                  const hasExtraFlow = (session.extraDuration || 0) > 0;

                  return (
                    <div key={session.id} className="flex gap-3 md:gap-4 relative group">
                      
                      {/* LEFT: TIMELINE AXIS (Start -> End) */}
                      <div className="w-12 md:w-16 shrink-0 flex flex-col items-end text-[10px] md:text-[11px] font-mono text-gray-500 pt-1.5">
                        <span className="font-semibold text-gray-800">{formatStartTime(session.startTime)}</span>
                        <div className="flex flex-col items-center justify-center h-4 my-0.5 text-gray-300">
                           <span className="text-[6px]">•</span>
                           <span className="text-[6px]">•</span>
                        </div>
                        <span>{formatEndTime(session)}</span>
                      </div>

                      {/* CENTER: TIMELINE LINE & NODE */}
                      <div className="relative flex flex-col items-center">
                        {/* The Line */}
                        <div className={`w-px absolute top-3 z-0 ${isLast ? 'h-full bg-gradient-to-b from-gray-200 to-transparent' : 'h-full bg-gray-200'}`}></div>
                        
                        {/* The Node */}
                        <div className={`w-2.5 h-2.5 rounded-full z-10 mt-2 ring-4 ring-white shadow-sm transition-transform duration-300 group-hover:scale-125 ${
                          hasExtraFlow 
                            ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' 
                            : 'bg-blue-400'
                        }`}></div>
                      </div>

                      {/* RIGHT: CARD CONTENT */}
                      <div className="flex-1 pb-6 min-w-0">
                        <div
                          className={`p-3 bg-white border rounded-lg transition-all relative overflow-hidden ${
                            isExpanded ? "border-blue-200 shadow-md ring-1 ring-blue-50" : "border-gray-100 hover:border-gray-300 hover:shadow-sm"
                          }`}
                        >
                          {/* Flow Gradient Bar */}
                          {hasExtraFlow && (
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-transparent"></div>
                          )}

                          {/* TOP ROW: Task, Badge, Flow, Score */}
                          <div className="flex justify-between items-start mb-1.5">
                            <div className="flex flex-col gap-1 pr-2 min-w-0">
                              <span className="text-sm font-semibold text-gray-800 truncate" title={session.taskTitle}>
                                {session.taskTitle}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${classification.style}`}>
                                  {classification.label}
                                </span>
                                {hasExtraFlow && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded whitespace-nowrap">
                                    🔥 +{Math.floor((session.extraDuration || 0) / 60)}m Flow
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`text-sm font-bold shrink-0 ${getScoreColor(session.score)}`}>
                              {session.score}%
                            </span>
                          </div>

                          {/* DETAILS ROW: Meta Data */}
                          <div className="flex justify-between items-end mt-2">
                            <div className="text-[11px] font-medium text-gray-500 flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-gray-700">{formatTime(session.durationSeconds)}</span>
                                <span className="text-gray-300">•</span>
                                <span className={distCount > 0 ? "text-amber-600 font-semibold" : ""}>
                                  {distCount} interruption{distCount !== 1 ? 's' : ''}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span>{formatMode(session.mode)}</span>
                              </div>
                              
                              {/* TOGGLE EXPAND BUTTON */}
                              {distCount > 0 && (
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                                  className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold text-left w-fit transition-colors mt-0.5"
                                >
                                  {isExpanded ? "Hide details ▲" : "View distractions ▼"}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* EXPANDED DISTRACTION BREAKDOWN */}
                          {isExpanded && distCount > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                              
                              {/* Density Indicator Bar */}
                              <div className="w-full h-1 bg-gray-100 rounded-full mb-3 overflow-hidden" title="Distraction density">
                                <div 
                                  className="h-full bg-red-400 rounded-full transition-all" 
                                  style={{ width: `${Math.min(100, distCount * 15)}%` }} 
                                />
                              </div>

                              <div className="flex flex-col gap-2">
                                {/* Top Issue */}
                                <div className="text-[11px] text-gray-500">
                                  Top Issue: <span className="font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded ml-1">{getTopDistraction(dists)}</span>
                                </div>

                                {/* Breakdown Pills */}
                                <div className="flex flex-wrap gap-1.5">
                                  {Object.entries(getDistractionBreakdown(dists)).map(([reason, count]) => (
                                    <span
                                      key={reason}
                                      className="text-[10px] font-medium px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-md flex items-center gap-1"
                                    >
                                      {reason} <span className="text-gray-400">({count})</span>
                                    </span>
                                  ))}
                                </div>
                                
                                {/* Timeline Preview (Timestamps) */}
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  {/* ✅ BUG FIX: Map specifically typed with Distraction */}
                                  {dists.map((d: Distraction) => (
                                    <span key={d.id} className="text-[9px] font-mono text-gray-400 bg-gray-50 px-1 rounded border border-gray-100">
                                      {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  ))}
                                </div>
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