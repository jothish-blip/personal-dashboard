import React from "react";
import { Search, LayoutDashboard, CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import { PlannerEvent, SystemLog } from "./types";

// Strict type import (matches your hook)
type TabType = "today" | "all" | "logs";

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
}

// 1. Mobile-friendly Tab Component
function NavTab({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-3 min-w-[110px] text-sm font-semibold transition-all whitespace-nowrap border-b-2 ${
        active 
          ? "bg-white text-slate-900 shadow-sm border-orange-500 rounded-t-xl" 
          : "text-slate-400 hover:text-slate-600 border-transparent rounded-xl"
      }`}
    >
      {label}
    </button>
  );
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
  activeTab, setActiveTab, searchQuery, setSearchQuery, filteredEvents, logs, toggleStatus, deleteWithUndo, onEdit
}: EventListProps) {
  
  // FORCE RENDER CHECK (Temp Debug)
  console.log("Current Active Tab:", activeTab);

  return (
    <div className="lg:col-span-8 space-y-6 md:space-y-8 relative">
      
      <header className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Task Planner</h1>
        <p className="text-sm md:text-base text-slate-500 font-medium tracking-tight">Manage your daily schedule and upcoming goals.</p>
      </header>

      {/* 2. STICKY TABS ROW */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm pb-2 pt-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        <div className="flex bg-slate-50 p-1 rounded-xl overflow-x-auto w-full md:w-auto scrollbar-hide shadow-sm border border-slate-100">
          <NavTab active={activeTab === "today"} label="Today" onClick={() => setActiveTab("today")} />
          <NavTab active={activeTab === "all"} label="All" onClick={() => setActiveTab("all")} />
          <NavTab active={activeTab === "logs"} label="Activity" onClick={() => setActiveTab("logs")} />
        </div>
        
        <div className="relative group w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-3 md:py-2 bg-slate-50 border border-slate-200 rounded-xl md:rounded-lg outline-none focus:bg-white focus:border-orange-500 text-sm font-medium transition-colors"
          />
        </div>
      </div>

      {/* List Content */}
      <div className="space-y-4 md:space-y-3">
        {activeTab === "logs" ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 md:p-6 space-y-4">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={`${log.id}-${index}`} className="flex flex-col md:flex-row md:justify-between md:items-center gap-1 border-b border-white pb-3 last:border-0">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
                    <span className="text-xs font-bold text-orange-500 whitespace-nowrap">
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">{log.details}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 text-xs font-medium py-8">No recent activity found.</p>
            )}
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((ev, index) => (
            <div 
              key={`${ev.id}-${index}`} 
              onClick={() => toggleStatus(ev.id)}
              className="group cursor-pointer bg-white border border-slate-100 p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 hover:border-orange-200 hover:shadow-md hover:shadow-slate-100 transition-all"
            >
              <div className="flex items-center gap-4 w-full">
                <button className="shrink-0 transition-transform active:scale-90">
                  {ev.status === 'completed' ? (
                    <CheckCircle2 className="text-emerald-500" size={26} />
                  ) : ev.status === 'missed' ? (
                     <Circle className="text-red-200" size={26} />
                  ) : (
                    <Circle className="text-slate-200 group-hover:text-orange-300" size={26} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-base font-bold truncate transition-colors ${ev.status === 'completed' ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                      {ev.title}
                    </h3>
                    {ev.status === 'missed' && (
                      <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[8px] font-black uppercase rounded tracking-tighter">Overdue</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className={`${ev.status === 'missed' ? 'text-red-400' : 'text-orange-500'}`}>{ev.time}</span>
                    <span>{ev.type}</span>
                    <span className={`px-2 py-0.5 rounded ${
                      ev.priority === 'high' ? 'bg-red-50 text-red-500' : 
                      ev.priority === 'medium' ? 'bg-orange-50 text-orange-500' : 
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {ev.priority}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity mt-2 md:mt-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(ev); }} 
                  className="p-2.5 md:p-2 bg-slate-50 md:bg-transparent text-slate-400 hover:text-slate-900 rounded-xl transition-colors"
                  title="Edit Task"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteWithUndo(ev.id); }} 
                  className="p-2.5 md:p-2 bg-red-50 md:bg-transparent text-red-400 hover:text-red-600 rounded-xl transition-colors"
                  title="Delete Task"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 md:py-24 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30 px-6">
            <LayoutDashboard size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-bold text-sm">No tasks here</p>
            <p className="text-slate-400 font-medium text-xs mt-1">Tap the + button to add one</p>
          </div>
        )}
      </div>
    </div>
  );
}