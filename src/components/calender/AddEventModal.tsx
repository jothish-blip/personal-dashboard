import React, { useRef, useEffect } from "react";
import { X, Clock } from "lucide-react";
import { TaskType, Priority, PlannerEvent } from "./types";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: Partial<PlannerEvent>;
  setFormData: (data: Partial<PlannerEvent>) => void;
  handleSave: () => void;
}

export default function AddEventModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSave
}: AddEventModalProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);

  // 1. Auto-focus & Auto-default Time when opened
  useEffect(() => {
    if (isOpen) {
      let updates: Partial<PlannerEvent> = {};
      let needsUpdate = false;

      // Default time if empty
      if (!formData.time) {
        const now = new Date();
        updates.time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        needsUpdate = true;
      }
      
      // Default date if empty
      if (!formData.date) {
        updates.date = new Date().toISOString().split("T")[0];
        needsUpdate = true;
      }

      if (needsUpdate) {
        setFormData({ ...formData, ...updates });
      }

      // Auto-focus input for fast entry
      if (titleInputRef.current) {
        setTimeout(() => titleInputRef.current?.focus(), 50);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const isEdit = !!formData.id;

  // 2. Fixed Quick Time Logic (Handles Day Rollover)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && formData.title?.trim()) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    // 3. Removed Dark Overlay & Added Outside Click Close
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-white/70 backdrop-blur-sm z-[200] flex items-end md:items-center justify-center p-0 md:p-6 transition-opacity"
    >
      
      {/* CONTAINER: Keyboard Safe + Scroll Safe */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white w-full md:max-w-lg rounded-t-[2rem] md:rounded-[2rem] shadow-2xl p-5 md:p-10 space-y-6 animate-in slide-in-from-bottom-8 md:zoom-in-95 max-h-[90vh] overflow-y-auto scrollbar-hide"
      >

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            {isEdit ? "Edit Task" : "Add Task"}
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM CONTROLS */}
        <div className="space-y-5">

          {/* TITLE INPUT */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Task Name</label>
            <input
              ref={titleInputRef}
              type="text"
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="What do you want to do?"
              className="w-full mt-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-base transition-all placeholder:font-medium placeholder:text-slate-300"
            />
          </div>

          {/* DATE & TIME SETTINGS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Date</label>
                {/* 4. 'Today' Quick Action */}
                <button 
                  onClick={() => setFormData({ ...formData, date: new Date().toISOString().split("T")[0] })}
                  className="text-xs text-orange-500 font-semibold hover:text-orange-600 transition-colors"
                >
                  Today
                </button>
              </div>
              <input
                type="date"
                value={formData.date || ""}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block h-[18px]">Time</label>
              <input
                type="time"
                value={formData.time || ""}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* QUICK TIME BUTTONS */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
             <Clock size={14} className="text-slate-300 shrink-0" />
             <button onClick={() => setQuickTime(0)} className="shrink-0 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl text-xs font-bold transition-colors">Now</button>
             <button onClick={() => setQuickTime(15)} className="shrink-0 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors">+15 Min</button>
             <button onClick={() => setQuickTime(30)} className="shrink-0 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors">+30 Min</button>
             <button onClick={() => setQuickTime(60)} className="shrink-0 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors">+1 Hour</button>
          </div>

          {/* TYPE & PRIORITY */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Category</label>
              <select
                value={formData.type || "Work"}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as TaskType })}
                className="w-full mt-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:border-orange-500 transition-colors appearance-none"
              >
                {["Work", "Study", "Health", "Finance", "Personal", "Deep Work", "Learning", "Meeting"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Priority</label>
              <select
                value={formData.priority || "medium"}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                className="w-full mt-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:border-orange-500 transition-colors appearance-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* PRIMARY ACTION BUTTON */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={!formData.title?.trim()}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none text-white rounded-2xl text-sm font-semibold shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]"
            >
              {isEdit ? "Update Task" : "Save Task"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}