import React from 'react';
import { LayoutGrid, ListTodo, BookOpen, Wallet, CalendarDays, Download, Upload } from "lucide-react";

interface MobileNavProps {
  activePaths: {
    isTasks: boolean;
    isMini: boolean;
    isDiary: boolean;
    isFinance: boolean;
    isCalendar: boolean;
  };
  handleNav: (path: string) => void;
  y: string;
  m: string;
  years: number[];
  setMonthYear: (val: string) => void;
  handleImportClick: () => void;
  exportData: () => void;
}

export default function MobileNav({
  activePaths, handleNav, y, m, years, setMonthYear, handleImportClick, exportData
}: MobileNavProps) {
  return (
    <div className="md:hidden px-4 py-3 space-y-3">
      
      {/* ROW 1: Brand & Data Actions */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-gray-800">
          NexTask <span className="text-orange-500 font-bold">v1.2</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleImportClick}
            className="p-2 rounded-md border border-gray-200 bg-white text-orange-500 active:scale-90 transition-transform shadow-sm"
          >
            <Download size={16} />
          </button>
          <button 
            onClick={exportData}
            className="p-2 rounded-md border border-gray-200 bg-white text-green-600 active:scale-90 transition-transform shadow-sm"
          >
            <Upload size={16} />
          </button>
        </div>
      </div>

      {/* ROW 2: ANIMATED SLIDING SWITCHER */}
      <div className="relative flex bg-gray-100 p-1 rounded-lg w-full">
        <div 
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-md shadow-sm border border-gray-200/50 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-0"
          style={{ transform: activePaths.isMini ? 'translateX(100%)' : 'translateX(0)' }}
        />
        <button
          onClick={() => handleNav('/')}
          className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-colors duration-300 active:scale-95 ${
            activePaths.isTasks ? 'text-orange-600' : 'text-gray-500'
          }`}
        >
          <LayoutGrid size={14} /> Tasks
        </button>
        <button
          onClick={() => handleNav('/mini-nisc')}
          className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-colors duration-300 active:scale-95 ${
            activePaths.isMini ? 'text-orange-600' : 'text-gray-500'
          }`}
        >
          <ListTodo size={14} /> Mini
        </button>
      </div>

      {/* ROW 3: SECONDARY TOOLS GRID */}
      <div className="flex gap-2 w-full">
        <button 
          onClick={() => handleNav('/diary')}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-md border text-xs font-bold transition-all duration-300 active:scale-95 ${
            activePaths.isDiary ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 shadow-sm'
          }`}
        >
          <BookOpen size={14} /> Diary
        </button>
        <button 
          onClick={() => handleNav('/finance')}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-md border text-xs font-bold transition-all duration-300 active:scale-95 ${
            activePaths.isFinance ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 shadow-sm'
          }`}
        >
          <Wallet size={14} /> Finance
        </button>
        <button 
          onClick={() => handleNav('/calender-event')}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-md border text-xs font-bold transition-all duration-300 active:scale-95 ${
            activePaths.isCalendar ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 shadow-sm'
          }`}
        >
          <CalendarDays size={14} /> Planner
        </button>
      </div>

      {/* ROW 4: Date Controls */}
      <div className="flex gap-2">
        <select
          value={y}
          onChange={(e) => setMonthYear(`${e.target.value}-${m}`)}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs font-medium text-gray-700 outline-none active:scale-[0.98] transition-transform shadow-sm"
        >
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
        <select
          value={m}
          onChange={(e) => setMonthYear(`${y}-${e.target.value}`)}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs font-medium text-gray-700 outline-none active:scale-[0.98] transition-transform shadow-sm"
        >
          {Array.from({ length: 12 }, (_, i) => {
            const val = String(i + 1).padStart(2, '0');
            const name = new Date(2024, i).toLocaleString('default', { month: 'short' });
            return <option key={val} value={val}>{name}</option>;
          })}
        </select>
      </div>
    </div>
  );
}