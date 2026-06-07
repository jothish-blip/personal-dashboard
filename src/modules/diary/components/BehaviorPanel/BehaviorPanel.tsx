"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
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

  // Day calculations
  const diffTime = dateObj.getTime() - todayObj.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
  const isToday = diffDays === 0;

  const formattedDate = dateObj.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Dynamic Day Context Label
  let dayContext = "Today";
  if (diffDays === -1) dayContext = "Yesterday";
  else if (diffDays < -1) dayContext = `${Math.abs(diffDays)} Days Ago`;
  else if (diffDays === 1) dayContext = "Tomorrow";
  else if (diffDays > 1) dayContext = `In ${diffDays} Days`;

  // True 9-Section Alignment Core Check
  const entry = allEntries[selectedDate] || {};
  const coreFields = [
    "mood", "energy", "sleep", "biggestWin", "friction", 
    "lesson", "tomorrowFocus", "afternoonStory", "eveningReflection"
  ];
  const completedCount = coreFields.filter(field => entry[field] && entry[field].toString().trim().length > 0).length;

  // Exact Logic Driven Status
  let statusText = "Empty";
  let statusIcon = "○";
  let statusColor = isDarkMode ? "text-zinc-500" : "text-gray-400";

  if (entry.isLocked) {
    statusText = "Finalized";
    statusIcon = "🔒";
    statusColor = "text-emerald-500";
  } else if (completedCount > 0) {
    statusText = "Draft";
    statusIcon = "📝";
    statusColor = "text-orange-500";
  }

  // Pure Data-Driven Subtitle
  let subtitle = "No reflection recorded.";
  if (entry.isLocked) {
    const lockDate = entry.lockedAt ? new Date(entry.lockedAt) : dateObj;
    subtitle = `Finalized on ${lockDate.toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })}.`;
  } else if (entry.lastEdited) {
    subtitle = `Last edited ${entry.lastEdited}.`;
  } else if (completedCount > 0) {
    subtitle = "Changes saved as draft.";
  }

  const btnClass = `flex items-center justify-center h-11 w-11 rounded-2xl border transition-all duration-200 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed ${
    isDarkMode
      ? "bg-black border-white/[0.08] text-zinc-400 hover:bg-white/[0.03] hover:text-white"
      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
  }`;

  return (
    <header className="flex flex-col gap-6 mb-10 mt-2 text-left">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        {/* Left Side: Context & Core Identification */}
        <div className="flex flex-col gap-2">
          <div>
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
              {dayContext}
            </div>
            <h1 className={`text-3xl font-black tracking-tight leading-none ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {formattedDate}
            </h1>
          </div>

          {/* Clean Status & Action Subtitles */}
          <div className="flex items-center gap-3 mt-1 text-xs">
            <div className={`flex items-center gap-1.5 font-bold ${statusColor}`}>
              <span>{statusIcon}</span>
              <span className="uppercase tracking-wider text-[10px]">{statusText}</span>
            </div>
            <span className={isDarkMode ? "text-zinc-800" : "text-gray-200"}>•</span>
            <p className={`font-medium ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Strict Block Navigation */}
        <div className="flex items-center gap-2 w-full md:w-auto">
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
                  ? "bg-white/[0.02] border-white/[0.05] text-zinc-700"
                  : "bg-gray-50 border-gray-100 text-gray-300"
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
            disabled={isToday} // Future timeline entries hard blocked
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