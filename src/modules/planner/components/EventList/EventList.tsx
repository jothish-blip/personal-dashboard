"use client";

import React, { useState } from "react";
import { 
  Search, CheckCircle2, Circle, Pencil, Trash2, 
  Target, ChevronDown, ChevronRight, CalendarDays
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

export default function EventList({
  activeTab, setActiveTab, searchQuery, setSearchQuery, filteredEvents, logs, toggleStatus, deleteWithUndo, onEdit, onAddClick, getDateLabel
}: EventListProps) {
  
  const { isDarkMode } = useTheme();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [range, setRange] = useState({ start: "", end: "" });

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

  const filterByDate = (events: PlannerEvent[]) => {
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = getDateStr(yesterday);

    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = getDateStr(tomorrow);

    switch (activeTab) {
      case "today":
        return events.filter(e => e.date === todayStr);
      case "yesterday":
        return events.filter(e => e.date === yesterdayStr);
      case "tomorrow":
        return events.filter(e => e.date === tomorrowStr);
      case "range":
        if (!range.start || !range.end) return events;
        return events.filter(e => e.date >= range.start && e.date <= range.end);
      case "objectives":
        return events
          .filter(e => e.status !== "completed")
          .sort((a, b) => {
            const getWeight = (ev: PlannerEvent) => {
              let score = 0;
              if (ev.status === "missed") score += 100;
              if (ev.date === todayStr) score += 70;
              if (ev.priority === "high") score += 40;
              if (ev.priority === "medium") score += 20;
              return score;
            };
            return getWeight(b) - getWeight(a);
          });
      default:
        return events;
    }
  };

  const visibleEvents = filterByDate(filteredEvents);

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
              Open Objectives
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
              <span className={isDarkMode ? "text-white/60" : "text-slate-700"}>{visibleEvents.length} remaining</span>
              <span className="text-red-500">{visibleEvents.filter(e => e.priority === 'high').length} urgent</span>
              <span className="text-emerald-500">{visibleEvents.filter(e => e.date === todayStr).length} due today</span>
            </div>
            {visibleEvents[0] && (
              <p className={`text-sm font-medium ${isDarkMode ? "text-white/50" : "text-slate-500"}`}>
                Next up: <span className={isDarkMode ? "text-white" : "text-slate-900"}>{visibleEvents[0].title} – {formatTime12Hour(visibleEvents[0].time)}</span>
              </p>
            )}
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

      {/* NAVIGATION TABS (Desktop) */}
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
            {tab === "objectives" ? "Open Objectives" : tab === "range" ? "Timeline" : tab === "logs" ? "History" : tab}
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
            {tab === "objectives" ? "Open Objectives" : tab === "range" ? "Timeline" : tab === "logs" ? "History" : tab}
          </button>
        ))}
      </div>

      {/* CUSTOM RANGE CONTROLS */}
      {activeTab === "range" && (
        <div className={`flex items-center gap-3 p-4 rounded-[1.5rem] border backdrop-blur-[20px] relative z-20 animate-in slide-in-from-top-4 ${
          isDarkMode ? "bg-white/[0.02] border-white/[0.04]" : "bg-white/[0.7] border-black/[0.04] shadow-sm"
        }`}>
          <CalendarDays size={20} className={`shrink-0 hidden sm:block ${isDarkMode ? "text-white/40" : "text-slate-400"}`} />
          <div className="flex-1 flex gap-2">
            <input 
              type="date" 
              value={range.start} 
              onChange={(e) => setRange({...range, start: e.target.value})} 
              className={`w-full border text-sm font-medium px-4 py-2.5 rounded-xl outline-none focus:border-orange-500 transition-colors ${
                isDarkMode ? "bg-white/[0.04] border-transparent text-white color-scheme-dark" : "bg-black/[0.03] border-transparent text-slate-700"
              }`}
            />
            <input 
              type="date" 
              value={range.end} 
              onChange={(e) => setRange({...range, end: e.target.value})} 
              className={`w-full border text-sm font-medium px-4 py-2.5 rounded-xl outline-none focus:border-orange-500 transition-colors ${
                isDarkMode ? "bg-white/[0.04] border-transparent text-white color-scheme-dark" : "bg-black/[0.03] border-transparent text-slate-700"
              }`}
            />
          </div>
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
                      
                      return (
                        <div 
                          key={`${ev.id}-${index}`} 
                          className={`group p-5 md:p-6 rounded-[1.5rem] flex flex-col lg:flex-row lg:items-center justify-between gap-4 
                          transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-20 relative backdrop-blur-[20px] border
                          hover:-translate-y-0.5 hover:shadow-md
                          ${isCompleted 
                            ? (isDarkMode ? 'opacity-70 grayscale-[15%] bg-white/[0.01] border-transparent hover:shadow-none hover:translate-y-0' : 'opacity-70 grayscale-[15%] bg-black/[0.01] border-transparent hover:shadow-none hover:translate-y-0')
                            : (isDarkMode ? 'bg-white/[0.03] hover:bg-white/[0.045] border-white/[0.04]' : 'bg-white/[0.7] hover:bg-white border-black/[0.04] shadow-sm')
                          }
                          `}
                        >
                          <div className={`flex items-start md:items-center gap-4 min-w-0 w-full border-l-[3px] pl-4 transition-colors duration-300 ${
                            ev.status === 'missed' ? 'border-red-400' :
                            isCompleted ? 'border-emerald-400/50' :
                            ev.priority === 'high' ? 'border-orange-500' :
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
                                <CheckCircle2 className="text-emerald-500/80" size={28} />
                              ) : ev.status === 'missed' ? (
                                 <Circle className={isDarkMode ? "text-red-900/60" : "text-red-200"} size={28} />
                              ) : (
                                <Circle className={`transition-colors duration-300 ${
                                  isDarkMode ? 'text-white/20 group-hover:text-orange-400' : 'text-slate-200 group-hover:text-orange-400'
                                }`} size={28} />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className={`text-base md:text-[1.1rem] font-medium tracking-[-0.01em] truncate transition-all duration-300 ${
                                  isCompleted 
                                    ? (isDarkMode ? 'text-white/30 line-through' : 'text-slate-400 line-through') 
                                    : (isDarkMode ? 'text-white' : 'text-slate-900')
                                }`}>
                                  {ev.title}
                                </h3>
                                
                                {ev.status === 'missed' && (
                                  <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md tracking-wider border ${
                                    isDarkMode ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-50 text-red-500 border-transparent"
                                  }`}>Overdue</span>
                                )}
                              </div>
                              
                              <div className="flex flex-col mt-2 gap-1.5">
                                <div className={`flex flex-wrap items-center gap-3 text-[10px] font-medium uppercase tracking-[0.15em] ${isDarkMode ? "text-white/50" : "text-slate-400"}`}>
                                  <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide ${
                                    isDarkMode
                                      ? "bg-orange-500/10 text-orange-300"
                                      : "bg-orange-50 text-orange-700"
                                  }`}>
                                    🕒 {formatTime12Hour(ev.time)}
                                  </span>
                                  
                                  <span>{ev.type}</span>
                                  
                                  <span className={`px-2 py-1 rounded-md transition-colors border ${
                                    ev.priority === 'high' 
                                      ? (isDarkMode ? 'bg-red-500/10 text-red-400 border-transparent' : 'bg-red-50 text-red-600 border-transparent')
                                      : ev.priority === 'medium' 
                                        ? (isDarkMode ? 'bg-orange-500/10 text-orange-400 border-transparent' : 'bg-orange-50 text-orange-600 border-transparent')
                                        : (isDarkMode ? 'bg-white/[0.04] text-white/50 border-transparent' : 'bg-black/[0.03] text-slate-500 border-transparent')
                                  }`}>
                                    {ev.priority}
                                  </span>
                                </div>
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