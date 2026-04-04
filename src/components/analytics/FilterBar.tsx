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
      <div className="flex gap-2">
        {(['month', 'year', 'custom'] as FilterType[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${
              filterType === t ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {filterType === 'month' && <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm font-bold outline-none focus:border-orange-400 text-gray-700" />}
        {filterType === 'year' && <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm font-bold w-24 outline-none focus:border-orange-400 text-gray-700" />}
        {filterType === 'custom' && (
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-md border border-gray-200">
            <input type="date" value={customRange.start} onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} className="bg-transparent text-xs font-bold p-1 outline-none text-gray-700" />
            <span className="text-gray-300 font-bold">→</span>
            <input type="date" value={customRange.end} onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} className="bg-transparent text-xs font-bold p-1 outline-none text-gray-700" />
          </div>
        )}
      </div>
    </div>
  );
}