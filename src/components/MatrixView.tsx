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
    addTask(taskName, taskGroup);
    setTaskName('');
  };

  return (
    <div className="flex-1 flex flex-col p-5 overflow-visible bg-gray-50 transition-colors">
      <div className="flex flex-col gap-3 mb-4 shrink-0 md:flex-row">
        <input 
          type="text" 
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="Define objective..." 
          className="flex-1 p-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm outline-none font-medium shadow-sm transition-colors focus:border-blue-500"
        />
        <input 
          type="text" 
          value={taskGroup}
          onChange={(e) => setTaskGroup(e.target.value)}
          placeholder="Category" 
          className="w-full md:w-36 p-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm outline-none shadow-sm transition-colors focus:border-blue-500"
        />
        <button 
          onClick={handleAdd}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold transition-colors shadow-sm"
        >
          ADD
        </button>
      </div>

      <div className="flex-1 border border-gray-200 rounded-xl relative bg-white shadow-sm transition-colors overflow-x-auto">
          <table className="min-w-max w-full border-separate border-spacing-0">
            <thead>
            <tr>
              <th className="sticky top-0 left-0 z-50 bg-gray-50 border-b border-r border-gray-200 p-3 text-left text-xs font-bold text-gray-500 min-w-[280px] transition-colors">
                OBJECTIVE / LEDGER
              </th>
              {daysArray.map(day => {
                const fullDate = `${meta.currentMonth}-${day}`;
                const isToday = fullDate === today;
                const isHidden = meta.isFocus && !isToday;
                
                if (isHidden) return null;
                return (
                  <th key={day} className={`sticky top-0 z-20 bg-gray-50 border-b border-r border-gray-200 p-3 text-xs text-center min-w-[45px] transition-colors ${isToday ? 'text-blue-600 font-black bg-blue-50' : 'text-gray-500'}`}>
                    {parseInt(day)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={daysInMonth + 1} className="text-center p-20 text-gray-500 bg-white transition-colors">
                  Zero active objectives. Start the engine above.
                </td>
              </tr>
            ) : (
              groups.map(group => (
                <React.Fragment key={group}>
                  <tr>
                    {/* FIXED: Made the category text sticky to the left */}
                    <td className="sticky left-0 z-40 bg-gray-100 px-4 py-2 font-black text-[10px] text-gray-500 tracking-widest border-b border-r border-gray-200 transition-colors">
                      # {group}
                    </td>
                    {/* Empty cell that spans the remaining columns */}
                    <td colSpan={meta.isFocus ? 1 : daysInMonth} className="bg-gray-100 border-b border-gray-200 transition-colors"></td>
                  </tr>
                  {tasks.filter(t => t.group === group).map(task => (
                    <tr key={task.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="sticky left-0 z-40 min-w-[280px] bg-white group-hover:bg-gray-50 border-b border-r border-gray-200 transition-colors">
                        <div className="flex justify-between items-center p-3">
                          <span className="font-bold text-sm text-gray-900">{task.name}</span>
                          <button onClick={() => deleteTask(task.id)} className="text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity p-1">
                            ✕
                          </button>
                        </div>
                      </td>
                      {daysArray.map(day => {
                        const fullDate = `${meta.currentMonth}-${day}`;
                        const isToday = fullDate === today;
                        const isHidden = meta.isFocus && !isToday;
                        
                        if (isHidden) return null;
                        return (
                          <td key={day} className={`text-center border-b border-r border-gray-200 p-2 transition-colors ${isToday ? 'bg-blue-50/50' : ''}`}>
                            <input 
                              type="checkbox" 
                              checked={!!task.history[fullDate]}
                              onChange={() => toggleTask(task.id, fullDate)}
                              className="w-4 h-4 cursor-pointer accent-blue-600"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}