import React from 'react';
import { 
  BookOpen, 
  Flame, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  RefreshCw, 
  Zap, 
  CheckCircle2 
} from 'lucide-react';

export default function HeaderControls({ system }: any) {
  const isToday = system.selectedDate === system.actualToday;
  const isYesterday = system.selectedDate === system.actualYesterday;

  // Formatting energy for "High" instead of "high"
  const formattedEnergy = system.currentEntry?.energy 
    ? system.currentEntry.energy.charAt(0).toUpperCase() + system.currentEntry.energy.slice(1)
    : '—';

  const fullDateLabel = new Date(system.selectedDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const stepperDate = new Date(system.selectedDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 md:gap-6 pb-6 border-b border-gray-100">
      
      {/* 1️⃣ IDENTITY & DYNAMIC DATE */}
      <div className="flex items-center gap-3">
        <div className="bg-orange-500 p-2.5 rounded-xl text-white shadow-sm shrink-0">
          <BookOpen size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Life Engine</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-gray-500 font-semibold">{fullDateLabel}</span>
            {isToday && (
              <span className="flex items-center gap-1.5 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-green-100">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
          {/* Micro UX Context Hint */}
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">
            {isToday ? "Live tracking enabled" : "Viewing saved entry"}
          </p>
        </div>
      </div>

      {/* 2️⃣ METRICS BAR (The Pulse) - Responsive wrap with tooltips */}
      <div className="flex flex-wrap items-center justify-between lg:justify-start gap-3 md:gap-6 bg-white border border-gray-200 rounded-2xl px-4 md:px-6 py-2.5 shadow-sm">
        <div className="flex items-center gap-2 text-orange-600" title="Streak">
          <Flame size={16} strokeWidth={2.5} />
          <span className="font-bold text-sm">{system.currentStreak}d</span>
        </div>
        
        <div className="h-4 w-[1px] bg-gray-200 hidden xs:block" />
        
        <div className="flex items-center gap-2 text-blue-600" title="Task consistency">
          <CheckCircle2 size={16} strokeWidth={2.5} />
          <span className="font-bold text-sm">{system.consistency || 0}%</span>
        </div>

        <div className="h-4 w-[1px] bg-gray-200 hidden xs:block" />

        {/* Removed redundant emoji, kept clean icon */}
        <div className="flex items-center gap-2 text-amber-600" title="Energy level">
          <Zap size={16} strokeWidth={2.5} />
          <span className="font-bold text-sm tracking-tight uppercase">
            {formattedEnergy}
          </span>
        </div>
      </div>

      {/* 3️⃣ TIMELINE & NAVIGATION CLUSTER */}
      <div className="flex flex-col sm:flex-row lg:flex-row items-center gap-4">
        
        {/* Navigation Group: Stepper + Quick Jumps */}
        <div className="flex flex-col w-full sm:w-auto gap-2">
          <div className="flex items-center justify-between sm:justify-start w-full bg-gray-50 border border-gray-200 rounded-xl p-1">
            <button 
              onClick={() => system.changeDate(-1)} 
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-lg transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            
            {/* Widened min-w to prevent text shift on longer dates */}
            <div className={`px-3 flex items-center gap-2 text-xs font-bold min-w-[110px] justify-center transition-colors ${isToday ? 'text-orange-600' : 'text-gray-700'}`}>
              <Calendar size={13} className={isToday ? 'text-orange-400' : 'text-gray-400'} />
              {stepperDate}
            </div>

            <button 
              onClick={() => system.changeDate(1)} 
              disabled={system.selectedDate >= system.actualToday}
              className={`p-1.5 rounded-lg transition-all ${
                system.selectedDate >= system.actualToday 
                  ? 'text-gray-200 cursor-not-allowed' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm'
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Desktop Quick Jumps */}
          <div className="hidden sm:flex gap-1 bg-gray-50 border border-gray-200 p-1 rounded-xl">
            <button 
              onClick={() => system.setSelectedDate(system.actualYesterday)}
              className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                isYesterday ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Yesterday
            </button>
            <button 
              onClick={() => system.setSelectedDate(system.actualToday)}
              className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                isToday ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Today
            </button>
          </div>

          {/* Mobile Quick Jumps (Expanded Touch Targets) */}
          <div className="flex sm:hidden justify-between w-full px-1">
            <button 
              onClick={() => system.setSelectedDate(system.actualYesterday)} 
              className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-orange-500 transition-colors"
            >
              ← Yesterday
            </button>
            <button 
              onClick={() => system.setSelectedDate(system.actualToday)} 
              className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-orange-500 transition-colors"
            >
              Today →
            </button>
          </div>
        </div>

        {/* Timeline Status & Replay Control (Expanded Mobile Spacing) */}
        <div className="flex justify-between items-center w-full sm:w-auto pt-5 sm:pt-0 border-t sm:border-t-0 sm:border-l border-gray-200 sm:pl-4 mt-3 sm:mt-0 gap-4">
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Timeline</p>
            <p className={`text-xs font-bold ${isToday ? 'text-orange-600' : 'text-gray-600'}`}>
              {isToday ? 'Today (Live)' : 'Past Entry'}
            </p>
          </div>

          <button 
            onClick={() => system.setIsReplaying(!system.isReplaying)}
            className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all shadow-sm ${
              system.isReplaying 
                ? 'bg-orange-500 border-orange-600 text-white animate-pulse' 
                : 'bg-white border-gray-200 text-gray-400 hover:border-orange-200 hover:text-orange-600'
            }`}
            title="Replay timeline history"
          >
            <RefreshCw size={18} strokeWidth={2.5} className={system.isReplaying ? 'animate-spin' : ''} />
            {/* Desktop text hint for discoverability */}
            <span className={`hidden lg:block text-[10px] font-bold uppercase tracking-widest ${system.isReplaying ? 'text-white' : 'text-gray-500'}`}>
              Replay
            </span>
          </button>
        </div>

      </div>
    </header>
  );
}