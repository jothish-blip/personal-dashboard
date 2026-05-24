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

const getActionLabel = (action: string) => {
  switch (action) {
    case "CREATE": return "Created task";
    case "UPDATE": return "Updated task";
    case "DELETE": return "Deleted task";
    case "STATUS_TOGGLE": return "Completed task";
    case "RESCHEDULE": return "Recovered task";
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
      <div className={`py-24 text-center border-2 border-dashed rounded-[2rem] px-6 transition-all duration-300 ${
        isDarkMode ? "border-gray-800 bg-[#111111]/50" : "border-slate-200 bg-slate-50/50"
      }`}>
        <Target size={48} className={`mx-auto mb-4 ${isDarkMode ? "text-gray-700" : "text-slate-300"}`} />
        <p className={`font-bold text-base ${isDarkMode ? "text-white" : "text-slate-700"}`}>{message}</p>
        <p className={`font-medium text-sm mt-1 ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>{subMessage}</p>
        
        {!searchQuery && activeTab !== "yesterday" && activeTab !== "logs" && (
          <button
            onClick={onAddClick}
            className="mt-6 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95"
          >
            Add First Task
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full lg:col-span-8 space-y-6 relative">
      
      {/* HEADER & DAY TYPE LABEL */}
      <div className="hidden lg:flex justify-between items-end gap-4 relative z-20">
        {activeTab === "objectives" ? (
          <header className="space-y-4">
            <h1 className={`text-4xl font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              OPEN OBJECTIVES
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
              <span className={isDarkMode ? "text-gray-300" : "text-slate-700"}>{visibleEvents.length} remaining</span>
              <span className="text-red-500">{visibleEvents.filter(e => e.priority === 'high').length} urgent</span>
              <span className="text-emerald-500">{visibleEvents.filter(e => e.date === todayStr).length} due today</span>
            </div>
            {visibleEvents[0] && (
              <p className={`text-sm font-bold ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>
                Next up: <span className={isDarkMode ? "text-white" : "text-slate-900"}>{visibleEvents[0].title} – {visibleEvents[0].time}</span>
              </p>
            )}
          </header>
        ) : (
          <header className="space-y-1">
            <h1 className={`text-4xl font-black tracking-tight capitalize ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {activeTab === "logs" ? "History" : activeTab === "range" ? "Timeline" : activeTab}
            </h1>
            <p className={`text-sm font-semibold tracking-tight ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>
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
              isDarkMode ? "text-gray-500 group-focus-within:text-orange-500" : "text-slate-400 group-focus-within:text-orange-500"
            }`} size={16} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 border shadow-sm rounded-xl outline-none focus:border-orange-500 focus:ring-2 text-sm font-medium transition-all ${
                isDarkMode 
                  ? "bg-[#111111] border-gray-800 text-white placeholder-gray-600 focus:ring-orange-900/30" 
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-orange-100"
              }`}
            />
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS (Desktop) */}
      <div className={`hidden lg:flex p-1.5 rounded-2xl border relative z-20 overflow-x-auto scrollbar-hide ${
        isDarkMode ? "bg-[#111111]/80 border-gray-800" : "bg-slate-50/80 border-slate-100"
      }`}>
        {["yesterday", "today", "tomorrow", "objectives", "range", "logs"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as TabType)}
            className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-200 ${
              activeTab === tab 
                ? (isDarkMode ? "bg-gray-800 text-white shadow-sm border border-gray-700" : "bg-white text-slate-900 shadow-sm border border-slate-200/60")
                : (isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800/50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50")
            }`}
          >
            {tab === "objectives" ? "Open Objectives" : tab === "range" ? "Timeline" : tab === "logs" ? "History" : tab}
          </button>
        ))}
      </div>

      {/* MOBILE NAV */}
      <div className={`flex lg:hidden overflow-x-auto scrollbar-hide items-center gap-2 px-4 py-3 sticky top-0 backdrop-blur-md z-30 border-b -mx-4 mb-4 ${
        isDarkMode ? "bg-[#050505]/95 border-gray-800" : "bg-white/95 border-slate-100"
      }`}>
        {["yesterday", "today", "tomorrow", "objectives", "range", "logs"].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as TabType)} 
            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all border ${
              activeTab === tab 
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20 border-orange-500" 
                : (isDarkMode ? "bg-[#111111] text-gray-400 border-gray-800" : "bg-slate-100 text-slate-600 border-transparent")
            }`}
          >
            {tab === "objectives" ? "Open Objectives" : tab === "range" ? "Timeline" : tab === "logs" ? "History" : tab}
          </button>
        ))}
      </div>

      {/* CUSTOM RANGE CONTROLS */}
      {activeTab === "range" && (
        <div className={`flex items-center gap-3 p-4 rounded-[1.5rem] border shadow-sm relative z-20 animate-in slide-in-from-top-4 ${
          isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-slate-200"
        }`}>
          <CalendarDays size={20} className={`shrink-0 hidden sm:block ${isDarkMode ? "text-gray-500" : "text-slate-400"}`} />
          <div className="flex-1 flex gap-2">
            <input 
              type="date" 
              value={range.start} 
              onChange={(e) => setRange({...range, start: e.target.value})} 
              className={`w-full border text-sm font-bold px-4 py-2.5 rounded-xl outline-none focus:border-orange-500 transition-colors ${
                isDarkMode ? "bg-[#0a0a0a] border-gray-700 text-white color-scheme-dark" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            />
            <input 
              type="date" 
              value={range.end} 
              onChange={(e) => setRange({...range, end: e.target.value})} 
              className={`w-full border text-sm font-bold px-4 py-2.5 rounded-xl outline-none focus:border-orange-500 transition-colors ${
                isDarkMode ? "bg-[#0a0a0a] border-gray-700 text-white color-scheme-dark" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            />
          </div>
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="space-y-8 relative">
        {activeTab === "logs" ? (
          <div className={`border rounded-[2rem] p-7 space-y-4 relative z-20 ${
            isDarkMode ? "bg-[#111111] border-gray-800" : "bg-slate-50 border-slate-100"
          }`}>
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={`${log.id}-${index}`} className={`flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2 border-b pb-4 last:border-0 p-2 rounded-xl transition-colors ${
                  isDarkMode ? "border-gray-800 hover:bg-[#1a1a1a]" : "border-slate-200 hover:bg-slate-100/50"
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider border shadow-sm px-2.5 py-1.5 rounded-lg shrink-0 ${
                      isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-slate-200 text-slate-500"
                    }`}>
                      {getActionLabel(log.action)}
                    </span>
                    <span className={`text-sm font-medium leading-snug ${isDarkMode ? "text-gray-200" : "text-slate-700"}`}>{log.details}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 lg:text-right ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className={`text-center text-sm font-medium py-10 ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>No recent history found.</p>
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
                    <ChevronRight size={16} className={`transition-colors ${isDarkMode ? "text-gray-500 group-hover:text-gray-300" : "text-slate-400 group-hover:text-slate-700"}`} />
                  ) : (
                    <ChevronDown size={16} className={`transition-colors ${isDarkMode ? "text-gray-500 group-hover:text-gray-300" : "text-slate-400 group-hover:text-slate-700"}`} />
                  )}
                  <h3 className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                    isDarkMode ? "text-gray-500 group-hover:text-gray-300" : "text-slate-400 group-hover:text-slate-700"
                  }`}>
                    {label}
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] ${
                      isDarkMode ? "bg-gray-800 text-gray-400" : "bg-slate-100 text-slate-500"
                    }`}>{events.length}</span>
                  </h3>
                </button>

                {!collapsed[label] && (
                  <div className="relative space-y-3 pt-1">
                    <div className={`absolute left-[38px] md:left-[42px] top-6 bottom-6 w-[2px] hidden sm:block ${
                      isDarkMode ? "bg-gray-800" : "bg-slate-100"
                    }`} />

                    {events.map((ev: PlannerEvent, index: number) => {
                      const isCompleted = ev.status === 'completed';
                      
                      return (
                        <div 
                          key={`${ev.id}-${index}`} 
                          className={`group border p-5 md:p-6 rounded-[1.5rem] flex flex-col lg:flex-row lg:items-center justify-between gap-4 
                          transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-20 relative
                          hover:-translate-y-0.5 hover:shadow-md
                          ${isCompleted 
                            ? (isDarkMode ? 'scale-[0.98] opacity-60 bg-[#0a0a0a] shadow-none hover:shadow-none hover:translate-y-0 border-gray-800' : 'scale-[0.98] opacity-60 bg-slate-50 shadow-none hover:shadow-none hover:translate-y-0 border-slate-200')
                            : (isDarkMode ? 'bg-[#111111] border-gray-800 shadow-sm hover:border-gray-600' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300')
                          }
                          `}
                        >
                          <div className={`flex items-start md:items-center gap-4 min-w-0 w-full border-l-[3px] pl-4 transition-colors duration-300 ${
                            ev.status === 'missed' ? 'border-red-400' :
                            isCompleted ? 'border-emerald-400' :
                            ev.priority === 'high' ? 'border-orange-500' :
                            (isDarkMode ? 'border-gray-700' : 'border-slate-200')
                          }`}>
                            
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (isCompleted) return; // Prevent unlocking completed tasks
                                toggleStatus(ev.id); 
                              }}
                              className={`shrink-0 mt-0.5 md:mt-0 relative z-10 transition-transform duration-300 ${!isCompleted && 'active:scale-75 hover:scale-110'}`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="text-emerald-500" size={28} />
                              ) : ev.status === 'missed' ? (
                                 <Circle className={isDarkMode ? "text-red-900" : "text-red-200"} size={28} />
                              ) : (
                                <Circle className={`transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-700 group-hover:text-orange-400' : 'text-slate-200 group-hover:text-orange-300'
                                }`} size={28} />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className={`text-base md:text-lg font-bold truncate transition-all duration-300 ${
                                  isCompleted 
                                    ? (isDarkMode ? 'text-gray-500 line-through' : 'text-slate-400 line-through') 
                                    : (isDarkMode ? 'text-white' : 'text-slate-900')
                                }`}>
                                  {ev.title}
                                </h3>
                                
                                {ev.status === 'missed' && (
                                  <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md tracking-wider border ${
                                    isDarkMode ? "bg-red-950/30 text-red-400 border-red-900/50" : "bg-red-50 text-red-500 border-transparent"
                                  }`}>Overdue</span>
                                )}
                              </div>
                              
                              <div className="flex flex-col mt-2 gap-1.5">
                                <div className={`flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>
                                  <span className={`px-2 py-1 rounded-md border flex items-center gap-1.5 ${
                                    isDarkMode ? "bg-gray-800 text-gray-300 border-gray-700" : "bg-slate-50 text-slate-700 border-slate-100"
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      ev.priority === "high" ? "bg-red-500" :
                                      ev.priority === "medium" ? "bg-orange-400" :
                                      "bg-slate-300"
                                    }`} />
                                    {ev.time}
                                  </span>
                                  
                                  <span>{ev.type}</span>
                                  
                                  <span className={`px-2 py-1 rounded-md transition-colors border ${
                                    ev.priority === 'high' 
                                      ? (isDarkMode ? 'bg-red-950/30 text-red-400 border-red-900/50' : 'bg-red-50 text-red-600 border-transparent')
                                      : ev.priority === 'medium' 
                                        ? (isDarkMode ? 'bg-orange-950/30 text-orange-400 border-orange-900/50' : 'bg-orange-50 text-orange-600 border-transparent')
                                        : (isDarkMode ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-slate-100 text-slate-500 border-transparent')
                                  }`}>
                                    {ev.priority}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className={`flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 pt-4 lg:pt-0 border-t lg:border-none mt-2 lg:mt-0 w-full lg:w-auto ${
                            isDarkMode ? "border-gray-800" : "border-slate-100"
                          }`}>
                            {!isCompleted && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(ev); }} 
                                className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                                  isDarkMode ? "bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white" : "bg-slate-50 hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                                }`}
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteWithUndo(ev.id); }} 
                              className={`p-2.5 rounded-xl transition-all active:scale-95 border ${
                                isCompleted 
                                  ? (isDarkMode ? "bg-gray-800 hover:bg-red-950/30 text-gray-500 hover:text-red-400 border-transparent" : "bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-400 border-transparent")
                                  : (isDarkMode ? "bg-red-950/30 hover:bg-red-900 text-red-400 hover:text-white border-red-900/50" : "bg-red-50 hover:bg-red-500 text-red-400 hover:text-white border-transparent")
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