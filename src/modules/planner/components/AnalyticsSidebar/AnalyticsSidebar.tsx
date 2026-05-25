"use client";

import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Flame,
  RotateCcw,
  Target,
  TrendingUp,
} from "lucide-react";
import type { PlannerEvent } from "../../types/types";
import { useTheme } from "@/theme/ThemeProvider";

interface AnalyticsSidebarProps {
  analytics: {
    rate: number;
    statusCounts: { completed: number; pending: number; missed: number };
    today: { done: number; total: number; missed: number };
    missedTasks: PlannerEvent[];
    executionPattern: { name: string; window: string };
    weeklyTrend: { completed: number; diff: number };
    consistency: { activeDays: number };
    workload: { label: string; total: number };
    mostDelayed: { category: string; count: number } | null;
  };
  rescheduleTask: (id: string) => void;
  rescheduleAllMissed: () => void;
}

type Tone = "blue" | "green" | "orange" | "red" | "slate";

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

// Softer icon/badge backgrounds for the new glass aesthetic
const getToneClasses = (tone: Tone, isDarkMode: boolean) => {
  const dark = {
    blue: "bg-blue-500/10 text-blue-400 border-transparent",
    green: "bg-emerald-500/10 text-emerald-400 border-transparent",
    orange: "bg-orange-500/10 text-orange-400 border-transparent",
    red: "bg-red-500/10 text-red-400 border-transparent",
    slate: "bg-white/[0.04] text-white/60 border-transparent",
  };

  const light = {
    blue: "bg-blue-500/10 text-blue-600 border-transparent",
    green: "bg-emerald-500/10 text-emerald-600 border-transparent",
    orange: "bg-orange-500/10 text-orange-600 border-transparent",
    red: "bg-red-500/10 text-red-600 border-transparent",
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
    slate: "text-white/70",
  };
  
  const light = {
    blue: "text-blue-600",
    green: "text-emerald-600",
    orange: "text-orange-600",
    red: "text-red-600",
    slate: "text-slate-700",
  };

  return isDarkMode ? dark[tone] : light[tone];
};

const getBarClass = (tone: Tone) => {
  const classes = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
    slate: "bg-slate-400",
  };

  return classes[tone];
};

const formatTrend = (diff: number) => {
  if (diff > 0) return `+${diff} vs last week`;
  if (diff < 0) return `${diff} vs last week`;
  return "Same as last week";
};

const getRateTone = (rate: number, missed: number): Tone => {
  if (missed > 0) return "red";
  if (rate >= 80) return "green";
  if (rate >= 50) return "blue";
  return "orange";
};

const getRateLabel = (rate: number, missed: number) => {
  if (missed > 0) return "Recover";
  if (rate >= 80) return "Good";
  if (rate >= 50) return "On Track";
  return "Warm Up";
};

function StatusMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: Tone;
}) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`rounded-[1.3rem] border px-3 py-3 transition-all ${
        isDarkMode 
          ? "bg-white/[0.03] border-white/[0.04] hover:bg-white/[0.045]" 
          : "bg-black/[0.02] border-black/[0.04] hover:bg-black/[0.03]"
      }`}
    >
      <p className={`text-lg font-semibold tracking-[-0.03em] leading-none ${getTextColor(tone, isDarkMode)}`}>
        {value}
      </p>
      <p className={`mt-1.5 text-[10px] font-medium uppercase tracking-[0.05em] ${isDarkMode ? "text-white/50" : "text-slate-500"}`}>
        {label}
      </p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  percent: number;
  tone: Tone;
}) {
  const { isDarkMode } = useTheme();

  return (
    <div>
      <div
        className={`mb-1.5 flex justify-between text-[11px] font-medium ${
          isDarkMode ? "text-white/50" : "text-slate-500"
        }`}
      >
        <span>{label}</span>
        <span className={getTextColor(tone, isDarkMode)}>
          {value}
        </span>
      </div>

      <div
        className={`h-1.5 overflow-hidden rounded-full ${
          isDarkMode ? "bg-white/[0.04]" : "bg-black/[0.04]"
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getBarClass(
            tone
          )}`}
          style={{ width: `${clamp(percent)}%` }}
        />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
  featured = false,
}: {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon: LucideIcon;
  tone: Tone;
  featured?: boolean;
}) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`rounded-[1.6rem] border transition-all backdrop-blur-[18px] ${
        featured ? "p-4" : "p-3.5 md:p-4"
      } ${
        isDarkMode
          ? "bg-white/[0.03] border-white/[0.04] hover:bg-white/[0.045]"
          : "bg-white/[0.7] border-black/[0.04] hover:bg-white shadow-sm"
      }`}
    >
      <div
        className={`flex items-center ${
          featured ? "gap-3" : "gap-2.5"
        }`}
      >
        <div
          className={`flex shrink-0 items-center justify-center rounded-[0.8rem] border ${getToneClasses(
            tone,
            isDarkMode
          )} ${featured ? "h-9 w-9" : "h-8 w-8"}`}
        >
          <Icon size={featured ? 16 : 14} />
        </div>

        <div className="min-w-0">
          <p
            className={`text-[11px] font-medium ${
              isDarkMode ? "text-white/50" : "text-slate-500"
            }`}
          >
            {title}
          </p>
          <p
            className={`mt-0.5 truncate font-semibold tracking-[-0.02em] leading-snug ${
              featured ? "text-[15px]" : "text-sm"
            } ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            {value}
          </p>
        </div>
      </div>

      {subtitle && (
        <p
          className={`mt-3 text-[11px] font-medium leading-relaxed ${
            isDarkMode ? "text-white/40" : "text-slate-500"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function AnalyticsSidebar({
  analytics,
  rescheduleTask,
  rescheduleAllMissed,
}: AnalyticsSidebarProps) {
  const { isDarkMode } = useTheme();
  const [showMobileMetrics, setShowMobileMetrics] = useState(false);

  const {
    today,
    statusCounts,
    missedTasks,
    executionPattern,
    weeklyTrend,
    consistency,
    workload,
    mostDelayed,
  } = analytics;

  const pendingToday = Math.max(0, today.total - today.done - today.missed);
  const globalTotal = Math.max(
    1,
    statusCounts.completed + statusCounts.pending + statusCounts.missed
  );

  const globalDonePct = (statusCounts.completed / globalTotal) * 100;
  const globalPendingPct = (statusCounts.pending / globalTotal) * 100;
  const globalMissedPct = (statusCounts.missed / globalTotal) * 100;

  const rateTone = getRateTone(analytics.rate, today.missed);
  const rateLabel = getRateLabel(analytics.rate, today.missed);

  const ringColor =
    rateTone === "green"
      ? "#10b981"
      : rateTone === "blue"
      ? "#3b82f6"
      : rateTone === "red"
      ? "#ef4444"
      : "#f97316";

  const insight =
    today.total === 0
      ? {
          summary: "No tasks planned for today.",
          detail: "Your planner is clear, but there is no execution signal yet.",
          next: "Schedule one priority block to create momentum.",
        }
      : today.missed > 0
      ? {
          summary: "Recovery is the priority today.",
          detail: `${today.missed} task${
            today.missed > 1 ? "s" : ""
          } slipped from the plan.`,
          next: "Recover the missed queue before adding more load.",
        }
      : analytics.rate >= 80
      ? {
          summary: "Your execution rhythm is strong.",
          detail: "Completion is outpacing backlog.",
          next: "Protect this window and keep the next task small.",
        }
      : pendingToday > 0
      ? {
          summary: "You're making progress.",
          detail: `${pendingToday} task${
            pendingToday > 1 ? "s" : ""
          } still need attention.`,
          next: "Clear the smallest pending task.",
        }
      : {
          summary: "The day is under control.",
          detail: "No missed work is currently blocking the plan.",
          next: "Use the next planning pass to protect tomorrow.",
        };

  // Base luxury floating surface
  const surfaceClass = isDarkMode
    ? "bg-black/[0.72] border-white/[0.04] backdrop-blur-[24px]"
    : "bg-white/[0.72] border-black/[0.04] backdrop-blur-[24px] shadow-sm";

  const softSurfaceClass = isDarkMode
    ? "bg-white/[0.03] border-white/[0.04]"
    : "bg-black/[0.02] border-black/[0.04]";

  const textClass = isDarkMode ? "text-white" : "text-slate-900";
  const mutedClass = isDarkMode ? "text-white/60" : "text-slate-500";
  const faintClass = isDarkMode ? "text-white/40" : "text-slate-400";
  const dividerClass = isDarkMode ? "border-white/[0.04]" : "border-black/[0.04]";

  return (
    <div className="flex w-full flex-col gap-4 pb-10 md:gap-5 font-sans">
      
      {/* TODAY OVERVIEW */}
      <section className={`rounded-[1.6rem] border p-4 md:p-5 ${surfaceClass}`}>
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Activity size={16} className={isDarkMode ? "text-blue-400" : "text-blue-500"} />
              <h2 className={`text-[13px] font-semibold ${textClass}`}>
                Today Overview
              </h2>
            </div>

            <div className={`mt-4 text-[2.5rem] font-semibold tracking-[-0.04em] leading-none ${textClass}`}>
              {analytics.rate}%
            </div>

            <p className={`mt-3 text-[13px] font-medium ${textClass}`}>
              {today.done} / {today.total} complete
            </p>

            <p className={`mt-1 text-xs font-medium ${mutedClass}`}>
              {pendingToday} pending • {today.missed} missed
            </p>
          </div>

          <div
            className="relative flex h-[90px] w-[90px] shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${ringColor} ${clamp(
                analytics.rate
              )}%, ${
                isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"
              } ${clamp(analytics.rate)}%)`,
              boxShadow: isDarkMode
                ? `0 0 24px ${ringColor}15`
                : `0 10px 24px ${ringColor}15`,
            }}
          >
            <div
              className={`absolute flex h-[74px] w-[74px] flex-col items-center justify-center rounded-full ${
                isDarkMode ? "bg-black" : "bg-white"
              }`}
            >
              <span
                className={`text-[8px] font-semibold uppercase tracking-[0.15em] ${getTextColor(rateTone, isDarkMode)}`}
              >
                {rateLabel}
              </span>
              <span className={`mt-0.5 text-base font-semibold tracking-[-0.02em] ${textClass}`}>
                {analytics.rate}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE TOGGLE */}
      <section className="md:hidden">
        <button
          onClick={() => setShowMobileMetrics((value) => !value)}
          className={`flex w-full items-center justify-between rounded-[1.3rem] border px-4 py-3 text-sm font-medium transition-all ${
            isDarkMode 
              ? "bg-white/[0.03] border-white/[0.04] text-white hover:bg-white/[0.05]" 
              : "bg-black/[0.02] border-black/[0.04] text-slate-900 hover:bg-black/[0.04]"
          }`}
        >
          View Analytics
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${
              showMobileMetrics ? "rotate-180" : ""
            } ${faintClass}`}
          />
        </button>
      </section>

      {/* METRICS & BREAKDOWN */}
      <section
        className={`space-y-4 md:space-y-5 ${
          showMobileMetrics ? "block" : "hidden md:block"
        }`}
      >
        <div>
          <h3 className={`mb-3 text-[13px] font-semibold ${textClass}`}>
            Quick Metrics
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <StatusMetric
              label="Done"
              value={statusCounts.completed}
              tone="green"
            />
            <StatusMetric
              label="Pending"
              value={statusCounts.pending}
              tone="blue"
            />
            <StatusMetric
              label="Missed"
              value={statusCounts.missed}
              tone="red"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Consistency"
            value={`${consistency.activeDays} active days`}
            subtitle="Last 7 days"
            icon={Flame}
            tone={consistency.activeDays >= 5 ? "green" : "orange"}
            featured
          />
          <MetricCard
            title="This Week"
            value={`${weeklyTrend.completed} done`}
            subtitle={formatTrend(weeklyTrend.diff)}
            icon={TrendingUp}
            tone={weeklyTrend.diff >= 0 ? "green" : "red"}
            featured
          />
          <MetricCard
            title="Pattern"
            value={executionPattern.name}
            subtitle={executionPattern.window}
            icon={Clock3}
            tone="blue"
          />
          <MetricCard
            title="Load"
            value={workload.label}
            subtitle={`${workload.total} tasks planned`}
            icon={BarChart3}
            tone={
              workload.total > 8
                ? "red"
                : workload.total < 4
                ? "orange"
                : "blue"
            }
          />
        </div>

        <div className={`rounded-[1.6rem] border p-4 md:p-5 ${surfaceClass}`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className={`text-[13px] font-semibold ${textClass}`}>
              Status Breakdown
            </h3>
            <span
              className={`rounded-md border px-2 py-1 text-[9px] font-medium uppercase tracking-[0.15em] ${getToneClasses(
                today.missed > 0 || mostDelayed ? "red" : "green",
                isDarkMode
              )}`}
            >
              {today.missed > 0 || mostDelayed ? "Needs Attention" : "Stable"}
            </span>
          </div>

          <div className="space-y-4">
            <ProgressRow
              label="Completed"
              value={statusCounts.completed}
              percent={globalDonePct}
              tone="green"
            />
            <ProgressRow
              label="Pending"
              value={statusCounts.pending}
              percent={globalPendingPct}
              tone="blue"
            />
            <ProgressRow
              label="Missed"
              value={statusCounts.missed}
              percent={globalMissedPct}
              tone="red"
            />
          </div>
        </div>
      </section>

      {/* INSIGHT CARD */}
      <section className={`rounded-[1.6rem] border p-4 md:p-5 ${surfaceClass}`}>
        <div className="flex items-start gap-3.5">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] border ${getToneClasses(
              today.missed > 0 || mostDelayed ? "red" : "green",
              isDarkMode
            )}`}
          >
            {today.missed > 0 || mostDelayed ? (
              <AlertTriangle size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )}
          </div>

          <div className="min-w-0">
            <h3 className={`text-[13px] font-semibold ${textClass}`}>
              Today's Insight
            </h3>
            <p className={`mt-2.5 text-[13px] font-medium leading-relaxed ${isDarkMode ? "text-white/90" : "text-slate-900/90"}`}>
              {insight.summary}
            </p>
            <p className={`mt-1 text-xs font-medium leading-relaxed ${mutedClass}`}>
              {insight.detail}
            </p>

            <div className={`mt-4 border-t pt-3.5 ${dividerClass}`}>
              <p className={`text-xs font-medium leading-relaxed ${textClass}`}>
                <span className={faintClass}>Next:</span> {insight.next}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
              <div className={`rounded-xl border p-3 transition-colors ${softSurfaceClass}`}>
                <p className={`font-medium ${mutedClass}`}>Energy</p>
                <p className={`mt-1 font-semibold ${textClass}`}>
                  {analytics.rate >= 80
                    ? "High Stability"
                    : analytics.rate >= 50
                    ? "Moderate"
                    : "Low Momentum"}
                </p>
              </div>

              <div className={`rounded-xl border p-3 transition-colors ${softSurfaceClass}`}>
                <p className={`font-medium ${mutedClass}`}>Risk</p>
                <p
                  className={`mt-1 font-semibold ${
                    mostDelayed ? (isDarkMode ? "text-red-400" : "text-red-500") : (isDarkMode ? "text-emerald-400" : "text-emerald-500")
                  }`}
                >
                  {mostDelayed ? mostDelayed.category : "Low"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECOVERY QUEUE */}
      {missedTasks.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <h3 className={`text-[13px] font-semibold ${textClass}`}>
              Recovery Queue
            </h3>

            {missedTasks.length > 1 && (
              <button
                onClick={rescheduleAllMissed}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all ${
                  isDarkMode
                    ? "bg-orange-500/12 text-orange-400 hover:bg-orange-500 hover:text-white"
                    : "bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white"
                }`}
              >
                <RotateCcw size={12} />
                Recover All
              </button>
            )}
          </div>

          <div
            className={`overflow-hidden rounded-[1.6rem] border ${
              isDarkMode
                ? "divide-y divide-white/[0.04] bg-white/[0.02] border-white/[0.04]"
                : "divide-y divide-black/[0.04] bg-white border-black/[0.04] shadow-sm"
            }`}
          >
            {missedTasks.map((task, index) => (
              <div
                key={task.id}
                className={`flex items-center justify-between gap-4 p-4 md:p-5 transition-colors ${
                  isDarkMode ? "hover:bg-white/[0.045]" : "hover:bg-black/[0.02]"
                } ${
                  index === 0
                    ? isDarkMode
                      ? "border-l-4 border-orange-500/50 bg-orange-500/[0.04]"
                      : "border-l-4 border-orange-400 bg-orange-50/50"
                    : "border-l-4 border-transparent"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-sm font-medium tracking-[-0.01em] ${textClass}`}>
                      {task.title}
                    </p>

                    {index === 0 && (
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.15em] ${getToneClasses(
                          "orange",
                          isDarkMode
                        )}`}
                      >
                        Recover next
                      </span>
                    )}
                  </div>

                  <p className={`mt-1.5 text-[11px] font-medium ${mutedClass}`}>
                    {task.time} • {task.type}
                  </p>
                </div>

                <button
                  onClick={() => rescheduleTask(task.id)}
                  className={`shrink-0 rounded-[0.9rem] p-2.5 transition-all ${
                    isDarkMode
                      ? "bg-white/[0.04] text-white/50 hover:bg-orange-500 hover:text-white"
                      : "bg-black/[0.03] text-slate-500 hover:bg-orange-500 hover:text-white"
                  }`}
                  title="Reschedule task"
                  aria-label={`Reschedule ${task.title}`}
                >
                  <CalendarClock size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}