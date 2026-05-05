"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  History, 
  Search, 
  Filter,
  CalendarDays,
  XCircle
} from 'lucide-react';
import { useTheme } from "@/components/ThemeProvider"; // 🔥 Added Theme Provider

export default function HistoryTimeline({ system }: any) {
  const { 
    weeklySummary, energyFilter, setEnergyFilter, 
    searchQuery, setSearchQuery, historyDates, filteredHistory, allEntries 
  } = system;

  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state

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
            <div className={`p-2 rounded-lg ${isDarkMode ? "bg-[#111111] text-gray-400 border border-gray-800" : "bg-gray-100 text-gray-500 border border-transparent"}`}>
              <History size={20} />
            </div>
            <div>
              <h3 className={`text-lg font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>Timeline</h3>
              <p className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {weeklySummary?.dominantMood || 'Neutral'} mood • {weeklySummary?.topTag || 'Logs'}
              </p>
            </div>
          </div>

          {/* --- NEW: PRIMARY DATE NAVIGATION --- */}
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => { setDateFilter(null); setCustomDate(''); }}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full border transition-colors shrink-0 ${
                  !dateFilter 
                    ? (isDarkMode ? 'bg-gray-200 text-gray-900 border-gray-200' : 'bg-gray-100 text-gray-900 border-gray-200') 
                    : (isDarkMode ? 'bg-[#111111] border-gray-800 text-gray-400 hover:bg-[#1a1a1a]' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600')
                }`}
              >
                All
              </button>
              
              <div className={`h-4 w-[1px] mx-1 shrink-0 ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`} />

              <button
                onClick={() => setDateFilter('yesterday')}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors shrink-0 ${
                  dateFilter === 'yesterday' 
                    ? (isDarkMode ? 'bg-gray-200 text-gray-900 border-gray-200' : 'bg-gray-900 text-white border-gray-900') 
                    : (isDarkMode ? 'bg-[#111111] border-gray-800 text-gray-400 hover:bg-[#1a1a1a]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50')
                }`}
              >
                Yesterday
              </button>

              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors shrink-0 ${
                  dateFilter === 'today' 
                    ? (isDarkMode ? 'bg-gray-200 text-gray-900 border-gray-200' : 'bg-gray-900 text-white border-gray-900') 
                    : (isDarkMode ? 'bg-[#111111] border-gray-800 text-gray-400 hover:bg-[#1a1a1a]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50')
                }`}
              >
                Today
              </button>

              <button
                onClick={() => setDateFilter('tomorrow')}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors shrink-0 ${
                  dateFilter === 'tomorrow' 
                    ? (isDarkMode ? 'bg-gray-200 text-gray-900 border-gray-200' : 'bg-gray-900 text-white border-gray-900') 
                    : (isDarkMode ? 'bg-[#111111] border-gray-800 text-gray-400 hover:bg-[#1a1a1a]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50')
                }`}
              >
                Tomorrow
              </button>

              <button
                onClick={() => setDateFilter('custom')}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors shrink-0 ${
                  dateFilter === 'custom' 
                    ? (isDarkMode ? 'bg-gray-200 text-gray-900 border-gray-200' : 'bg-gray-900 text-white border-gray-900') 
                    : (isDarkMode ? 'bg-[#111111] border-gray-800 text-gray-400 hover:bg-[#1a1a1a]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50')
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
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ml-auto shrink-0 ${
                    isDarkMode ? "text-red-400 bg-red-950/30 border-red-900/50 hover:bg-red-900/50" : "text-red-500 bg-red-50 border-red-100 hover:bg-red-100"
                  }`}
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
                className={`w-full mt-1 border rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all shadow-sm ${
                  isDarkMode ? "bg-[#111111] border-gray-800 text-white color-scheme-dark focus:border-gray-600 focus:ring-4 focus:ring-white/5" : "bg-white border-gray-200 text-gray-900 focus:border-gray-400 focus:ring-4 focus:ring-gray-500/5"
                }`}
              />
            )}
          </div>

          {/* Search Bar */}
          <div className="relative w-full mt-2">
            <Search size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
            <input 
              type="text" 
              placeholder="Search text, tags, frictions, mood, energy..." 
              value={searchQuery || ''} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className={`w-full border rounded-xl pl-10 pr-10 py-3 text-sm font-medium outline-none transition-all shadow-sm ${
                isDarkMode 
                  ? "bg-[#111111] border-gray-800 text-white placeholder-gray-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-900/20" 
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/5"
              }`} 
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Horizontal Scroll Filters with Visual Priority */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <div className={`flex items-center gap-2 pr-4 border-r shrink-0 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
              <Filter size={12} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
              <span className={`text-[10px] font-bold uppercase ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Behaviors</span>
            </div>
            <button 
              onClick={() => setExecutionFilter(executionFilter === 'high' ? null : 'high')} 
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${
                executionFilter === 'high' 
                  ? (isDarkMode ? 'bg-green-900/50 border-green-800 text-green-400 scale-105 shadow-sm' : 'bg-green-500 border-green-600 text-white scale-105 shadow-sm') 
                  : (isDarkMode ? 'bg-[#111111] border-gray-800 text-gray-400 hover:bg-[#1a1a1a]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50')
              }`}
            >
              High Execution
            </button>
            <button 
              onClick={() => setExecutionFilter(executionFilter === 'low' ? null : 'low')} 
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${
                executionFilter === 'low' 
                  ? (isDarkMode ? 'bg-red-900/50 border-red-800 text-red-400 scale-105 shadow-sm' : 'bg-red-500 border-red-600 text-white scale-105 shadow-sm') 
                  : (isDarkMode ? 'bg-[#111111] border-gray-800 text-gray-400 hover:bg-[#1a1a1a]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50')
              }`}
            >
              Low Execution
            </button>
            <button 
              onClick={() => setEnergyFilter(energyFilter === 'low' ? null : 'low')} 
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${
                energyFilter === 'low' 
                  ? (isDarkMode ? 'bg-orange-900/50 border-orange-800 text-orange-400 scale-105 shadow-sm' : 'bg-orange-500 border-orange-600 text-white scale-105 shadow-sm') 
                  : (isDarkMode ? 'bg-[#111111] border-gray-800 text-gray-400 hover:bg-[#1a1a1a]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50')
              }`}
            >
              Low Energy
            </button>
            <button 
              onClick={() => setMomentumFilter(momentumFilter === 'high' ? null : 'high')} 
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${
                momentumFilter === 'high' 
                  ? (isDarkMode ? 'bg-purple-900/50 border-purple-800 text-purple-400 scale-105 shadow-sm' : 'bg-purple-500 border-purple-600 text-white scale-105 shadow-sm') 
                  : (isDarkMode ? 'bg-[#111111] border-gray-800 text-gray-400 hover:bg-[#1a1a1a]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50')
              }`}
            >
              High Momentum
            </button>
          </div>
        </div>

        {/* 2️⃣ TIMELINE CARDS LIST */}
        <div ref={listRef} className="flex flex-col gap-3 scroll-mt-6">
          {displayDates.length === 0 ? (
            <div className={`text-center py-12 rounded-2xl border border-dashed ${
              isDarkMode ? "bg-[#111111] border-gray-800" : "bg-gray-50 border-gray-200"
            }`}>
              <CalendarDays size={24} className={`mx-auto mb-2 ${isDarkMode ? "text-gray-700" : "text-gray-300"}`} />
              {/* Clear Empty State UX */}
              {dateFilter ? (
                <p className={`text-sm font-bold ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>No entry logged for this date.</p>
              ) : (
                <p className={`text-sm font-bold ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>No entries match your criteria.</p>
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
  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state
  const isSelected = system.selectedDate === date;
  const [expanded, setExpanded] = useState(false);
  
  // Enforce IST Display per user requirements
  const displayDate = new Date(date).toLocaleDateString('en-US', { 
    timeZone: 'Asia/Kolkata', 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  
  // Auto-expand during replay animation
  useEffect(() => {
    if (system.isReplaying && isSelected) {
      setExpanded(true);
    } else if (system.isReplaying && !isSelected) {
      setExpanded(false);
    }
  }, [system.isReplaying, isSelected]);

  if (!entry || entry.isMissed) {
    return (
      <div className={`flex flex-col gap-1 p-4 sm:p-5 border rounded-2xl opacity-60 text-left ${
        isDarkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-gray-50 border-gray-200"
      }`}>
        <span className={`text-xs font-black uppercase tracking-tighter ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{displayDate}</span>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>No entry logged</span>
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
          ? (isDarkMode ? 'border-orange-500 bg-orange-950/20' : 'border-orange-500 bg-orange-50 shadow-md') 
          : (isDarkMode ? 'bg-[#111111] border-gray-800 hover:border-gray-600' : 'bg-white border-gray-100 hover:border-orange-200 shadow-sm')
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
            className={`text-sm font-black text-left transition-colors hover:underline focus:outline-none focus:underline ${
              isSelected 
                ? (isDarkMode ? 'text-orange-400' : 'text-orange-700') 
                : (isDarkMode ? 'text-white' : 'text-gray-900')
            }`}
          >
            {displayDate}
          </button>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
            {dayType}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
           <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border shadow-sm ${
             isDarkMode ? "bg-gray-800 text-gray-300 border-gray-700" : "bg-white text-gray-400 border-gray-100"
           }`}>
            {entry.mood || 'N/A'}
          </span>
          {entry.chapter && (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
              isDarkMode ? "bg-purple-950/30 text-purple-400 border-purple-900/50" : "bg-purple-50 text-purple-600 border-purple-100"
            }`}>
              {entry.chapter}
            </span>
          )}
          <span className={`text-xs font-bold ml-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            {expanded ? '−' : '+'}
          </span>
        </div>
      </div>

      {/* --- BEHAVIOR STRIP --- */}
      <div className="flex flex-wrap gap-2 mt-1">
        {entry.energy && (
          <span className={`text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wide ${
            isDarkMode ? "bg-yellow-950/30 text-yellow-500" : "bg-yellow-50 text-yellow-600"
          }`}>
            ⚡ {entry.energy}
          </span>
        )}
        {entry.sleep && (
          <span className={`text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wide ${
            isDarkMode ? "bg-blue-950/30 text-blue-400" : "bg-blue-50 text-blue-600"
          }`}>
            💤 {entry.sleep}
          </span>
        )}
        {entry.executionQuality && (
          <span className={`text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wide ${
            isDarkMode ? "bg-emerald-950/30 text-emerald-400" : "bg-green-50 text-green-600"
          }`}>
            🎯 {entry.executionQuality}
          </span>
        )}
        {entry.momentum && (
          <span className={`text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wide ${
            isDarkMode ? "bg-purple-950/30 text-purple-400" : "bg-purple-50 text-purple-600"
          }`}>
            🔄 {entry.momentum}
          </span>
        )}
        {entry.dayStructure && (
          <span className={`text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wide ${
            isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"
          }`}>
            📊 {entry.dayStructure}
          </span>
        )}
      </div>

      {/* Card Body - Content */}
      <div className="flex flex-col gap-1 mt-1">
        <p className={`text-[10px] uppercase font-bold tracking-wider ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          Summary
        </p>
        <p className={`text-sm leading-relaxed ${expanded ? '' : 'line-clamp-2'} ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>
          {entry.learning || entry.morning || "Entry contains no text analysis."}
        </p>

        {/* Highlight Main Issue (Friction) */}
        {!expanded && entry.frictions && entry.frictions.length > 0 && (
          <p className={`text-[11px] font-medium mt-1 ${isDarkMode ? "text-red-400" : "text-red-500"}`}>
            Issue: {entry.frictions[0]}
          </p>
        )}

        {/* Highlight Win */}
        {!expanded && entry.win && (
          <p className={`text-[11px] font-medium ${isDarkMode ? "text-emerald-400" : "text-green-600"}`}>
            ✔ {entry.win}
          </p>
        )}
        
        {/* EXPANDED CONTENT (FULL DAY) */}
        {expanded && (
          <div className={`mt-4 pt-4 border-t space-y-4 animate-in fade-in duration-300 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
            
            {/* Behavior Overview Grid */}
            <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-gray-50 border-gray-100"}`}>
              <p className={`text-[10px] font-bold uppercase mb-2 tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                Behavior
              </p>
              <div className={`grid grid-cols-2 gap-y-2 gap-x-2 text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                <span className="flex gap-2"><span className={`w-14 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Energy:</span> {entry.energy || '-'}</span>
                <span className="flex gap-2"><span className={`w-14 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Sleep:</span> {entry.sleep || '-'}</span>
                <span className="flex gap-2"><span className={`w-14 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Focus:</span> {entry.focusArea || '-'}</span>
                <span className="flex gap-2"><span className={`w-14 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Execute:</span> {entry.executionQuality || '-'}</span>
                <span className="flex gap-2"><span className={`w-14 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Momentum:</span> {entry.momentum || '-'}</span>
                <span className="flex gap-2"><span className={`w-14 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Structure:</span> {entry.dayStructure || '-'}</span>
              </div>

              {/* Full Lists inside Behavior context */}
              {((entry.frictions && entry.frictions.length > 0) || entry.win) && (
                <div className={`mt-3 pt-3 border-t flex flex-col gap-2 ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}>
                  {entry.frictions && entry.frictions.length > 0 && (
                    <div className="text-[11px]">
                      <span className={`font-bold uppercase tracking-wider block mb-1 ${isDarkMode ? "text-red-400" : "text-red-500"}`}>Issues Faced</span>
                      <ul className={`list-disc pl-4 space-y-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {entry.frictions.map((f: string, i: number) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}
                  {entry.win && (
                    <p className={`text-[11px] font-bold mt-1 ${isDarkMode ? "text-emerald-400" : "text-green-600"}`}>
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
                <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Planning</span>
                <p className={`text-sm leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>{entry.morning}</p>
              </div>
            )}
            {entry.afternoon && (
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Execution</span>
                <p className={`text-sm leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>{entry.afternoon}</p>
              </div>
            )}
            {entry.evening && (
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Reflection</span>
                <p className={`text-sm leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>{entry.evening}</p>
              </div>
            )}
            {entry.tomorrow && (
              <div className={`p-3 rounded-xl border mt-2 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Next Focus</span>
                <p className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{entry.tomorrow}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer - Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {entry.tags.slice(0, 1).map((t: string) => (
            <span key={t} className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-tight ${
              isDarkMode ? "text-gray-300 bg-gray-800" : "text-gray-600 bg-gray-100"
            }`}>
              #{t}
            </span>
          ))}
          {entry.tags.length > 1 && (
            <span className={`text-[9px] font-bold px-2 py-1 rounded-md ${
              isDarkMode ? "text-gray-400 bg-[#111111]" : "text-gray-500 bg-gray-50"
            }`}>
              +{entry.tags.length - 1} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}