"use client";

import React, { useState } from "react";
import { useFocusSystem } from "./useFocusSystem";
import { Distraction } from "./types";

export default function SessionHistory() {
  const { sessions } = useFocusSystem();
  
  // State for mobile-friendly expandable details
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // --- FORMATTERS ---
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
    const counts = distractions.reduce((acc: Record<string, number>, d) => {
      acc[d.reason] = (acc[d.reason] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  const getDistractionBreakdown = (distractions: Distraction[]) => {
    return distractions.reduce((acc: Record<string, number>, d) => {
      acc[d.reason] = (acc[d.reason] || 0) + 1;
      return acc;
    }, {});
  };

  // --- DATA PREPARATION ---
  // 1. Sort sessions newest first
  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 2. Group sessions by date
  const groupedSessions = sortedSessions.reduce((groups, session) => {
    const dateObj = new Date(session.date);
    const dateKey = dateObj.toLocaleDateString('en-CA');
    
    const today = new Date().toLocaleDateString('en-CA');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toLocaleDateString('en-CA');

    let dateLabel = "";
    if (dateKey === today) dateLabel = "Today";
    else if (dateKey === yesterday) dateLabel = "Yesterday";
    else dateLabel = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    if (!groups[dateLabel]) groups[dateLabel] = [];
    groups[dateLabel].push(session);
    return groups;
  }, {} as Record<string, typeof sessions>);

  return (
    <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm h-full max-h-[500px] flex flex-col">
      
      {/* HEADER */}
      <h2 className="text-sm font-semibold text-gray-800 mb-4 shrink-0 flex items-center justify-between">
        <span>Session History</span>
        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {sessions.length} total
        </span>
      </h2>

      {/* SCROLLABLE LIST */}
      <div className="overflow-y-auto pr-1 flex-1 space-y-6 custom-scrollbar">
        {sessions.length === 0 ? (
          
          /* RICH EMPTY STATE */
          <div className="flex flex-col items-center justify-center text-gray-400 py-10 h-full">
            <span className="text-4xl mb-3 opacity-50">📭</span>
            <span className="text-sm font-medium text-gray-600">No sessions yet.</span>
            <span className="text-xs text-center mt-1 max-w-[200px]">Complete a focus block to see your history here.</span>
          </div>

        ) : (
          Object.entries(groupedSessions).map(([dateLabel, daySessions]) => (
            <div key={dateLabel} className="space-y-3">
              
              {/* DATE GROUP HEADER */}
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 bg-white/90 backdrop-blur py-1 z-10 border-b border-gray-100 mb-2">
                {dateLabel}
              </h3>

              {daySessions.map((session) => {
                const dists = session.distractions || []; // Fallback to array if using older structure
                const distCount = session.distractions?.length || 0;
                const classification = getSessionClassification(distCount);
                const isExpanded = expandedId === session.id;

                return (
                  <div
                    key={session.id}
                    className={`p-3 bg-white border rounded-lg transition-all ${
                      isExpanded ? "border-blue-200 shadow-md ring-1 ring-blue-50" : "border-gray-100 hover:border-gray-200 shadow-sm"
                    }`}
                  >
                    
                    {/* TOP ROW: Task, Badge, Score */}
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="text-sm font-semibold text-gray-800 truncate">
                          {session.taskTitle}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap ${classification.style}`}>
                          {classification.label}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${getScoreColor(session.score)}`}>
                        {session.score}%
                      </span>
                    </div>

                    {/* DETAILS ROW: Meta Data */}
                    <div className="flex justify-between items-end">
                      <div className="text-xs font-medium text-gray-500 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{formatTime(session.durationSeconds)}</span>
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
                            className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold text-left w-fit transition-colors"
                          >
                            {isExpanded ? "Hide details ▲" : "View distractions ▼"}
                          </button>
                        )}
                      </div>

                      {/* TIME */}
                      <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2 font-mono">
                        {formatDate(session.date)}
                      </span>
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
                            {dists.map((d) => (
                              <span key={d.id} className="text-[9px] font-mono text-gray-400 bg-gray-50 px-1 rounded">
                                {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ))}
                          </div>
                        </div>

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
  );
}