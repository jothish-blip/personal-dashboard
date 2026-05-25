"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays,
  FolderOpen,
  NotebookPen,
  Target
} from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

interface Task {
  id?: string;
  name?: string;
  group?: string;
  history?: Record<string, boolean>;
}

interface SidebarProps {
  tasks: Task[];
}

export default function Sidebar({
  tasks = [],
}: SidebarProps) {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "history">("pending");
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "afternoon" | "night">("morning");

  // Determine time of day on mount to avoid hydration mismatch
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setTimeOfDay("morning");
    else if (hour >= 12 && hour < 18) setTimeOfDay("afternoon");
    else setTimeOfDay("night");
  }, []);

  const getToday = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  };

  const today = getToday();

  // Pre-compute last 7 days for the History tab
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });
  }, []);

  // Subtle inner accent line mood based on time of day
  const getCardMood = () => {
    if (timeOfDay === "morning") return { accent: "bg-emerald-500/60" };
    if (timeOfDay === "afternoon") return { accent: "bg-orange-500/60" };
    return { accent: "bg-rose-500/60" };
  };

  const mood = getCardMood();

  const pendingTasks = useMemo(() => {
    return tasks.filter((task) => task.history?.[today] !== true);
  }, [tasks, today]);

  const completedTasks = useMemo(() => {
    return tasks.filter((task) => task.history?.[today] === true);
  }, [tasks, today]);

  const percentCompleted = tasks.length === 0 ? 0 : Math.round((completedTasks.length / tasks.length) * 100);

  // Dynamic context message based on detailed progress thresholds
  const getProgressMessage = (completed: number, total: number) => {
    const ratio = total === 0 ? 0 : completed / total;

    if (total === 0) return "Let's plan your day.";
    if (completed === 0) return "Let's start with one thing today.";
    if (ratio < 0.3) return "Good start — keep momentum going.";
    if (ratio < 0.6) return "You're building momentum.";
    if (ratio < 0.9) return "You're almost there.";
    
    return "Great work today.";
  };

  // Tiny success text builder for the stats row
  const getTinyStatText = (completed: number, total: number) => {
    if (total === 0) return null;
    if (completed === 0) return "Ready to begin";
    const ratio = completed / total;
    if (ratio === 1) return "Everything complete";
    if (ratio >= 0.6) return "Almost there";
    if (ratio >= 0.25) return "Good pace";
    return "Building momentum";
  };

  const surface = isDarkMode
    ? "bg-white/[0.02] border-white/[0.06]"
    : "bg-black/[0.000] border-black/[0.05]";

  const textPrimary = isDarkMode ? "text-slate-100" : "text-slate-900";
  const textMuted = isDarkMode ? "text-slate-400/80" : "text-slate-500";

  // Dynamic Greetings
  const greetings = {
    morning: { title: "Good morning, Jothish", sub: "Let's build momentum today." },
    afternoon: { title: "Good afternoon, Jothish", sub: "Keep the pace steady." },
    night: { title: "Good evening, Jothish", sub: "Close the day strong." }
  };

  return (
    <aside
      className="
        w-full
        flex
        flex-col
        gap-5
        pb-40
        pr-1
        h-full
        min-h-0
        overflow-y-auto
        overflow-x-hidden
        [scrollbar-width:none]
        [-ms-overflow-style:none]
        [&::-webkit-scrollbar]:hidden
      "
    >
      
      {/* PREMIUM APP TABS */}
      <div>
        <div
          className={`
            w-full
            flex
            gap-1
            rounded-xl
            p-1
            border
            backdrop-blur-xl
            ${
              isDarkMode
                ? "bg-[#0F1115]/80 border-white/[0.06]"
                : "bg-slate-50/90 border-black/[0.05]"
            }
          `}
        >
          {(["pending", "completed", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1
                h-[34px]
                rounded-lg
                text-[13px]
                font-medium
                capitalize
                transition-all
                hover:scale-[1.01]
                ${
                  activeTab === tab
                    ? isDarkMode
                      ? "bg-white/[0.12] border border-white/[0.08] shadow-sm text-white"
                      : "bg-white border border-black/[0.06] shadow-sm text-slate-900"
                    : isDarkMode
                    ? "text-slate-400 hover:text-slate-200 border border-transparent"
                    : "text-slate-500 hover:text-slate-800 border border-transparent"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* STATS ROW WITH TINY PROGRESS BAR & SUCCESS TEXT */}
        <div className="mt-3 px-2">
          <div className={`flex items-center justify-between text-[12px] ${textMuted}`}>
            <span>
              Completed today 
              {getTinyStatText(completedTasks.length, tasks.length) && (
                <span className={`ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${isDarkMode ? 'bg-white/[0.08] text-slate-300' : 'bg-black/[0.00] text-slate-600'}`}>
                  {getTinyStatText(completedTasks.length, tasks.length)}
                </span>
              )}
            </span>
            <span className="font-medium">
              {completedTasks.length} / {tasks.length}
            </span>
          </div>
          <div className={`w-full h-1 mt-2.5 rounded-full overflow-hidden ${isDarkMode ? "bg-white/[0.06]" : "bg-black/[0.00]"}`}>
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${isDarkMode ? "bg-slate-300" : "bg-slate-700"}`}
              style={{ width: `${percentCompleted}%` }}
            />
          </div>
        </div>
      </div>

      {/* TASK FLOW SECTION */}
      <section>
        <div className="mb-4 px-1">
          <h2 className={`text-[16px] font-semibold tracking-tight ${textPrimary}`}>
            {greetings[timeOfDay].title}
          </h2>
          <p className={`text-[13px] ${textMuted} mt-0.5`}>
            {greetings[timeOfDay].sub}
          </p>
          
          <div className={`text-[12px] font-medium mt-3 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
            {tasks.length > 0 && <span className="opacity-50 mr-1.5">{percentCompleted}% completed •</span>}
            {getProgressMessage(completedTasks.length, tasks.length)}
          </div>
        </div>

        <div className="flex md:flex-col gap-3.5 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          
          {/* PENDING TASKS VIEW */}
          {activeTab === "pending" && (
            <>
              {pendingTasks.length > 0 ? (
                pendingTasks.map((task, index) => {
                  const isHero = index === 0;

                  // Elevated visual weight (8%) for Hero Card ONLY
                  let cardBgClass = isDarkMode
                    ? "bg-gradient-to-b from-white/[0.04] to-white/[0.02] border-white/[0.08] hover:border-white/[0.12]"
                    : "bg-white border-black/[0.06] hover:border-black/[0.1]";
                  
                  if (isHero) {
                    if (timeOfDay === "morning") {
                      cardBgClass = isDarkMode ? "bg-emerald-500/[0.08] border-emerald-500/[0.12] hover:border-emerald-500/[0.18]" : "bg-emerald-50 border-emerald-200/60 hover:border-emerald-300/80";
                    } else if (timeOfDay === "afternoon") {
                      cardBgClass = isDarkMode ? "bg-amber-500/[0.08] border-amber-500/[0.12] hover:border-amber-500/[0.18]" : "bg-amber-50 border-amber-200/60 hover:border-amber-300/80";
                    } else {
                      cardBgClass = isDarkMode ? "bg-rose-500/[0.08] border-rose-500/[0.12] hover:border-rose-500/[0.18]" : "bg-rose-50 border-rose-200/60 hover:border-rose-300/80";
                    }
                  }

                  return (
                    <div
                      key={task.id || index}
                      className={`
                        group
                        relative
                        flex
                        flex-col
                        justify-between
                        border
                        transition-all
                        duration-300
                        min-w-[290px]
                        md:min-w-0
                        md:w-full
                        shrink-0
                        snap-center
                        active:scale-[0.99]
                        hover:-translate-y-[1px]
                        ${cardBgClass}
                        ${isHero ? "rounded-[28px]" : "rounded-[22px]"}
                        ${isDarkMode ? "shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.15)]" : "shadow-[0_6px_18px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_14px_rgba(0,0,0,0.04)]"}
                        ${isHero ? "p-5 min-h-[165px]" : "p-4.5 min-h-[130px]"}
                      `}
                    >
                      {/* Subdued internal pill accent */}
                      <div className={`
                        absolute
                        left-[1px]
                        top-[10px]
                        bottom-[10px]
                        w-[2px]
                        rounded-full
                        ${mood.accent}
                      `} />

                      <div className="pl-3">
                        {/* Dynamic Emotional Badge & Metadata for Hero */}
                        {isHero && (
                          <div className="mb-2.5">
                            <div className="text-[11px] font-medium opacity-60 tracking-tight mb-2">
                              Best next action
                            </div>
                            <span className={`inline-block text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full ${
                              timeOfDay === "morning" ? "text-emerald-700 bg-emerald-500/10 dark:text-emerald-300 dark:bg-emerald-500/20" :
                              timeOfDay === "afternoon" ? "text-amber-700 bg-amber-500/10 dark:text-amber-300 dark:bg-amber-500/20" :
                              "text-rose-700 bg-rose-500/10 dark:text-rose-300 dark:bg-rose-500/20"
                            }`}>
                              {timeOfDay === "morning" && "Start here"}
                              {timeOfDay === "afternoon" && "Continue"}
                              {timeOfDay === "night" && "Finish strong"}
                            </span>
                          </div>
                        )}

                        <h4 className={`font-semibold text-[15.5px] tracking-tight leading-snug ${textPrimary}`}>
                          {task.name}
                        </h4>

                        <div className={`text-[12px] mt-1 ${textMuted}`}>
                          {task.group || "General"}
                        </div>

                        {/* Empathic Subtext for Hero */}
                        {isHero && (
                          <div className="text-[11px] opacity-60 mt-1">
                            {timeOfDay === "morning" && "Good task to start your day"}
                            {timeOfDay === "afternoon" && "Keep momentum going"}
                            {timeOfDay === "night" && "Good one to finish today"}
                          </div>
                        )}
                      </div>

                      {/* Clean Dock Controls */}
                      <div className="pl-3 mt-4 flex gap-2.5">
                        <Link href="/Planner" className={dockClass(isDarkMode, false)}>
                          Plan
                        </Link>
                        <Link href="/focus" className={dockClass(isDarkMode, true)}>
                          Focus
                        </Link>
                        <Link href="/Workspace" className={dockClass(isDarkMode, false)}>
                          Workspace
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState timeOfDay={timeOfDay} percentCompleted={percentCompleted} />
              )}
            </>
          )}

          {/* COMPLETED TASKS VIEW */}
          {activeTab === "completed" && (
            <div className="flex flex-col gap-2 w-full">
              {completedTasks.length > 0 ? (
                completedTasks.map((task, index) => (
                  <div
                    key={task.id || index}
                    className={`
                      flex
                      items-center
                      gap-3
                      rounded-[22px]
                      border
                      px-4
                      py-3
                      w-full
                      transition-all
                      ${
                        isDarkMode
                          ? "bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1] hover:bg-emerald-500/[0.05]"
                          : "bg-white border-black/[0.05] hover:border-black/[0.08] hover:bg-emerald-500/[0.03]"
                      }
                    `}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[12px] text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-[14px] font-medium tracking-tight truncate line-through opacity-60 ${textPrimary}`}>
                        {task.name}
                      </div>
                      <div className={`text-[12px] mt-0.5 flex items-center gap-1.5 ${textMuted}`}>
                        <span>{task.group || "General"}</span>
                        <span className="opacity-40">•</span>
                        <span className="opacity-80 font-medium">Completed today</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState timeOfDay={timeOfDay} percentCompleted={percentCompleted} />
              )}
            </div>
          )}

          {/* REAL HISTORY VIEW (7-DAY PERFORMANCE) */}
          {activeTab === "history" && (
            <div className="flex flex-col gap-3.5 w-full">
              {tasks.length > 0 ? (
                tasks.map((task, index) => (
                  <div
                    key={task.id || index}
                    className={`
                      rounded-[22px]
                      border
                      p-4
                      transition-all
                      ${
                        isDarkMode
                          ? "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]"
                          : "bg-white border-black/[0.05] hover:bg-slate-50"
                      }
                    `}
                  >
                    <div className={`text-[14px] font-medium tracking-tight ${textPrimary}`}>
                      {task.name}
                    </div>

                    <div className={`text-[11px] mt-1 ${textMuted}`}>
                      {task.group || "General"}
                    </div>

                    <div className="flex gap-2 mt-4 justify-between md:justify-start md:gap-3">
                      {last7Days.map((day, idx) => {
                        const completed = task.history?.[day] === true;
                        const isToday = day === today;

                        return (
                          <div
                            key={idx}
                            className={`
                              h-8
                              w-8
                              rounded-full
                              flex
                              items-center
                              justify-center
                              text-[11px]
                              font-medium
                              transition-all
                              ${
                                completed
                                  ? "bg-emerald-500 text-white"
                                  : isDarkMode
                                  ? "bg-white/[0.06] text-slate-400"
                                  : "bg-slate-100 text-slate-500"
                              }
                              ${
                                isToday
                                  ? isDarkMode
                                    ? "ring-2 ring-white/20 ring-offset-2 ring-offset-[#0F1115]"
                                    : "ring-2 ring-black/10 ring-offset-2 ring-offset-white"
                                  : ""
                              }
                            `}
                          >
                            {new Date(day).toLocaleDateString("en-US", {
                              weekday: "narrow",
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className={`rounded-[22px] border p-6 w-full text-center ${isDarkMode ? "bg-white/[0.02] border-white/[0.05]" : "bg-white border-black/[0.05]"}`}>
                  <p className={`text-[13px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    No tasks to show history for.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className={`rounded-[22px] border p-4 ${surface}`}>
        <div className={`text-[11px] font-medium tracking-tight mb-3 ${textMuted}`}>
          Quick Actions
        </div>

        <div className="flex flex-col gap-1.5">
          <SidebarLink
            href="/focus"
            icon={<Target size={14} />}
            title="Focus"
            subtitle="Deep work session"
            isDarkMode={isDarkMode}
          />
          <SidebarLink
            href="/Planner"
            icon={<CalendarDays size={14} />}
            title="Planner"
            subtitle="Plan tomorrow"
            isDarkMode={isDarkMode}
          />
          <SidebarLink
            href="/diary"
            icon={<NotebookPen size={14} />}
            title="Diary"
            subtitle="Write thoughts"
            isDarkMode={isDarkMode}
          />
          <SidebarLink
            href="/Workspace"
            icon={<FolderOpen size={14} />}
            title="Workspace"
            subtitle="Save ideas"
            isDarkMode={isDarkMode}
          />
        </div>
      </section>
    </aside>
  );
}

// Sub-navigation Utilities
function SidebarLink({
  href,
  icon,
  title,
  subtitle,
  isDarkMode,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isDarkMode: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        flex
        items-center
        justify-between
        rounded-xl
        px-3.5
        py-2.5
        border
        transition-all
        active:scale-[0.99]
        hover:-translate-y-[0.5px]
        ${
          isDarkMode
            ? "bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]"
            : "bg-black/[0.008] border-black/[0.03] hover:bg-black/[0.00] hover:border-black/[0.06]"
        }
      `}
    >
      <div className="flex items-center gap-3">
        <span className="opacity-50">{icon}</span>
        <div>
          <div className="text-[13px] font-medium tracking-tight">{title}</div>
          <div className="text-[11px] opacity-50">{subtitle}</div>
        </div>
      </div>
      <span className="text-[12px] opacity-30">&rarr;</span>
    </Link>
  );
}

// Soft pill app buttons (Subtly filled for Focus, neutral for others)
function dockClass(isDarkMode: boolean, isPrimary: boolean = false) {
  const base = "flex-1 flex items-center justify-center text-[13px] font-medium py-2 px-3 transition-all duration-200 rounded-full active:scale-[0.97]";

  if (isPrimary) {
    return `${base} ${
      isDarkMode
        ? "bg-white/[0.12] text-white hover:bg-white/[0.18]"
        : "bg-slate-800 text-white hover:bg-slate-900"
    }`;
  }
  
  return `${base} border ${
    isDarkMode
      ? "border-white/[0.08] bg-transparent text-slate-300 hover:text-white hover:bg-white/[0.04]"
      : "border-slate-200/80 bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
  }`;
}

// Empathic dynamic empty state based on time of day and completion progress
function EmptyState({ timeOfDay, percentCompleted }: { timeOfDay: "morning" | "afternoon" | "night", percentCompleted: number }) {
  const { isDarkMode } = useTheme();

  let title = "";
  let subtitle = "";

  if (percentCompleted === 0) {
    if (timeOfDay === "morning") title = "Start with one thing today";
    else if (timeOfDay === "afternoon") title = "Still time to make progress";
    else title = "One small win before rest";
    
    subtitle = "Momentum builds faster than motivation.";
  } else if (percentCompleted < 30) {
    title = "You're getting started";
    subtitle = "Keep moving — one task at a time.";
  } else if (percentCompleted < 70) {
    title = "Good progress today";
    subtitle = "Keep momentum going.";
  } else if (percentCompleted < 100) {
    title = "Almost there";
    subtitle = "Finish strong today.";
  } else {
    title = "Great work today";
    subtitle = "Everything for this filter is done.";
  }

  return (
    <div className={`rounded-[22px] border p-6 w-full text-center ${isDarkMode ? "bg-white/[0.02] border-white/[0.05]" : "bg-white border-black/[0.05]"}`}>
      <h4 className={`text-[15px] font-semibold tracking-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
        {title}
      </h4>
      <p className={`mt-1.5 text-[13px] whitespace-pre-line leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
        {subtitle}
      </p>
      
      {percentCompleted < 100 && (
        <div className="mt-5 flex flex-col gap-2.5 w-full">
          <Link href="/focus" className={dockClass(isDarkMode, true)}>
            Open Focus
          </Link>
          <Link href="/Planner" className={dockClass(isDarkMode, false)}>
            Open Planner
          </Link>
        </div>
      )}
    </div>
  );
}