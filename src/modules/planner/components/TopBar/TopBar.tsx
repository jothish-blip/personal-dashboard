"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  CalendarDays,
  LayoutList,
  History,
  SkipBack,
  AlertCircle,
} from "lucide-react";

import { PlannerEvent } from "../../types/types";
import { useTheme } from "@/theme/ThemeProvider";

const getLocalDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

export type TabType =
  | "today"
  | "yesterday"
  | "tomorrow"
  | "objectives"
  | "range"
  | "logs";

interface TopBarProps {
  onAddClick: () => void;
  events?: PlannerEvent[];
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
}

export default function TopBar({
  onAddClick,
  events = [],
  activeTab = "today",
  setActiveTab = () => {},
}: TopBarProps) {
  const { isDarkMode } = useTheme();

  const [dateString, setDateString] = useState("");
  const [greeting, setGreeting] = useState("Good Day");

  useEffect(() => {
    const now = new Date();

    const weekday = now
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase();
    const monthDay = now
      .toLocaleDateString("en-US", { month: "short", day: "numeric" })
      .toUpperCase();

    // Premium date formatting: MON • MAY 25
    setDateString(`${weekday} • ${monthDay}`);

    const hour = now.getHours();

    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const todayStr = getLocalDate();

  const todayEvents = events.filter((e) => e.date === todayStr);

  const pendingToday = todayEvents.filter((e) => e.status === "pending");

  const missedTotal = events.filter((e) => e.status === "missed").length;

  const nextTask = useMemo(() => {
    const now = new Date();

    return pendingToday
      .filter((e) => {
        const eventTime = new Date(`${e.date}T${e.time}`);
        return eventTime.getTime() > now.getTime();
      })
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time}`).getTime();
        const timeB = new Date(`${b.date}T${b.time}`).getTime();
        return timeA - timeB;
      })[0];
  }, [pendingToday]);

  return (
    <>
      <nav
        style={{
          marginTop: "calc(var(--navbar-h, 80px) + 1rem)",
        }}
        className="relative z-20 px-4 md:px-6 font-sans"
      >
        <div className="max-w-[1450px] mx-auto">
          <div
            className={`
              rounded-[2rem]
              px-5 md:px-6
              py-3 md:py-3.5
              backdrop-blur-[28px]
              transition-all duration-300
              flex flex-col lg:flex-row
              items-start lg:items-center
              justify-between
              gap-4
              antialiased
              ${
                isDarkMode
                  ? "bg-white/[0.03] hover:bg-white/[0.06]"
                  : "bg-white/[0.55]"
              }
            `}
          >
            {/* LEFT */}
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <div className="space-y-1">
                <h1
                  className={`
                    text-[1.4rem] md:text-[1.6rem]
                    tracking-[-0.03em]
                    leading-[1]
                    antialiased
                    ${isDarkMode ? "text-white" : "text-black"}
                  `}
                  style={{
                    fontWeight: 540,
                  }}
                >
                  {greeting}
                </h1>

                <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-orange-500/90 mt-1">
                  {dateString}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <p
                  className={`
                    text-[13px]
                    font-medium
                    tracking-[-0.01em]
                    ${isDarkMode ? "text-white/60" : "text-black/60"}
                  `}
                >
                  {pendingToday.length === 0
                    ? "You're clear today."
                    : `${pendingToday.length} objective${
                        pendingToday.length > 1 ? "s" : ""
                      } remaining today`}
                </p>

                {missedTotal > 0 && (
                  <button
                    onClick={() => setActiveTab("objectives")}
                    className={`
                      flex items-center gap-1.5
                      rounded-full
                      px-2.5 py-1
                      text-[10px]
                      font-medium
                      transition-all
                      ${
                        isDarkMode
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/15"
                          : "bg-red-500/10 text-red-600 hover:bg-red-500/15"
                      }
                    `}
                  >
                    <AlertCircle size={12} />
                    {missedTotal} missed
                  </button>
                )}
              </div>
            </div>

            {/* CENTER - NEXT OBJECTIVE */}
            <div className="hidden md:flex flex-col shrink-0 min-w-[240px]">
              <span
                className={`
                  text-[9px]
                  uppercase
                  tracking-[0.18em]
                  font-medium
                  mb-1
                  ${isDarkMode ? "text-white/40" : "text-black/40"}
                `}
              >
                Next Objective
              </span>

              {nextTask ? (
                <>
                  <h3
                    className={`
                      text-[13px]
                      tracking-[-0.02em]
                      truncate
                      ${isDarkMode ? "text-white" : "text-black"}
                    `}
                    style={{
                      fontWeight: 540,
                    }}
                  >
                    {nextTask.title}
                  </h3>

                  <span className="text-[11px] font-medium text-orange-500 mt-0.5">
                    {nextTask.time}
                  </span>
                </>
              ) : (
                <p
                  className={`
                    text-[12px]
                    font-medium
                    ${isDarkMode ? "text-white/50" : "text-black/50"}
                  `}
                >
                  Nothing scheduled
                </p>
              )}
            </div>

            {/* RIGHT BUTTON */}
            <div className="hidden md:block shrink-0">
              <button
                onClick={onAddClick}
                className="
                  h-10
                  px-4.5
                  rounded-[1rem]
                  bg-orange-500
                  hover:bg-orange-600
                  text-white
                  text-[12px]
                  flex items-center gap-2
                  transition-all duration-200
                  active:scale-[0.98]
                  shadow-[0_8px_22px_rgba(249,115,22,0.22)]
                  hover:shadow-[0_10px_28px_rgba(249,115,22,0.30)]
                "
                style={{
                  fontWeight: 540,
                }}
              >
                <Plus size={16} strokeWidth={2.6} />
                Add Task
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE NAV */}
      <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm font-sans">
        <div
          className={`
            rounded-[2rem]
            px-5 py-3
            flex items-center justify-between
            backdrop-blur-[30px]
            shadow-lg
            ${isDarkMode ? "bg-black/30" : "bg-white/65"}
          `}
        >
          <button
            onClick={() => setActiveTab("yesterday")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "yesterday"
                ? "text-orange-500"
                : isDarkMode
                ? "text-white/45"
                : "text-black/45"
            }`}
          >
            <SkipBack size={18} />
            <span className="text-[9px] font-medium">Yesterday</span>
          </button>

          <button
            onClick={() => setActiveTab("today")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "today"
                ? "text-orange-500"
                : isDarkMode
                ? "text-white/45"
                : "text-black/45"
            }`}
          >
            <CalendarDays size={18} />
            <span className="text-[9px] font-medium">Today</span>
          </button>

          <button
            onClick={onAddClick}
            className="
              h-14 w-14
              rounded-full
              bg-orange-500
              text-white
              flex items-center justify-center
              -mt-8
              active:scale-90
              transition-transform
              shadow-[0_8px_22px_rgba(249,115,22,0.25)]
            "
          >
            <Plus size={24} strokeWidth={3} />
          </button>

          <button
            onClick={() => setActiveTab("range")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "range"
                ? "text-orange-500"
                : isDarkMode
                ? "text-white/45"
                : "text-black/45"
            }`}
          >
            <LayoutList size={18} />
            <span className="text-[9px] font-medium">Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "logs"
                ? "text-orange-500"
                : isDarkMode
                ? "text-white/45"
                : "text-black/45"
            }`}
          >
            <History size={18} />
            <span className="text-[9px] font-medium">History</span>
          </button>
        </div>
      </div>
    </>
  );
}