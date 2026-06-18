"use client";

import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flame,
  RotateCcw,
  Target,
  TrendingUp,
  Play,
  ShieldAlert,
  Award,
  RefreshCcw,
  Radar
} from "lucide-react";
import type { PlannerEvent } from "../../types/types";
import { useTheme } from "@/theme/ThemeProvider";

interface AnalyticsSidebarProps {
  analytics: {
    rate: number;
    yesterdayRate?: number;
    statusCounts: { completed: number; pending: number; missed: number };
    today: { done: number; total: number; missed: number };
    missedTasks: PlannerEvent[];
    pendingTasks?: PlannerEvent[];
    executionPattern: { name: string; window: string };
    weeklyTrend: { completed: number; diff: number };
    consistency: { activeDays: number };
    workload: { label: string; total: number };
    mostDelayed: { category: string; count: number } | null;
  };
  rescheduleTask: (id: string) => void;
  rescheduleAllMissed: () => void;
  onStartFocus?: (task: PlannerEvent) => void;
}

type Tone = "blue" | "green" | "orange" | "red" | "slate" | "purple";

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

const formatTime12Hour = (time?: string) => {
  if (!time) return "No time";
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
};

const getToneClasses = (tone: Tone, isDarkMode: boolean) => {
  const dark = {
    blue: "bg-blue-500/10 text-blue-400 border-transparent",
    green: "bg-emerald-500/10 text-emerald-400 border-transparent",
    orange: "bg-orange-500/10 text-orange-400 border-transparent",
    red: "bg-red-500/10 text-red-400 border-transparent",
    purple: "bg-purple-500/10 text-purple-400 border-transparent",
    slate: "bg-white/[0.04] text-white/60 border-transparent",
  };

  const light = {
    blue: "bg-blue-500/10 text-blue-600 border-transparent",
    green: "bg-emerald-500/10 text-emerald-600 border-transparent",
    orange: "bg-orange-500/10 text-orange-600 border-transparent",
    red: "bg-red-500/10 text-red-600 border-transparent",
    purple: "bg-purple-500/10 text-purple-600 border-transparent",
    slate: "bg-black/[0.04] text-slate-600 border-transparent",
  };

  return isDarkMode ? dark[tone] : light[tone];
};

const getTextColor = (tone: Tone, isDarkMode: boolean) => {
  const dark = {
    blue: "text-blue-400",
    green: "text-emerald-400",
    orange: "text-orange-400",
    red: "text-red-400",
    purple: "text-purple-400",
    slate: "text-white/70",
  };
  
  const light = {
    blue: "text-blue-600",
    green: "text-emerald-600",
    orange: "text-orange-600",
    red: "text-red-600",
    purple: "text-purple-600",
    slate: "text-slate-700",
  };

  return isDarkMode ? dark[tone] : light[tone];
};

const getRateTone = (rate: number, missed: number): Tone => {
  if (missed > 0) return "red";
  if (rate >= 80) return "green";
  if (rate >= 50) return "blue";
  return "orange";
};

const getRateLabel = (rate: number, missed: number) => {
  if (missed > 0) return "RECOVER";
  if (rate >= 80) return "EXCELLENT";
  if (rate >= 50) return "ON TRACK";
  if (rate > 0) return "WARM UP";
  return "STANDBY";
};

