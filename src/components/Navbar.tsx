"use client";

import { Meta } from "../types";
import { useRef } from "react";

interface NavbarProps {
  meta: Meta;
  setFocus: (val: boolean) => void;
  setMonthYear: (val: string) => void;
  exportData: () => void;
  importData: (file: File) => void;
}

export default function Navbar({ meta, setFocus, setMonthYear, exportData, importData }: NavbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [y, m] = meta.currentMonth.split('-');

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonthYear(`${y}-${e.target.value}`);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonthYear(`${e.target.value}-${m}`);
  };

  return (
    <nav className="flex flex-col gap-4 p-4 border-b border-gray-200 bg-white transition-colors md:flex-row md:items-center md:justify-between">
      <div className="font-black text-xl tracking-tight text-gray-900">
        NexTask <span className="text-blue-500">v12</span>
      </div>

      <div className="flex flex-wrap bg-gray-100 p-1 rounded-lg gap-1 transition-colors">
        <button
          onClick={() => setFocus(false)}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-colors ${!meta.isFocus ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500'}`}
        >
          ALL DAYS
        </button>
        <button
          onClick={() => setFocus(true)}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-colors ${meta.isFocus ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500'}`}
        >
          FOCUS 🔥
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <select value={y} onChange={handleYearChange} className="bg-white text-gray-900 border border-gray-200 rounded-md p-2 font-bold outline-none transition-colors">
          {[2026, 2027, 2028, 2029, 2030].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <select value={m} onChange={handleMonthChange} className="bg-white text-gray-900 border border-gray-200 rounded-md p-2 font-bold outline-none transition-colors">
          {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((month, i) => {
            const date = new Date();
            date.setMonth(i);
            return <option key={month} value={month}>{date.toLocaleString('default', { month: 'long' })}</option>;
          })}
        </select>
        
        <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-gray-200 p-2 rounded-md text-gray-600 hover:bg-gray-50 transition-colors" title="Import">📥</button>
        <button onClick={exportData} className="bg-white border border-gray-200 p-2 rounded-md text-gray-600 hover:bg-gray-50 transition-colors" title="Export">📤</button>
        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && importData(e.target.files[0])} />
      </div>
    </nav>
  );
}