"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, CheckCircle2, Circle, Pencil, Trash2, 
  Target, ChevronDown, ChevronRight, CalendarDays,
  Clock, AlertCircle, ArrowRight, RefreshCcw, Check
} from "lucide-react";
import { PlannerEvent, SystemLog } from "../../types/types";
import { useTheme } from "@/theme/ThemeProvider";

export type TabType = "today" | "yesterday" | "tomorrow" | "objectives" | "range" | "logs";

interface EventListProps {
  activeTab: TabType; 
  setActiveTab: (tab: TabType) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filteredEvents: PlannerEvent[];
  logs: SystemLog[];
  toggleStatus: (id: string) => void;
  deleteWithUndo: (id: string) => void;
  onEdit: (ev: PlannerEvent) => void;
  onAddClick: () => void;
  getDateLabel: (dateStr: string) => string;
  onReschedule?: (id: string) => void; // Added for Recovery CTA
}

const formatTime12Hour = (time?: string) => {
  if (!time) return "No time";
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getActionLabel = (action: string) => {
  switch (action) {
    case "CREATE": return "Created task";
    case "UPDATE": return "Updated task";
    case "DELETE": return "Deleted task";
    case "STATUS_TOGGLE": return "Completed task";
    case "RESCHEDULE": return "Rescheduled task";
    default: return action;
  }
};

// 1. Live Countdown Engine
const getEventStatusInfo = (date: string, time: string, status: string, isDarkMode: boolean) => {
  if (status === "completed") {
    return {
      label: "✓ Completed",
      colorClass: isDarkMode ? "text-emerald-400 bg-emerald-500/10" : "text-emerald-700 bg-emerald-50",
      borderClass: isDarkMode ? "border-emerald-500/20" : "border-emerald-200",
      urgency: "completed",
      isOverdue: false
    };
  }

  const now = new Date();
  const target = new Date(`${date}T${time}`);
  const diff = target.getTime() - now.getTime();

  if (diff < 0 || status === "missed") {
    const overdue = Math.abs(diff);
    const mins = Math.floor(overdue / 60000);
    const hrs = Math.floor(mins / 60);

    const label = hrs > 24 ? `${Math.floor(hrs / 24)}d overdue` : `${hrs}h ${mins % 60}m overdue`;
    return {
      label,
      colorClass: isDarkMode ? "text-red-400 bg-red-500/10" : "text-red-600 bg-red-50",
      borderClass: isDarkMode ? "border-red-500/30" : "border-red-300",
      urgency: "critical",
      isOverdue: true
    };
  }

  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);

  if (hrs < 1) {
    return {
      label: `Due in ${mins}m`,
      colorClass: isDarkMode ? "text-red-400 bg-red-500/10" : "text-red-600 bg-red-50",
      borderClass: isDarkMode ? "border-red-500/30" : "border-red-300",
      urgency: "critical",
      isOverdue: false
    };
  }

  if (hrs < 2) {
    return {
      label: `Due in ${hrs}h ${mins % 60}m`,
      colorClass: isDarkMode ? "text-orange-400 bg-orange-500/10" : "text-orange-600 bg-orange-50",
      borderClass: isDarkMode ? "border-orange-500/30" : "border-orange-300",
      urgency: "warning",
      isOverdue: false
    };
  }

  if (hrs < 24) {
    return {
      label: `Due in ${hrs}h ${mins % 60}m`,
      colorClass: isDarkMode ? "text-blue-400 bg-blue-500/10" : "text-blue-600 bg-blue-50",
      borderClass: isDarkMode ? "border-blue-500/20" : "border-blue-200",
      urgency: "safe",
      isOverdue: false
    };
  }

  return {
    label: `${Math.floor(hrs / 24)}d left`,
    colorClass: isDarkMode ? "text-slate-400 bg-white/[0.04]" : "text-slate-600 bg-black/[0.03]",
    borderClass: isDarkMode ? "border-white/[0.1]" : "border-black/[0.1]",
    urgency: "safe",
    isOverdue: false
  };
};

