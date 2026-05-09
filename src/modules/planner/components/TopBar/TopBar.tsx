"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Target, 
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  LayoutList
} from "lucide-react";

import { PlannerEvent } from "../../types/types";

// --- TIMEZONE SAFE HELPER ---
const getLocalDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

export type TabType = "today" | "yesterday" | "tomorrow" | "range" | "logs";

interface TopBarProps {
  onAddClick: () => void;
  events?: PlannerEvent[];
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
}

export default function TopBar({ 
  onAddClick,
  events = [],
  activeTab = 'today',
  setActiveTab = () => {}
}: TopBarProps) {
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrollY, setScrollY] = useState(0); 

  // --- SCROLL LOGIC (GPU OPTIMIZED + THRESHOLD) ---
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY); 
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- TIME UPDATES ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- DERIVED DATA ---
  const stats = useMemo(() => {
    const todayStr = getLocalDate();
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
      .filter(e => {
        const eventTime = new Date(`${e.date}T${e.time}`);
        return eventTime.getTime() > currentTime.getTime();
      })
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time}`).getTime();
        const timeB = new Date(`${b.date}T${b.time}`).getTime();
        return timeA - timeB;
      })[0];
  }, [events, currentTime]);

  const timeString = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateString = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const statusLabel = stats.rate >= 70 ? "High Productivity" : stats.rate >= 40 ? "Steady Progress" : "Planning Phase";
  
  // --- SCROLL INTELLIGENCE ---
  // Keeps a slight visual compression effect if the user scrolls down
  const isCompressed = scrollY > 50;

  return (
    <>
      <nav 
        // ✅ FIX: Dynamically grabs the exact height of your Navbar using the CSS variable 
        // with a fallback of 80px and adds a 16px (1rem) gap below it.
        style={{
          marginTop: "calc(var(--navbar-h, 80px) + 1rem)"
        }}
        // ✅ FIX: Standard relative positioning. Removed sticky behavior and translate transforms.
        className={`relative z-10 bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isCompressed ? "shadow-sm" : "shadow-none"
        }`}
      >
        <div className={`max-w-[1500px] mx-auto px-4 md:px-6 transition-all duration-300 ${
          isCompressed ? "py-3 space-y-3" : "py-5 space-y-5"
        }`}>

          {/* ROW 1 — CONTEXT */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-50 text-orange-600 flex items-center justify-center rounded-lg">
                <CheckCircle2 size={16} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  NexTask Planner
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-gray-400 font-medium">
                    Track and execute your daily plan
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-400 font-medium">{dateString}</p>
              <p className="text-sm font-medium text-gray-900">{timeString}</p>
            </div>
          </div>

          {/* ROW 2 — EXECUTION SUMMARY */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6">
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between md:justify-start gap-4 text-xs font-medium">
                
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>{stats.done}/{stats.total} Done</span>
                </div>

                {stats.missed > 0 && (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle size={14} />
                    <span>{stats.missed} Missed</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-400 hidden sm:flex">
                  <Target size={14} />
                  <span>{statusLabel}</span>
                </div>
              </div>

              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{ width: `${stats.rate}%` }}
                />
              </div>
            </div>

            {nextTask ? (
              <div className="flex items-center justify-between md:justify-start gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium border border-orange-100 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer shrink-0">
                <div className="flex items-center gap-2">
                  <Target size={14} />
                  <span className="truncate max-w-[180px] font-semibold">
                    {nextTask.title}
                  </span>
                </div>
                <span className="text-[10px] opacity-70 ml-2 font-semibold">
                  {nextTask.time}
                </span>
              </div>
            ) : (
              <div className="text-xs text-gray-400 font-medium shrink-0 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                No upcoming tasks
              </div>
            )}
          </div>

          {/* ROW 3 — CONTROLS */}
          <div className="flex items-center justify-between">
            <div className="hidden md:flex bg-gray-50/50 p-1 rounded-lg border border-gray-100 overflow-hidden">
              <button
                onClick={() => setActiveTab('yesterday')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeTab === 'yesterday' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Yesterday
              </button>
              <button
                onClick={() => setActiveTab('today')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeTab === 'today' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setActiveTab('tomorrow')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeTab === 'tomorrow' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Tomorrow
              </button>
              <button
                onClick={() => setActiveTab('range')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeTab === 'range' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeTab === 'logs' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Activity
              </button>
            </div>

            <button
              onClick={onAddClick}
              className="flex items-center justify-center w-full md:w-auto gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 md:ml-auto"
            >
              <Plus size={16} /> Add Task
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE THUMB NAVIGATION */}
      <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-2 shadow-2xl shadow-gray-200 border border-gray-100 flex items-center justify-between px-6">
          <button 
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'today' ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <CalendarDays size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Today</span>
          </button>

          <button 
            onClick={onAddClick}
            className="flex items-center justify-center bg-orange-500 text-white h-14 w-14 rounded-full shadow-lg shadow-orange-200 transition-transform active:scale-90 -mt-2"
          >
            <Plus size={28} strokeWidth={3} />
          </button>

          <button 
            onClick={() => setActiveTab('range')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'range' ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <LayoutList size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Timeline</span>
          </button>
        </div>
      </div>
    </>
  );
}