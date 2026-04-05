import React from "react";
import { Target, TrendingUp, Sparkles, CheckCircle2, ArrowUpRight, ArrowDownRight, Minus, AlertCircle, CalendarClock } from "lucide-react";
import { PlannerEvent } from "./types";

interface AnalyticsSidebarProps {
  analytics: {
    rate: number;
    statusCounts: { completed: number; pending: number; missed: number };
    today: { done: number; total: number; missed: number };
    yesterday: { done: number; total: number };
    missedTasks: PlannerEvent[];
    missedByType: Record<string, number>;
  };
  rescheduleTask: (id: string) => void;
  rescheduleAllMissed: () => void;
}

function MiniStatus({ label, val, color, icon: Icon }: { label: string, val: number, color: string, icon: any }) {
  return (
    <div className="bg-slate-50 border border-slate-100 p-3 md:p-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all hover:bg-slate-100/80">
      <Icon size={16} className={`mb-1 ${color}`} />
      <p className="text-lg md:text-xl font-bold text-slate-800">{val}</p>
      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function AnalyticsSidebar({ analytics, rescheduleTask, rescheduleAllMissed }: AnalyticsSidebarProps) {
  const { today, yesterday, missedTasks, missedByType } = analytics;
  const totalTasks = today.total;
  
  const diff = today.done - yesterday.done;
  const diffPercent = yesterday.done > 0 ? Math.round((Math.abs(diff) / yesterday.done) * 100) : 0;

  const getInsightMessage = () => {
    if (today.total === 0) return "No tasks scheduled today. Add some goals to get started.";
    if (today.done === today.total && today.total > 0) return "Flawless execution! You've completed everything today.";
    
    const topMissedCategory = Object.keys(missedByType)[0];
    if (topMissedCategory && missedTasks.length > 2) {
      return `You seem to be skipping your '${topMissedCategory}' tasks often. Try scheduling them when your energy is highest.`;
    }

    if (diff > 0) return `You're doing better than yesterday (+${diffPercent}%). Keep the momentum going!`;
    if (diff < 0) return `You're tracking slightly behind yesterday. Try knocking out one quick task now.`;
    
    if (today.done > 0 && diff === 0) return "You've matched yesterday's pace. One more task will break the tie.";
    return "Steady progress. Focus on your next pending task.";
  };

  const getTrendBadge = () => {
    if (diff > 0) return { label: "Improving", color: "bg-emerald-50 text-emerald-600", icon: ArrowUpRight };
    if (diff < 0) return { label: "Falling", color: "bg-red-50 text-red-600", icon: ArrowDownRight };
    return { label: "Stable", color: "bg-slate-100 text-slate-500", icon: Minus };
  };

  const TrendBadge = getTrendBadge();
  const topMissedEntries = Object.entries(missedByType).slice(0, 3);

  return (
    <div className="w-full space-y-4 md:space-y-6">
      
      {/* 1. TODAY'S PROGRESS */}
      <div className="bg-white border border-slate-200 p-5 md:p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 text-orange-50 opacity-50 pointer-events-none">
          <Target size={200} />
        </div>

        <div className="relative z-10 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800">Today's Progress</h2>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${TrendBadge.color}`}>
              <TrendBadge.icon size={12} strokeWidth={3} /> {TrendBadge.label}
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-5xl font-black text-slate-900 tracking-tighter">
                {today.done}
              </h3>
              <span className="text-lg font-bold text-slate-400">/ {totalTasks} tasks</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-semibold mt-2">
              {diff > 0 && (
                <span className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">
                  ↑ +{diff} vs yesterday
                </span>
              )}
              {diff < 0 && (
                <span className="inline-flex items-center gap-1 text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
                  ↓ {Math.abs(diff)} vs yesterday
                </span>
              )}
              {diff === 0 && today.done > 0 && (
                <span className="text-slate-400">Same as yesterday</span>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4" />

          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Completion Rate</span>
              <span className={analytics.rate >= 70 ? "text-emerald-500" : "text-orange-500"}>
                {analytics.rate}%
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  analytics.rate >= 70 ? "bg-emerald-500" : 
                  analytics.rate >= 40 ? "bg-orange-500" : 
                  "bg-slate-300"
                }`} 
                style={{ width: `${analytics.rate}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. RECENT MISSED TASKS (Actionable) */}
      <div className="bg-white border border-slate-200 p-5 md:p-6 rounded-[2rem] shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" /> Overdue Tasks
          </h3>
          {missedTasks.length > 1 && (
             <button 
               onClick={rescheduleAllMissed}
               className="text-[10px] font-bold text-orange-500 bg-orange-50 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-full uppercase tracking-wider transition-colors"
             >
               Recover All
             </button>
          )}
        </div>

        {missedTasks.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
            <p className="text-xs font-bold text-emerald-600">No missed tasks! 🎉</p>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-2 scrollbar-hide pr-1">
            {missedTasks.map(task => (
              <div key={task.id} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3.5 rounded-2xl group hover:border-orange-100 transition-colors">
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {task.title}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                    {task.date} • {task.time}
                  </p>
                </div>
                <button 
                  onClick={() => rescheduleTask(task.id)}
                  className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-orange-500 bg-orange-50 hover:bg-orange-500 hover:text-white px-3 py-2 rounded-xl transition-colors shadow-sm"
                >
                  <CalendarClock size={12} /> Fix
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. CATEGORY BLINDSPOTS */}
      {topMissedEntries.length > 0 && (
        <div className="bg-white border border-slate-200 p-5 md:p-6 rounded-[2rem] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Where You Miss Most</h3>
          <div className="space-y-3">
            {topMissedEntries.map(([type, count]) => (
              <div key={type} className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-600">{type}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-400 rounded-full" 
                      style={{ width: `${(count / analytics.statusCounts.missed) * 100}%` }} 
                    />
                  </div>
                  <span className="font-bold text-red-500 w-4 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. GLOBAL BREAKDOWN & INSIGHT */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-5 md:p-6 space-y-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800">Global Breakdown</h3>
        <div className="grid grid-cols-3 gap-2">
          <MiniStatus label="Done" val={analytics.statusCounts.completed} color="text-emerald-500" icon={CheckCircle2} />
          <MiniStatus label="Pending" val={analytics.statusCounts.pending} color="text-orange-500" icon={Target} />
          <MiniStatus label="Missed" val={analytics.statusCounts.missed} color="text-red-500" icon={TrendingUp} />
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3">
          <div className="mt-0.5">
            <Sparkles size={16} className={diff > 0 ? "text-orange-500" : "text-slate-400"} />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-1">AI Insight</h4>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              {getInsightMessage()}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}