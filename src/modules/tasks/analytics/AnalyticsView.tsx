"use client";

import { useState, useMemo, useEffect } from "react";
import { Task, Meta } from "../types/index";
import { useTheme } from "@/theme/ThemeProvider";

import {
  FilterType,
  getLocalDate,
  getISODay,
  FilteredData,
} from "./utils";

import ChartsGrid from "./components/ChartsGrid/ChartsGrid";

export type ExtendedFilteredData = Omit<FilteredData, "stats"> & {
  dailyDeltas: number[];
  quadrantData: { x: number; y: number; label: string; color: string }[];
  bubbleData: { x: number; y: number; r: number; label: string; color: string }[];
  histogramData: { labels: number[]; values: number[] };
  nexspace: {
    executionDna: { labels: string[]; data: number[] };
    focusDrift: { current: number[]; previous: number[]; labels: string[] };
    deepWorkScore: number;
    trajectory: "Accelerating" | "Stable" | "Declining";
    topDNA: string;
  };
  dopamine: {
    level: number;
    levelProgress: number;
    allTimeCompletions: number;
    milestones: { threshold: number; reached: boolean }[];
    monthlyBattle: { current: number; previous: number };
    streakCalendar: { day: string; active: boolean }[];
    records: {
      bestDay: { date: string; count: number };
      longestStreak: number;
      highestMomentum: number;
      bestMonth: { label: string; count: number };
    };
  };
  stats: FilteredData["stats"] & {
    consistencyDelta: number;
    activeDelta: number;
    avgDelta: number;
    completionPercentChange: number;
    currentStreak: number;
    bestDayInsight: string;
    topTaskName: string;
    projectedTotal: number;
    paceStatus: string;
  };
};

