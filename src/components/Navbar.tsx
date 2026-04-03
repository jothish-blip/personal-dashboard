"use client";

import React, { useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Download, Upload, LayoutGrid, ListTodo, BookOpen } from "lucide-react";
import { Meta } from "../types";

interface NavbarProps {
  meta: Meta;
  setMonthYear: (val: string) => void;
  exportData: () => void;
  importData: (file: File) => void;
  mode?: "mini" | "matrix";
  setMode?: React.Dispatch<React.SetStateAction<"matrix" | "mini">>;
}

export default function Navbar({ 
  meta, 
  setMonthYear, 
  exportData, 
  importData, 
  mode: propMode,
  setMode 
}: NavbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  // --- DERIVE MODE FROM URL or fallback to caller-controlled mode ---
  const mode = propMode ?? (pathname === "/mini-nisc" ? "mini" : "matrix");

  const [y, m] = meta.currentMonth.split('-');

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);
  }, []);

  return (
    <nav className="h-[64px] flex items-center px-4 border-b border-gray-200 bg-white sticky top-0 z-[100] shadow-sm">
      <div className="w-full max-w-[1500px] mx-auto flex items-center justify-between gap-4">
        
        {/* 1. BRAND */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-lg font-semibold text-gray-800">
            NexTask <span className="text-orange-500 font-bold">v12</span>
          </div>
          <div className="hidden md:block h-4 w-[1px] bg-gray-200" />
          <div className="text-[10px] px-2 py-1 rounded border border-gray-200 text-gray-500 bg-gray-50 uppercase tracking-wide font-medium hidden sm:block">
            {mode === 'matrix' ? 'Engine' : 'Nisc'}
          </div>
        </div>

        {/* 2. WORKSPACE SWITCHER */}
        <div className="flex bg-gray-100 p-1 rounded-lg gap-1 w-full md:w-auto overflow-x-auto custom-scrollbar">
          <button
            onClick={() => router.push('/')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap flex-1 md:flex-none ${
              mode === 'matrix' && pathname !== '/diary'
                ? 'bg-white text-orange-600 border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid size={14} /> Tasks
          </button>

          <button
            onClick={() => router.push('/mini-nisc')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap flex-1 md:flex-none ${
              mode === 'mini' && pathname !== '/diary'
                ? 'bg-white text-orange-600 border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ListTodo size={14} /> Mini
          </button>
        </div>

        {/* 3. DATE, DIARY & DATA TOOLS */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
          
          {/* DIARY BUTTON (Personal Layer) */}
          <button
            onClick={() => router.push('/diary')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              pathname === '/diary'
                ? 'bg-white text-orange-600 border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'
            }`}
            title="Daily Reflection"
          >
            <BookOpen size={14} />
            <span className="hidden sm:inline">Diary</span>
            {/* Subtle indicator for active entry (can be driven by props later) */}
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
          </button>

          <div className="hidden sm:flex gap-1 sm:border-l sm:border-gray-200 sm:pl-3">
            <select 
              value={y} 
              onChange={(e) => setMonthYear(`${e.target.value}-${m}`)} 
              className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-700 outline-none hover:border-gray-300 transition-colors cursor-pointer"
            >
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>

            <select 
              value={m} 
              onChange={(e) => setMonthYear(`${y}-${e.target.value}`)} 
              className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-700 outline-none hover:border-gray-300 transition-colors cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const val = String(i + 1).padStart(2, '0');
                const name = new Date(2024, i).toLocaleString('default', { month: 'short' });
                return <option key={val} value={val}>{name}</option>;
              })}
            </select>
          </div>
          
          <div className="flex gap-1 border-l border-gray-200 pl-2 sm:pl-3">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              title="Import Data"
            >
              <Download size={14} className="text-orange-500" />
            </button>
            <button 
              onClick={exportData} 
              className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              title="Export Data"
            >
              <Upload size={14} className="text-green-600" />
            </button>
          </div>

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
        </div>

      </div>

      {/* Hide scrollbar for the tiny switcher overflow on extreme mobile */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </nav>
  );
}