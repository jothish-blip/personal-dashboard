import React from 'react';
import { History, Search, FileText, FileJson, PlayCircle, PauseCircle } from 'lucide-react';

export default function HistoryTimeline({ system }: any) {
  const { 
    weeklySummary, moodFilter, setMoodFilter, energyFilter, setEnergyFilter, 
    searchQuery, setSearchQuery, searchResults, historyDates, allEntries, 
    setSelectedDate, exportTXT, exportAllJSON, isReplaying, setIsReplaying 
  } = system;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex gap-2">
          <button onClick={exportTXT} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-600 rounded-lg shadow-sm"><FileText size={14} /> Export Entry</button>
          <button onClick={exportAllJSON} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-600 rounded-lg shadow-sm"><FileJson size={14} className="text-orange-500" /> Backup Archive</button>
        </div>
        <button onClick={() => setIsReplaying(!isReplaying)} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-600 rounded-lg hover:text-orange-600 shadow-sm">
          {isReplaying ? <PauseCircle size={14} /> : <PlayCircle size={14} />} {isReplaying ? 'Stop Replay' : 'Replay Timeline'}
        </button>
      </div>

      <hr className="border-gray-200 my-6" />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <History size={20} className="text-gray-500" />
            <div>
              <h3 className="text-lg font-bold text-gray-800">Timeline Vault</h3>
              <p className="text-xs font-medium text-gray-400">Weekly: {weeklySummary.dominantMood} Mood • Top Tag: {weeklySummary.topTag}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => setMoodFilter(moodFilter === 'good' ? null : 'good')} className={`px-3 py-1 text-xs rounded-3xl border ${moodFilter === 'good' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-gray-200'}`}>Good Mood</button>
            <button onClick={() => setMoodFilter(moodFilter === 'bad' ? null : 'bad')} className={`px-3 py-1 text-xs rounded-3xl border ${moodFilter === 'bad' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-gray-200'}`}>Low Mood</button>
            <button onClick={() => setEnergyFilter(energyFilter === 'low' ? null : 'low')} className={`px-3 py-1 text-xs rounded-3xl border ${energyFilter === 'low' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-gray-200'}`}>Low Energy</button>
            <div className="relative flex-1 md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search memories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs font-medium outline-none focus:border-orange-400 shadow-sm" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {searchQuery || moodFilter || energyFilter ? (
            searchResults.length === 0 ? <p className="text-sm p-4 text-center bg-white border rounded-xl">No entries match your search.</p> :
            searchResults.map(([date, entry]: [string, any]) => (
              <button key={date} onClick={() => { setSelectedDate(date); setSearchQuery(''); setMoodFilter(null); setEnergyFilter(null); }} className="flex flex-col p-4 bg-white border border-gray-200 rounded-xl text-left gap-2 shadow-sm hover:border-orange-300">
                <div className="flex justify-between items-center w-full">
                  <span className="text-sm font-bold text-gray-800">{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{entry.mood} • {entry.focusArea}</span>
                </div>
                <p className="text-xs text-gray-500 font-medium truncate w-full">{entry.learning || entry.morning || "No text content"}</p>
              </button>
            ))
          ) : (
            historyDates.length === 0 ? <p className="text-sm p-4 text-center bg-white border rounded-xl">No timeline history established yet.</p> :
            historyDates.map((date: string) => {
              const entry = allEntries[date];
              const displayDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              if (entry.isMissed) {
                return (
                  <div key={date} className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-100 rounded-xl opacity-60">
                    <span className="text-xs font-bold text-gray-500 w-24">{displayDate}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Missed Day</span>
                  </div>
                );
              }
              return (
                <button key={date} onClick={() => setSelectedDate(date)} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border rounded-xl text-left gap-3 shadow-sm ${system.selectedDate === date ? 'border-orange-400 ring-1 ring-orange-400/20' : 'border-gray-200 hover:border-orange-300'}`}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-sm font-bold text-gray-800 w-24 shrink-0">{displayDate}</span>
                    <p className="text-xs text-gray-600 font-medium truncate">{entry.learning ? `💡 ${entry.learning}` : entry.morning || "No text content"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.chapter && <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded uppercase">{entry.chapter}</span>}
                    {entry.tags.slice(0, 2).map((t: string) => <span key={t} className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">{t}</span>)}
                    {entry.tags.length > 2 && <span className="text-[9px] font-bold text-gray-400">+{entry.tags.length - 2}</span>}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}