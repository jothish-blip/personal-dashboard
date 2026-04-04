"use client";

import React, { useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Download, Upload, LayoutGrid, ListTodo, BookOpen, Wallet, CalendarDays } from "lucide-react";
import { Meta } from "../types";

interface NavbarProps {
  meta: Meta;
  setMonthYear: (val: string) => void;
  exportData: () => void;
  importData: (file: File) => void;
}

export default function Navbar({ 
  meta, 
  setMonthYear, 
  exportData, 
  importData 
}: NavbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname() || ""; // Safe fallback for SSR
  
  // --- STRICT PATHNAME ROUTING (Single Source of Truth) ---
  const isTasksActive = pathname === "/";
  const isMiniActive = pathname === "/mini-nisc";
  const isDiaryActive = pathname === "/diary";
  const isFinanceActive = pathname === "/finance";
  const isCalendarActive = pathname === "/calender-event";

  const [y, m] = meta.currentMonth.split('-');

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);
  }, []);

  return (
    <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all">
      
      {/* =========================================
          DESKTOP LAYOUT (Horizontal & Spacious)
          ========================================= */}
      <div className="hidden md:flex h-[64px] items-center px-6 max-w-[1500px] mx-auto justify-between">
        
        {/* LEFT: Brand & Switcher */}
        <div className="flex items-center gap-6">
          <div className="text-lg font-semibold text-gray-800 flex items-center gap-3">
            <div>NexTask <span className="text-orange-500 font-bold">v12</span></div>
            <div className="h-4 w-[1px] bg-gray-200" />
            <div className="text-[10px] px-2 py-1 rounded border border-gray-200 text-gray-500 bg-gray-50 uppercase tracking-wide font-medium">
              {isMiniActive ? 'Nisc' : 'Engine'}
            </div>
          </div>

          {/* ANIMATED SLIDING SWITCHER (DESKTOP) */}
          <div className="relative flex bg-gray-100 p-1 rounded-lg w-52">
            
            {/* The Sliding Pill */}
            <div 
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-md shadow-sm border border-gray-200/50 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-0"
              style={{ transform: isMiniActive ? 'translateX(100%)' : 'translateX(0)' }}
            />

            <button
              onClick={() => router.push('/')}
              className={`relative z-10 flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-colors duration-300 active:scale-95 ${
                isTasksActive ? 'text-orange-600' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <LayoutGrid size={14} /> Tasks
            </button>

            <button
              onClick={() => router.push('/mini-nisc')}
              className={`relative z-10 flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-colors duration-300 active:scale-95 ${
                isMiniActive ? 'text-orange-600' : 'text-gray-500 hover:text-gray-800'
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
              onClick={() => router.push('/diary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 active:scale-95 ${
                isDiaryActive
                  ? 'bg-white text-orange-600 border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                  : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <BookOpen size={14} />
              <span>Diary</span>
              <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${isDiaryActive ? 'bg-orange-500' : 'bg-transparent'}`} />
            </button>

            <button
              onClick={() => router.push('/finance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 active:scale-95 ${
                isFinanceActive
                  ? 'bg-white text-orange-600 border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                  : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <Wallet size={14} />
              <span>Finance</span>
              <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${isFinanceActive ? 'bg-orange-500' : 'bg-transparent'}`} />
            </button>

            <button
              onClick={() => router.push('/calender-event')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 active:scale-95 ${
                isCalendarActive
                  ? 'bg-white text-orange-600 border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                  : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <CalendarDays size={14} />
              <span>Planner</span>
              <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${isCalendarActive ? 'bg-orange-500' : 'bg-transparent'}`} />
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
              onClick={() => fileInputRef.current?.click()} 
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

      {/* =========================================
          MOBILE LAYOUT (Stacked & App-like)
          ========================================= */}
      <div className="md:hidden px-4 py-3 space-y-3">
        
        {/* ROW 1: Brand & Data Actions */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-800">
            NexTask <span className="text-orange-500 font-bold">v12</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
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

        {/* ROW 2: ANIMATED SLIDING SWITCHER (Core Modules) */}
        <div className="relative flex bg-gray-100 p-1 rounded-lg w-full">
          <div 
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-md shadow-sm border border-gray-200/50 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-0"
            style={{ transform: isMiniActive ? 'translateX(100%)' : 'translateX(0)' }}
          />

          <button
            onClick={() => router.push('/')}
            className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-colors duration-300 active:scale-95 ${
              isTasksActive ? 'text-orange-600' : 'text-gray-500'
            }`}
          >
            <LayoutGrid size={14} /> Tasks
          </button>

          <button
            onClick={() => router.push('/mini-nisc')}
            className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-colors duration-300 active:scale-95 ${
              isMiniActive ? 'text-orange-600' : 'text-gray-500'
            }`}
          >
            <ListTodo size={14} /> Mini
          </button>
        </div>

        {/* ROW 3: SECONDARY TOOLS GRID */}
        <div className="flex gap-2 w-full">
          <button 
            onClick={() => router.push('/diary')}
            className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-md border text-xs font-bold transition-all duration-300 active:scale-95 ${
              isDiaryActive ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 shadow-sm'
            }`}
          >
            <BookOpen size={14} /> Diary
          </button>
          
          <button 
            onClick={() => router.push('/finance')}
            className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-md border text-xs font-bold transition-all duration-300 active:scale-95 ${
              isFinanceActive ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 shadow-sm'
            }`}
          >
            <Wallet size={14} /> Finance
          </button>

          <button 
            onClick={() => router.push('/calender-event')}
            className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-md border text-xs font-bold transition-all duration-300 active:scale-95 ${
              isCalendarActive ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 shadow-sm'
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

      {/* Hidden File Input for Data Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".json"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            importData(e.target.files[0]);
            e.target.value = ""; 
          }
        }} 
      />

    </nav>
  );
}