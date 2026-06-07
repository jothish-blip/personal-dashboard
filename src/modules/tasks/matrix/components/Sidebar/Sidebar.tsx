"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  FolderOpen,
  NotebookPen,
  Target,
  Check,
  X
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
  userName?: string | null;
}

type TabType = "pending" | "completed" | "history";

export default function Sidebar({
  tasks = [],
  userName = null,
}: SidebarProps) {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("pending");

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

  const pendingTasks = useMemo(() => {
    return tasks.filter((task) => task.history?.[today] !== true);
  }, [tasks, today]);

  const completedTasks = useMemo(() => {
    return tasks.filter((task) => task.history?.[today] === true);
  }, [tasks, today]);

  const totalTasks = tasks.length;
  const percentCompleted = totalTasks === 0 ? 0 : Math.round((completedTasks.length / totalTasks) * 100);

  // Calculate 7-day history metrics
  const historyMetrics = useMemo(() => {
    if (totalTasks === 0) return { rate: 0, days: [] };

    let completedIn7Days = 0;
    const possibleIn7Days = totalTasks * 7;

    const days = last7Days.map(day => {
      let dayCompletedCount = 0;
      tasks.forEach(t => {
        if (t.history?.[day]) {
          dayCompletedCount++;
          completedIn7Days++;
        }
      });
      const isPerfect = totalTasks > 0 && dayCompletedCount === totalTasks;
      return { date: day, checked: isPerfect };
    });

    const rate = Math.round((completedIn7Days / possibleIn7Days) * 100);
    return { rate, days };
  }, [tasks, last7Days, totalTasks]);

  // Neutral Theme Colors
  const surface = isDarkMode ? "bg-black border-white/[0.06]" : "bg-white border-black/[0.05]";
  const textPrimary = isDarkMode ? "text-slate-100" : "text-slate-900";
  const textMuted = isDarkMode ? "text-slate-400" : "text-slate-500";
  const borderSubtle = isDarkMode ? "border-white/[0.06]" : "border-black/[0.05]";
  const hoverBg = isDarkMode ? "hover:bg-orange-500/[0.04]" : "hover:bg-black/[0.02]";

  const tabs: { id: TabType; label: string }[] = [
    { id: "pending", label: `Pending (${pendingTasks.length})` },
    { id: "completed", label: `Completed (${completedTasks.length})` },
    { id: "history", label: "History" },
  ];

  return (
    <aside
      className="
        w-full
        flex
        flex-col
        gap-6
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
      {/* 1. TODAY & REAL STATISTICS */}
      <section className="px-1">
        <h2 className={`text-[20px] font-semibold tracking-tight ${textPrimary} mb-4`}>
          Today
        </h2>
        
        <div className={`rounded-2xl border p-5 ${surface}`}>
          <div className="mb-4">
            <div>
              <div className={`text-[24px] font-semibold tracking-tight ${textPrimary}`}>
                {percentCompleted}%
              </div>
              <div className={`text-[13px] ${textMuted} mt-0.5`}>
                {completedTasks.length} / {totalTasks} Tasks Completed
              </div>
            </div>
          </div>

          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-white/[0.06]" : "bg-black/[0.04]"}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${isDarkMode ? "bg-slate-300" : "bg-slate-800"}`}
              style={{ width: `${percentCompleted}%` }}
            />
          </div>
        </div>
      </section>

      {/* 2. TABS */}
      <section className="flex flex-col gap-4 px-1">
        <div className={`flex w-full gap-1 p-1 rounded-xl border ${surface}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 h-[32px] rounded-lg text-[12px] font-medium transition-all
                ${
                  activeTab === tab.id
                    ? isDarkMode
                      ? "bg-white/[0.1] text-white shadow-sm"
                      : "bg-white border border-black/[0.05] text-slate-900 shadow-sm"
                    : `text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-500 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent`
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 3. TASK LIST / HISTORY VIEWS */}
        <div className="flex flex-col gap-3">
          
          {/* PENDING VIEW */}
          {activeTab === "pending" && (
            <>
              {pendingTasks.length > 0 ? (
                pendingTasks.map((task, index) => (
                  <TaskCard 
                    key={task.id || index} 
                    task={task} 
                    isDarkMode={isDarkMode} 
                    borderSubtle={borderSubtle}
                    hoverBg={hoverBg}
                  />
                ))
              ) : (
                <EmptyState message="No pending tasks." isDarkMode={isDarkMode} borderSubtle={borderSubtle} />
              )}
            </>
          )}

          {/* COMPLETED VIEW */}
          {activeTab === "completed" && (
            <>
              {completedTasks.length > 0 ? (
                completedTasks.map((task, index) => (
                  <div
                    key={task.id || index}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all ${isDarkMode ? "bg-white/[0.01] border-white/[0.04]" : "bg-black/[0.01] border-black/[0.04]"}`}
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-[13px] font-medium tracking-tight truncate line-through opacity-50 ${textPrimary}`}>
                        {task.name}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState message="No completed tasks yet." isDarkMode={isDarkMode} borderSubtle={borderSubtle} />
              )}
            </>
          )}

          {/* REAL HISTORY VIEW */}
          {activeTab === "history" && (
            <div className={`rounded-2xl border p-5 ${surface}`}>
              <div className="flex items-center justify-between mb-5">
                <div className={`text-[13px] font-medium ${textMuted}`}>7 Day Completion Rate</div>
                <div className={`text-[18px] font-semibold ${textPrimary}`}>{historyMetrics.rate}%</div>
              </div>
              
              <div className="flex flex-col gap-3">
                {historyMetrics.days.map((day, idx) => {
                  const dayName = new Date(day.date).toLocaleDateString("en-US", { weekday: "long" });
                  return (
                    <div key={idx} className="flex items-center justify-between">
                      <span className={`text-[13px] ${textPrimary}`}>{dayName}</span>
                      <span className={`${day.checked ? (isDarkMode ? "text-slate-300" : "text-slate-700") : "text-slate-300 dark:text-slate-700"}`}>
                        {day.checked ? <Check size={16} /> : <X size={16} />}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. QUICK ACTIONS */}
      <section className="px-1 mt-2">
        <div className={`text-[11px] font-semibold tracking-wide uppercase mb-3 px-1 ${textMuted}`}>
          Quick Actions
        </div>
        <div className="grid grid-cols-4 gap-2">
          <QuickActionBtn href="/focus" icon={<Target size={18} />} title="Focus" />
          <QuickActionBtn href="/Planner" icon={<CalendarDays size={18} />} title="Plan" />
          <QuickActionBtn href="/diary" icon={<NotebookPen size={18} />} title="Diary" />
          <QuickActionBtn href="/Workspace" icon={<FolderOpen size={18} />} title="Work" />
        </div>
      </section>
    </aside>
  );
}

// --- SUBCOMPONENTS ---

function TaskCard({ task, isDarkMode, borderSubtle, hoverBg }: { task: Task; isDarkMode: boolean; borderSubtle: string; hoverBg: string }) {
  return (
    <div className={`flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 bg-transparent ${borderSubtle} ${hoverBg}`}>
      <div className="mb-4">
        <h4 className={`font-medium text-[14px] tracking-tight leading-snug ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>
          {task.name}
        </h4>
        <div className={`text-[12px] mt-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
          {task.group || "General"}
        </div>
      </div>

      <div className="flex gap-2">
        <Link 
          href="/focus" 
          className={`flex-1 flex items-center justify-center text-[12px] font-medium py-2 rounded-lg transition-all ${isDarkMode ? "bg-white/[0.08] text-white hover:bg-white/[0.12]" : "bg-black/[0.04] text-black hover:bg-black/[0.08]"}`}
        >
          Focus
        </Link>
        <Link 
          href="/Planner" 
          className={`flex-1 flex items-center justify-center text-[12px] font-medium py-2 rounded-lg border transition-all ${isDarkMode ? "border-white/[0.1] text-slate-300 hover:text-white hover:bg-white/[0.04]" : "border-black/[0.1] text-slate-600 hover:text-black hover:bg-black/[0.02]"}`}
        >
          Plan
        </Link>
      </div>
    </div>
  );
}

function QuickActionBtn({ href, icon, title }: { href: string; icon: React.ReactNode; title: string }) {
  return (
    <Link
      href={href}
      className={`
        flex flex-col
        items-center
        justify-center
        gap-1.5
        aspect-square
        rounded-2xl
        border
        border-orange-500/25
        transition-all
        active:scale-95
        hover:border-orange-500/60
        hover:bg-orange-500/5
      `}
    >
      <div className="text-orange-400">
        {icon}
      </div>
      <div className="text-[10px] font-medium text-orange-400">
        {title}
      </div>
    </Link>
  );
}

function EmptyState({ message, isDarkMode, borderSubtle }: { message: string; isDarkMode: boolean; borderSubtle: string }) {
  return (
    <div className={`rounded-2xl border p-6 w-full text-center bg-transparent ${borderSubtle}`}>
      <p className={`text-[13px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
        {message}
      </p>
    </div>
  );
}