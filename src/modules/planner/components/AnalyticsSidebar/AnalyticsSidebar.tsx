"use client";

import React from "react";
import { CalendarClock } from "lucide-react";
import { PlannerEvent } from "../../types/types";
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

// Minimal static block for core grid
function StatCard({ title, value, subtitle }: { title: string, value: React.ReactNode, subtitle?: React.ReactNode }) {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`p-5 rounded-[1.5rem] border ${isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-slate-200"}`}>
      <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>
        {title}
      </h3>
      <p className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
        {value}
      </p>
      {subtitle && (
        <p className={`text-xs font-medium mt-1 ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function AnalyticsSidebar({ analytics, rescheduleTask, rescheduleAllMissed }: AnalyticsSidebarProps) {
  const { isDarkMode } = useTheme();
  const { 
    today, 
    statusCounts, 
    missedTasks,
    executionPattern,
    weeklyTrend,
    consistency,
    workload,
    mostDelayed 
  } = analytics;
  
  const pendingToday = today.total - today.done - today.missed;

  return (
    <div className="w-full space-y-8 flex flex-col pb-10">
      
      {/* TODAY OVERVIEW (Hero) */}
      <section className="space-y-4">
        <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>
          Today
        </h3>
        
        <div className={`p-6 rounded-[1.5rem] border ${isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-slate-200"}`}>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className={`text-4xl font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {today.done} <span className={isDarkMode ? "text-gray-600" : "text-slate-400"}>/ {today.total}</span>
              </h2>
              <p className={`text-xs font-medium mt-1.5 ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>
                Completed
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {analytics.rate}%
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>
                Rate
              </p>
            </div>
          </div>

          {/* Minimal Progress Bar */}
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-slate-100"}`}>
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out ${isDarkMode ? "bg-white" : "bg-slate-900"}`} 
              style={{ width: `${analytics.rate}%` }} 
            />
          </div>

          <div className={`mt-5 pt-5 flex items-center justify-between border-t ${isDarkMode ? "border-gray-800" : "border-slate-100"}`}>
            <div className="flex gap-4">
              <p className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>
                {pendingToday} pending
              </p>
              <p className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>
                {today.missed} missed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE ANALYTICS GRID */}
      <section className="grid grid-cols-2 gap-3">
        <StatCard 
          title="Execution Pattern" 
          value={executionPattern.name} 
          subtitle={executionPattern.window} 
        />
        
        <StatCard 
          title="This Week" 
          value={`${weeklyTrend.completed} completed`} 
          subtitle={
            weeklyTrend.diff > 0 ? `+${weeklyTrend.diff} vs last week` : 
            weeklyTrend.diff < 0 ? `${weeklyTrend.diff} vs last week` : 
            "Same as last week"
          } 
        />
        
        <StatCard 
          title="Consistency" 
          value={`${consistency.activeDays} active days`} 
          subtitle="This week" 
        />
        
        <StatCard 
          title="Today's Load" 
          value={workload.label} 
          subtitle={`${workload.total} tasks planned`} 
        />
        
        <div className="col-span-2">
          <StatCard 
            title="Needs Attention" 
            value={mostDelayed ? `${mostDelayed.category} — ${mostDelayed.count} missed` : "No recurring misses"} 
            subtitle={mostDelayed ? "Most delayed category" : "You're on track"} 
          />
        </div>
      </section>

      {/* RECOVERY QUEUE */}
      {missedTasks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>
              Recovery Queue
            </h3>
            {missedTasks.length > 1 && (
              <button 
                onClick={rescheduleAllMissed}
                className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isDarkMode ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Recover All
              </button>
            )}
          </div>

          <div className={`rounded-[1.5rem] border divide-y overflow-hidden ${
            isDarkMode ? "bg-[#111111] border-gray-800 divide-gray-800" : "bg-white border-slate-200 divide-slate-100"
          }`}>
            {missedTasks.map(task => (
              <div key={task.id} className="p-4 flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <p className={`text-sm font-semibold truncate ${isDarkMode ? "text-gray-200" : "text-slate-800"}`}>
                    {task.title}
                  </p>
                  <p className={`text-[10px] font-medium mt-1.5 uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>
                    {task.time} — {task.type}
                  </p>
                </div>
                <button 
                  onClick={() => rescheduleTask(task.id)}
                  className={`shrink-0 p-2.5 rounded-xl transition-colors border ${
                    isDarkMode 
                      ? "bg-[#0a0a0a] text-gray-400 border-gray-800 hover:bg-white hover:text-black hover:border-white" 
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                  }`}
                  title="Reschedule Task"
                >
                  <CalendarClock size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GLOBAL BREAKDOWN */}
      <section className="space-y-4">
        <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>
          Global Breakdown
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className={`p-4 rounded-[1.5rem] border flex flex-col justify-between ${
            isDarkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-slate-50 border-slate-200"
          }`}>
            <p className={`text-2xl font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{statusCounts.completed}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Done</p>
          </div>
          <div className={`p-4 rounded-[1.5rem] border flex flex-col justify-between ${
            isDarkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-slate-50 border-slate-200"
          }`}>
            <p className={`text-2xl font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{statusCounts.pending}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Pending</p>
          </div>
          <div className={`p-4 rounded-[1.5rem] border flex flex-col justify-between ${
            isDarkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-slate-50 border-slate-200"
          }`}>
            <p className={`text-2xl font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{statusCounts.missed}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Missed</p>
          </div>
        </div>
      </section>

    </div>
  );
}