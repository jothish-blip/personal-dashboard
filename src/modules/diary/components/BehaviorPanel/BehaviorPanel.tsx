"use client";

import React, { useRef, useState } from "react";
import {
  Smile,
  Meh,
  Frown,
  BatteryFull,
  BatteryMedium,
  Battery,
  Moon,
  Cloud,
  CloudRain,
  Undo,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Flame,
} from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

const GENTLEMAN_TAGS = [
  "Focused",
  "Distracted",
  "Disciplined",
  "Lazy",
  "Overwhelmed",
  "Productive",
  "Recovery",
  "Deep Work",
  "Social Day",
  "Learning",
];

export default function BehaviorPanel({ system }: any) {
  const { currentEntry, updateEntry, lockCurrentDay } = system;
  const { isDarkMode } = useTheme();

  const [showLockModal, setShowLockModal] = useState(false);
  const lastEntryRef = useRef<any>(null);

  const streakCount = system.streak || 12; // Fallback to 12 as requested

  // ==========================================================================
  // COMPLETION LOGIC
  // ==========================================================================

  const CHECKLIST = [
    { id: "mood", label: "Mood", isComplete: !!currentEntry.mood },
    { id: "energy", label: "Energy", isComplete: !!currentEntry.energy },
    { id: "sleep", label: "Sleep", isComplete: !!currentEntry.sleep },
    { id: "win", label: "Biggest Win", isComplete: !!currentEntry.win?.trim() },
    { id: "frictions", label: "Friction", isComplete: !!currentEntry.frictions?.[0]?.trim() },
    { id: "learning", label: "Lesson", isComplete: !!currentEntry.learning?.trim() },
    { id: "improvement", label: "Tomorrow Focus", isComplete: !!currentEntry.improvement?.trim() },
    { id: "afternoon", label: "Afternoon Story", isComplete: !!currentEntry.afternoon?.trim() },
    { id: "evening", label: "Evening Reflection", isComplete: !!currentEntry.evening?.trim() },
  ];

  const completedCount = CHECKLIST.filter((item) => item.isComplete).length;
  const totalCount = CHECKLIST.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);
  const missingItems = CHECKLIST.filter((item) => !item.isComplete);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleAction = (updates: any) => {
    lastEntryRef.current = { ...currentEntry };
    updateEntry(updates);
  };

  const handleUndo = () => {
    if (lastEntryRef.current) {
      updateEntry(lastEntryRef.current);
      lastEntryRef.current = null;
    }
  };

  const handleTagToggle = (tag: string) => {
    let currentTags = [...(currentEntry.tags || [])];
    const isSelected = currentTags.includes(tag);

    if (isSelected) {
      currentTags = currentTags.filter((t) => t !== tag);
    } else {
      if (currentTags.length >= 3) return;

      // Enforce mutually exclusive tags
      if (tag === "Focused") currentTags = currentTags.filter((t) => t !== "Distracted");
      if (tag === "Distracted") currentTags = currentTags.filter((t) => t !== "Focused");
      if (tag === "Disciplined") currentTags = currentTags.filter((t) => t !== "Lazy");
      if (tag === "Lazy") currentTags = currentTags.filter((t) => t !== "Disciplined");

      currentTags.push(tag);
    }
    handleAction({ tags: currentTags });
  };

  const handleInitiateLock = () => {
    if (missingItems.length > 0) {
      setShowLockModal(true);
    } else {
      lockCurrentDay();
    }
  };

  const resizeTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight, 46)}px`;
  };

  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    updates: any
  ) => {
    resizeTextarea(e.target);
    handleAction(updates);
  };

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const getButtonClass = (value: string, current: string, type: "mood" | "energy" | "sleep") => {
    const isSelected = current === value;
    if (!isSelected) {
      return isDarkMode
        ? "bg-[#0a0a0a] border-white/[0.08] text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
        : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200";
    }

    if (type === "mood") {
      if (value === "good") return isDarkMode ? "bg-green-950/30 border-green-800 text-green-400 ring-1 ring-green-900/50" : "bg-green-50 border-green-300 text-green-700 ring-1 ring-green-200";
      if (value === "neutral") return isDarkMode ? "bg-white/[0.04] border-white/[0.12] text-white ring-1 ring-white/[0.1]" : "bg-gray-100 border-gray-400 text-gray-800 ring-1 ring-gray-300";
      if (value === "bad") return isDarkMode ? "bg-red-950/30 border-red-800 text-red-400 ring-1 ring-red-900/50" : "bg-red-50 border-red-300 text-red-700 ring-1 ring-red-200";
    }

    if (type === "energy") {
      if (value === "high") return isDarkMode ? "bg-emerald-950/30 border-emerald-800 text-emerald-400 ring-1 ring-emerald-900/50" : "bg-emerald-50 border-emerald-300 text-emerald-700 ring-1 ring-emerald-200";
      if (value === "medium") return isDarkMode ? "bg-orange-950/30 border-orange-800 text-orange-400 ring-1 ring-orange-900/50" : "bg-orange-50 border-orange-300 text-orange-700 ring-1 ring-orange-200";
      if (value === "low") return isDarkMode ? "bg-red-950/30 border-red-800 text-red-400 ring-1 ring-red-900/50" : "bg-red-50 border-red-300 text-red-700 ring-1 ring-red-200";
    }

    if (type === "sleep") {
      if (value === "good") return isDarkMode ? "bg-indigo-950/30 border-indigo-800 text-indigo-400 ring-1 ring-indigo-900/50" : "bg-indigo-50 border-indigo-300 text-indigo-700 ring-1 ring-indigo-200";
      if (value === "average") return isDarkMode ? "bg-white/[0.04] border-white/[0.12] text-white ring-1 ring-white/[0.1]" : "bg-gray-100 border-gray-400 text-gray-800 ring-1 ring-gray-300";
      if (value === "poor") return isDarkMode ? "bg-red-950/30 border-red-800 text-red-400 ring-1 ring-red-900/50" : "bg-red-50 border-red-300 text-red-700 ring-1 ring-red-200";
    }
  };

  const getMoodEmoji = (mood: string) => {
    if (mood === "good") return "😊 Good";
    if (mood === "neutral") return "😐 Neutral";
    if (mood === "bad") return "😔 Low";
    return "[Not Set]";
  };

  const getEnergyEmoji = (energy: string) => {
    if (energy === "high") return "🔋 High Energy";
    if (energy === "medium") return "🪫 Med Energy";
    if (energy === "low") return "🔌 Low Energy";
    return "[Not Set]";
  };

  const getSleepEmoji = (sleep: string) => {
    if (sleep === "good") return "🌙 Good Sleep";
    if (sleep === "average") return "☁️ Avg Sleep";
    if (sleep === "poor") return "🌧️ Poor Sleep";
    return "[Not Set]";
  };

  const baseTextareaClass = `w-full min-h-[46px] max-h-40 resize-none overflow-hidden border rounded-xl px-4 py-3 text-[13px] font-medium leading-relaxed outline-none transition-colors shadow-sm ${
    isDarkMode
      ? "bg-black border-white/[0.08] text-white focus:bg-white/[0.03] focus:border-orange-500/50 placeholder-zinc-600"
      : "bg-white border-gray-200 text-gray-800 focus:bg-gray-50 focus:border-orange-400 placeholder-gray-400"
  }`;

  const dividerClass = `my-7 border-t ${
    isDarkMode ? "border-white/[0.08]" : "border-gray-200"
  }`;

  return (
    <>
      {/* MISSING FIELDS MODAL */}
      {showLockModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className={`rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border ${
            isDarkMode ? "bg-[#0a0a0a] border-white/[0.1]" : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center gap-3 text-red-500 mb-5">
              <AlertTriangle size={24} />
              <h3 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Finish today's story first
              </h3>
            </div>
            
            <p className={`text-[14px] mb-4 ${isDarkMode ? "text-zinc-400" : "text-gray-600"}`}>
              These fields help future-you understand what happened today. You haven't completed:
            </p>

            <ul className="space-y-2.5 mb-8">
              {missingItems.map((item) => (
                <li key={item.id} className={`flex items-center gap-2.5 text-sm font-medium ${
                  isDarkMode ? "text-zinc-300" : "text-gray-700"
                }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {item.label}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setShowLockModal(false)}
                className={`flex-1 px-4 py-3 text-sm font-bold rounded-xl transition-colors border ${
                  isDarkMode 
                    ? "bg-white/[0.05] border-white/[0.1] text-white hover:bg-white/[0.1]" 
                    : "bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100"
                }`}
              >
                Continue Writing
              </button>
              <button 
                onClick={() => {
                  setShowLockModal(false);
                  lockCurrentDay();
                }}
                className="flex-1 px-4 py-3 text-sm font-bold bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 rounded-xl transition-colors"
              >
                Finalize Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN COMPONENT */}
      <div className={`border rounded-[24px] p-5 sm:p-6 md:p-8 shadow-sm mt-6 transition-colors ${
        isDarkMode ? "bg-black border-white/[0.08]" : "bg-white border-gray-200"
      }`}>
        
        {/* HEADER & SCORE */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Daily Check-In
            </h2>
            {lastEntryRef.current && (
              <button
                onClick={handleUndo}
                className="flex items-center gap-1 text-[10px] font-bold bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 px-2 py-1 rounded-md uppercase tracking-widest transition-colors"
              >
                <Undo size={12} /> Undo
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600">
            <Flame size={16} />
            <span className="text-[13px] font-bold">{streakCount} Day Streak</span>
          </div>
        </div>

        {/* PROGRESS CARD */}
        <div className={`p-5 rounded-2xl border mb-8 ${isDarkMode ? "bg-white/[0.02] border-white/[0.06]" : "bg-gray-50 border-gray-200"}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Progress {completionPercentage}%
            </span>
            <span className={`text-xs font-semibold ${isDarkMode ? "text-zinc-500" : "text-gray-500"}`}>
              Score: {completedCount}/{totalCount}
            </span>
          </div>
          
          <div className={`w-full h-2 rounded-full mb-5 overflow-hidden ${isDarkMode ? "bg-white/[0.06]" : "bg-gray-200"}`}>
            <div 
              className="h-full bg-orange-500 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
            {CHECKLIST.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                {item.isComplete ? (
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                ) : (
                  <Circle size={14} className={isDarkMode ? "text-zinc-600 shrink-0" : "text-gray-300 shrink-0"} />
                )}
                <span className={`text-[12px] font-medium truncate ${
                  item.isComplete 
                    ? (isDarkMode ? "text-zinc-300" : "text-gray-700") 
                    : (isDarkMode ? "text-zinc-600" : "text-gray-400")
                }`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* METRICS BUTTONS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-2">
          
          {/* Mood */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>Mood</label>
              {!currentEntry.mood && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">Not Set</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction({ mood: "good" })}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getButtonClass("good", currentEntry.mood, "mood")}`}
              >
                <Smile size={18} />
                <span className="text-[10px] font-bold uppercase">Good</span>
              </button>
              <button
                onClick={() => handleAction({ mood: "neutral" })}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getButtonClass("neutral", currentEntry.mood, "mood")}`}
              >
                <Meh size={18} />
                <span className="text-[10px] font-bold uppercase">Neutral</span>
              </button>
              <button
                onClick={() => handleAction({ mood: "bad" })}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getButtonClass("bad", currentEntry.mood, "mood")}`}
              >
                <Frown size={18} />
                <span className="text-[10px] font-bold uppercase">Low</span>
              </button>
            </div>
          </div>

          {/* Energy */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>Energy</label>
              {!currentEntry.energy && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">Not Set</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction({ energy: "high" })}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getButtonClass("high", currentEntry.energy, "energy")}`}
              >
                <BatteryFull size={18} />
                <span className="text-[10px] font-bold uppercase">High</span>
              </button>
              <button
                onClick={() => handleAction({ energy: "medium" })}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getButtonClass("medium", currentEntry.energy, "energy")}`}
              >
                <BatteryMedium size={18} />
                <span className="text-[10px] font-bold uppercase">Med</span>
              </button>
              <button
                onClick={() => handleAction({ energy: "low" })}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getButtonClass("low", currentEntry.energy, "energy")}`}
              >
                <Battery size={18} />
                <span className="text-[10px] font-bold uppercase">Low</span>
              </button>
            </div>
          </div>

          {/* Sleep */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>Sleep</label>
              {!currentEntry.sleep && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">Not Set</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction({ sleep: "good" })}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getButtonClass("good", currentEntry.sleep, "sleep")}`}
              >
                <Moon size={18} />
                <span className="text-[10px] font-bold uppercase">Good</span>
              </button>
              <button
                onClick={() => handleAction({ sleep: "average" })}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getButtonClass("average", currentEntry.sleep, "sleep")}`}
              >
                <Cloud size={18} />
                <span className="text-[10px] font-bold uppercase">Avg</span>
              </button>
              <button
                onClick={() => handleAction({ sleep: "poor" })}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getButtonClass("poor", currentEntry.sleep, "sleep")}`}
              >
                <CloudRain size={18} />
                <span className="text-[10px] font-bold uppercase">Poor</span>
              </button>
            </div>
          </div>
        </div>

        <hr className={dividerClass} />

        {/* TEXT LOGS */}
        <span className={`text-[11px] font-bold uppercase tracking-widest block mb-5 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
          What happened today?
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
              Biggest Win
            </label>
            <textarea
              rows={1}
              value={currentEntry.win || ""}
              onInput={(e) => resizeTextarea(e.currentTarget)}
              onChange={(e) => handleTextareaChange(e, { win: e.target.value })}
              placeholder="What went right today?..."
              className={baseTextareaClass}
            />
          </div>

          <div>
            <label className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
              Biggest Friction
            </label>
            <textarea
              rows={1}
              value={(currentEntry.frictions && currentEntry.frictions[0]) || ""}
              onInput={(e) => resizeTextarea(e.currentTarget)}
              onChange={(e) => handleTextareaChange(e, { frictions: e.target.value ? [e.target.value] : [] })}
              placeholder="What held you back?..."
              className={baseTextareaClass}
            />
          </div>

          <div>
            <label className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
              Today's Lesson
            </label>
            <textarea
              rows={1}
              value={currentEntry.learning || ""}
              onInput={(e) => resizeTextarea(e.currentTarget)}
              onChange={(e) => handleTextareaChange(e, { learning: e.target.value })}
              placeholder="What did today teach you?..."
              className={baseTextareaClass}
            />
          </div>

          <div>
            <label className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
              Tomorrow Adjustment
            </label>
            <textarea
              rows={1}
              value={currentEntry.improvement || ""}
              onInput={(e) => resizeTextarea(e.currentTarget)}
              onChange={(e) => handleTextareaChange(e, { improvement: e.target.value })}
              placeholder="What will you do differently?..."
              className={baseTextareaClass}
            />
          </div>
        </div>

        <hr className={dividerClass} />

        {/* TAGS */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
                Context Tags
              </span>
              <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                Max 3
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {GENTLEMAN_TAGS.map((tag) => {
                const isSelected = (currentEntry.tags || []).includes(tag);
                const isDisabled = !isSelected && (currentEntry.tags || []).length >= 3;

                return (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    disabled={isDisabled}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      isSelected
                        ? isDarkMode
                          ? "bg-orange-950/40 text-orange-400 border-orange-900/50"
                          : "bg-orange-50 text-orange-700 border-orange-200 shadow-sm"
                        : isDisabled
                        ? isDarkMode
                          ? "bg-black opacity-30 text-zinc-600 border-white/[0.08] cursor-not-allowed"
                          : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                        : isDarkMode
                        ? "bg-black text-zinc-400 border-white/[0.08] hover:bg-white/[0.04]"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* QUICK SUMMARY SNAPSHOT */}
          <div className={`w-full lg:w-64 shrink-0 p-4 rounded-xl border ${isDarkMode ? "bg-white/[0.02] border-white/[0.06]" : "bg-gray-50 border-gray-200"}`}>
            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>Today Snapshot</h4>
            <div className={`text-[13px] font-medium space-y-2 mb-3 ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>
              <div>{getMoodEmoji(currentEntry.mood)}</div>
              <div>{getEnergyEmoji(currentEntry.energy)}</div>
              <div>{getSleepEmoji(currentEntry.sleep)}</div>
            </div>
            {currentEntry.tags && currentEntry.tags.length > 0 ? (
              <div className={`text-[11px] font-bold uppercase tracking-wider pt-3 border-t ${isDarkMode ? "border-white/[0.08] text-orange-400" : "border-gray-200 text-orange-600"}`}>
                {currentEntry.tags.join(" • ")}
              </div>
            ) : (
              <div className={`text-[11px] font-bold uppercase tracking-wider pt-3 border-t ${isDarkMode ? "border-white/[0.08] text-zinc-600" : "border-gray-200 text-gray-400"}`}>
                No tags set
              </div>
            )}
          </div>
        </div>

        {/* LOCK SECTION */}
        <div className={`mt-10 pt-8 border-t ${isDarkMode ? "border-white/[0.08]" : "border-gray-200"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className={`text-[14px] font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Day Finalization
              </h3>
              <ul className={`text-[12px] space-y-1 ${isDarkMode ? "text-zinc-500" : "text-gray-500"}`}>
                <li>• Stories become read-only</li>
                <li>• Behavior cannot be changed</li>
                <li>• Entry moves to archive</li>
              </ul>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${
                completedCount === totalCount ? "text-green-500" : "text-orange-500"
              }`}>
                {completedCount === totalCount ? "Ready to Finalize" : `${completedCount} / ${totalCount} sections completed`}
              </span>
              <button
                onClick={handleInitiateLock}
                className={`flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-[13px] transition-all shadow-sm ${
                  completedCount === totalCount
                    ? "bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
                    : isDarkMode
                    ? "bg-white/[0.05] border border-white/[0.1] text-zinc-300 hover:bg-white/[0.1] active:scale-95"
                    : "bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 active:scale-95"
                }`}
              >
                <Lock size={16} />
                Finalize & Lock Day
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}