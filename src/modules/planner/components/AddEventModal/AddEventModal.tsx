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
  return {
    date: now.toISOString().split("T")[0],
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

  // Auto-focus & Auto-default Time when opened
  useEffect(() => {
    if (isOpen) {
      let updates: Partial<PlannerEvent> = {};
      let needsUpdate = false;
      const now = getNowLocal();

      if (!formData.time) {
        updates.time = now.time;
        needsUpdate = true;
      }
      
      if (!formData.date) {
        updates.date = now.date;
        needsUpdate = true;
      }

      if (needsUpdate) {
        setFormData({ ...formData, ...updates });
      }

      if (titleInputRef.current) {
        setTimeout(() => titleInputRef.current?.focus(), 50);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const isEdit = !!formData.id;

  // Fixed Quick Time Logic
  const setQuickTime = (addMinutes: number) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + addMinutes);

    const newDate = now.toISOString().split("T")[0];
    const hours = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");

    setFormData({
      ...formData,
      date: newDate,
      time: `${hours}:${mins}`
    });
  };

  // Smart Auto-Parsing logic (silently parses times like 5pm)
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

    // Parse safely
    const [year, month, day] = formData.date.split('-').map(Number);
    const [hours, minutes] = formData.time.split(':').map(Number);
    const selectedDate = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();

    // Prevent past scheduling (giving a 1 minute grace period)
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

  const checkQuickTimeMatch = (addMinutes: number) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + addMinutes);
    const expectedTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return formData.time === expectedTime;
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
          <div className="space-y-1">
            <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {isEdit ? "Edit Task" : "New Task"}
            </h3>
            <p className={`text-sm font-semibold tracking-tight ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>
              {isEdit ? "Update your plan." : "Plan something meaningful."}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full transition-colors ${
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center h-[18px]">
                <label className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Date</label>
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
                className={`w-full p-3.5 border rounded-2xl outline-none font-bold text-sm focus:border-orange-500 transition-colors ${
                  isDarkMode ? "bg-[#0a0a0a] border-gray-800 text-white color-scheme-dark" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center h-[18px]">
                <label className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Time</label>
              </div>
              <input
                type="time"
                value={formData.time || ""}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className={`w-full p-3.5 border rounded-2xl outline-none font-bold text-sm focus:border-orange-500 transition-colors ${
                  isDarkMode ? "bg-[#0a0a0a] border-gray-800 text-white color-scheme-dark" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>
          </div>

          {/* QUICK TIME BUTTONS */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
             <Clock size={14} className={`shrink-0 ${isDarkMode ? "text-gray-600" : "text-slate-300"}`} />
             
             <button onClick={() => setQuickTime(0)} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
               checkQuickTimeMatch(0) 
                 ? "bg-orange-500 text-white border-orange-500 shadow-sm" 
                 : (isDarkMode ? "bg-[#0a0a0a] hover:bg-[#1a1a1a] text-gray-400 border-gray-800" : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200")
             }`}>Now</button>
             
             <button onClick={() => setQuickTime(15)} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
               checkQuickTimeMatch(15) 
                 ? "bg-orange-500 text-white border-orange-500 shadow-sm" 
                 : (isDarkMode ? "bg-[#0a0a0a] hover:bg-[#1a1a1a] text-gray-400 border-gray-800" : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200")
             }`}>+15m</button>
             
             <button onClick={() => setQuickTime(30)} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
               checkQuickTimeMatch(30) 
                 ? "bg-orange-500 text-white border-orange-500 shadow-sm" 
                 : (isDarkMode ? "bg-[#0a0a0a] hover:bg-[#1a1a1a] text-gray-400 border-gray-800" : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200")
             }`}>+30m</button>
             
             <button onClick={() => setQuickTime(60)} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
               checkQuickTimeMatch(60) 
                 ? "bg-orange-500 text-white border-orange-500 shadow-sm" 
                 : (isDarkMode ? "bg-[#0a0a0a] hover:bg-[#1a1a1a] text-gray-400 border-gray-800" : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200")
             }`}>+1h</button>
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
                : "Add Task"
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}