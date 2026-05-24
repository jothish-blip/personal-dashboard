"use client";

import React, { useRef, useEffect } from "react";
import { X, Clock } from "lucide-react";
import { TaskType, Priority, PlannerEvent } from "../../types/types";
import { useTheme } from "@/theme/ThemeProvider";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: Partial<PlannerEvent>;
  setFormData: (data: Partial<PlannerEvent>) => void;
  handleSave: () => void;
}

// 1. Helper to strictly get local present time for validation
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

export default function AddEventModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSave
}: AddEventModalProps) {
  const { isDarkMode } = useTheme();
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-focus & ALWAYS default to Present Time when opened
  useEffect(() => {
    if (isOpen) {
      const now = getNowLocal();
  
      setFormData({
        ...formData,
        date: now.date,
        time: now.time,
      });
  
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

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

    // Adjust for timezone offset properly so quick preset days don't drift
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

  // Block Past Planning Validation (Runs before saving)
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

  return (
    <div 
      onClick={onClose}
      className={`fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-6 transition-opacity backdrop-blur-sm ${
        isDarkMode ? "bg-black/60" : "bg-slate-900/40"
      }`}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className={`w-full md:max-w-xl rounded-t-[2rem] md:rounded-[2.5rem] p-6 md:p-8 space-y-6 animate-in slide-in-from-bottom-8 md:zoom-in-95 max-h-[90vh] overflow-y-auto scrollbar-hide border ${
          isDarkMode ? "bg-[#111111] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-gray-800" : "bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] border-transparent"
        }`}
      >
        <div className={`w-10 h-1.5 rounded-full mx-auto mb-2 md:hidden ${isDarkMode ? "bg-gray-800" : "bg-slate-200"}`} />

        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div className="space-y-1 w-full">
            <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {isEdit ? "Edit Task" : "New Task"}
            </h3>
            <p className={`text-sm font-semibold tracking-tight ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>
              {isEdit ? "Update your plan." : "Plan something meaningful."}
            </p>
          </div>
          
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full transition-colors ml-4 shrink-0 ${
              isDarkMode ? "bg-gray-900 text-gray-500 hover:text-white hover:bg-gray-800" : "bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          
          {/* TITLE INPUT */}
          <div>
            <label className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Task Name</label>
            <div className="relative mt-2">
              <input
                ref={titleInputRef}
                type="text"
                value={formData.title || ""}
                onChange={handleTitleChange}
                onKeyDown={handleKeyDown}
                placeholder="What needs to be done?"
                className={`w-full p-4 border rounded-2xl outline-none font-bold text-base md:text-lg transition-all placeholder:font-medium ${
                  isDarkMode 
                    ? "bg-[#0a0a0a] border-gray-800 text-white placeholder-gray-600 focus:bg-[#111111] focus:border-orange-500 focus:ring-4 focus:ring-orange-900/20" 
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-300 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                }`}
              />
            </div>
          </div>

          {/* DATE & TIME SETTINGS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center h-[18px]">
                <label className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Complete By</label>
                <button 
                  onClick={() => setFormData({ ...formData, date: getNowLocal().date })}
                  className="text-xs text-orange-500 font-semibold hover:text-orange-600 transition-colors"
                >
                  Today
                </button>
              </div>
              <input
                type="date"
                min={getNowLocal().date} 
                value={formData.date || ""}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`w-full p-4 border rounded-2xl outline-none font-bold text-base focus:border-orange-500 transition-colors ${
                  isDarkMode ? "bg-[#0a0a0a] border-gray-800 text-white color-scheme-dark" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center h-[18px]">
                <label className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Before Time</label>
              </div>
              <input
                type="time"
                min={formData.date === getNowLocal().date ? getNowLocal().time : undefined}
                value={formData.time || ""}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className={`w-full p-4 border rounded-2xl outline-none font-bold text-base focus:border-orange-500 transition-colors ${
                  isDarkMode ? "bg-[#0a0a0a] border-gray-800 text-white color-scheme-dark" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>
          </div>

          {/* DEADLINE STATUS */}
          {formData.date && formData.time && (
            <div
              className={`
                flex items-center justify-between
                px-4 py-3
                rounded-2xl border
                ${
                  isDarkMode
                    ? "bg-[#0f0f0f] border-white/[0.06]"
                    : "bg-orange-50/50 border-orange-100"
                }
              `}
            >
              <div>
                <p
                  className={`
                    text-[11px]
                    uppercase
                    tracking-[0.18em]
                    font-black
                    ${
                      isDarkMode
                        ? "text-gray-500"
                        : "text-slate-400"
                    }
                  `}
                >
                  Deadline
                </p>

                <p
                  className={`
                    font-bold
                    text-sm
                    ${
                      isDarkMode
                        ? "text-white"
                        : "text-slate-900"
                    }
                  `}
                >
                  Complete before{" "}
                  {new Date(
                    `${formData.date}T${formData.time}`
                  ).toLocaleString([], {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <span className="text-xs font-bold text-orange-500">
                Due
              </span>
            </div>
          )}

          {/* QUICK TIME BUTTONS */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
             <Clock size={14} className={`shrink-0 ${isDarkMode ? "text-gray-600" : "text-slate-300"}`} />
             
             <button onClick={() => setQuickPreset("now")} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
               checkQuickTimeMatch("now") 
                 ? "bg-orange-500 text-white border-orange-500 shadow-sm" 
                 : (isDarkMode ? "bg-[#0a0a0a] hover:bg-[#1a1a1a] text-gray-400 border-gray-800" : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200")
             }`}>Due now</button>
             
             <button onClick={() => setQuickPreset("30m")} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
               checkQuickTimeMatch("30m") 
                 ? "bg-orange-500 text-white border-orange-500 shadow-sm" 
                 : (isDarkMode ? "bg-[#0a0a0a] hover:bg-[#1a1a1a] text-gray-400 border-gray-800" : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200")
             }`}>30m left</button>
             
             <button onClick={() => setQuickPreset("1h")} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
               checkQuickTimeMatch("1h") 
                 ? "bg-orange-500 text-white border-orange-500 shadow-sm" 
                 : (isDarkMode ? "bg-[#0a0a0a] hover:bg-[#1a1a1a] text-gray-400 border-gray-800" : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200")
             }`}>1h left</button>

             <button onClick={() => setQuickPreset("tomorrow")} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
               checkQuickTimeMatch("tomorrow") 
                 ? "bg-orange-500 text-white border-orange-500 shadow-sm" 
                 : (isDarkMode ? "bg-[#0a0a0a] hover:bg-[#1a1a1a] text-gray-400 border-gray-800" : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200")
             }`}>Tomorrow</button>
          </div>

          <div className="space-y-5">
            {/* CATEGORY */}
            <div>
              <label className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Category</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {["Work", "Study", "Health", "Finance", "Personal", "Deep Work", "Learning", "Meeting"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFormData({ ...formData, type: t as TaskType })}
                    className={`p-2.5 rounded-xl text-xs font-semibold transition-all border ${
                      formData.type === t
                        ? (isDarkMode ? "bg-orange-900/30 text-orange-400 border-orange-800/50 shadow-sm" : "bg-orange-100 text-orange-600 border-orange-200 shadow-sm")
                        : (isDarkMode ? "bg-[#0a0a0a] text-gray-400 hover:bg-[#1a1a1a] border-gray-800" : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-transparent")
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* PRIORITY */}
            <div>
              <label className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Priority</label>
              <div className={`flex p-1 rounded-2xl mt-2 border ${isDarkMode ? 'bg-[#0a0a0a] border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
                {["low", "medium", "high"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setFormData({ ...formData, priority: p as Priority })}
                    className={`flex-1 py-2.5 text-xs font-bold capitalize rounded-xl transition-all ${
                      formData.priority === p
                        ? (isDarkMode ? "bg-[#222222] text-white shadow-sm" : "bg-white text-slate-900 shadow-sm")
                        : (isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PRIMARY ACTION BUTTON */}
          <div className="pt-2">
            <button
              onClick={handleValidatedSave}
              disabled={!formData.title?.trim() || !formData.time}
              className={`w-full py-4 text-white rounded-2xl text-sm md:text-base font-bold transition-all active:scale-[0.98] ${
                !formData.title?.trim() || !formData.time 
                  ? (isDarkMode ? "bg-gray-900 text-gray-600 shadow-none" : "bg-slate-100 text-slate-400 shadow-none") 
                  : "bg-orange-500 hover:bg-orange-600 shadow-[0_8px_30px_rgba(249,115,22,0.3)]"
              }`}
            >
              {!formData.title?.trim()
                ? "Enter task name"
                : !formData.time
                ? "Select time"
                : isEdit
                ? "Save Changes"
                : "Add Deadline"
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}