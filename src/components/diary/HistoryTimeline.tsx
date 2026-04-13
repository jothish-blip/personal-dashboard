import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  History, 
  Search, 
  Filter,
  CalendarDays,
  XCircle
} from 'lucide-react';

export default function HistoryTimeline({ system }: any) {
  const { 
    weeklySummary, energyFilter, setEnergyFilter, 
    searchQuery, setSearchQuery, historyDates, filteredHistory, allEntries 
  } = system;

  // --- NEW: DATE FILTER STATES ---
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'tomorrow' | 'custom' | null>(null);
  const [customDate, setCustomDate] = useState('');

  // Behavior States
  const [executionFilter, setExecutionFilter] = useState<string | null>(null);
  const [momentumFilter, setMomentumFilter] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  // Use filteredHistory if available, otherwise fallback to historyDates
  const baseDisplayDates = filteredHistory || historyDates || [];

  // --- SMART SEARCH & ADVANCED FILTERING (Strict Priority Order) ---
  const displayDates = useMemo(() => {
    let processedDates = [...baseDisplayDates];

    // Priority 1: Date Filter
    if (dateFilter) {
      const today = new Date();
      
      // Secure IST Date String Formatter (YYYY-MM-DD)
      const getLocalDate = (d: Date) => {
        const parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric', month: '2-digit', day: '2-digit'
        }).formatToParts(d);
        const y = parts.find(p => p.type === 'year')?.value;
        const m = parts.find(p => p.type === 'month')?.value;
        const day = parts.find(p => p.type === 'day')?.value;
        return `${y}-${m}-${day}`;
      };

      const todayStr = getLocalDate(today);
      
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = getLocalDate(yesterday);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = getLocalDate(tomorrow);

      processedDates = processedDates.filter((dateItem: any) => {
        const key = Array.isArray(dateItem) ? dateItem[0] : dateItem;
        if (dateFilter === 'today') return key === todayStr;
        if (dateFilter === 'yesterday') return key === yesterdayStr;
        if (dateFilter === 'tomorrow') return key === tomorrowStr;
        if (dateFilter === 'custom' && customDate) return key === customDate;
        return true;
      });
    }

    // Priority 2: Search Query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      processedDates = processedDates.filter((dateItem: any) => {
        const dateKey = Array.isArray(dateItem) ? dateItem[0] : dateItem;
        const entry = Array.isArray(dateItem) ? dateItem[1] : allEntries[dateKey];
        if (!entry) return false;
        
        const textMatch = [entry.learning, entry.morning, entry.afternoon, entry.evening, entry.tomorrow].join(' ').toLowerCase().includes(lowerQuery);
        const tagMatch = entry.tags?.some((t: string) => t.toLowerCase().includes(lowerQuery));
        const frictionMatch = entry.frictions?.some((f: string) => f.toLowerCase().includes(lowerQuery));
        const propMatch = [entry.mood, entry.energy, entry.dayStructure, entry.executionQuality, entry.momentum].join(' ').toLowerCase().includes(lowerQuery);
        
        return textMatch || tagMatch || frictionMatch || propMatch;
      });
    }

    // Priority 3: Behavior Filters
    if (executionFilter) {
      processedDates = processedDates.filter((dateItem: any) => {
        const dateKey = Array.isArray(dateItem) ? dateItem[0] : dateItem;
        const entry = Array.isArray(dateItem) ? dateItem[1] : allEntries[dateKey];
        if (executionFilter === 'high') return entry?.goalAlignment >= 70;
        if (executionFilter === 'low') return entry?.goalAlignment < 40;
        return true;
      });
    }

    if (momentumFilter) {
      processedDates = processedDates.filter((dateItem: any) => {
        const dateKey = Array.isArray(dateItem) ? dateItem[0] : dateItem;
        const entry = Array.isArray(dateItem) ? dateItem[1] : allEntries[dateKey];
        return entry?.momentum?.toLowerCase() === momentumFilter.toLowerCase();
      });
    }
    
    if (energyFilter) {
      processedDates = processedDates.filter((dateItem: any) => {
        const dateKey = Array.isArray(dateItem) ? dateItem[0] : dateItem;
        const entry = Array.isArray(dateItem) ? dateItem[1] : allEntries[dateKey];
        return entry?.energy?.toLowerCase() === energyFilter.toLowerCase();
      });
    }

    return processedDates;
  }, [baseDisplayDates, allEntries, searchQuery, executionFilter, momentumFilter, energyFilter, dateFilter, customDate]);

  // UX Fix: Auto-scroll when a date filter is applied
  useEffect(() => {
    if (dateFilter && listRef.current) {
      listRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [dateFilter, customDate]);

  return (
    <div className="pb-24 pt-2">
      {/* 1️⃣ VAULT HEADER & FILTERING ENGINE */}
      <div className="flex flex-col gap-6 text-left">
        <div className="flex flex-col gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Timeline</h3>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {weeklySummary?.dominantMood || 'Neutral'} mood • {weeklySummary?.topTag || 'Logs'}
              </p>
            </div>
          </div>

          {/* --- NEW: PRIMARY DATE NAVIGATION --- */}
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => { setDateFilter(null); setCustomDate(''); }}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${
                  !dateFilter ? 'bg-gray-100 text-gray-900 border-gray-200' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
                }`}
              >
                All
              </button>
              
              <div className="h-4 w-[1px] bg-gray-200 mx-1 shrink-0" />

              <button
                onClick={() => setDateFilter('yesterday')}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${
                  dateFilter === 'yesterday' ? 'bg-gray-900 text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Yesterday
              </button>

              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${
                  dateFilter === 'today' ? 'bg-gray-900 text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Today
              </button>

              <button
                onClick={() => setDateFilter('tomorrow')}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${
                  dateFilter === 'tomorrow' ? 'bg-gray-900 text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Tomorrow
              </button>

              <button
                onClick={() => setDateFilter('custom')}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${
                  dateFilter === 'custom' ? 'bg-gray-900 text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Custom
              </button>

              {/* Clear active filters button */}
              {(dateFilter || searchQuery || executionFilter || momentumFilter || energyFilter) && (
                <button
                  onClick={() => {
                    setDateFilter(null);
                    setCustomDate('');
                    setSearchQuery('');
                    setExecutionFilter(null);
                    setMomentumFilter(null);
                    setEnergyFilter(null);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-500 bg-red-50 rounded-full border border-red-100 hover:bg-red-100 transition-colors ml-auto shrink-0"
                >
                  <XCircle size={12} /> Clear
                </button>
              )}
            </div>

            {/* Custom Date Picker */}
            {dateFilter === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-500/5 transition-all shadow-sm"
              />
            )}
          </div>

          {/* Search Bar */}
          <div className="relative w-full mt-2">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search text, tags, frictions, mood, energy..." 
              value={searchQuery || ''} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm font-medium outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/5 transition-all shadow-sm" 
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Horizontal Scroll Filters with Visual Priority */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex items-center gap-2 pr-4 border-r border-gray-100 shrink-0">
              <Filter size={12} className="text-gray-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase">Behaviors</span>
            </div>
            <button 
              onClick={() => setExecutionFilter(executionFilter === 'high' ? null : 'high')} 
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${
                executionFilter === 'high' ? 'bg-green-500 border-green-600 text-white scale-105 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              High Execution
            </button>
            <button 
              onClick={() => setExecutionFilter(executionFilter === 'low' ? null : 'low')} 
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${
                executionFilter === 'low' ? 'bg-red-500 border-red-600 text-white scale-105 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              Low Execution
            </button>
            <button 
              onClick={() => setEnergyFilter(energyFilter === 'low' ? null : 'low')} 
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${
                energyFilter === 'low' ? 'bg-orange-500 border-orange-600 text-white scale-105 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              Low Energy
            </button>
            <button 
              onClick={() => setMomentumFilter(momentumFilter === 'high' ? null : 'high')} 
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${
                momentumFilter === 'high' ? 'bg-purple-500 border-purple-600 text-white scale-105 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              High Momentum
            </button>
          </div>
        </div>

        {/* 2️⃣ TIMELINE CARDS LIST */}
        <div ref={listRef} className="flex flex-col gap-3 scroll-mt-6">
          {displayDates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <CalendarDays size={24} className="mx-auto text-gray-300 mb-2" />
              {/* Clear Empty State UX */}
              {dateFilter ? (
                <p className="text-sm font-bold text-gray-500">No entry logged for this date.</p>
              ) : (
                <p className="text-sm font-bold text-gray-400">No entries match your criteria.</p>
              )}
            </div>
          ) : (
            displayDates.map((dateItem: any) => {
              const dateKey = Array.isArray(dateItem) ? dateItem[0] : dateItem;
              const entryObj = Array.isArray(dateItem) ? dateItem[1] : allEntries[dateKey];
              return <HistoryCard key={dateKey} date={dateKey} entry={entryObj} system={system} />;
            })
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Clean, Expandable Card Component (Behavior Driven)
 */
function HistoryCard({ date, entry, system }: any) {
  const isSelected = system.selectedDate === date;
  const [expanded, setExpanded] = useState(false);
  
  // Enforce IST Display per user requirements
  const displayDate = new Date(date).toLocaleDateString('en-US', { 
    timeZone: 'Asia/Kolkata', 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  
  // Auto-expand during replay animation (if logic still exists elsewhere)
  useEffect(() => {
    if (system.isReplaying && isSelected) {
      setExpanded(true);
    } else if (system.isReplaying && !isSelected) {
      setExpanded(false);
    }
  }, [system.isReplaying, isSelected]);

  if (!entry || entry.isMissed) {
    return (
      <div className="flex flex-col gap-1 p-4 sm:p-5 bg-gray-50 border border-gray-200 rounded-2xl opacity-60 text-left">
        <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">{displayDate}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No entry logged</span>
      </div>
    );
  }

  // --- DAY TYPE CLASSIFICATION ---
  const dayType = entry.goalAlignment > 70 
    ? "High Execution" 
    : entry.goalAlignment < 40 
    ? "Low Execution" 
    : "Moderate";

  return (
    <div 
      onClick={() => setExpanded(!expanded)} 
      role="button"
      tabIndex={0}
      className={`flex flex-col gap-3 p-4 sm:p-5 border rounded-[22px] text-left transition-all cursor-pointer active:scale-[0.97] select-none ${
        isSelected 
          ? 'border-orange-500 bg-orange-50 shadow-md' 
          : 'bg-white border-gray-100 hover:border-orange-200 shadow-sm'
      }`}
    >
      {/* Card Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-0.5">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              system.setSelectedDate(date);
            }}
            className={`text-sm font-black text-left transition-colors hover:underline focus:outline-none focus:underline ${isSelected ? 'text-orange-700' : 'text-gray-900'}`}
          >
            {displayDate}
          </button>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            {dayType}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
           <span className="text-[9px] font-bold text-gray-400 uppercase bg-white px-2 py-0.5 rounded border border-gray-100 shadow-sm">
            {entry.mood || 'N/A'}
          </span>
          {entry.chapter && (
            <span className="text-[9px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 uppercase">
              {entry.chapter}
            </span>
          )}
          <span className="text-xs text-gray-400 font-bold ml-1">
            {expanded ? '−' : '+'}
          </span>
        </div>
      </div>

      {/* --- BEHAVIOR STRIP --- */}
      <div className="flex flex-wrap gap-2 mt-1">
        {entry.energy && (
          <span className="text-[10px] font-semibold px-2 py-1 rounded bg-yellow-50 text-yellow-600 uppercase tracking-wide">
            ⚡ {entry.energy}
          </span>
        )}
        {entry.sleep && (
          <span className="text-[10px] font-semibold px-2 py-1 rounded bg-blue-50 text-blue-600 uppercase tracking-wide">
            💤 {entry.sleep}
          </span>
        )}
        {entry.executionQuality && (
          <span className="text-[10px] font-semibold px-2 py-1 rounded bg-green-50 text-green-600 uppercase tracking-wide">
            🎯 {entry.executionQuality}
          </span>
        )}
        {entry.momentum && (
          <span className="text-[10px] font-semibold px-2 py-1 rounded bg-purple-50 text-purple-600 uppercase tracking-wide">
            🔄 {entry.momentum}
          </span>
        )}
        {entry.dayStructure && (
          <span className="text-[10px] font-semibold px-2 py-1 rounded bg-gray-100 text-gray-600 uppercase tracking-wide">
            📊 {entry.dayStructure}
          </span>
        )}
      </div>

      {/* Card Body - Content */}
      <div className="flex flex-col gap-1 mt-1">
        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
          Summary
        </p>
        <p className={`text-sm text-gray-800 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {entry.learning || entry.morning || "Entry contains no text analysis."}
        </p>

        {/* Highlight Main Issue (Friction) */}
        {!expanded && entry.frictions && entry.frictions.length > 0 && (
          <p className="text-[11px] text-red-500 font-medium mt-1">
            Issue: {entry.frictions[0]}
          </p>
        )}

        {/* Highlight Win */}
        {!expanded && entry.win && (
          <p className="text-[11px] text-green-600 font-medium">
            ✔ {entry.win}
          </p>
        )}
        
        {/* EXPANDED CONTENT (FULL DAY) */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-in fade-in duration-300">
            
            {/* Behavior Overview Grid */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">
                Behavior
              </p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-xs font-medium text-gray-700">
                <span className="flex gap-2"><span className="text-gray-400 w-14">Energy:</span> {entry.energy || '-'}</span>
                <span className="flex gap-2"><span className="text-gray-400 w-14">Sleep:</span> {entry.sleep || '-'}</span>
                <span className="flex gap-2"><span className="text-gray-400 w-14">Focus:</span> {entry.focusArea || '-'}</span>
                <span className="flex gap-2"><span className="text-gray-400 w-14">Execute:</span> {entry.executionQuality || '-'}</span>
                <span className="flex gap-2"><span className="text-gray-400 w-14">Momentum:</span> {entry.momentum || '-'}</span>
                <span className="flex gap-2"><span className="text-gray-400 w-14">Structure:</span> {entry.dayStructure || '-'}</span>
              </div>

              {/* Full Lists inside Behavior context */}
              {((entry.frictions && entry.frictions.length > 0) || entry.win) && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col gap-2">
                  {entry.frictions && entry.frictions.length > 0 && (
                    <div className="text-[11px]">
                      <span className="text-red-500 font-bold uppercase tracking-wider block mb-1">Issues Faced</span>
                      <ul className="list-disc pl-4 text-gray-600 space-y-0.5">
                        {entry.frictions.map((f: string, i: number) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}
                  {entry.win && (
                    <p className="text-[11px] text-green-600 font-bold mt-1">
                      <span className="uppercase tracking-wider block mb-0.5">Key Win</span>
                      ✔ {entry.win}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Structured Text Sections */}
            {entry.morning && (
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Planning</span>
                <p className="text-sm text-gray-800 leading-relaxed">{entry.morning}</p>
              </div>
            )}
            {entry.afternoon && (
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Execution</span>
                <p className="text-sm text-gray-800 leading-relaxed">{entry.afternoon}</p>
              </div>
            )}
            {entry.evening && (
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Reflection</span>
                <p className="text-sm text-gray-800 leading-relaxed">{entry.evening}</p>
              </div>
            )}
            {entry.tomorrow && (
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mt-2">
                <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-1">Next Focus</span>
                <p className="font-bold text-gray-900">{entry.tomorrow}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer - Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {entry.tags.slice(0, 1).map((t: string) => (
            <span key={t} className="text-[9px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md uppercase tracking-tight">
              #{t}
            </span>
          ))}
          {entry.tags.length > 1 && (
            <span className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
              +{entry.tags.length - 1} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}