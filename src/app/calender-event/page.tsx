"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Navbar from "@/components/Navbar";
import { 
  Plus, CheckCircle2, Circle, XCircle, 
  TrendingUp, AlertCircle, Clock, 
  Target, X, ListTodo, Calendar as CalendarIcon, 
  LayoutDashboard, Flame, BarChart3, PieChart,
  Search, ArrowRight, Pencil, Trash2, Zap, Brain,
  History, RotateCcw, Download, ShieldCheck, Activity,
  Mail, Construction, Terminal
} from "lucide-react";

// --- CONFIGURATION & CONSTANTS ---
const SYSTEM_VERSION = 1.2;
const STORAGE_KEY = "matrix_planner_v5_pro";

type EventStatus = "pending" | "completed" | "missed";
type Priority = "high" | "medium" | "low";
type TaskType = "Work" | "Study" | "Health" | "Finance" | "Personal" | "Deep Work" | "Learning" | "Meeting";

interface SystemLog {
  id: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_TOGGLE" | "RESCHEDULE";
  details: string;
  timestamp: number;
}

interface PlannerEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: TaskType;
  priority: Priority;
  status: EventStatus;
  history: Record<string, EventStatus>; 
  createdAt: number;
}

interface SystemPayload {
  events: PlannerEvent[];
  logs: SystemLog[];
  version: number;
  lastSync: number;
}

