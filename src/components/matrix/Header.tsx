import React, { useState, useEffect } from 'react';
import { CalendarDays, Save, Lock, HelpCircle } from 'lucide-react';

interface HeaderProps {
  todayDataLength: number;
  yesterdayDataLength: number;
  tasksLength: number;
  globalWeekStats: { best: any; worst: any };
  meta: any;
  setMonthYear: (value: string) => void;
  addTask: (name: string, group: string) => void;
  showError: (msg: string) => void;
  lockToday: () => void;
  actualToday: string;
}

export default function Header({
  todayDataLength, yesterdayDataLength, tasksLength, globalWeekStats,
  meta, setMonthYear, addTask, showError, lockToday, actualToday
}: HeaderProps) {
  const [taskName, setTaskName] = useState('');
  const [taskGroup, setTaskGroup] = useState('');
  
  const [showHeaderHelp, setShowHeaderHelp] = useState(false);
  const isLocked = meta.lockedDates?.includes(actualToday);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem("header_help_seen")) {
      setShowHeaderHelp(true);
      localStorage.setItem("header_help_seen", "true");
    }
  }, []);

  const handleAdd = () => {
    if (!taskName.trim()) return showError("Objective required");
    addTask(taskName, taskGroup || 'General');
    setTaskName('');
  };

  const todayColor = todayDataLength === 0 
    ? 'text-red-500' 
    : todayDataLength < yesterdayDataLength 
      ? 'text-orange-500' 
      : 'text-green-600';

  return (
    <>
      {/* Header Guide Banner */}
      {showHeaderHelp && (
        <div className="bg-purple-50 border border-purple-100 text-purple-700 text-xs px-4 py-3 rounded-xl mx-4 mt-4 flex justify-between items-center shadow-sm animate-in fade-in slide-in-from-top-2 relative z-[90]">
          <span>This shows your daily performance compared to yesterday and your monthly trend.</span>
          <button 
            onClick={() => setShowHeaderHelp(false)} 
            className="font-bold text-purple-600 hover:text-purple-800 transition-colors ml-4 shrink-0"
          >
            Got it
          </button>
        </div>
      )}

      {/* DESKTOP HEADER */}
      <div className="hidden md:block p-4 z-[80] bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.04)] sticky top-0">
        <div className="max-w-[1500px] mx-auto flex flex-col gap-6">
          <div className="flex justify-between items-center">
            
            <div className="flex items-center gap-4 flex-wrap xl:flex-nowrap">
              
              {/* Today Section */}
              <div className="flex items-center gap-3 min-w-[180px] px-4 py-2 hover:bg-gray-50 rounded-xl transition-all cursor-default">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                    Today
                  </span>
                  <button onClick={() => setShowHeaderHelp(true)} className="text-gray-300 hover:text-gray-500 transition-colors">
                    <HelpCircle size={12}/>
                  </button>
                </div>
                <span className={`text-lg font-bold whitespace-nowrap ${todayColor}`}>
                  {todayDataLength}<span className="text-gray-400 font-normal">/{tasksLength}</span>
                </span>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                  ({actualToday})
                </span>
              </div>
              
              <div className="w-[1px] h-6 bg-gray-200 hidden md:block" />
              
              {/* Yesterday Section */}
              <div className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded-xl transition-all cursor-default">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                  Yesterday
                </span>
                <span className="text-lg font-bold text-gray-600 whitespace-nowrap">
                  {yesterdayDataLength}<span className="text-gray-400 font-normal">/{tasksLength}</span>
                </span>
              </div>
              
              {tasksLength > 0 && globalWeekStats.best && (
                <>
                  <div className="w-[1px] h-6 bg-gray-200 hidden md:block" />
                  
                  {/* Trend Section */}
                  <div className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded-xl transition-all cursor-default">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                      Trend
                    </span>
                    <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">
                      Best: <span className="text-green-600">{globalWeekStats.best.label}</span>
                    </span>
                    <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">
                      Weak: <span className="text-red-500">{globalWeekStats.worst.label}</span>
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-300 focus-within:border-orange-400 focus-within:bg-white transition-all duration-200 hover:scale-[1.01]">
                <CalendarDays size={16} className="text-gray-400" />
                <input 
                  type="month" 
                  value={meta.currentMonth} 
                  onChange={(e) => setMonthYear(e.target.value)} 
                  className="outline-none text-sm font-bold text-gray-700 bg-transparent cursor-pointer" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE HEADER */}
      <div className="md:hidden z-[80] bg-white/95 backdrop-blur-md border-b border-gray-200 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] sticky top-0">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <input 
              type="month" 
              value={meta.currentMonth} 
              onChange={(e) => setMonthYear(e.target.value)} 
              className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-transparent outline-none mb-1" 
            />
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-800 leading-none">Today's Output</h1>
              <button onClick={() => setShowHeaderHelp(true)} className="text-gray-300 hover:text-gray-500 transition-colors p-1 rounded hover:bg-gray-50">
                <HelpCircle size={14}/>
              </button>
            </div>
            <span className="text-[10px] text-gray-400 font-medium mt-1.5">{actualToday}</span>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-right mb-1">
              <span className={`text-xl font-bold ${todayColor}`}>{todayDataLength}</span>
              <span className="text-sm font-normal text-gray-400"> / {tasksLength}</span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium mb-1.5">
              Yesterday: {yesterdayDataLength}
            </span>
            <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-400 transition-all duration-500 ease-out"
                style={{ width: `${tasksLength ? (todayDataLength / tasksLength) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SHARED CONTROL BAR */}
      <div className="p-4 z-[70] bg-white border-b border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.03)] relative pb-6 md:pb-4">
        {/* 🔥 1. FIXED WRAPPER: Single line flex-nowrap on desktop, wrap on mobile if needed */}
        <div className="max-w-[1500px] mx-auto flex items-stretch md:items-center justify-between gap-4 flex-wrap md:flex-nowrap">
          
          {/* 🔥 2. FIXED INPUTS: flex-1 min-w-0 prevents breaking row */}
          <div className="flex items-center gap-3 flex-1 min-w-0 w-full md:w-auto">
            
            <div className="relative flex-1 min-w-0">
              {/* 🔥 4. FIXED HEIGHT: h-[44px] */}
              <input 
                type="text" 
                value={taskName} 
                onChange={(e) => setTaskName(e.target.value)} 
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                placeholder="Add a task (e.g. Workout, Study)..." 
                className="w-full h-[44px] px-4 rounded-xl border border-gray-200 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 bg-white text-gray-800 text-sm font-semibold placeholder:text-gray-400 transition-all duration-200 shadow-sm" 
              />
              {/* Hint positioned absolute so it doesn't break flex heights */}
              {tasksLength === 0 && (
                <span className="absolute top-full left-1 mt-1 text-[10px] text-gray-400 animate-in fade-in whitespace-nowrap">
                  Add tasks to start tracking performance
                </span>
              )}
            </div>
            
            <div className="relative shrink-0">
              {/* 🔥 4. FIXED HEIGHT: h-[44px] */}
              <input 
                type="text" 
                value={taskGroup} 
                onChange={(e) => setTaskGroup(e.target.value)} 
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                placeholder="GROUP" 
                className="w-[100px] md:w-[140px] h-[44px] px-4 rounded-xl border border-gray-200 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 font-bold text-[10px] uppercase tracking-widest bg-gray-50 text-gray-600 transition-all duration-200 shadow-sm" 
              />
              <span className="absolute top-full left-1 mt-1 text-[10px] text-gray-400 truncate w-full">
                Optional category
              </span>
            </div>
          </div>
          
          {/* 🔥 3. FIXED BUTTONS: shrink-0 to prevent them from squishing or dropping */}
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            {/* 🔥 4. FIXED HEIGHT: h-[44px] */}
            <button 
              onClick={handleAdd} 
              className="flex-1 md:flex-none h-[44px] px-8 bg-gray-900 border border-gray-900 text-white hover:bg-orange-500 hover:border-orange-500 rounded-xl font-bold text-xs tracking-widest transition-all duration-200 hover:scale-[1.02] shadow-sm"
            >
              ADD
            </button>
            
            <div title="Locks today so it cannot be edited later" className="flex-1 md:flex-none flex">
              {/* 🔥 4. FIXED HEIGHT: h-[44px] */}
              <button 
                onClick={() => { 
                  if(isLocked || tasksLength === 0) return; 
                  if(window.confirm(`Lock results for ${actualToday}? This cannot be undone.`)) lockToday(); 
                }} 
                className={`w-full h-[44px] px-6 rounded-xl font-bold text-xs tracking-widest flex items-center justify-center gap-2 transition-all duration-200 border shadow-sm ${isLocked ? 'bg-gray-50 text-green-600 border-green-200 cursor-not-allowed' : 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600 hover:scale-[1.02]'}`}
              >
                {isLocked ? <Lock size={14} /> : <Save size={14} />} {isLocked ? 'Day Locked' : 'Lock Today'}
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}