import React from 'react';
import { FilterType } from './utils';

interface FilterBarProps {
  filterType: FilterType;
  setFilterType: (val: FilterType) => void;
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
  selectedYear: string;
  setSelectedYear: (val: string) => void;
  customRange: { start: string; end: string };
  setCustomRange: (val: { start: string; end: string }) => void;
}

export default function FilterBar({
  filterType, setFilterType, selectedMonth, setSelectedMonth,
  selectedYear, setSelectedYear, customRange, setCustomRange
}: FilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-white border border-gray-200 rounded-[20px] shadow-sm">
      
      {/* 🔥 STEP 1 & 3: QUICK LABEL & HELP */}
      <div className="flex flex-col gap-1 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Filter
          </span>
          <span className="text-[10px] text-gray-400">
            Select time range
          </span>
        </div>

        <div className="flex gap-2">
          {(['month', 'year', 'custom'] as FilterType[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                // 🔥 STEP 6: AUTO RESET WHEN FILTER CHANGES
                setFilterType(t);
                if (t === "month") setSelectedMonth("");
                if (t === "year") setSelectedYear("");
                if (t === "custom") setCustomRange({ start: "", end: "" });
              }}
              // 🔥 STEP 2 & 8: STRONG ACTIVE STATE & HOVER POLISH
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${
                filterType === t 
                  ? 'bg-orange-500 text-white shadow-md scale-[1.02]' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 🔥 STEP 4: MOBILE FIX (flex-wrap and width adjustments) */}
      <div className="flex flex-col items-end w-full md:w-auto">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {filterType === 'month' && (
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
              className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm font-bold outline-none focus:border-orange-400 text-gray-700 w-full md:w-auto" 
            />
          )}
          
          {filterType === 'year' && (
            <input 
              type="number" 
              placeholder="YYYY" // 🔥 STEP 5: PLACEHOLDER
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)} 
              className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm font-bold w-full md:w-24 outline-none focus:border-orange-400 text-gray-700" 
            />
          )}
          
          {filterType === 'custom' && (
            <div className="flex items-center justify-between gap-2 bg-gray-50 p-1 rounded-md border border-gray-200 w-full md:w-auto">
              <input 
                type="date" 
                title="Start date" // 🔥 STEP 5: HINTS
                value={customRange.start} 
                onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} 
                className="bg-transparent text-xs font-bold p-1 outline-none text-gray-700 w-full" 
              />
              <span className="text-gray-300 font-bold">→</span>
              <input 
                type="date" 
                title="End date" // 🔥 STEP 5: HINTS
                value={customRange.end} 
                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} 
                className="bg-transparent text-xs font-bold p-1 outline-none text-gray-700 w-full" 
              />
            </div>
          )}
        </div>

        {/* 🔥 STEP 7: CURRENT SELECTION PREVIEW */}
        <div className="text-[10px] text-gray-400 font-bold mt-2 h-4 w-full text-right">
          {filterType === "month" && selectedMonth && `Active: ${selectedMonth}`}
          {filterType === "year" && selectedYear && `Active: ${selectedYear}`}
          {filterType === "custom" && customRange.start && customRange.end && `Active: ${customRange.start} → ${customRange.end}`}
        </div>
      </div>

    </div>
  );
}