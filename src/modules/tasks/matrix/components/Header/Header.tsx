"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Lock, Loader2, Plus, 
  ChevronDown, X, Check
} from 'lucide-react';
import { useTheme } from "@/theme/ThemeProvider";

interface HeaderProps {
  userId: string;
  userLockedDates: string[];
  selectedMonth?: string;
  todayDataLength: number;
  yesterdayDataLength: number;
  tasksLength: number;
  existingTaskNames: string[];
  setMonthYear: (value: string) => void;
  addTask: (name: string, group: string) => Promise<void> | void; 
  showError: (msg: string) => void;
  showSuccess?: (msg: string) => void; 
  lockToday: (userId: string) => void;
  actualToday: string;
}

const getLocalMonth = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

const formatMonthDisplay = (monthStr: string) => {
  try {
    const [y, m] = monthStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1);
    return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return monthStr;
  }
};

// Unified Status & Color Engine
const getStatusIntelligence = (tasksLength: number, completed: number, percentage: number) => {
  if (tasksLength === 0) return { text: "Setup Required", colorClass: "text-gray-500", bgClass: "bg-gray-300 dark:bg-gray-800" };
  if (completed === 0) return { text: "Inactive", colorClass: "text-gray-500", bgClass: "bg-gray-300 dark:bg-gray-800" };
  if (percentage <= 30) return { text: "Low Momentum", colorClass: "text-red-500", bgClass: "bg-red-500" };
  if (percentage <= 70) return { text: "Building Momentum", colorClass: "text-orange-500", bgClass: "bg-orange-500" };
  if (percentage <= 99) return { text: "Strong Momentum", colorClass: "text-blue-500", bgClass: "bg-blue-500" };
  return { text: "Perfect Execution", colorClass: "text-emerald-500", bgClass: "bg-emerald-500" };
};