export default function MatrixIntelligenceSystem() {
  // --- CORE STATE ---
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [activeTab, setActiveTab] = useState<"today" | "pending" | "completed" | "logs">("today");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // POPUP STATE
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isReady, setIsReady] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    title: "",
    date: new Date().toISOString().split('T')[0],
    time: "09:00",
    type: "Work" as TaskType,
    priority: "medium" as Priority
  });

  // --- 1. THE STORAGE & POPUP ENGINE ---
  useEffect(() => {
    // Check if user has seen the "Still in Progress" message this session
    const hasSeenStatus = sessionStorage.getItem("matrix_status_seen");
    if (!hasSeenStatus) {
      setIsStatusModalOpen(true);
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const payload: SystemPayload = JSON.parse(raw);
        setEvents(payload.events || []);
        setLogs(payload.logs || []);
      } catch (e) {
        console.error("System Restore Failed", e);
      }
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const payload: SystemPayload = {
      events,
      logs: logs.slice(0, 50),
      version: SYSTEM_VERSION,
      lastSync: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [events, logs, isReady]);

  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    sessionStorage.setItem("matrix_status_seen", "true");
  };

  // --- 2. AUDIT LOG ENGINE ---
  const createLog = (action: SystemLog["action"], details: string) => {
    const newLog: SystemLog = {
      id: `log_${Date.now()}`,
      action,
      details,
      timestamp: Date.now()
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // --- 3. ANALYTICS ENGINE ---
  const analytics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEvents = events.filter(e => e.date === todayStr);
    
    const statusCounts = {
      completed: events.filter(e => e.status === "completed").length,
      pending: events.filter(e => e.status === "pending").length,
      missed: events.filter(e => e.status === "missed").length
    };

    const weeklyTrend = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split('T')[0];
      const count = events.filter(e => e.date === ds && e.status === "completed").length;
      return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), val: count };
    });
    const maxVal = Math.max(...weeklyTrend.map(t => t.val), 1);

    return {
      score: (statusCounts.completed * 2) - statusCounts.missed,
      rate: events.length ? Math.round((statusCounts.completed / events.length) * 100) : 0,
      statusCounts,
      weeklyTrend,
      maxVal,
      today: { done: todayEvents.filter(e => e.status === "completed").length, total: todayEvents.length }
    };
  }, [events]);

  // --- 4. ACTION CONTROLLERS ---
  const handleSave = () => {
    if (!formData.title) return;
    if (formData.id) {
      setEvents(prev => prev.map(e => e.id === formData.id ? { ...e, ...formData } : e));
      createLog("UPDATE", `Modified task: ${formData.title}`);
    } else {
      const newId = `mtx_${Date.now()}`;
      const newEv: PlannerEvent = {
        ...formData,
        id: newId,
        status: "pending",
        history: { [formData.date]: "pending" },
        createdAt: Date.now()
      };
      setEvents(prev => [...prev, newEv]);
      createLog("CREATE", `New entry: ${formData.title}`);
    }
    setIsAddModalOpen(false);
    setFormData({ id: "", title: "", date: new Date().toISOString().split('T')[0], time: "09:00", type: "Work", priority: "medium" });
  };

  const toggleStatus = (id: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === id) {
        const nextStatus = e.status === "completed" ? "pending" : "completed";
        createLog("STATUS_TOGGLE", `${e.title} -> ${nextStatus.toUpperCase()}`);
        return { ...e, status: nextStatus, history: { ...e.history, [e.date]: nextStatus } };
      }
      return e;
    }));
  };

  const deleteWithUndo = (id: string) => {
    const target = events.find(e => e.id === id);
    setEvents(prev => prev.filter(e => e.id !== id));
    createLog("DELETE", `Removed task: ${target?.title}`);
  };

  const filteredEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeTab === "pending") return e.status === "pending";
      if (activeTab === "completed") return e.status === "completed";
      return e.date === today;
    }).sort((a, b) => a.time.localeCompare(b.time));
  }, [events, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
      <Navbar 
        meta={{ currentMonth: "2026-04", isFocus: false, theme: 'light', lockedDates: [], rollbackUsedDates: [] }}
        setMonthYear={() => {}} exportData={() => {}} importData={() => {}}
      />

      {/* MATRIX TOP STATUS BAR */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-orange-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">v{SYSTEM_VERSION} Operational</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"><Download size={16} /></button>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 transition-all flex items-center gap-2">
              <Plus size={14} /> New Record
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        <div className="lg:col-span-8 space-y-8">
          <header className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Execution Engine</h1>
            <p className="text-slate-500 font-medium tracking-tight">Real-time status tracking for active system nodes.</p>
          </header>

          <div className="flex justify-between items-center">
            <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-xl">
              <NavTab active={activeTab === "today"} label="Active (Today)" onClick={() => setActiveTab("today")} />
              <NavTab active={activeTab === "pending"} label="Pending Queue" onClick={() => setActiveTab("pending")} />
              <NavTab active={activeTab === "completed"} label="Archive (Done)" onClick={() => setActiveTab("completed")} />
              <NavTab active={activeTab === "logs"} label="System Logs" onClick={() => setActiveTab("logs")} />
            </div>
            <div className="relative group w-64">
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
                    <button onClick={() => { setFormData(ev); setIsAddModalOpen(true); }} className="p-2 text-slate-300 hover:text-slate-900"><Pencil size={18} /></button>
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

        <div className="lg:col-span-4 space-y-10">
          <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
             <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Core Performance</span>
                  <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold">
                    <ShieldCheck size={12} /> Live Sync
                  </div>
                </div>
                <div>
                   <h2 className="text-7xl font-bold tracking-tighter leading-none">{analytics.score}</h2>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Net Efficiency Index</p>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                     <span>Global Accuracy</span>
                     <span>{analytics.rate}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${analytics.rate}%` }} />
                   </div>
                </div>
             </div>
             <BarChart3 className="absolute -right-10 -bottom-10 text-white/5" size={240} />
          </div>

          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-6">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Status Allocation</h3>
             <div className="flex justify-center py-4">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                    <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f97316" strokeWidth="4" 
                      strokeDasharray={`${analytics.rate}, 100`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{analytics.statusCounts.completed}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase">Records</span>
                  </div>
                </div>
             </div>
             <div className="grid grid-cols-3 gap-2">
                <MiniStatus label="Done" val={analytics.statusCounts.completed} color="bg-emerald-500" />
                <MiniStatus label="Wait" val={analytics.statusCounts.pending} color="bg-orange-500" />
                <MiniStatus label="Miss" val={analytics.statusCounts.missed} color="bg-red-500" />
             </div>
          </div>
        </div>
      </main>

      {/* --- POPUP MESSAGE (STILL IN PROGRESS) --- */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden relative border border-orange-100">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-orange-500" />
            
            <div className="p-8 md:p-10 space-y-6">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-orange-50 rounded-2xl">
                  <Construction className="text-orange-600" size={32} />
                </div>
                <button 
                  onClick={closeStatusModal}
                  className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-black text-slate-900 leading-tight">
                  System Under Development
                </h2>
                <div className="flex items-center gap-2 text-orange-600">
                  <Terminal size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Active Progress Mode</span>
                </div>
              </div>

              <div className="space-y-4 text-slate-600 text-sm leading-relaxed font-medium">
                <p>
                  This system is currently <span className="text-slate-900 font-bold">Under Progress</span>. We are working hard with our developers to bring you advanced modules and refined logic.
                </p>
                <p>
                  As this is an alpha build, you might encounter <span className="text-orange-600 font-bold">bugs</span>. We appreciate your patience as we stabilize the core features. Many more capabilities are scheduled for deployment soon.
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Feedback & Reports</p>
                  <a href="mailto:jothishgandham2@gmail.com" className="flex items-center gap-2 text-slate-900 hover:text-orange-600 transition-colors">
                    <Mail size={14} />
                    <span className="font-bold underline">jothishgandham2@gmail.com</span>
                  </a>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Developer Lead</p>
                  <p className="text-sm font-black text-slate-900">Jothish Gandham</p>
                </div>
                <button 
                  onClick={closeStatusModal}
                  className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM MODAL (FOR ADDING RECORDS) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-10 space-y-10">
              <header className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Initialize Node</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-300 hover:text-slate-900"><X size={24} /></button>
              </header>

              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descriptor</label>
                  <input 
                    autoFocus type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Objective Detail..." 
                    className="w-full py-4 border-b border-slate-100 focus:border-orange-500 outline-none font-bold text-xl placeholder:text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp (Date)</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full py-2 bg-transparent outline-none font-bold text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Time</label>
                    <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full py-2 bg-transparent outline-none font-bold text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Domain Group</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TaskType})} className="w-full py-2 bg-transparent outline-none font-bold text-sm">
                      {["Work", "Study", "Health", "Finance", "Personal", "Deep Work", "Learning", "Meeting"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority Level</label>
                    <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as Priority})} className="w-full py-2 bg-transparent outline-none font-bold text-sm">
                      <option value="low">Low Impact</option><option value="medium">Medium Impact</option><option value="high">High Impact</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                >
                  Write to System Memory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- ATOMIC COMPONENTS ---
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

function MiniStatus({ label, val, color }: { label: string, val: number, color: string }) {
  return (
    <div className="bg-slate-50 p-3 rounded-xl text-center">
      <div className={`w-2 h-2 ${color} rounded-full mx-auto mb-1`} />
      <p className="text-[8px] font-black text-slate-400 uppercase">{label}</p>
      <p className="text-xs font-bold">{val}</p>
    </div>
  );
}