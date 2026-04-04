import React from "react";
import { Search, LayoutDashboard, CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import { PlannerEvent, SystemLog } from "./types";

interface EventListProps {
  activeTab: "today" | "pending" | "completed" | "logs";
  setActiveTab: (tab: "today" | "pending" | "completed" | "logs") => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filteredEvents: PlannerEvent[];
  logs: SystemLog[];
  toggleStatus: (id: string) => void;
  deleteWithUndo: (id: string) => void;
  onEdit: (ev: PlannerEvent) => void;
}

function NavTab({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
      }`}
    >
      {label}
    </button>
  );
}

export default function EventList({
  activeTab, setActiveTab, searchQuery, setSearchQuery, filteredEvents, logs, toggleStatus, deleteWithUndo, onEdit
}: EventListProps) {
  return (
    <div className="lg:col-span-8 space-y-8">
      <header className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Execution Engine</h1>
        <p className="text-slate-500 font-medium tracking-tight">Real-time status tracking for active system nodes.</p>
      </header>

      <div className="flex justify-between items-center">
        <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-xl overflow-x-auto">
          <NavTab active={activeTab === "today"} label="Active (Today)" onClick={() => setActiveTab("today")} />
          <NavTab active={activeTab === "pending"} label="Pending Queue" onClick={() => setActiveTab("pending")} />
          <NavTab active={activeTab === "completed"} label="Archive (Done)" onClick={() => setActiveTab("completed")} />
          <NavTab active={activeTab === "logs"} label="System Logs" onClick={() => setActiveTab("logs")} />
        </div>
        <div className="relative group w-64 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
          <input 
            type="text" placeholder="Filter memory..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 text-xs font-medium"
          />
        </div>
      </div>

      <div className="space-y-2">
        {activeTab === "logs" ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
            {logs.map(log => (
              <div key={log.id} className="flex justify-between items-center text-[11px] font-medium border-b border-white pb-2 last:border-0">
                <div className="flex gap-3">
                  <span className="text-orange-500 font-black">[{log.action}]</span>
                  <span className="text-slate-600">{log.details}</span>
                </div>
                <span className="text-slate-300">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map(ev => (
            <div key={ev.id} className="group bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-6 hover:border-orange-200 hover:shadow-sm transition-all">
              <button onClick={() => toggleStatus(ev.id)} className="shrink-0 transition-transform active:scale-90">
                {ev.status === 'completed' ? <CheckCircle2 className="text-emerald-500" size={26} /> : <Circle className="text-slate-200 group-hover:text-orange-300" size={26} />}
              </button>

              <div className="flex-1 min-w-0">
                <h3 className={`text-base font-bold ${ev.status === 'completed' ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                  {ev.title}
                </h3>
                <div className="flex items-center gap-4 mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="text-orange-500">{ev.time}</span>
                  <span>{ev.type}</span>
                  <span className={`px-2 py-0.5 rounded ${ev.priority === 'high' ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-500'}`}>
                    {ev.priority}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(ev)} className="p-2 text-slate-300 hover:text-slate-900"><Pencil size={18} /></button>
                <button onClick={() => deleteWithUndo(ev.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-3xl">
            <LayoutDashboard size={48} className="mx-auto text-slate-100 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active system records</p>
          </div>
        )}
      </div>
    </div>
  );
}