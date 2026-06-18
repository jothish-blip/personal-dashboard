"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Plus, ChevronDown, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  if (tasksLength === 0) return { text: "Setup Required", colorClass: "text-slate-500", bgClass: "bg-slate-200 dark:bg-slate-800" };
  if (completed === 0) return { text: "Inactive", colorClass: "text-slate-500", bgClass: "bg-slate-200 dark:bg-slate-800" };
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
  
  const [mounted, setMounted] = useState(false);
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
    setMounted(true);
    if (!initialMonth) setMonthYear(todayMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape key and strict scroll/touch lock (document.documentElement handles desktop scroll)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setShowLockModal(false);
      }
    };

    if (showLockModal || showAddModal) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      document.documentElement.style.overflow = "hidden";
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.documentElement.style.overflow = "";
    }
    
    return () => { 
      document.body.style.overflow = ""; 
      document.body.style.touchAction = "";
      document.documentElement.style.overflow = "";
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

  // Solid, clean surfacing (Pure black in Dark Mode)
  const surfaceClass = isDarkMode 
    ? "bg-black border-white/[0.08]" 
    : "bg-white border-black/[0.05]";
    
  const modalSurfaceClass = isDarkMode 
    ? "bg-black border border-white/[0.08] shadow-2xl" 
    : "bg-white border border-black/[0.05] shadow-xl";

  const modalVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <>
      {/* 1. PORTAL: CLEAN LOCK MODAL */}
      {mounted && createPortal(
        <AnimatePresence>
          {showLockModal && (
            <motion.div 
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              onClick={() => setShowLockModal(false)}
              className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md"
            >
              <motion.div 
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className={`rounded-2xl p-6 max-w-[420px] w-full ${modalSurfaceClass}`}
              >
                <h3 className={`text-lg font-semibold mb-1 tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {isPerfect ? "Complete Day" : "Finalize Today"}
                </h3>
                <p className={`text-sm mb-6 ${isPerfect ? "text-emerald-500" : "text-blue-500"}`}>
                  This action cannot be undone.
                </p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Total Objectives</span>
                    <span className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{tasksLength}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Completed</span>
                    <span className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{todayDataLength}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Final Score</span>
                    <span className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{progressPercentage}%</span>
                  </div>
                </div>

                <div className="flex gap-3 justify-end items-center">
                  <button 
                    onClick={() => setShowLockModal(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isDarkMode ? "text-slate-300 hover:bg-white/[0.06]" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmLock}
                    className={`px-5 py-2 text-sm font-medium rounded-lg transition-all active:scale-95 text-white ${
                      isPerfect ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isPerfect ? "Complete" : "Finalize"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 2. PORTAL: CLEAN ADD MODAL */}
      {mounted && createPortal(
        <AnimatePresence>
          {showAddModal && (
            <motion.div 
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 z-[9990] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md"
            >
              <motion.div 
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className={`rounded-2xl p-6 max-w-[520px] w-full ${modalSurfaceClass}`}
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className={`text-lg font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    New Objective
                  </h3>
                  <button onClick={() => setShowAddModal(false)} className={`p-1 rounded-md transition-colors ${
                    isDarkMode ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  }`}>
                    <X size={18} />
                  </button>
                </div>
                
                <div className="flex flex-col mb-6">
                  <input 
                    ref={taskInputRef}
                    type="text" 
                    value={taskName} 
                    onChange={(e) => setTaskName(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                    disabled={isAdding}
                    placeholder="What outcome do you want?" 
                    className={`w-full bg-transparent border-none outline-none text-[17px] font-medium disabled:opacity-50 transition-colors pb-3 ${
                      isDarkMode ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"
                    }`}
                  />
                  
                  <div className={`h-[1px] w-full mb-3 ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`} />
                  
                  <input 
                    type="text" 
                    value={taskGroup} 
                    onChange={(e) => setTaskGroup(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                    disabled={isAdding}
                    placeholder="Area (optional)" 
                    className={`w-full bg-transparent border-none outline-none text-sm font-medium disabled:opacity-50 transition-colors ${
                      isDarkMode ? "text-slate-300 placeholder:text-slate-600" : "text-slate-700 placeholder:text-slate-400"
                    }`} 
                  />
                </div>

                <div className="flex gap-2 justify-end items-center">
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isDarkMode ? "text-slate-300 hover:bg-white/[0.06]" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAdd} 
                    disabled={isAdding || !taskName.trim()}
                    className="px-5 py-2 text-sm font-medium rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isAdding && <Loader2 size={16} className="animate-spin" />}
                    Create
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 3. HIGH-DENSITY WORKSPACE HEADER */}
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 pt-6 pb-2 z-40 relative">
        <div className={`rounded-2xl border p-6 md:p-8 flex flex-col gap-6 ${surfaceClass}`}>
          
          {/* Level 1: Score and Status */}
          <div className="flex flex-col gap-1">
            <h1 className={`text-4xl md:text-5xl font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {progressPercentage}%
            </h1>
            <div className={`text-[15px] font-medium tracking-wide mt-1 ${status.colorClass}`}>
              {status.text}
            </div>
          </div>

          {/* Progress Bar */}
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-white/[0.06]" : "bg-black/[0.04]"}`}>
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${status.bgClass}`}
              style={{ width: `${progressPercentage}%` }} 
            />
          </div>

          {/* Level 3: Metrics & Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pt-2">
            
            {/* Left: Metrics */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1.5 text-[13px]">
                <div className="flex items-center justify-between w-[160px]">
                  <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Today</span>
                  <span className={`font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                    {todayDataLength} / {tasksLength}
                  </span>
                </div>
                <div className="flex items-center justify-between w-[160px]">
                  <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Yesterday</span>
                  <span className={`font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                    {yesterdayDataLength} / {tasksLength}
                  </span>
                </div>
              </div>
              
              <div className={`relative inline-flex items-center gap-1.5 text-[12px] font-medium hover:opacity-70 cursor-pointer transition-opacity w-fit mt-1.5 ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
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

            {/* Right: Actions */}
            <div className="flex flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
              
              {!isLocked && (
                <button 
                  onClick={() => setShowAddModal(true)} 
                  className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 h-[40px] text-[13px] font-medium rounded-lg transition-colors bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus size={16} /> 
                  <span>Add</span>
                </button>
              )}
              
              {!isLocked && tasksLength > 0 && (
                <button 
                  onClick={() => setShowLockModal(true)} 
                  className={`flex-1 md:flex-none flex justify-center items-center gap-1.5 px-5 h-[40px] text-[13px] font-medium rounded-lg transition-all active:scale-95 text-white ${
                    isPerfect 
                      ? "bg-emerald-500 hover:bg-emerald-600" 
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <Check size={15} /> 
                  <span>{isPerfect ? "Complete" : "Finalize"}</span>
                </button>
              )}
              
              {isLocked && (
                <div className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 h-[40px] text-[13px] font-medium rounded-lg transition-colors bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check size={16} /> 
                  <span>Day Finalized</span>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}