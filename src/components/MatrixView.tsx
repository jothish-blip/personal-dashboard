"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Save, Plus, X, Lock, CheckCircle2, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { Task, Meta } from '../types';

interface MatrixProps {
  tasks: Task[];
  meta: Meta;
  addTask: (name: string, group: string) => void;
  deleteTask: (id: number) => void;
  toggleTask: (id: number, date: string) => void;
  lockToday: () => void;
  setMonthYear: (value: string) => void;
  addAuditLog: (detail: string) => void;
}

const getLocalDate = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
};

export default function MatrixView({ 
  tasks, meta, addTask, deleteTask, toggleTask, lockToday, setMonthYear 
}: MatrixProps) {
  const [taskName, setTaskName] = useState('');
  const [taskGroup, setTaskGroup] = useState('');
  const [error, setError] = useState('');
  const [today, setToday] = useState(getLocalDate(new Date()));
  const todayRef = useRef<HTMLTableCellElement | null>(null);

  // --- 1. DATA ENGINE ---
  const { todayData, yesterdayData, weekData } = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    const yesterday = getLocalDate(d);

    const week = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = getLocalDate(date);
      week.push({
        date: dateStr,
        label: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: dateStr.slice(8),
        count: tasks.filter(t => t.history?.[dateStr]).length
      });
    }

    return {
      todayData: tasks.filter(t => t.history?.[today]),
      yesterdayData: tasks.filter(t => t.history?.[yesterday]),
      weekData: week
    };
  }, [tasks, today]);

  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [today]);

  const isTodayLocked = meta.lockedDates.includes(today);
  const [year, month] = meta.currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
  const groups = [...new Set(tasks.map(t => t.group))].sort();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F9FAFB] pb-24">
      
      {/* --- DESKTOP ONLY HEADER --- */}
      <div className="hidden md:block px-4 py-4 sticky top-0 z-[80] bg-[#F9FAFB] border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today</span>
                <span className="text-lg font-black text-slate-900">{todayData.length} <span className="text-gray-300">/ {tasks.length}</span></span>
              </div>
              <div className="h-8 w-[1px] bg-gray-200" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yesterday</span>
                <span className="text-lg font-black text-gray-400">{yesterdayData.length} <span className="text-gray-200">/ {tasks.length}</span></span>
              </div>
            </div>

            <div className="flex gap-1.5">
              {weekData.map(day => (
                <button 
                  key={day.date} 
                  onClick={() => setToday(day.date)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${day.date === today ? 'bg-white border-blue-200 shadow-sm' : 'border-transparent hover:bg-gray-100'}`}
                >
                  <span className={`text-[9px] font-bold ${day.date === today ? 'text-blue-600' : 'text-gray-400'}`}>{day.label} {day.dayNum}</span>
                  <div className={`text-xs font-black px-2 py-0.5 rounded-md ${day.count === tasks.length && tasks.length > 0 ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-600'}`}>
                    {day.count}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE ONLY HEADER --- */}
      <div className="md:hidden sticky top-0 z-[80] bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Today</h1>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{today}</p>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-slate-900">{todayData.length}</span>
            <span className="text-sm font-bold text-gray-300"> / {tasks.length}</span>
          </div>
        </div>
        
        {/* Horizontal Date Picker for Mobile */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {weekData.map(day => (
            <button
              key={day.date}
              onClick={() => setToday(day.date)}
              className={`flex-shrink-0 w-12 py-2 rounded-xl flex flex-col items-center border transition-all ${
                day.date === today ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-gray-50 border-gray-100 text-gray-500'
              }`}
            >
              <span className="text-[8px] font-black uppercase">{day.label}</span>
              <span className="text-sm font-black">{day.dayNum}</span>
            </button>
          ))}
        </div>
      </div>

      {/* --- SHARED CONTROL BAR --- */}
      <div className="p-4 bg-white border-b border-gray-100 sticky top-[145px] md:top-[110px] z-[70]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 flex flex-col w-full">
            <div className="flex gap-2">
              <input 
                type="text" value={taskName}
                onChange={(e) => { setTaskName(e.target.value); setError(''); }}
                placeholder="New objective..." 
                className="flex-1 p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 ring-blue-500/10 text-sm font-medium"
              />
              <input 
                type="text" value={taskGroup}
                onChange={(e) => setTaskGroup(e.target.value)}
                placeholder="GROUP" 
                className="w-24 md:w-36 p-3 rounded-xl border border-gray-50 outline-none font-black text-[10px] uppercase tracking-widest bg-gray-50/50"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => { if(!taskName.trim()) { setError("Name required"); return; } addTask(taskName, taskGroup || 'General'); setTaskName(''); }}
              className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs tracking-widest active:scale-95 transition-all shadow-sm"
            >ADD</button>
            <button 
              onClick={() => { if(isTodayLocked || tasks.length === 0) return; if(window.confirm(`Lock ${today}?`)) lockToday(); }}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-black text-xs tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm ${
                isTodayLocked ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isTodayLocked ? <Lock size={14} /> : <Save size={14} />}
              {isTodayLocked ? 'LOCKED' : 'SAVE DAY'}
            </button>
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* DESKTOP VIEW (Table) */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-[24px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="sticky left-0 z-50 bg-white border-b border-r border-gray-100 p-6 min-w-[280px]">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Objective Stream</span>
                  </th>
                  {daysArray.map(day => {
                    const dateStr = `${meta.currentMonth}-${day}`;
                    const isTodayCol = dateStr === today;
                    return (
                      <th key={day} ref={isTodayCol ? todayRef : null}
                        className={`border-b border-r border-gray-100 p-3 text-[10px] font-black text-center min-w-[50px] ${isTodayCol ? 'bg-blue-600 text-white z-10' : 'text-gray-400'}`}
                      >{parseInt(day)}</th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {groups.map(group => (
                  <React.Fragment key={group}>
                    <tr className="bg-slate-50/50">
                      <td className="sticky left-0 z-40 px-6 py-2 border-b border-r border-gray-100 bg-slate-50 font-black text-[9px] text-blue-600 uppercase tracking-widest">{group}</td>
                      <td colSpan={daysInMonth} className="border-b border-gray-100"></td>
                    </tr>
                    {tasks.filter(t => t.group === group).map(task => (
                      <tr key={task.id} className="group hover:bg-gray-50 transition-colors">
                        <td className="sticky left-0 z-40 bg-white border-b border-r border-gray-100 p-5 font-bold text-slate-800 text-sm">
                          <div className="flex justify-between items-center">
                            {task.name}
                            <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 p-1"><X size={14}/></button>
                          </div>
                        </td>
                        {daysArray.map(day => {
                          const dateStr = `${meta.currentMonth}-${day}`;
                          const isLocked = meta.lockedDates.includes(dateStr);
                          const isDone = !!task.history?.[dateStr];
                          return (
                            <td key={day} className={`text-center border-b border-r border-gray-50 p-0 ${dateStr === today ? 'bg-blue-50/20' : ''}`}>
                              <div className="h-12 flex items-center justify-center">
                                <input 
                                  type="checkbox" checked={isDone} disabled={isLocked}
                                  onChange={() => toggleTask(task.id, dateStr)}
                                  className={`w-5 h-5 rounded border-gray-300 transition-all cursor-pointer accent-slate-900 ${isDone ? 'opacity-40 scale-90' : 'hover:scale-110'}`}
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE VIEW (Task List) */}
        <div className="md:hidden space-y-8">
          {groups.map(group => (
            <div key={group} className="space-y-3">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {group}
              </h3>
              
              <div className="space-y-2">
                {tasks.filter(t => t.group === group).map(task => {
                  const isDone = !!task.history?.[today];
                  return (
                    <div 
                      key={task.id}
                      className={`flex items-center justify-between p-4 bg-white border rounded-2xl transition-all shadow-sm ${
                        isDone ? 'border-gray-100 opacity-60' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${isDone ? 'text-gray-400 line-through' : 'text-slate-800'}`}>
                          {task.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                         <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-300 active:text-rose-500">
                          <X size={18}/>
                        </button>
                        <input
                          type="checkbox"
                          checked={isDone}
                          disabled={isTodayLocked}
                          onChange={() => toggleTask(task.id, today)}
                          className="w-7 h-7 rounded-lg accent-slate-900 transition-transform active:scale-90"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Plus size={24} />
              </div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No objectives yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}