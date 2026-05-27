"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useFocusSystem } from "../../engine/useFocusSystem";
import { FocusSession, FocusMode } from "../../types/types";
import { Target, Flame, AlertTriangle, Clock, Inbox, Activity, Zap, TrendingUp, ChevronRight, Pause } from "lucide-react";

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
    isPaused,
    currentSession
  } = useFocusSystem();
  
  // 🔥 1-MINUTE RULE: Filter out micro-sessions globally before any math is done
  const typedSessions = useMemo(() => {
    const allSessions = (contextSessions || []) as FocusSession[];
    return allSessions.filter(s => {
      const totalFocusTime = (s.durationSeconds || 0) + (s.extraDuration || 0);
      return totalFocusTime >= 60; 
    });
  }, [contextSessions]);
  
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>("today");
  const [refDate, setRefDate] = useState<Date>(getISTDate());

  // 🔥 LIVE FOCUS SIGNAL STATE
  const [focusSignal, setFocusSignal] = useState<number[]>(Array(40).fill(50));

  // Reset signal when session ends
  useEffect(() => {
    if (!isActive) {
      setFocusSignal(Array(40).fill(50));
    }
  }, [isActive]);

  // Update signal ONLY when active and NOT paused
  useEffect(() => {
    if (!isActive || isPaused) return;

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

        return [...prev.slice(1), next];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, currentSession]);

  const currentSignal = focusSignal[focusSignal.length - 1] || 50;
  const prevSignal = focusSignal[focusSignal.length - 2] || 50;
  const trend = currentSignal - prevSignal;

  const recentDistraction = useMemo(() => {
    if (!currentSession?.distractions) return false;
    return currentSession.distractions.some(
      (d: DistractionEvent) => Date.now() - d.timestamp < 5000
    );
  }, [currentSession?.distractions, focusSignal]); 

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

  // 🔥 Smart Formatter: Adapts cleanly depending on the length of time
  const formatHrsMins = (seconds: number) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const getFocusBadge = () => {
    if (totalSessions === 0) return { label: "Idle", style: "bg-gray-100 text-gray-500 dark:bg-white/[0.04] dark:text-white/50 border border-transparent dark:border-white/[0.08]" };
    if (isInFlow) return { label: "Flow State", style: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-transparent dark:border-purple-500/20" };
    if (avgScore >= 80) return { label: "Deep Focus", style: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-transparent dark:border-green-500/20" };
    if (avgScore >= 50) return { label: "Stable", style: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-transparent dark:border-blue-500/20" };
    return { label: "Distracted", style: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-transparent dark:border-red-500/20" };
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
      
      let colorClass = "bg-gray-100 dark:bg-white/[0.04]";
      if (daySeconds > 0) colorClass = "bg-green-100 dark:bg-orange-500/20";
      if (daySeconds > 3600) colorClass = "bg-green-300 dark:bg-orange-500/40";
      if (daySeconds > 7200) colorClass = "bg-green-500 dark:bg-orange-500/70";
      if (daySeconds > 10800) colorClass = "bg-green-700 dark:bg-orange-500 dark:shadow-[0_0_10px_rgba(249,115,22,0.3)]";

      days.push(
        <div 
          key={i} 
          className={`w-3 h-3 md:w-4 md:h-4 rounded-[2px] ${colorClass} hover:ring-2 dark:hover:ring-1 ring-gray-400 dark:ring-white/50 transition-all cursor-help`}
          title={`${d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}: ${formatHrsMins(daySeconds)}`}
        />
      );
    }

    return (
      <div className="mt-6 border-t border-gray-100 dark:border-white/[0.06] pt-5 animate-in fade-in zoom-in-95">
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Activity size={14} className="text-blue-500 dark:text-orange-500" /> Focus Intensity Map
        </h3>
        <div className="flex flex-wrap gap-1 md:gap-1.5 p-4 bg-white dark:bg-[#070707] border border-gray-200 dark:border-white/[0.06] rounded-xl overflow-y-auto max-h-[160px] custom-scrollbar shadow-sm hover:bg-white/[0.02] transition-all duration-300">
          {days}
        </div>
        <div className="flex justify-end items-center gap-1.5 mt-3">
          <span className="text-[10px] text-gray-400 dark:text-white/40 font-medium mr-1">Less</span>
          <div className="w-2.5 h-2.5 bg-gray-100 dark:bg-white/[0.04] rounded-[2px]"></div>
          <div className="w-2.5 h-2.5 bg-green-100 dark:bg-orange-500/20 rounded-[2px]"></div>
          <div className="w-2.5 h-2.5 bg-green-300 dark:bg-orange-500/40 rounded-[2px]"></div>
          <div className="w-2.5 h-2.5 bg-green-500 dark:bg-orange-500/70 rounded-[2px]"></div>
          <div className="w-2.5 h-2.5 bg-green-700 dark:bg-orange-500 rounded-[2px]"></div>
          <span className="text-[10px] text-gray-400 dark:text-white/40 font-medium ml-1">More</span>
        </div>
      </div>
    );
  };

  const last3Sessions = useMemo(() => {
    return [...filteredSessions].sort((a,b) => b.startTime - a.startTime).slice(0, 3);
  }, [filteredSessions]);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-64 w-full max-w-[580px] bg-white dark:bg-black border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm animate-pulse mb-4 md:mb-0">
         <div className="text-sm font-bold text-gray-400 dark:text-white/40 flex items-center gap-2">
           <Activity size={18} className="animate-spin text-gray-300 dark:text-white/30" />
           Loading Analytics...
         </div>
      </div>
    );
  }

  if (isLoaded && typedSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 w-full max-w-[580px] bg-white dark:bg-black border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm text-center mb-4 md:mb-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all duration-300">
        <Inbox size={48} className="mx-auto mb-4 text-gray-300 dark:text-white/20 stroke-[1px]" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white/90">No Data Collected</h3>
        <p className="text-sm text-gray-500 dark:text-white/50 mt-2 max-w-[300px]">
          Metrics will appear here once you complete a focus session longer than 1 minute.
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center lg:justify-end w-full font-sans text-gray-900 dark:text-white/90">
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/[0.06] p-6 rounded-2xl shadow-sm w-full max-w-[520px] xl:max-w-[580px] animate-in fade-in duration-300 mb-4 md:mb-0">
        
        {/* HEADER ARCHITECTURE */}
        <div className="space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
                <Activity size={16} className="text-blue-500 dark:text-orange-500" />
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
              <div className="text-[10px] text-gray-400 dark:text-white/40 font-bold uppercase tracking-wider flex items-center gap-1">
                <Target size={12} /> Target: {Math.floor(dailyGoal / 3600)}h / day
              </div>
            </div>

            {/* DATE NAVIGATION */}
            <div className="flex items-center bg-gray-50 dark:bg-white/[0.02] rounded-lg w-fit border border-gray-200 dark:border-white/[0.06] shrink-0">
              <button onClick={() => shiftDate(-1)} className="px-3 py-1.5 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white/90 rounded-l-lg transition-colors active:scale-95">◀</button>
              <button onClick={jumpToToday} className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white/90 transition-colors active:scale-95 border-x border-gray-200 dark:border-white/[0.06] uppercase tracking-wider">Today</button>
              <button onClick={() => shiftDate(1)} className="px-3 py-1.5 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white/90 rounded-r-lg transition-colors active:scale-95">▶</button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-white/50">
            <div className="flex items-center gap-3">
              <span>
                {selectedRange === "today" ? "Live performance metrics" : selectedRange === "yesterday" ? "Past flow review" : "Macro behavioral trends"}
              </span>

              {selectedRange === "today" && yestTotalSessions > 0 && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${scoreDiff >= 0 ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"}`}>
                  <TrendingUp size={10} className={`inline mr-1 ${scoreDiff < 0 ? "rotate-180" : ""}`} />
                  vs Yest: <span className="text-gray-800 dark:text-white/80 ml-1">{scoreDiff >= 0 ? "+" : ""}{scoreDiff}%</span>
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
          <div className="flex gap-1 overflow-x-auto bg-gray-50 dark:bg-white/[0.02] p-1 rounded-xl w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border border-gray-200 dark:border-white/[0.06]">
            {(["today", "yesterday", "week", "month", "year", "custom"] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex-1 sm:flex-none text-center border ${
                  selectedRange === range
                    ? "bg-white text-blue-700 border-gray-200 shadow-sm dark:bg-orange-500/10 dark:text-orange-500 dark:border-orange-500/20 dark:shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                    : "text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-200/50 dark:text-white/50 dark:hover:text-white/90 dark:hover:bg-white/[0.04]"
                }`}
              >
                {range === "week" ? "7 Days" : range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* WEEKLY CHART */}
        {selectedRange === "week" && (
          <div className="mt-8 mb-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all duration-300 p-4 -mx-4 rounded-2xl">
            <h3 className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Activity size={14} className="text-blue-500 dark:text-orange-500" /> Weekly Quality Breakdown
            </h3>
            <div className="relative flex items-end justify-between h-36 gap-2 w-full pt-6 border-b border-gray-200 dark:border-white/[0.06]">
               <div className="absolute inset-0 flex flex-col justify-between text-[10px] font-medium text-gray-400 dark:text-white/20 pb-6 pointer-events-none z-0">
                  <div className="w-full border-b border-dashed border-gray-200 dark:border-white/[0.06] flex items-center justify-end pr-1 h-0"><span className="-translate-y-1/2 bg-white dark:bg-black pl-2">100%</span></div>
                  <div className="w-full border-b border-dashed border-gray-200 dark:border-white/[0.06] flex items-center justify-end pr-1 h-0"><span className="-translate-y-1/2 bg-white dark:bg-black pl-2">50%</span></div>
                  <div className="w-full flex items-center justify-end pr-1 h-0"><span className="-translate-y-1/2 bg-white dark:bg-black pl-2">0%</span></div>
               </div>
               
               <div className="relative z-10 flex items-end justify-between w-full h-full pb-6 px-1 lg:px-4">
                 {weeklyData.data.map((day, i) => {
                   const barColor = day.dayScore >= 80 ? 'bg-green-500' : day.dayScore >= 50 ? 'bg-blue-500 dark:bg-orange-500' : 'bg-red-500';
                   const isBestDay = weeklyData.bestDayObj.date === day.dateStr && day.dayScore > 0;
                   return (
                     <div key={i} className="flex flex-col items-center flex-1 group relative h-full justify-end cursor-crosshair">
                       {isBestDay && (
                         <span className="text-[10px] text-purple-600 dark:text-purple-400 absolute -top-5 font-bold whitespace-nowrap dark:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">Best Day</span>
                       )}
                       <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 text-[10px] font-bold bg-gray-900 dark:bg-[#070707] dark:border border-white/[0.06] text-white dark:text-white/90 px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none z-20">
                         {day.dayScore}% • {formatHrsMins(day.dayTime)}
                       </div>
                       <div className="w-full px-1 flex items-end h-full">
                         <div 
                           className={`w-full rounded-t-md shadow-sm transition-all duration-300 origin-bottom group-hover:scale-105 ${day.dayScore === 0 ? 'bg-gray-100 dark:bg-white/[0.04] min-h-[4px]' : barColor}`}
                           style={{ height: `${Math.max(2, day.dayScore)}%` }}
                         />
                       </div>
                       <span className="text-[10px] font-semibold text-gray-500 dark:text-white/40 mt-2 absolute -bottom-6">{day.dayName}</span>
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>
        )}

        {/* 📱 MAIN CONTENT AREA */}
        <div className="mt-8 space-y-7">
          
          {/* 🔥 1. LIVE FOCUS SIGNAL BLOCK */}
          {isActive && (
            <div className="bg-white dark:bg-[#070707] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm relative overflow-hidden">
              
              {/* Overlay for Paused State */}
              {isPaused && (
                <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-2xl">
                  <span className="text-xs font-semibold text-gray-800 dark:text-white/80 flex items-center gap-2">
                    <Pause size={14} className="text-yellow-600 dark:text-yellow-500" /> Monitoring Paused
                  </span>
                </div>
              )}

              <div className="flex justify-between items-start mb-3">
                <div className={`text-[10px] uppercase font-bold flex items-center gap-1.5 ${isPaused ? 'text-gray-400 dark:text-white/40' : 'text-gray-500 dark:text-white/60'}`}>
                  <Activity size={14} className={isPaused ? "text-gray-300 dark:text-white/20" : "text-blue-500 dark:text-orange-500 transition-opacity duration-1000"} /> 
                  {isPaused ? "Monitoring Paused" : "Live Focus Signal"}
                </div>
                {recentDistraction && !isPaused && (
                  <span className="text-[10px] text-red-500 dark:text-red-400 font-bold animate-pulse">
                    ⚠ Distraction detected
                  </span>
                )}
              </div>

              <div className={`relative flex items-end gap-[2px] px-[2px] h-20 w-full z-10 border-b border-gray-100 dark:border-white/[0.06] ${isPaused ? "opacity-60" : ""}`}>
                {currentSession?.distractions?.map((d: DistractionEvent, idx: number) => {
                  const ageSeconds = (Date.now() - d.timestamp) / 1000;
                  if (ageSeconds > 40) return null;
                  const rightPct = (ageSeconds / 40) * 100;
                  return (
                    <div
                      key={idx}
                      className="absolute bottom-0 w-[2px] bg-red-400 dark:bg-red-500 h-full opacity-40 z-0 dark:shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                      style={{ right: `${rightPct}%` }}
                    />
                  );
                })}

                {focusSignal.map((val, i) => {
                  const isGreen = val > 70;
                  const isBlueOrOrange = val > 40 && val <= 70;
                  const isYellow = val > 20 && val <= 40;
                  
                  const colorClass = isGreen ? "bg-green-500" : isBlueOrOrange ? "bg-blue-500 dark:bg-orange-500" : isYellow ? "bg-orange-400 dark:bg-yellow-500" : "bg-red-500";
                  const glowClass = isGreen ? "shadow-[0_0_6px_rgba(34,197,94,0.4)]" : "";

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
                <div className="flex items-center gap-2">
                  <span className={
                    currentSignal > 70 ? "text-green-600 dark:text-green-400" :
                    currentSignal > 40 ? "text-blue-600 dark:text-orange-400" :
                    currentSignal > 20 ? "text-orange-500 dark:text-yellow-400" : "text-red-600 dark:text-red-400"
                  }>
                    {currentSignal > 70 ? "Locked In" :
                     currentSignal > 40 ? "On Track" :
                     currentSignal > 20 ? "Drifting" : "Broken Focus"}
                  </span>
                  
                  {!isPaused && (
                    <span className="text-[10px] text-gray-500 dark:text-white/50 font-medium">
                      {trend > 0 ? "↑ Improving" : trend < 0 ? "↓ Dropping" : "→ Stable"}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-gray-400 dark:text-white/40 uppercase tracking-wider">Live Monitoring</span>
                  <span className="text-[8px] text-gray-300 dark:text-white/30">Approximate signal</span>
                </div>
              </div>
              <div className="text-[9px] text-gray-400 dark:text-white/30 mt-1.5">
                Based on activity + interruptions
              </div>
            </div>
          )}

          {/* 🥇 LEVEL 1: HERO METRIC */}
          <div className="bg-white dark:bg-[#070707] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all duration-300 border border-gray-200 dark:border-white/[0.06] p-6 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="text-[10px] text-gray-500 dark:text-white/40 font-bold uppercase tracking-wider flex justify-between items-center">
              <span>{selectedRange} Focus Time</span>
              {flowRatio > 0 && <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1"><Zap size={12}/> {flowRatio}% Flow</span>}
            </div>
            
            <div className="text-5xl sm:text-6xl font-[520] tracking-[-0.03em] text-gray-900 dark:text-white/90 dark:drop-shadow-[0_0_24px_rgba(255,255,255,0.04)] mt-2">
              {formatHrsMins(totalFocusSeconds)}
            </div>
            
            <div className="text-xs text-gray-500 dark:text-white/50 mt-2 font-medium flex items-center gap-1.5">
              <Clock size={12} className="text-blue-500 dark:text-orange-500" /> Extra: <span className="text-purple-600 dark:text-purple-400 font-bold">+{formatHrsMins(totalExtraSeconds)}</span>
            </div>

            <div className="text-[11px] text-gray-400 dark:text-white/40 mt-1 font-bold uppercase tracking-wider">
              Total Execution: {formatHrsMins(totalActualFocus)}
            </div>
            
            <div className="mt-5 h-2 bg-gray-100 dark:bg-white/[0.04] rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${
                  goalProgress >= 100
                    ? "bg-purple-500 dark:shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                    : "bg-gradient-to-r from-blue-500 to-green-500 dark:from-white/10 dark:to-orange-500"
                }`}
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-3 text-[11px] font-bold">
              <span className={goalProgress >= 100 ? "text-purple-600 dark:text-purple-400" : goalProgress >= 50 ? "text-blue-600 dark:text-orange-400" : "text-gray-500 dark:text-white/60"}>
                {Math.round(goalProgress)}% achieved
              </span>
              <span className="text-gray-500 dark:text-white/50">
                {formatHrsMins(goalTarget)} Target
              </span>
            </div>
          </div>

          <div className={`md:hidden ${showMobileDetails ? 'hidden' : 'block'}`}>
             <button 
                className="w-full text-center text-xs text-gray-600 dark:text-white/60 font-semibold py-3 bg-gray-50 dark:bg-[#070707] border border-gray-200 dark:border-white/[0.06] rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.03] transition-colors flex items-center justify-center gap-2"
                onClick={() => setShowMobileDetails(true)}
              >
                View deeper insights <ChevronRight size={14} />
              </button>
          </div>

          {/* 🥈 LEVEL 2: SECONDARY METRICS */}
          <div className={`grid grid-cols-2 md:grid-cols-2 gap-4 ${showMobileDetails ? 'block' : 'hidden md:grid'}`}>
            
            <div className="p-5 bg-white dark:bg-[#070707] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all duration-300 border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm flex flex-col justify-center items-center text-center">
              <div 
                className="relative w-20 h-20 mx-auto flex-shrink-0 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(${avgScore >= 80 ? '#22c55e' : avgScore >= 50 ? '#3b82f6' : '#ef4444'} ${avgScore}%, rgba(156,163,175,0.2) ${avgScore}%)` // using a neutral gray fallback
                }}
              >
                <div className="w-16 h-16 bg-white dark:bg-black rounded-full flex items-center justify-center absolute">
                  <span className="text-base font-bold text-gray-900 dark:text-white/90">{avgScore}%</span>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 dark:text-white/40 font-bold uppercase tracking-wider mt-4">Avg Quality</div>
            </div>

            <div className="p-5 bg-white dark:bg-[#070707] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all duration-300 border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm flex flex-col justify-center">
              <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-2">
                <span>Sessions</span>
                <span>Breaks</span>
              </div>
              <div className="flex justify-between items-center px-2 mt-2">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-blue-500 dark:text-orange-500" />
                  <span className="text-3xl font-bold text-gray-900 dark:text-white/90">{totalSessions}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  <span className="text-3xl font-bold text-red-500 dark:text-red-400">{totalDistractions}</span>
                </div>
              </div>
              <div className="mt-4 text-[9px] text-gray-400 dark:text-white/40 text-center uppercase tracking-wider font-semibold border-t border-gray-100 dark:border-white/[0.06] pt-3">
                Work vs Interruptions
              </div>
            </div>
          </div>

          {/* NEW CHARTS GRID */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 ${showMobileDetails ? 'block' : 'hidden md:grid'}`}>
            
            <div className="bg-white dark:bg-[#070707] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all duration-300 border border-gray-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm flex flex-col justify-center">
              <h3 className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Activity size={14} className="text-blue-500 dark:text-orange-500" /> Focus vs Distractions
              </h3>

              <div className="flex flex-col gap-3 mt-1">
                <div>
                  <div className="flex justify-between text-[10px] text-gray-500 dark:text-white/50 mb-1.5 font-semibold">
                    <span>Focus Time</span>
                    <span className="text-blue-600 dark:text-orange-400 font-bold">{formatHrsMins(totalFocusSeconds)}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-white/[0.04] rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-blue-500 dark:bg-orange-500 transition-all duration-500 rounded-full"
                      style={{ width: `${totalFocusSeconds === 0 ? 0 : (totalFocusSeconds / Math.max(1, totalFocusSeconds + totalDistractions * 60)) * 100}%` }} 
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-gray-500 dark:text-white/50 mb-1.5 font-semibold">
                    <span>Interruptions</span>
                    <span className="text-red-500 dark:text-red-400 font-bold">{totalDistractions}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-white/[0.04] rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-red-500 transition-all duration-500 rounded-full dark:shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                      style={{ width: `${totalFocusSeconds === 0 && totalDistractions === 0 ? 0 : ((totalDistractions * 60) / Math.max(1, totalFocusSeconds + totalDistractions * 60)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#070707] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all duration-300 border border-gray-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm flex flex-col justify-center">
              <h3 className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Clock size={14} className="text-purple-600 dark:text-purple-400" /> Session Trend
              </h3>

              <div className="flex items-end gap-3 h-[72px] mt-2">
                {last3Sessions.length > 0 ? last3Sessions.slice().reverse().map((s, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-crosshair">
                    <div
                      className="w-full bg-blue-500 dark:bg-purple-500 rounded-t-md transition-all duration-500 group-hover:bg-blue-400 dark:group-hover:bg-purple-400 shadow-sm"
                      style={{
                        height: `${Math.max(5, Math.min(100, (s.durationSeconds / 3600) * 100))}%`
                      }}
                    />
                    <span className="text-[10px] font-bold text-gray-500 dark:text-white/50 mt-2">
                      {formatHrsMins(s.durationSeconds)}
                    </span>
                  </div>
                )) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 dark:text-white/40 font-medium">No recent sessions</div>
                )}
              </div>
            </div>

          </div>

          <div className={`${showMobileDetails ? 'block' : 'hidden md:block'}`}>
            {generateHeatmap()}
          </div>
        </div>

        {/* 🧠 LEVEL 3: INTELLIGENCE PANEL */}
        <div className="mt-6 bg-white dark:bg-[#070707] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all duration-300 p-6 rounded-2xl border border-gray-200 dark:border-white/[0.06] shadow-sm flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {isInFlow && (
                <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={12} /> Flow State Active
                </div>
              )}
              <div className="text-sm font-bold text-gray-900 dark:text-white/90 mb-2">{insight.summary}</div>
              <div className="text-xs text-gray-600 dark:text-white/60 font-medium mb-4 md:mb-0 leading-relaxed">
                <span className="text-gray-400 dark:text-white/40">Analysis:</span> {insight.issue}
              </div>
              
              <button
                onClick={handleQuickAction}
                className="mt-4 px-4 py-2 w-fit text-sm font-semibold text-gray-900 dark:text-orange-500 bg-white dark:bg-orange-500/10 border border-gray-200 dark:border-orange-500/20 rounded-lg hover:border-blue-500 hover:text-blue-600 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/20 transition-colors"
              >
                {insight.actionText}
              </button>
            </div>
            
            <div className="mt-auto pt-5 border-t border-gray-100 dark:border-white/[0.06] flex flex-col gap-3">

              <span className="text-[10px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-bold">
                Focus DNA
              </span>

              <div className="grid grid-cols-2 gap-3 text-[11px]">

                <div className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/[0.06] rounded-lg p-2">
                  <div className="text-gray-400 dark:text-white/40 text-[9px] uppercase">Pattern</div>
                  <div className="font-bold text-gray-800 dark:text-white/80">
                    {flowRatio > 30 ? "Deep Flow Builder" :
                     totalDistractions > 5 ? "Interrupt Driven" :
                     "Structured Executor"}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/[0.06] rounded-lg p-2">
                  <div className="text-gray-400 dark:text-white/40 text-[9px] uppercase">Energy</div>
                  <div className="font-bold text-gray-800 dark:text-white/80">
                    {avgScore >= 80 ? "High Stability" :
                     avgScore >= 50 ? "Moderate" :
                     "Unstable"}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/[0.06] rounded-lg p-2">
                  <div className="text-gray-400 dark:text-white/40 text-[9px] uppercase">Flow Behavior</div>
                  <div className="font-bold text-gray-800 dark:text-white/80">
                    {totalExtraSeconds > 0 ? "Extends Sessions" : "Stops on Timer"}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/[0.06] rounded-lg p-2">
                  <div className="text-gray-400 dark:text-white/40 text-[9px] uppercase">Risk</div>
                  <div className="font-bold text-red-500 dark:text-red-400">
                    {topIssue !== "None" ? topIssue : "Low"}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className={`${showMobileDetails ? 'block' : 'hidden'} md:block md:w-[40%] md:border-l md:border-gray-100 dark:md:border-white/[0.06] md:pl-6 mt-4 md:mt-0`}>
            <div className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Target size={14} className="text-gray-400 dark:text-white/40" /> Pattern Preview
            </div>
            {last3Sessions.length === 0 ? (
              <div className="text-xs text-gray-400 dark:text-white/30 italic">No history to analyze.</div>
            ) : (
              <div className="space-y-4">
                {last3Sessions.map((s, i) => {
                  const barColor = s.score >= 80 ? 'bg-green-500' : s.score >= 50 ? 'bg-blue-500 dark:bg-orange-500' : 'bg-red-500';
                  const textColor = s.score >= 80 ? 'text-green-600 dark:text-green-400' : s.score >= 50 ? 'text-blue-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400';
                  return (
                    <div key={i} className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-600 dark:text-white/60 font-bold whitespace-nowrap min-w-[32px]">
                        {formatHrsMins(s.durationSeconds + (s.extraDuration || 0))}
                      </span>
                      <div className="flex-1 mx-3 bg-gray-100 dark:bg-white/[0.04] h-1.5 rounded-full overflow-hidden shadow-inner">
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
            className="md:hidden w-full text-center text-xs text-gray-500 dark:text-white/50 font-semibold py-3 mt-4 border border-gray-200 dark:border-white/[0.06] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors shadow-sm"
            onClick={() => setShowMobileDetails(false)}
          >
            Hide extra insights
          </button>
        )}

      </div>
    </div>
  );
}