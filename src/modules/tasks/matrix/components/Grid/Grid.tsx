"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Flame, ChevronDown, ChevronRight, ChevronLeft, Check, Trash2, ArrowRightLeft, Edit2 } from 'lucide-react';
import { Task } from "../../../types/index";

import {
  parseLocalDate,
  calculateCurrentStreak,
  getLocalDate,
} from "../../utils";
import { useTheme } from "@/theme/ThemeProvider";

interface GridProps {
  tasks: Task[];
  meta: any;
  groupedTasks: Record<string, Task[]>;
  groups: string[];
  weeksInMonth: { weekLabel: string; days: (string | null)[] }[];
  visibleDays: (string | null)[];
  actualToday: string;
  todayRef: React.RefObject<HTMLTableCellElement | null>; 
  handleToggleSafe: (task: Task, dateStr: string) => void | Promise<void>;
  deleteTask: (id: string) => void | Promise<void>;
  renameTask?: (id: string, newName: string) => void | Promise<void>; 
  renameGroup?: (oldGroup: string, newGroup: string) => void | Promise<void>; 
  activeWeekIndex: number;
  showScrollHint?: boolean;
  dismissScrollHint?: () => void;
}

const Grid = ({
  tasks, meta, groupedTasks, groups, weeksInMonth, visibleDays, actualToday, 
  todayRef, handleToggleSafe, deleteTask, renameTask, renameGroup, activeWeekIndex, showScrollHint, dismissScrollHint
}: GridProps) => {
  
  const { isDarkMode } = useTheme();

  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [hasSwiped, setHasSwiped] = useState<boolean>(true); // Default true to prevent hydration flash
  
  // Edit states
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editedGroupName, setEditedGroupName] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskName, setEditedTaskName] = useState("");

  // Selection states for mobile to keep UI clean
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isSwiping = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGroups = localStorage.getItem("matrix_collapsed_groups");
      if (savedGroups) {
        try { setCollapsedGroups(new Set(JSON.parse(savedGroups))); } catch(e){}
      }
      
      const hasSeenSwipeHint = localStorage.getItem("matrix_has_swiped_week") === "true";
      setHasSwiped(hasSeenSwipeHint);
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

  const historyMap = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    tasks.forEach(t => { map[t.id] = t.history || {}; });
    return map;
  }, [tasks]);

  const getStreakStyle = (streak: number) => {
    if (streak > 0) return { bg: 'bg-orange-500', text: 'text-white', icon: 'text-orange-200' };
    return null;
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
    
    if (distance > 50 && selectedWeek < weeksInMonth.length - 1) { 
      setSelectedWeek(prev => prev + 1); 
      if (!hasSwiped) { 
        setHasSwiped(true); 
        localStorage.setItem("matrix_has_swiped_week", "true"); 
      } 
    }
    if (distance < -50 && selectedWeek > 0) { 
      setSelectedWeek(prev => prev - 1); 
      if (!hasSwiped) { 
        setHasSwiped(true); 
        localStorage.setItem("matrix_has_swiped_week", "true"); 
      } 
    }
    
    touchStartX.current = null; touchStartY.current = null; touchEndX.current = null; isSwiping.current = false;
  }, [selectedWeek, weeksInMonth.length, hasSwiped]);

  // DESKTOP ROWS
  const desktopRows = useMemo(() => {
    return groups.map(group => {
      const groupTasks = groupedTasks[group];
      if (!groupTasks || groupTasks.length === 0) return null;
      const isCollapsed = collapsedGroups.has(group);

      return (
        <React.Fragment key={group}>
          <tr className="group bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200" onClick={() => toggleGroup(group)}>
            <td className="sticky left-0 z-[40] px-6 py-3 bg-gray-100 font-bold text-[10px] text-gray-600 uppercase tracking-widest shadow-[4px_0_12px_rgba(0,0,0,0.08)] flex items-center gap-2 border-r border-gray-200">
              {isCollapsed ? <ChevronRight size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
              
              {editingGroup === group ? (
                <input
                  autoFocus
                  value={editedGroupName}
                  onChange={(e) => setEditedGroupName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => {
                    if (renameGroup && editedGroupName.trim() && editedGroupName.trim() !== group) renameGroup(group, editedGroupName.trim());
                    setEditingGroup(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (renameGroup && editedGroupName.trim() && editedGroupName.trim() !== group) renameGroup(group, editedGroupName.trim());
                      setEditingGroup(null);
                    } else if (e.key === "Escape") {
                      setEditingGroup(null);
                    }
                  }}
                  className="bg-white border border-gray-300 rounded px-2 py-0.5 text-[10px] text-gray-800 outline-none w-32 font-bold normal-case tracking-normal shadow-sm"
                />
              ) : (
                <>
                  <span>{group}</span> 
                  <span className="ml-2 px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded-full text-[8px]">{groupTasks.length}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingGroup(group);
                      setEditedGroupName(group);
                    }} 
                    className="ml-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-all duration-200 p-1"
                    title="Rename Group"
                  >
                    <Edit2 size={12} />
                  </button>
                </>
              )}
            </td>
            <td colSpan={visibleDays.length}></td>
          </tr>
          
          {!isCollapsed && groupTasks.map(task => {
            const currentStreak = calculateCurrentStreak(task.history, actualToday);
            const streakStyle = getStreakStyle(currentStreak);

            return (
              <tr key={task.id} className="group hover:bg-gray-100/60 transition-all duration-200 border-b border-gray-200 last:border-b-0">
                <td className="sticky left-0 z-[40] bg-white p-4 group-hover:bg-gray-50 transition-all duration-200 shadow-[4px_0_12px_rgba(0,0,0,0.06)] border-r border-gray-200 backdrop-blur-[2px]">
                  <div className="flex justify-between items-center gap-4 h-full">
                    
                    <div className="flex items-center gap-3 flex-wrap w-full">
                      {editingTaskId === task.id ? (
                        <input
                          autoFocus
                          value={editedTaskName}
                          onChange={(e) => setEditedTaskName(e.target.value)}
                          onBlur={() => {
                            if (renameTask && editedTaskName.trim() && editedTaskName.trim() !== task.name) renameTask(task.id, editedTaskName.trim());
                            setEditingTaskId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (renameTask && editedTaskName.trim() && editedTaskName.trim() !== task.name) renameTask(task.id, editedTaskName.trim());
                              setEditingTaskId(null);
                            } else if (e.key === "Escape") {
                              setEditingTaskId(null);
                            }
                          }}
                          className="bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm font-semibold text-gray-800 outline-none w-full max-w-[180px] shadow-sm"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 group/title">
                          <span className="font-semibold text-sm text-gray-800 transition-colors group-hover:text-black">
                            {task.name}
                          </span>
                          <button 
                            onClick={() => {
                              setEditingTaskId(task.id);
                              setEditedTaskName(task.name);
                            }} 
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-blue-500 transition-all duration-200 p-1"
                            title="Rename Task"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}

                      {streakStyle && (
                        <div title="Current streak" className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${streakStyle.bg} ${streakStyle.text} transition-all duration-300 cursor-default`}>
                          <Flame size={10} className={streakStyle.icon} /><span>{currentStreak}d</span>
                        </div>
                      )}
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
                  
                  const isFuture = dateStr > actualToday;
                  const isPast = dateStr < actualToday;
                  const isLocked = meta.lockedDates?.includes(dateStr) && dateStr !== actualToday;
                  const isDisabled = isFuture || isLocked;
                  
                  const isTodayCol = dateStr === actualToday;
                  
                  const tooltipMsg = isFuture ? "Future locked" : isPast ? "Past" : isLocked ? "Locked" : "";
                  const heatmapStyle = isDone ? 'checked:bg-orange-500 checked:border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]' : '';

                  return (
                    <td key={day} className={`text-center p-0 transition-colors duration-300 hover:bg-gray-100/60 border-gray-200 ${isTodayCol ? 'bg-orange-100 ring-2 ring-orange-400 shadow-[inset_0_0_0_1px_rgba(251,146,60,0.4)] z-10' : ''} ${isDone && !isTodayCol ? 'bg-orange-50/10' : ''}`} title={tooltipMsg}>
                      <div className="h-[72px] flex items-center justify-center touch-manipulation group/cell relative">
                        <div className="relative flex items-center justify-center w-6 h-6">
                          <input type="checkbox" checked={isDone} onChange={() => { if (!isDisabled) handleToggleSafe(task, dateStr); }} 
                            className={`peer appearance-none w-5 h-5 rounded-[6px] border-[2px] transition-transform duration-300 will-change-transform active:scale-95 ${isDisabled ? 'border-gray-200 bg-gray-50/50 cursor-not-allowed' : 'border-gray-300 hover:border-gray-400 cursor-pointer'} ${isDone && !isDisabled ? heatmapStyle : ''}`} />
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
  }, [groups, groupedTasks, visibleDays, historyMap, meta.currentMonth, meta.lockedDates, actualToday, deleteTask, renameTask, renameGroup, handleToggleSafe, collapsedGroups, editingGroup, editedGroupName, editingTaskId, editedTaskName]);

  // MOBILE ROWS
  const mobileGroups = useMemo(() => {
    return groups.map(group => {
      const groupTasks = groupedTasks[group];
      if (!groupTasks || groupTasks.length === 0) return null;
      const isCollapsed = collapsedGroups.has(group);

      return (
        <div key={group} className="space-y-4 mb-6 w-full">
          <button 
            onClick={() => {
              toggleGroup(group);
              setSelectedGroupId(prev => prev === group ? null : group);
              if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
            }} 
            className="w-full flex items-center gap-2 text-[11px] font-bold text-gray-600 uppercase tracking-widest px-2 active:opacity-70 transition-opacity"
          >
            {isCollapsed ? <ChevronRight size={14}/> : <ChevronDown size={14}/>} 
            {editingGroup === group ? (
              <input
                autoFocus
                value={editedGroupName}
                onChange={(e) => setEditedGroupName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={() => {
                  if (renameGroup && editedGroupName.trim() && editedGroupName.trim() !== group) renameGroup(group, editedGroupName.trim());
                  setEditingGroup(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (renameGroup && editedGroupName.trim() && editedGroupName.trim() !== group) renameGroup(group, editedGroupName.trim());
                    setEditingGroup(null);
                  } else if (e.key === "Escape") {
                    setEditingGroup(null);
                  }
                }}
                className="bg-white border border-gray-300 rounded px-2 py-0.5 text-[10px] text-gray-800 outline-none w-28 font-bold normal-case tracking-normal shadow-sm"
              />
            ) : (
              <>
                <span>{group}</span>
                {selectedGroupId === group && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingGroup(group);
                      setEditedGroupName(group);
                      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
                    }}
                    className="p-1.5 ml-auto text-gray-500 hover:text-blue-500 bg-white rounded-md shadow-sm border border-gray-200 animate-in fade-in zoom-in duration-200"
                  >
                    <Edit2 size={12} />
                  </div>
                )}
              </>
            )}
          </button>
          
          {!isCollapsed && weeksInMonth.map((week, wIndex) => {
            if (selectedWeek !== wIndex) return null;

            return (
              <div key={week.weekLabel} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
                
                {/* Mobile Days Header */}
                <div className="grid grid-cols-7 gap-2 px-1 mb-4 pb-3 border-b border-gray-100">
                  {week.days.map((day, i) => {
                    if (!day) return <div key={i} className="flex-shrink-0" />;
                    const isToday = `${meta.currentMonth}-${day}` === actualToday;
                    return (
                      <div key={day} className="flex flex-col items-center justify-center text-center">
                        <span className={`text-[9px] font-bold mb-0.5 ${isToday ? "text-orange-700" : "text-gray-400"}`}>
                          {['M','T','W','T','F','S','S'][i]}
                        </span>
                        <span className={`text-[12px] font-bold ${isToday ? "text-orange-700" : "text-gray-800"}`}>
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-0">
                  {groupTasks.map(task => {
                    return (
                      <div 
                        key={task.id} 
                        onClick={() => setSelectedTaskId(prev => prev === task.id ? null : task.id)}
                        className="py-3 border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <div className="flex justify-between items-center gap-2 mb-3 px-1">
                          
                          {editingTaskId === task.id ? (
                            <input
                              autoFocus
                              value={editedTaskName}
                              onChange={(e) => setEditedTaskName(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onBlur={() => {
                                if (renameTask && editedTaskName.trim() && editedTaskName.trim() !== task.name) renameTask(task.id, editedTaskName.trim());
                                setEditingTaskId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (renameTask && editedTaskName.trim() && editedTaskName.trim() !== task.name) renameTask(task.id, editedTaskName.trim());
                                  setEditingTaskId(null);
                                } else if (e.key === "Escape") {
                                  setEditingTaskId(null);
                                }
                              }}
                              className="bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm font-semibold text-gray-800 outline-none w-full max-w-[150px]"
                            />
                          ) : (
                            <div className="text-sm font-semibold text-gray-800 leading-tight">
                              {task.name}
                            </div>
                          )}

                          {selectedTaskId === task.id && (
                            <div className="flex items-center shrink-0 gap-1 animate-in fade-in zoom-in duration-200">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTaskId(task.id);
                                  setEditedTaskName(task.name);
                                  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
                                }} 
                                className="text-gray-500 hover:text-blue-500 p-1.5 bg-white rounded-md shadow-sm border border-gray-200"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTask(task.id);
                                  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                                }} 
                                title="Delete task" 
                                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors bg-white rounded-md shadow-sm border border-gray-200"
                              >
                                <Trash2 size={16}/>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Explicitly stop propagation so clicking checkboxes doesn't affect selection state */}
                        <div 
                          className="grid grid-cols-7 gap-2 px-1 relative w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {week.days.map((day, i) => {
                            if (!day) return <div key={i} className="flex-shrink-0" />;
                            const dateStr = `${meta.currentMonth}-${day}`;
                            const isDone = !!historyMap[task.id]?.[dateStr];
                            
                            const isFuture = dateStr > actualToday;
                            const isLocked = meta.lockedDates?.includes(dateStr) && dateStr !== actualToday;
                            const isDisabled = isFuture || isLocked;
                            
                            const isToday = dateStr === actualToday;
                            const heatmapBg = isDone ? 'checked:bg-orange-500 checked:border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-gray-50';

                            return (
                              <div key={day} className={`relative flex items-center justify-center py-1 rounded-xl flex-shrink-0 touch-manipulation transition-colors duration-300 ${isToday ? "bg-orange-50 shadow-[inset_0_0_0_1px_rgba(251,146,60,0.4)]" : "border border-transparent"}`}>
                                <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 z-10">
                                  <input type="checkbox" checked={isDone} onChange={() => { if (!isDisabled) handleToggleSafe(task, dateStr); }} 
                                    className={`peer appearance-none w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-[12px] border-[2px] transition-transform duration-300 will-change-transform active:scale-95 ${heatmapBg} ${isDisabled ? "border-gray-200 opacity-50 grayscale cursor-not-allowed" : "border-gray-300 cursor-pointer"}`} />
                                  <Check size={16} strokeWidth={4} className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all duration-300" />
                                </div>
                              </div>
                            );
                          })}
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
    });
  }, [groups, groupedTasks, weeksInMonth, selectedWeek, historyMap, meta.currentMonth, meta.lockedDates, actualToday, deleteTask, renameTask, renameGroup, handleToggleSafe, collapsedGroups, editingGroup, editedGroupName, editingTaskId, editedTaskName, selectedTaskId, selectedGroupId]);

  return (
    <>
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-200 overflow-hidden relative z-10 min-h-[400px] hidden md:flex flex-col">
        
        <div className={`absolute top-0 right-0 bottom-0 w-12 pointer-events-none z-30 ${
          isDarkMode 
            ? "bg-gradient-to-l from-black via-black/80 to-transparent" 
            : "bg-gradient-to-l from-white via-white/80 to-transparent"
        }`}></div>

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
                {weeksInMonth.map((week) => (
                  <th key={week.weekLabel} colSpan={7} className="text-center text-[10px] font-bold uppercase tracking-widest p-3 text-gray-600 border-gray-200">
                    {week.weekLabel}
                  </th>
                ))}
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
                  return (
                    <th key={day} ref={isTodayCol ? todayRef : null} className={`border-b border-gray-200 p-3 text-[11px] font-bold text-center min-w-[50px] transition-all duration-200 ${isTodayCol ? 'bg-orange-100 ring-2 ring-orange-400 shadow-[inset_0_0_0_1px_rgba(251,146,60,0.4)] z-20 text-orange-700 rounded-t-lg' : 'text-gray-500 hover:bg-gray-100/60'}`}>
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
      
      <div className="md:hidden w-full relative" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        
        {/* Sticky Mobile Header */}
        <div className="sticky top-0 z-[70] bg-white/95 backdrop-blur-xl pt-3 pb-3 px-4 flex flex-col items-center gap-3 border-b border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] w-full transition-all">
          
          {!hasSwiped && weeksInMonth.length > 1 && (
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-white bg-gray-900 px-3 py-1.5 rounded-full uppercase tracking-widest animate-pulse shadow-md mb-1">
              <ArrowRightLeft size={10} /> Swipe to change week
            </div>
          )}

          <div className="flex items-center justify-between w-full max-w-[200px]">
            <button 
              onClick={() => setSelectedWeek(p => Math.max(0, p - 1))} 
              className="p-1.5 text-gray-400 hover:text-gray-800 disabled:opacity-30 transition-colors" 
              disabled={selectedWeek === 0}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-[13px] font-bold text-gray-800 tracking-wide">
              Week {selectedWeek + 1}
            </span>
            <button 
              onClick={() => setSelectedWeek(p => Math.min(weeksInMonth.length - 1, p + 1))} 
              className="p-1.5 text-gray-400 hover:text-gray-800 disabled:opacity-30 transition-colors" 
              disabled={selectedWeek === weeksInMonth.length - 1}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-1">
            {weeksInMonth.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedWeek(i)}
                className={`px-3.5 py-1 rounded-full text-[10px] font-bold transition-all duration-300 ${i === selectedWeek ? "bg-gray-800 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >
                W{i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Content Container */}
        <div className="px-4 w-full py-6 space-y-6">
           {mobileGroups}
        </div>
        
      </div>
    </>
  );
};

export default React.memo(Grid);