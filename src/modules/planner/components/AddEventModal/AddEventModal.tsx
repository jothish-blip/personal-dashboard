"use client";

import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskType, Priority, PlannerEvent } from "../../types/types";
import { useTheme } from "@/theme/ThemeProvider";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: Partial<PlannerEvent>;
  setFormData: (data: Partial<PlannerEvent>) => void;
  handleSave: () => void;
}

// Helper to strictly get local present time for validation
const getNowLocal = () => {
  const now = new Date();
  
  // Smart rounding: round up to the nearest 5 minutes for a cleaner default time
  const mins = Math.ceil(now.getMinutes() / 5) * 5;
  now.setMinutes(mins);

  // Using local timezone offset to avoid UTC rollover bugs
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0];

  return {
    date: localDate,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  };
};

const getRelativeTimeString = (dateStr?: string, timeStr?: string) => {
  if (!dateStr || !timeStr) return "";

  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const target = new Date(year, month - 1, day, hours, minutes);
  const now = new Date();

  const diffMs = target.getTime() - now.getTime();
  if (diffMs < -60000) return "Overdue";

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const remMins = diffMins % 60;

  const isToday = target.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = target.toDateString() === tomorrow.toDateString();

  const timeFormatted = target.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  if (diffHours < 24 && isToday) {
    if (diffHours === 0) return `Due in ${remMins}m`;
    return `Due in ${diffHours}h ${remMins}m`;
  } else if (isTomorrow) {
    return `Tomorrow at ${timeFormatted}`;
  } else {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    return `Scheduled for ${target.toLocaleDateString([], options)} at ${timeFormatted}`;
  }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.98,
    y: 10
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 10
  }
};

