"use client";

import React from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useTheme } from "@/theme/ThemeProvider";

export default function HeaderControls({ system }: any) {
  const { selectedDate, actualToday, setSelectedDate, changeDate } = system;
  const { isDarkMode } = useTheme();

  // --- Safe Local Date Parsing ---
  const [year, month, day] = (selectedDate || actualToday || '').split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  const formattedDate = dateObj.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const isToday = selectedDate === actualToday;

  // --- Styling ---
  const btnClass = `flex items-center justify-center p-2 border rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
    isDarkMode 
      ? "bg-[#111111] border-gray-800 text-gray-300 hover:bg-[#1a1a1a]" 
      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
  }`;

  return (
    <header className={`flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-6 border-b text-left ${
      isDarkMode ? "border-gray-800" : "border-gray-100"
    }`}>
      
      {/* --- LEFT: IDENTITY & CONTEXT --- */}
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl shadow-sm shrink-0 ${
          isDarkMode ? "bg-orange-950/30 text-orange-400" : "bg-orange-500/10 text-orange-600"
        }`}>
          <BookOpen size={22} />
        </div>
        <div>
          <h1 className={`text-xl font-bold tracking-tight ${
            isDarkMode ? "text-gray-100" : "text-gray-900"
          }`}>
            Diary
          </h1>
          <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <p className={`text-sm font-semibold ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}>
              {formattedDate}
            </p>
            <span className={`hidden sm:inline ${
              isDarkMode ? "text-gray-700" : "text-gray-300"
            }`}>
              •
            </span>
            <p className={`text-sm font-medium ${
              isDarkMode ? "text-gray-500" : "text-gray-500"
            }`}>
              Reflect on your day honestly.
            </p>
          </div>
        </div>
      </div>

      {/* --- RIGHT: DATE NAVIGATION --- */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => changeDate(-1)} 
          className={btnClass}
          title="Previous Day"
        >
          <ChevronLeft size={16} />
        </button>
        
        <button 
          onClick={() => setSelectedDate(actualToday)} 
          disabled={isToday}
          className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
            isToday 
              ? (isDarkMode ? "bg-orange-950/20 text-orange-500/50 border-orange-900/30" : "bg-orange-50 text-orange-400 border-orange-100") 
              : (isDarkMode ? "bg-[#111111] text-gray-300 border-gray-800 hover:text-orange-400" : "bg-white text-gray-700 border-gray-200 hover:text-orange-600")
          }`}
        >
          <Calendar size={14} />
          Today
        </button>
        
        <button 
          onClick={() => changeDate(1)} 
          disabled={isToday}
          className={btnClass}
          title="Next Day"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      
    </header>
  );
}