"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

interface Task {
  id: string;
  name: string;
  group: string;
  history: Record<string, boolean>;
}

interface DecisionsProps {
  tasks: Task[];
  currentStreak: number;
}

export default function Decisions({
  tasks = [],
  currentStreak = 0,
}: DecisionsProps) {
  const { isDarkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const getLocalDate = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  };

  const todayStr = getLocalDate(0);

  const insights = useMemo(() => {
    const totalTasks = tasks.length;
    let completedToday = 0;

    // 1. Next Push & Streak
    tasks.forEach((task) => {
      if (task.history?.[todayStr]) completedToday++;
    });
    const remainingTasks = Math.max(0, totalTasks - completedToday);
    const isStreakSafe = remainingTasks === 0 && totalTasks > 0;

    // 2. Momentum & Perfect Days
    let thisWeek = 0;
    let lastWeek = 0;
    let perfectDays = 0;
    const recentPerfects: boolean[] = [];

    for (let i = 13; i >= 0; i--) {
      const dateStr = getLocalDate(i);
      let dayCompleted = 0;

      tasks.forEach((t) => {
        if (t.history?.[dateStr]) dayCompleted++;
      });

      if (i < 7) {
        thisWeek += dayCompleted;
      } else {
        lastWeek += dayCompleted;
      }

      const isPerfect = dayCompleted === totalTasks && totalTasks > 0;
      if (isPerfect) perfectDays++;

      if (i < 3) {
        recentPerfects.push(isPerfect);
      }
    }

    const momentumPct =
      lastWeek === 0
        ? thisWeek > 0
          ? 100
          : 0
        : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

    // 3. Category Stats
    const stats: Record<string, { possible: number; done: number }> = {};
    tasks.forEach((task) => {
      const g = task.group || "GENERAL";
      if (!stats[g]) stats[g] = { possible: 0, done: 0 };

      for (let i = 0; i < 14; i++) {
        const dStr = getLocalDate(i);
        stats[g].possible++;
        if (task.history?.[dStr]) stats[g].done++;
      }
    });

    const groups = Object.entries(stats)
      .map(([name, data]) => ({
        name,
        pct: data.possible === 0 ? 0 : Math.round((data.done / data.possible) * 100),
      }))
      .sort((a, b) => b.pct - a.pct);

    const bestGroup = groups.length > 0 ? groups[0] : null;
    const weakGroup =
      groups.length > 1 && groups[groups.length - 1].pct < 50
        ? groups[groups.length - 1]
        : null;

    return {
      totalTasks,
      remainingTasks,
      isStreakSafe,
      momentumPct,
      perfectDays,
      recentPerfects,
      bestGroup,
      weakGroup,
    };
  }, [tasks, todayStr]);

  // Premium UI Variables
  const textPrimary = isDarkMode ? "text-white/90" : "text-slate-800";
  const textMuted = isDarkMode ? "text-white/40" : "text-slate-400";
  const borderSubtle = isDarkMode ? "border-white/[0.04]" : "border-black/[0.04]";

  const cardClass = `
    relative flex flex-col justify-center shrink-0
    min-w-[150px] md:min-w-0 h-[86px] md:min-h-[96px] snap-start
    rounded-[1.5rem] md:rounded-[1.7rem] border px-[16px] md:px-[18px] overflow-hidden
    transform-gpu will-change-transform transition-transform duration-[200ms] ease-out
    hover:scale-[1.015] cursor-default
    ${
      isDarkMode
        ? "bg-white/[0.025] border-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
        : "bg-black/[0.015] border-black/[0.04] shadow-sm"
    }
  `;

  // Dynamic Summary Text for the Tray
  const summaryText = [
    insights.remainingTasks === 0 ? "All clear" : `${insights.remainingTasks} left`,
    insights.isStreakSafe ? "streak safe" : "streak at risk",
    insights.momentumPct !== 0 ? `${insights.momentumPct > 0 ? "+" : ""}${insights.momentumPct}%` : null
  ].filter(Boolean).join(" · ");

  return (
    <div className="w-full flex flex-col items-center">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ✦ Smart Insights Collapsed Tray */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full max-w-[500px] mx-auto flex items-center justify-between px-4 py-2.5 rounded-[1.2rem] border transition-all duration-200 group ${
          isDarkMode
            ? "border-white/[0.06] hover:bg-white/[0.03] text-white/70"
            : "border-black/[0.06] hover:bg-black/[0.02] text-slate-600"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-amber-500/80 text-[14px]">✦</span>
          <span className="text-[13px] md:text-[12px] font-medium tracking-wide flex gap-2">
            Smart Insights
            <span className={`opacity-60 font-normal ${textMuted} hidden sm:inline-block`}>
              {summaryText}
            </span>
          </span>
        </div>
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)] opacity-50 group-hover:opacity-100 ${
            isExpanded ? "-rotate-180" : "rotate-0"
          }`} 
        />
      </button>
      
      <span className={`sm:hidden mt-2 text-[11px] opacity-60 font-normal tracking-wide ${textMuted} ${isExpanded ? 'hidden' : 'block'}`}>
        {summaryText}
      </span>

      {/* Expanded Premium Cards Area */}
      <div
        className={`w-full grid transition-[grid-template-rows,opacity,margin] duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isExpanded ? "grid-rows-[1fr] opacity-100 mt-4 md:mt-5" : "grid-rows-[0fr] opacity-0 mt-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex overflow-x-auto md:grid md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 snap-x pb-2 pt-1 scrollbar-hide">
            
            {/* 1. Next Push */}
            <div className={cardClass}>
              <div className="flex-1 flex flex-col justify-center leading-tight relative z-10">
                <span className={`text-[1.1rem] md:text-[1.15rem] tracking-tight font-medium ${textPrimary}`}>
                  {insights.remainingTasks === 0 ? "All done" : `${insights.remainingTasks} left`}
                </span>
                <span className={`text-[12px] md:text-[13px] mt-0.5 font-normal ${textMuted}`}>
                  {insights.remainingTasks === 0 ? "For today" : "Finish today"}
                </span>
              </div>
              <div className="absolute bottom-[14px] left-[16px] right-[16px] flex gap-[3px] h-[3px] opacity-70">
                {tasks.map((t, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full ${
                      t.history?.[todayStr]
                        ? "bg-blue-500"
                        : isDarkMode
                        ? "bg-white/[0.08]"
                        : "bg-black/[0.08]"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 2. Streak */}
            <div className={cardClass}>
              <div
                className={`absolute -top-4 -right-4 w-16 h-16 rounded-full blur-[18px] opacity-25 ${
                  insights.isStreakSafe ? "bg-emerald-500" : "bg-orange-500"
                }`}
              />
              <div className="relative z-10 flex flex-col justify-center leading-tight">
                <span className={`text-[1.1rem] md:text-[1.15rem] tracking-tight font-medium ${textPrimary}`}>
                  {insights.isStreakSafe ? "🔥 Streak safe" : "🔥 At risk"}
                </span>
                <span className={`text-[12px] md:text-[13px] mt-0.5 font-normal ${textMuted}`}>
                  {insights.isStreakSafe ? `${currentStreak} days protected` : "1 task saves it"}
                </span>
              </div>
            </div>

            {/* 3. Strongest Category */}
            <div className={cardClass}>
              <div className="flex-1 flex flex-col justify-center leading-tight">
                <span className={`text-[1.1rem] md:text-[1.15rem] tracking-tight font-medium uppercase truncate ${textPrimary}`}>
                  {insights.bestGroup ? `${insights.bestGroup.name} strongest` : "Balanced"}
                </span>
                <span className={`text-[12px] md:text-[13px] mt-0.5 font-normal ${textMuted}`}>
                  {insights.bestGroup ? `${insights.bestGroup.pct}% completion` : "No clear lead"}
                </span>
              </div>
              <div className="absolute bottom-[14px] left-[16px] right-[16px] h-[3px] rounded-full overflow-hidden bg-white/5 dark:bg-black/5">
                <div
                  className="h-full bg-slate-400 dark:bg-slate-500 rounded-full"
                  style={{ width: `${insights.bestGroup?.pct || 0}%` }}
                />
              </div>
            </div>

            {/* 4. Weak Zone (Conditional) */}
            {insights.weakGroup && (
              <div className={cardClass}>
                <div className="flex flex-col justify-center leading-tight">
                  <span className="text-[1.1rem] md:text-[1.15rem] tracking-tight font-medium uppercase truncate text-amber-600 dark:text-amber-500/90">
                    {insights.weakGroup.name} slipping
                  </span>
                  <span className={`text-[12px] md:text-[13px] mt-0.5 font-normal ${textMuted}`}>
                    Needs attention
                  </span>
                </div>
              </div>
            )}

            {/* 5. Momentum */}
            <div className={cardClass}>
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col justify-center leading-tight">
                  <span className={`text-[1.1rem] md:text-[1.15rem] tracking-tight font-medium ${textPrimary}`}>
                    {insights.momentumPct > 0 ? "+" : ""}
                    {insights.momentumPct}%
                  </span>
                  <span className={`text-[12px] md:text-[13px] mt-0.5 font-normal ${textMuted}`}>
                    Better than last week
                  </span>
                </div>
                {insights.momentumPct >= 0 ? (
                  <ArrowUpRight size={18} strokeWidth={2.5} className="text-slate-400 dark:text-slate-500" />
                ) : (
                  <ArrowDownRight size={18} strokeWidth={2.5} className="text-slate-400 dark:text-slate-500" />
                )}
              </div>
            </div>

            {/* 6. Perfect Days */}
            <div className={cardClass}>
              <div className="flex flex-col justify-center leading-tight">
                <span className={`text-[1.1rem] md:text-[1.15rem] tracking-tight font-medium ${textPrimary}`}>
                  ✨ {insights.perfectDays} perfect
                </span>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={`text-[12px] md:text-[13px] font-normal ${textMuted}`}>
                    days
                  </span>
                  <div className="flex gap-[4px] mt-[1px]">
                    {insights.recentPerfects.map((isPerfect, i) => (
                      <div
                        key={i}
                        className={`w-[5px] h-[5px] rounded-full ${
                          isPerfect
                            ? "bg-slate-400 dark:bg-slate-300 shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                            : isDarkMode
                            ? "bg-white/10"
                            : "bg-black/10"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}