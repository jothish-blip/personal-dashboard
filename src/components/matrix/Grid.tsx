"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { X, Flame, Zap, Star } from 'lucide-react';
import { Task } from '../../types';
import { parseLocalDate, calculateCurrentStreak } from './utils';

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
}

const Grid = ({
  tasks, meta, groupedTasks, groups, weeksInMonth, visibleDays, actualToday, 
  todayRef, handleToggleSafe, deleteTask, activeWeekIndex
}: GridProps) => {
  
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  
  // 🔴 FIX 2: Touch state moved to useRef to prevent 60fps re-renders on swipe
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isSwiping = useRef(false);

  useEffect(() => {
    if (activeWeekIndex !== -1) setSelectedWeek(activeWeekIndex);
  }, [activeWeekIndex]);

  const todayDateObj = useMemo(() => parseLocalDate(actualToday), [actualToday]);

  const historyMap = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    tasks.forEach(t => {
      map[t.id] = t.history || {};
    });
    return map;
  }, [tasks]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchEndX.current = null; 
    isSwiping.current = false;
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const diffX = Math.abs(currentX - touchStartX.current);
    const diffY = Math.abs(currentY - touchStartY.current);
    
    if (diffX > diffY && diffX > 10) {
      isSwiping.current = true;
      touchEndX.current = currentX;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping.current || touchStartX.current === null || touchEndX.current === null) return;
    
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50 && selectedWeek < weeksInMonth.length - 1) setSelectedWeek(prev => prev + 1);
    if (distance < -50 && selectedWeek > 0) setSelectedWeek(prev => prev - 1);
    
    touchStartX.current = null; 
    touchStartY.current = null; 
    touchEndX.current = null; 
    isSwiping.current = false;
  }, [selectedWeek, weeksInMonth.length]);

  // 🔴 FIX 4: Memoize Desktop Rows to prevent deep re-calculations
  const desktopRows = useMemo(() => {
    return groups.map(group => {
      const groupTasks = groupedTasks[group];
      if (!groupTasks || groupTasks.length === 0) return null;
      return (
        <React.Fragment key={group}>
          <tr className="bg-gray-50">
            <td className="sticky left-0 z-40 px-6 py-2 border-b border-r border-gray-200 bg-gray-50 font-bold text-[9px] text-gray-500 uppercase tracking-widest">{group}</td>
            <td colSpan={visibleDays.length} className="border-b border-gray-200"></td>
          </tr>
          {groupTasks.map(task => {
            const currentStreak = calculateCurrentStreak(task.history, actualToday);
            const isElite = currentStreak >= 7;
            const isGood = currentStreak >= 3 && currentStreak < 7;
            
            const isAtRisk = !historyMap[task.id]?.[actualToday] && currentStreak > 0;
            const validPastDays = visibleDays.filter(d => d && parseLocalDate(`${meta.currentMonth}-${d}`) <= todayDateObj);
            const donePastDays = validPastDays.filter(d => historyMap[task.id]?.[`${meta.currentMonth}-${d}`]);
            const isPerfectWeek = validPastDays.length > 0 && donePastDays.length === validPastDays.length;

            return (
              <tr key={task.id} className="group hover:bg-gray-100 transition-colors">
                <td className="sticky left-0 z-40 bg-white border-b border-r border-gray-200 p-4 group-hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800 text-sm">{task.name}</span>
                        {currentStreak > 0 && (
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${isElite ? 'bg-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.5)]' : isGood ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            <Flame size={10} />
                            <span>{currentStreak}d</span>
                          </div>
                        )}
                        {isAtRisk && <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest">risk</span>}
                        {isPerfectWeek && <Zap size={12} className="text-green-500" fill="currentColor" />}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {weeksInMonth.map((week, i) => {
                          let doneCount = 0, validD = 0;
                          week.days.forEach(day => {
                            if (!day) return;
                            validD++;
                            if (historyMap[task.id]?.[`${meta.currentMonth}-${day}`]) doneCount++;
                          });
                          const isPerfect = doneCount === validD && validD > 0;
                          return (
                            <div key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border ${isPerfect ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                              {week.weekLabel}: {doneCount}/{validD}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* 🔴 FIX 3: Removed double window.confirm */}
                    <button 
                      onClick={() => deleteTask(task.id)} 
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 p-1 transition-opacity"
                    >
                      <X size={16}/>
                    </button>
                  </div>
                </td>
                {visibleDays.map((day, i) => {
                  if (!day) return <td key={`pad-box-${i}`} className="border-b border-r border-gray-50 bg-gray-50/50" />;
                  const dateStr = `${meta.currentMonth}-${day}`;
                  
                  const isDone = !!historyMap[task.id]?.[dateStr];
                  const selected = parseLocalDate(dateStr);
                  const isFuture = selected > todayDateObj;
                  const isPast = selected < todayDateObj;
                  const isLocked = meta.lockedDates?.includes(dateStr);
                  const isDisabled = isFuture || isPast || isLocked;
                  const tooltipMsg = isFuture ? "Future date locked" : isPast ? "Past date locked" : isLocked ? "Day is saved & locked" : "";

                  return (
                    <td key={day} className={`text-center border-b border-r border-gray-50 p-0 ${dateStr === actualToday ? 'bg-orange-50/30' : ''}`} title={tooltipMsg}>
                      <div className="h-14 flex items-center justify-center touch-manipulation">
                        <input 
                          type="checkbox" 
                          checked={isDone} 
                          onChange={() => { if (!isDisabled) handleToggleSafe(task, dateStr); }} 
                          // 🔴 FIX 5: Added will-change-transform
                          className={`w-5 h-5 rounded border-gray-300 transition-all duration-150 will-change-transform active:scale-90 accent-green-600 ${isDone ? 'opacity-80' : 'hover:scale-110'} ${isDisabled ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'} ${isElite && isDone ? 'shadow-[0_0_10px_rgba(249,115,22,0.4)]' : ''}`} 
                        />
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
  }, [groups, groupedTasks, visibleDays, historyMap, meta.currentMonth, meta.lockedDates, actualToday, todayDateObj, weeksInMonth, deleteTask, handleToggleSafe]);

  // 🔴 FIX 4: Memoize Mobile Groups
  const mobileGroups = useMemo(() => {
    return groups.map(group => {
      const groupTasks = groupedTasks[group];
      if (!groupTasks || groupTasks.length === 0) return null;

      return (
        <div key={group} className="space-y-4">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-2">{group}</div>
          {weeksInMonth.map((week, wIndex) => {
            const isActiveWeek = selectedWeek === wIndex;
            if (!isActiveWeek) return null;

            const weekValidDays = week.days.filter(Boolean).length;
            const totalWeekTasks = groupTasks.length * weekValidDays;
            let completedWeekTasks = 0;
            groupTasks.forEach(t => {
              week.days.forEach(d => {
                if (d && historyMap[t.id]?.[`${meta.currentMonth}-${d}`]) completedWeekTasks++;
              });
            });
            const progressPct = totalWeekTasks === 0 ? 0 : (completedWeekTasks / totalWeekTasks) * 100;
            const isPerfectGroupWeek = progressPct === 100 && totalWeekTasks > 0;

            return (
              <div key={week.weekLabel} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-5 shadow-sm relative">
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                      {week.weekLabel}
                      {isPerfectGroupWeek && (
                        <span className="flex items-center gap-1 text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200 animate-in zoom-in">
                          <Star size={10} fill="currentColor" /> Perfect
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-gray-400">{progressPct.toFixed(0)}%</div>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${isPerfectGroupWeek ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                {groupTasks.map(task => (
                  <div key={task.id} className="space-y-3 pb-2">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-semibold text-gray-800">{task.name}</div>
                      {/* 🔴 FIX 3: Removed double window.confirm */}
                      <button 
                        onClick={() => deleteTask(task.id)} 
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <X size={14}/>
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 relative">
                      {week.days.map((day, i) => {
                        if (!day) return <div key={i} className="flex-shrink-0" />;
                        const dateStr = `${meta.currentMonth}-${day}`;
                        
                        const isDone = !!historyMap[task.id]?.[dateStr];
                        const selected = parseLocalDate(dateStr);
                        const isFuture = selected > todayDateObj;
                        const isPast = selected < todayDateObj;
                        const isLocked = meta.lockedDates?.includes(dateStr);
                        const isDisabled = isFuture || isPast || isLocked;
                        const isToday = dateStr === actualToday;
                        const tooltipMsg = isFuture ? "Future locked" : isPast ? "Past locked" : isLocked ? "Saved" : "";
                        const prevDayStr = i > 0 && week.days[i-1] ? `${meta.currentMonth}-${week.days[i-1]}` : null;
                        const isPrevDone = prevDayStr && !!historyMap[task.id]?.[prevDayStr];
                        
                        const cStreak = calculateCurrentStreak(task.history, dateStr);
                        const isEliteStreak = cStreak >= 7;
                        const heatmapAccent = isEliteStreak ? 'accent-orange-500' : 'accent-green-500';
                        const heatmapBg = isDone ? (isEliteStreak ? 'bg-orange-50' : 'bg-green-50') : 'bg-transparent';
                        const glowClass = isDone && isEliteStreak ? 'shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse' : '';

                        return (
                          <div key={day} className={`relative flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl flex-shrink-0 touch-manipulation ${heatmapBg} ${isToday ? "bg-orange-100 border border-orange-300" : "border border-transparent"}`} title={tooltipMsg}>
                            {isDone && isPrevDone && <div className={`absolute top-[50%] left-[-50%] w-[100%] h-[2px] z-0 pointer-events-none ${isEliteStreak ? 'bg-orange-300' : 'bg-green-300'}`} />}
                            <span className={`text-[9px] font-bold z-10 pointer-events-none ${isToday ? "text-orange-600" : isDone ? "text-gray-600" : "text-gray-400"}`}>
                              {['M','T','W','T','F','S','S'][i]}
                            </span>
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => { if (!isDisabled) handleToggleSafe(task, dateStr); }} 
                              // 🔴 FIX 5: Added will-change-transform
                              className={`w-6 h-6 rounded-md z-10 transition-transform duration-150 will-change-transform active:scale-90 ${heatmapAccent} ${glowClass} ${isDisabled ? "opacity-30 grayscale cursor-not-allowed" : "cursor-pointer"}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      );
    });
  }, [groups, groupedTasks, weeksInMonth, selectedWeek, historyMap, meta.currentMonth, meta.lockedDates, actualToday, todayDateObj, deleteTask, handleToggleSafe]);

  return (
    <>
      {/* DESKTOP TABLE */}
      <div className="bg-white border border-gray-200 rounded-[20px] overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="sticky left-0 z-50 bg-gray-50 border-r border-gray-200 p-2 text-center align-middle"></th>
                {weeksInMonth.map((week) => (
                  <th key={week.weekLabel} colSpan={7} className="text-center text-[10px] font-bold uppercase tracking-widest border-r border-gray-200 p-2 text-gray-500">
                    {week.weekLabel}
                  </th>
                ))}
              </tr>
              <tr className="bg-white">
                <th className="sticky left-0 z-50 bg-white border-b border-r border-gray-200 p-2 min-w-[340px]"></th>
                {visibleDays.map((_, i) => (
                  <th key={`dayname-${i}`} className="border-b border-r border-gray-200 p-2 text-[9px] font-bold text-gray-500 text-center uppercase tracking-widest">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i % 7]}
                  </th>
                ))}
              </tr>
              <tr className="bg-white">
                <th className="sticky left-0 z-50 bg-white border-b border-r border-gray-200 p-6 min-w-[340px]">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Objective Stream</span>
                </th>
                {visibleDays.map((day, i) => {
                  if (!day) return <th key={`pad-${i}`} className="border-b border-r border-gray-100 bg-gray-50/50"></th>;
                  const dateStr = `${meta.currentMonth}-${day}`;
                  const isTodayCol = dateStr === actualToday;
                  return (
                    <th key={day} ref={isTodayCol ? todayRef : null} className={`border-b border-r border-gray-100 p-3 text-[10px] font-bold text-center min-w-[50px] ${isTodayCol ? 'bg-orange-500 text-white z-10' : 'text-gray-400'}`}>
                      {parseInt(day)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            {/* 🔴 FIX 4: Render memoized desktop rows */}
            <tbody>
              {desktopRows}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* MOBILE VIEW */}
      <div className="md:hidden space-y-6 overflow-hidden" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div className="flex justify-center gap-1.5 mb-2">
          {weeksInMonth.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === selectedWeek ? "w-5 bg-orange-500" : "w-1.5 bg-gray-300"}`} />
          ))}
        </div>
        {/* 🔴 FIX 4: Render memoized mobile groups */}
        {mobileGroups}
      </div>
    </>
  );
};

// 🔴 FIX 1: Component is now memoized
export default React.memo(Grid);