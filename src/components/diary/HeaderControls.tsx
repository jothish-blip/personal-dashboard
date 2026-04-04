import React from 'react';
import { BookOpen, Flame, ChevronLeft, ChevronRight, Calendar, PlayCircle, AlertTriangle, TrendingUp } from 'lucide-react';

export default function HeaderControls({ system }: any) {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><BookOpen size={24} className="text-orange-500" /> Life Engine Archive</h1>
          <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-widest">Full Behavior • Memory • Prediction System</p>
        </div>
        <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-3xl px-5 py-2 shadow-sm">
          <div className="flex items-center gap-1 text-orange-500">
            <Flame size={18} />
            <span className="font-bold text-lg">{system.currentStreak}</span>
            <span className="text-xs font-medium uppercase">day streak</span>
          </div>
          {system.badges.map((badge: string, i: number) => (
            <div key={i} className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-2xl font-medium flex items-center gap-1">{badge}</div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <div className="flex gap-2">
            <button onClick={() => system.setSelectedDate(system.actualToday)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${system.selectedDate === system.actualToday ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>Today</button>
            <button onClick={() => system.setSelectedDate(system.actualYesterday)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${system.selectedDate === system.actualYesterday ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>Yesterday</button>
          </div>
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-1 shadow-sm w-full sm:w-auto">
            <button onClick={() => system.changeDate(-1)} className="p-1.5 text-gray-400 hover:text-gray-800 transition-colors rounded hover:bg-gray-50"><ChevronLeft size={16} /></button>
            <div className="px-4 text-xs font-semibold text-gray-700 w-32 text-center flex items-center justify-center gap-2"><Calendar size={12} className="text-gray-400" />{system.selectedDate}</div>
            <button onClick={() => system.changeDate(1)} disabled={system.selectedDate > system.actualToday} className={`p-1.5 transition-colors rounded ${system.selectedDate > system.actualToday ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-50'}`}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        {system.isReplaying && (
          <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-xl flex-1 flex justify-between items-center shadow-sm">
            <span className="text-sm font-bold flex items-center gap-2 animate-pulse"><PlayCircle size={16} /> Timeline Replay Active</span>
            <button onClick={() => system.setIsReplaying(false)} className="text-xs font-bold bg-white px-3 py-1 rounded-md border border-orange-200 hover:bg-orange-100">Stop</button>
          </div>
        )}
        {system.activeAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl flex-1 flex items-center gap-2 shadow-sm">
            <AlertTriangle size={16} /> <span className="text-sm font-semibold">System Alert: {system.activeAlerts[0]}</span>
          </div>
        )}
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl flex-1 flex items-center gap-2 shadow-sm text-sm">
          <TrendingUp size={16} /> <span className="font-medium">Future Outlook:</span> {system.futurePrediction}
        </div>
      </div>
    </>
  );
}