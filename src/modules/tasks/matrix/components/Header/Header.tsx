import React, { useState, useEffect, useRef } from 'react';
import { 
  CalendarDays, Save, Lock, Loader2, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Minus 
} from 'lucide-react';

interface WeekStats {
  best?: { label: string; value: number } | null;
  current?: { value: number } | null;
}

interface Meta {
  currentMonth?: string;
  lockedDates?: string[];
}

interface HeaderProps {
  todayDataLength: number;
  yesterdayDataLength: number;
  tasksLength: number;
  globalWeekStats: WeekStats;
  meta: Meta;
  existingTaskNames: string[];
  setMonthYear: (value: string) => void;
  addTask: (name: string, group: string) => Promise<void> | void; 
  showError: (msg: string) => void;
  showSuccess?: (msg: string) => void; 
  lockToday: () => void;
  actualToday: string;
}

const getLocalMonth = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

// Formats "2026-06-07" into "June 7"
const formatDisplayDate = (dateStr: string) => {
  try {
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

export default function Header({
  todayDataLength, yesterdayDataLength, tasksLength, globalWeekStats,
  meta, setMonthYear, addTask, showError, showSuccess, lockToday, actualToday, existingTaskNames
}: HeaderProps) {
  const [taskName, setTaskName] = useState('');
  const [taskGroup, setTaskGroup] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  
  const taskInputRef = useRef<HTMLInputElement>(null);

  const isLocked = meta.lockedDates?.includes(actualToday);
  const todayMonth = getLocalMonth();
  const selectedMonth = meta.currentMonth || todayMonth;

  useEffect(() => {
    if (!meta.currentMonth) {
      setMonthYear(todayMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showLockModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showLockModal]);

  const handleAdd = async () => {
    const trimmedName = taskName.trim();
    if (!trimmedName) return showError("Objective required");
    
    if (existingTaskNames.some(t => t.toLowerCase() === trimmedName.toLowerCase())) {
      return showError("Task already exists");
    }

    setIsAdding(true);
    try {
      await addTask(trimmedName, taskGroup.trim() || 'General');
      setTaskName('');
      setTaskGroup('');
      taskInputRef.current?.focus();
    } finally {
      setIsAdding(false);
    }
  };

  const confirmLock = () => {
    lockToday();
    setShowLockModal(false);
    if (showSuccess) showSuccess("Day locked permanently");
  };

  const todayColor = todayDataLength === 0 
    ? 'text-red-500' 
    : todayDataLength < yesterdayDataLength 
      ? 'text-orange-500' 
      : 'text-green-600';

  const progressPercentage = tasksLength ? Math.round((todayDataLength / tasksLength) * 100) : 0;
  
  const progressColorClass = progressPercentage < 30 
    ? 'bg-red-500' 
    : progressPercentage < 70 
      ? 'bg-orange-500' 
      : 'bg-green-500';

  const renderTrendIcon = () => {
    if (todayDataLength > yesterdayDataLength) return <ArrowUpRight size={14} className="text-green-500" />;
    if (todayDataLength < yesterdayDataLength) return <ArrowDownRight size={14} className="text-red-500" />;
    return <Minus size={14} className="text-gray-300" />;
  };

  const getStatus = () => {
    if (tasksLength === 0) return { label: 'No Data', icon: '-', color: 'text-gray-400' };
    if (todayDataLength > yesterdayDataLength) return { label: 'Improving', icon: '⚡', color: 'text-green-600' };
    if (todayDataLength < yesterdayDataLength) return { label: 'Falling Behind', icon: '📉', color: 'text-red-500' };
    if (todayDataLength === tasksLength) return { label: 'Perfect', icon: '🏆', color: 'text-yellow-500' };
    return { label: 'On Track', icon: '🔥', color: 'text-orange-500' };
  };

  const currentStatus = getStatus();

  return (
    <>
      {/* HIGH CONFIDENCE LOCK MODAL */}
      {showLockModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-800">
            <div className="flex items-center gap-3 text-gray-900 mb-5">
              <Lock size={24} className="text-red-600" />
              <h3 className="text-xl font-bold">Lock {formatDisplayDate(actualToday)}?</h3>
            </div>
            
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 text-sm font-medium">Total Tasks</span>
                <span className="font-bold text-gray-900">{tasksLength}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-medium">Completed</span>
                <span className="font-bold text-green-600">{todayDataLength}</span>
              </div>
            </div>

            <ul className="text-sm text-gray-600 space-y-2.5 mb-8 font-medium">
              <li className="flex gap-2.5"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"/> Today cannot be edited</li>
              <li className="flex gap-2.5"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"/> History becomes permanent</li>
            </ul>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowLockModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Cancel lock"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLock}
                className="px-5 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-xl shadow-sm transition-colors"
                aria-label="Confirm lock"
              >
                Yes, Lock Today
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPACT DESKTOP HEADER */}
      <div className="hidden md:flex justify-between items-center p-3 z-[80] bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.04)] sticky top-0">
        <div className="flex items-center gap-4 flex-wrap xl:flex-nowrap max-w-[1500px] w-full mx-auto">
          
          <div className="flex items-center gap-6">
            
            {/* TODAY BLOCK (Updated) */}
            <div className="flex flex-col cursor-default">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Today</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-lg font-bold ${todayColor} leading-none`}>
                  {todayDataLength}/{tasksLength}
                </span>
                <span className="text-sm font-bold text-gray-400 leading-none">
                  • {progressPercentage}%
                </span>
                {renderTrendIcon()}
              </div>
            </div>
            
            <div className="w-[1px] h-8 bg-gray-200" />
            
            {/* YESTERDAY BLOCK */}
            <div className="flex flex-col cursor-default">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Yesterday</span>
              <span className="text-lg font-bold text-gray-600 leading-none mt-1">
                {yesterdayDataLength}/{tasksLength}
              </span>
            </div>
            
            {tasksLength > 0 && (
              <>
                <div className="w-[1px] h-8 bg-gray-200" />
                
                {/* BEST WEEK */}
                {globalWeekStats.best && (
                  <div className="flex flex-col cursor-default">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Best Week</span>
                    <span className="text-sm font-bold text-gray-800 leading-none mt-1.5 flex items-center gap-1.5">
                      🔥 {globalWeekStats.best.label} • {Math.round(globalWeekStats.best.value)}%
                    </span>
                  </div>
                )}
                
                {/* THIS WEEK */}
                {globalWeekStats.current && (
                  <div className="flex flex-col cursor-default">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">This Week</span>
                    <span className="text-sm font-bold text-gray-800 leading-none mt-1.5 flex items-center gap-1.5">
                      📈 {Math.round(globalWeekStats.current.value)}%
                    </span>
                  </div>
                )}

                <div className="w-[1px] h-8 bg-gray-200" />

                {/* CURRENT STATUS (Replaced Momentum) */}
                <div className="flex flex-col cursor-default">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Status</span>
                  <span className={`text-sm font-bold leading-none mt-1.5 flex items-center gap-1.5 ${currentStatus.color}`}>
                    {currentStatus.icon} {currentStatus.label}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* MONTH PICKER */}
          <div className="ml-auto flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-300 focus-within:border-orange-400 focus-within:bg-white transition-all duration-200">
            <CalendarDays size={16} className="text-gray-400" />
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setMonthYear(e.target.value)} 
              className="outline-none text-sm font-bold text-gray-700 bg-transparent cursor-pointer"
              aria-label="Select tracking month"
            />
            {selectedMonth !== todayMonth && (
              <button 
                onClick={() => setMonthYear(todayMonth)}
                className="text-[10px] font-bold text-blue-500 hover:text-blue-700 tracking-wider ml-1 transition-colors"
                aria-label="Reset to current month"
              >
                TODAY
              </button>
            )}
          </div>
        </div>
      </div>

      {/* COMPACT MOBILE HEADER */}
      <div className="md:hidden z-[80] bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.04)] sticky top-0">
        <div className="p-3 flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setMonthYear(e.target.value)} 
                className="text-xs font-bold text-gray-800 uppercase tracking-widest bg-transparent outline-none"
                aria-label="Select tracking month"
              />
              {selectedMonth !== todayMonth && (
                <button 
                  onClick={() => setMonthYear(todayMonth)}
                  className="text-[10px] font-bold text-blue-500 hover:text-blue-700 tracking-wider transition-colors"
                  aria-label="Reset to current month"
                >
                  TODAY
                </button>
              )}
            </div>
            <span className="text-[10px] text-gray-400 font-medium mt-0.5">{formatDisplayDate(actualToday)}</span>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 leading-none mb-1">
              <span className={`text-xl font-bold ${todayColor}`}>{todayDataLength}/{tasksLength}</span>
              <span className="text-sm font-bold text-gray-400">
                • {progressPercentage}%
              </span>
              {renderTrendIcon()}
            </div>
            <span className="text-[10px] text-gray-400 font-medium">
              Yesterday: {yesterdayDataLength}
            </span>
          </div>
        </div>
        
        <div className="w-full h-1 bg-gray-100">
          <div 
            className={`h-full transition-all duration-500 ease-out ${progressColorClass}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* MOBILE ANALYTICS ROW */}
        {tasksLength > 0 && (globalWeekStats.best || globalWeekStats.current) && (
          <div className="bg-gray-50/80 px-3 py-2 flex justify-between items-center text-[10px] font-semibold text-gray-600 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {globalWeekStats.best && (
                <span className="flex items-center gap-1 text-gray-800">
                  🔥 W{globalWeekStats.best.label.replace('W', '')} • {Math.round(globalWeekStats.best.value)}%
                </span>
              )}
              {globalWeekStats.current && (
                <span className="flex items-center gap-1 text-gray-800">
                  📈 This Wk • {Math.round(globalWeekStats.current.value)}%
                </span>
              )}
            </div>
            <span className={`flex items-center gap-1 ${currentStatus.color}`}>
              {currentStatus.icon} {currentStatus.label}
            </span>
          </div>
        )}
      </div>

      {/* SHARED CONTROL BAR */}
      <div className="p-4 z-[70] bg-white border-b border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.03)] relative pb-6 md:pb-4">
        <div className="max-w-[1500px] mx-auto flex items-stretch md:items-center justify-between gap-4 flex-wrap md:flex-nowrap">
          
          <div className="flex items-center gap-3 flex-1 min-w-0 w-full md:w-auto">
            <div className="relative flex-1 min-w-0">
              <input 
                ref={taskInputRef}
                type="text" 
                value={taskName} 
                onChange={(e) => setTaskName(e.target.value)} 
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                disabled={isAdding || isLocked}
                maxLength={60}
                placeholder="Add a task (e.g. Workout, Study)..." 
                aria-label="New task name"
                className="w-full h-[44px] px-4 rounded-xl border border-gray-200 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 bg-white text-gray-800 text-sm font-semibold placeholder:text-gray-400 transition-all duration-200 shadow-sm disabled:bg-gray-50 disabled:text-gray-400" 
              />
              {tasksLength === 0 && (
                <span className="absolute top-full left-1 mt-1 text-[10px] text-gray-400 animate-in fade-in whitespace-nowrap">
                  Add tasks to start tracking performance
                </span>
              )}
            </div>
            
            <div className="relative shrink-0">
              <input 
                type="text" 
                value={taskGroup} 
                onChange={(e) => setTaskGroup(e.target.value)} 
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                disabled={isAdding || isLocked}
                maxLength={20}
                placeholder="GROUP" 
                aria-label="Task category group"
                className="w-[100px] md:w-[140px] h-[44px] px-4 rounded-xl border border-gray-200 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 font-bold text-[10px] uppercase tracking-widest bg-gray-50 text-gray-600 transition-all duration-200 shadow-sm disabled:text-gray-400" 
              />
              <span className="absolute top-full left-1 mt-1 text-[10px] text-gray-400 truncate w-full">
                Optional category
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button 
              onClick={handleAdd} 
              disabled={isAdding || isLocked || !taskName.trim()}
              aria-label="Add new task"
              className="flex-1 md:flex-none h-[44px] px-8 bg-gray-900 border border-gray-900 text-white hover:bg-orange-500 hover:border-orange-500 rounded-xl font-bold text-xs tracking-widest transition-all duration-200 hover:scale-[1.02] shadow-sm flex items-center justify-center disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-gray-900 disabled:hover:border-gray-900 disabled:cursor-not-allowed"
            >
              {isAdding ? <Loader2 size={16} className="animate-spin" /> : 'ADD'}
            </button>
            
            <div title={isLocked ? "Day is locked permanently" : "Locks today so it cannot be edited later"} className="flex-1 md:flex-none flex">
              <button 
                onClick={() => { 
                  if(isLocked || tasksLength === 0) return; 
                  setShowLockModal(true);
                }} 
                disabled={isLocked || tasksLength === 0}
                aria-label={isLocked ? "Day is locked" : "Lock today's results"}
                className={`w-full h-[44px] px-6 rounded-xl font-bold text-xs tracking-widest flex items-center justify-center gap-2 transition-all duration-200 border shadow-sm ${isLocked ? 'bg-green-50 text-green-700 border-green-300 cursor-not-allowed' : 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100'}`}
              >
                {isLocked ? <Lock size={14} /> : <Save size={14} />} {isLocked ? '✓ Locked' : 'Lock Today'}
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}