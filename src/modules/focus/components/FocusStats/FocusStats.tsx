"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useFocusSystem } from "../../engine/useFocusSystem";
import { FocusSession, FocusMode } from "../../types/types";
import { Target, Flame, AlertTriangle, Clock, Inbox, Activity, Zap, TrendingUp, ChevronRight, Pause } from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

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

  const { isDarkMode } = useTheme();
  
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

  const formatHrsMins = (seconds: number) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const getFocusBadge = () => {
    if (totalSessions === 0) return { label: "Idle", style: isDarkMode ? "bg-black text-gray-400 border border-white/[0.04]" : "bg-gray-100 text-gray-500 border border-transparent" };
    if (isInFlow) return { label: "Flow State", style: isDarkMode ? "bg-purple-950/30 text-purple-400 border border-purple-900/50" : "bg-purple-100 text-purple-700 border border-transparent" };
    if (avgScore >= 80) return { label: "Deep Focus", style: isDarkMode ? "bg-emerald-950/30 text-emerald-400 border border-emerald-900/50" : "bg-green-100 text-green-700 border border-transparent" };
    if (avgScore >= 50) return { label: "Stable", style: isDarkMode ? "bg-blue-950/30 text-blue-400 border border-blue-900/50" : "bg-blue-100 text-blue-700 border border-transparent" };
    return { label: "Distracted", style: isDarkMode ? "bg-red-950/30 text-red-400 border border-red-900/50" : "bg-red-100 text-red-700 border border-transparent" };
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
      
      let colorClass = isDarkMode ? "bg-black" : "bg-gray-100";
      if (daySeconds > 0) colorClass = isDarkMode ? "bg-orange-950/40" : "bg-green-100";
      if (daySeconds > 3600) colorClass = isDarkMode ? "bg-orange-500/40" : "bg-green-300";
      if (daySeconds > 7200) colorClass = isDarkMode ? "bg-orange-500/70" : "bg-green-500";
      if (daySeconds > 10800) colorClass = isDarkMode ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]" : "bg-green-700";

      days.push(
        <div 
          key={i} 
          className={`w-3 h-3 md:w-4 md:h-4 rounded-[2px] ${colorClass} transition-all cursor-help hover:ring-2 ${isDarkMode ? "hover:ring-gray-400" : "hover:ring-gray-400"}`}
          title={`${d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}: ${formatHrsMins(daySeconds)}`}
        />
      );
    }

    return (
      <div className={`mt-6 border-t pt-5 animate-in fade-in zoom-in-95 transition-colors ${isDarkMode ? "border-white/[0.04]" : "border-gray-100"}`}>
        <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          <Activity size={14} className={isDarkMode ? "text-orange-500" : "text-blue-500"} /> Focus Intensity Map
        </h3>
        <div className={`flex flex-wrap gap-1 md:gap-1.5 p-4 rounded-xl overflow-y-auto max-h-[160px] custom-scrollbar shadow-sm transition-colors duration-300 border ${
          isDarkMode ? "bg-black border-white/[0.04] hover:bg-white/[0.02]" : "bg-white border-gray-200 hover:bg-gray-50"
        }`}>
          {days}
        </div>
        <div className="flex justify-end items-center gap-1.5 mt-3">
          <span className={`text-[10px] font-medium mr-1 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Less</span>
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isDarkMode ? "bg-black" : "bg-gray-100"}`}></div>
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isDarkMode ? "bg-orange-950/40" : "bg-green-100"}`}></div>
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isDarkMode ? "bg-orange-500/40" : "bg-green-300"}`}></div>
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isDarkMode ? "bg-orange-500/70" : "bg-green-500"}`}></div>
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isDarkMode ? "bg-orange-500" : "bg-green-700"}`}></div>
          <span className={`text-[10px] font-medium ml-1 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>More</span>
        </div>
      </div>
    );
  };

  const last3Sessions = useMemo(() => {
    return [...filteredSessions].sort((a,b) => b.startTime - a.startTime).slice(0, 3);
  }, [filteredSessions]);

  if (!isLoaded) {
    return (
      <div className={`flex justify-center items-center h-64 w-full max-w-[580px] rounded-2xl shadow-sm animate-pulse mb-4 md:mb-0 border transition-colors ${
        isDarkMode ? "bg-black border-white/[0.04] text-gray-500" : "bg-white border-gray-200 text-gray-400"
      }`}>
         <div className="text-sm font-bold flex items-center gap-2">
           <Activity size={18} className="animate-spin" />
           Loading Analytics...
         </div>
      </div>
    );
  }

  if (isLoaded && typedSessions.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 w-full max-w-[580px] rounded-2xl shadow-sm text-center mb-4 md:mb-0 transition-colors duration-300 border ${
        isDarkMode ? "bg-black border-white/[0.04] hover:bg-white/[0.02]" : "bg-white border-gray-200 hover:bg-gray-50"
      }`}>
        <Inbox size={48} className={`mx-auto mb-4 stroke-[1px] ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
        <h3 className={`text-lg font-bold transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>No Data Collected</h3>
        <p className={`text-sm mt-2 max-w-[300px] transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
          Metrics will appear here once you complete a focus session longer than 1 minute.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex justify-center lg:justify-end w-full font-sans transition-colors duration-300 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
      <div className={`p-6 rounded-2xl shadow-sm w-full max-w-[520px] xl:max-w-[580px] animate-in fade-in duration-300 mb-4 md:mb-0 border transition-colors ${
        isDarkMode ? "bg-black border-white/[0.04]" : "bg-white border-gray-200"
      }`}>
        
        {/* HEADER ARCHITECTURE */}
        <div className="space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h2 className={`text-sm font-semibold flex items-center gap-2 transition-colors ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                <Activity size={16} className={isDarkMode ? "text-orange-500" : "text-blue-500"} />
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
              <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                <Target size={12} /> Target: {Math.floor(dailyGoal / 3600)}h / day
              </div>
            </div>

            {/* DATE NAVIGATION */}
            <div className={`flex items-center rounded-lg w-fit border shrink-0 transition-colors ${isDarkMode ? "bg-black border-white/[0.04]" : "bg-gray-50 border-gray-200"}`}>
              <button onClick={() => shiftDate(-1)} className={`px-3 py-1.5 rounded-l-lg transition-colors active:scale-95 ${isDarkMode ? "text-gray-500 hover:bg-white/[0.04] hover:text-white" : "text-gray-500 hover:bg-gray-200 hover:text-gray-900"}`}>◀</button>
              <button onClick={jumpToToday} className={`px-3 py-1.5 text-xs font-bold transition-colors active:scale-95 border-x uppercase tracking-wider ${isDarkMode ? "text-gray-400 hover:bg-white/[0.04] hover:text-white border-white/[0.04]" : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-gray-200"}`}>Today</button>
              <button onClick={() => shiftDate(1)} className={`px-3 py-1.5 rounded-r-lg transition-colors active:scale-95 ${isDarkMode ? "text-gray-500 hover:bg-white/[0.04] hover:text-white" : "text-gray-500 hover:bg-gray-200 hover:text-gray-900"}`}>▶</button>
            </div>
          </div>

          <div className={`flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
            <div className="flex items-center gap-3">
              <span>
                {selectedRange === "today" ? "Live performance metrics" : selectedRange === "yesterday" ? "Past flow review" : "Macro behavioral trends"}
              </span>

              {selectedRange === "today" && yestTotalSessions > 0 && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${scoreDiff >= 0 ? (isDarkMode ? "bg-emerald-950/30 text-emerald-400" : "bg-green-100 text-green-700") : (isDarkMode ? "bg-red-950/30 text-red-400" : "bg-red-100 text-red-700")}`}>
                  <TrendingUp size={10} className={`inline mr-1 ${scoreDiff < 0 ? "rotate-180" : ""}`} />
                  vs Yest: <span className={`ml-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>{scoreDiff >= 0 ? "+" : ""}{scoreDiff}%</span>
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
          <div className={`flex gap-1 overflow-x-auto p-1 rounded-xl w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border transition-colors ${
            isDarkMode ? "bg-black border-white/[0.04]" : "bg-gray-50 border-gray-200"
          }`}>
            {(["today", "yesterday", "week", "month", "year", "custom"] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex-1 sm:flex-none text-center border ${
                  selectedRange === range
                    ? (isDarkMode ? "bg-white/[0.04] text-orange-400 border-white/[0.06] shadow-inner" : "bg-white text-blue-700 border-gray-200 shadow-sm")
                    : (isDarkMode ? "text-gray-500 border-transparent hover:text-white hover:bg-white/[0.02]" : "text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-200/50")
                }`}
              >
                {range === "week" ? "7 Days" : range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* WEEKLY CHART */}
        {selectedRange === "week" && (
          <div className={`mt-8 mb-4 transition-all duration-300 p-4 -mx-4 rounded-2xl ${isDarkMode ? "hover:bg-white/[0.02]" : "hover:bg-gray-50"}`}>
            <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              <Activity size={14} className={isDarkMode ? "text-orange-500" : "text-blue-500"} /> Weekly Quality Breakdown
            </h3>
            <div className={`relative flex items-end justify-between h-36 gap-2 w-full pt-6 border-b transition-colors ${isDarkMode ? "border-white/[0.04]" : "border-gray-200"}`}>
               <div className={`absolute inset-0 flex flex-col justify-between text-[10px] font-medium pb-6 pointer-events-none z-0 transition-colors ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
                  <div className={`w-full border-b border-dashed flex items-center justify-end pr-1 h-0 transition-colors ${isDarkMode ? "border-white/[0.04]" : "border-gray-200"}`}><span className={`-translate-y-1/2 pl-2 transition-colors ${isDarkMode ? "bg-black" : "bg-white"}`}>100%</span></div>
                  <div className={`w-full border-b border-dashed flex items-center justify-end pr-1 h-0 transition-colors ${isDarkMode ? "border-white/[0.04]" : "border-gray-200"}`}><span className={`-translate-y-1/2 pl-2 transition-colors ${isDarkMode ? "bg-black" : "bg-white"}`}>50%</span></div>
                  <div className="w-full flex items-center justify-end pr-1 h-0"><span className={`-translate-y-1/2 pl-2 transition-colors ${isDarkMode ? "bg-black" : "bg-white"}`}>0%</span></div>
               </div>
               
               <div className="relative z-10 flex items-end justify-between w-full h-full pb-6 px-1 lg:px-4">
                 {weeklyData.data.map((day, i) => {
                   const barColor = day.dayScore >= 80 ? 'bg-green-500' : day.dayScore >= 50 ? (isDarkMode ? 'bg-orange-500' : 'bg-blue-500') : 'bg-red-500';
                   const isBestDay = weeklyData.bestDayObj.date === day.dateStr && day.dayScore > 0;
                   return (
                     <div key={i} className="flex flex-col items-center flex-1 group relative h-full justify-end cursor-crosshair">
                       {isBestDay && (
                         <span className={`text-[10px] absolute -top-5 font-bold whitespace-nowrap transition-colors ${isDarkMode ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "text-purple-600"}`}>Best Day</span>
                       )}
                       <div className={`opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none z-20 transition-colors ${
                         isDarkMode ? "bg-black border border-white/[0.04] text-white" : "bg-gray-900 text-white"
                       }`}>
                         {day.dayScore}% • {formatHrsMins(day.dayTime)}
                       </div>
                       <div className="w-full px-1 flex items-end h-full">
                         <div 
                           className={`w-full rounded-t-md shadow-sm transition-all duration-300 origin-bottom group-hover:scale-105 ${day.dayScore === 0 ? (isDarkMode ? 'bg-black min-h-[4px]' : 'bg-gray-100 min-h-[4px]') : barColor}`}
                           style={{ height: `${Math.max(2, day.dayScore)}%` }}
                         />
                       </div>
                       <span className={`text-[10px] font-semibold mt-2 absolute -bottom-6 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>{day.dayName}</span>
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
            <div className={`border rounded-2xl p-5 shadow-sm relative overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-black border-white/[0.04]" : "bg-white border-gray-200"}`}>
              
              {/* Overlay for Paused State */}
              {isPaused && (
                <div className={`absolute inset-0 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-2xl transition-colors ${isDarkMode ? "bg-black/60" : "bg-white/60"}`}>
                  <span className={`text-xs font-semibold flex items-center gap-2 transition-colors ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    <Pause size={14} className={isDarkMode ? "text-yellow-500" : "text-yellow-600"} /> Monitoring Paused
                  </span>
                </div>
              )}

              <div className="flex justify-between items-start mb-3">
                <div className={`text-[10px] uppercase font-bold flex items-center gap-1.5 transition-colors ${isPaused ? (isDarkMode ? 'text-gray-500' : 'text-gray-400') : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                  <Activity size={14} className={isPaused ? (isDarkMode ? "text-gray-600" : "text-gray-300") : (isDarkMode ? "text-orange-500 transition-opacity duration-1000" : "text-blue-500 transition-opacity duration-1000")} /> 
                  {isPaused ? "Monitoring Paused" : "Live Focus Signal"}
                </div>
                {recentDistraction && !isPaused && (
                  <span className={`text-[10px] font-bold animate-pulse transition-colors ${isDarkMode ? "text-red-400" : "text-red-500"}`}>
                    ⚠ Distraction detected
                  </span>
                )}
              </div>

              <div className={`relative flex items-end gap-[2px] px-[2px] h-20 w-full z-10 border-b transition-colors ${isPaused ? "opacity-60" : ""} ${isDarkMode ? "border-white/[0.04]" : "border-gray-100"}`}>
                {currentSession?.distractions?.map((d: DistractionEvent, idx: number) => {
                  const ageSeconds = (Date.now() - d.timestamp) / 1000;
                  if (ageSeconds > 40) return null;
                  const rightPct = (ageSeconds / 40) * 100;
                  return (
                    <div
                      key={idx}
                      className={`absolute bottom-0 w-[2px] h-full opacity-40 z-0 transition-colors ${isDarkMode ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-red-400"}`}
                      style={{ right: `${rightPct}%` }}
                    />
                  );
                })}

                {focusSignal.map((val, i) => {
                  const isGreen = val > 70;
                  const isBlueOrOrange = val > 40 && val <= 70;
                  const isYellow = val > 20 && val <= 40;
                  
                  const colorClass = isGreen ? "bg-green-500" : isBlueOrOrange ? (isDarkMode ? "bg-orange-500" : "bg-blue-500") : isYellow ? (isDarkMode ? "bg-yellow-500" : "bg-orange-400") : "bg-red-500";
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
                    currentSignal > 70 ? (isDarkMode ? "text-green-400" : "text-green-600") :
                    currentSignal > 40 ? (isDarkMode ? "text-orange-400" : "text-blue-600") :
                    currentSignal > 20 ? (isDarkMode ? "text-yellow-400" : "text-orange-500") : (isDarkMode ? "text-red-400" : "text-red-600")
                  }>
                    {currentSignal > 70 ? "Locked In" :
                     currentSignal > 40 ? "On Track" :
                     currentSignal > 20 ? "Drifting" : "Broken Focus"}
                  </span>
                  
                  {!isPaused && (
                    <span className={`text-[10px] font-medium transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                      {trend > 0 ? "↑ Improving" : trend < 0 ? "↓ Dropping" : "→ Stable"}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[9px] uppercase tracking-wider transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Live Monitoring</span>
                  <span className={`text-[8px] transition-colors ${isDarkMode ? "text-gray-600" : "text-gray-300"}`}>Approximate signal</span>
                </div>
              </div>
              <div className={`text-[9px] mt-1.5 transition-colors ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
                Based on activity + interruptions
              </div>
            </div>
          )}

          {/* 🥇 LEVEL 1: HERO METRIC */}
          <div className={`transition-all duration-300 border p-6 rounded-2xl shadow-sm relative overflow-hidden ${
            isDarkMode ? "bg-black hover:bg-white/[0.02] border-white/[0.04]" : "bg-white hover:bg-gray-50 border-gray-200"
          }`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider flex justify-between items-center transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
              <span>{selectedRange} Focus Time</span>
              {flowRatio > 0 && <span className={`flex items-center gap-1 transition-colors ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}><Zap size={12}/> {flowRatio}% Flow</span>}
            </div>
            
            <div className={`text-5xl sm:text-6xl font-[520] tracking-[-0.03em] mt-2 transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {formatHrsMins(totalFocusSeconds)}
            </div>
            
            <div className={`text-xs mt-2 font-medium flex items-center gap-1.5 transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              <Clock size={12} className={isDarkMode ? "text-orange-500" : "text-blue-500"} /> Extra: <span className={`font-bold transition-colors ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>+{formatHrsMins(totalExtraSeconds)}</span>
            </div>

            <div className={`text-[11px] mt-1 font-bold uppercase tracking-wider transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              Total Execution: {formatHrsMins(totalActualFocus)}
            </div>
            
            <div className={`mt-5 h-2 rounded-full overflow-hidden transition-colors ${isDarkMode ? "bg-white/[0.03]" : "bg-gray-100"}`}>
              <div 
                className={`h-full transition-all duration-1000 ease-out ${
                  goalProgress >= 100
                    ? (isDarkMode ? "bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]" : "bg-purple-500")
                    : (isDarkMode ? "bg-gradient-to-r from-gray-700 to-orange-500" : "bg-gradient-to-r from-blue-500 to-green-500")
                }`}
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-3 text-[11px] font-bold">
              <span className={goalProgress >= 100 ? (isDarkMode ? "text-purple-400" : "text-purple-600") : goalProgress >= 50 ? (isDarkMode ? "text-orange-400" : "text-blue-600") : (isDarkMode ? "text-gray-500" : "text-gray-500")}>
                {Math.round(goalProgress)}% achieved
              </span>
              <span className={`transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                {formatHrsMins(goalTarget)} Target
              </span>
            </div>
          </div>

          <div className={`md:hidden ${showMobileDetails ? 'hidden' : 'block'}`}>
             <button 
                className={`w-full text-center text-xs font-semibold py-3 border rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  isDarkMode ? "bg-black hover:bg-white/[0.02] border-white/[0.04] text-gray-400" : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600"
                }`}
                onClick={() => setShowMobileDetails(true)}
              >
                View deeper insights <ChevronRight size={14} />
              </button>
          </div>

          {/* 🥈 LEVEL 2: SECONDARY METRICS */}
          <div className={`grid grid-cols-2 md:grid-cols-2 gap-4 ${showMobileDetails ? 'block' : 'hidden md:grid'}`}>
            
            <div className={`p-5 transition-all duration-300 border rounded-2xl shadow-sm flex flex-col justify-center items-center text-center ${
              isDarkMode ? "bg-black hover:bg-white/[0.02] border-white/[0.04]" : "bg-white hover:bg-gray-50 border-gray-200"
            }`}>
              <div 
                className="relative w-20 h-20 mx-auto flex-shrink-0 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(${avgScore >= 80 ? '#22c55e' : avgScore >= 50 ? '#3b82f6' : '#ef4444'} ${avgScore}%, rgba(156,163,175,0.2) ${avgScore}%)` 
                }}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center absolute transition-colors ${isDarkMode ? "bg-black" : "bg-white"}`}>
                  <span className={`text-base font-bold transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>{avgScore}%</span>
                </div>
              </div>
              <div className={`text-[10px] font-bold uppercase tracking-wider mt-4 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Avg Quality</div>
            </div>

            <div className={`p-5 transition-all duration-300 border rounded-2xl shadow-sm flex flex-col justify-center ${
              isDarkMode ? "bg-black hover:bg-white/[0.02] border-white/[0.04]" : "bg-white hover:bg-gray-50 border-gray-200"
            }`}>
              <div className={`flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                <span>Sessions</span>
                <span>Breaks</span>
              </div>
              <div className="flex justify-between items-center px-2 mt-2">
                <div className="flex items-center gap-2">
                  <Activity size={16} className={isDarkMode ? "text-orange-500" : "text-blue-500"} />
                  <span className={`text-3xl font-bold transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>{totalSessions}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  <span className={`text-3xl font-bold transition-colors ${isDarkMode ? "text-red-400" : "text-red-500"}`}>{totalDistractions}</span>
                </div>
              </div>
              <div className={`mt-4 text-[9px] text-center uppercase tracking-wider font-semibold border-t pt-3 transition-colors ${isDarkMode ? "text-gray-500 border-white/[0.04]" : "text-gray-400 border-gray-100"}`}>
                Work vs Interruptions
              </div>
            </div>
          </div>

          {/* NEW CHARTS GRID */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 ${showMobileDetails ? 'block' : 'hidden md:grid'}`}>
            
            <div className={`transition-all duration-300 border rounded-2xl p-5 shadow-sm flex flex-col justify-center ${
              isDarkMode ? "bg-black hover:bg-white/[0.02] border-white/[0.04]" : "bg-white hover:bg-gray-50 border-gray-200"
            }`}>
              <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                <Activity size={14} className={isDarkMode ? "text-orange-500" : "text-blue-500"} /> Focus vs Distractions
              </h3>

              <div className="flex flex-col gap-3 mt-1">
                <div>
                  <div className={`flex justify-between text-[10px] mb-1.5 font-semibold transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    <span>Focus Time</span>
                    <span className={`font-bold transition-colors ${isDarkMode ? "text-orange-400" : "text-blue-600"}`}>{formatHrsMins(totalFocusSeconds)}</span>
                  </div>
                  <div className={`h-2.5 rounded-full overflow-hidden shadow-inner transition-colors ${isDarkMode ? "bg-white/[0.03]" : "bg-gray-100"}`}>
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${isDarkMode ? "bg-orange-500" : "bg-blue-500"}`}
                      style={{ width: `${totalFocusSeconds === 0 ? 0 : (totalFocusSeconds / Math.max(1, totalFocusSeconds + totalDistractions * 60)) * 100}%` }} 
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <div className={`flex justify-between text-[10px] mb-1.5 font-semibold transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    <span>Interruptions</span>
                    <span className={`font-bold transition-colors ${isDarkMode ? "text-red-400" : "text-red-500"}`}>{totalDistractions}</span>
                  </div>
                  <div className={`h-2.5 rounded-full overflow-hidden shadow-inner transition-colors ${isDarkMode ? "bg-white/[0.03]" : "bg-gray-100"}`}>
                    <div
                      className={`h-full bg-red-500 transition-all duration-500 rounded-full ${isDarkMode ? "shadow-[0_0_8px_rgba(239,68,68,0.5)]" : ""}`}
                      style={{ width: `${totalFocusSeconds === 0 && totalDistractions === 0 ? 0 : ((totalDistractions * 60) / Math.max(1, totalFocusSeconds + totalDistractions * 60)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={`transition-all duration-300 border rounded-2xl p-5 shadow-sm flex flex-col justify-center ${
              isDarkMode ? "bg-black hover:bg-white/[0.02] border-white/[0.04]" : "bg-white hover:bg-gray-50 border-gray-200"
            }`}>
              <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                <Clock size={14} className={isDarkMode ? "text-purple-400" : "text-purple-600"} /> Session Trend
              </h3>

              <div className="flex items-end gap-3 h-[72px] mt-2">
                {last3Sessions.length > 0 ? last3Sessions.slice().reverse().map((s, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-crosshair">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 shadow-sm ${isDarkMode ? "bg-purple-500 group-hover:bg-purple-400" : "bg-blue-500 group-hover:bg-blue-400"}`}
                      style={{
                        height: `${Math.max(5, Math.min(100, (s.durationSeconds / 3600) * 100))}%`
                      }}
                    />
                    <span className={`text-[10px] font-bold mt-2 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                      {formatHrsMins(s.durationSeconds)}
                    </span>
                  </div>
                )) : (
                  <div className={`w-full h-full flex items-center justify-center text-[10px] font-medium transition-colors ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>No recent sessions</div>
                )}
              </div>
            </div>

          </div>

          <div className={`${showMobileDetails ? 'block' : 'hidden md:block'}`}>
            {generateHeatmap()}
          </div>
        </div>

        {/* 🧠 LEVEL 3: INTELLIGENCE PANEL */}
        <div className={`mt-6 transition-all duration-300 p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-6 ${
          isDarkMode ? "bg-black hover:bg-white/[0.02] border-white/[0.04]" : "bg-white hover:bg-gray-50 border-gray-200"
        }`}>
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {isInFlow && (
                <div className={`text-[10px] font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5 transition-colors ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>
                  <Zap size={12} /> Flow State Active
                </div>
              )}
              <div className={`text-sm font-bold mb-2 transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>{insight.summary}</div>
              <div className={`text-xs font-medium mb-4 md:mb-0 leading-relaxed transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                <span className={`transition-colors ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>Analysis:</span> {insight.issue}
              </div>
              
              <button
                onClick={handleQuickAction}
                className={`mt-4 px-4 py-2 w-fit text-sm font-semibold rounded-lg transition-colors border ${
                  isDarkMode ? "bg-orange-950/30 border-orange-900/50 text-orange-400 hover:border-orange-500 hover:bg-orange-900/40" : "bg-white border-gray-200 text-gray-900 hover:border-blue-500 hover:text-blue-600"
                }`}
              >
                {insight.actionText}
              </button>
            </div>
            
            <div className={`mt-auto pt-5 border-t flex flex-col gap-3 transition-colors ${isDarkMode ? "border-white/[0.04]" : "border-gray-100"}`}>

              <span className={`text-[10px] uppercase tracking-wider font-bold transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                Focus DNA
              </span>

              <div className="grid grid-cols-2 gap-3 text-[11px]">

                <div className={`border rounded-lg p-2 transition-colors ${isDarkMode ? "bg-black border-white/[0.04]" : "bg-gray-50 border-gray-200"}`}>
                  <div className={`text-[9px] uppercase transition-colors ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>Pattern</div>
                  <div className={`font-bold transition-colors ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>
                    {flowRatio > 30 ? "Deep Flow Builder" :
                     totalDistractions > 5 ? "Interrupt Driven" :
                     "Structured Executor"}
                  </div>
                </div>

                <div className={`border rounded-lg p-2 transition-colors ${isDarkMode ? "bg-black border-white/[0.04]" : "bg-gray-50 border-gray-200"}`}>
                  <div className={`text-[9px] uppercase transition-colors ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>Energy</div>
                  <div className={`font-bold transition-colors ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>
                    {avgScore >= 80 ? "High Stability" :
                     avgScore >= 50 ? "Moderate" :
                     "Unstable"}
                  </div>
                </div>

                <div className={`border rounded-lg p-2 transition-colors ${isDarkMode ? "bg-black border-white/[0.04]" : "bg-gray-50 border-gray-200"}`}>
                  <div className={`text-[9px] uppercase transition-colors ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>Flow Behavior</div>
                  <div className={`font-bold transition-colors ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>
                    {totalExtraSeconds > 0 ? "Extends Sessions" : "Stops on Timer"}
                  </div>
                </div>

                <div className={`border rounded-lg p-2 transition-colors ${isDarkMode ? "bg-black border-white/[0.04]" : "bg-gray-50 border-gray-200"}`}>
                  <div className={`text-[9px] uppercase transition-colors ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>Risk</div>
                  <div className={`font-bold transition-colors ${isDarkMode ? "text-red-400" : "text-red-500"}`}>
                    {topIssue !== "None" ? topIssue : "Low"}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className={`${showMobileDetails ? 'block' : 'hidden'} md:block md:w-[40%] md:border-l md:pl-6 mt-4 md:mt-0 transition-colors ${isDarkMode ? "border-white/[0.04]" : "border-gray-100"}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              <Target size={14} className={isDarkMode ? "text-gray-600" : "text-gray-400"} /> Pattern Preview
            </div>
            {last3Sessions.length === 0 ? (
              <div className={`text-xs italic transition-colors ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>No history to analyze.</div>
            ) : (
              <div className="space-y-4">
                {last3Sessions.map((s, i) => {
                  const barColor = s.score >= 80 ? 'bg-green-500' : s.score >= 50 ? (isDarkMode ? 'bg-orange-500' : 'bg-blue-500') : 'bg-red-500';
                  const textColor = s.score >= 80 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : s.score >= 50 ? (isDarkMode ? 'text-orange-400' : 'text-blue-600') : (isDarkMode ? 'text-red-400' : 'text-red-600');
                  return (
                    <div key={i} className="flex justify-between items-center text-[11px]">
                      <span className={`font-bold whitespace-nowrap min-w-[32px] transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {formatHrsMins(s.durationSeconds + (s.extraDuration || 0))}
                      </span>
                      <div className={`flex-1 mx-3 h-1.5 rounded-full overflow-hidden shadow-inner transition-colors ${isDarkMode ? "bg-white/[0.03]" : "bg-gray-100"}`}>
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
            className={`md:hidden w-full text-center text-xs font-semibold py-3 mt-4 border rounded-xl transition-colors shadow-sm ${
              isDarkMode ? "text-gray-500 border-white/[0.04] hover:bg-white/[0.02]" : "text-gray-500 border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => setShowMobileDetails(false)}
          >
            Hide extra insights
          </button>
        )}

      </div>
    </div>
  );
}