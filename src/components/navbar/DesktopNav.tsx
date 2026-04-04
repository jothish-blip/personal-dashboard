import React from 'react';
import { LayoutGrid, ListTodo, BookOpen, Wallet, CalendarDays, Download, Upload } from "lucide-react";

interface DesktopNavProps {
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

export default function DesktopNav({
  activePaths, handleNav, y, m, years, setMonthYear, handleImportClick, exportData
}: DesktopNavProps) {
  return (
    <div className="hidden md:flex h-[64px] items-center px-6 max-w-[1500px] mx-auto justify-between">
      
      {/* LEFT: Brand & Switcher */}
      <div className="flex items-center gap-6">
        <div className="text-lg font-semibold text-gray-800 flex items-center gap-3">
          <div>NexTask <span className="text-orange-500 font-bold">v1.2</span></div>
          <div className="h-4 w-[1px] bg-gray-200" />
          <div className="text-[10px] px-2 py-1 rounded border border-gray-200 text-gray-500 bg-gray-50 uppercase tracking-wide font-medium">
            {activePaths.isMini ? 'Nisc' : 'Engine'}
          </div>
        </div>

        {/* ANIMATED SLIDING SWITCHER */}
        <div className="relative flex bg-gray-100 p-1 rounded-lg w-52">
          <div 
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-md shadow-sm border border-gray-200/50 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-0"
            style={{ transform: activePaths.isMini ? 'translateX(100%)' : 'translateX(0)' }}
          />
          <button
            onClick={() => handleNav('/')}
            className={`relative z-10 flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-colors duration-300 active:scale-95 ${
              activePaths.isTasks ? 'text-orange-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <LayoutGrid size={14} /> Tasks
          </button>
          <button
            onClick={() => handleNav('/mini-nisc')}
            className={`relative z-10 flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-colors duration-300 active:scale-95 ${
              activePaths.isMini ? 'text-orange-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <ListTodo size={14} /> Mini
          </button>
        </div>
      </div>

      {/* RIGHT: Tools & Controls */}
      <div className="flex items-center gap-3">
        
        {/* SECONDARY NAVIGATION TABS */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleNav('/diary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 active:scale-95 ${
              activePaths.isDiary ? 'bg-white text-orange-600 border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50 border border-transparent'
            }`}
          >
            <BookOpen size={14} /> <span>Diary</span>
            <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${activePaths.isDiary ? 'bg-orange-500' : 'bg-transparent'}`} />
          </button>

          <button
            onClick={() => handleNav('/finance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 active:scale-95 ${
              activePaths.isFinance ? 'bg-white text-orange-600 border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50 border border-transparent'
            }`}
          >
            <Wallet size={14} /> <span>Finance</span>
            <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${activePaths.isFinance ? 'bg-orange-500' : 'bg-transparent'}`} />
          </button>

          <button
            onClick={() => handleNav('/calender-event')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 active:scale-95 ${
              activePaths.isCalendar ? 'bg-white text-orange-600 border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50 border border-transparent'
            }`}
          >
            <CalendarDays size={14} /> <span>Planner</span>
            <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${activePaths.isCalendar ? 'bg-orange-500' : 'bg-transparent'}`} />
          </button>
        </div>

        <div className="h-5 w-[1px] bg-gray-200 mx-1" />

        {/* DATE SELECTORS */}
        <select 
          value={y} 
          onChange={(e) => setMonthYear(`${e.target.value}-${m}`)} 
          className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-xs font-medium text-gray-700 outline-none hover:border-gray-300 transition-colors cursor-pointer"
        >
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>

        <select 
          value={m} 
          onChange={(e) => setMonthYear(`${y}-${e.target.value}`)} 
          className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-xs font-medium text-gray-700 outline-none hover:border-gray-300 transition-colors cursor-pointer"
        >
          {Array.from({ length: 12 }, (_, i) => {
            const val = String(i + 1).padStart(2, '0');
            const name = new Date(2024, i).toLocaleString('default', { month: 'short' });
            return <option key={val} value={val}>{name}</option>;
          })}
        </select>

        <div className="h-5 w-[1px] bg-gray-200 mx-1" />

        {/* DATA ACTIONS */}
        <div className="flex gap-1">
          <button 
            onClick={handleImportClick} 
            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50 active:scale-90 transition-all"
            title="Import Data"
          >
            <Download size={14} className="text-orange-500" />
          </button>
          <button 
            onClick={exportData} 
            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50 active:scale-90 transition-all"
            title="Export Data"
          >
            <Upload size={14} className="text-green-600" />
          </button>
        </div>
      </div>
    </div>
  );
}