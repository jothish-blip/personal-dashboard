"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useFocusSystem } from "./useFocusSystem";
import { FocusSession, FocusMode } from "./types";

type DateRange = "today" | "yesterday" | "week" | "month" | "year" | "custom";

type WeeklyPoint = {
  dateStr: string;
  dayName: string;
  dayScore: number;
  dayTime: number;
};

const getDateStr = (ts: number) => new Date(ts).toLocaleDateString("en-CA");

export default function FocusStats() {
  // 🔥 FIX 1: Extract isLoaded directly from the context provider
  const { 
    sessions: contextSessions, 
    isLoaded, 
    setMode, 
    setTimeRemaining, 
    startSession 
  } = useFocusSystem();
  
  // 🔥 FIX 2 & 3: Removed local cache fallback. The DB is now the only source of truth.
  const typedSessions = contextSessions as FocusSession[];
  
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>("today");
  
  const [refDate, setRefDate] = useState<Date>(new Date());

  // Connect Daily Goal safely to avoid hydration errors
  const [dailyGoalSeconds, setDailyGoalSeconds] = useState(3 * 3600); // default 3h

  useEffect(() => {
    const saved = localStorage.getItem("daily_goal");
    if (saved) setDailyGoalSeconds(Number(saved));

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "daily_goal" && e.newValue) {
        setDailyGoalSeconds(Number(e.newValue));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

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

    const rDateStr = refDate.toLocaleDateString('en-CA');
    const rMonthStr = rDateStr.slice(0, 7); 
    const rYearStr = rDateStr.slice(0, 4);  

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
    if (!typedSessions) return [];
    
    return typedSessions.filter((s) => {
      const d = getDateStr(s.startTime);
      switch (selectedRange) {
        case "today": return d === todayStr;
        case "yesterday": return d === yesterdayStr;
        case "week": return d >= weekStartStr && d <= todayStr;
        case "custom": return d === refDateStr;
        case "month": return d.startsWith(refMonthStr);
        case "year": return d.startsWith(refYearStr);
        default: return false;
      }
    });
  }, [typedSessions, selectedRange, todayStr, yesterdayStr, weekStartStr, refDateStr, refMonthStr, refYearStr]);

  const yesterdaySessions = useMemo(() => {
    if (!typedSessions) return [];
    return typedSessions.filter(s => getDateStr(s.startTime) === yesterdayStr);
  }, [typedSessions, yesterdayStr]);

  // --- CORE METRICS & FLOW AGGREGATION ---
  const metrics = useMemo(() => {
    const totalFocusSeconds = filteredSessions.reduce<number>((acc, s) => acc + s.durationSeconds, 0);
    const totalExtraSeconds = filteredSessions.reduce<number>((acc, s) => acc + (s.extraDuration || 0), 0);
    const totalActualFocus = totalFocusSeconds + totalExtraSeconds;
    const totalDistractions = filteredSessions.reduce<number>((acc, s) => acc + (s.distractions?.length || 0), 0);
    const avgScore = filteredSessions.length > 0 
      ? Math.round(filteredSessions.reduce<number>((acc, s) => acc + s.score, 0) / filteredSessions.length) 
      : 0;

    return {
      totalFocusSeconds,
      totalExtraSeconds,
      totalActualFocus,
      totalDistractions,
      avgScore
    };
  }, [filteredSessions]);

  const { totalFocusSeconds, totalExtraSeconds, totalActualFocus, totalDistractions, avgScore } = metrics;
  const totalSessions = filteredSessions.length;

  // --- FLOW STATE DETECTION ---
  const flowRatio = totalFocusSeconds > 0
    ? Math.round((totalExtraSeconds / totalFocusSeconds) * 100)
    : 0;
    
  const isInFlow = flowRatio >= 20; 

  const bestFlowSession = useMemo(() => {
    return filteredSessions.reduce<FocusSession | null>((best, s) => {
      const extra = s.extraDuration || 0;
      if (!best || extra > (best.extraDuration || 0)) return s;
      return best;
    }, null);
  }, [filteredSessions]);

  // --- TREND & COMPARISON ---
  const yestTotalSessions = yesterdaySessions.length;
  const yestAvgScore = yestTotalSessions > 0 
    ? Math.round(yesterdaySessions.reduce<number>((acc, s) => acc + s.score, 0) / yestTotalSessions) 
    : 0;
  const scoreDiff = avgScore - yestAvgScore;

  // --- STREAKS & GOALS ---
  let goalTarget = dailyGoalSeconds;
  if (selectedRange === "week") goalTarget = dailyGoalSeconds * 7;
  if (selectedRange === "month") goalTarget = dailyGoalSeconds * 30;
  if (selectedRange === "year") goalTarget = dailyGoalSeconds * 365;
  
  const goalProgress = goalTarget > 0 
    ? Math.min(100, (totalActualFocus / goalTarget) * 100) 
    : 0;

  const streak = useMemo(() => {
    if (!typedSessions) return 0;
    const datesSet = new Set(typedSessions.map(s => getDateStr(s.startTime)));
    let streakCount = 0;
    let d = new Date();
    if (!datesSet.has(d.toLocaleDateString('en-CA'))) d.setDate(d.getDate() - 1);
    while (datesSet.has(d.toLocaleDateString('en-CA'))) {
      streakCount++;
      d.setDate(d.getDate() - 1);
    }
    return streakCount;
  }, [typedSessions]);

  // --- WEEKLY CHART DATA ---
  const weeklyData = useMemo(() => {
    let bestDayObj = { date: "", score: -1 };
    
    if (!typedSessions) return { data: [], bestDayObj };

    const data: WeeklyPoint[] = datesInWeek.map(dateStr => {
      const daySessions = typedSessions.filter(s => getDateStr(s.startTime) === dateStr);
      const dayScore = daySessions.length > 0 
        ? Math.round(daySessions.reduce<number>((acc, s) => acc + s.score, 0) / daySessions.length) 
        : 0;
      
      const dayTime = daySessions.reduce<number>(
        (acc, s) => acc + s.durationSeconds + (s.extraDuration || 0),
        0
      );
      
      if (dayScore > bestDayObj.score) bestDayObj = { date: dateStr, score: dayScore };
      
      const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
      return { dateStr, dayName, dayScore, dayTime };
    });

    return { data, bestDayObj };
  }, [datesInWeek, typedSessions]);

  // --- FORMATTERS ---
  const formatHrsMins = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const getFocusBadge = () => {
    if (totalSessions === 0) return { label: "Idle", style: "bg-gray-100 text-gray-500" };
    if (isInFlow) return { label: "Flow State", style: "bg-purple-100 text-purple-700" };
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
  
  const topIssue = useMemo(() => getTopDistraction(filteredSessions), [filteredSessions]);

  // --- INTELLIGENCE LAYER ---
  const getStructuredInsight = () => {
    if (flowRatio >= 30) {
      return {
        summary: "You entered deep flow state.",
        issue: "You naturally extended your focus beyond plan.",
        actionText: "Increase Session Length (45m)",
        mode: "custom" as FocusMode,
        time: 45
      };
    }
    
    if (totalExtraSeconds === 0 && totalSessions > 0) {
      return {
        summary: "You are stopping exactly on timer.",
        issue: "No extended focus detected.",
        actionText: "Push +5min beyond timer",
        mode: "custom" as FocusMode,
        time: 30
      };
    }

    if (selectedRange === "yesterday" || (selectedRange === "custom" && refDateStr !== todayStr)) {
      return {
        summary: totalSessions === 0 ? "No activity recorded for this date." : "Review past flow.",
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
      const bestDayName = weeklyData.bestDayObj.date ? new Date(weeklyData.bestDayObj.date).toLocaleDateString('en-US', { weekday: 'long' }) : "None";
      return {
        summary: totalSessions === 0 ? "No activity this week." : `Weekly rhythm: ${bestDayName} was your best day.`,
        issue: topIssue !== "None" ? `Weekly nemesis: ${topIssue}` : "Consistent flow.",
        actionText: "Start Weekly Review",
        mode: "custom" as FocusMode,
        time: 30
      };
    }
    
    if (totalSessions === 0) return { summary: "No sessions started today.", issue: "Momentum is zero.", actionText: "Start Pomodoro (25m)", mode: "pomodoro" as FocusMode, time: 25 };
    if (totalDistractions > 5 || avgScore < 60) return { summary: "Focus is unstable and breaking frequently.", issue: `Primary trigger: ${topIssue}`, actionText: "Short Re-focus (15m)", mode: "custom" as FocusMode, time: 15 };
    if (avgScore >= 85) return { summary: "Deep work mode achieved.", issue: "None. You are locked in.", actionText: "Continue Deep Work (60m)", mode: "deepWork" as FocusMode, time: 60 };
    
    return { summary: "Stable flow established.", issue: "Maintain momentum.", actionText: "Start Custom (45m)", mode: "custom" as FocusMode, time: 45 };
  };
  
  const insight = useMemo(() => getStructuredInsight(), [flowRatio, totalExtraSeconds, totalSessions, selectedRange, refDateStr, todayStr, topIssue, weeklyData, totalDistractions, avgScore]);

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
    
    if (newDate > new Date()) return;

    setRefDate(newDate);
    if (selectedRange === "today" || selectedRange === "yesterday") setSelectedRange("custom");
  };

  const generateHeatmap = () => {
    if (selectedRange !== "month" && selectedRange !== "year" || !typedSessions) return null;
    
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
      
      const daySeconds = typedSessions
        .filter(s => getDateStr(s.startTime) === dStr)
        .reduce<number>((acc, s) => acc + s.durationSeconds + (s.extraDuration || 0), 0);
      
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

  const last3Sessions = useMemo(() => {
    return [...filteredSessions].sort((a,b) => b.startTime - a.startTime).slice(0, 3);
  }, [filteredSessions]);


  // 🔥 FIX 4: Proper DB loading state using isLoaded guard
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-64 w-full max-w-[580px] bg-white border border-gray-200 rounded-2xl shadow-sm animate-pulse mb-4 md:mb-0">
         <div className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
           <span className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></span>
           Loading Intelligence...
         </div>
      </div>
    );
  }

  // 🔥 FIX 5: Empty state ONLY fires if DB fetch is completely finished and returned 0 sessions
  if (isLoaded && typedSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 w-full max-w-[580px] bg-white border border-gray-200 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-center mb-4 md:mb-0">
        <span className="text-5xl mb-4 opacity-40">📭</span>
        <h3 className="text-lg font-extrabold text-gray-900">No Intelligence Data (Check Sync)</h3>
        <p className="text-sm text-gray-500 mt-2 font-medium max-w-[300px]">
          Your performance metrics will appear here once you complete your first focus session.
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center lg:justify-end w-full">
      <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-6 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] space-y-10 w-full max-w-[520px] xl:max-w-[580px] animate-in fade-in duration-300 mb-4 md:mb-0">
        
        {/* HEADER ARCHITECTURE */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                {selectedRange === "today" && "Today’s Intelligence"}
                {selectedRange === "yesterday" && "Yesterday’s Intelligence"}
                {selectedRange === "week" && "Weekly Intelligence"}
                {selectedRange === "custom" && `Report: ${refDate.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}`}
                {selectedRange === "month" && `Report: ${refDate.toLocaleDateString(undefined, {month: 'long', year: 'numeric'})}`}
                {selectedRange === "year" && `Report: ${refYearStr}`}
                
                <div className={`hidden sm:flex text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${badge.style}`}>
                  {badge.label}
                </div>
              </h2>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Target: {Math.floor(dailyGoalSeconds / 3600)}h / day
              </div>
            </div>

            <div className="flex items-center bg-gray-100 rounded-md w-fit border border-gray-200/60 shadow-sm shrink-0">
              <button onClick={() => shiftDate(-1)} className="px-3 py-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-l-md transition-colors active:scale-95">◀</button>
              <button onClick={jumpToToday} className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors active:scale-95 border-x border-gray-200/50 uppercase tracking-wider">Today</button>
              <button onClick={() => shiftDate(1)} className="px-3 py-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-r-md transition-colors active:scale-95">▶</button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span>
                {selectedRange === "today" ? "Live performance" : selectedRange === "yesterday" ? "Review past flow" : "Macro behavioral trends"}
              </span>

              {selectedRange === "today" && yestTotalSessions > 0 && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm ${scoreDiff >= 0 ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                  vs Yest: {scoreDiff >= 0 ? "+" : ""}{scoreDiff}%
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className={`sm:hidden text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${badge.style}`}>
                {badge.label}
              </div>
              {streak > 0 && <span className="text-orange-500 font-bold animate-pulse">🔥 {streak} Day Streak</span>}
            </div>
          </div>

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

        {generateHeatmap()}

        {selectedRange === "week" && (
          <div className="bg-white p-4 border border-gray-100 rounded-xl shadow-sm animate-in fade-in zoom-in-95">
            <div className="flex items-end justify-between h-24 gap-2">
              {weeklyData.data.map((day, i) => (
                <div key={i} className="flex flex-col items-center flex-1 group relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 text-[10px] bg-gray-800 text-white px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                    {day.dayScore}% • {formatHrsMins(day.dayTime)}
                  </div>
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

        {/* MICRO INSIGHT */}
        {totalSessions > 0 && (
          <div className="text-xs text-gray-500 font-medium">
            You flowed <span className="font-bold text-purple-600">{flowRatio}%</span> beyond your planned time.
          </div>
        )}

        {/* ADAPTIVE METRICS GRID - NEW HIERARCHY */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          
          {/* 🥇 HERO CARD (Main Focus) */}
          <div className="col-span-2 md:col-span-4 lg:col-span-3 p-5 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out relative overflow-hidden min-h-[140px] flex flex-col justify-center">
            <div className="absolute top-4 right-4 text-[10px] text-blue-400 font-bold uppercase tracking-wider">
              {selectedRange} Focus
            </div>
            
            <div className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mt-2">
              {formatHrsMins(totalActualFocus)}
            </div>
            
            <div className="text-xs text-gray-500 mt-1 font-medium">
              Planned: {formatHrsMins(totalFocusSeconds)}
            </div>
            
            <div className="mt-5 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${
                  goalProgress >= 100
                    ? "bg-green-500"
                    : goalProgress >= 50
                    ? "bg-blue-500"
                    : "bg-amber-400"
                }`}
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-3 text-[11px] font-semibold text-gray-600">
              <span className={goalProgress >= 100 ? "text-green-600" : goalProgress >= 50 ? "text-blue-600" : "text-amber-600"}>
                {Math.round(goalProgress)}% completed
              </span>
              <span>
                {formatHrsMins(totalActualFocus)} / {formatHrsMins(goalTarget)}
              </span>
            </div>
            
            <div className="text-[10px] text-gray-500 mt-2 font-medium">
              {goalProgress < 50 && "You're building momentum"}
              {goalProgress >= 50 && goalProgress < 100 && "You're halfway there"}
              {goalProgress >= 100 && "Goal achieved 🔥"}
            </div>
          </div>

          {/* 🥈 EXTRA FOCUS CARD */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-5 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out group min-h-[140px] flex flex-col justify-center items-center text-center">
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2">
              🔥 Extra Flow
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 my-1">
              +{formatHrsMins(totalExtraSeconds)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-purple-400 font-medium">
              {flowRatio}% beyond plan
            </div>
            {flowRatio >= 20 && (
              <div className="mt-3 text-[9px] text-purple-600 font-bold bg-purple-100 px-2 py-1 rounded-full inline-block uppercase tracking-wide">
                Flow State
              </div>
            )}
          </div>

          {/* 🥉 AVG SCORE VISUAL CARD */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-5 bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out min-h-[140px] flex flex-col justify-center items-center text-center cursor-help" title={`Based on ${totalSessions} sessions`}>
            <div className="relative w-16 h-16 mx-auto flex-shrink-0">
              <div className="absolute inset-0 rounded-full border-4 border-gray-50"></div>
              <div 
                className={`absolute inset-0 rounded-full border-4 ${avgScore >= 80 ? 'border-green-500' : avgScore >= 50 ? 'border-amber-400' : 'border-red-500'} transition-all duration-1000`}
                style={{
                  clipPath: `inset(${100 - avgScore}% 0 0 0)`
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800">
                {avgScore}%
              </div>
            </div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-3">Quality</div>
          </div>

          {/* 🏅 COMBINED SESSIONS / BREAKS CARD */}
          <div className="col-span-2 md:col-span-4 lg:col-span-3 p-5 bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out min-h-[140px] flex flex-col justify-center">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              <span>Sessions</span>
              <span>Breaks</span>
            </div>
            <div className="flex justify-between items-center px-2">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-600">{totalSessions}</div>
              <div className="text-3xl sm:text-4xl font-extrabold text-red-500">{totalDistractions}</div>
            </div>
            <div className="mt-4 text-[10px] text-gray-400 text-center uppercase tracking-wider font-semibold border-t border-gray-50 pt-3">
              Work vs Interruptions
            </div>
          </div>

        </div>

        {/* INTELLIGENCE PANEL */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-5">
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {isInFlow && (
                <div className="text-xs font-bold text-purple-600 mb-2 animate-pulse uppercase tracking-wider">
                  🔥 Flow State Detected
                </div>
              )}
              <div className="text-base font-bold text-gray-800 mb-1">{insight.summary}</div>
              <div className="text-sm text-gray-500 mb-4 md:mb-0">
                <span className="font-medium text-gray-700">Analysis:</span> {insight.issue}
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Suggested Action</span>
              <button 
                onClick={handleQuickAction}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors active:scale-95 flex items-center gap-1"
              >
                {insight.actionText} <span className="text-lg leading-none">↗</span>
              </button>
            </div>
          </div>

          <div className={`${showMobileDetails ? 'block' : 'hidden'} md:block md:w-1/3 md:border-l md:border-gray-50 md:pl-5 mt-4 md:mt-0`}>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Pattern Preview</div>
            {last3Sessions.length === 0 ? (
              <div className="text-xs text-gray-400 italic">No history to analyze.</div>
            ) : (
              <div className="space-y-3">
                {last3Sessions.map((s, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-medium whitespace-nowrap min-w-[30px]">
                      {Math.floor((s.durationSeconds + (s.extraDuration || 0)) / 60)}m
                    </span>
                    <div className="flex-1 mx-3 bg-gray-50 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${s.score >= 80 ? 'bg-green-400' : s.score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${s.score}%` }} />
                    </div>
                    <span className={`font-bold ${s.score >= 80 ? 'text-green-600' : s.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{s.score}%</span>
                  </div>
                ))}
                
                {bestFlowSession && (bestFlowSession.extraDuration || 0) > 0 && (
                  <div className="text-[10px] font-bold text-purple-600 mt-3 bg-purple-50 px-2 py-1 rounded-md inline-block uppercase tracking-wider border border-purple-100">
                    Best Flow: +{Math.floor((bestFlowSession.extraDuration || 0) / 60)}m
                  </div>
                )}
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

        {/* INTEGRATED MOBILE SUMMARY */}
        <div className="md:hidden bg-white border-t border-gray-100 pt-5 flex flex-col gap-4">
          <div className="flex justify-around text-sm font-bold text-gray-700 bg-gray-50 py-3 rounded-xl border border-gray-100">
            <span className="flex items-center gap-1.5">⏱️ {formatHrsMins(totalActualFocus)}</span>
            <span className={`flex items-center gap-1.5 ${avgScore >= 80 ? 'text-green-600' : avgScore >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
              🎯 {avgScore}%
            </span>
            <span className="flex items-center gap-1.5 text-red-500">⚠️ {totalDistractions}</span>
          </div>
          <button 
            onClick={handleQuickAction}
            className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl text-sm shadow-[0_4px_20px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-all"
          >
            {insight.actionText}
          </button>
        </div>
      </div>
    </div>
  );
}