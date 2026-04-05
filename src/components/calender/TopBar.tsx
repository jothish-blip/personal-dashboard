"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Target, 
  Search, 
  LayoutGrid, 
  BarChart3,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

// 🚨 THE FIX: Import the shared type instead of defining it locally
import { PlannerEvent } from "./types";

interface TopBarProps {
  onAddClick: () => void;
  events?: PlannerEvent[];
  filterMode?: string;
  setFilterMode?: (mode: any) => void;
}

export default function TopBar({ 
  onAddClick,
  events = [],
  filterMode = 'today',
  setFilterMode = () => {}
}: TopBarProps) {
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEvents = events.filter(e => e.date === todayStr);
    
    return {
      done: todayEvents.filter(e => e.status === 'completed').length,
      total: todayEvents.length,
      missed: todayEvents.filter(e => e.status === 'missed').length,
      rate: todayEvents.length > 0 
        ? Math.round((todayEvents.filter(e => e.status === 'completed').length / todayEvents.length) * 100) 
        : 0
    };
  }, [events]);

  const nextTask = useMemo(() => {
    return events
      .filter(e => e.status === "pending")
      .filter(e => new Date(`${e.date}T${e.time}`) > currentTime)
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time}`).getTime();
        const timeB = new Date(`${b.date}T${b.time}`).getTime();
        return timeA - timeB;
      })[0];
  }, [events, currentTime]);

  const timeString = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateString = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const statusLabel = stats.rate >= 70 ? "High Productivity" : stats.rate >= 40 ? "Steady Progress" : "Planning Phase";
  const statusColor = stats.rate >= 70 ? "bg-emerald-500" : stats.rate >= 40 ? "bg-orange-500" : "bg-slate-300";

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="px-4 md:px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <CheckCircle2 size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-none">TaskFlow</h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{statusLabel}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="text-slate-400">{dateString}</span>
              <span className="h-4 w-[1px] bg-slate-200" />
              <span className="text-slate-900">{timeString}</span>
            </div>
          </div>

          <div className="px-4 md:px-6 py-2 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span className="text-slate-900">{stats.done}/{stats.total} Completed</span>
              {stats.missed > 0 && <span className="text-red-500 flex items-center gap-1"><AlertCircle size={10}/> {stats.missed} Overdue</span>}
            </div>

            {nextTask ? (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full self-start md:self-auto">
                <Target size={12} className="text-orange-600" />
                <span className="text-[10px] font-bold text-orange-800">
                  NEXT: {nextTask.title} <span className="opacity-60 ml-1">at {nextTask.time}</span>
                </span>
              </div>
            ) : (
              <div className="text-[10px] font-medium text-slate-400">All tasks caught up</div>
            )}
          </div>

          <div className="hidden md:flex px-6 py-4 items-center justify-between">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setFilterMode('today')}
                className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${filterMode === 'today' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Today
              </button>
              <button 
                onClick={() => setFilterMode('all')}
                className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${filterMode === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                All Tasks
              </button>
            </div>

            <button 
              onClick={onAddClick}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-md shadow-orange-100"
            >
              <Plus size={18} strokeWidth={3} /> Add Task
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE THUMB NAVIGATION */}
      <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
        <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] p-2 shadow-2xl shadow-slate-300 border border-slate-200 flex items-center justify-between">
          <button className="p-4 text-slate-400">
            <LayoutGrid size={22} />
          </button>
          <button className="p-4 text-slate-400">
            <Search size={22} />
          </button>
          <button 
            onClick={onAddClick}
            className="flex items-center justify-center bg-orange-500 text-white h-14 w-14 rounded-full shadow-lg transition-transform active:scale-90"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
          <button className="p-4 text-slate-400">
            <BarChart3 size={22} />
          </button>
          <button className="p-4">
             <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                JD
             </div>
          </button>
        </div>
      </div>
    </>
  );
}