// Next Task Time Remaining Calculation
const getTimeRemaining = (time: string) => {
  const now = new Date();
  const [hours, minutes] = time.split(":");
  const target = new Date();
  target.setHours(Number(hours), Number(minutes), 0, 0);
  
  const diffMs = target.getTime() - now.getTime();
  if (diffMs < 0) return "Overdue";
  
  const diffMins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

function MetricCard({
  title, value, subtitle, icon: Icon, tone, featured = false,
}: {
  title: string; value: React.ReactNode; subtitle?: React.ReactNode; icon: LucideIcon; tone: Tone; featured?: boolean;
}) {
  const { isDarkMode } = useTheme();
  return (
    <div className={`rounded-[1.6rem] border transition-all backdrop-blur-[18px] ${featured ? "p-4" : "p-3.5 md:p-4"} ${
        isDarkMode ? "bg-white/[0.03] border-white/[0.04] hover:bg-white/[0.045]" : "bg-white/[0.7] border-black/[0.04] hover:bg-white shadow-sm"
      }`}
    >
      <div className={`flex items-center ${featured ? "gap-3" : "gap-2.5"}`}>
        <div className={`flex shrink-0 items-center justify-center rounded-[0.8rem] border ${getToneClasses(tone, isDarkMode)} ${featured ? "h-9 w-9" : "h-8 w-8"}`}>
          <Icon size={featured ? 16 : 14} />
        </div>
        <div className="min-w-0">
          <p className={`text-[11px] font-medium ${isDarkMode ? "text-white/50" : "text-slate-500"}`}>{title}</p>
          <div className={`mt-0.5 font-semibold tracking-[-0.02em] leading-snug ${featured ? "text-[15px]" : "text-sm"} ${isDarkMode ? "text-white" : "text-slate-900"}`}>{value}</div>
        </div>
      </div>
      {subtitle && <p className={`mt-3 text-[11px] font-medium leading-relaxed ${isDarkMode ? "text-white/40" : "text-slate-500"}`}>{subtitle}</p>}
    </div>
  );
}

export default function AnalyticsSidebar({
  analytics, rescheduleTask, rescheduleAllMissed, onStartFocus
}: AnalyticsSidebarProps) {
  const { isDarkMode } = useTheme();
  const [showMobileMetrics, setShowMobileMetrics] = useState(false);

  const {
    today, statusCounts, missedTasks, pendingTasks = [],
    weeklyTrend, consistency, workload,
    yesterdayRate = 68, rate
  } = analytics;

  const pendingToday = Math.max(0, today.total - today.done - today.missed);
  
  const nextTask = pendingTasks.sort((a, b) => {
    const aTarget = new Date(`${a.date}T${a.time}`).getTime();
    const bTarget = new Date(`${b.date}T${b.time}`).getTime();
    if (a.priority === "high" && b.priority !== "high") return -1;
    if (b.priority === "high" && a.priority !== "high") return 1;
    return aTarget - bTarget;
  })[0];

  const rateTone = getRateTone(rate, today.missed);
  const rateLabel = getRateLabel(rate, today.missed);

  const ringColor =
    rateTone === "green" ? "#10b981"
      : rateTone === "blue" ? "#3b82f6"
      : rateTone === "red" ? "#ef4444"
      : "#f97316";

  const surfaceClass = isDarkMode ? "bg-black/[0.72] border-white/[0.04] backdrop-blur-[24px]" : "bg-white/[0.72] border-black/[0.04] backdrop-blur-[24px] shadow-sm";
  const textClass = isDarkMode ? "text-white" : "text-slate-900";
  const mutedClass = isDarkMode ? "text-white/60" : "text-slate-500";
  const faintClass = isDarkMode ? "text-white/40" : "text-slate-400";
  const dividerClass = isDarkMode ? "border-white/[0.04]" : "border-black/[0.04]";

  return (
    <div className="flex w-full flex-col gap-4 pb-10 md:gap-5 font-sans">
      
      {/* FOCUS NOW CARD */}
      {nextTask && (
        <section className={`relative overflow-hidden rounded-[1.6rem] p-5 border shadow-lg ${
          isDarkMode ? "bg-gradient-to-br from-orange-500/10 to-black/40 border-orange-500/20" : "bg-gradient-to-br from-orange-50 to-white border-orange-200"
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>Focus Now</span>
          </div>
          
          <h2 className={`text-lg font-semibold tracking-tight leading-snug mb-1 ${textClass}`}>
            {nextTask.title}
          </h2>
          <div className={`flex items-center gap-2 text-xs font-medium ${mutedClass} mb-4`}>
            <span className="flex items-center gap-1"><Clock size={12}/> {formatTime12Hour(nextTask.time)}</span>
            <span>•</span>
            <span className={nextTask.priority === 'high' ? 'text-orange-500' : ''}>{nextTask.priority} priority</span>
          </div>

          <button 
            onClick={() => onStartFocus && onStartFocus(nextTask)}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-[0_8px_20px_rgba(249,115,22,0.25)] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Play size={14} className="fill-current" /> Start Focus
          </button>
        </section>
      )}

      {/* MISSION CONTROL */}
      <section className={`rounded-[1.6rem] border p-4 md:p-5 ${surfaceClass}`}>
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} className={isDarkMode ? "text-blue-400" : "text-blue-500"} />
          <h2 className={`text-[13px] font-semibold uppercase tracking-wider ${textClass}`}>
            Mission Control
          </h2>
        </div>

        <div className="flex items-start justify-between gap-5 border-b pb-5 mb-5 border-white/[0.04] dark:border-white/[0.04] light:border-black/[0.04]">
          <div className="min-w-0">
            <p className={`text-[11px] font-medium uppercase tracking-wider ${mutedClass}`}>Execution Score</p>
            <div className={`mt-1 text-[2.5rem] font-semibold tracking-[-0.04em] leading-none ${textClass}`}>
              {rate}%
            </div>
            <p className={`mt-2 text-xs font-medium ${mutedClass}`}>
              {today.done} of {today.total} completed
            </p>
          </div>

          <div
            className="relative flex h-[85px] w-[85px] shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${ringColor} ${clamp(rate)}%, ${isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"} ${clamp(rate)}%)`,
              boxShadow: isDarkMode ? `0 0 24px ${ringColor}15` : `0 10px 24px ${ringColor}15`,
            }}
          >
            <div className={`absolute flex h-[71px] w-[71px] flex-col items-center justify-center rounded-full ${isDarkMode ? "bg-black" : "bg-white"}`}>
              <span className={`text-[8px] font-bold uppercase tracking-[0.1em] text-center px-1 leading-tight ${getTextColor(rateTone, isDarkMode)}`}>
                {rateLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <div>
            <p className={`font-medium ${mutedClass}`}>Biggest Risk</p>
            <p className={`mt-1 font-semibold flex items-center gap-1.5 ${today.missed > 0 ? (isDarkMode ? "text-red-400" : "text-red-500") : textClass}`}>
              {today.missed > 0 ? <><ShieldAlert size={12}/> {today.missed} overdue</> : "Low risk right now"}
            </p>
          </div>
          <div>
            <p className={`font-medium ${mutedClass}`}>Momentum</p>
            <p className={`mt-1 font-semibold flex items-center gap-1.5 ${weeklyTrend.diff >= 0 ? (isDarkMode ? "text-emerald-400" : "text-emerald-500") : textClass}`}>
              <TrendingUp size={12}/> {weeklyTrend.diff >= 0 ? `+${weeklyTrend.diff} vs last week` : `${weeklyTrend.diff} vs last week`}
            </p>
          </div>
        </div>
      </section>

      {/* MOBILE TOGGLE */}
      <section className="md:hidden">
        <button
          onClick={() => setShowMobileMetrics((value) => !value)}
          className={`flex w-full items-center justify-between rounded-[1.3rem] border px-4 py-3 text-sm font-medium transition-all ${
            isDarkMode ? "bg-white/[0.03] border-white/[0.04] text-white hover:bg-white/[0.05]" : "bg-black/[0.02] border-black/[0.04] text-slate-900 hover:bg-black/[0.04]"
          }`}
        >
          View Analytics & Radar
          <ChevronDown size={16} className={`transition-transform duration-300 ${showMobileMetrics ? "rotate-180" : ""} ${faintClass}`} />
        </button>
      </section>

      <div className={`space-y-4 md:space-y-5 ${showMobileMetrics ? "block" : "hidden md:block"}`}>
        
        {/* EXECUTION RADAR */}
        <section className={`rounded-[1.6rem] border p-4 md:p-5 ${surfaceClass}`}>
          <div className="flex items-center gap-2 mb-4">
            <Radar size={16} className={isDarkMode ? "text-blue-400" : "text-blue-500"} />
            <h3 className={`text-[13px] font-semibold uppercase tracking-wider ${textClass}`}>Execution Radar</h3>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-[11px] font-medium mb-2">
                <span className={mutedClass}>Mission Progress</span>
                <span className={textClass}>{rate}%</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-white/[0.04]" : "bg-black/[0.04]"}`}>
                <div className={`h-full transition-all duration-700 ease-out ${rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${clamp(rate)}%` }} />
              </div>
              <div className="flex justify-between text-[11px] font-medium mt-2">
                <span className={isDarkMode ? "text-emerald-400" : "text-emerald-600"}>{today.done} Done</span>
                <span className={isDarkMode ? "text-orange-400" : "text-orange-600"}>{pendingToday} Left</span>
                <span className={isDarkMode ? "text-red-400" : "text-red-600"}>{today.missed} Overdue</span>
              </div>
            </div>

            <div className={`h-px w-full ${dividerClass}`} />

            <div className="grid grid-cols-2 gap-y-4 gap-x-3 text-[12px]">
              <div>
                <p className={`font-medium ${mutedClass}`}>Next Task</p>
                <p className={`mt-1 font-semibold truncate ${textClass}`}>{nextTask ? nextTask.title : "Standby"}</p>
              </div>
              <div>
                <p className={`font-medium ${mutedClass}`}>Time Remaining</p>
                <p className={`mt-1 font-semibold ${nextTask && getTimeRemaining(nextTask.time) === "Overdue" ? (isDarkMode ? "text-red-400" : "text-red-600") : textClass}`}>
                  {nextTask ? getTimeRemaining(nextTask.time) : "--"}
                </p>
              </div>
              <div>
                <p className={`font-medium ${mutedClass}`}>Focus Capacity</p>
                <p className={`mt-1 font-semibold ${textClass}`}>{pendingToday} tasks left</p>
              </div>
              <div>
                <p className={`font-medium ${mutedClass}`}>Today's Load</p>
                <p className={`mt-1 font-semibold ${textClass}`}>{workload.label}</p>
              </div>
            </div>
          </div>
        </section>

        {/* RISK RADAR */}
        <section className={`rounded-[1.6rem] border p-4 md:p-5 ${surfaceClass}`}>
          <h3 className={`mb-4 text-[13px] font-semibold uppercase tracking-wider ${textClass}`}>Risk Radar</h3>
          <div className="space-y-2">
            <div className={`flex justify-between items-center p-3 rounded-xl border ${isDarkMode ? "bg-white/[0.02] border-white/[0.04]" : "bg-black/[0.02] border-black/[0.04]"}`}>
              <span className={`text-[13px] font-medium flex items-center gap-2 ${isDarkMode ? "text-red-400" : "text-red-500"}`}>
                <div className="w-2 h-2 rounded-full bg-current" /> Critical Queue
              </span>
              <span className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{statusCounts.missed}</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-xl border ${isDarkMode ? "bg-white/[0.02] border-white/[0.04]" : "bg-black/[0.02] border-black/[0.04]"}`}>
              <span className={`text-[13px] font-medium flex items-center gap-2 ${isDarkMode ? "text-orange-400" : "text-orange-500"}`}>
                <div className="w-2 h-2 rounded-full bg-current" /> Active Today
              </span>
              <span className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{statusCounts.pending}</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-xl border ${isDarkMode ? "bg-white/[0.02] border-white/[0.04]" : "bg-black/[0.02] border-black/[0.04]"}`}>
              <span className={`text-[13px] font-medium flex items-center gap-2 ${isDarkMode ? "text-emerald-400" : "text-emerald-500"}`}>
                <div className="w-2 h-2 rounded-full bg-current" /> Secured
              </span>
              <span className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{statusCounts.completed}</span>
            </div>
          </div>
        </section>

        {/* MOMENTUM & ACHIEVEMENTS */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Momentum"
            value={`${rate}%`}
            subtitle={rate >= yesterdayRate ? "Improving ↗" : "Dropping ↘"}
            icon={Flame}
            tone={rate >= yesterdayRate ? "green" : "orange"}
            featured
          />
          <MetricCard
            title="Consistency"
            value={`${consistency.activeDays} Days`}
            subtitle={`${statusCounts.completed} total won`}
            icon={Award}
            tone="blue"
            featured
          />
        </div>

      </div>

      {/* RECOVERY QUEUE */}
      {missedTasks.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <h3 className={`text-[13px] font-semibold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
              <ShieldAlert size={14}/> Recovery Queue
            </h3>
            {missedTasks.length > 1 && (
              <button
                onClick={rescheduleAllMissed}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all ${
                  isDarkMode
                    ? "bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"
                    : "bg-red-50 text-red-600 hover:bg-red-500 hover:text-white"
                }`}
              >
                <RotateCcw size={12} />
                Recover All
              </button>
            )}
          </div>

          <div className={`overflow-hidden rounded-[1.6rem] border ${
              isDarkMode ? "divide-y divide-white/[0.04] bg-white/[0.02] border-white/[0.04]" : "divide-y divide-black/[0.04] bg-white border-black/[0.04] shadow-sm"
            }`}
          >
            {missedTasks.map((task, index) => (
              <div key={task.id} className={`flex flex-col gap-3 p-4 md:p-5 transition-colors ${
                  isDarkMode ? "hover:bg-white/[0.045]" : "hover:bg-black/[0.02]"
                } ${index === 0 ? (isDarkMode ? "border-l-4 border-red-500/50 bg-red-500/[0.04]" : "border-l-4 border-red-400 bg-red-50/50") : "border-l-4 border-transparent"}`}
              >
                <div className="flex justify-between items-start">
                  <div className="min-w-0 pr-3">
                    <p className={`truncate text-[15px] font-semibold tracking-[-0.01em] ${textClass}`}>
                      {task.title}
                    </p>
                    <p className={`mt-1 text-[11px] font-medium ${isDarkMode ? "text-red-400/80" : "text-red-600/80"}`}>
                      Missed at {formatTime12Hour(task.time)}
                    </p>
                  </div>
                  {index === 0 && (
                    <span className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-[0.15em] ${getToneClasses("red", isDarkMode)}`}>
                      Fix First
                    </span>
                  )}
                </div>

                <div className={`flex items-center justify-between mt-1 pt-3 border-t ${dividerClass}`}>
                  <span className={`text-[11px] font-medium ${mutedClass}`}>
                    Suggested: Tomorrow 9:00 AM
                  </span>
                  <button
                    onClick={() => rescheduleTask(task.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                      isDarkMode ? "bg-white/[0.06] text-white hover:bg-orange-500 hover:text-white" : "bg-black/[0.04] text-slate-700 hover:bg-orange-500 hover:text-white"
                    }`}
                  >
                    <RefreshCcw size={12} /> Recover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}