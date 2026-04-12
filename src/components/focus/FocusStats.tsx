"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useFocusSystem } from "./useFocusSystem";
import { FocusSession, FocusMode } from "./types";
import { Target, Flame, AlertTriangle, Clock, Inbox, Activity, Zap, TrendingUp, ChevronRight } from "lucide-react";

type DateRange = "today" | "yesterday" | "week" | "month" | "year" | "custom";

type WeeklyPoint = {
  dateStr: string;
  dayName: string;
  dayScore: number;
  dayTime: number;
};

type DistractionEvent = {
  timestamp: number;
  reason: string;
};

// 🔥 Synchronized strictly to IST across the board
const getISTDate = (date: Date | number = new Date()) => {
  return new Date(new Date(date).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
};

const getDateStr = (ts: number) => {
  const d = getISTDate(ts);
  return d.getFullYear() + "-" + 
    String(d.getMonth() + 1).padStart(2, "0") + "-" + 
    String(d.getDate()).padStart(2, "0");
};

export default function FocusStatsCard() {
  const { 
    sessions: contextSessions, 
    isLoaded, 
    setMode, 
    setTimeRemaining, 
    startSession,
    dailyGoal,
    isActive,
    currentSession
  } = useFocusSystem();
  
  const typedSessions = contextSessions as FocusSession[];
  
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>("today");
  const [refDate, setRefDate] = useState<Date>(getISTDate());

  // 🔥 LIVE FOCUS SIGNAL STATE
  const [focusSignal, setFocusSignal] = useState<number[]>(Array(40).fill(50));

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setFocusSignal(prev => {
        const last = prev[prev.length - 1] || 50;
        let next = last;

        const recentDistraction = currentSession?.distractions?.some(
          (d: DistractionEvent) => Date.now() - d.timestamp < 5000
        );

        if (recentDistraction) {
          next = Math.max(10, last - 30); // sharp drop
        } else {
          next = Math.min(100, last + Math.random() * 5); // slow rise
        }

        const updated = [...prev, next];
        return updated.slice(-40);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, currentSession]);

  // --- TIME TRAVEL & DATE MATH ---
  const { 
    todayStr, yesterdayStr, weekStartStr, 
    refDateStr, refMonthStr, refYearStr,
    datesInWeek 
  } = useMemo(() => {
    const today = getISTDate();
    const tStr = getDateStr(today.getTime());
    
    const yest = getISTDate();
    yest.setDate(yest.getDate() - 1);
    const yStr = getDateStr(yest.getTime());

    const weekStart = getISTDate();
    weekStart.setDate(weekStart.getDate() - 6);
    const wStr = getDateStr(weekStart.getTime());

    const rDateStr = getDateStr(refDate.getTime());
    const rMonthStr = rDateStr.slice(0, 7); 
    const rYearStr = rDateStr.slice(0, 4);  

    const dInWeek = [];
    for (let i = 6; i >= 0; i--) {
      const d = getISTDate();
      d.setDate(d.getDate() - i);
      dInWeek.push(getDateStr(d.getTime()));
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

  const flowRatio = totalFocusSeconds > 0
    ? Math.round((totalExtraSeconds / totalFocusSeconds) * 100)
    : 0;
    
  const isInFlow = flowRatio >= 20; 

  const yestTotalSessions = yesterdaySessions.length;
  const yestAvgScore = yestTotalSessions > 0 
    ? Math.round(yesterdaySessions.reduce<number>((acc, s) => acc + s.score, 0) / yestTotalSessions) 
    : 0;
  const scoreDiff = avgScore - yestAvgScore;

  let goalTarget = dailyGoal;
  if (selectedRange === "week") goalTarget = dailyGoal * 7;
  if (selectedRange === "month") goalTarget = dailyGoal * 30;
  if (selectedRange === "year") goalTarget = dailyGoal * 365;
  
  const goalProgress = goalTarget > 0 
    ? Math.min(100, (totalActualFocus / goalTarget) * 100) 
    : 0;

  const streak = useMemo(() => {
    if (!typedSessions) return 0;
    const datesSet = new Set(typedSessions.map(s => getDateStr(s.startTime)));
    let streakCount = 0;
    let d = getISTDate();
    if (!datesSet.has(getDateStr(d.getTime()))) d.setDate(d.getDate() - 1);
    while (datesSet.has(getDateStr(d.getTime()))) {
      streakCount++;
      d.setDate(d.getDate() - 1);
    }
    return streakCount;
  }, [typedSessions]);

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

  const formatHrsMins = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const getFocusBadge = () => {
    if (totalSessions === 0) return { label: "Idle", style: "bg-gray-100 text-gray-500" };
    if (isInFlow) return { label: "Flow State", style: "bg-orange-50 text-orange-600 border border-orange-200" };
    if (avgScore >= 80) return { label: "Deep Focus", style: "bg-green-50 text-green-700 border border-green-200" };
    if (avgScore >= 50) return { label: "Stable", style: "bg-blue-50 text-blue-700 border border-blue-200" };
    return { label: "Distracted", style: "bg-red-50 text-red-700 border border-red-200" };
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

  const getStructuredInsight = () => {
    if (flowRatio >= 30) {
      return { summary: "You entered deep flow state.", issue: "You naturally extended your focus beyond plan.", actionText: "Increase Session Length (45m)", mode: "custom" as FocusMode, time: 45 };
    }
    if (totalExtraSeconds === 0 && totalSessions > 0) {
      return { summary: "You are stopping exactly on timer.", issue: "No extended focus detected.", actionText: "Push +5min beyond timer", mode: "custom" as FocusMode, time: 30 };
    }
    if (selectedRange === "yesterday" || (selectedRange === "custom" && refDateStr !== todayStr)) {
      return { summary: totalSessions === 0 ? "No activity recorded for this date." : "Review past flow.", issue: topIssue !== "None" ? `Main distraction: ${topIssue}` : "Solid discipline maintained.", actionText: "Improve Today", mode: "deepWork" as FocusMode, time: 45 };
    }
    if (selectedRange === "month") {
      return { summary: "Monthly macro-level performance overview.", issue: topIssue !== "None" ? `Monthly Nemesis: ${topIssue}` : "Excellent long-term focus.", actionText: "Optimize Routine", mode: "custom" as FocusMode, time: 60 };
    }
    if (selectedRange === "year") {
      return { summary: "Yearly behavioral pattern analysis.", issue: "Long-term discipline trend.", actionText: "Reset Strategy", mode: "custom" as FocusMode, time: 90 };
    }
    if (selectedRange === "week") {
      const bestDayName = weeklyData.bestDayObj.date ? new Date(weeklyData.bestDayObj.date).toLocaleDateString('en-US', { weekday: 'long' }) : "None";
      return { summary: totalSessions === 0 ? "No activity this week." : `Weekly rhythm: ${bestDayName} was your best day.`, issue: topIssue !== "None" ? `Weekly nemesis: ${topIssue}` : "Consistent flow.", actionText: "Start Weekly Review", mode: "custom" as FocusMode, time: 30 };
    }
    if (totalSessions === 0) return { summary: "No sessions started today.", issue: "Momentum is zero.", actionText: "Start Pomodoro (25m)", mode: "pomodoro" as FocusMode, time: 25 };
    if (totalDistractions > 5 || avgScore < 50) return { summary: "Focus is unstable and breaking frequently.", issue: `Primary trigger: ${topIssue}`, actionText: "Short Re-focus (15m)", mode: "custom" as FocusMode, time: 15 };
    if (avgScore >= 80) return { summary: "Deep work mode achieved.", issue: "None. You are locked in.", actionText: "Continue Deep Work (60m)", mode: "deepWork" as FocusMode, time: 60 };
    
    return { summary: "Stable flow established.", issue: "Maintain momentum.", actionText: "Start Custom (45m)", mode: "custom" as FocusMode, time: 45 };
  };
  
  const insight = useMemo(() => getStructuredInsight(), [flowRatio, totalExtraSeconds, totalSessions, selectedRange, refDateStr, todayStr, topIssue, weeklyData, totalDistractions, avgScore]);

  const handleQuickAction = () => {
    setMode(insight.mode);
    setTimeRemaining(insight.time * 60);
    setTimeout(() => startSession(), 50);
  };

  const jumpToToday = () => {
    setRefDate(getISTDate());
    setSelectedRange("today");
  };

  const shiftDate = (dir: 1 | -1) => {
    const newDate = new Date(refDate);
    if (selectedRange === "month") newDate.setMonth(newDate.getMonth() + dir);
    else if (selectedRange === "year") newDate.setFullYear(newDate.getFullYear() + dir);
    else newDate.setDate(newDate.getDate() + dir);
    
    if (newDate > getISTDate()) return;

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
      const dStr = getDateStr(d.getTime());
      
      const daySeconds = typedSessions
        .filter(s => getDateStr(s.startTime) === dStr)
        .reduce<number>((acc, s) => acc + s.durationSeconds + (s.extraDuration || 0), 0);
      
      let colorClass = "bg-gray-100";
      if (daySeconds > 0) colorClass = "bg-green-100";
      if (daySeconds > 3600) colorClass = "bg-green-300";
      if (daySeconds > 7200) colorClass = "bg-green-500";
      if (daySeconds > 10800) colorClass = "bg-green-700";

      days.push(
        <div 
          key={i} 
          className={`w-3 h-3 md:w-4 md:h-4 rounded-[2px] ${colorClass} hover:ring-2 ring-gray-400 transition-all cursor-help`}
          title={`${d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}: ${formatHrsMins(daySeconds)}`}
        />
      );
    }

    return (
      <div className="mt-6 border-t border-gray-100 pt-5 animate-in fade-in zoom-in-95">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Activity size={14} className="text-blue-500" /> Focus Intensity Map
        </h3>
        <div className="flex flex-wrap gap-1 md:gap-1.5 p-4 bg-white border border-gray-200 rounded-xl overflow-y-auto max-h-[160px] custom-scrollbar shadow-sm">
          {days}
        </div>
        <div className="flex justify-end items-center gap-1.5 mt-3">
          <span className="text-[10px] text-gray-400 font-medium mr-1">Less</span>
          <div className="w-2.5 h-2.5 bg-gray-100 rounded-[2px]"></div>
          <div className="w-2.5 h-2.5 bg-green-100 rounded-[2px]"></div>
          <div className="w-2.5 h-2.5 bg-green-300 rounded-[2px]"></div>
          <div className="w-2.5 h-2.5 bg-green-500 rounded-[2px]"></div>
          <div className="w-2.5 h-2.5 bg-green-700 rounded-[2px]"></div>
          <span className="text-[10px] text-gray-400 font-medium ml-1">More</span>
        </div>
      </div>
    );
  };

  const last3Sessions = useMemo(() => {
    return [...filteredSessions].sort((a,b) => b.startTime - a.startTime).slice(0, 3);
  }, [filteredSessions]);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-64 w-full max-w-[580px] bg-white border border-gray-200 rounded-2xl shadow-sm animate-pulse mb-4 md:mb-0">
         <div className="text-sm font-bold text-gray-400 flex items-center gap-2">
           <Activity size={18} className="animate-spin text-gray-300" />
           Loading Analytics...
         </div>
      </div>
    );
  }

  if (isLoaded && typedSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 w-full max-w-[580px] bg-white border border-gray-200 rounded-2xl shadow-sm text-center mb-4 md:mb-0">
        <Inbox size={48} className="mx-auto mb-4 text-gray-300 stroke-[1px]" />
        <h3 className="text-lg font-bold text-gray-900">No Data Collected</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-[300px]">
          Your performance metrics will appear here once you complete your first focus session.
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center lg:justify-end w-full">
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm w-full max-w-[520px] xl:max-w-[580px] animate-in fade-in duration-300 mb-4 md:mb-0">
        
        {/* HEADER ARCHITECTURE */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Activity size={16} className="text-blue-500" />
                {selectedRange === "today" && "Today’s Analytics"}
                {selectedRange === "yesterday" && "Yesterday’s Analytics"}
                {selectedRange === "week" && "Weekly Analytics"}
                {selectedRange === "custom" && `Report: ${refDate.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}`}
                {selectedRange === "month" && `Report: ${refDate.toLocaleDateString(undefined, {month: 'long', year: 'numeric'})}`}
                {selectedRange === "year" && `Report: ${refYearStr}`}
                
                <div className={`hidden sm:flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${badge.style}`}>
                  {badge.label}
                </div>
              </h2>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Target size={12} /> Target: {Math.floor(dailyGoal / 3600)}h / day
              </div>
            </div>

            {/* DATE NAVIGATION */}
            <div className="flex items-center bg-gray-50 rounded-lg w-fit border border-gray-200 shrink-0">
              <button onClick={() => shiftDate(-1)} className="px-3 py-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-l-lg transition-colors active:scale-95">◀</button>
              <button onClick={jumpToToday} className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors active:scale-95 border-x border-gray-200 uppercase tracking-wider">Today</button>
              <button onClick={() => shiftDate(1)} className="px-3 py-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-r-lg transition-colors active:scale-95">▶</button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span>
                {selectedRange === "today" ? "Live performance metrics" : selectedRange === "yesterday" ? "Past flow review" : "Macro behavioral trends"}
              </span>

              {selectedRange === "today" && yestTotalSessions > 0 && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${scoreDiff >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  <TrendingUp size={10} className={`inline mr-1 ${scoreDiff < 0 ? "rotate-180" : ""}`} />
                  vs Yest: {scoreDiff >= 0 ? "+" : ""}{scoreDiff}%
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className={`sm:hidden text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${badge.style}`}>
                {badge.label}
              </div>
              {streak > 0 && (
                <span className="text-orange-500 font-bold flex items-center">
                  <Flame size={14} className="mr-1 animate-pulse" /> {streak} Day Streak
                </span>
              )}
            </div>
          </div>

          {/* RANGE SELECTOR */}
          <div className="flex gap-1 overflow-x-auto bg-gray-50 p-1 rounded-xl w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border border-gray-200">
            {(["today", "yesterday", "week", "month", "year", "custom"] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex-1 sm:flex-none text-center ${
                  selectedRange === range
                    ? "bg-white text-blue-700 shadow-sm border border-gray-200"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
              >
                {range === "week" ? "7 Days" : range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* WEEKLY CHART */}
        {selectedRange === "week" && (
          <div className="mt-8 mb-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Activity size={14} className="text-blue-500" /> Weekly Quality Breakdown
            </h3>
            <div className="relative flex items-end justify-between h-36 gap-2 w-full pt-6 border-b border-gray-100">
               <div className="absolute inset-0 flex flex-col justify-between text-[10px] font-medium text-gray-300 pb-6 pointer-events-none z-0">
                  <div className="w-full border-b border-dashed border-gray-200 flex items-center justify-end pr-1 h-0"><span className="-translate-y-1/2 bg-white pl-2">100%</span></div>
                  <div className="w-full border-b border-dashed border-gray-200 flex items-center justify-end pr-1 h-0"><span className="-translate-y-1/2 bg-white pl-2">50%</span></div>
                  <div className="w-full flex items-center justify-end pr-1 h-0"><span className="-translate-y-1/2 bg-white pl-2">0%</span></div>
               </div>
               
               <div className="relative z-10 flex items-end justify-between w-full h-full pb-6 px-1 lg:px-4">
                 {weeklyData.data.map((day, i) => {
                   const barColor = day.dayScore >= 80 ? 'bg-green-500' : day.dayScore >= 50 ? 'bg-blue-500' : 'bg-red-500';
                   return (
                     <div key={i} className="flex flex-col items-center flex-1 group relative h-full justify-end cursor-crosshair">
                       <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 text-[10px] font-bold bg-gray-900 text-white px-2 py-1 rounded shadow-md whitespace-nowrap pointer-events-none z-20">
                         {day.dayScore}% • {formatHrsMins(day.dayTime)}
                       </div>
                       <div className="w-full px-1 flex items-end h-full">
                         <div 
                           className={`w-full rounded-t-md shadow-sm transition-all duration-300 origin-bottom group-hover:scale-105 ${day.dayScore === 0 ? 'bg-gray-100 min-h-[4px]' : barColor}`}
                           style={{ height: `${Math.max(2, day.dayScore)}%` }}
                         />
                       </div>
                       <span className="text-[10px] font-semibold text-gray-400 mt-2 absolute -bottom-6">{day.dayName}</span>
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>
        )}

        {/* 📱 MAIN CONTENT AREA */}
        <div className="mt-8 space-y-5">
          
          {/* 🔥 1. LIVE FOCUS SIGNAL BLOCK */}
          {isActive && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="text-[10px] text-gray-400 uppercase font-bold mb-3 flex items-center gap-1.5">
                <Activity size={14} className="text-blue-500 animate-pulse" /> Live Focus Signal
              </div>

              <div className="relative flex items-end gap-[2px] h-20 w-full z-10 border-b border-gray-100">
                {currentSession?.distractions?.map((d: DistractionEvent, idx: number) => {
                  const ageSeconds = (Date.now() - d.timestamp) / 1000;
                  if (ageSeconds > 40) return null;
                  const rightPct = (ageSeconds / 40) * 100;
                  return (
                    <div
                      key={idx}
                      className="absolute bottom-0 w-[2px] bg-red-400 h-full opacity-30 z-0"
                      style={{ right: `${rightPct}%` }}
                    />
                  );
                })}

                {focusSignal.map((val, i) => {
                  const isGreen = val > 70;
                  const isBlue = val > 40 && val <= 70;
                  const isOrange = val > 20 && val <= 40;
                  
                  const colorClass = isGreen ? "bg-green-500" : isBlue ? "bg-blue-500" : isOrange ? "bg-orange-400" : "bg-red-500";
                  const glowClass = isGreen ? "shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "";

                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-[1px] transition-all duration-300 ease-out z-10 ${colorClass} ${glowClass}`}
                      style={{ height: `${val}%` }}
                    />
                  );
                })}
              </div>

              <div className="text-[11px] font-bold mt-3 flex items-center justify-between">
                <span className={
                  (focusSignal.at(-1) || 50) > 70 ? "text-green-600" :
                  (focusSignal.at(-1) || 50) > 40 ? "text-blue-600" :
                  (focusSignal.at(-1) || 50) > 20 ? "text-orange-500" : "text-red-600"
                }>
                  {(focusSignal.at(-1) || 50) > 70 ? "Deep focus" :
                   (focusSignal.at(-1) || 50) > 40 ? "Stable" :
                   (focusSignal.at(-1) || 50) > 20 ? "Losing focus" : "Disrupted"}
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">Live Monitoring</span>
              </div>
            </div>
          )}

          {/* 🥇 LEVEL 1: HERO METRIC */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex justify-between items-center">
              <span>{selectedRange} Focus Time</span>
              {flowRatio > 0 && <span className="text-orange-500 flex items-center gap-1"><Zap size={12}/> {flowRatio}% Flow</span>}
            </div>
            
            <div className="text-4xl font-extrabold text-gray-900 tracking-tight mt-2">
              {formatHrsMins(totalFocusSeconds)}
            </div>
            
            <div className="text-xs text-gray-500 mt-2 font-medium flex items-center gap-1.5">
              <Clock size={12} className="text-blue-500" /> Extra: <span className="text-gray-900 font-bold">+{formatHrsMins(totalExtraSeconds)}</span>
            </div>

            <div className="text-[11px] text-gray-400 mt-1 font-bold uppercase tracking-wider">
              Total Execution: {formatHrsMins(totalActualFocus)}
            </div>
            
            <div className="mt-5 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-orange-400 to-green-500 transition-all duration-1000 ease-out"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-3 text-[11px] font-bold">
              <span className={goalProgress >= 100 ? "text-green-600" : goalProgress >= 50 ? "text-orange-500" : "text-blue-600"}>
                {Math.round(goalProgress)}% achieved
              </span>
              <span className="text-gray-500">
                {formatHrsMins(goalTarget)} Target
              </span>
            </div>
          </div>

          <div className={`md:hidden ${showMobileDetails ? 'hidden' : 'block'}`}>
             <button 
                className="w-full text-center text-xs text-gray-600 font-semibold py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                onClick={() => setShowMobileDetails(true)}
              >
                View deeper insights <ChevronRight size={14} />
              </button>
          </div>

          {/* 🥈 LEVEL 2: SECONDARY METRICS */}
          <div className={`grid grid-cols-2 md:grid-cols-2 gap-4 ${showMobileDetails ? 'block' : 'hidden md:grid'}`}>
            
            <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center">
              <div 
                className="relative w-20 h-20 mx-auto flex-shrink-0 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(${avgScore >= 80 ? '#22c55e' : avgScore >= 50 ? '#3b82f6' : '#ef4444'} ${avgScore}%, #f3f4f6 ${avgScore}%)`
                }}
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center absolute">
                  <span className="text-base font-bold text-gray-900">{avgScore}%</span>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-4">Avg Quality</div>
            </div>

            <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-center">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                <span>Sessions</span>
                <span>Breaks</span>
              </div>
              <div className="flex justify-between items-center px-2 mt-2">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-blue-500" />
                  <span className="text-3xl font-bold text-blue-600">{totalSessions}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  <span className="text-3xl font-bold text-red-500">{totalDistractions}</span>
                </div>
              </div>
              <div className="mt-4 text-[9px] text-gray-400 text-center uppercase tracking-wider font-semibold border-t border-gray-100 pt-3">
                Work vs Interruptions
              </div>
            </div>
          </div>

          {/* NEW CHARTS GRID */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 ${showMobileDetails ? 'block' : 'hidden md:grid'}`}>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Activity size={14} className="text-blue-500" /> Focus vs Distractions
              </h3>

              <div className="flex flex-col gap-3 mt-1">
                <div>
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1.5 font-semibold">
                    <span>Focus Time</span>
                    <span className="text-blue-600 font-bold">{formatHrsMins(totalFocusSeconds)}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500 rounded-full"
                      style={{ width: `${totalFocusSeconds === 0 ? 0 : (totalFocusSeconds / Math.max(1, totalFocusSeconds + totalDistractions * 60)) * 100}%` }} 
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1.5 font-semibold">
                    <span>Interruptions</span>
                    <span className="text-red-500 font-bold">{totalDistractions}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-red-500 transition-all duration-500 rounded-full"
                      style={{ width: `${totalFocusSeconds === 0 && totalDistractions === 0 ? 0 : ((totalDistractions * 60) / Math.max(1, totalFocusSeconds + totalDistractions * 60)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Clock size={14} className="text-blue-500" /> Session Trend
              </h3>

              <div className="flex items-end gap-3 h-[72px] mt-2">
                {last3Sessions.length > 0 ? last3Sessions.slice().reverse().map((s, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-crosshair">
                    <div
                      className="w-full bg-blue-500 rounded-t-md transition-all duration-500 group-hover:bg-blue-400 shadow-sm"
                      style={{
                        height: `${Math.max(5, Math.min(100, (s.durationSeconds / 3600) * 100))}%`
                      }}
                    />
                    <span className="text-[10px] font-bold text-gray-500 mt-2">
                      {Math.floor(s.durationSeconds / 60)}m
                    </span>
                  </div>
                )) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-medium">No recent sessions</div>
                )}
              </div>
            </div>

          </div>

          <div className={`${showMobileDetails ? 'block' : 'hidden md:block'}`}>
            {generateHeatmap()}
          </div>
        </div>

        {/* 🧠 LEVEL 3: INTELLIGENCE PANEL */}
        <div className="mt-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {isInFlow && (
                <div className="text-[10px] font-bold text-orange-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={12} /> Flow State Active
                </div>
              )}
              <div className="text-sm font-bold text-gray-900 mb-2">{insight.summary}</div>
              <div className="text-xs text-gray-600 font-medium mb-4 md:mb-0 leading-relaxed">
                <span className="text-gray-400">Analysis:</span> {insight.issue}
              </div>
            </div>
            
            <div className="mt-auto pt-5 border-t border-gray-100 flex flex-col gap-3">

              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                Focus DNA
              </span>

              <div className="grid grid-cols-2 gap-3 text-[11px]">

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                  <div className="text-gray-400 text-[9px] uppercase">Pattern</div>
                  <div className="font-bold text-gray-800">
                    {flowRatio > 30 ? "Deep Flow Builder" :
                     totalDistractions > 5 ? "Interrupt Driven" :
                     "Structured Executor"}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                  <div className="text-gray-400 text-[9px] uppercase">Energy</div>
                  <div className="font-bold text-gray-800">
                    {avgScore >= 80 ? "High Stability" :
                     avgScore >= 50 ? "Moderate" :
                     "Unstable"}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                  <div className="text-gray-400 text-[9px] uppercase">Flow Behavior</div>
                  <div className="font-bold text-gray-800">
                    {totalExtraSeconds > 0 ? "Extends Sessions" : "Stops on Timer"}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                  <div className="text-gray-400 text-[9px] uppercase">Risk</div>
                  <div className="font-bold text-red-500">
                    {topIssue !== "None" ? topIssue : "Low"}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className={`${showMobileDetails ? 'block' : 'hidden'} md:block md:w-[40%] md:border-l md:border-gray-100 md:pl-6 mt-4 md:mt-0`}>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Target size={14} className="text-gray-400" /> Pattern Preview
            </div>
            {last3Sessions.length === 0 ? (
              <div className="text-xs text-gray-400 italic">No history to analyze.</div>
            ) : (
              <div className="space-y-4">
                {last3Sessions.map((s, i) => {
                  const barColor = s.score >= 80 ? 'bg-green-500' : s.score >= 50 ? 'bg-blue-500' : 'bg-red-500';
                  const textColor = s.score >= 80 ? 'text-green-600' : s.score >= 50 ? 'text-blue-600' : 'text-red-600';
                  return (
                    <div key={i} className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-600 font-bold whitespace-nowrap min-w-[32px]">
                        {Math.floor((s.durationSeconds + (s.extraDuration || 0)) / 60)}m
                      </span>
                      <div className="flex-1 mx-3 bg-gray-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full ${barColor}`} style={{ width: `${s.score}%` }} />
                      </div>
                      <span className={`font-bold ${textColor}`}>{s.score}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {showMobileDetails && (
           <button 
            className="md:hidden w-full text-center text-xs text-gray-500 font-semibold py-3 mt-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            onClick={() => setShowMobileDetails(false)}
          >
            Hide extra insights
          </button>
        )}

      </div>
    </div>
  );
}