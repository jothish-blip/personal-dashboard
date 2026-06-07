"use client";

import React from "react";
import {
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
    allEntries = {}
  } = system;

  const { isDarkMode } = useTheme();

  // Safe Local Date Parsing
  const [year, month, day] = (selectedDate || actualToday || "").split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);

  const [tYear, tMonth, tDay] = (actualToday || "").split("-").map(Number);
  const todayObj = new Date(tYear, tMonth - 1, tDay);

  // Calculate Difference in Days
  const diffTime = dateObj.getTime() - todayObj.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  const formattedDate = dateObj.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const isToday = diffDays === 0;

  // --- DAY CONTEXT ---
  let dayContext = "Today";
  if (diffDays === -1) dayContext = "Yesterday";
  else if (diffDays < -1) dayContext = `${Math.abs(diffDays)} Days Ago`;
  else if (diffDays === 1) dayContext = "Tomorrow";
  else if (diffDays > 1) dayContext = `In ${diffDays} Days`;

  // --- ENTRY STATUS & PROGRESS ---
  const entry = allEntries[selectedDate] || {};
  const sections = ['morning', 'afternoon', 'evening', 'learning', 'tomorrow'];
  const completedCount = sections.filter(s => entry[s] && entry[s].trim().length > 0).length;

  let statusText = "Empty";
  let statusIcon = "○";
  let statusColor = isDarkMode ? "text-zinc-500" : "text-gray-400";
  
  if (completedCount > 0) {
    if (diffDays < 0 || entry.isLocked) {
      statusText = "Finalized";
      statusIcon = "✓";
      statusColor = "text-emerald-500";
    } else {
      statusText = "In Progress";
      statusIcon = "📝";
      statusColor = "text-orange-500";
    }
  }

  // --- DYNAMIC SUBTITLE ---
  let subtitle = "Look back before moving forward.";
  if (isToday) subtitle = "Today is still being written.";
  else if (completedCount > 0) subtitle = "A completed chapter.";
  else if (diffDays < 0) subtitle = "An unwritten page from the past.";

  // --- STYLING HELPERS ---
  const textMain = isDarkMode ? "text-white" : "text-gray-900";
  const textSub = isDarkMode ? "text-zinc-400" : "text-gray-500";
  const textMuted = isDarkMode ? "text-zinc-600" : "text-gray-400";

  const btnClass = `flex items-center justify-center h-11 w-11 rounded-2xl border transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
    isDarkMode
      ? "bg-black border-white/[0.08] text-zinc-400 hover:bg-white/[0.03] hover:text-white"
      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
  }`;

  return (
    <header className="flex flex-col gap-6 mb-8 mt-2">
      
      {/* TOP: Context & Status */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        <div className="flex flex-col gap-3">
          {/* Day Hero */}
          <div>
            <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${textMuted}`}>
              {dayContext}
            </div>
            <h1 className={`text-3xl sm:text-4xl font-black tracking-tight leading-none ${textMain}`}>
              {formattedDate}
            </h1>
          </div>

          {/* Status Badge & Count */}
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <div className={`flex items-center gap-1.5 text-sm font-bold ${statusColor}`}>
              <span className="text-lg leading-none">{statusIcon}</span>
              <span className="uppercase tracking-wider text-[11px] mt-0.5">{statusText}</span>
            </div>
            
            {completedCount > 0 && (
              <>
                <span className={textMuted}>•</span>
                <span className={`text-xs font-medium ${textSub}`}>
                  {completedCount} of 5 sections completed
                </span>
              </>
            )}
          </div>

          {/* Dynamic Subtitle */}
          <p className={`text-sm font-medium mt-1 ${textSub}`}>
            {subtitle}
          </p>
        </div>

        {/* BOTTOM / RIGHT: Navigation */}
        <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
          <button
            onClick={() => changeDate(-1)}
            className={btnClass}
            title="Previous Day"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => setSelectedDate(actualToday)}
            disabled={isToday}
            className={`flex items-center justify-center gap-2 flex-1 md:flex-none h-11 px-6 rounded-2xl border text-xs font-bold uppercase tracking-widest transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
              isToday
                ? isDarkMode
                  ? "bg-white/[0.02] border-white/[0.05] text-zinc-600"
                  : "bg-gray-50 border-gray-100 text-gray-400"
                : isDarkMode
                ? "bg-black border-white/[0.08] text-zinc-300 hover:bg-white/[0.03] hover:text-orange-400"
                : "bg-white border-gray-200 text-gray-700 hover:text-orange-600"
            }`}
          >
            <Calendar size={14} />
            {isToday ? "Today" : "Return to Today"}
          </button>

          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className={btnClass}
            title="Next Day"
          >
            <ChevronRight size={18} />
          </button>
        </div>

      </div>
    </header>
  );
}