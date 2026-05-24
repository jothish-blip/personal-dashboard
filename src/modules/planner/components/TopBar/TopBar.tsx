"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  CalendarDays,
  LayoutList,
  History,
  SkipBack,
  AlertCircle
} from "lucide-react";

import { PlannerEvent } from "../../types/types";
import { useTheme } from "@/theme/ThemeProvider";

// --- TIMEZONE SAFE HELPER ---
const getLocalDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

export type TabType = "today" | "yesterday" | "tomorrow" | "objectives" | "range" | "logs";

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
  
  const { isDarkMode } = useTheme();
  const [dateString, setDateString] = useState("");
  const [greeting, setGreeting] = useState("Good Day");

  // Set date statically on mount to prevent hydration mismatch
  useEffect(() => {
    const now = new Date();
    setDateString(now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase());
    
    const currentHour = now.getHours();
    if (currentHour < 12) setGreeting("Good Morning");
    else if (currentHour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // --- DERIVED CONTEXT DATA ---
  const todayStr = getLocalDate();
  const todayEvents = events.filter(e => e.date === todayStr);
  const pendingToday = todayEvents.filter(e => e.status === 'pending');
  const missedTotal = events.filter(e => e.status === 'missed').length;

  const nextTask = useMemo(() => {
    const now = new Date();
    return pendingToday
      .filter(e => {
        const eventTime = new Date(`${e.date}T${e.time}`);
        return eventTime.getTime() > now.getTime();
      })
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time}`).getTime();
        const timeB = new Date(`${b.date}T${b.time}`).getTime();
        return timeA - timeB;
      })[0];
  }, [pendingToday]);

  return (
    <>
      <nav 
        style={{ marginTop: "calc(var(--navbar-h, 80px) + 1rem)" }}
        className={`relative z-10 rounded-[2.5rem] border transition-all duration-300 ${
          isDarkMode ? "bg-[#111111]/80 backdrop-blur-xl border-gray-800" : "bg-white/80 backdrop-blur-xl border-slate-200"
        }`}
      >
        <div className="max-w-[1500px] mx-auto px-6 md:px-10 py-6 md:py-7 flex flex-col lg:flex-row justify-between gap-6 lg:gap-10">

          {/* SECTION 1 — CONTEXT HEADER */}
          <div className="flex items-start justify-between gap-4 flex-1">
            <div className="space-y-2 flex-1">
              <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {greeting}
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                Today • {dateString}
              </p>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pt-2">
                <p className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>
                  {pendingToday.length === 0 
                    ? "You're clear for today." 
                    : `${pendingToday.length} objective${pendingToday.length > 1 ? 's' : ''} remaining today.`
                  }
                </p>

                {/* RECOVERY ALERT */}
                {missedTotal > 0 && (
                  <button 
                    onClick={() => setActiveTab('objectives')} 
                    className={`inline-flex w-fit items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                      isDarkMode 
                        ? "bg-red-950/30 text-red-400 border-red-900/50 hover:bg-red-950/50" 
                        : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                    }`}
                  >
                    <AlertCircle size={12} />
                    {missedTotal} missed task{missedTotal > 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>

            {/* DESKTOP ADD TASK */}
            <div className="hidden md:block shrink-0 mt-1">
              <button
                onClick={onAddClick}
                className="
                  flex items-center gap-2
                  bg-orange-500 hover:bg-orange-600
                  text-white
                  px-5 py-3
                  rounded-2xl
                  font-semibold
                  shadow-lg shadow-orange-500/15
                  transition-all duration-200
                  active:scale-[0.98]
                "
              >
                <Plus size={18} strokeWidth={2.5} />
                Add Task
              </button>
            </div>
          </div>

          {/* SECTION 2 — NEXT OBJECTIVE */}
          <div className="flex-1 lg:max-w-sm flex items-center">
            <div className={`w-full p-5 rounded-[1.5rem] border ${
              isDarkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-slate-50 border-slate-200"
            }`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>
                Next Objective
              </p>
              {nextTask ? (
                <>
                  <h3 className={`text-base font-bold truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {nextTask.title}
                  </h3>
                  <p className={`text-xs font-semibold mt-1 ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>
                    {nextTask.time}
                  </p>
                </>
              ) : (
                <p className={`text-sm font-semibold mt-1 ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>
                  Nothing scheduled next.
                </p>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE THUMB NAVIGATION (5-Tab Layout) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm">
        <div className={`rounded-[2rem] p-2 flex items-center justify-between px-5 shadow-2xl border backdrop-blur-xl ${
          isDarkMode ? "bg-[#111111]/95 border-gray-800 shadow-black/50" : "bg-white/95 border-slate-200 shadow-slate-200/50"
        }`}>
          <button 
            onClick={() => setActiveTab('yesterday')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'yesterday' ? 'text-orange-500' : (isDarkMode ? 'text-gray-500 hover:text-orange-400' : 'text-slate-400 hover:text-orange-500')}`}
          >
            <SkipBack size={20} strokeWidth={2.5} />
            <span className="text-[9px] font-bold">Yesterday</span>
          </button>

          <button 
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'today' ? 'text-orange-500' : (isDarkMode ? 'text-gray-500 hover:text-orange-400' : 'text-slate-400 hover:text-orange-500')}`}
          >
            <CalendarDays size={20} strokeWidth={2.5} />
            <span className="text-[9px] font-bold">Today</span>
          </button>

          {/* Center Orange FAB */}
          <button 
            onClick={onAddClick}
            className={`flex items-center justify-center h-12 w-12 rounded-full transition-transform active:scale-90 -mt-5 shadow-lg shadow-orange-500/30 border-4 bg-orange-500 text-white hover:bg-orange-600 ${
              isDarkMode ? "border-[#111111]" : "border-white"
            }`}
          >
            <Plus size={24} strokeWidth={3} />
          </button>

          <button 
            onClick={() => setActiveTab('range')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'range' ? 'text-orange-500' : (isDarkMode ? 'text-gray-500 hover:text-orange-400' : 'text-slate-400 hover:text-orange-500')}`}
          >
            <LayoutList size={20} strokeWidth={2.5} />
            <span className="text-[9px] font-bold">Timeline</span>
          </button>

          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'logs' ? 'text-orange-500' : (isDarkMode ? 'text-gray-500 hover:text-orange-400' : 'text-slate-400 hover:text-orange-500')}`}
          >
            <History size={20} strokeWidth={2.5} />
            <span className="text-[9px] font-bold">History</span>
          </button>
        </div>
      </div>
    </>
  );
}