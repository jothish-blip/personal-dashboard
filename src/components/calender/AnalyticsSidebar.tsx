import React, { useState, useEffect } from "react";
import { 
  Target, TrendingUp, Sparkles, CheckCircle2, 
  ArrowUpRight, ArrowDownRight, Minus, 
  AlertCircle, CalendarClock, Zap, BarChart2, X
} from "lucide-react";
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

// Clickable, micro-interactive mini status cards
function MiniStatus({ label, val, color, icon: Icon }: { label: string, val: number, color: string, icon: any }) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md hover:border-slate-300 active:scale-95">
      <Icon size={16} className={`mb-1 ${color}`} />
      <p className="text-xl font-bold text-slate-900">{val}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}

// ----------------------------------------------------------------------
// CORE CONTENT: Extracted to be used in both Desktop and Mobile views
// ----------------------------------------------------------------------
function AnalyticsSidebarContent({ analytics, rescheduleTask, rescheduleAllMissed }: AnalyticsSidebarProps) {
  const { today, yesterday, missedTasks, missedByType } = analytics;
  const totalTasks = today.total;
  
  const diff = today.done - yesterday.done;
  const diffPercent = yesterday.done > 0 ? Math.round((Math.abs(diff) / yesterday.done) * 100) : 0;
  
  const topMissedCategory = Object.keys(missedByType)[0];

  const getInsightMessage = () => {
    if (today.total === 0) return "No tasks planned today. Start with one small task to build momentum.";
    if (today.missed >= 3) return "You're missing multiple tasks today. Try reducing load or spacing tasks better.";
    if (analytics.rate === 100 && today.total > 0) return "Perfect execution today. Maintain this rhythm.";
    if (today.missed > 0 && today.done === 0) return "You're falling behind. Start with the easiest pending task now.";
    if (diff > 0) return `Better than yesterday (+${diffPercent}%). Keep pushing forward.`;
    if (diff < 0) return `You're slightly behind yesterday. Focus on one quick win.`;
    return "You're on track. Continue your next task.";
  };

  const getTrendBadge = () => {
    if (diff > 0) return { label: "Improving", color: "bg-emerald-100 text-emerald-700", icon: ArrowUpRight };
    if (diff < 0) return { label: "Falling", color: "bg-red-100 text-red-700", icon: ArrowDownRight };
    return { label: "Stable", color: "bg-slate-200 text-slate-600", icon: Minus };
  };

  const TrendBadge = getTrendBadge();
  const predictiveScore = analytics.rate > 0 ? Math.min(100, Math.round(analytics.rate * 1.15)) : 0;

  return (
    <div className="w-full space-y-6">
      
      {/* HEADER: SYSTEM STATE & STREAK SYSTEM */}
      <div className="flex items-center justify-between px-2 pt-2 snap-start">
        <p className="text-xs text-slate-400 font-medium">
          {analytics.rate > 70 ? "Execution Mode ✨" : "Planning Mode 🎯"}
        </p>
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm transition-all hover:shadow-md cursor-pointer">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Streak
          </span>
          <span className="text-xs font-black text-orange-600">
            🔥 3 Days
          </span>
        </div>
      </div>

      {/* TODAY'S PROGRESS & MINI TREND GRAPH */}
      <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-[2rem] relative overflow-hidden transition-all duration-300 ease-out hover:shadow-md snap-start">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 text-slate-50 opacity-80 pointer-events-none">
          <Target size={200} />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800">Today's Progress</h2>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${TrendBadge.color}`}>
              <TrendBadge.icon size={12} strokeWidth={3} /> {TrendBadge.label}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">
              Tasks Completed Today
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-none">
                {today.done}
              </h3>
              <span className="text-lg font-bold text-slate-400">/ {totalTasks}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Completion Rate</span>
              <span className={analytics.rate >= 70 ? "text-emerald-600" : "text-orange-600"}>{analytics.rate}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  analytics.rate >= 70 ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : 
                  analytics.rate >= 40 ? "bg-gradient-to-r from-orange-400 to-orange-500" : "bg-gradient-to-r from-slate-300 to-slate-400"
                }`} 
                style={{ width: `${analytics.rate}%` }} 
              />
            </div>
          </div>

          {/* MINI TREND GRAPH (Interactive) */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Last 7 Days Trend
            </p>
            <div className="flex items-end gap-1.5 h-14 group">
              {[40, 60, 20, 80, 50, 90, analytics.rate].map((val, i) => (
                <div
                  key={i}
                  onClick={() => console.log(`Filter tasks for day ${i}`)}
                  className={`flex-1 rounded-sm cursor-pointer transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-sm ${
                    i === 6 ? "bg-gradient-to-t from-orange-400 to-orange-500" : "bg-gradient-to-t from-slate-200 to-slate-300 hover:from-orange-300 hover:to-orange-400"
                  }`}
                  style={{ height: `${Math.max(val, 5)}%` }} 
                  title={`Completion: ${val}%`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* OVERDUE TASKS & FAILURE PATTERN DETECTOR */}
      <div className="bg-red-50/40 border border-red-100 p-6 rounded-[2rem] space-y-4 transition-all duration-300 ease-out hover:shadow-sm snap-start">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" /> Overdue Tasks
          </h3>
          {missedTasks.length > 1 && (
             <button 
               onClick={rescheduleAllMissed} 
               className="bg-orange-500 text-white hover:bg-orange-600 px-4 py-1.5 rounded-full text-[10px] font-bold shadow-sm shadow-orange-500/20 transition-all active:scale-95 uppercase tracking-wider"
             >
               Recover All
             </button>
          )}
        </div>

        {/* FAILURE PATTERN DETECTOR */}
        {topMissedCategory && missedTasks.length >= 2 && (
          <div className="bg-white border border-red-100 p-3.5 rounded-2xl text-xs transition-all duration-300 hover:-translate-y-0.5 shadow-sm">
            <p className="font-bold text-red-600 mb-1 flex items-center gap-1.5">
              <AlertCircle size={14} /> Pattern Detected
            </p>
            <p className="text-slate-600 font-medium">
              You often miss <span className="font-bold text-red-500">"{topMissedCategory}"</span> tasks. Consider rescheduling them.
            </p>
          </div>
        )}

        {missedTasks.length === 0 ? (
          <div className="bg-white/60 border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-slate-500">No missed tasks — you're executing well. 🎉</p>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-2 scrollbar-hide pr-1">
            {missedTasks.map(task => (
              <div key={task.id} className="flex justify-between items-center bg-white border-y border-r border-l-4 border-l-red-400 border-y-slate-200 border-r-slate-200 shadow-sm p-4 rounded-2xl group transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-r-red-200 hover:border-y-red-200">
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-bold text-slate-800 truncate flex items-center gap-2">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] text-red-500 font-black uppercase bg-red-50 px-1.5 py-0.5 rounded">
                      Overdue
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {task.time}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => rescheduleTask(task.id)}
                  className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-500 hover:text-white px-3 py-2 rounded-xl transition-colors shadow-sm active:scale-95"
                >
                  <CalendarClock size={12} /> Fix
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BREAKDOWN & TIME DISTRIBUTION */}
      <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 space-y-5 transition-all duration-300 ease-out hover:shadow-sm snap-start">
        <h3 className="text-sm font-bold text-slate-800">Global Breakdown</h3>
        <div className="grid grid-cols-3 gap-3">
          <MiniStatus label="Done" val={analytics.statusCounts.completed} color="text-emerald-500" icon={CheckCircle2} />
          <MiniStatus label="Pending" val={analytics.statusCounts.pending} color="text-orange-500" icon={Target} />
          <MiniStatus label="Missed" val={analytics.statusCounts.missed} color="text-red-500" icon={TrendingUp} />
        </div>

        {/* TIME DISTRIBUTION BAR */}
        {Object.keys(missedByType).length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Missed By Category</p>
            <div className="space-y-3">
              {Object.entries(missedByType).slice(0,3).map(([type, count]) => (
                <div key={type} className="group cursor-pointer">
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                    <span>{type}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-400 group-hover:bg-orange-500 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
                      style={{ width: `${(count / (analytics.statusCounts.missed || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* INTELLIGENCE GRID: ENERGY ZONE & PREDICTIVE SCORE */}
      <div className="grid grid-cols-2 gap-4 snap-start">
        <div className="bg-slate-900 text-white rounded-[1.5rem] p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap size={12} className="text-orange-400" /> Peak Energy
          </p>
          <p className="text-xs font-medium text-slate-200 leading-relaxed">
            You perform best between <span className="text-orange-400 font-bold">10AM – 1PM</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingUp size={12} className="text-emerald-500" /> Prediction
          </p>
          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            At this pace, you'll complete <span className="text-emerald-600 font-bold">~{predictiveScore}%</span> today.
          </p>
        </div>
      </div>

      {/* FOCUS SUGGESTION & INSIGHT */}
      <div className="space-y-3 snap-start pb-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="mt-0.5">
            <Sparkles size={16} className={diff > 0 ? "text-emerald-500" : diff < 0 ? "text-red-400" : "text-slate-400"} />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-1">AI Insight</h4>
            <p className={`text-xs font-semibold leading-relaxed ${
              diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-slate-500"
            }`}>
              {getInsightMessage()}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 flex gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="mt-0.5"><Target size={16} className="text-orange-600" /></div>
          <div className="w-full">
            <h4 className="text-[10px] font-bold text-orange-800 uppercase tracking-wider mb-1">Focus Suggestion</h4>
            <p className="text-xs font-semibold text-orange-700">
              {missedTasks.length > 0 ? `Start with: ${missedTasks[0].title}` : today.total > today.done ? "Pick one pending task and complete it now." : "You're all caught up. Plan your next move."}
            </p>
            {(missedTasks.length > 0 || (today.total > today.done)) && (
              <button className="mt-3 w-full text-[11px] font-bold bg-orange-500 hover:bg-orange-600 transition-colors text-white px-4 py-2.5 rounded-xl shadow-sm active:scale-95">
                Start Next Action
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

// ----------------------------------------------------------------------
// MAIN EXPORT: Handles Desktop Sidebar + Mobile Bottom Sheet / FAB Logic
// ----------------------------------------------------------------------
export default function AnalyticsSidebar(props: AnalyticsSidebarProps) {
  const [showMobileAnalytics, setShowMobileAnalytics] = useState(false);

  // Auto-open on mobile if there are missed tasks today (runs once on mount)
  useEffect(() => {
    if (props.analytics.today.missed > 0) {
      setShowMobileAnalytics(true);
    }
  }, []);

  return (
    <>
      {/* 💻 DESKTOP VIEW: Inline Static Sidebar */}
      <div className="hidden lg:block w-full h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide">
        <AnalyticsSidebarContent {...props} />
      </div>

      {/* 📱 MOBILE VIEW: Floating Action Button (FAB) */}
      <button
        onClick={() => setShowMobileAnalytics(true)}
        className="lg:hidden fixed bottom-6 right-6 z-[60] bg-slate-900 text-white p-4 rounded-full shadow-xl shadow-slate-900/30 active:scale-95 transition-transform hover:bg-slate-800"
      >
        <BarChart2 size={24} />
        {props.analytics.today.missed > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-slate-900 shadow-sm animate-pulse">
            {props.analytics.today.missed}
          </span>
        )}
      </button>

      {/* 📱 MOBILE VIEW: Bottom Sheet Drawer */}
      {showMobileAnalytics && (
        <div className="fixed inset-0 z-[70] flex items-end lg:hidden">
          
          {/* Backdrop (Swipe down / Click to close) */}
          <div 
            onClick={() => setShowMobileAnalytics(false)} 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in" 
          />
          
          {/* Sheet Body */}
          <div className="relative w-full max-h-[85vh] bg-white rounded-t-[2rem] p-5 overflow-y-auto animate-in slide-in-from-bottom-full duration-300 shadow-2xl flex flex-col">
            
            {/* Handle */}
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 shrink-0" />
            
            {/* Mobile Header */}
            <div className="flex justify-between items-center mb-5 shrink-0">
              <h2 className="text-xl font-bold text-slate-900">Analytics</h2>
              <button 
                onClick={() => setShowMobileAnalytics(false)} 
                className="p-2 bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Reused Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide -mx-5 px-5 pb-8 snap-y snap-mandatory">
              <AnalyticsSidebarContent {...props} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}