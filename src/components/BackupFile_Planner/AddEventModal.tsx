"use client";

import React, { useRef, useEffect, useState } from "react";
import { X, Clock, Mic, Sparkles, HelpCircle } from "lucide-react";
import { TaskType, Priority, PlannerEvent } from "./types";
import { useTheme } from "@/theme/ThemeProvider"; // 🔥 Consuming theme state

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
  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // States for new features
  const [showHelp, setShowHelp] = useState(false);
  const [isListening, setIsListening] = useState(false);

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

      setShowHelp(false); // reset help state
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

  // 1. Block Past Planning Validation (Runs before saving)
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

  // 3. Voice Input Handler
  const startVoiceInput = () => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleTitleChange({ target: { value: transcript } } as any);
    };

    recognition.start();
  };

  // 4. AI Auto-Scheduling Suggestion
  const suggestTime = () => {
    const now = new Date();
    // Suggest rounding up to the next half hour for a clean start time
    const minsToAdd = 30 - (now.getMinutes() % 30);
    now.setMinutes(now.getMinutes() + (minsToAdd === 0 ? 30 : minsToAdd));

    const hours = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");

    setFormData({
      ...formData,
      time: `${hours}:${mins}`,
      date: now.toISOString().split("T")[0] // Ensure date is today just in case
    });
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
        className={`w-full md:max-w-lg rounded-t-[2rem] md:rounded-[2rem] p-5 md:p-10 space-y-5 animate-in slide-in-from-bottom-8 md:zoom-in-95 max-h-[90vh] overflow-y-auto scrollbar-hide border ${
          isDarkMode ? "bg-[#111111] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-gray-800" : "bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] border-transparent"
        }`}
      >
        <div className={`w-10 h-1.5 rounded-full mx-auto mb-2 md:hidden ${isDarkMode ? "bg-gray-800" : "bg-slate-200"}`} />

        {/* HEADER & HELP ICON */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className={`text-xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {isEdit ? "Edit Task" : "Add Task"}
              </h3>
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className={`p-1.5 rounded-full transition-colors ${
                  showHelp 
                    ? (isDarkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-600') 
                    : (isDarkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100')
                }`}
              >
                <HelpCircle size={16} />
              </button>
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

          {/* Help Tooltip */}
          {showHelp && (
            <div className={`text-xs p-3 rounded-xl animate-in fade-in zoom-in-95 border ${
              isDarkMode ? "bg-orange-950/30 border-orange-900/50 text-orange-400" : "text-orange-800 bg-orange-50 border-orange-100"
            }`}>
              Plan only present or future tasks. This system is designed for active execution, not past tracking.
            </div>
          )}
        </div>

        <div className="space-y-5">
          
          {/* TITLE INPUT & VOICE INPUT */}
          <div>
            <label className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Task Name</label>
            <div className="relative mt-2">
              <input
                ref={titleInputRef}
                type="text"
                value={formData.title || ""}
                onChange={handleTitleChange}
                onKeyDown={handleKeyDown}
                placeholder="Type task... (e.g., Finish report at 5pm)"
                className={`w-full p-3.5 pr-12 border rounded-2xl outline-none font-bold text-base transition-all placeholder:font-medium ${
                  isDarkMode 
                    ? "bg-[#0a0a0a] border-gray-800 text-white placeholder-gray-600 focus:bg-[#111111] focus:border-orange-500 focus:ring-4 focus:ring-orange-900/20" 
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-300 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                }`}
              />
              <button
                onClick={startVoiceInput}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                  isListening 
                    ? (isDarkMode ? "text-orange-400 bg-orange-900/30 animate-pulse" : "text-orange-500 bg-orange-100 animate-pulse")
                    : (isDarkMode ? "text-gray-500 hover:text-orange-400 hover:bg-orange-900/20" : "text-slate-400 hover:text-orange-500 hover:bg-orange-50")
                }`}
                title="Use voice input"
              >
                <Mic size={18} />
              </button>
            </div>
          </div>

          {/* FOCUS TASK SUGGESTION */}
          {!isEdit && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 border ${
              isDarkMode ? "bg-orange-950/20 text-orange-400 border-orange-900/30" : "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-100/50"
            }`}>
              <Sparkles size={14} className="text-orange-500 shrink-0 mt-0.5" />
              <span>Suggested Focus: Start with your highest priority pending task to build momentum.</span>
            </div>
          )}

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
                min={getNowLocal().date} // Prevent past dates in UI
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
                {/* AI AUTO-SCHEDULING */}
                <button 
                  onClick={suggestTime}
                  className="text-[10px] uppercase tracking-wider text-blue-500 font-bold hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  <Sparkles size={10} /> Suggest
                </button>
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
                 : (isDarkMode ? "bg-orange-950/20 hover:bg-orange-900/30 text-orange-500 border-orange-900/50" : "bg-orange-50 hover:bg-orange-100 text-orange-600 border-transparent")
             }`}>Now</button>
             
             <button onClick={() => setQuickTime(15)} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
               checkQuickTimeMatch(15) 
                 ? (isDarkMode ? "bg-gray-700 text-white border-gray-600 shadow-sm" : "bg-slate-800 text-white border-slate-800 shadow-sm") 
                 : (isDarkMode ? "bg-[#0a0a0a] hover:bg-gray-800 text-gray-300 border-gray-800" : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-transparent")
             }`}>+15 Min</button>
             
             <button onClick={() => setQuickTime(30)} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
               checkQuickTimeMatch(30) 
                 ? (isDarkMode ? "bg-gray-700 text-white border-gray-600 shadow-sm" : "bg-slate-800 text-white border-slate-800 shadow-sm") 
                 : (isDarkMode ? "bg-[#0a0a0a] hover:bg-gray-800 text-gray-300 border-gray-800" : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-transparent")
             }`}>+30 Min</button>
             
             <button onClick={() => setQuickTime(60)} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
               checkQuickTimeMatch(60) 
                 ? (isDarkMode ? "bg-gray-700 text-white border-gray-600 shadow-sm" : "bg-slate-800 text-white border-slate-800 shadow-sm") 
                 : (isDarkMode ? "bg-[#0a0a0a] hover:bg-gray-800 text-gray-300 border-gray-800" : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-transparent")
             }`}>+1 Hour</button>
          </div>

          <div className="pt-2 space-y-4">
            {/* CATEGORY */}
            <div>
              <label className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Category</label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {["Work", "Study", "Health", "Finance", "Personal", "Deep Work", "Learning", "Meeting"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFormData({ ...formData, type: t as TaskType })}
                    className={`p-2 rounded-lg text-[11px] font-semibold transition-all border ${
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
            <div className="pt-1">
              <label className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>Priority</label>
              <div className="flex gap-2 mt-2">
                {["low", "medium", "high"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setFormData({ ...formData, priority: p as Priority })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                      formData.priority === p
                        ? p === "high"
                          ? (isDarkMode ? "bg-red-900/30 text-red-400 border-red-800/50 shadow-sm" : "bg-red-50 text-red-600 border-red-200 shadow-sm")
                          : p === "medium"
                          ? (isDarkMode ? "bg-orange-900/30 text-orange-400 border-orange-800/50 shadow-sm" : "bg-orange-50 text-orange-600 border-orange-200 shadow-sm")
                          : (isDarkMode ? "bg-gray-700 text-white border-gray-600 shadow-sm" : "bg-slate-800 text-white border-slate-800 shadow-sm")
                        : (isDarkMode ? "bg-[#0a0a0a] text-gray-500 hover:bg-[#1a1a1a] border-gray-800" : "bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100")
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PRIMARY ACTION BUTTON */}
          <div className="pt-4">
            <button
              onClick={handleValidatedSave}
              disabled={!formData.title?.trim() || !formData.time}
              className={`w-full py-4 text-white rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] ${
                !formData.title?.trim() || !formData.time 
                  ? (isDarkMode ? "bg-gray-900 text-gray-600 shadow-none" : "bg-slate-100 text-slate-400 shadow-none") 
                  : "bg-orange-500 hover:bg-orange-600 shadow-[0_8px_30px_rgba(249,115,22,0.3)]"
              }`}
            >
              {/* Prevent Empty / Bad Input Contextual Text */}
              {!formData.title?.trim()
                ? "Enter task name"
                : !formData.time
                ? "Select time"
                : isEdit
                ? "Update Task"
                : "Save Task"
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}