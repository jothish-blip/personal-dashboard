"use client";

import React, { useState } from 'react';
import { Task, Meta } from '../types';

interface MatrixProps {
  tasks: Task[];
  meta: Meta;
  addTask: (name: string, group: string) => void;
  deleteTask: (id: number) => void;
  toggleTask: (id: number, date: string) => void;
}

export default function MatrixView({ tasks, meta, addTask, deleteTask, toggleTask }: MatrixProps) {
  const [taskName, setTaskName] = useState('');
  const [taskGroup, setTaskGroup] = useState('');

  const daysInMonth = new Date(parseInt(meta.currentMonth.split('-')[0]), parseInt(meta.currentMonth.split('-')[1]), 0).getDate();
  const today = new Date().toISOString().split('T')[0];
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
  
  const groups = [...new Set(tasks.map(t => t.group))].sort();

  const handleAdd = () => {
    if (!taskName.trim()) return;
    addTask(taskName, taskGroup || 'General');
    setTaskName('');
    setTaskGroup('');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50 pb-20 md:pb-5">
      {/* Input Header - Stacked on mobile, row on desktop */}
      <div className="p-4 md:p-6 bg-white border-b border-gray-200 sticky top-0 z-[60] shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col gap-2 md:flex-row">
          <input 
            type="text" 
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="New objective..." 
            className="flex-1 p-3 rounded-xl border border-gray-300 text-base md:text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <div className="flex gap-2">
            <input 
              type="text" 
              value={taskGroup}
              onChange={(e) => setTaskGroup(e.target.value)}
              placeholder="Tag" 
              className="w-1/3 md:w-36 p-3 rounded-xl border border-gray-300 text-base md:text-sm outline-none focus:border-blue-500 transition-all"
            />
            <button 
              onClick={handleAdd}
              className="flex-1 md:w-auto bg-blue-600 active:scale-95 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
            >
              ADD
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-2 md:p-6">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="text-4xl mb-4">🚀</div>
            <p className="text-sm font-medium">No objectives set for this month.</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {/* Desktop Matrix View - Hidden on small screens */}
            <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
              <table className="min-w-max w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-50 bg-gray-100 border-b border-r border-gray-200 p-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[280px]">
                      Objective
                    </th>
                    {daysArray.map(day => {
                      const fullDate = `${meta.currentMonth}-${day}`;
                      const isToday = fullDate === today;
                      if (meta.isFocus && !isToday) return null;
                      return (
                        <th key={day} className={`border-b border-r border-gray-200 p-2 text-xs text-center min-w-[45px] ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500'}`}>
                          {parseInt(day)}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {groups.map(group => (
                    <React.Fragment key={group}>
                      <tr className="bg-gray-50/50">
                        <td className="sticky left-0 z-40 px-4 py-2 font-black text-[10px] text-blue-600 border-b border-r border-gray-200 uppercase tracking-widest">
                          {group}
                        </td>
                        <td colSpan={daysInMonth} className="border-b border-gray-200"></td>
                      </tr>
                      {tasks.filter(t => t.group === group).map(task => (
                        <tr key={task.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="sticky left-0 z-40 bg-white border-b border-r border-gray-200 p-4 group">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-gray-800">{task.name}</span>
                              <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                ✕
                              </button>
                            </div>
                          </td>
                          {daysArray.map(day => {
                            const fullDate = `${meta.currentMonth}-${day}`;
                            const isToday = fullDate === today;
                            if (meta.isFocus && !isToday) return null;
                            return (
                              <td key={day} className={`text-center border-b border-r border-gray-200 p-0 ${isToday ? 'bg-blue-50' : ''}`}>
                                <label className="flex items-center justify-center w-full h-12 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={!!task.history[fullDate]}
                                    onChange={() => toggleTask(task.id, fullDate)}
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                </label>
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

            {/* Mobile Card View - Hidden on large screens */}
            <div className="md:hidden space-y-6">
              {groups.map(group => (
                <div key={group} className="space-y-3">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">
                    // {group}
                  </h3>
                  {tasks.filter(t => t.group === group).map(task => (
                    <div key={task.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="p-4 flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-base">{task.name}</h4>
                        </div>
                        <div className="flex items-center gap-4">
                           {/* Quick toggle for Today */}
                           <div className="flex flex-col items-center">
                              <span className="text-[9px] font-bold text-blue-500 mb-1">TODAY</span>
                              <input 
                                type="checkbox" 
                                checked={!!task.history[today]}
                                onChange={() => toggleTask(task.id, today)}
                                className="w-7 h-7 rounded-lg border-gray-300 text-blue-600"
                              />
                           </div>
                           <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-300">
                            ✕
                          </button>
                        </div>
                      </div>
                      
                      {/* Horizontal Mini-Scroller for history */}
                      <div className="bg-gray-50 flex overflow-x-auto p-3 gap-2 border-t border-gray-100 no-scrollbar">
                        {daysArray.map(day => {
                          const fullDate = `${meta.currentMonth}-${day}`;
                          const isToday = fullDate === today;
                          return (
                            <button
                              key={day}
                              onClick={() => toggleTask(task.id, fullDate)}
                              className={`flex-shrink-0 w-10 h-12 rounded-xl flex flex-col items-center justify-center transition-all border ${
                                task.history[fullDate] 
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                  : isToday 
                                    ? 'bg-white border-blue-200 text-blue-600' 
                                    : 'bg-white border-gray-200 text-gray-400'
                              }`}
                            >
                              <span className="text-[9px] font-bold uppercase">{isToday ? 'Now' : day}</span>
                              <div className={`w-1.5 h-1.5 rounded-full mt-1 ${task.history[fullDate] ? 'bg-white' : 'bg-transparent border border-current'}`} />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}