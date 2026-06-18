"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";

import { PlannerEvent } from "../../types/types";
import { useTheme } from "@/theme/ThemeProvider";

const getLocalDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

const formatTime12Hour = (time?: string) => {
  if (!time) return "No time";
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
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
}: TopBarProps) {
  const { isDarkMode } = useTheme();

  const [dateString, setDateString] = useState("");
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [, setTick] = useState(0);

  // Force re-render every minute for live "Due in 42m" updates & hour checks
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    const monthDay = now.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
    setDateString(`${weekday} • ${monthDay}`);
  }, []);

  const todayStr = getLocalDate();
  const tomorrowStr = getLocalDate(1);

  const todayEvents = events.filter((e) => e.date === todayStr);
  const tomorrowEvents = events.filter((e) => e.date === tomorrowStr && e.status === "pending");

  const doneToday = todayEvents.filter((e) => e.status === "completed").length;
  const pendingToday = todayEvents.filter((e) => e.status === "pending");
  const missedTotal = events.filter((e) => e.status === "missed").length;

  const activeToday = pendingToday.length;

  // Next Task for Today
  const nextTaskToday = useMemo(() => {
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

  // Next Task for Tomorrow (If today is clear)
  const nextTaskTomorrow = useMemo(() => {
    if (tomorrowEvents.length === 0) return undefined;
    return [...tomorrowEvents].sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.time}`).getTime();
      const timeB = new Date(`${b.date}T${b.time}`).getTime();
      return timeA - timeB;
    })[0];
  }, [tomorrowEvents]);

  const getNextTaskUrgency = (task: PlannerEvent | undefined) => {
    if (!task) return null;
    const now = new Date();
    const target = new Date(`${task.date}T${task.time}`);
    const diffMs = target.getTime() - now.getTime();

    if (diffMs < 0) return { label: "Overdue", urgent: true };

    const diffMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hrs === 0) return { label: `Due in ${mins}m`, urgent: true };
    return { label: `Due in ${hrs}h ${mins}m`, urgent: false };
  };

  const urgency = getNextTaskUrgency(nextTaskToday);
  const displayTask = nextTaskToday || (activeToday === 0 ? nextTaskTomorrow : undefined);
  const isTomorrowTask = !!(!nextTaskToday && nextTaskTomorrow && activeToday === 0);

  // Dynamic Context Engine
  const getHeaderTitle = () => {
    if (missedTotal > 0) return "Recovery Mode";
    if (activeToday > 0) return "Ready to Execute";
    if (activeToday === 0 && doneToday > 0 && currentHour < 18) return "Ahead of Schedule";
    if (activeToday === 0 && doneToday > 0 && tomorrowEvents.length > 0) return "Ready for Tomorrow";
    if (activeToday === 0 && doneToday > 0) return "Day Complete";
    if (currentHour >= 21) return "Wrapping Up";
    return "Planning Mode";
  };

  const getStatusBadge = () => {
    if (missedTotal > 0) return "RECOVERY";
    if (activeToday === 0 && doneToday > 0) return "COMPLETE";
    return "ON TRACK";
  };

  const getSubtitle = () => {
    if (missedTotal > 0) return `Recovery required: ${missedTotal} overdue task${missedTotal > 1 ? "s" : ""}`;
    if (activeToday > 0) return `${doneToday} completed • ${activeToday} active`;
    if (activeToday === 0 && doneToday > 0 && currentHour < 18) return "All objectives completed before evening";
    if (activeToday === 0 && doneToday > 0 && tomorrowEvents.length > 0) return `${tomorrowEvents.length} objective${tomorrowEvents.length > 1 ? "s" : ""} scheduled tomorrow`;
    if (activeToday === 0 && doneToday > 0) return "No objectives scheduled tomorrow";
    if (currentHour >= 21) return "Prepare tomorrow's objectives";
    return "No active objectives scheduled";
  };

  return (
    <>
      <nav className="relative z-20 px-4 md:px-6 pt-3 md:pt-4 font-sans">
        <div className="max-w-[1450px] mx-auto">
          <div
            className={`
              rounded-[2rem]
              px-5 md:px-6
              py-4
              backdrop-blur-[28px]
              transition-all duration-300
              flex flex-col md:flex-row
              items-start md:items-center
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
            {/* LEFT: Context Header */}
            <div className="flex flex-col gap-1.5 min-w-0 flex-1 w-full md:w-auto">
              <h1
                className={`
                  text-[1.4rem] md:text-[1.6rem]
                  tracking-[-0.03em]
                  uppercase
                  leading-[1]
                  antialiased
                  ${isDarkMode ? "text-white" : "text-black"}
                `}
                style={{ fontWeight: 600 }}
              >
                {getHeaderTitle()}
              </h1>

              <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-orange-500/90 mt-1">
                {dateString} • <span className={missedTotal > 0 ? "text-red-500" : "text-orange-500"}>{getStatusBadge()}</span>
              </p>

              <p
                className={`
                  text-[13px]
                  font-medium
                  tracking-[-0.01em]
                  mt-1
                  ${isDarkMode ? "text-white/60" : "text-black/60"}
                `}
              >
                {getSubtitle()}
              </p>
            </div>

            {/* CENTER: Next Objective */}
            <div className="hidden md:flex flex-col shrink-0 min-w-[240px]">
              <span
                className={`
                  text-[9px]
                  uppercase
                  tracking-[0.18em]
                  font-medium
                  mb-1.5
                  ${isDarkMode ? "text-white/40" : "text-black/40"}
                `}
              >
                Next Objective
              </span>

              {displayTask ? (
                <>
                  <h3
                    className={`
                      text-[13px]
                      tracking-[-0.02em]
                      truncate
                      ${isDarkMode ? "text-white" : "text-black"}
                    `}
                    style={{ fontWeight: 540 }}
                  >
                    {displayTask.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className={`h-2 w-2 rounded-full ${
                        !isTomorrowTask && urgency?.urgent ? "bg-red-500 animate-pulse" : "bg-orange-500"
                      }`} 
                    />
                    <span 
                      className={`text-[11px] font-medium ${
                        !isTomorrowTask && urgency?.urgent ? "text-red-500" : "text-orange-500"
                      }`}
                    >
                      {isTomorrowTask ? `Tomorrow • ${formatTime12Hour(displayTask.time)}` : urgency?.label}
                    </span>
                  </div>
                </>
              ) : (
                <p
                  className={`
                    text-[12px]
                    font-medium
                    ${isDarkMode ? "text-white/50" : "text-black/50"}
                  `}
                >
                  Day Clear
                </p>
              )}
            </div>

            {/* RIGHT: Desktop Button */}
            <div className="hidden md:block shrink-0">
              <button
                onClick={onAddClick}
                className="
                  h-10
                  px-4
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
                style={{ fontWeight: 540 }}
              >
                <Plus size={16} strokeWidth={2.6} />
                Add Task
              </button>
            </div>

            {/* FULL-WIDTH MOBILE BUTTON */}
            <button
              onClick={onAddClick}
              className="md:hidden mt-2 w-full h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] shadow-[0_8px_22px_rgba(249,115,22,0.22)]"
              style={{ fontWeight: 540 }}
            >
              <Plus size={16} strokeWidth={2.6} />
              Add Task
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}