"use client";

import { useState, useMemo } from "react";
import { Clock, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Task, Meta } from "../types/index";

import {
  FilterType,
  getLocalDate,
  getISODay,
  FilteredData,
} from "./utils";

import FilterBar from "./components/FilterBar/FilterBar";
import ChartsGrid from "./components/ChartsGrid/ChartsGrid";

type ExtendedFilteredData = Omit<FilteredData, "stats"> & {
  dailyDeltas: number[];
  deltaTrend: number[];
  netPerformance: number;
  stats: FilteredData["stats"] & {
    consistencyDelta: number;
    activeDelta: number;
    avgDelta: number;
  };
};

export default function AnalyticsView({
  tasks,
  meta,
}: {
  tasks: Task[];
  meta: Meta;
}) {
  const actualToday = getLocalDate(new Date());

  const [filterType, setFilterType] = useState<FilterType>("month");
  const [selectedMonth, setSelectedMonth] = useState(meta.currentMonth);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [targetGoal, setTargetGoal] = useState<number>(100);

  const filteredData = useMemo<ExtendedFilteredData>(() => {
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
      rangeDates.reduce(
        (acc, date) => acc + (task.history?.[date] ? 1 : 0),
        0
      )
    );

    let timelineLabels: string[] = [];
    let volumeData: number[] = [];

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const weekdayMisses = Array(7).fill(0);
    const weekdayTotals = Array(7).fill(0);

    let zeroCount = 0;

    const consistencyTrend: number[] = [];
    const weeklyPerformance: Record<string, number> = {};
    const dailyDeltas: number[] = [];

    rangeDates.forEach((dateStr) => {
      const date = new Date(dateStr);
      let dailyCount = 0;

      tasks.forEach((task) => {
        if (task.history?.[dateStr]) dailyCount++;
      });

      if (dailyCount === 0) zeroCount++;

      const prevDate = new Date(dateStr);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevStr = getLocalDate(prevDate);
      const prevCount = tasks.filter((task) => task.history?.[prevStr]).length;

      dailyDeltas.push(dailyCount - prevCount);

      const firstDayOfMonth = new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      ).getDay();

      const weekNum = Math.ceil((date.getDate() + firstDayOfMonth) / 7);
      const weekLabel = `W${weekNum} ${monthNames[date.getMonth()]}`;

      weeklyPerformance[weekLabel] =
        (weeklyPerformance[weekLabel] || 0) + dailyCount;

      consistencyTrend.push(
        tasks.length === 0 ? 0 : (dailyCount / tasks.length) * 100
      );

      const isoDay = getISODay(date) - 1;
      weekdayTotals[isoDay] += tasks.length;
      weekdayMisses[isoDay] += tasks.length - dailyCount;
    });

    const netPerformance = dailyDeltas.reduce((acc, delta) => acc + delta, 0);

    if (filterType === "month") {
      timelineLabels = rangeDates.map((date) => date.slice(8));
      volumeData = rangeDates.map(
        (date) => tasks.filter((task) => task.history?.[date]).length
      );
    } else if (filterType === "year") {
      const monthlyMap: Record<string, number> = {};

      rangeDates.forEach((date) => {
        const monthIndex = new Date(date).getMonth();
        const monthKey = monthNames[monthIndex];
        const count = tasks.filter((task) => task.history?.[date]).length;

        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + count;
      });

      timelineLabels = monthNames;
      volumeData = monthNames.map((month) => monthlyMap[month] || 0);
    } else if (rangeDates.length > 30) {
      timelineLabels = Object.keys(weeklyPerformance);
      volumeData = Object.values(weeklyPerformance);
    } else {
      timelineLabels = rangeDates.map((date) => date.slice(5));
      volumeData = rangeDates.map(
        (date) => tasks.filter((task) => task.history?.[date]).length
      );
    }

    const totalCompletions = taskTotals.reduce((a, b) => a + b, 0);
    const delta = totalCompletions - prevTotalCompletions;

    const peakVolume = Math.max(...(volumeData.length ? volumeData : [0]));
    const peakIndex = volumeData.indexOf(peakVolume);
    const peakLabel = timelineLabels[peakIndex] || "";
    const peakText = filterType === "year" ? `in ${peakLabel}` : `on ${peakLabel}`;

    const totalPossible = rangeDates.length * (tasks.length || 1);
    const consistencyPercent =
      totalPossible === 0
        ? 0
        : Math.round((totalCompletions / totalPossible) * 100);

    const activeDays = rangeDates.filter((date) =>
      tasks.some((task) => task.history?.[date])
    ).length;

    const avgPerDay =
      activeDays === 0
        ? 0
        : Math.round((totalCompletions / activeDays) * 10) / 10;

    const prevActiveDays = prevRangeDates.filter((date) =>
      tasks.some((task) => task.history?.[date])
    ).length;

    const prevAvgPerDay =
      prevActiveDays === 0
        ? 0
        : Math.round((prevTotalCompletions / prevActiveDays) * 10) / 10;

    const prevTotalPossible = prevRangeDates.length * (tasks.length || 1);

    const prevConsistencyPercent =
      prevTotalPossible === 0
        ? 0
        : Math.round((prevTotalCompletions / prevTotalPossible) * 100);

    const consistencyDelta = consistencyPercent - prevConsistencyPercent;
    const activeDelta = activeDays - prevActiveDays;
    const avgDelta = Math.round((avgPerDay - prevAvgPerDay) * 10) / 10;

    let worstDayIdx = 0;
    let worstMissRate = 0;

    weekdayTotals.forEach((total, index) => {
      if (total > 0) {
        const missRate = weekdayMisses[index] / total;

        if (missRate > worstMissRate) {
          worstMissRate = missRate;
          worstDayIdx = index;
        }
      }
    });

    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const worstDayInsight =
      worstMissRate > 0.4
        ? `Slip pattern on ${dayNames[worstDayIdx]}s (${Math.round(
            worstMissRate * 100
          )}% miss rate)`
        : "Execution is evenly distributed";

    let cumulative = 0;

    const cumulativeActual = volumeData.map((value) => {
      cumulative += value;
      return cumulative;
    });

    const cumulativeTarget = volumeData.map((_, index) =>
      Math.round((targetGoal / volumeData.length) * (index + 1))
    );

    return {
      labels: tasks.map((task) => task.name),
      taskTotals,
      volumeData,
      timelineLabels,
      consistencyTrend,
      weeklyPerformance: {
        labels: Object.keys(weeklyPerformance),
        values: Object.values(weeklyPerformance),
      },
      cumulativeActual,
      cumulativeTarget,
      dailyDeltas,
      deltaTrend: dailyDeltas,
      netPerformance,
      stats: {
        totalCompletions,
        delta,
        activeDays,
        peakVolume,
        peakText,
        consistencyPercent,
        avgPerDay,
        worstDayInsight,
        zeroDays: zeroCount,
        consistencyDelta,
        activeDelta,
        avgDelta,
      },
    } as ExtendedFilteredData;
  }, [
    tasks,
    filterType,
    selectedMonth,
    selectedYear,
    customRange,
    targetGoal,
  ]);

  const momentum = useMemo(() => {
    if (!tasks.length) return 0;

    const todayCount = tasks.filter(
      (task) => task.history?.[actualToday]
    ).length;

    const date = new Date(actualToday);
    date.setDate(date.getDate() - 1);

    const yesterday = getLocalDate(date);
    const yesterdayCount = tasks.filter(
      (task) => task.history?.[yesterday]
    ).length;

    return todayCount - yesterdayCount;
  }, [tasks, actualToday]);

  const systemStatus = useMemo(() => {
    if (momentum < 0) return "Degrading";
    if (momentum > 0) return "Improving";
    return "Stable";
  }, [momentum]);

  const anomaly = useMemo(() => {
    const recentDrop =
      filteredData.dailyDeltas.length >= 3 &&
      filteredData.dailyDeltas.slice(-3).every((delta) => delta < 0);

    if (recentDrop) return "3-day performance drop detected.";
    if (filteredData.stats.zeroDays >= 3) {
      return "Multiple inactivity days detected.";
    }
    if (momentum < 0) return "Recent performance decline.";

    return null;
  }, [filteredData.dailyDeltas, filteredData.stats.zeroDays, momentum]);

  const statusConfig = {
    Improving: {
      label: "System Improving",
      icon: TrendingUp,
      dot: "bg-emerald-500",
      text: "text-emerald-500",
      badge:
        "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    Degrading: {
      label: "System Dropping",
      icon: TrendingDown,
      dot: "bg-rose-500",
      text: "text-rose-500",
      badge: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    },
    Stable: {
      label: "System Stable",
      icon: Minus,
      dot: "bg-[var(--muted-foreground)]",
      text: "text-[var(--muted-foreground)]",
      badge:
        "bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] text-[var(--muted-foreground)] border-[var(--border)]",
    },
  }[systemStatus];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 transition-colors duration-300">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 pb-24">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-all duration-300 hover:-translate-y-[2px]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full shadow-sm ${statusConfig.dot}`} />

              <div>
                <div className="flex items-center gap-2">
                  <StatusIcon size={15} className={statusConfig.text} />
                  <span className="text-sm font-semibold">
                    {statusConfig.label}
                  </span>
                </div>

                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Momentum is based on today compared with yesterday.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusConfig.badge}`}
              >
                Net:{" "}
                {filteredData.netPerformance > 0
                  ? `+${filteredData.netPerformance}`
                  : filteredData.netPerformance}
              </div>

              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <Clock size={13} />
                Updated just now
              </div>
            </div>
          </div>
        </div>

        {anomaly && (
          <div className="rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-semibold text-rose-500 shadow-sm transition-all duration-300 hover:-translate-y-[2px]">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} />
              <span>{anomaly}</span>
            </div>
          </div>
        )}

        <FilterBar
          filterType={filterType}
          setFilterType={setFilterType}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          customRange={customRange}
          setCustomRange={setCustomRange}
        />

        <ChartsGrid
          data={filteredData}
          targetGoal={targetGoal}
          setTargetGoal={setTargetGoal}
        />
      </div>
    </div>
  );
}