export default function Header({
  userId, userLockedDates, selectedMonth: initialMonth,
  todayDataLength, yesterdayDataLength, tasksLength, 
  setMonthYear, addTask, showError, showSuccess, lockToday, actualToday, existingTaskNames
}: HeaderProps) {
  const { isDarkMode } = useTheme();
  
  const [taskName, setTaskName] = useState('');
  const [taskGroup, setTaskGroup] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const taskInputRef = useRef<HTMLInputElement>(null);

  const isLocked = userLockedDates?.includes(actualToday);
  const todayMonth = getLocalMonth();
  const selectedMonth = initialMonth || todayMonth;

  useEffect(() => {
    if (!initialMonth) setMonthYear(todayMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape key and scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setShowLockModal(false);
      }
    };

    if (showLockModal || showAddModal) {
      document.body.style.overflow = "hidden";
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    
    return () => { 
      document.body.style.overflow = ""; 
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLockModal, showAddModal]);

  useEffect(() => {
    if (showAddModal) {
      setTimeout(() => taskInputRef.current?.focus(), 100);
    }
  }, [showAddModal]);

  const handleAdd = async () => {
    const trimmedName = taskName.trim();
    if (!trimmedName) return showError("Objective name required");
    
    if (existingTaskNames.some(t => t.toLowerCase() === trimmedName.toLowerCase())) {
      return showError("Objective already exists");
    }

    setIsAdding(true);
    try {
      await addTask(trimmedName, taskGroup.trim() || 'General');
      setTaskName('');
      setTaskGroup('');
      setShowAddModal(false);
    } finally {
      setIsAdding(false);
    }
  };

  const confirmLock = () => {
    lockToday(userId);
    setShowLockModal(false);
    if (showSuccess) showSuccess("Day finalized successfully");
  };

  const progressPercentage = tasksLength ? Math.round((todayDataLength / tasksLength) * 100) : 0;
  const status = getStatusIntelligence(tasksLength, todayDataLength, progressPercentage);
  const isPerfect = progressPercentage === 100 && tasksLength > 0;

  // Real Liquid Morphism Classes (OLED Black in Dark Mode)
  const liquidModalClass = isDarkMode 
    ? "bg-gradient-to-b from-white/[0.05] to-white/[0.015] backdrop-blur-[50px] saturate-[180%] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_32px_rgba(0,0,0,0.25)] border-none" 
    : "bg-white/80 backdrop-blur-[50px] saturate-[150%] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_32px_rgba(0,0,0,0.08)] border-none";

  const liquidHeaderClass = isDarkMode 
    ? "bg-gradient-to-b from-white/[0.05] to-white/[0.015] backdrop-blur-[50px] saturate-[180%] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_32px_rgba(0,0,0,0.25)] border-none" 
    : "bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-[50px] saturate-[150%] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_32px_rgba(0,0,0,0.06)] border-none";

  return (
    <>
      {/* 1. DEEP BLUR LOCK MODAL */}
      {showLockModal && (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-[50px] saturate-[180%] px-4 animate-in fade-in duration-300 ${
          isDarkMode ? "bg-black/80" : "bg-black/20"
        }`}>
          <div className={`rounded-[24px] p-8 max-w-[400px] w-full animate-in zoom-in-95 duration-300 ${liquidModalClass}`}>
            <h3 className={`text-xl font-medium mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {isPerfect ? "Complete Day" : "Finalize Today"}
            </h3>
            <p className={`text-sm font-normal mb-6 ${isPerfect ? "text-emerald-500" : "text-red-500"}`}>
              This action cannot be undone.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm font-normal">
                <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Total Objectives</span>
                <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{tasksLength}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-normal">
                <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Completed</span>
                <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{todayDataLength}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2">
                <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Final Score</span>
                <span className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{progressPercentage}%</span>
              </div>
            </div>

            <div className="flex gap-4 justify-end items-center">
              <button 
                onClick={() => setShowLockModal(false)}
                className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                  isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Cancel
              </button>
              <button 
                onClick={confirmLock}
                className={`px-6 py-2.5 text-sm font-medium rounded-full shadow-lg transition-all active:scale-95 hover:opacity-90 text-white ${
                  isPerfect ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {isPerfect ? "Complete" : "Finalize"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. GLASS SHEET ADD MODAL */}
      {showAddModal && (
        <div className={`fixed inset-0 z-[9990] flex items-center justify-center backdrop-blur-[50px] saturate-[180%] px-4 animate-in fade-in duration-300 ${
          isDarkMode ? "bg-black/80" : "bg-black/20"
        }`}>
          <div className={`rounded-[24px] p-6 max-w-[560px] w-full animate-in slide-in-from-bottom-8 duration-300 ${liquidModalClass}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>New Objective</h3>
              <button onClick={() => setShowAddModal(false)} className={`transition-colors ${
                isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
              }`}>
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col mb-8">
              <input 
                ref={taskInputRef}
                type="text" 
                value={taskName} 
                onChange={(e) => setTaskName(e.target.value)} 
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                disabled={isAdding}
                placeholder="What outcome do you want?" 
                className={`w-full bg-transparent border-none outline-none text-xl font-normal disabled:opacity-50 transition-colors pb-4 ${
                  isDarkMode ? "text-white placeholder:text-gray-600" : "text-gray-900 placeholder:text-gray-400"
                }`}
                autoFocus
              />
              
              <hr className={`border-t mb-4 transition-colors ${isDarkMode ? "border-white/10" : "border-gray-200"}`} />
              
              <input 
                type="text" 
                value={taskGroup} 
                onChange={(e) => setTaskGroup(e.target.value)} 
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                disabled={isAdding}
                placeholder="Area (optional)" 
                className={`w-full bg-transparent border-none outline-none text-sm font-normal disabled:opacity-50 transition-colors ${
                  isDarkMode ? "text-gray-400 placeholder:text-gray-600" : "text-gray-600 placeholder:text-gray-400"
                }`} 
              />
            </div>

            <div className="flex gap-3 justify-end items-center">
              <button 
                onClick={() => setShowAddModal(false)}
                className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                  isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Cancel
              </button>
              <button 
                onClick={handleAdd} 
                disabled={isAdding || !taskName.trim()}
                className="px-6 py-2.5 text-sm font-medium rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-30 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isAdding && <Loader2 size={16} className="animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. PURE LIQUID WORKSPACE HEADER */}
      <div className="max-w-[1400px] w-full mx-auto px-4 md:px-8 pt-6 pb-2 z-40 relative">
        <div className={`rounded-[24px] p-6 flex flex-col gap-5 transition-colors duration-300 ${liquidHeaderClass}`}>
          
          {/* Level 1 & 2: Score and Status */}
          <div className="flex flex-col">
            <h1 className={`text-2xl md:text-3xl font-medium tracking-tight transition-colors ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              {progressPercentage}% Complete
            </h1>
            <div className="text-sm font-medium mt-1 transition-colors">
              <span className={status.colorClass}>
                Status: {status.text}
              </span>
            </div>
          </div>

          {/* Liquid Progress Bar */}
          <div className={`h-1.5 w-full rounded-full overflow-hidden transition-colors ${
            isDarkMode ? "bg-gray-800/50" : "bg-gray-200"
          }`}>
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${status.bgClass}`}
              style={{ width: `${progressPercentage}%` }} 
            />
          </div>

          {/* Level 3: Metrics & Actions (Stacked on Mobile, Spaced on Desktop) */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            
            {/* Left: Aligned Typography Metrics */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5 text-[13px]">
                <div className="flex items-center justify-between w-[120px]">
                  <span className={`transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Today</span>
                  <span className={`font-medium transition-colors ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                    {todayDataLength}/{tasksLength}
                  </span>
                </div>
                <div className="flex items-center justify-between w-[120px]">
                  <span className={`transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Yesterday</span>
                  <span className={`font-medium transition-colors ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                    {yesterdayDataLength}/{tasksLength}
                  </span>
                </div>
              </div>
              
              <div className={`relative inline-flex items-center gap-1.5 text-[13px] font-medium hover:opacity-70 cursor-pointer transition-opacity w-fit ${
                isDarkMode ? "text-gray-200" : "text-gray-900"
              }`}>
                {formatMonthDisplay(selectedMonth)} <ChevronDown size={14} className="opacity-50" />
                <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={(e) => setMonthYear(e.target.value)} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Right: Actions (Stacked Vertically on Desktop & Mobile) */}
            <div className="flex flex-col items-center md:items-end gap-3 md:gap-2 w-full md:w-auto mt-4 md:mt-0">
              
              {!isLocked && (
                <button 
                  onClick={() => setShowAddModal(true)} 
                  className="w-full md:w-auto flex justify-center items-center gap-2 px-6 h-[44px] md:h-[40px] text-sm font-medium rounded-full transition-colors bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                >
                  <Plus size={16} /> 
                  <span className="md:hidden">Add</span>
                  <span className="hidden md:inline">Add Objective</span>
                </button>
              )}
              
              {!isLocked && tasksLength > 0 && (
                <button 
                  onClick={() => setShowLockModal(true)} 
                  className={`w-fit md:w-auto flex justify-center items-center gap-1.5 px-4 h-[36px] md:h-[40px] text-[13px] md:text-sm font-medium transition-all hover:scale-[0.98]
                    ${isPerfect 
                      ? "text-emerald-500 md:text-white md:bg-emerald-500 md:hover:bg-emerald-600 md:rounded-full md:shadow-sm" 
                      : "text-red-500 md:text-white md:bg-red-500 md:hover:bg-red-600 md:rounded-full md:shadow-sm"
                    }
                  `}
                >
                  {/* Visual Checkmark for smaller footprint */}
                  <Check size={14} className="md:w-4 md:h-4" /> 
                  <span className="md:hidden">{isPerfect ? "Complete" : "Finalize"}</span>
                  <span className="hidden md:inline">{isPerfect ? "Complete Day" : "Finalize Day"}</span>
                </button>
              )}
              
              {isLocked && (
                <div className="w-fit md:w-auto flex justify-center items-center gap-2 px-4 h-[36px] md:h-[40px] text-[13px] md:text-sm font-medium rounded-full transition-colors bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check size={16} /> 
                  <span className="md:hidden">Finalized</span>
                  <span className="hidden md:inline">Day Finalized</span>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}