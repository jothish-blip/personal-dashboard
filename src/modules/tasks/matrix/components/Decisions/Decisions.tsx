"use client";

import React, { useMemo } from "react";
import {
  Flame,
  Target,
  PieChart,
  Lock,
  Unlock,
  Focus,
} from "lucide-react";
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
  lockedDates: string[];
  isFocusMode: boolean;
}

export default function Decisions({
  tasks = [],
  currentStreak = 0,
  lockedDates = [],
  isFocusMode = false,
}: DecisionsProps) {
  const { isDarkMode } = useTheme();

  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const todayStr = today.toISOString().split("T")[0];

  const insights = useMemo(() => {
    const totalTasks = tasks.length;

    const completedToday = tasks.filter(
      (task) => task.history?.[todayStr]
    ).length;

    const remainingTasks = Math.max(
      0,
      totalTasks - completedToday
    );

    const progressPct =
      totalTasks > 0
        ? Math.min(
            (completedToday / totalTasks) * 100,
            100
          )
        : 0;

    const isLocked =
      lockedDates.includes(todayStr);

    return {
      totalTasks,
      completedToday,
      remainingTasks,
      progressPct,
      isLocked,
    };
  }, [tasks, todayStr, lockedDates]);

  const cardClass = `
    rounded-[20px]
    border
    p-5
    transition-all
    duration-300
    min-h-[120px]
    ${
      isDarkMode
        ? "bg-[#111111] border-gray-800 hover:border-gray-700"
        : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
    }
  `;

  return (
    <div className="flex flex-col gap-4">

      {/* MAIN CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

        {/* ACTIVE STREAK */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-orange-500">
            <Flame size={12} />
            Active Streak
          </div>

          <div className="mt-4">
            <h2
              className={`text-2xl font-bold ${
                isDarkMode
                  ? "text-white"
                  : "text-gray-900"
              }`}
            >
              {currentStreak}{" "}
              {currentStreak === 1
                ? "Day"
                : "Days"}
            </h2>

            <p
              className={`text-xs mt-1 ${
                isDarkMode
                  ? "text-gray-500"
                  : "text-gray-500"
              }`}
            >
              {currentStreak === 0
                ? "Start today"
                : "Tasks completed continuously"}
            </p>
          </div>
        </div>

        {/* COMPLETION RATE */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-blue-500">
            <Target size={12} />
            Completion Rate
          </div>

          <div className="mt-4">
            <h2
              className={`text-2xl font-bold ${
                isDarkMode
                  ? "text-white"
                  : "text-gray-900"
              }`}
            >
              {Math.round(insights.progressPct)}%
            </h2>

            <p
              className={`text-xs mt-1 ${
                isDarkMode
                  ? "text-gray-500"
                  : "text-gray-500"
              }`}
            >
              {insights.totalTasks === 0
                ? "No tasks available"
                : `${insights.completedToday} of ${insights.totalTasks} completed`}
            </p>

            {insights.totalTasks > 0 && (
              <div
                className={`w-full h-2 rounded-full overflow-hidden mt-4 ${
                  isDarkMode
                    ? "bg-gray-800"
                    : "bg-gray-100"
                }`}
              >
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${insights.progressPct}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* TODAY */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-emerald-500">
            <PieChart size={12} />
            Today
          </div>

          <div className="mt-4">
            <h2
              className={`text-2xl font-bold ${
                isDarkMode
                  ? "text-white"
                  : "text-gray-900"
              }`}
            >
              {insights.completedToday}/
              {insights.totalTasks}
            </h2>

            <p
              className={`text-xs mt-1 ${
                isDarkMode
                  ? "text-gray-500"
                  : "text-gray-500"
              }`}
            >
              {insights.remainingTasks === 0
                ? "All tasks completed"
                : `${insights.remainingTasks} remaining`}
            </p>

            {insights.totalTasks > 0 && (
              <div
                className={`w-full h-2 rounded-full overflow-hidden mt-4 ${
                  isDarkMode
                    ? "bg-gray-800"
                    : "bg-gray-100"
                }`}
              >
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${insights.progressPct}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MICRO PILLS */}
      <div className="flex flex-wrap gap-2">

        <div
          className={`px-3 py-1.5 rounded-full text-xs border flex items-center gap-1 ${
            isDarkMode
              ? "bg-[#111111] border-gray-800 text-gray-400"
              : "bg-gray-100 text-gray-700 border-transparent"
          }`}
        >
          {insights.isLocked ? (
            <>
              <Lock size={12} />
              Finalized
            </>
          ) : (
            <>
              <Unlock size={12} />
              Still Active
            </>
          )}
        </div>

        {isFocusMode && (
          <div
            className={`px-3 py-1.5 rounded-full text-xs border flex items-center gap-1 ${
              isDarkMode
                ? "bg-purple-900/20 border-purple-800 text-purple-400"
                : "bg-purple-100 text-purple-700 border-transparent"
            }`}
          >
            <Focus size={12} />
            Focus ON
          </div>
        )}
      </div>
    </div>
  );
}