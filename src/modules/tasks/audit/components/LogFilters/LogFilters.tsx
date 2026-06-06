"use client";

import React from 'react';
import { useTheme } from "@/theme/ThemeProvider";

interface LogFiltersProps {
  filterType: 'all' | 'month' | 'year' | 'custom';
  setFilterType: (val: 'all' | 'month' | 'year' | 'custom') => void;
  actionFilter: string;
  setActionFilter: (val: string) => void;
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
  selectedYear: string;
  setSelectedYear: (val: string) => void;
  fromDate: string;
  setFromDate: (val: string) => void;
  toDate: string;
  setToDate: (val: string) => void;
}

export default function LogFilters({
  filterType, 
  setFilterType, 
  actionFilter, 
  setActionFilter,
  selectedMonth, 
  setSelectedMonth, 
  selectedYear, 
  setSelectedYear,
  fromDate, 
  setFromDate, 
  toDate, 
  setToDate
}: LogFiltersProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      
      {/* Segmented Control */}
      <div 
        className={`flex items-center gap-1 overflow-x-auto p-1 rounded-xl border hide-scrollbar transition-all ${
          isDarkMode 
            ? "bg-black/[0.65] border-white/[0.04] backdrop-blur-[20px]" 
            : "bg-white/[0.75] border-black/[0.04] backdrop-blur-[20px]"
        }`}
      >
        {(["all", "month", "year", "custom"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`flex-1 md:flex-none whitespace-nowrap px-4 py-1.5 text-sm font-medium capitalize transition-all duration-200 ${
              filterType === type 
                ? "bg-orange-500 text-white shadow-[0_8px_24px_rgba(249,115,22,0.24)] rounded-[0.9rem]" 
                : (isDarkMode 
                    ? "text-white/52 hover:text-white hover:bg-white/[0.04] rounded-[0.9rem]" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-black/[0.03] rounded-[0.9rem]"
                  )
            }`}
          >
            {type === 'all' ? 'All Time' : type}
          </button>
        ))}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium outline-none transition-all ${
            isDarkMode
              ? "bg-white/[0.03] border-white/[0.04] text-white focus:bg-white/[0.05] focus:border-white/[0.1]"
              : "bg-white/[0.72] border-black/[0.05] text-slate-900 focus:bg-white focus:border-black/[0.1]"
          }`}
        >
          <option value="ALL">All Events</option>
          <option value="TOGGLE">Toggle</option>
          <option value="CREATE">Create</option>
          <option value="DELETE">Delete</option>
          <option value="LOCK">Lock</option>
          <option value="UPDATE">Update</option>
        </select>

        {filterType === "month" && (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium outline-none transition-all ${
              isDarkMode
                ? "bg-white/[0.03] border-white/[0.04] text-white focus:bg-white/[0.05] focus:border-white/[0.1]"
                : "bg-white/[0.72] border-black/[0.05] text-slate-900 focus:bg-white focus:border-black/[0.1]"
            }`}
          />
        )}

        {filterType === "year" && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className={`w-24 rounded-lg border px-3 py-1.5 text-sm font-medium outline-none transition-all ${
              isDarkMode
                ? "bg-white/[0.03] border-white/[0.04] text-white focus:bg-white/[0.05] focus:border-white/[0.1]"
                : "bg-white/[0.72] border-black/[0.05] text-slate-900 focus:bg-white focus:border-black/[0.1]"
            }`}
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = (new Date().getFullYear() - i).toString();
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        )}

        {filterType === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium outline-none transition-all ${
                isDarkMode
                  ? "bg-white/[0.03] border-white/[0.04] text-white focus:bg-white/[0.05] focus:border-white/[0.1]"
                  : "bg-white/[0.72] border-black/[0.05] text-slate-900 focus:bg-white focus:border-black/[0.1]"
              }`}
            />
            
            <span className={isDarkMode ? "text-white/55" : "text-slate-500"}>-</span>
            
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium outline-none transition-all ${
                isDarkMode
                  ? "bg-white/[0.03] border-white/[0.04] text-white focus:bg-white/[0.05] focus:border-white/[0.1]"
                  : "bg-white/[0.72] border-black/[0.05] text-slate-900 focus:bg-white focus:border-black/[0.1]"
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
}