import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  FileText, 
  FileJson, 
  PlayCircle, 
  PauseCircle,
  Filter,
  CalendarDays
} from 'lucide-react';

export default function HistoryTimeline({ system }: any) {
  const { 
    weeklySummary, moodFilter, setMoodFilter, energyFilter, setEnergyFilter, 
    searchQuery, setSearchQuery, searchResults, historyDates, filteredHistory, allEntries, 
    setSelectedDate, exportTXT, exportAllJSON, isReplaying, setIsReplaying 
  } = system;

  // Use filteredHistory if available from the upgraded useDiarySystem, otherwise fallback to historyDates
  const displayDates = filteredHistory || historyDates || [];

  return (
    <div className="pb-24">
      {/* 1️⃣ PRIMARY ACTIONS (Export & Replay) */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <button 
            onClick={exportTXT} 
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-bold bg-white border border-gray-200 text-gray-600 rounded-xl shadow-sm active:scale-95 transition-all"
          >
            <FileText size={14} /> Export
          </button>
          <button 
            onClick={exportAllJSON} 
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-bold bg-white border border-gray-200 text-gray-600 rounded-xl shadow-sm active:scale-95 transition-all"
          >
            <FileJson size={14} className="text-orange-500" /> Backup
          </button>
        </div>
        
        <div>
          <button 
            onClick={() => setIsReplaying(!isReplaying)} 
            className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-bold rounded-xl shadow-sm transition-all border ${
              isReplaying 
                ? 'bg-orange-500 border-orange-600 text-white animate-pulse' 
                : 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'
            }`}
          >
            {isReplaying ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
            {isReplaying ? 'Stop Replay' : 'Replay Timeline'}
          </button>
          
          {/* Improved Replay Visibility Label */}
          {isReplaying ? (
            <p className="text-[10px] text-orange-500 text-center font-bold mt-2 animate-pulse">
              Replaying timeline...
            </p>
          ) : (
            <p className="text-[10px] text-gray-400 text-center mt-2 font-medium">
              Automatically step through your past entries
            </p>
          )}
        </div>
      </div>

      <hr className="border-gray-100 my-8" />

      {/* 2️⃣ VAULT HEADER & FILTERING ENGINE */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Timeline</h3>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {weeklySummary.dominantMood} mood • {weeklySummary.topTag}
              </p>
            </div>
          </div>

          {/* Search Bar - Full Width with Clear Button */}
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search memories..." 
              value={searchQuery} 
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
              <span className="text-[10px] font-bold text-gray-400 uppercase">Filters</span>
            </div>
            <button 
              onClick={() => setMoodFilter(moodFilter === 'good' ? null : 'good')} 
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${
                moodFilter === 'good' ? 'bg-green-500 border-green-600 text-white scale-105 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              Good Mood
            </button>
            <button 
              onClick={() => setMoodFilter(moodFilter === 'bad' ? null : 'bad')} 
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${
                moodFilter === 'bad' ? 'bg-red-500 border-red-600 text-white scale-105 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              Low Mood
            </button>
            <button 
              onClick={() => setEnergyFilter(energyFilter === 'low' ? null : 'low')} 
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${
                energyFilter === 'low' ? 'bg-orange-500 border-orange-600 text-white scale-105 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              Low Energy
            </button>
          </div>
        </div>

        {/* 3️⃣ TIMELINE CARDS LIST */}
        <div className="flex flex-col gap-3">
          {displayDates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <CalendarDays size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-400">No entries yet. Start writing your day to build history.</p>
            </div>
          ) : (
            displayDates.map((date: string) => {
              // Handle both direct dates (from filteredHistory) and tuple dates (from searchResults if used)
              const dateKey = Array.isArray(date) ? date[0] : date;
              const entryObj = Array.isArray(date) ? date[1] : allEntries[dateKey];
              return <HistoryCard key={dateKey} date={dateKey} entry={entryObj} system={system} />;
            })
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Clean, Expandable Card Component with Resolved Tap Conflicts
 */
function HistoryCard({ date, entry, system }: any) {
  const isSelected = system.selectedDate === date;
  const [expanded, setExpanded] = useState(false);
  const displayDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  
  // Auto-expand during replay animation
  useEffect(() => {
    if (system.isReplaying && isSelected) {
      setExpanded(true);
    } else if (system.isReplaying && !isSelected) {
      setExpanded(false);
    }
  }, [system.isReplaying, isSelected]);

  if (entry.isMissed) {
    return (
      <div className="flex flex-col gap-1 p-4 sm:p-5 bg-gray-50 border border-gray-200 rounded-2xl opacity-60">
        <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">{displayDate}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No entry logged</span>
      </div>
    );
  }

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
        {/* Navigation Button: Only navigates to date, prevents card collapse */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            system.setSelectedDate(date);
          }}
          className={`text-sm font-black transition-colors hover:underline focus:outline-none focus:underline ${isSelected ? 'text-orange-700' : 'text-gray-900'}`}
        >
          {displayDate}
        </button>
        
        <div className="flex items-center gap-2">
           <span className="text-[9px] font-bold text-gray-400 uppercase bg-white px-2 py-0.5 rounded border border-gray-100 shadow-sm">
            {entry.mood}
          </span>
          {entry.chapter && (
            <span className="text-[9px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 uppercase">
              {entry.chapter}
            </span>
          )}
          {/* Expand Icon Context */}
          <span className="text-xs text-gray-400 font-bold ml-1">
            {expanded ? '−' : '+'}
          </span>
        </div>
      </div>

      {/* Card Body - Context Label & Content */}
      <div className="flex flex-col gap-1">
        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
          Key Note
        </p>
        <p className={`text-sm text-gray-800 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {entry.learning || entry.morning || "Entry contains no text analysis."}
        </p>
        
        {/* EXPANDED CONTENT (FULL DAY) */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-orange-200/50 space-y-4 animate-in fade-in duration-300">
            {entry.morning && (
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Morning</span>
                <p className="text-sm text-gray-800 leading-relaxed">{entry.morning}</p>
              </div>
            )}
            {entry.afternoon && (
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Afternoon</span>
                <p className="text-sm text-gray-800 leading-relaxed">{entry.afternoon}</p>
              </div>
            )}
            {entry.evening && (
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Evening</span>
                <p className="text-sm text-gray-800 leading-relaxed">{entry.evening}</p>
              </div>
            )}
            {entry.tomorrow && (
              <div className="bg-white/60 p-3 rounded-xl border border-orange-100 mt-2">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">Tomorrow</span>
                <p className="font-bold text-gray-900">{entry.tomorrow}</p>
              </div>
            )}
          </div>
        )}

        <p className="text-[10px] text-orange-400 font-bold mt-2 transition-colors">
          {expanded ? 'Tap to collapse' : 'Tap to view full day'}
        </p>
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