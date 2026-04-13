import React, { useState } from "react";
import { 
  Search, CheckCircle2, Circle, Pencil, Trash2, 
  Target, ChevronDown, ChevronRight, Zap, CalendarDays, Lock
} from "lucide-react";
import { PlannerEvent, SystemLog } from "./types";

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
  
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [range, setRange] = useState({ start: "", end: "" });
  
  // 🔥 4. Lock Confirmation Popup State
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

  // 🔥 5. Deadline Urgency Helper
  const getRemainingMinutes = (date: string, time: string) => {
    const now = new Date();
    const taskTime = new Date(`${date}T${time}`);
    return (taskTime.getTime() - now.getTime()) / 60000;
  };

  // 🔥 3. Completion Window Helper
  const getTimeWindow = (date: string, time: string) => {
    const now = new Date();
    const taskTime = new Date(`${date}T${time}`);
    const nowStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const taskStr = taskTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${nowStr} → ${taskStr}`;
  };

  // 🔥 1. Metrics for "What You Did" Summary (Added Pending)
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
      <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50 px-6 transition-all duration-300">
        <Target size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-700 font-bold text-base">{message}</p>
        <p className="text-slate-400 font-medium text-sm mt-1">{subMessage}</p>
        
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 pointer-events-none transition-all duration-500 ease-out" />
      )}

      {/* 🔥 4. LOCK CONFIRMATION POPUP */}
      {lockedTaskId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Task Locked</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">
              Completed tasks are locked permanently to maintain execution integrity. You cannot undo this.
            </p>
            <button
              onClick={() => setLockedTaskId(null)}
              className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all active:scale-95"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* HEADER & DAY TYPE LABEL */}
      <div className="hidden lg:flex justify-between items-end gap-4 relative z-20">
        <header className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 capitalize">
            {activeTab === "logs" ? "Activity" : activeTab === "range" ? "Timeline" : activeTab}
          </h1>
          <p className="text-sm text-slate-500 font-semibold tracking-tight">
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
              isFocusMode ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-500 ring-offset-2" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
            }`}
          >
            <Target size={16} /> Focus
          </button>

          <div className="relative group w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-sm font-medium transition-all"
            />
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS (Desktop) */}
      <div className="hidden lg:flex bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100 relative z-20 overflow-x-auto scrollbar-hide">
        {["yesterday", "today", "tomorrow", "range", "logs"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as TabType)}
            className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-200 ${
              activeTab === tab 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/60" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* MOBILE NAV */}
      <div className="flex lg:hidden overflow-x-auto scrollbar-hide items-center gap-2 px-4 py-3 sticky top-0 bg-white/95 backdrop-blur-md z-30 border-b border-slate-100 -mx-4 mb-4">
        {["yesterday", "today", "tomorrow", "range", "logs"].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as TabType)} 
            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
              activeTab === tab ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-slate-100 text-slate-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CUSTOM RANGE CONTROLS */}
      {activeTab === "range" && (
        <div className="flex items-center gap-3 bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm relative z-20 animate-in slide-in-from-top-4">
          <CalendarDays size={20} className="text-slate-400 shrink-0 hidden sm:block" />
          <div className="flex-1 flex gap-2">
            <input 
              type="date" 
              value={range.start} 
              onChange={(e) => setRange({...range, start: e.target.value})} 
              className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-orange-500 transition-colors"
            />
            <input 
              type="date" 
              value={range.end} 
              onChange={(e) => setRange({...range, end: e.target.value})} 
              className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* WHAT YOU DID SUMMARY & BEHAVIOR INSIGHT */}
      {activeTab !== "logs" && activeTab !== "tomorrow" && visibleEvents.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed</p>
              <p className="text-2xl font-black text-emerald-500">{completedCount}</p>
            </div>
            <div className="w-[1px] h-10 bg-slate-100"></div>
            {/* 🔥 1. PENDING IN SUMMARY */}
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending</p>
              <p className="text-2xl font-black text-orange-500">{pendingCount}</p>
            </div>
            <div className="w-[1px] h-10 bg-slate-100"></div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Missed</p>
              <p className="text-2xl font-black text-red-500">{missedCount}</p>
            </div>
            <div className="w-[1px] h-10 bg-slate-100 hidden sm:block"></div>
            <div className="space-y-0.5 hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
              <p className="text-2xl font-black text-slate-800">{visibleEvents.length}</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-xs font-semibold md:max-w-[200px]">
            {completedCount === 0 && missedCount === 0 && pendingCount > 0 && <span className="text-slate-500">Waiting for action. Start your first task.</span>}
            {completedCount === 0 && missedCount > 0 && <span className="text-orange-600">No tasks completed yet. Start small to build momentum.</span>}
            {completedCount > 0 && missedCount === 0 && pendingCount === 0 && <span className="text-emerald-600">Flawless execution. The day is yours! ✨</span>}
            {completedCount > 0 && missedCount === 0 && pendingCount > 0 && <span className="text-emerald-600">Flawless so far. Keep it up! ✨</span>}
            {completedCount > 0 && missedCount > 0 && <span className="text-slate-600">Making progress, but some tasks slipped.</span>}
          </div>
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="space-y-8 relative">
        {activeTab === "logs" ? (
          <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-7 space-y-4 relative z-20">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={`${log.id}-${index}`} className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2 border-b border-slate-200 pb-4 last:border-0 hover:bg-slate-100/50 p-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-white border border-slate-200 shadow-sm px-2.5 py-1.5 rounded-lg shrink-0">
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-sm text-slate-700 font-medium leading-snug">{log.details}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 lg:text-right">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 text-sm font-medium py-10">No recent activity found.</p>
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
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
                  )}
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-700 transition-colors">
                    {label}
                    <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px]">{events.length}</span>
                  </h3>
                </button>

                {!collapsed[label] && (
                  <div className="relative space-y-3 pt-1">
                    <div className="absolute left-[38px] md:left-[42px] top-6 bottom-6 w-[2px] bg-slate-100 hidden sm:block" />

                    {events.map((ev: PlannerEvent, index: number) => {
                      const isCompleted = ev.status === 'completed';
                      const isFocused = isFocusMode && ev.id === focusTaskId;
                      const isDimmed = isFocusMode && !isFocused && !isCompleted;
                      const isSoon = checkIsSoon(ev.date, ev.time);
                      
                      // Urgency calculation
                      const remaining = getRemainingMinutes(ev.date, ev.time);
                      
                      return (
                        <div 
                          key={`${ev.id}-${index}`} 
                          className={`group bg-white border border-slate-200 p-5 md:p-6 rounded-[1.5rem] flex flex-col lg:flex-row lg:items-center justify-between gap-4 
                          transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                          hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300
                          ${isCompleted ? 'scale-[0.98] opacity-60 bg-slate-50 shadow-none hover:shadow-none hover:translate-y-0' : 'shadow-sm'}
                          ${isFocused ? 'ring-2 ring-orange-500 shadow-xl scale-[1.02] z-30 relative bg-white' : 'z-20 relative'}
                          ${isDimmed ? 'opacity-30 grayscale-[50%] scale-[0.99]' : ''}
                          `}
                        >
                          <div className={`flex items-start md:items-center gap-4 min-w-0 w-full border-l-[3px] pl-4 transition-colors duration-300 ${
                            ev.status === 'missed' ? 'border-red-400' :
                            isCompleted ? 'border-emerald-400' :
                            ev.priority === 'high' ? 'border-orange-500' :
                            'border-slate-200'
                          }`}>
                            
                            {/* 🔥 2. LOCK TASK TOGGLE */}
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (isCompleted) {
                                  setLockedTaskId(ev.id);
                                  return;
                                }
                                toggleStatus(ev.id); 
                              }}
                              className="shrink-0 mt-0.5 md:mt-0 relative z-10 bg-white transition-transform duration-300 active:scale-75 hover:scale-110"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="text-emerald-500" size={28} />
                              ) : ev.status === 'missed' ? (
                                 <Circle className="text-red-200" size={28} />
                              ) : (
                                <Circle className={`transition-colors duration-300 ${isFocused ? 'text-orange-400' : 'text-slate-200 group-hover:text-orange-300'}`} size={28} />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className={`text-base md:text-lg font-bold truncate transition-all duration-300 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                  {ev.title}
                                </h3>
                                
                                {isFocused && (
                                  <span className="shrink-0 text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-md font-black uppercase tracking-wider animate-pulse">
                                    Now
                                  </span>
                                )}
                                
                                {ev.status === 'missed' && (
                                  <span className="shrink-0 px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold uppercase rounded-md tracking-wider">Overdue</span>
                                )}

                                {/* 🔥 5. DEADLINE URGENCY VISUAL */}
                                {remaining > 0 && remaining <= 60 && !isCompleted && (
                                  <span className="shrink-0 px-1.5 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold uppercase rounded flex items-center gap-1 animate-pulse border border-red-100">
                                    <Zap size={10} /> {Math.round(remaining)} min left
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex flex-col mt-2 gap-1.5">
                                <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                  <span className="px-2 py-1 bg-slate-50 text-slate-700 rounded-md border border-slate-100 flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      ev.priority === "high" ? "bg-red-500" :
                                      ev.priority === "medium" ? "bg-orange-400" :
                                      "bg-slate-300"
                                    }`} />
                                    {ev.time}
                                  </span>
                                  
                                  <span>{ev.type}</span>
                                  
                                  <span className={`px-2 py-1 rounded-md transition-colors ${
                                    ev.priority === 'high' ? 'bg-red-50 text-red-600' : 
                                    ev.priority === 'medium' ? 'bg-orange-50 text-orange-600' : 
                                    'bg-slate-100 text-slate-500'
                                  }`}>
                                    {ev.priority}
                                  </span>

                                  {isSoon && !isCompleted && (
                                    <span className="text-orange-500 font-black animate-pulse flex items-center gap-1">
                                      <Zap size={10} /> Starting Soon
                                    </span>
                                  )}
                                </div>
                                
                                {/* 🔥 3. COMPLETION WINDOW */}
                                {ev.status === 'pending' && (
                                  <span className="text-[10px] text-slate-400 font-medium normal-case tracking-normal">
                                    Complete between <span className="font-semibold">{getTimeWindow(ev.date, ev.time)}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 pt-4 lg:pt-0 border-t border-slate-100 lg:border-none mt-2 lg:mt-0 w-full lg:w-auto">
                            {!isCompleted && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(ev); }} 
                                className="p-2.5 bg-slate-50 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-xl transition-all active:scale-95"
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteWithUndo(ev.id); }} 
                              className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                                isCompleted ? 'bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-400' : 'bg-red-50 hover:bg-red-500 text-red-400 hover:text-white'
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