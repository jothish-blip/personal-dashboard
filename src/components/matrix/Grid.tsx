"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Flame, Zap, Star, ChevronDown, ChevronRight, Check, Trash2, ArrowRightLeft } from 'lucide-react';
import { Task } from '../../types';
import { parseLocalDate, calculateCurrentStreak, getLocalDate } from './utils';

interface GridProps {
  tasks: Task[];
  meta: any;
  groupedTasks: Record<string, Task[]>;
  groups: string[];
  weeksInMonth: { weekLabel: string; days: (string | null)[] }[];
  visibleDays: (string | null)[];
  actualToday: string;
  todayRef: React.RefObject<HTMLTableCellElement | null>; 
  handleToggleSafe: (task: Task, dateStr: string) => void;
  deleteTask: (id: string) => void;
  activeWeekIndex: number;
  showScrollHint?: boolean;
  dismissScrollHint?: () => void;
}

const Grid = ({
  tasks, meta, groupedTasks, groups, weeksInMonth, visibleDays, actualToday, 
  todayRef, handleToggleSafe, deleteTask, activeWeekIndex, showScrollHint, dismissScrollHint
}: GridProps) => {
  
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [hasSwiped, setHasSwiped] = useState(false);
  
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isSwiping = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      todayRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }, 100);
    return () => clearTimeout(timer);
  }, [actualToday, todayRef]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("matrix_collapsed_groups");
      if (saved) {
        try { setCollapsedGroups(new Set(JSON.parse(saved))); } catch(e){}
      }
    }
  }, []);

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      localStorage.setItem("matrix_collapsed_groups", JSON.stringify([...next]));
      return next;
    });
  }, []);

  useEffect(() => {
    if (activeWeekIndex !== -1) setSelectedWeek(activeWeekIndex);
  }, [activeWeekIndex]);

  const yesterdayStr = useMemo(() => {
    const d = parseLocalDate(actualToday);
    d.setDate(d.getDate() - 1);
    return getLocalDate(d); 
  }, [actualToday]);

  const historyMap = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    tasks.forEach(t => { map[t.id] = t.history || {}; });
    return map;
  }, [tasks]);

  const todayCompletionsCount = useMemo(() => {
    return tasks.filter(t => historyMap[t.id]?.[actualToday]).length;
  }, [tasks, historyMap, actualToday]);

  const validDaysCount = useMemo(() => visibleDays.filter(Boolean).length, [visibleDays]);

  const getStreakStyle = (streak: number) => {
    if (streak >= 14) return { bg: 'bg-rose-500', text: 'text-white', icon: 'text-rose-200 animate-pulse', shadow: 'shadow-[0_0_15px_rgba(243,33,112,0.6)]' };
    if (streak >= 7) return { bg: 'bg-orange-500', text: 'text-white', icon: 'text-orange-200 animate-pulse', shadow: 'shadow-[0_0_12px_rgba(249,115,22,0.6)]' };
    if (streak >= 4) return { bg: 'bg-green-500', text: 'text-white', icon: 'text-green-200', shadow: '' };
    if (streak > 0) return { bg: 'bg-gray-200', text: 'text-gray-600', icon: 'text-gray-400', shadow: '' };
    return null;
  };

  const getProgressColor = (pct: number) => {
    if (pct < 40) return 'bg-red-500';
    if (pct < 70) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchEndX.current = null; isSwiping.current = false;
    touchStartX.current = e.targetTouches[0].clientX; touchStartY.current = e.targetTouches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = Math.abs(e.targetTouches[0].clientX - touchStartX.current);
    const diffY = Math.abs(e.targetTouches[0].clientY - touchStartY.current);
    if (diffX > diffY && diffX > 10) { isSwiping.current = true; touchEndX.current = e.targetTouches[0].clientX; }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping.current || touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50 && selectedWeek < weeksInMonth.length - 1) { setSelectedWeek(prev => prev + 1); if (!hasSwiped) setHasSwiped(true); }
    if (distance < -50 && selectedWeek > 0) { setSelectedWeek(prev => prev - 1); if (!hasSwiped) setHasSwiped(true); }
    touchStartX.current = null; touchStartY.current = null; touchEndX.current = null; isSwiping.current = false;
  }, [selectedWeek, weeksInMonth.length, hasSwiped]);

  const desktopRows = useMemo(() => {
    return groups.map(group => {
      const groupTasks = groupedTasks[group];
      if (!groupTasks || groupTasks.length === 0) return null;
      const isCollapsed = collapsedGroups.has(group);

      return (
        <React.Fragment key={group}>
          <tr className="bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200" onClick={() => toggleGroup(group)}>
            <td className="sticky left-0 z-[40] px-6 py-3 bg-gray-100 font-bold text-[10px] text-gray-600 uppercase tracking-widest shadow-[4px_0_12px_rgba(0,0,0,0.08)] flex items-center gap-2 border-r border-gray-200">
              {isCollapsed ? <ChevronRight size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
              {group} <span className="ml-2 px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded-full text-[8px]">{groupTasks.length}</span>
            </td>
            <td colSpan={visibleDays.length}></td>
          </tr>
          
          {!isCollapsed && groupTasks.map(task => {
            const currentStreak = calculateCurrentStreak(task.history, actualToday);
            const streakStyle = getStreakStyle(currentStreak);
            const isAtRisk = !historyMap[task.id]?.[actualToday] && currentStreak > 0;
            
            // 🟢 FIXED: Safe string comparison
            const validPastDays = visibleDays.filter(d => d && `${meta.currentMonth}-${d}` <= actualToday);
            const donePastDays = validPastDays.filter(d => historyMap[task.id]?.[`${meta.currentMonth}-${d}`]);
            const isPerfectWeek = validPastDays.length > 0 && donePastDays.length === validPastDays.length;

            const completedMonthDays = visibleDays.filter(d => d && historyMap[task.id]?.[`${meta.currentMonth}-${d}`]).length;
            const monthProgressPct = validDaysCount ? (completedMonthDays / validDaysCount) * 100 : 0;
            const monthBarColor = getProgressColor(monthProgressPct);

            return (
              <tr key={task.id} className="group hover:bg-gray-100/60 hover:scale-[1.002] transition-all duration-200 border-b border-gray-200 last:border-b-0">
                <td className="sticky left-0 z-[40] bg-white p-4 group-hover:bg-gray-50 transition-all duration-200 shadow-[4px_0_12px_rgba(0,0,0,0.06)] border-r border-gray-200 backdrop-blur-[2px]">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-sm text-gray-800 transition-colors group-hover:text-black">{task.name}</span>
                        <div className="flex items-center gap-1.5">
                          {streakStyle && (
                            <div title="Current streak" className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${streakStyle.bg} ${streakStyle.text} ${streakStyle.shadow} transition-all duration-300 cursor-help`}>
                              <Flame size={10} className={streakStyle.icon} /><span>{currentStreak}d</span>
                            </div>
                          )}
                          {isAtRisk && <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest bg-red-50 px-1.5 py-0.5 rounded border border-red-100">risk</span>}
                          {isPerfectWeek && <Zap size={14} className="text-green-500 drop-shadow-[0_0_4px_rgba(34,197,94,0.4)]" fill="currentColor" />}
                        </div>
                      </div>

                      <div className="w-full max-w-[140px] mt-1 group-hover:opacity-100 opacity-60 transition-opacity">
                         <div className="flex justify-between items-center mb-1">
                           <span className="text-[9px] text-gray-500 font-medium">Monthly progress</span>
                           <span className="text-[9px] text-gray-500 font-bold">{Math.round(monthProgressPct)}%</span>
                         </div>
                         <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                           <div className={`h-full ${monthBarColor} transition-all duration-700 ease-out`} style={{ width: `${monthProgressPct}%` }} />
                         </div>
                      </div>
                    </div>
                    
                    <button title="Delete task" onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 p-1.5 transition-all duration-200 hover:bg-red-50 rounded shrink-0 cursor-pointer">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </td>
                
                {visibleDays.map((day, i) => {
                  if (!day) return <td key={`pad-box-${i}`} className="bg-gray-50/30 border-gray-200" />;
                  const dateStr = `${meta.currentMonth}-${day}`;
                  const isDone = !!historyMap[task.id]?.[dateStr];
                  
                  // 🟢 THE FIX: Compare STRINGS natively. Bulletproof.
                  const isFuture = dateStr > actualToday;
                  const isPast = dateStr < actualToday;
                  const isLocked = meta.lockedDates?.includes(dateStr) && dateStr !== actualToday;
                  const isDisabled = isFuture || isLocked;
                  
                  const isTodayCol = dateStr === actualToday;
                  const isYesterday = dateStr === yesterdayStr; 
                  
                  const tooltipMsg = isYesterday ? "Yesterday's progress" : isFuture ? "Future locked" : isPast ? "Past" : isLocked ? "Locked" : "";
                  const heatmapStyle = isDone && currentStreak >= 7 ? 'checked:bg-orange-500 checked:border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]' : 'checked:bg-green-500 checked:border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]';

                  return (
                    <td key={day} className={`text-center p-0 transition-colors duration-300 hover:bg-gray-100/60 border-gray-200 ${isTodayCol ? 'bg-orange-100 ring-2 ring-orange-400 shadow-[inset_0_0_0_1px_rgba(251,146,60,0.4)] z-10' : ''} ${isYesterday ? 'bg-blue-50/30 z-10' : ''} ${isDone && !isTodayCol && !isYesterday ? 'bg-green-50/10' : ''}`} title={tooltipMsg}>
                      <div className="h-[72px] flex items-center justify-center touch-manipulation group/cell relative">
                        {isDone && <div className="absolute inset-0 m-auto w-6 h-6 bg-green-400 rounded-md animate-ping opacity-0 pointer-events-none" style={{ animationIterationCount: 1, animationDuration: '600ms' }} />}
                        <div className="relative flex items-center justify-center w-6 h-6">
                          <input type="checkbox" checked={isDone} onChange={() => { if (!isDisabled) handleToggleSafe(task, dateStr); }} 
                            className={`peer appearance-none w-5 h-5 rounded-[6px] border-[2px] transition-all duration-300 will-change-transform active:scale-75 ${isDisabled ? 'border-gray-200 bg-gray-50/50 cursor-not-allowed' : 'border-gray-300 hover:border-gray-400 cursor-pointer'} ${isDone && !isDisabled ? heatmapStyle : ''}`} />
                          <Check size={12} strokeWidth={4} className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all duration-300" />
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </React.Fragment>
      );
    });
  }, [groups, groupedTasks, visibleDays, historyMap, meta.currentMonth, meta.lockedDates, actualToday, yesterdayStr, deleteTask, handleToggleSafe, collapsedGroups, validDaysCount]);

  const mobileGroups = useMemo(() => {
    return groups.map(group => {
      const groupTasks = groupedTasks[group];
      if (!groupTasks || groupTasks.length === 0) return null;
      const isCollapsed = collapsedGroups.has(group);

      return (
        <div key={group} className="space-y-4 mb-6">
          <button onClick={() => toggleGroup(group)} className="w-full flex items-center gap-2 text-[11px] font-bold text-gray-600 uppercase tracking-widest px-2 active:opacity-70 transition-opacity">
            {isCollapsed ? <ChevronRight size={14}/> : <ChevronDown size={14}/>} {group}
          </button>
          
          {!isCollapsed && weeksInMonth.map((week, wIndex) => {
            if (selectedWeek !== wIndex) return null;

            const weekValidDays = week.days.filter(Boolean).length;
            const totalWeekTasks = groupTasks.length * weekValidDays;
            let completedWeekTasks = 0;
            groupTasks.forEach(t => { week.days.forEach(d => { if (d && historyMap[t.id]?.[`${meta.currentMonth}-${d}`]) completedWeekTasks++; }); });
            
            const progressPct = totalWeekTasks === 0 ? 0 : (completedWeekTasks / totalWeekTasks) * 100;
            const isPerfectGroupWeek = progressPct === 100 && totalWeekTasks > 0;
            const barColor = getProgressColor(progressPct);

            return (
              <div key={week.weekLabel} className="bg-white border border-gray-200 rounded-[20px] p-5 space-y-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                    Week {wIndex + 1}
                    {isPerfectGroupWeek && <span className="flex items-center gap-1 text-[9px] text-green-700 bg-green-100 px-2 py-0.5 rounded-full animate-in zoom-in"><Star size={10} fill="currentColor" /> Perfect</span>}
                  </div>
                  <div className="text-[10px] font-bold text-gray-500">{progressPct.toFixed(0)}%</div>
                </div>
                
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full transition-all duration-700 ease-out ${barColor}`} style={{ width: `${progressPct}%` }} />
                </div>

                {groupTasks.map(task => {
                  const completedMonthDays = visibleDays.filter(d => d && historyMap[task.id]?.[`${meta.currentMonth}-${d}`]).length;
                  const monthProgressPct = validDaysCount ? (completedMonthDays / validDaysCount) * 100 : 0;
                  const monthBarColor = getProgressColor(monthProgressPct);

                  return (
                    <div key={task.id} className="space-y-4 pb-5 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col gap-1 w-full">
                          <div className="text-sm font-semibold text-gray-800 leading-tight">{task.name}</div>
                          <div className="flex items-center gap-2 w-full max-w-[120px] mt-1">
                             <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full ${monthBarColor}`} style={{ width: `${monthProgressPct}%` }} /></div>
                             <span className="text-[9px] text-gray-500 font-bold shrink-0">{Math.round(monthProgressPct)}%</span>
                          </div>
                        </div>
                        <button title="Delete task" onClick={() => deleteTask(task.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"><Trash2 size={14}/></button>
                      </div>

                      <div className="grid grid-cols-7 gap-3 px-1 relative">
                        {week.days.map((day, i) => {
                          if (!day) return <div key={i} className="flex-shrink-0" />;
                          const dateStr = `${meta.currentMonth}-${day}`;
                          const isDone = !!historyMap[task.id]?.[dateStr];
                          
                          // 🟢 FIXED: Mobile safe string comparison
                          const isFuture = dateStr > actualToday;
                          const isLocked = meta.lockedDates?.includes(dateStr) && dateStr !== actualToday;
                          const isDisabled = isFuture || isLocked;
                          
                          const isToday = dateStr === actualToday;
                          const isYesterday = dateStr === yesterdayStr;
                          
                          const cStreak = calculateCurrentStreak(task.history, dateStr);
                          const heatmapBg = isDone ? (cStreak >= 7 ? 'checked:bg-orange-500 checked:border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'checked:bg-green-500 checked:border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]') : 'bg-gray-50';

                          return (
                            <div key={day} className={`relative flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl flex-shrink-0 touch-manipulation transition-colors duration-300 ${isToday ? "bg-orange-100 border border-orange-400 shadow-[inset_0_0_0_1px_rgba(251,146,60,0.4)]" : isYesterday ? "bg-blue-50/40" : "border border-transparent"}`}>
                              <div className="flex flex-col items-center">
                                <span className={`text-[9px] font-bold z-10 pointer-events-none ${isToday ? "text-orange-700" : isYesterday ? "text-blue-600" : isDone ? "text-gray-800" : "text-gray-500"}`}>
                                  {['M','T','W','T','F','S','S'][i]}
                                </span>
                                <span className="text-[10px] font-bold text-gray-500 mb-1">{day}</span>
                              </div>
                              <div className="relative flex items-center justify-center w-9 h-9 z-10">
                                <input type="checkbox" checked={isDone} onChange={() => { if (!isDisabled) handleToggleSafe(task, dateStr); }} 
                                  className={`peer appearance-none w-9 h-9 rounded-[12px] border-[2px] transition-all duration-300 will-change-transform active:scale-75 ${heatmapBg} ${isDisabled ? "border-gray-200 opacity-50 grayscale cursor-not-allowed" : "border-gray-300 cursor-pointer"}`} />
                                <Check size={18} strokeWidth={4} className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all duration-300" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    });
  }, [groups, groupedTasks, weeksInMonth, selectedWeek, historyMap, meta.currentMonth, meta.lockedDates, actualToday, yesterdayStr, deleteTask, handleToggleSafe, collapsedGroups, validDaysCount]);

  return (
    <>
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-200 overflow-hidden relative z-10 min-h-[400px] hidden md:flex flex-col">
        <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-30"></div>
        {showScrollHint && (
          <div className="absolute top-1/2 right-4 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-xl text-xs font-bold z-40 animate-pulse flex items-center gap-1 pointer-events-none shadow-xl transition-opacity">
            Swipe days <ChevronRight size={14}/>
          </div>
        )}

        <div className="w-full overflow-x-auto flex-1 pb-4" style={{ scrollBehavior: 'smooth' }} onScroll={dismissScrollHint}>
          <table className="w-full min-w-max text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="sticky left-0 top-0 z-[60] bg-white p-2 min-w-[340px] shadow-[4px_0_12px_rgba(0,0,0,0.08)] border-b border-gray-200 border-r border-gray-200"></th>
                {weeksInMonth.map((week) => {
                  const weekValidDays = week.days.filter(Boolean).length;
                  const totalWeekTasks = tasks.length * weekValidDays;
                  let completedWeekTasks = 0;
                  
                  let bestDay = { day: '', count: -1 };
                  week.days.forEach(d => {
                    if (!d) return;
                    let dayCount = 0;
                    tasks.forEach(t => { if (historyMap[t.id]?.[`${meta.currentMonth}-${d}`]) { completedWeekTasks++; dayCount++; } });
                    if (dayCount > bestDay.count) bestDay = { day: d, count: dayCount };
                  });
                  
                  const weekPct = totalWeekTasks ? Math.round((completedWeekTasks / totalWeekTasks) * 100) : 0;

                  return (
                    <th key={week.weekLabel} colSpan={7} className="group relative text-center text-[10px] font-bold uppercase tracking-widest p-3 text-gray-600 hover:text-gray-800 transition-colors cursor-help border-gray-200">
                      {week.weekLabel}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-36 bg-gray-900 text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 normal-case tracking-normal text-left animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-1"><span className="text-gray-300">Completion</span><span className="font-bold text-orange-400">{weekPct}%</span></div>
                        <div className="w-full h-1 bg-gray-700 rounded-full mb-2 overflow-hidden"><div className={`h-full ${getProgressColor(weekPct)}`} style={{width: `${weekPct}%`}}></div></div>
                        <div className="flex justify-between items-center"><span className="text-gray-300">Best Day</span><span className="font-bold">{bestDay.count >= 0 ? `${bestDay.day} (${bestDay.count} obj)` : '-'}</span></div>
                        <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900"></div>
                      </div>
                    </th>
                  );
                })}
              </tr>
              <tr className="bg-white">
                <th className="sticky left-0 top-0 z-[60] bg-white border-b border-gray-200 p-2 shadow-[4px_0_12px_rgba(0,0,0,0.08)] border-r border-gray-200"></th>
                {visibleDays.map((_, i) => (
                  <th key={`dayname-${i}`} className="border-b border-gray-200 p-2 text-[9px] font-bold text-gray-500 text-center uppercase tracking-widest">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i % 7]}
                  </th>
                ))}
              </tr>
              <tr className="bg-white shadow-[0_4px_10px_-10px_rgba(0,0,0,0.1)]">
                <th className="sticky left-0 z-[50] bg-white border-b border-gray-200 px-6 py-4 shadow-[4px_0_12px_rgba(0,0,0,0.08)] border-r border-gray-200">
                  <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Active Objectives</span>
                </th>
                {visibleDays.map((day, i) => {
                  if (!day) return <th key={`pad-${i}`} className="border-b border-gray-200 bg-gray-50/20"></th>;
                  const dateStr = `${meta.currentMonth}-${day}`;
                  const isTodayCol = dateStr === actualToday;
                  const isYesterdayCol = dateStr === yesterdayStr;
                  return (
                    <th key={day} ref={isTodayCol ? todayRef : null} className={`border-b border-gray-200 p-3 text-[11px] font-bold text-center min-w-[50px] transition-all duration-200 ${isTodayCol ? 'bg-orange-100 ring-2 ring-orange-400 shadow-[inset_0_0_0_1px_rgba(251,146,60,0.4)] z-20 text-orange-700 rounded-t-lg' : isYesterdayCol ? 'text-blue-600 bg-blue-50/30' : 'text-gray-500 hover:bg-gray-100/60'}`}>
                      {parseInt(day)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {desktopRows}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="md:hidden space-y-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-10 scrollbar-hide" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div className="sticky left-0 flex flex-col items-center justify-center gap-2 mb-4 w-screen">
          {todayCompletionsCount === 0 && (
             <div className="text-[10px] text-gray-500 italic mb-1">No activity logged today yet</div>
          )}
          <div className="flex justify-center gap-1.5">
            {weeksInMonth.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === selectedWeek ? "w-6 bg-gray-800" : "w-1.5 bg-gray-200"}`} />)}
          </div>
          {!hasSwiped && weeksInMonth.length > 1 && <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-pulse"><ArrowRightLeft size={10} /> Swipe to change week</div>}
        </div>
        <div className="flex w-[max-content]">
          <div className="w-screen flex-shrink-0 snap-center px-4">
             {mobileGroups}
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(Grid);