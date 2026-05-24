"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  History,
  Search,
  Filter,
  CalendarDays,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

export default function HistoryTimeline({ system }: any) {
  const {
    energyFilter,
    setEnergyFilter,
    searchQuery,
    setSearchQuery,
    historyDates,
    allEntries,
  } = system;

  const { isDarkMode } = useTheme();

  const [dateFilter, setDateFilter] = useState<
    "today" | "yesterday" | "custom" | null
  >(null);
  const [customDate, setCustomDate] = useState("");

  const listRef = useRef<HTMLDivElement>(null);

  const baseDisplayDates = historyDates || [];

  const displayDates = useMemo(() => {
    let processedDates = [...baseDisplayDates];

    if (dateFilter) {
      const today = new Date();

      const getLocalDate = (d: Date) => {
        const parts = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).formatToParts(d);

        const y = parts.find((p) => p.type === "year")?.value;
        const m = parts.find((p) => p.type === "month")?.value;
        const day = parts.find((p) => p.type === "day")?.value;

        return `${y}-${m}-${day}`;
      };

      const todayStr = getLocalDate(today);

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = getLocalDate(yesterday);

      processedDates = processedDates.filter((dateItem: any) => {
        const key = Array.isArray(dateItem) ? dateItem[0] : dateItem;

        if (dateFilter === "today") return key === todayStr;
        if (dateFilter === "yesterday") return key === yesterdayStr;
        if (dateFilter === "custom" && customDate) return key === customDate;

        return true;
      });
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();

      processedDates = processedDates.filter((dateItem: any) => {
        const dateKey = Array.isArray(dateItem) ? dateItem[0] : dateItem;
        const entry = Array.isArray(dateItem) ? dateItem[1] : allEntries[dateKey];

        if (!entry) return false;

        const textMatch = [
          entry.learning,
          entry.morning,
          entry.afternoon,
          entry.evening,
          entry.tomorrow,
          entry.win,
        ]
          .join(" ")
          .toLowerCase()
          .includes(lowerQuery);

        const tagMatch = entry.tags?.some((t: string) =>
          t.toLowerCase().includes(lowerQuery)
        );

        const frictionMatch = entry.frictions?.some((f: string) =>
          f.toLowerCase().includes(lowerQuery)
        );

        const propMatch = [entry.mood, entry.energy, entry.sleep]
          .join(" ")
          .toLowerCase()
          .includes(lowerQuery);

        return textMatch || tagMatch || frictionMatch || propMatch;
      });
    }

    if (energyFilter) {
      processedDates = processedDates.filter((dateItem: any) => {
        const dateKey = Array.isArray(dateItem) ? dateItem[0] : dateItem;
        const entry = Array.isArray(dateItem) ? dateItem[1] : allEntries[dateKey];

        return entry?.energy?.toLowerCase() === energyFilter.toLowerCase();
      });
    }

    return processedDates;
  }, [
    baseDisplayDates,
    allEntries,
    searchQuery,
    energyFilter,
    dateFilter,
    customDate,
  ]);

  useEffect(() => {
    if (dateFilter && listRef.current) {
      listRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [dateFilter, customDate]);

  return (
    <div className="pb-24 pt-2">
      <div className="flex flex-col gap-6 text-left">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl shadow-sm shrink-0 ${
                isDarkMode
                  ? "bg-orange-950/30 text-orange-400"
                  : "bg-orange-500/10 text-orange-600"
              }`}
            >
              <History size={22} />
            </div>

            <div>
              <h3
                className={`text-xl font-bold tracking-tight ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                History
              </h3>

              <p
                className={`text-sm font-medium ${
                  isDarkMode ? "text-gray-500" : "text-gray-500"
                }`}
              >
                Revisit your thoughts, reflections and patterns.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => {
                  setDateFilter(null);
                  setCustomDate("");
                }}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full border transition-colors shrink-0 ${
                  !dateFilter
                    ? isDarkMode
                      ? "bg-gray-200 text-gray-900 border-gray-200"
                      : "bg-gray-100 text-gray-900 border-gray-200"
                    : isDarkMode
                    ? "bg-[#111111] border-gray-800 text-gray-400 hover:bg-[#1a1a1a]"
                    : "bg-white border-gray-200 text-gray-400 hover:text-gray-600"
                }`}
              >
                All
              </button>

              <div
                className={`h-4 w-[1px] mx-1 shrink-0 ${
                  isDarkMode ? "bg-gray-800" : "bg-gray-200"
                }`}
              />

              <button
                onClick={() => setDateFilter("yesterday")}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors shrink-0 ${
                  dateFilter === "yesterday"
                    ? isDarkMode
                      ? "bg-gray-200 text-gray-900 border-gray-200"
                      : "bg-gray-900 text-white border-gray-900"
                    : isDarkMode
                    ? "bg-[#111111] border-gray-800 text-gray-400 hover:bg-[#1a1a1a]"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                Yesterday
              </button>

              <button
                onClick={() => setDateFilter("today")}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors shrink-0 ${
                  dateFilter === "today"
                    ? isDarkMode
                      ? "bg-gray-200 text-gray-900 border-gray-200"
                      : "bg-gray-900 text-white border-gray-900"
                    : isDarkMode
                    ? "bg-[#111111] border-gray-800 text-gray-400 hover:bg-[#1a1a1a]"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                Today
              </button>

              <button
                onClick={() => setDateFilter("custom")}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors shrink-0 ${
                  dateFilter === "custom"
                    ? isDarkMode
                      ? "bg-gray-200 text-gray-900 border-gray-200"
                      : "bg-gray-900 text-white border-gray-900"
                    : isDarkMode
                    ? "bg-[#111111] border-gray-800 text-gray-400 hover:bg-[#1a1a1a]"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                Custom
              </button>

              {(dateFilter || searchQuery || energyFilter) && (
                <button
                  onClick={() => {
                    setDateFilter(null);
                    setCustomDate("");
                    setSearchQuery("");
                    setEnergyFilter(null);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ml-auto shrink-0 ${
                    isDarkMode
                      ? "text-red-400 bg-red-950/30 border-red-900/50 hover:bg-red-900/50"
                      : "text-red-500 bg-red-50 border-red-100 hover:bg-red-100"
                  }`}
                >
                  <XCircle size={12} /> Clear
                </button>
              )}
            </div>

            {dateFilter === "custom" && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className={`w-full mt-1 border rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all shadow-sm ${
                  isDarkMode
                    ? "bg-[#111111] border-gray-800 text-white focus:border-gray-600 focus:ring-4 focus:ring-white/5"
                    : "bg-white border-gray-200 text-gray-900 focus:border-gray-400 focus:ring-4 focus:ring-gray-500/5"
                }`}
              />
            )}
          </div>

          <div className="relative w-full mt-2">
            <Search
              size={16}
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            />

            <input
              type="text"
              placeholder="Search reflections, lessons or tags..."
              value={searchQuery || ""}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-xl pl-10 pr-10 py-3 text-sm font-medium outline-none transition-all shadow-sm ${
                isDarkMode
                  ? "bg-[#111111] border-gray-800 text-white placeholder-gray-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-900/20"
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/5"
              }`}
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${
                  isDarkMode
                    ? "text-gray-500 hover:text-gray-300"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <div
              className={`flex items-center gap-2 pr-4 border-r shrink-0 ${
                isDarkMode ? "border-gray-800" : "border-gray-100"
              }`}
            >
              <Filter
                size={12}
                className={isDarkMode ? "text-gray-500" : "text-gray-400"}
              />
            </div>

            <button
              onClick={() =>
                setEnergyFilter(energyFilter === "low" ? null : "low")
              }
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${
                energyFilter === "low"
                  ? isDarkMode
                    ? "bg-orange-900/50 border-orange-800 text-orange-400 shadow-sm"
                    : "bg-orange-500 border-orange-600 text-white shadow-sm"
                  : isDarkMode
                  ? "bg-[#111111] border-gray-800 text-gray-400 hover:bg-[#1a1a1a]"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              Low Energy Days
            </button>
          </div>
        </div>

        <div ref={listRef} className="flex flex-col gap-3 scroll-mt-6">
          {displayDates.length === 0 ? (
            <div
              className={`text-center py-12 rounded-2xl border border-dashed ${
                isDarkMode
                  ? "bg-[#111111] border-gray-800"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <CalendarDays
                size={24}
                className={`mx-auto mb-3 ${
                  isDarkMode ? "text-gray-700" : "text-gray-300"
                }`}
              />

              {dateFilter ? (
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  No diary entry for this day.
                </p>
              ) : (
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  Nothing matched your search.
                </p>
              )}
            </div>
          ) : (
            displayDates.map((dateItem: any) => {
              const dateKey = Array.isArray(dateItem) ? dateItem[0] : dateItem;
              const entryObj = Array.isArray(dateItem)
                ? dateItem[1]
                : allEntries[dateKey];

              return (
                <HistoryCard
                  key={dateKey}
                  date={dateKey}
                  entry={entryObj}
                  system={system}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryCard({ date, entry, system }: any) {
  const { isDarkMode } = useTheme();
  const isSelected = system.selectedDate === date;
  const [expanded, setExpanded] = useState(false);

  const displayDate = new Date(date).toLocaleDateString("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    if (system.isReplaying && isSelected) {
      setExpanded(true);
    } else if (system.isReplaying && !isSelected) {
      setExpanded(false);
    }
  }, [system.isReplaying, isSelected]);

  if (!entry || entry.isMissed) {
    return (
      <div
        className={`flex flex-col gap-1 p-5 border rounded-[20px] opacity-50 text-left ${
          isDarkMode
            ? "bg-[#0a0a0a] border-gray-800"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <span
          className={`text-sm font-bold ${
            isDarkMode ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {displayDate}
        </span>

        <span
          className={`text-[11px] font-medium ${
            isDarkMode ? "text-gray-600" : "text-gray-400"
          }`}
        >
          No entry written
        </span>
      </div>
    );
  }

  const dayType =
    entry.goalAlignment > 70
      ? "Strong Day"
      : entry.goalAlignment < 40
      ? "Recovery Day"
      : "Balanced Day";

  const hasBehaviorData = Boolean(
    entry.mood ||
      entry.energy ||
      entry.sleep ||
      entry.win ||
      entry.frictions?.length ||
      entry.tags?.length
  );

  const chipClass = `text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
    isDarkMode
      ? "bg-[#111111] border-gray-800 text-gray-300"
      : "bg-gray-100 border-gray-200 text-gray-700"
  }`;

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      role="button"
      tabIndex={0}
      className={`flex flex-col p-5 sm:p-6 border rounded-[24px] text-left transition-all cursor-pointer active:scale-[0.99] select-none ${
        isSelected
          ? isDarkMode
            ? "border-orange-500/50 bg-orange-950/10"
            : "border-orange-200 bg-orange-50/30 shadow-sm"
          : isDarkMode
          ? "bg-[#0a0a0a] border-gray-800 hover:border-gray-700"
          : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              system.setSelectedDate(date);
            }}
            className={`text-base font-bold text-left transition-colors hover:underline focus:outline-none focus:underline ${
              isSelected
                ? isDarkMode
                  ? "text-orange-400"
                  : "text-orange-700"
                : isDarkMode
                ? "text-gray-100"
                : "text-gray-900"
            }`}
          >
            {displayDate}
          </button>

          <span
            className={`text-[11px] font-medium tracking-wide ${
              isDarkMode ? "text-gray-500" : "text-gray-500"
            }`}
          >
            {dayType}
          </span>
        </div>

        <ChevronDown
          size={18}
          className={`transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          } ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}
        />
      </div>

      {/* Summary / Preview */}
      <div className="mt-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          {entry.mood && (
            <span className={chipClass}>
              {entry.mood === "good"
                ? "😊 Good Mood"
                : entry.mood === "neutral"
                ? "😐 Neutral"
                : "😞 Low Mood"}
            </span>
          )}

          {entry.energy && (
            <span className={chipClass}>🔋 {entry.energy} Energy</span>
          )}

          {entry.sleep && (
            <span className={chipClass}>🌙 {entry.sleep} Sleep</span>
          )}
        </div>

        {entry.win && (
          <p
            className={`text-sm font-medium leading-relaxed ${
              isDarkMode ? "text-emerald-400" : "text-green-700"
            }`}
          >
            ✔ {entry.win}
          </p>
        )}

        {entry.frictions?.[0] && (
          <p
            className={`text-sm font-medium leading-relaxed ${
              isDarkMode ? "text-red-400" : "text-red-600"
            }`}
          >
            ⚠ {entry.frictions[0]}
          </p>
        )}

        {!hasBehaviorData && (
          <p
            className={`text-sm leading-relaxed ${
              isDarkMode ? "text-gray-500" : "text-gray-500"
            }`}
          >
            No activity tracked this day.
          </p>
        )}
      </div>

      {expanded && (
        <div
          className={`mt-5 pt-5 border-t space-y-6 animate-in fade-in duration-300 ${
            isDarkMode ? "border-gray-800" : "border-gray-100"
          }`}
        >
          {(entry.win || (entry.frictions && entry.frictions.length > 0)) && (
            <div className="space-y-3">
              {entry.win && (
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${
                      isDarkMode ? "text-emerald-500/70" : "text-green-600/70"
                    }`}
                  >
                    Biggest Win
                  </span>

                  <p
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-emerald-400" : "text-green-700"
                    }`}
                  >
                    {entry.win}
                  </p>
                </div>
              )}

              {entry.frictions && entry.frictions.length > 0 && (
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${
                      isDarkMode ? "text-red-500/70" : "text-red-500/70"
                    }`}
                  >
                    Friction Faced
                  </span>

                  <p
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-red-400" : "text-red-600"
                    }`}
                  >
                    {entry.frictions[0]}
                  </p>
                </div>
              )}
            </div>
          )}

          {entry.morning && (
            <div>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest block mb-1.5 ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Planning
              </span>

              <p
                className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  isDarkMode ? "text-gray-200" : "text-gray-800"
                }`}
              >
                {entry.morning}
              </p>
            </div>
          )}

          {entry.afternoon && (
            <div>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest block mb-1.5 ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Execution
              </span>

              <p
                className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  isDarkMode ? "text-gray-200" : "text-gray-800"
                }`}
              >
                {entry.afternoon}
              </p>
            </div>
          )}

          {entry.evening && (
            <div>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest block mb-1.5 ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Reflection
              </span>

              <p
                className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  isDarkMode ? "text-gray-200" : "text-gray-800"
                }`}
              >
                {entry.evening}
              </p>
            </div>
          )}

          {entry.tomorrow && (
            <div
              className={`p-4 rounded-[16px] border ${
                isDarkMode
                  ? "bg-orange-950/10 border-orange-900/30"
                  : "bg-orange-50 border-orange-100"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-widest block mb-1.5 ${
                  isDarkMode ? "text-orange-500/70" : "text-orange-600/70"
                }`}
              >
                Next Focus
              </span>

              <p
                className={`font-semibold text-sm ${
                  isDarkMode ? "text-orange-200" : "text-orange-900"
                }`}
              >
                {entry.tomorrow}
              </p>
            </div>
          )}

          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {entry.tags.map((t: string) => (
                <span
                  key={t}
                  className={`text-[10px] font-medium px-2.5 py-1 rounded-md tracking-tight ${
                    isDarkMode
                      ? "text-gray-400 bg-[#111111]"
                      : "text-gray-600 bg-gray-100"
                  }`}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}