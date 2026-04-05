import React from "react";
import { Search, LayoutDashboard, CheckCircle2, Circle, Pencil, Trash2, Plus } from "lucide-react";
import { PlannerEvent, SystemLog } from "./types";

export type TabType = "today" | "all" | "logs";

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
  activeTab, setActiveTab, searchQuery, setSearchQuery, filteredEvents, logs, toggleStatus, deleteWithUndo, onEdit, onAddClick
}: EventListProps) {
  
  return (
    <div className="w-full lg:col-span-8 space-y-6 relative">
      
      {/* 1. DESKTOP HEADER (Hidden on mobile) */}
      <header className="space-y-1 hidden lg:block">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Task Planner</h1>
        <p className="text-base text-slate-500 font-medium tracking-tight">Manage your daily schedule and upcoming goals.</p>
      </header>

      {/* 2. CLEAN MOBILE TOP NAV (Removed the centered + Add button) */}
      <div className="flex lg:hidden items-center gap-2 px-4 py-3 sticky top-0 bg-white/95 backdrop-blur-md z-20 border-b border-slate-100 -mx-4 mb-4">
        <button
          onClick={() => setActiveTab("today")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            activeTab === "today" ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-slate-100 text-slate-700"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            activeTab === "all" ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-slate-100 text-slate-700"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            activeTab === "logs" ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-slate-100 text-slate-700"
          }`}
        >
          Activity
        </button>
      </div>

      {/* 3. DESKTOP CONTROLS (Hidden on mobile) */}
      <div className="hidden lg:flex justify-between items-center gap-4 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl">
        <div className="flex gap-1">
          {["today", "all", "logs"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as TabType)}
              className={`px-6 py-2.5 text-sm font-semibold transition-all whitespace-nowrap rounded-xl capitalize ${
                activeTab === tab ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800 border border-transparent"
              }`}
            >
              {tab === "logs" ? "Activity" : tab === "all" ? "All Tasks" : tab}
            </button>
          ))}
        </div>
        
        <div className="relative group w-64 pr-1.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500 text-sm font-medium transition-colors"
          />
        </div>
      </div>

      {/* 4. CONTENT AREA */}
      <div className="space-y-4">
        {activeTab === "logs" ? (
          
          /* ACTIVITY / LOGS */
          <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-5 lg:p-8 space-y-4 block">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={`${log.id}-${index}`} className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2 border-b border-slate-200 pb-4 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1.5 rounded-lg shrink-0">
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-sm text-slate-700 font-medium leading-snug">{log.details}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 text-sm font-medium py-10">No recent activity found.</p>
            )}
          </div>

        ) : filteredEvents.length > 0 ? (
          
          /* TASKS LIST */
          filteredEvents.map((ev, index) => (
            <div 
              key={`${ev.id}-${index}`} 
              onClick={() => toggleStatus(ev.id)}
              className="group cursor-pointer bg-white border border-slate-100 p-5 lg:p-6 rounded-[1.5rem] flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-orange-200 hover:shadow-md hover:shadow-slate-100 transition-all w-full"
            >
              <div className="flex items-center gap-4 min-w-0 w-full">
                <button className="shrink-0 transition-transform active:scale-90">
                  {ev.status === 'completed' ? (
                    <CheckCircle2 className="text-emerald-500" size={28} />
                  ) : ev.status === 'missed' ? (
                     <Circle className="text-red-200" size={28} />
                  ) : (
                    <Circle className="text-slate-200 lg:group-hover:text-orange-300 transition-colors" size={28} />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-base font-bold truncate transition-colors ${ev.status === 'completed' ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                      {ev.title}
                    </h3>
                    {ev.status === 'missed' && (
                      <span className="shrink-0 px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold uppercase rounded-md tracking-wider">Overdue</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <span className={`${ev.status === 'missed' ? 'text-red-400' : 'text-orange-500'}`}>{ev.time}</span>
                    <span>{ev.type}</span>
                    <span className={`px-2 py-0.5 rounded-md ${
                      ev.priority === 'high' ? 'bg-red-50 text-red-500' : 
                      ev.priority === 'medium' ? 'bg-orange-50 text-orange-500' : 
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {ev.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS (Thumb-friendly on mobile) */}
              <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity pt-3 lg:pt-0 border-t border-slate-50 lg:border-none mt-2 lg:mt-0 w-full lg:w-auto">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(ev); }} 
                  className="p-3 lg:p-2.5 bg-slate-50 lg:bg-transparent text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Edit Task"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteWithUndo(ev.id); }} 
                  className="p-3 lg:p-2.5 bg-red-50 lg:bg-transparent text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Delete Task"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50 px-6">
            <LayoutDashboard size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 font-bold text-sm">Your schedule is clear</p>
            <p className="text-slate-400 font-medium text-xs mt-1">Tap the + button to add a task</p>
          </div>
        )}
      </div>
    </div>
  );
}