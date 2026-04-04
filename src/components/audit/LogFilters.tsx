import React from 'react';
import { Filter, XCircle } from 'lucide-react';

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
  filterType, setFilterType, actionFilter, setActionFilter,
  selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,
  fromDate, setFromDate, toDate, setToDate
}: LogFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 border border-gray-200 rounded-[16px] bg-white shadow-sm">
      <Filter size={16} className="text-gray-400" />
      
      <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg outline-none cursor-pointer focus:border-orange-400">
        <option value="all">Full Audit Stream</option>
        <option value="month">Monthly</option>
        <option value="year">Yearly</option>
        <option value="custom">Range</option>
      </select>

      <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg outline-none cursor-pointer focus:border-orange-400">
        <option value="ALL">All Events</option>
        <option value="TOGGLE">Toggle</option>
        <option value="CREATE">Create</option>
        <option value="DELETE">Delete</option>
        <option value="LOCK">Lock</option>
      </select>

      {filterType === 'month' && <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-gray-50 border border-gray-200 text-xs px-3 py-2 rounded-lg outline-none focus:border-orange-400" />}
      {filterType === 'year' && <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-gray-50 border border-gray-200 text-xs px-3 py-2 rounded-lg outline-none w-24 focus:border-orange-400" />}
      
      {filterType === 'custom' && (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-transparent text-xs px-2 py-1 outline-none text-gray-700" />
          <span className="text-gray-400 font-medium">→</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-transparent text-xs px-2 py-1 outline-none text-gray-700" />
        </div>
      )}
      
      {(filterType !== 'all' || actionFilter !== 'ALL') && (
        <button onClick={() => { setFilterType('all'); setActionFilter('ALL'); }} className="ml-auto text-gray-400 hover:text-red-500 transition-colors">
          <XCircle size={20} />
        </button>
      )}
    </div>
  );
}