export default function EventList({
  activeTab, setActiveTab, searchQuery, setSearchQuery, filteredEvents, logs, toggleStatus, deleteWithUndo, onEdit, onAddClick, getDateLabel, onReschedule
}: EventListProps) {
  
  const { isDarkMode } = useTheme();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [range, setRange] = useState({ start: "", end: "" });
  
  // Force re-render every minute for live countdowns
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleCollapse = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const today = new Date();
  const getDateStr = (d: Date) => {
    const copy = new Date(d);
    copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
    return copy.toISOString().split("T")[0];
  };
  const todayStr = getDateStr(today);

  // 9. Sort by Urgency Engine
  const getUrgencyWeight = (ev: PlannerEvent) => {
    if (ev.status === "completed") return -1000;
    
    let score = 0;
    const now = new Date().getTime();
    const target = new Date(`${ev.date}T${ev.time}`).getTime();
    const diffMins = Math.floor((target - now) / 60000);

    if (diffMins < 0 || ev.status === "missed") score += 10000; // Overdue is top priority
    else if (diffMins > 0 && diffMins <= 60) score += 5000; // Due < 1h
    else if (ev.date === todayStr) score += 3000; // Due today
    
    if (ev.priority === "high") score += 500;
    if (ev.priority === "medium") score += 200;
    
    // Sort closer events higher within the same bracket
    score -= diffMins; 
    
    return score;
  };

  const filterAndSortByDate = (events: PlannerEvent[]) => {
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = getDateStr(yesterday);

    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = getDateStr(tomorrow);

    let filtered = events;

    switch (activeTab) {
      case "today":
        filtered = events.filter(e => e.date === todayStr);
        break;
      case "yesterday":
        filtered = events.filter(e => e.date === yesterdayStr);
        break;
      case "tomorrow":
        filtered = events.filter(e => e.date === tomorrowStr);
        break;
      case "range":
        if (range.start && range.end) {
          filtered = events.filter(e => e.date >= range.start && e.date <= range.end);
        }
        break;
      case "objectives":
        filtered = events.filter(e => e.status !== "completed");
        break;
    }

    // Apply execution coach sorting
    return filtered.sort((a, b) => getUrgencyWeight(b) - getUrgencyWeight(a));
  };

  const visibleEvents = filterAndSortByDate(filteredEvents);

  // Extract the "Next Up" event (most urgent pending task)
  const nextUpEvent = (activeTab === "today" || activeTab === "objectives") 
    ? visibleEvents.find(e => e.status !== "completed")
    : null;

  const grouped = visibleEvents.reduce((acc: Record<string, PlannerEvent[]>, ev) => {
    const label = getDateLabel(ev.date);
    if (!acc[label]) acc[label] = [];
    acc[label].push(ev);
    return acc;
  }, {});

  const renderEmptyState = () => {
    let message = "No tasks found.";
    let subMessage = "Try adjusting your filters.";
    
    if (searchQuery) {
      message = "No tasks match your search.";
      subMessage = "Try a different keyword.";
    } else if (activeTab === "today") {
      message = "Nothing planned for today.";
      subMessage = "Add your first task and win the day.";
    } else if (activeTab === "tomorrow") {
      message = "Tomorrow is an open canvas.";
      subMessage = "Get ahead and plan your execution.";
    } else if (activeTab === "yesterday") {
      message = "No tasks recorded yesterday.";
      subMessage = "Keep moving forward.";
    } else if (activeTab === "range") {
      message = "No tasks in this date range.";
      subMessage = "Select different dates to view history.";
    } else if (activeTab === "objectives") {
      message = "No open objectives right now.";
      subMessage = "You're all caught up on pending priorities.";
    }

    return (
      <div className={`py-24 text-center rounded-[2.5rem] px-6 transition-all duration-300 ${
        isDarkMode ? "bg-white/[0.03]" : "bg-black/[0.02]"
      }`}>
        <Target size={48} className={`mx-auto mb-4 ${isDarkMode ? "text-white/20" : "text-slate-300"}`} />
        <p className={`font-medium text-base ${isDarkMode ? "text-white" : "text-slate-700"}`}>{message}</p>
        <p className={`font-medium text-sm mt-1 ${isDarkMode ? "text-white/50" : "text-slate-400"}`}>{subMessage}</p>
        
        {!searchQuery && activeTab !== "yesterday" && activeTab !== "logs" && (
          <button
            onClick={onAddClick}
            className="mt-6 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-[1.4rem] text-sm font-semibold shadow-[0_12px_35px_rgba(249,115,22,0.28)] transition-all active:scale-95"
          >
            Add First Task
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full lg:col-span-8 space-y-6 relative font-sans">
      
      {/* HEADER & DAY TYPE LABEL */}
      <div className="hidden lg:flex justify-between items-end gap-4 relative z-20">
        {activeTab === "objectives" ? (
          <header className="space-y-3">
            <h1 className={`text-[2rem] font-semibold tracking-[-0.04em] ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Execution Board
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
              <span className={isDarkMode ? "text-white/60" : "text-slate-700"}>{visibleEvents.length} remaining</span>
              <span className="text-red-500">{visibleEvents.filter(e => e.priority === 'high').length} urgent</span>
              <span className="text-emerald-500">{visibleEvents.filter(e => e.date === todayStr).length} due today</span>
            </div>
          </header>
        ) : (
          <header className="space-y-1">
            <h1 className={`text-[2rem] font-semibold tracking-[-0.04em] capitalize ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {activeTab === "logs" ? "History" : activeTab === "range" ? "Timeline" : activeTab}
            </h1>
            <p className={`text-sm font-medium tracking-tight ${isDarkMode ? "text-white/50" : "text-slate-500"}`}>
              {activeTab === "yesterday" && "Review what you completed yesterday."}
              {activeTab === "today" && "Focus on today's execution."}
              {activeTab === "tomorrow" && "Prepare and plan for tomorrow."}
              {activeTab === "range" && "Analyze your custom timeline."}
              {activeTab === "logs" && "Track what happened over time."}
            </p>
          </header>
        )}

        <div className="flex items-center gap-3 self-end pb-1">
          <div className="relative group w-64">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
              isDarkMode ? "text-white/40 group-focus-within:text-orange-500" : "text-slate-400 group-focus-within:text-orange-500"
            }`} size={16} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl outline-none transition-all font-medium text-sm border ${
                isDarkMode 
                  ? "bg-white/[0.04] border-white/[0.04] text-white placeholder-white/30 focus:ring-2 focus:ring-orange-500/10 focus:bg-white/[0.05]" 
                  : "bg-black/[0.03] border-transparent text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-orange-500/10 focus:bg-black/[0.05]"
              }`}
            />
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className={`hidden lg:flex p-1.5 rounded-2xl relative z-20 overflow-x-auto scrollbar-hide ${
        isDarkMode ? "bg-white/[0.02]" : "bg-black/[0.02]"
      }`}>
        {["yesterday", "today", "tomorrow", "objectives", "range", "logs"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as TabType)}
            className={`flex-1 px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all duration-200 ${
              activeTab === tab 
                ? (isDarkMode ? "bg-white/[0.08] text-white shadow-sm" : "bg-white shadow-sm text-slate-900")
                : (isDarkMode ? "bg-transparent text-white/45 hover:text-white/70" : "bg-transparent text-slate-500 hover:text-slate-800")
            }`}
          >
            {tab === "objectives" ? "Execution Board" : tab === "range" ? "Timeline" : tab === "logs" ? "History" : tab}
          </button>
        ))}
      </div>

      {/* MOBILE NAV */}
      <div className={`flex lg:hidden overflow-x-auto scrollbar-hide items-center gap-2 px-4 py-3 sticky top-0 backdrop-blur-md z-30 border-b -mx-4 mb-4 ${
        isDarkMode ? "bg-black/80 border-white/[0.04]" : "bg-white/95 border-black/[0.04]"
      }`}>
        {["yesterday", "today", "tomorrow", "objectives", "range", "logs"].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as TabType)} 
            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
              activeTab === tab 
                ? "bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.2)]" 
                : (isDarkMode ? "bg-white/[0.04] text-white/50" : "bg-black/[0.03] text-slate-600")
            }`}
          >
            {tab === "objectives" ? "Execution Board" : tab === "range" ? "Timeline" : tab === "logs" ? "History" : tab}
          </button>
        ))}
      </div>

      {/* 5. NEXT UP FOCUS CARD */}
      {!searchQuery && nextUpEvent && (
        <div className={`relative overflow-hidden rounded-[2rem] p-6 md:p-8 border shadow-lg transition-all animate-in fade-in slide-in-from-bottom-4 ${
          isDarkMode ? "bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20" : "bg-gradient-to-br from-orange-50 to-white border-orange-200"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>Next Up</span>
            </div>
            <span className={`text-sm font-medium flex items-center gap-1.5 ${isDarkMode ? "text-white/60" : "text-slate-500"}`}>
              <Clock size={14} /> {formatTime12Hour(nextUpEvent.time)}
            </span>
          </div>
          
          <h2 className={`text-2xl md:text-3xl font-semibold tracking-tight mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            {nextUpEvent.title}
          </h2>
          
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {(() => {
              const status = getEventStatusInfo(nextUpEvent.date, nextUpEvent.time, nextUpEvent.status, isDarkMode);
              return (
                <span className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${status.colorClass}`}>
                  {status.label}
                </span>
              );
            })()}
            <span className={`px-3 py-1.5 rounded-xl text-sm font-medium border ${
              isDarkMode ? "bg-white/[0.05] border-transparent text-white/70" : "bg-white border-slate-200 text-slate-700"
            }`}>
              {nextUpEvent.type}
            </span>
          </div>

          <button 
            onClick={() => toggleStatus(nextUpEvent.id)}
            className="mt-6 w-full md:w-auto px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-[0_8px_20px_rgba(249,115,22,0.25)] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} /> Complete Task
          </button>
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="space-y-8 relative">
        {activeTab === "logs" ? (
          <div className={`border rounded-[2.5rem] p-7 space-y-4 relative z-20 backdrop-blur-[20px] ${
            isDarkMode ? "bg-white/[0.03] border-white/[0.04]" : "bg-white/[0.7] border-black/[0.04]"
          }`}>
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={`${log.id}-${index}`} className={`flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2 border-b pb-4 last:border-0 p-2 rounded-xl transition-colors ${
                  isDarkMode ? "border-white/[0.05] hover:bg-white/[0.02]" : "border-black/[0.04] hover:bg-black/[0.02]"
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-medium uppercase tracking-[0.15em] border px-2.5 py-1.5 rounded-lg shrink-0 ${
                      isDarkMode ? "bg-white/[0.04] border-transparent text-white/70" : "bg-black/[0.03] border-transparent text-slate-500"
                    }`}>
                      {getActionLabel(log.action)}
                    </span>
                    <span className={`text-sm font-medium leading-snug ${isDarkMode ? "text-white/80" : "text-slate-700"}`}>{log.details}</span>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider shrink-0 lg:text-right ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
              ))
            ) : (
              <p className={`text-center text-sm font-medium py-10 ${isDarkMode ? "text-white/50" : "text-slate-400"}`}>No recent history found.</p>
            )}
          </div>

        ) : visibleEvents.length > 0 ? (
          
          <div className={`space-y-8 transition-all duration-500 ${activeTab === 'yesterday' ? 'opacity-90 grayscale-[15%]' : ''}`}>
            {Object.entries(grouped).map(([label, events]) => (
              <div key={label} className="space-y-4 relative z-20">
                
                <button 
                  onClick={() => toggleCollapse(label)}
                  className="flex items-center gap-2 w-full text-left group"
                >
                  {collapsed[label] ? (
                    <ChevronRight size={16} className={`transition-colors ${isDarkMode ? "text-white/40 group-hover:text-white/70" : "text-slate-400 group-hover:text-slate-700"}`} />
                  ) : (
                    <ChevronDown size={16} className={`transition-colors ${isDarkMode ? "text-white/40 group-hover:text-white/70" : "text-slate-400 group-hover:text-slate-700"}`} />
                  )}
                  <h3 className={`text-xs font-medium uppercase tracking-[0.15em] transition-colors ${
                    isDarkMode ? "text-white/50 group-hover:text-white/80" : "text-slate-500 group-hover:text-slate-800"
                  }`}>
                    {label}
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] ${
                      isDarkMode ? "bg-white/[0.06] text-white/60" : "bg-black/[0.05] text-slate-500"
                    }`}>{events.length}</span>
                  </h3>
                </button>

                {!collapsed[label] && (
                  <div className="relative space-y-3 pt-1">
                    <div className={`absolute left-[38px] md:left-[42px] top-6 bottom-6 w-[2px] hidden sm:block ${
                      isDarkMode ? "bg-white/[0.05]" : "bg-black/[0.03]"
                    }`} />

                    {events.map((ev: PlannerEvent, index: number) => {
                      const isCompleted = ev.status === 'completed';
                      const statusInfo = getEventStatusInfo(ev.date, ev.time, ev.status, isDarkMode);
                      
                      return (
                        <div 
                          key={`${ev.id}-${index}`} 
                          className={`group p-5 md:p-6 rounded-[1.5rem] flex flex-col lg:flex-row lg:items-center justify-between gap-4 
                          transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-20 relative backdrop-blur-[20px] border
                          hover:-translate-y-0.5 hover:shadow-md
                          ${isCompleted 
                            ? (isDarkMode ? 'opacity-80 bg-emerald-500/[0.02] border-emerald-500/10 hover:shadow-none hover:translate-y-0' : 'opacity-90 bg-emerald-50/50 border-emerald-100 hover:shadow-none hover:translate-y-0')
                            : statusInfo.isOverdue 
                              ? (isDarkMode ? 'bg-red-500/[0.02] border-red-500/20' : 'bg-red-50 border-red-100 shadow-sm')
                              : (isDarkMode ? 'bg-white/[0.03] hover:bg-white/[0.045] border-white/[0.04]' : 'bg-white/[0.7] hover:bg-white border-black/[0.04] shadow-sm')
                          }
                          `}
                        >
                          <div className={`flex items-start md:items-center gap-4 min-w-0 w-full border-l-[3px] pl-4 transition-colors duration-300 ${
                            statusInfo.isOverdue ? 'border-red-500' :
                            isCompleted ? 'border-emerald-400' :
                            statusInfo.urgency === 'warning' ? 'border-orange-500' :
                            (isDarkMode ? 'border-white/[0.15]' : 'border-black/[0.1]')
                          }`}>
                            
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (isCompleted) return; 
                                toggleStatus(ev.id); 
                              }}
                              className={`shrink-0 mt-0.5 md:mt-0 relative z-10 transition-transform duration-300 ${!isCompleted && 'active:scale-75 hover:scale-110'}`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="text-emerald-500" size={28} />
                              ) : statusInfo.isOverdue ? (
                                 <AlertCircle className={isDarkMode ? "text-red-500/80" : "text-red-500"} size={28} />
                              ) : (
                                <Circle className={`transition-colors duration-300 ${
                                  isDarkMode ? 'text-white/20 group-hover:text-orange-400' : 'text-slate-300 group-hover:text-orange-400'
                                }`} size={28} />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className={`text-base md:text-[1.1rem] font-medium tracking-[-0.01em] truncate transition-all duration-300 ${
                                  isCompleted 
                                    ? (isDarkMode ? 'text-white/50 line-through' : 'text-slate-500 line-through') 
                                    : (isDarkMode ? 'text-white' : 'text-slate-900')
                                }`}>
                                  {ev.title}
                                </h3>
                              </div>
                              
                              <div className="flex flex-col mt-2 gap-2">
                                <div className={`flex flex-wrap items-center gap-2 md:gap-3 text-[11px] font-medium uppercase tracking-[0.1em] ${isDarkMode ? "text-white/50" : "text-slate-400"}`}>
                                  
                                  {/* 2 & 8. Time + Live Urgency Ring/Badge */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Clock size={12} /> {formatTime12Hour(ev.time)}
                                    </span>
                                    
                                    <span className={`px-2 py-1 rounded-md border ${statusInfo.colorClass} ${statusInfo.borderClass}`}>
                                      {statusInfo.label}
                                    </span>
                                  </div>

                                  <span className="hidden md:inline px-1">•</span>
                                  <span>{ev.type}</span>
                                  
                                  {ev.priority === 'high' && !isCompleted && (
                                    <span className={`px-2 py-0.5 rounded border ${
                                      isDarkMode ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200'
                                    }`}>
                                      High Priority
                                    </span>
                                  )}
                                </div>

                                {/* 3 & 7. Recovery CTA directly inside overdue cards */}
                                {statusInfo.isOverdue && !isCompleted && onReschedule && (
                                  <div className="mt-1 flex items-center gap-3">
                                    <span className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                                      Suggested: Tomorrow 9:00 AM
                                    </span>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); onReschedule(ev.id); }}
                                      className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 ${
                                        isDarkMode ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-red-100 text-red-700 hover:bg-red-200"
                                      }`}
                                    >
                                      <RefreshCcw size={12} /> Recover
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className={`flex items-center justify-end gap-2 opacity-70 lg:opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pt-4 lg:pt-0 border-t lg:border-none mt-2 lg:mt-0 w-full lg:w-auto ${
                            isDarkMode ? "border-white/[0.04]" : "border-black/[0.04]"
                          }`}>
                            {!isCompleted && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(ev); }} 
                                className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                                  isDarkMode ? "bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white" : "bg-black/[0.03] hover:bg-black/[0.06] text-slate-500 hover:text-slate-900"
                                }`}
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteWithUndo(ev.id); }} 
                              className={`p-2.5 rounded-xl transition-all active:scale-95 border ${
                                isCompleted 
                                  ? (isDarkMode ? "bg-white/[0.04] hover:bg-red-500/10 text-white/30 hover:text-red-400 border-transparent" : "bg-black/[0.03] hover:bg-red-50 text-slate-400 hover:text-red-500 border-transparent")
                                  : (isDarkMode ? "bg-red-500/10 hover:bg-red-500/16 text-red-400 border-transparent" : "bg-red-500/10 hover:bg-red-500/16 text-red-600 border-transparent")
                              }`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
}