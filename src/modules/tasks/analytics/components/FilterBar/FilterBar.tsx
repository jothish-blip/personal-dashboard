import React, { useMemo } from 'react';

// Expand your FilterType in utils.ts to include these, or use this extended type
export type ExtendedFilterType = '7D' | '30D' | '90D' | 'YTD' | 'month' | 'year' | 'custom';

interface FilterBarProps {
  filterType: ExtendedFilterType;
  setFilterType: (val: ExtendedFilterType) => void;
  selectedMonth: string; // Format: "YYYY-MM"
  setSelectedMonth: (val: string) => void;
  selectedYear: string;  // Format: "YYYY"
  setSelectedYear: (val: string) => void;
  customRange: { start: string; end: string };
  setCustomRange: (val: { start: string; end: string }) => void;
  compareMode: boolean;
  setCompareMode: (val: boolean) => void;
}

export default function FilterBar({
  filterType,
  setFilterType,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  customRange,
  setCustomRange,
  compareMode,
  setCompareMode
}: FilterBarProps) {
  
  // --- HELPERS: Quick Navigation Steppers ---
  const handleMonthStep = (direction: -1 | 1) => {
    if (!selectedMonth) return;
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + direction, 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  const handleYearStep = (direction: -1 | 1) => {
    if (!selectedYear) return;
    setSelectedYear(String(parseInt(selectedYear) + direction));
  };

  // --- FORMATTERS & CONTEXT ---
  const formattedMonth = useMemo(() => {
    if (!selectedMonth) return "";
    const [y, m] = selectedMonth.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const trackingContext = useMemo(() => {
    if (filterType === '7D') return "Tracking last 7 days of activity";
    if (filterType === '30D') return "Tracking last 30 days of activity";
    if (filterType === '90D') return "Tracking last 90 days of activity";
    if (filterType === 'YTD') {
      const start = new Date(new Date().getFullYear(), 0, 1);
      const days = Math.ceil((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return `Tracking ${days} days of activity`;
    }
    if (filterType === 'month' && selectedMonth) {
      const [y, m] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      return `Tracking ${daysInMonth} days of activity`;
    }
    if (filterType === 'year' && selectedYear) {
      const y = parseInt(selectedYear);
      const isLeap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
      return `Tracking ${isLeap ? 366 : 365} days of activity`;
    }
    if (filterType === 'custom' && customRange.start && customRange.end) {
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      return `Tracking ${days} days of activity`;
    }
    return "Select a range to view activity";
  }, [filterType, selectedMonth, selectedYear, customRange]);

  const filterOptions: ExtendedFilterType[] = ['7D', '30D', '90D', 'YTD', 'month', 'year', 'custom'];

  return (
    <div className="flex flex-col gap-4 p-5 md:p-6 bg-white border border-gray-200 rounded-[24px] shadow-sm font-sans transition-all">
      
      {/* --- TOP ROW: Label & Active Badge --- */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Analytics Range
        </span>
        
        {/* Dynamic Premium Pill Badge */}
        <div className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
          {filterType === '7D' && 'Last 7 Days'}
          {filterType === '30D' && 'Last 30 Days'}
          {filterType === '90D' && 'Last 90 Days'}
          {filterType === 'YTD' && `Year to Date (${new Date().getFullYear()})`}
          {filterType === 'month' && formattedMonth}
          {filterType === 'year' && selectedYear}
          {filterType === 'custom' && (customRange.start ? `${customRange.start} → ${customRange.end}` : 'Custom Range')}
        </div>
      </div>

      {/* --- MIDDLE ROW: Scrollable Presets --- */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full pb-1">
        {filterOptions.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            // State is intentionally preserved! No resets here.
            className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-[10px] transition-all duration-200 flex-shrink-0 ${
              filterType === t 
                ? 'bg-orange-500 text-white shadow-md ring-4 ring-orange-500/15 scale-[1.02]' 
                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* --- BOTTOM ROW: Steppers, Context, & Compare Toggle --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
        
        {/* Dynamic Controls based on selection */}
        <div className="flex items-center gap-3">
          {filterType === 'month' && (
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-[12px] p-1 shadow-sm">
              <button onClick={() => handleMonthStep(-1)} className="px-3 py-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">◀</button>
              <span className="text-sm font-bold text-gray-800 min-w-[120px] text-center">{formattedMonth}</span>
              <button onClick={() => handleMonthStep(1)} className="px-3 py-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">▶</button>
            </div>
          )}

          {filterType === 'year' && (
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-[12px] p-1 shadow-sm">
              <button onClick={() => handleYearStep(-1)} className="px-3 py-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">◀</button>
              <span className="text-sm font-bold text-gray-800 min-w-[80px] text-center">{selectedYear}</span>
              <button onClick={() => handleYearStep(1)} className="px-3 py-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">▶</button>
            </div>
          )}

          {filterType === 'custom' && (
            <div className="flex items-center justify-between gap-2 bg-gray-50 p-1.5 rounded-[12px] border border-gray-200 shadow-sm w-full md:w-auto">
              <input 
                type="date" 
                value={customRange.start} 
                onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} 
                className="bg-transparent text-xs font-bold px-2 outline-none text-gray-700 w-full" 
              />
              <span className="text-gray-300 font-bold">→</span>
              <input 
                type="date" 
                value={customRange.end} 
                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} 
                className="bg-transparent text-xs font-bold px-2 outline-none text-gray-700 w-full" 
              />
            </div>
          )}
        </div>

        {/* Context & Compare Features */}
        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-none border-gray-100 pt-3 md:pt-0">
          <span className="text-xs font-medium text-gray-400 italic">
            {trackingContext}
          </span>

          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="peer sr-only" 
              />
              <div className="w-8 h-4.5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-orange-500"></div>
            </div>
            <span className="text-xs font-bold text-gray-500 group-hover:text-gray-800 transition-colors">
              Compare prior period
            </span>
          </label>
        </div>

      </div>
    </div>
  );
}