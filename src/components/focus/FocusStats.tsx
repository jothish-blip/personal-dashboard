"use client";

import React, { useState, useMemo } from "react";
import { useFocusSystem } from "./useFocusSystem";
import { FocusSession, FocusMode } from "./types";

type DateRange = "today" | "yesterday" | "week" | "month" | "year" | "custom";

export default function FocusStats() {
  const { sessions, setMode, setTimeRemaining, startSession } = useFocusSystem();
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>("today");
  
  // Reference date drives the custom, month, and year views
  const [refDate, setRefDate] = useState<Date>(new Date());

  // --- TIME TRAVEL & DATE MATH ---
  const { 
    todayStr, yesterdayStr, weekStartStr, 
    refDateStr, refMonthStr, refYearStr,
    datesInWeek 
  } = useMemo(() => {
    const today = new Date();
    const tStr = today.toLocaleDateString('en-CA');
    
    const yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    const yStr = yest.toLocaleDateString('en-CA');

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    const wStr = weekStart.toLocaleDateString('en-CA');

    // Reference Strings
    const rDateStr = refDate.toLocaleDateString('en-CA');
    const rMonthStr = rDateStr.slice(0, 7); // YYYY-MM
    const rYearStr = rDateStr.slice(0, 4);  // YYYY

    const dInWeek = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dInWeek.push(d.toLocaleDateString('en-CA'));
    }

    return { 
      todayStr: tStr, yesterdayStr: yStr, weekStartStr: wStr, 
      refDateStr: rDateStr, refMonthStr: rMonthStr, refYearStr: rYearStr,
      datesInWeek: dInWeek 
    };
  }, [refDate]);

  // --- FILTER SESSIONS BASED ON RANGE ---
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const d = new Date(s.startTime).toLocaleDateString('en-CA');
      if (selectedRange === "today") return d === todayStr;
      if (selectedRange === "yesterday") return d === yesterdayStr;
      if (selectedRange === "week") return d >= weekStartStr && d <= todayStr;
      if (selectedRange === "custom") return d === refDateStr;
      if (selectedRange === "month") return d.startsWith(refMonthStr);
      if (selectedRange === "year") return d.startsWith(refYearStr);
      return false;
    });
  }, [sessions, selectedRange, todayStr, yesterdayStr, weekStartStr, refDateStr, refMonthStr, refYearStr]);

  const yesterdaySessions = useMemo(() => {
    return sessions.filter(s => new Date(s.startTime).toLocaleDateString('en-CA') === yesterdayStr);
  }, [sessions, yesterdayStr]);

  // --- CORE METRICS ---
  const totalSessions = filteredSessions.length;
  const totalFocusSeconds = filteredSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalDistractions = filteredSessions.reduce((acc, s) => acc + (s.distractions?.length || 0), 0);
  const avgScore = totalSessions > 0 
    ? Math.round(filteredSessions.reduce((acc, s) => acc + s.score, 0) / totalSessions) 
    : 0;

  // --- TREND & COMPARISON (Only valid for Today) ---
  const yestTotalSessions = yesterdaySessions.length;
  const yestAvgScore = yestTotalSessions > 0 
    ? Math.round(yesterdaySessions.reduce((acc, s) => acc + s.score, 0) / yestTotalSessions) 
    : 0;
  const scoreDiff = avgScore - yestAvgScore;

  // --- STREAKS & GOALS ---
  const dailyGoalSeconds = 3 * 3600;
  let goalTarget = dailyGoalSeconds;
  if (selectedRange === "week") goalTarget = dailyGoalSeconds * 7;
  if (selectedRange === "month") goalTarget = dailyGoalSeconds * 30;
  if (selectedRange === "year") goalTarget = dailyGoalSeconds * 365;
  const goalProgress = Math.min(100, (totalFocusSeconds / goalTarget) * 100);

  const getStreak = () => {
    const datesSet = new Set(sessions.map(s => new Date(s.startTime).toLocaleDateString('en-CA')));
    let streakCount = 0;
    let d = new Date();
    if (!datesSet.has(d.toLocaleDateString('en-CA'))) d.setDate(d.getDate() - 1);
    while (datesSet.has(d.toLocaleDateString('en-CA'))) {
      streakCount++;
      d.setDate(d.getDate() - 1);
    }
    return streakCount;
  };
  const streak = getStreak();

  // --- WEEKLY CHART DATA ---
  const weeklyData = useMemo(() => {
    let bestDayObj = { date: "", score: -1 };
    
    const data = datesInWeek.map(dateStr => {
      const daySessions = sessions.filter(s => new Date(s.startTime).toLocaleDateString('en-CA') === dateStr);
      const dayScore = daySessions.length > 0 ? Math.round(daySessions.reduce((acc, s) => acc + s.score, 0) / daySessions.length) : 0;
      const dayTime = daySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
      
      if (dayScore > bestDayObj.score) bestDayObj = { date: dateStr, score: dayScore };
      
      const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
      return { dateStr, dayName, dayScore, dayTime };
    });

    return { data, bestDayObj };
  }, [datesInWeek, sessions]);

  // --- FORMATTERS ---
  const formatHrsMins = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const getFocusBadge = () => {
    if (totalSessions === 0) return { label: "Idle", style: "bg-gray-100 text-gray-500" };
    if (avgScore >= 85) return { label: "Deep Focus", style: "bg-green-100 text-green-700" };
    if (avgScore >= 60) return { label: "Stable", style: "bg-blue-100 text-blue-700" };
    return { label: "Distracted", style: "bg-red-100 text-red-700" };
  };
  const badge = getFocusBadge();

  const getTopDistraction = (sessionsArray: FocusSession[]) => {
    const counts: Record<string, number> = {};
    sessionsArray.forEach(s => {
      s.distractions?.forEach(d => {
        counts[d.reason] = (counts[d.reason] || 0) + 1;
      });
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : "None";
  };
  const topIssue = getTopDistraction(filteredSessions);

  // --- INTELLIGENCE LAYER ---
  const getStructuredInsight = () => {
    if (selectedRange === "yesterday" || (selectedRange === "custom" && refDateStr !== todayStr)) {
      return {
        summary: totalSessions === 0 ? "No activity recorded for this date." : "Review past performance.",
        issue: topIssue !== "None" ? `Main distraction: ${topIssue}` : "Solid discipline maintained.",
        actionText: "Improve Today",
        mode: "deepWork" as FocusMode,
        time: 45
      };
    }
    if (selectedRange === "month") {
      return {
        summary: "Monthly macro-level performance overview.",
        issue: topIssue !== "None" ? `Monthly Nemesis: ${topIssue}` : "Excellent long-term focus.",
        actionText: "Optimize Routine",
        mode: "custom" as FocusMode,
        time: 60
      };
    }
    if (selectedRange === "year") {
      return {
        summary: "Yearly behavioral pattern analysis.",
        issue: "Long-term discipline trend.",
        actionText: "Reset Strategy",
        mode: "custom" as FocusMode,
        time: 90
      };
    }
    if (selectedRange === "week") {
      const bestDayName = new Date(weeklyData.bestDayObj.date).toLocaleDateString('en-US', { weekday: 'long' });
      return {
        summary: totalSessions === 0 ? "No activity this week." : `Weekly rhythm: ${bestDayName} was your best day.`,
        issue: topIssue !== "None" ? `Weekly nemesis: ${topIssue}` : "Consistent focus.",
        actionText: "Start Weekly Review",
        mode: "custom" as FocusMode,
        time: 30
      };
    }
    
    if (totalSessions === 0) return { summary: "No sessions started today.", issue: "Momentum is zero.", actionText: "Start Pomodoro (25m)", mode: "pomodoro" as FocusMode, time: 25 };
    if (totalDistractions > 5 || avgScore < 60) return { summary: "Focus is unstable and breaking frequently.", issue: `Primary trigger: ${topIssue}`, actionText: "Short Re-focus (15m)", mode: "custom" as FocusMode, time: 15 };
    if (avgScore >= 85) return { summary: "Deep work mode achieved.", issue: "None. You are locked in.", actionText: "Continue Deep Work (60m)", mode: "deepWork" as FocusMode, time: 60 };
    
    return { summary: "Stable rhythm established.", issue: "Maintain discipline.", actionText: "Start Custom (45m)", mode: "custom" as FocusMode, time: 45 };
  };
  const insight = getStructuredInsight();

  // --- ACTIONS ---
  const handleQuickAction = () => {
    setMode(insight.mode);
    setTimeRemaining(insight.time * 60);
    setTimeout(() => startSession(), 50);
  };

  const jumpToToday = () => {
    setRefDate(new Date());
    setSelectedRange("today");
  };

  const shiftDate = (dir: 1 | -1) => {
    const newDate = new Date(refDate);
    if (selectedRange === "month") newDate.setMonth(newDate.getMonth() + dir);
    else if (selectedRange === "year") newDate.setFullYear(newDate.getFullYear() + dir);
    else newDate.setDate(newDate.getDate() + dir);
    
    // ✅ PREVENT FUTURE NAVIGATION
    if (newDate > new Date()) return;

    setRefDate(newDate);
    if (selectedRange === "today" || selectedRange === "yesterday") setSelectedRange("custom");
  };

  // --- HEATMAP GENERATOR (For Month/Year Views) ---
  const generateHeatmap = () => {
    if (selectedRange !== "month" && selectedRange !== "year") return null;
    
    const daysInPeriod = selectedRange === "month" 
      ? new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate()
      : 365; 
      
    const startDate = new Date(refDate);
    if (selectedRange === "month") startDate.setDate(1);
    else { startDate.setMonth(0); startDate.setDate(1); }

    const days = [];
    for (let i = 0; i < daysInPeriod; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dStr = d.toLocaleDateString('en-CA');
      
      const daySeconds = sessions.filter(s => new Date(s.startTime).toLocaleDateString('en-CA') === dStr)
                                 .reduce((acc, s) => acc + s.durationSeconds, 0);
      
      let colorClass = "bg-gray-100";
      if (daySeconds > 0) colorClass = "bg-green-200";
      if (daySeconds > 3600) colorClass = "bg-green-400";
      if (daySeconds > 7200) colorClass = "bg-green-600";
      if (daySeconds > 10800) colorClass = "bg-green-800";

      days.push(
        <div 
          key={i} 
          className={`w-3 h-3 md:w-4 md:h-4 rounded-sm ${colorClass} hover:ring-2 ring-gray-400 transition-all cursor-help`}
          title={`${d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}: ${formatHrsMins(daySeconds)}`}
        />
      );
    }

    return (
      <div className="mt-4 animate-in fade-in zoom-in-95">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Focus Intensity Map</h3>
        <div className="flex flex-wrap gap-1 md:gap-1.5 p-3 bg-white border border-gray-100 rounded-xl shadow-inner max-h-[150px] overflow-y-auto custom-scrollbar">
          {days}
        </div>
      </div>
    );
  };

  const last3Sessions = [...filteredSessions].sort((a,b) => b.startTime - a.startTime).slice(0, 3);

  return (
    <>
      <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-all space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-300 mb-16 md:mb-0">
        
        {/* ✅ ROW 1, 2, 3: CLEAN HEADER ARCHITECTURE */}
        <div className="space-y-4">

          {/* ROW 1: TITLE + NAVIGATION */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            
            {/* Title */}
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              {selectedRange === "today" && "Today’s Intelligence"}
              {selectedRange === "yesterday" && "Yesterday’s Intelligence"}
              {selectedRange === "week" && "Weekly Intelligence"}
              {selectedRange === "custom" && `Report: ${refDate.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}`}
              {selectedRange === "month" && `Report: ${refDate.toLocaleDateString(undefined, {month: 'long', year: 'numeric'})}`}
              {selectedRange === "year" && `Report: ${refYearStr}`}
              
              {/* Badge next to title on Desktop */}
              <div className={`hidden sm:flex text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${badge.style}`}>
                {badge.label}
              </div>
            </h2>

            {/* Navigation */}
            <div className="flex items-center bg-gray-100 rounded-md w-fit border border-gray-200/60 shadow-sm">
              <button onClick={() => shiftDate(-1)} className="px-3 py-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-l-md transition-colors active:scale-95">◀</button>
              <button onClick={jumpToToday} className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors active:scale-95 border-x border-gray-200/50 uppercase tracking-wider">Today</button>
              <button onClick={() => shiftDate(1)} className="px-3 py-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-r-md transition-colors active:scale-95">▶</button>
            </div>
          </div>

          {/* ROW 2: DESCRIPTION + CONTEXT */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span>
                {selectedRange === "today" ? "Live performance" : selectedRange === "yesterday" ? "Review past performance" : "Macro behavioral trends"}
              </span>

              {selectedRange === "today" && yestTotalSessions > 0 && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm ${scoreDiff >= 0 ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                  vs Yest: {scoreDiff >= 0 ? "+" : ""}{scoreDiff}%
                </span>
              )}
            </div>

            {/* Mobile Badge & Streak */}
            <div className="flex items-center gap-2">
              <div className={`sm:hidden text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${badge.style}`}>
                {badge.label}
              </div>
              {streak > 0 && <span className="text-orange-500 font-bold animate-pulse">🔥 {streak} Day Streak</span>}
            </div>
          </div>

          {/* ROW 3: RANGE TOGGLES */}
          <div className="flex gap-1.5 overflow-x-auto bg-gray-100/80 p-1.5 rounded-lg w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {(["today", "yesterday", "week", "month", "year", "custom"] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all flex-1 sm:flex-none text-center ${
                  selectedRange === range
                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
              >
                {range === "week" ? "7 Days" : range}
              </button>
            ))}
          </div>

        </div>

        {/* HEATMAP / CALENDAR VIEW */}
        {generateHeatmap()}

        {/* WEEKLY CHART (Only visible in 7 Days mode) */}
        {selectedRange === "week" && (
          <div className="bg-white p-4 border border-gray-100 rounded-xl shadow-sm animate-in fade-in zoom-in-95">
            <div className="flex items-end justify-between h-24 gap-2">
              {weeklyData.data.map((day, i) => (
                <div key={i} className="flex flex-col items-center flex-1 group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 text-[10px] bg-gray-800 text-white px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                    {day.dayScore}% • {formatHrsMins(day.dayTime)}
                  </div>
                  {/* Bar */}
                  <div className="w-full bg-gray-100 rounded-t-md relative flex items-end h-full" style={{ minHeight: '4px' }}>
                    <div 
                      className={`w-full rounded-t-md transition-all duration-500 ${day.dayScore >= 80 ? 'bg-green-400' : day.dayScore >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ height: `${Math.max(4, day.dayScore)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 mt-2">{day.dayName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADAPTIVE METRICS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-white border border-gray-100 rounded-xl text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full bg-gray-100 h-1.5">
              <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${goalProgress}%` }} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:scale-105 transition-transform">
              {formatHrsMins(totalFocusSeconds)}
            </div>
            <div className="text-[11px] sm:text-xs font-medium text-gray-500 mt-1">⏱️ Focus Time</div>
          </div>

          <div 
            className="p-4 bg-white border border-gray-100 rounded-xl text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group relative overflow-hidden cursor-help"
            title={`Based on ${totalSessions} sessions`}
          >
            <div className={`text-2xl sm:text-3xl font-bold group-hover:scale-105 transition-transform ${avgScore >= 80 ? 'text-green-600' : avgScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
              {avgScore}%
            </div>
            <div className="text-[11px] sm:text-xs font-medium text-gray-500 mt-1">🎯 Avg Score</div>
          </div>

          <div className="p-4 bg-white border border-gray-100 rounded-xl text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 group-hover:scale-105 transition-transform">
              {totalSessions}
            </div>
            <div className="text-[11px] sm:text-xs font-medium text-blue-400 mt-1">📊 Sessions</div>
          </div>

          <div className="p-4 bg-white border border-gray-100 rounded-xl text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="text-2xl sm:text-3xl font-bold text-red-500 group-hover:scale-105 transition-transform">
              {totalDistractions}
            </div>
            <div className="text-[11px] sm:text-xs font-medium text-red-400 mt-1">⚠️ Breaks</div>
          </div>
        </div>

        {/* DESKTOP INTELLIGENCE PANEL / MOBILE COLLAPSIBLE */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
          
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-1">{insight.summary}</div>
              <div className="text-xs text-gray-500 mb-3 md:mb-0">
                <span className="font-medium text-gray-600">Analysis:</span> {insight.issue}
              </div>
            </div>
            
            <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Suggested Action</span>
              <button 
                onClick={handleQuickAction}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors active:scale-95 flex items-center gap-1"
              >
                {insight.actionText} <span className="text-lg leading-none">↗</span>
              </button>
            </div>
          </div>

          <div className={`${showMobileDetails ? 'block' : 'hidden'} md:block md:w-1/3 md:border-l md:border-gray-100 md:pl-4 mt-4 md:mt-0`}>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pattern Preview</div>
            {last3Sessions.length === 0 ? (
              <div className="text-xs text-gray-400 italic">No history to analyze.</div>
            ) : (
              <div className="space-y-2">
                {last3Sessions.map((s, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-medium">{Math.floor(s.durationSeconds / 60)}m</span>
                    <div className="flex-1 mx-2 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${s.score >= 80 ? 'bg-green-400' : s.score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${s.score}%` }} />
                    </div>
                    <span className={`font-bold ${s.score >= 80 ? 'text-green-600' : s.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{s.score}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            className="md:hidden w-full text-center text-xs text-blue-600 font-semibold py-2 mt-3 bg-blue-50/50 rounded-lg border border-blue-100/50 active:bg-blue-100 transition-colors"
            onClick={() => setShowMobileDetails(!showMobileDetails)}
          >
            {showMobileDetails ? "Collapse Details ▲" : "View Session Patterns ▼"}
          </button>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM SUMMARY */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 z-50 md:hidden animate-in slide-in-from-bottom-full flex flex-col gap-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around text-xs font-semibold text-gray-700">
          <span className="flex items-center gap-1">⏱️ {formatHrsMins(totalFocusSeconds)}</span>
          <span className={`flex items-center gap-1 ${avgScore >= 80 ? 'text-green-600' : avgScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>🎯 {avgScore}%</span>
          <span className="flex items-center gap-1 text-red-500">⚠️ {totalDistractions}</span>
        </div>
        <button 
          onClick={handleQuickAction}
          className="w-full py-3 bg-gray-900 hover:bg-black active:scale-[0.98] text-white font-medium rounded-lg text-sm transition-all shadow-md"
        >
          {insight.actionText}
        </button>
      </div>
    </>
  );
}