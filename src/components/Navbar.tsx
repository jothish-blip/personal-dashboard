"use client";

import React, { useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Download, Upload, LayoutGrid, ListTodo } from "lucide-react";
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
    <nav className="flex flex-col gap-4 p-4 border-b border-gray-200 bg-white sticky top-0 z-[100] md:flex-row md:items-center md:justify-between shadow-sm">
      
      {/* 1. BRAND */}
      <div className="flex items-center gap-3">
        <div className="font-black text-xl tracking-tighter text-slate-900">
          NexTask <span className="text-blue-600">v12</span>
        </div>
        <div className="hidden md:block h-4 w-[1px] bg-gray-200" />
        <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${
          mode === 'matrix' ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-purple-600 bg-purple-50 border-purple-100'
        }`}>
          {mode === 'matrix' ? 'Engine' : 'Nisc'}
        </div>
      </div>

      {/* 2. WORKSPACE SWITCHER (Next.js SPA Navigation) */}
      <div className="flex bg-gray-100 p-1 rounded-xl gap-1 border border-gray-200/50 w-full md:w-auto">
        <button
          onClick={() => router.push('/')}
          className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
            mode === 'matrix'
              ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutGrid size={14} /> TASKS
        </button>

        <button
          onClick={() => router.push('/mini-nisc')}
          className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
            mode === 'mini'
              ? 'bg-white text-purple-600 shadow-sm border border-gray-100'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListTodo size={14} /> MINI NISC
        </button>
      </div>

      {/* 3. DATE & DATA TOOLS */}
      <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
        <div className="flex gap-1">
          <select 
            value={y} 
            onChange={(e) => setMonthYear(`${e.target.value}-${m}`)} 
            className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold outline-none"
          >
            {years.map(year => <option key={year} value={year}>{year}</option>)}
          </select>

          <select 
            value={m} 
            onChange={(e) => setMonthYear(`${y}-${e.target.value}`)} 
            className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const val = String(i + 1).padStart(2, '0');
              const name = new Date(2024, i).toLocaleString('default', { month: 'short' }).toUpperCase();
              return <option key={val} value={val}>{name}</option>;
            })}
          </select>
        </div>
        
        <div className="flex gap-1 border-l border-gray-100 pl-3">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="bg-white border border-gray-200 w-9 h-9 flex items-center justify-center rounded-lg shadow-sm hover:bg-gray-50 active:scale-90 transition-all"
          >
            <Download size={16} className="text-gray-600" />
          </button>
          <button 
            onClick={exportData} 
            className="bg-white border border-gray-200 w-9 h-9 flex items-center justify-center rounded-lg shadow-sm hover:bg-gray-50 active:scale-90 transition-all"
          >
            <Upload size={16} className="text-gray-600" />
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
    </nav>
  );
}