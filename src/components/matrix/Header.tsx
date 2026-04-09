import React, { useState } from 'react';
import { CalendarDays, Save, Lock } from 'lucide-react';

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
  const isLocked = meta.lockedDates?.includes(actualToday);

  const handleAdd = () => {
    if (!taskName.trim()) return showError("Objective required");
    addTask(taskName, taskGroup || 'General');
    setTaskName('');
  };

  return (
    <>
      {/* DESKTOP HEADER */}
      <div className="hidden md:block px-4 py-4 p-4 z-[70] bg-white border-b border-gray-100 z-[80] bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1500px] mx-auto flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Today</span>
                <span className="text-lg font-bold text-gray-800">{todayDataLength} <span className="text-gray-400 font-normal">/ {tasksLength}</span></span>
              </div>
              <div className="h-8 w-[1px] bg-gray-200" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Yesterday</span>
                <span className="text-lg font-bold text-gray-500">{yesterdayDataLength} <span className="text-gray-300 font-normal">/ {tasksLength}</span></span>
              </div>
              
              {tasksLength > 0 && globalWeekStats.best && (
                <>
                  <div className="h-8 w-[1px] bg-gray-200" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Month Trend</span>
                    <span className="text-sm font-semibold text-gray-600 mt-1">
                      Peak: <span className="text-green-600">{globalWeekStats.best.label}</span> <span className="text-gray-300 mx-1">|</span> Low: <span className="text-red-500">{globalWeekStats.worst.label}</span>
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1 hover:border-gray-300 transition-colors">
                <CalendarDays size={16} className="text-gray-400" />
                <input type="month" value={meta.currentMonth} onChange={(e) => setMonthYear(e.target.value)} className="outline-none text-sm font-bold text-gray-700 bg-transparent cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE HEADER */}
      <div className="md:hidden z-[80] bg-white border-b border-gray-100 px-4 py-4 shadow-sm">
        <div className="flex justify-between items-end">
          <div>
            <input type="month" value={meta.currentMonth} onChange={(e) => setMonthYear(e.target.value)} className="text-xs font-bold text-gray-600 uppercase tracking-widest bg-transparent outline-none mb-1" />
            <h1 className="text-2xl font-bold text-gray-800">Today</h1>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-gray-800">{todayDataLength}</span>
            <span className="text-sm font-normal text-gray-400"> / {tasksLength}</span>
          </div>
        </div>
      </div>

      {/* SHARED CONTROL BAR */}
      <div className="p-4 p-4 z-[70] bg-white border-b border-gray-100 z-[70] bg-white border-b border-gray-100">
        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 flex flex-col w-full">
            <div className="flex gap-2">
              <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="New performance objective..." className="flex-1 p-3 rounded-xl border border-gray-200 outline-none focus:border-orange-400 bg-white text-gray-800 text-sm font-semibold placeholder:text-gray-400" />
              <input type="text" value={taskGroup} onChange={(e) => setTaskGroup(e.target.value)} placeholder="GROUP" className="w-24 md:w-36 p-3 rounded-xl border border-gray-200 outline-none font-bold text-[10px] uppercase tracking-widest bg-gray-50 text-gray-600" />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handleAdd} className="flex-1 md:flex-none bg-white border border-gray-200 text-gray-800 px-6 py-3 rounded-xl font-bold text-xs tracking-widest hover:bg-gray-50 transition-colors">ADD</button>
            <button 
              onClick={() => { if(isLocked || tasksLength === 0) return; if(window.confirm(`Lock results for ${actualToday}? This cannot be undone.`)) lockToday(); }} 
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-xs tracking-widest flex items-center justify-center gap-2 transition-colors border ${isLocked ? 'bg-gray-50 text-green-600 border-green-200' : 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'}`}
            >
              {isLocked ? <Lock size={14} /> : <Save size={14} />} {isLocked ? 'LOCKED' : 'SAVE DAY'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}