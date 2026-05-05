"use client";

import React, { useState } from "react";
import { 
  Search, CheckCircle2, Circle, Pencil, Trash2, 
  Target, ChevronDown, ChevronRight, Zap, CalendarDays, Lock
} from "lucide-react";
import { PlannerEvent, SystemLog } from "./types";
import { useTheme } from "@/components/ThemeProvider"; // 🔥 Added Theme Provider

export type TabType = "today" | "yesterday" | "tomorrow" | "range" | "logs";

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
    case "CREATE": return "Created";
    case "UPDATE": return "Updated";
    case "DELETE": return "Deleted";
    case "STATUS_TOGGLE": return "Status Changed";
    case "RESCHEDULE": return "Rescheduled";
    default: return action;
  }
};

export default function EventList({
  activeTab, setActiveTab, searchQuery, setSearchQuery, filteredEvents, logs, toggleStatus, deleteWithUndo, onEdit, onAddClick, getDateLabel
}: EventListProps) {
  
  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [range, setRange] = useState({ start: "", end: "" });
  
  // 🔥 Lock Confirmation Popup State
  const [lockedTaskId, setLockedTaskId] = useState<string | null>(null);

  const toggleCollapse = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const filterByDate = (events: PlannerEvent[]) => {
    const today = new Date();

    const getDateStr = (d: Date) => {
      const copy = new Date(d);
      copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
      return copy.toISOString().split("T")[0];
    };

    const todayStr = getDateStr(today);

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

  const getNextPendingTaskId = () => {
    const pending = visibleEvents.filter(e => e.status === "pending");
    return pending.length > 0 ? pending[0].id : null;
  };
  const focusTaskId = isFocusMode ? getNextPendingTaskId() : null;

  const checkIsSoon = (date: string, time: string) => {
    const now = new Date();
    const taskTime = new Date(`${date}T${time}`);
    const diffMs = taskTime.getTime() - now.getTime();
    return diffMs > 0 && diffMs < 30 * 60 * 1000; 
  };

  // Deadline Urgency Helper
  const getRemainingMinutes = (date: string, time: string) => {
    const now = new Date();
    const taskTime = new Date(`${date}T${time}`);
    return (taskTime.getTime() - now.getTime()) / 60000;
  };

  // Completion Window Helper
  const getTimeWindow = (date: string, time: string) => {
    const now = new Date();
    const taskTime = new Date(`${date}T${time}`);
    const nowStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const taskStr = taskTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${nowStr} → ${taskStr}`;
  };

  // Metrics for Summary
  const completedCount = visibleEvents.filter(e => e.status === "completed").length;
  const pendingCount = visibleEvents.filter(e => e.status === "pending").length;
  const missedCount = visibleEvents.filter(e => e.status === "missed").length;

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
      
      {/* FOCUS MODE OVERLAY */}
      {isFocusMode && (
        <div className={`fixed inset-0 backdrop-blur-[2px] z-10 pointer-events-none transition-all duration-500 ease-out ${
          isDarkMode ? "bg-black/60" : "bg-slate-900/40"
        }`} />
      )}

      {/* LOCK CONFIRMATION POPUP */}
      {lockedTaskId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className={`p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl animate-in zoom-in-95 border ${
            isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-transparent"
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isDarkMode ? "bg-gray-900 text-gray-400" : "bg-slate-100 text-slate-400"
            }`}>
              <Lock size={32} />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Task Locked</h3>
            <p className={`text-sm font-medium mb-6 ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>
              Completed tasks are locked permanently to maintain execution integrity. You cannot undo this.
            </p>
            <button
              onClick={() => setLockedTaskId(null)}
              className={`w-full px-4 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${
                isDarkMode ? "bg-white text-black hover:bg-gray-200 shadow-white/10" : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20"
              }`}
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* HEADER & DAY TYPE LABEL */}
      <div className="hidden lg:flex justify-between items-end gap-4 relative z-20">
        <header className="space-y-1">
          <h1 className={`text-4xl font-black tracking-tight capitalize ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            {activeTab === "logs" ? "Activity" : activeTab === "range" ? "Timeline" : activeTab}
          </h1>
          <p className={`text-sm font-semibold tracking-tight ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>
            {activeTab === "yesterday" && "Review what you completed yesterday."}
            {activeTab === "today" && "Focus on today's execution."}
            {activeTab === "tomorrow" && "Prepare and plan for tomorrow."}
            {activeTab === "range" && "Analyze your custom timeline."}
            {activeTab === "logs" && "System audit and history."}
          </p>
        </header>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            disabled={activeTab !== "today"}
            className={`px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isFocusMode 
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-500 ring-offset-2" 
                : isDarkMode 
                  ? "bg-[#111111] border border-gray-800 text-gray-300 hover:bg-gray-900 shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
            }`}
          >
            <Target size={16} /> Focus
          </button>

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
        {["yesterday", "today", "tomorrow", "range", "logs"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as TabType)}
            className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-200 ${
              activeTab === tab 
                ? (isDarkMode ? "bg-gray-800 text-white shadow-sm border border-gray-700" : "bg-white text-slate-900 shadow-sm border border-slate-200/60")
                : (isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800/50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50")
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* MOBILE NAV */}
      <div className={`flex lg:hidden overflow-x-auto scrollbar-hide items-center gap-2 px-4 py-3 sticky top-0 backdrop-blur-md z-30 border-b -mx-4 mb-4 ${
        isDarkMode ? "bg-[#050505]/95 border-gray-800" : "bg-white/95 border-slate-100"
      }`}>
        {["yesterday", "today", "tomorrow", "range", "logs"].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as TabType)} 
            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all border ${
              activeTab === tab 
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20 border-orange-500" 
                : (isDarkMode ? "bg-[#111111] text-gray-400 border-gray-800" : "bg-slate-100 text-slate-600 border-transparent")
            }`}
          >
            {tab}
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

      {/* WHAT YOU DID SUMMARY & BEHAVIOR INSIGHT */}
      {activeTab !== "logs" && activeTab !== "tomorrow" && visibleEvents.length > 0 && (
        <div className={`border rounded-[1.5rem] p-5 shadow-sm relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in ${
          isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="space-y-0.5">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Completed</p>
              <p className="text-2xl font-black text-emerald-500">{completedCount}</p>
            </div>
            <div className={`w-[1px] h-10 ${isDarkMode ? "bg-gray-800" : "bg-slate-100"}`}></div>
            <div className="space-y-0.5">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Pending</p>
              <p className="text-2xl font-black text-orange-500">{pendingCount}</p>
            </div>
            <div className={`w-[1px] h-10 ${isDarkMode ? "bg-gray-800" : "bg-slate-100"}`}></div>
            <div className="space-y-0.5">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Missed</p>
              <p className="text-2xl font-black text-red-500">{missedCount}</p>
            </div>
            <div className={`w-[1px] h-10 hidden sm:block ${isDarkMode ? "bg-gray-800" : "bg-slate-100"}`}></div>
            <div className="space-y-0.5 hidden sm:block">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Total</p>
              <p className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-slate-800"}`}>{visibleEvents.length}</p>
            </div>
          </div>

          <div className={`border px-4 py-3 rounded-xl text-xs font-semibold md:max-w-[200px] ${
            isDarkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-slate-50 border-slate-100"
          }`}>
            {completedCount === 0 && missedCount === 0 && pendingCount > 0 && <span className={isDarkMode ? "text-gray-400" : "text-slate-500"}>Waiting for action. Start your first task.</span>}
            {completedCount === 0 && missedCount > 0 && <span className={isDarkMode ? "text-orange-400" : "text-orange-600"}>No tasks completed yet. Start small to build momentum.</span>}
            {completedCount > 0 && missedCount === 0 && pendingCount === 0 && <span className={isDarkMode ? "text-emerald-400" : "text-emerald-600"}>Flawless execution. The day is yours! ✨</span>}
            {completedCount > 0 && missedCount === 0 && pendingCount > 0 && <span className={isDarkMode ? "text-emerald-400" : "text-emerald-600"}>Flawless so far. Keep it up! ✨</span>}
            {completedCount > 0 && missedCount > 0 && <span className={isDarkMode ? "text-gray-300" : "text-slate-600"}>Making progress, but some tasks slipped.</span>}
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
              <p className={`text-center text-sm font-medium py-10 ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>No recent activity found.</p>
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
                      const isFocused = isFocusMode && ev.id === focusTaskId;
                      const isDimmed = isFocusMode && !isFocused && !isCompleted;
                      const isSoon = checkIsSoon(ev.date, ev.time);
                      const remaining = getRemainingMinutes(ev.date, ev.time);
                      
                      return (
                        <div 
                          key={`${ev.id}-${index}`} 
                          className={`group border p-5 md:p-6 rounded-[1.5rem] flex flex-col lg:flex-row lg:items-center justify-between gap-4 
                          transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                          hover:-translate-y-0.5 hover:shadow-md
                          ${isCompleted 
                            ? (isDarkMode ? 'scale-[0.98] opacity-60 bg-[#0a0a0a] shadow-none hover:shadow-none hover:translate-y-0 border-gray-800' : 'scale-[0.98] opacity-60 bg-slate-50 shadow-none hover:shadow-none hover:translate-y-0 border-slate-200')
                            : (isDarkMode ? 'bg-[#111111] border-gray-800 shadow-sm hover:border-gray-600' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300')
                          }
                          ${isFocused 
                            ? (isDarkMode ? 'ring-2 ring-orange-500 shadow-xl scale-[1.02] z-30 relative bg-[#111111]' : 'ring-2 ring-orange-500 shadow-xl scale-[1.02] z-30 relative bg-white') 
                            : 'z-20 relative'
                          }
                          ${isDimmed ? 'opacity-30 grayscale-[50%] scale-[0.99]' : ''}
                          `}
                        >
                          <div className={`flex items-start md:items-center gap-4 min-w-0 w-full border-l-[3px] pl-4 transition-colors duration-300 ${
                            ev.status === 'missed' ? 'border-red-400' :
                            isCompleted ? 'border-emerald-400' :
                            ev.priority === 'high' ? 'border-orange-500' :
                            (isDarkMode ? 'border-gray-700' : 'border-slate-200')
                          }`}>
                            
                            {/* LOCK TASK TOGGLE */}
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (isCompleted) {
                                  setLockedTaskId(ev.id);
                                  return;
                                }
                                toggleStatus(ev.id); 
                              }}
                              className="shrink-0 mt-0.5 md:mt-0 relative z-10 transition-transform duration-300 active:scale-75 hover:scale-110"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="text-emerald-500" size={28} />
                              ) : ev.status === 'missed' ? (
                                 <Circle className={isDarkMode ? "text-red-900" : "text-red-200"} size={28} />
                              ) : (
                                <Circle className={`transition-colors duration-300 ${
                                  isFocused ? 'text-orange-400' : (isDarkMode ? 'text-gray-700 group-hover:text-orange-400' : 'text-slate-200 group-hover:text-orange-300')
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
                                
                                {isFocused && (
                                  <span className="shrink-0 text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-md font-black uppercase tracking-wider animate-pulse">
                                    Now
                                  </span>
                                )}
                                
                                {ev.status === 'missed' && (
                                  <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md tracking-wider border ${
                                    isDarkMode ? "bg-red-950/30 text-red-400 border-red-900/50" : "bg-red-50 text-red-500 border-transparent"
                                  }`}>Overdue</span>
                                )}

                                {/* DEADLINE URGENCY VISUAL */}
                                {remaining > 0 && remaining <= 60 && !isCompleted && (
                                  <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded flex items-center gap-1 animate-pulse border ${
                                    isDarkMode ? "bg-red-950/30 text-red-400 border-red-900/50" : "bg-red-50 text-red-500 border-red-100"
                                  }`}>
                                    <Zap size={10} /> {Math.round(remaining)} min left
                                  </span>
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

                                  {isSoon && !isCompleted && (
                                    <span className="text-orange-500 font-black animate-pulse flex items-center gap-1">
                                      <Zap size={10} /> Starting Soon
                                    </span>
                                  )}
                                </div>
                                
                                {/* COMPLETION WINDOW */}
                                {ev.status === 'pending' && (
                                  <span className={`text-[10px] font-medium normal-case tracking-normal ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>
                                    Complete between <span className="font-semibold">{getTimeWindow(ev.date, ev.time)}</span>
                                  </span>
                                )}
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