export default function AddEventModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSave
}: AddEventModalProps) {
  const { isDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Handle client-side mounting for Portal
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Auto-focus & preserve existing date/time for edits and reschedules
  useEffect(() => {
    if (isOpen) {
      if (!formData.id) {
        const now = getNowLocal();
        setFormData({
          ...formData,
          date: formData.date || now.date,
          time: formData.time || now.time,
        });
      }

      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Lock page scrolling and handle Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      document.documentElement.style.overflow = "hidden";
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      
      return () => {
        document.body.style.overflow = "";
        document.body.style.touchAction = "";
        document.documentElement.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const isEdit = !!formData.id;

  // Streamlined Quick Time Logic
  const setQuickPreset = (preset: "now" | "30m" | "1h" | "tomorrow") => {
    const targetDate = new Date();

    if (preset === "30m") {
      targetDate.setMinutes(targetDate.getMinutes() + 30);
    } else if (preset === "1h") {
      targetDate.setHours(targetDate.getHours() + 1);
    } else if (preset === "tomorrow") {
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(9, 0, 0, 0); // Defaults to 9:00 AM next day
    }

    const newDate = new Date(targetDate.getTime() - targetDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const hours = String(targetDate.getHours()).padStart(2, "0");
    const mins = String(targetDate.getMinutes()).padStart(2, "0");

    setFormData({
      ...formData,
      date: newDate,
      time: `${hours}:${mins}`
    });
  };

  const checkQuickTimeMatch = (preset: string) => {
    if (!formData.date || !formData.time) return false;
    
    const target = new Date();
    if (preset === "30m") target.setMinutes(target.getMinutes() + 30);
    else if (preset === "1h") target.setHours(target.getHours() + 1);
    else if (preset === "tomorrow") {
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    }
    
    const expDate = new Date(target.getTime() - target.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const expTime = `${String(target.getHours()).padStart(2, "0")}:${String(target.getMinutes()).padStart(2, "0")}`;

    return formData.date === expDate && formData.time === expTime;
  };

  // Smart Auto-Parsing logic
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    let newTime = formData.time;

    const timeMatch = value.match(/(\d{1,2})(am|pm)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const period = timeMatch[2].toLowerCase();
      
      if (period === "pm" && hours < 12) hours += 12;
      if (period === "am" && hours === 12) hours = 0; 

      newTime = `${String(hours).padStart(2, "0")}:00`;
    }

    setFormData({ 
      ...formData, 
      title: value,
      time: newTime 
    });
  };

  // Block Past Planning Validation
  const handleValidatedSave = () => {
    if (!formData.date || !formData.time) return;

    const [year, month, day] = formData.date.split('-').map(Number);
    const [hours, minutes] = formData.time.split(':').map(Number);
    const selectedDate = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();

    if (selectedDate.getTime() < now.getTime() - 60000) {
      alert("Cannot schedule tasks in the past. Focus on the present and future.");
      return;
    }

    handleSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && formData.title?.trim()) {
      e.preventDefault();
      handleValidatedSave();
    }
  };

  const allCategories = ["Work", "Study", "Health", "Finance", "Personal", "Deep Work", "Learning", "Meeting"];
  const visibleCategories = showAllCategories ? allCategories : ["Work", "Study", "Health", "Personal"];

  const modalSurfaceClass = isDarkMode
    ? "bg-black border border-white/[0.08] shadow-2xl"
    : "bg-white border border-black/[0.05] shadow-xl";

  // Prevent SSR hydration mismatch by only rendering the portal on the client
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: 0.2,
              ease: "easeOut"
            }}
            onClick={(e) => e.stopPropagation()}
            className={`
              relative
              w-full
              max-w-[720px]
              max-h-[90vh]
              flex
              flex-col
              overflow-hidden
              rounded-2xl
              p-6
              font-sans
              ${modalSurfaceClass}
            `}
          >
            {/* HEADER */}
            <div className="flex justify-between items-center mb-5 shrink-0">
              <div>
                <h3
                  className={`text-lg font-semibold tracking-tight ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {isEdit ? "Edit Event" : "New Event"}
                </h3>

                <p
                  className={`text-sm mt-1 ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {isEdit ? "Update your plan." : "Schedule something important."}
                </p>
              </div>

              <button
                onClick={onClose}
                className={`p-1 rounded-md transition-colors ${
                  isDarkMode
                    ? "text-slate-400 hover:text-white hover:bg-white/10"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {/* SEPARATOR */}
            <div
              className={`h-[1px] w-full mb-5 shrink-0 ${
                isDarkMode ? "bg-white/10" : "bg-slate-200"
              }`}
            />

            {/* SCROLLABLE CONTENT */}
            <div className="space-y-6 overflow-y-auto scrollbar-hide pb-2">
              
              {/* TITLE INPUT */}
              <div>
                <div className="relative">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={formData.title || ""}
                    onChange={handleTitleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. Finish the presentation at 5pm"
                    className={`w-full p-4 rounded-2xl outline-none font-medium text-base md:text-lg transition-all ${
                      isDarkMode 
                        ? "bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.07] text-white placeholder-white/30" 
                        : "bg-black/[0.03] hover:bg-black/[0.05] focus:bg-black/[0.06] text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>
              </div>

              {/* QUICK TIME BUTTONS */}
              <div className="space-y-2">
                <label className={`text-[11px] font-medium uppercase tracking-[0.16em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                  Quick Actions
                </label>
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                  <Clock size={14} className={`shrink-0 ${isDarkMode ? "text-white/40" : "text-slate-400"}`} />
                  
                  <button onClick={() => setQuickPreset("now")} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    checkQuickTimeMatch("now") 
                      ? "bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.2)]" 
                      : (isDarkMode ? "bg-white/[0.04] hover:bg-white/[0.06] text-white/60" : "bg-black/[0.03] hover:bg-black/[0.05] text-slate-600")
                  }`}>Due now</button>
                  
                  <button onClick={() => setQuickPreset("30m")} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    checkQuickTimeMatch("30m") 
                      ? "bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.2)]" 
                      : (isDarkMode ? "bg-white/[0.04] hover:bg-white/[0.06] text-white/60" : "bg-black/[0.03] hover:bg-black/[0.05] text-slate-600")
                  }`}>30m left</button>
                  
                  <button onClick={() => setQuickPreset("1h")} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    checkQuickTimeMatch("1h") 
                      ? "bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.2)]" 
                      : (isDarkMode ? "bg-white/[0.04] hover:bg-white/[0.06] text-white/60" : "bg-black/[0.03] hover:bg-black/[0.05] text-slate-600")
                  }`}>1h left</button>

                  <button onClick={() => setQuickPreset("tomorrow")} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    checkQuickTimeMatch("tomorrow") 
                      ? "bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.2)]" 
                      : (isDarkMode ? "bg-white/[0.04] hover:bg-white/[0.06] text-white/60" : "bg-black/[0.03] hover:bg-black/[0.05] text-slate-600")
                  }`}>Tomorrow</button>
                </div>
              </div>

              {/* DATE & TIME SETTINGS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center h-[18px]">
                    <label className={`text-[11px] font-medium uppercase tracking-[0.16em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                      Date
                    </label>
                    <button 
                      onClick={() => setFormData({ ...formData, date: getNowLocal().date })}
                      className="text-xs text-orange-500 font-medium hover:text-orange-600 transition-colors"
                    >
                      Today
                    </button>
                  </div>
                  <input
                    type="date"
                    min={getNowLocal().date} 
                    value={formData.date || ""}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full p-4 rounded-2xl outline-none font-medium text-base transition-colors ${
                      isDarkMode 
                        ? "bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.07] text-white color-scheme-dark" 
                        : "bg-black/[0.03] hover:bg-black/[0.05] focus:bg-black/[0.06] text-slate-900"
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center h-[18px]">
                    <label className={`text-[11px] font-medium uppercase tracking-[0.16em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                      Time
                    </label>
                  </div>
                  <input
                    type="time"
                    min={formData.date === getNowLocal().date ? getNowLocal().time : undefined}
                    value={formData.time || ""}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className={`w-full p-4 rounded-2xl outline-none font-medium text-base transition-colors ${
                      isDarkMode 
                        ? "bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.07] text-white color-scheme-dark" 
                        : "bg-black/[0.03] hover:bg-black/[0.05] focus:bg-black/[0.06] text-slate-900"
                    }`}
                  />
                </div>
              </div>

              {/* DEADLINE STATUS */}
              {formData.date && formData.time && (
                <div
                  className={`
                    flex items-center justify-between
                    px-4 py-3.5
                    rounded-2xl
                    ${
                      isDarkMode
                        ? "bg-white/[0.04]"
                        : "bg-orange-50/50"
                    }
                  `}
                >
                  <div>
                    <p
                      className={`
                        font-medium
                        text-sm
                        ${
                          isDarkMode
                            ? "text-white/90"
                            : "text-slate-900"
                        }
                      `}
                    >
                      {getRelativeTimeString(formData.date, formData.time)}
                    </p>
                  </div>

                  <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-orange-500/80">
                    Deadline
                  </span>
                </div>
              )}

              <div className="space-y-5">
                {/* CATEGORY */}
                <div>
                  <label className={`text-[11px] font-medium uppercase tracking-[0.16em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                    Category
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {visibleCategories.map((t) => (
                      <button
                        key={t}
                        onClick={() => setFormData({ ...formData, type: t as TaskType })}
                        className={`p-2.5 rounded-xl text-xs font-medium transition-all ${
                          formData.type === t
                            ? (isDarkMode ? "bg-orange-500/14 text-orange-400" : "bg-orange-50 text-orange-600")
                            : (isDarkMode ? "bg-white/[0.04] hover:bg-white/[0.06] text-white/70" : "bg-black/[0.03] hover:bg-black/[0.05] text-slate-600")
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {!showAllCategories && (
                    <button 
                      onClick={() => setShowAllCategories(true)}
                      className={`mt-3 text-xs font-medium transition-colors ${isDarkMode ? "text-white/40 hover:text-white/70" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      + More Categories
                    </button>
                  )}
                </div>

                {/* PRIORITY */}
                <div>
                  <label className={`text-[11px] font-medium uppercase tracking-[0.16em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                    Priority
                  </label>
                  <div className={`flex p-1 rounded-2xl mt-2 ${isDarkMode ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                    {["low", "medium", "high"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setFormData({ ...formData, priority: p as Priority })}
                        className={`flex-1 py-2.5 text-xs font-medium capitalize rounded-xl transition-all ${
                          formData.priority === p
                            ? (isDarkMode ? "bg-white/[0.08] text-white shadow-sm" : "bg-black/[0.06] text-black shadow-sm")
                            : (isDarkMode ? "bg-transparent text-white/45 hover:text-white/70" : "bg-transparent text-black/45 hover:text-black/70")
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER BUTTONS */}
            <div className="flex gap-2 justify-end items-center pt-4 shrink-0">
              <button
                onClick={onClose}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isDarkMode
                    ? "text-slate-300 hover:bg-white/[0.06]"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Cancel
              </button>

              <button
                onClick={handleValidatedSave}
                disabled={!formData.title?.trim() || !formData.time}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                  !formData.title?.trim() || !formData.time
                    ? (isDarkMode ? "bg-white/[0.06] text-white/30" : "bg-black/[0.04] text-black/30")
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                {isEdit ? "Save Changes" : "Create Event"}
              </button>
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}