export default function AnalyticsView({
  tasks,
  meta,
}: {
  tasks: Task[];
  meta: Meta;
}) {
  const { isDarkMode } = useTheme();
  const actualToday = getLocalDate(new Date());

  const [filterType, setFilterType] = useState<FilterType>("month");
  const [selectedMonth, setSelectedMonth] = useState(
    meta.currentMonth || getLocalDate(new Date()).slice(0, 7)
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [targetGoal, setTargetGoal] = useState<number>(100);
  
  // Production Loading State
  const [isLoading, setIsLoading] = useState(true);

  // Trigger skeleton loading on filter changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600); // 600ms simulated load for visual polish
    return () => clearTimeout(timer);
  }, [filterType, selectedMonth, selectedYear, customRange]);

  const filteredData = useMemo<ExtendedFilteredData>(() => {
    // --- GLOBAL DOPAMINE STATS ---
    const globalHistory: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.history) {
        Object.keys(t.history).forEach(d => {
          if (t.history[d]) globalHistory[d] = (globalHistory[d] || 0) + 1;
        });
      }
    });

    const sortedDates = Object.keys(globalHistory).sort();
    let allTimeCompletions = 0;
    let longestStreak = 0;
    let currentGlobalStreak = 0;
    let bestDayCount = 0;
    let bestDayDate = "";
    let highestMomentum = 0;
    const monthlyCounts: Record<string, number> = {};

    let prevCount = 0;
    let lastDateObj: Date | null = null;

    sortedDates.forEach(dateStr => {
      const count = globalHistory[dateStr];
      allTimeCompletions += count;

      if (count > bestDayCount) {
        bestDayCount = count;
        bestDayDate = dateStr;
      }

      const monthLabel = dateStr.slice(0, 7);
      monthlyCounts[monthLabel] = (monthlyCounts[monthLabel] || 0) + count;

      const currDateObj = new Date(dateStr);
      if (lastDateObj) {
        const diff = (currDateObj.getTime() - lastDateObj.getTime()) / 86400000;
        if (diff === 1 && count > 0) {
          currentGlobalStreak++;
        } else if (count > 0) {
          currentGlobalStreak = 1;
        } else {
          currentGlobalStreak = 0;
        }
      } else if (count > 0) {
        currentGlobalStreak = 1;
      }
      if (currentGlobalStreak > longestStreak) longestStreak = currentGlobalStreak;

      const momentum = count - prevCount;
      if (momentum > highestMomentum) highestMomentum = momentum;

      prevCount = count;
      lastDateObj = currDateObj;
    });

    let bestMonthLabel = "";
    let bestMonthCount = 0;
    Object.entries(monthlyCounts).forEach(([m, c]) => {
      if (c > bestMonthCount) {
        bestMonthCount = c;
        bestMonthLabel = m;
      }
    });

    const level = Math.floor(allTimeCompletions / 100) + 1;
    const levelProgress = allTimeCompletions % 100;
    const milestones = [50, 100, 250, 500, 1000].map(t => ({ threshold: t, reached: allTimeCompletions >= t }));

    const currentMonthPrefix = actualToday.slice(0, 7);
    const prevMonthDateObj = new Date(actualToday);
    prevMonthDateObj.setMonth(prevMonthDateObj.getMonth() - 1);
    const prevMonthPrefix = getLocalDate(prevMonthDateObj).slice(0, 7);

    const monthlyBattle = {
      current: monthlyCounts[currentMonthPrefix] || 0,
      previous: monthlyCounts[prevMonthPrefix] || 0
    };

    const streakCalendar = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      const dateStr = getLocalDate(d);
      return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' })[0],
        active: !!globalHistory[dateStr]
      };
    });

    // --- FILTERED TIME RANGE ---
    let start: Date;
    let end: Date;
    let prevStart: Date;
    let prevEnd: Date;

    if (filterType === "month") {
      const [y, m] = selectedMonth.split("-").map(Number);
      start = new Date(y, m - 1, 1);
      end = new Date(y, m, 0);
      prevStart = new Date(y, m - 2, 1);
      prevEnd = new Date(y, m - 1, 0);
    } else if (filterType === "year") {
      const y = parseInt(selectedYear);
      start = new Date(y, 0, 1);
      end = new Date(y, 11, 31);
      prevStart = new Date(y - 1, 0, 1);
      prevEnd = new Date(y - 1, 11, 31);
    } else {
      start = customRange.start ? new Date(customRange.start) : new Date();
      end = customRange.end ? new Date(customRange.end) : new Date();
      const duration = end.getTime() - start.getTime();
      prevStart = new Date(start.getTime() - duration - 86400000);
      prevEnd = new Date(start.getTime() - 86400000);
    }

    const rangeDates: string[] = [];
    const curr = new Date(start);
    while (curr <= end) {
      rangeDates.push(getLocalDate(curr));
      curr.setDate(curr.getDate() + 1);
    }

    const prevRangeDates: string[] = [];
    const pCurr = new Date(prevStart);
    while (pCurr <= prevEnd) {
      prevRangeDates.push(getLocalDate(pCurr));
      pCurr.setDate(pCurr.getDate() + 1);
    }

    let prevTotalCompletions = 0;
    tasks.forEach((task) => {
      prevRangeDates.forEach((date) => {
        if (task.history?.[date]) prevTotalCompletions++;
      });
    });

    const taskTotals = tasks.map((task) =>
      rangeDates.reduce((acc, date) => acc + (task.history?.[date] ? 1 : 0), 0)
    );
    
    const prevTaskTotals = tasks.map((task) =>
      prevRangeDates.reduce((acc, date) => acc + (task.history?.[date] ? 1 : 0), 0)
    );

    let timelineLabels: string[] = [];
    let volumeData: number[] = [];
    const dailyDeltas: number[] = [];
    const histogramCounts: Record<number, number> = {};

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const weekdayTotals = Array(7).fill(0);
    let totalCompletions = 0;
    let activeDays = 0;

    let currentStreak = 0;
    let tempStreak = 0;
    let maxDailyCount = 0;
    let rollingMomentum = 0;

    rangeDates.forEach((dateStr) => {
      const date = new Date(dateStr);
      let dailyCount = 0;

      tasks.forEach((task) => {
        if (task.history?.[dateStr]) dailyCount++;
      });

      if (dailyCount > maxDailyCount) maxDailyCount = dailyCount;

      histogramCounts[dailyCount] = (histogramCounts[dailyCount] || 0) + 1;

      totalCompletions += dailyCount;
      if (dailyCount > 0) activeDays++;

      const prevDateObjRange = new Date(dateStr);
      prevDateObjRange.setDate(prevDateObjRange.getDate() - 1);
      const prevCountRange = tasks.filter((task) => task.history?.[getLocalDate(prevDateObjRange)]).length;
      const delta = dailyCount - prevCountRange;
      dailyDeltas.push(delta);
      rollingMomentum += delta;

      const isoDay = getISODay(date) - 1;
      weekdayTotals[isoDay] += dailyCount;

      if (dateStr <= actualToday) {
        if (dailyCount > 0) tempStreak++;
        else tempStreak = 0;
        currentStreak = tempStreak;
      }
    });

    // --- TRUE NEXSPACE LIFE OPERATING SYSTEM METRICS ---
    // Genuine behavioral execution mapping based on user history vs keywords.
    let builderScore = 0, operatorScore = 0, learnerScore = 0, explorerScore = 0, finisherScore = 0;
    
    tasks.forEach((t, i) => {
      const name = t.name.toLowerCase();
      const completions = taskTotals[i];
      if (completions === 0) return;

      const active = rangeDates.filter(d => t.history?.[d]).length;
      const consistency = active / Math.max(1, rangeDates.length);

      if (/(build|create|make|design|setup|start|new|code|dev|write)/.test(name)) {
        builderScore += completions;
      } else if (/(learn|read|study|course|tutorial|watch|book|class)/.test(name)) {
        learnerScore += completions;
      } else if (consistency >= 0.6) {
        operatorScore += completions; // Highly consistent daily routine
      } else if (consistency >= 0.25) {
        finisherScore += completions; // Moderate volume, gets done
      } else {
        explorerScore += completions; // Sporadic / one-off tasks
      }
    });

    const dnaData = [builderScore, operatorScore, learnerScore, explorerScore, finisherScore];
    const dnaLabels = ["Builder", "Operator", "Learner", "Explorer", "Finisher"];
    const totalDna = Math.max(dnaData.reduce((a, b) => a + b, 0), 1);
    const dnaPercentages = dnaData.map(v => Math.round((v / totalDna) * 100));
    const topDnaIndex = dnaData.indexOf(Math.max(...dnaData));
    
    const trajectory = rollingMomentum > 5 ? "Accelerating" : rollingMomentum < -5 ? "Declining" : "Stable";
    const totalPossible = rangeDates.length * (tasks.length || 1);
    const consistencyPercent = totalPossible === 0 ? 0 : Math.round((totalCompletions / totalPossible) * 100);
    const deepWorkScore = Math.min(100, Math.round(consistencyPercent * 0.6 + (currentStreak * 2) + (rollingMomentum > 0 ? 10 : 0)));

    const top5Tasks = tasks.map((t, i) => ({ name: t.name, current: taskTotals[i], prev: prevTaskTotals[i] }))
      .sort((a, b) => b.current - a.current).slice(0, 5);

    const nexspace = {
      executionDna: { labels: dnaLabels, data: dnaPercentages },
      focusDrift: { 
        labels: top5Tasks.map(t => t.name), 
        current: top5Tasks.map(t => t.current), 
        previous: top5Tasks.map(t => t.prev) 
      },
      deepWorkScore,
      trajectory: trajectory as "Accelerating" | "Stable" | "Declining",
      topDNA: totalDna > 1 ? dnaLabels[topDnaIndex] : "Novice"
    };

    const histMaxCompletions = Math.max(...Object.keys(histogramCounts).map(Number), 0);
    const histLabels = Array.from({ length: histMaxCompletions + 1 }, (_, i) => i);
    const histValues = histLabels.map(i => histogramCounts[i] || 0);

    let topTaskName = "None";
    let topTaskCount = -1;
    taskTotals.forEach((total, i) => {
      if (total > topTaskCount) {
        topTaskCount = total;
        topTaskName = tasks[i].name;
      }
    });

    const dynamicColors = tasks.map((_, i) => `hsl(${(i * 137.5) % 360}, 70%, 60%)`);
    const maxTaskVolume = Math.max(...taskTotals, 1);
    
    const quadrantData = tasks.map((task, i) => {
      const activeDaysForTask = rangeDates.filter(d => task.history?.[d]).length;
      return { x: activeDaysForTask, y: taskTotals[i], label: task.name, color: dynamicColors[i] };
    });

    const bubbleData = tasks.map((task, i) => {
      const activeDaysForTask = rangeDates.filter(d => task.history?.[d]).length;
      const consistency = rangeDates.length > 0 ? (activeDaysForTask / rangeDates.length) * 100 : 0;
      const radius = Math.max(5, (taskTotals[i] / maxTaskVolume) * 20);
      return { x: consistency, y: taskTotals[i], r: radius, label: task.name, color: dynamicColors[i] };
    });

    const daysPassed = rangeDates.filter(d => d <= actualToday).length;
    const avgPerDayPassed = daysPassed > 0 ? totalCompletions / daysPassed : 0;
    const projectedTotal = Math.round(avgPerDayPassed * rangeDates.length);
    const expectedPace = Math.round((targetGoal / rangeDates.length) * daysPassed);
    
    let paceStatus = "On track";
    let completionPercentChange = 0;
    if (totalCompletions > expectedPace) {
      completionPercentChange = Math.round(((totalCompletions - expectedPace) / Math.max(expectedPace, 1)) * 100);
      paceStatus = `+${completionPercentChange}% Ahead`;
    } else if (totalCompletions < expectedPace) {
      completionPercentChange = -Math.round(((expectedPace - totalCompletions) / Math.max(expectedPace, 1)) * 100);
      paceStatus = `${completionPercentChange}% Behind`;
    }

    if (filterType === "month" || rangeDates.length <= 31) {
      timelineLabels = rangeDates.map((date) => date.slice(8));
      volumeData = rangeDates.map((date) => tasks.filter((t) => t.history?.[date]).length);
    } else if (filterType === "year") {
      const monthlyMap: Record<string, number> = {};
      rangeDates.forEach((date) => {
        const mKey = monthNames[new Date(date).getMonth()];
        monthlyMap[mKey] = (monthlyMap[mKey] || 0) + tasks.filter((t) => t.history?.[date]).length;
      });
      timelineLabels = monthNames;
      volumeData = monthNames.map((m) => monthlyMap[m] || 0);
    } else {
      timelineLabels = rangeDates.map((date) => date.slice(5));
      volumeData = rangeDates.map((date) => tasks.filter((t) => t.history?.[date]).length);
    }

    const delta = totalCompletions - prevTotalCompletions;
    const avgPerDay = activeDays === 0 ? 0 : Math.round((totalCompletions / activeDays) * 10) / 10;
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const bestDayIdx = weekdayTotals.indexOf(Math.max(...weekdayTotals));
    const bestDayInsight = Math.max(...weekdayTotals) > 0 ? `${dayNames[bestDayIdx]}s are your strongest` : "Not enough data";

    let cumulative = 0;
    const cumulativeActual = volumeData.map((value) => {
      cumulative += value;
      return cumulative;
    });

    return {
      labels: tasks.map((task) => task.name),
      taskTotals,
      volumeData,
      timelineLabels,
      cumulativeActual,
      dailyDeltas,
      quadrantData,
      bubbleData,
      histogramData: { labels: histLabels, values: histValues },
      nexspace,
      dopamine: {
        level,
        levelProgress,
        allTimeCompletions,
        milestones,
        monthlyBattle,
        streakCalendar,
        records: {
          bestDay: { date: bestDayDate, count: bestDayCount },
          longestStreak,
          highestMomentum,
          bestMonth: { label: bestMonthLabel, count: bestMonthCount }
        }
      },
      stats: {
        totalCompletions,
        delta,
        activeDays,
        consistencyPercent,
        avgPerDay,
        bestDayInsight,
        completionPercentChange, // Reused for Pace status math here
        currentStreak,
        topTaskName,
        projectedTotal,
        paceStatus,
      },
    } as ExtendedFilteredData;
  }, [
    tasks, filterType, selectedMonth, selectedYear, customRange, targetGoal, actualToday
  ]);

  const textPrimaryClass = isDarkMode ? "text-white" : "text-slate-900";
  const textMutedClass = isDarkMode ? "text-white/55" : "text-slate-500";

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 transition-colors duration-300 font-sans">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 md:gap-6 pb-24">
        
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className={`flex items-center gap-1 overflow-x-auto p-1 rounded-xl border hide-scrollbar transition-all ${
            isDarkMode ? "bg-black/[0.65] border-white/[0.04] backdrop-blur-[20px]" : "bg-white/[0.75] border-black/[0.04] backdrop-blur-[20px]"
          }`}>
            {["month", "year", "custom"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as FilterType)}
                className={`flex-1 md:flex-none whitespace-nowrap px-4 py-1.5 text-sm font-medium capitalize transition-all duration-200 ${
                  filterType === type 
                    ? "bg-orange-500 text-white shadow-[0_8px_24px_rgba(249,115,22,0.24)] rounded-[0.9rem]" 
                    : (isDarkMode ? "text-white/52 hover:text-white hover:bg-white/[0.04] rounded-[0.9rem]" : "text-slate-500 hover:text-slate-900 hover:bg-black/[0.03] rounded-[0.9rem]")
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {filterType === "month" && (
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium outline-none ${isDarkMode ? "bg-white/[0.03] border-white/[0.04]" : "bg-white/[0.72] border-black/[0.05]"}`} />
            )}
            {filterType === "year" && (
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium outline-none ${isDarkMode ? "bg-white/[0.03] border-white/[0.04]" : "bg-white/[0.72] border-black/[0.05]"}`}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = (new Date().getFullYear() - i).toString();
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            )}
          </div>
        </div>

        {/* Hero Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {isLoading ? (
            Array.from({length: 4}).map((_, i) => (
              <div key={i} className={`h-[110px] rounded-[1.4rem] animate-pulse ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
            ))
          ) : (
            <>
              <div className={`p-5 rounded-[1.4rem] border transition-transform hover:-translate-y-1 ${isDarkMode ? "bg-white/[0.02] border-white/[0.04]" : "bg-black/[0.02] border-black/[0.04]"}`}>
                <p className={`text-xs font-medium mb-1 ${textMutedClass}`}>Completions</p>
                <h2 className={`text-3xl font-semibold tracking-tight ${textPrimaryClass}`}>{filteredData.stats.totalCompletions}</h2>
                <p className={`text-xs mt-2 font-medium ${filteredData.stats.completionPercentChange >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {filteredData.stats.paceStatus} Goal
                </p>
              </div>
              <div className={`p-5 rounded-[1.4rem] border transition-transform hover:-translate-y-1 ${isDarkMode ? "bg-white/[0.02] border-white/[0.04]" : "bg-black/[0.02] border-black/[0.04]"}`}>
                <p className={`text-xs font-medium mb-1 ${textMutedClass}`}>Consistency</p>
                <h2 className={`text-3xl font-semibold tracking-tight ${textPrimaryClass}`}>{filteredData.stats.consistencyPercent}%</h2>
                <p className={`text-xs mt-2 ${textMutedClass}`}>Volume across targets</p>
              </div>
              <div className={`p-5 rounded-[1.4rem] border transition-transform hover:-translate-y-1 ${isDarkMode ? "bg-white/[0.02] border-white/[0.04]" : "bg-black/[0.02] border-black/[0.04]"}`}>
                <p className={`text-xs font-medium mb-1 ${textMutedClass}`}>Current Streak</p>
                <h2 className={`text-3xl font-semibold tracking-tight ${textPrimaryClass}`}>{filteredData.stats.currentStreak} <span className="text-xl opacity-50">Days</span></h2>
                <p className={`text-xs mt-2 ${textMutedClass}`}>Unbroken execution</p>
              </div>
              <div className={`p-5 rounded-[1.4rem] border transition-transform hover:-translate-y-1 ${isDarkMode ? "bg-white/[0.02] border-white/[0.04]" : "bg-black/[0.02] border-black/[0.04]"}`}>
                <p className={`text-xs font-medium mb-1 ${textMutedClass}`}>Active Days</p>
                <h2 className={`text-3xl font-semibold tracking-tight ${textPrimaryClass}`}>{filteredData.stats.activeDays}</h2>
                <p className={`text-xs mt-2 ${textMutedClass}`}>Days with &gt; 0 actions</p>
              </div>
            </>
          )}
        </div>

        <ChartsGrid
          data={filteredData}
          targetGoal={targetGoal}
          setTargetGoal={setTargetGoal}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}