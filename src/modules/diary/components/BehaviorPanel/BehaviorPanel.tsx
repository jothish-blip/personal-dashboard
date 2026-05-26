"use client";

import React, { useRef } from "react";
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

  const lastEntryRef = useRef<any>(null);

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
    const currentTags = currentEntry.tags || [];
    const isSelected = currentTags.includes(tag);

    if (isSelected) {
      handleAction({
        tags: currentTags.filter((t: string) => t !== tag),
      });
    } else {
      if (currentTags.length >= 3) return;

      handleAction({
        tags: [...currentTags, tag],
      });
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

  const getMoodClass = (mood: string, current: string) => {
    if (current !== mood) {
      return isDarkMode
        ? "bg-black border-white/[0.08] text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
        : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200";
    }

    if (mood === "good") {
      return isDarkMode
        ? "bg-green-950/30 border-green-800 text-green-400 ring-2 ring-green-900/50 ring-offset-1 ring-offset-black"
        : "bg-green-50 border-green-300 text-green-700 ring-2 ring-green-100 ring-offset-1";
    }

    if (mood === "neutral") {
      return isDarkMode
        ? "bg-white/[0.04] border-white/[0.12] text-white ring-2 ring-white/[0.08] ring-offset-1 ring-offset-black"
        : "bg-gray-100 border-gray-400 text-gray-800 ring-2 ring-gray-100 ring-offset-1";
    }

    return isDarkMode
      ? "bg-red-950/30 border-red-800 text-red-400 ring-2 ring-red-900/50 ring-offset-1 ring-offset-black"
      : "bg-red-50 border-red-300 text-red-700 ring-2 ring-red-100 ring-offset-1";
  };

  const getEnergyClass = (energy: string, current: string) => {
    if (current !== energy) {
      return isDarkMode
        ? "bg-black border-white/[0.08] text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
        : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200";
    }

    if (energy === "high") {
      return isDarkMode
        ? "bg-emerald-950/30 border-emerald-800 text-emerald-400 ring-2 ring-emerald-900/50 ring-offset-1 ring-offset-black"
        : "bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-100 ring-offset-1";
    }

    if (energy === "medium") {
      return isDarkMode
        ? "bg-orange-950/30 border-orange-800 text-orange-400 ring-2 ring-orange-900/50 ring-offset-1 ring-offset-black"
        : "bg-orange-50 border-orange-300 text-orange-700 ring-2 ring-orange-100 ring-offset-1";
    }

    return isDarkMode
      ? "bg-red-950/30 border-red-800 text-red-400 ring-2 ring-red-900/50 ring-offset-1 ring-offset-black"
      : "bg-red-50 border-red-300 text-red-700 ring-2 ring-red-100 ring-offset-1";
  };

  const getSleepClass = (sleep: string, current: string) => {
    if (current !== sleep) {
      return isDarkMode
        ? "bg-black border-white/[0.08] text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
        : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200";
    }

    if (sleep === "good") {
      return isDarkMode
        ? "bg-indigo-950/30 border-indigo-800 text-indigo-400 ring-2 ring-indigo-900/50 ring-offset-1 ring-offset-black"
        : "bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-100 ring-offset-1";
    }

    if (sleep === "average") {
      return isDarkMode
        ? "bg-white/[0.04] border-white/[0.12] text-white ring-2 ring-white/[0.08] ring-offset-1 ring-offset-black"
        : "bg-gray-100 border-gray-400 text-gray-800 ring-2 ring-gray-100 ring-offset-1";
    }

    return isDarkMode
      ? "bg-red-950/30 border-red-800 text-red-400 ring-2 ring-red-900/50 ring-offset-1 ring-offset-black"
      : "bg-red-50 border-red-300 text-red-700 ring-2 ring-red-100 ring-offset-1";
  };

  const baseTextareaClass = `w-full min-h-[46px] max-h-40 resize-none overflow-hidden border rounded-xl px-4 py-3 text-sm font-medium leading-relaxed outline-none transition-colors shadow-sm ${
    isDarkMode
      ? "bg-black border-white/[0.08] text-white focus:bg-white/[0.03] focus:border-orange-500/50 placeholder-zinc-600"
      : "bg-gray-50 border-gray-200 text-gray-800 focus:bg-white focus:border-orange-400 placeholder-gray-400"
  }`;

  const dividerClass = `my-7 border-t ${
    isDarkMode ? "border-white/[0.08]" : "border-gray-200"
  }`;

  const isReadyToLock =
    currentEntry.mood && currentEntry.energy && currentEntry.sleep;

  return (
    <div
      className={`border rounded-[24px] p-6 shadow-sm mt-6 transition-colors ${
        isDarkMode ? "bg-black border-white/[0.08]" : "bg-white border-gray-200"
      }`}
    >
      <div
        className={`flex items-center justify-between mb-6 pb-4 border-b ${
          isDarkMode ? "border-white/[0.08]" : "border-gray-100"
        }`}
      >
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Daily Behavior Log
        </span>

        {lastEntryRef.current && (
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 text-[10px] font-bold text-orange-500 hover:text-orange-600 uppercase tracking-widest transition-colors"
          >
            <Undo size={12} /> Undo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-2">
        <div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction({ mood: "good" })}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getMoodClass(
                "good",
                currentEntry.mood
              )}`}
            >
              <Smile size={20} />
              <span className="text-[10px] font-bold uppercase">Good</span>
            </button>

            <button
              onClick={() => handleAction({ mood: "neutral" })}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getMoodClass(
                "neutral",
                currentEntry.mood
              )}`}
            >
              <Meh size={20} />
              <span className="text-[10px] font-bold uppercase">Neutral</span>
            </button>

            <button
              onClick={() => handleAction({ mood: "bad" })}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getMoodClass(
                "bad",
                currentEntry.mood
              )}`}
            >
              <Frown size={20} />
              <span className="text-[10px] font-bold uppercase">Low</span>
            </button>
          </div>
        </div>

        <div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction({ energy: "high" })}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getEnergyClass(
                "high",
                currentEntry.energy
              )}`}
            >
              <BatteryFull size={20} />
              <span className="text-[10px] font-bold uppercase">High</span>
            </button>

            <button
              onClick={() => handleAction({ energy: "medium" })}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getEnergyClass(
                "medium",
                currentEntry.energy
              )}`}
            >
              <BatteryMedium size={20} />
              <span className="text-[10px] font-bold uppercase">Med</span>
            </button>

            <button
              onClick={() => handleAction({ energy: "low" })}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getEnergyClass(
                "low",
                currentEntry.energy
              )}`}
            >
              <Battery size={20} />
              <span className="text-[10px] font-bold uppercase">Low</span>
            </button>
          </div>
        </div>

        <div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction({ sleep: "good" })}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getSleepClass(
                "good",
                currentEntry.sleep
              )}`}
            >
              <Moon size={20} />
              <span className="text-[10px] font-bold uppercase">Good</span>
            </button>

            <button
              onClick={() => handleAction({ sleep: "average" })}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getSleepClass(
                "average",
                currentEntry.sleep
              )}`}
            >
              <Cloud size={20} />
              <span className="text-[10px] font-bold uppercase">Avg</span>
            </button>

            <button
              onClick={() => handleAction({ sleep: "poor" })}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${getSleepClass(
                "poor",
                currentEntry.sleep
              )}`}
            >
              <CloudRain size={20} />
              <span className="text-[10px] font-bold uppercase">Poor</span>
            </button>
          </div>
        </div>
      </div>

      <hr className={dividerClass} />

      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-5">
        What happened today?
      </span>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
            Biggest Win
          </label>
          <textarea
            rows={1}
            value={currentEntry.win || ""}
            onInput={(e) => resizeTextarea(e.currentTarget)}
            onChange={(e) =>
              handleTextareaChange(e, {
                win: e.target.value,
              })
            }
            placeholder="What went right today?..."
            className={baseTextareaClass}
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
            Biggest Friction
          </label>
          <textarea
            rows={1}
            value={(currentEntry.frictions && currentEntry.frictions[0]) || ""}
            onInput={(e) => resizeTextarea(e.currentTarget)}
            onChange={(e) =>
              handleTextareaChange(e, {
                frictions: e.target.value ? [e.target.value] : [],
              })
            }
            placeholder="What held you back?..."
            className={baseTextareaClass}
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
            Today's Lesson
          </label>
          <textarea
            rows={1}
            value={currentEntry.learning || ""}
            onInput={(e) => resizeTextarea(e.currentTarget)}
            onChange={(e) =>
              handleTextareaChange(e, {
                learning: e.target.value,
              })
            }
            placeholder="What did today teach you?..."
            className={baseTextareaClass}
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
            Tomorrow Adjustment
          </label>
          <textarea
            rows={1}
            value={currentEntry.improvement || ""}
            onInput={(e) => resizeTextarea(e.currentTarget)}
            onChange={(e) =>
              handleTextareaChange(e, {
                improvement: e.target.value,
              })
            }
            placeholder="What will you do differently?..."
            className={baseTextareaClass}
          />
        </div>
      </div>

      <hr className={dividerClass} />

      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
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
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                isSelected
                  ? isDarkMode
                    ? "bg-orange-950/40 text-orange-400 border-orange-900/50"
                    : "bg-orange-50 text-orange-700 border-orange-200 shadow-sm"
                  : isDisabled
                  ? isDarkMode
                    ? "bg-black opacity-30 text-gray-700 border-white/[0.08] cursor-not-allowed"
                    : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                  : isDarkMode
                  ? "bg-black text-zinc-400 border-white/[0.08] hover:bg-white/[0.03]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <hr className={dividerClass} />

      <div className="flex justify-end pt-2">
        <button
          onClick={lockCurrentDay}
          disabled={!isReadyToLock}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
            isReadyToLock
              ? "bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
              : isDarkMode
              ? "bg-white/[0.03] border border-white/[0.06] text-zinc-600 cursor-not-allowed"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Lock size={16} />
          {isReadyToLock
            ? "Finalize & Lock Day"
            : "Set Mood, Energy, & Sleep to Lock"}
        </button>
      </div>
    </div>
  );
}