"use client";

import React from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

export default function HeaderControls({ system }: any) {
  const {
    selectedDate,
    actualToday,
    setSelectedDate,
    changeDate,
  } = system;

  const { isDarkMode } = useTheme();

  // Safe Local Date Parsing
  const [year, month, day] = (
    selectedDate ||
    actualToday ||
    ""
  )
    .split("-")
    .map(Number);

  const dateObj = new Date(year, month - 1, day);

  const formattedDate = dateObj.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const isToday = selectedDate === actualToday;

  const btnClass = `flex items-center justify-center h-11 w-11 rounded-2xl border transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
    isDarkMode
      ? "bg-black border-white/[0.08] text-zinc-400 hover:bg-white/[0.03] hover:text-white"
      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
  }`;

  return (
    <header
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b ${
        isDarkMode
          ? "border-white/[0.08]"
          : "border-gray-100"
      }`}
    >
      {/* LEFT */}
      <div className="flex items-start gap-4">
        <div
          className={`mt-1 shrink-0 ${
            isDarkMode
              ? "text-orange-400"
              : "text-orange-600"
          }`}
        >
          <BookOpen size={22} />
        </div>

        <div className="min-w-0">
          <h1
            className={`text-[24px] font-black tracking-tight leading-none ${
              isDarkMode
                ? "text-white"
                : "text-gray-900"
            }`}
          >
            Diary
          </h1>

          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <p
              className={`text-[14px] font-semibold ${
                isDarkMode
                  ? "text-zinc-300"
                  : "text-gray-700"
              }`}
            >
              {formattedDate}
            </p>

            <span
              className={`hidden sm:inline ${
                isDarkMode
                  ? "text-zinc-700"
                  : "text-gray-300"
              }`}
            >
              •
            </span>

            <p
              className={`text-[13px] font-medium ${
                isDarkMode
                  ? "text-zinc-500"
                  : "text-gray-500"
              }`}
            >
              Understand the day before tomorrow begins.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          onClick={() => changeDate(-1)}
          className={btnClass}
          title="Previous Day"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={() => setSelectedDate(actualToday)}
          disabled={isToday}
          className={`flex items-center justify-center gap-2 flex-1 sm:flex-none h-11 px-5 rounded-2xl border text-[11px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            isToday
              ? isDarkMode
                ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                : "bg-orange-50 border-orange-100 text-orange-500"
              : isDarkMode
              ? "bg-black border-white/[0.08] text-zinc-300 hover:bg-white/[0.03] hover:text-orange-400"
              : "bg-white border-gray-200 text-gray-700 hover:text-orange-600"
          }`}
        >
          <Calendar size={14} />
          Today
        </button>

        <button
          onClick={() => changeDate(1)}
          disabled={isToday}
          className={btnClass}
          title="Next Day"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </header>
  );
}