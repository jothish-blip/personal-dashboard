"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useFocusSystem } from "./useFocusSystem";
import { FocusSession } from "./types"; // 🔥 Imported FocusSession for the TS fix

export default function TaskSelector() {
  // 🔥 Context consumption updated
  const { activeTaskId, setActiveTask, isActive, currentSession, sessions, dailyGoal, updateDailyGoal } = useFocusSystem();
  
  const [taskInput, setTaskInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  
  const [recentTasks, setRecentTasks] = useState<string[]>([
    "Deep Work", 
    "Admin & Emails", 
    "Learning & Research"
  ]);

  const displayTask = isActive && currentSession 
    ? currentSession.taskId 
    : activeTaskId;

  const intentHistory = useMemo(() => {
    const map = new Map<string, number>();

    // 🔥 TS FIX: explicitly typing 's' as FocusSession
    (sessions as FocusSession[]).forEach((s: FocusSession) => {
      if (!s.taskTitle || s.taskTitle === "Untitled Focus" || s.taskTitle === "Archived Focus") return;
      map.set(s.taskTitle, (map.get(s.taskTitle) || 0) + 1);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [sessions]);

  const visibleHistory = showHistory ? intentHistory : intentHistory.slice(0, 3);
  const suggested = intentHistory[0]?.[0];

  const handleSetIntent = (intentValue?: string) => {
    const valueToSet = intentValue !== undefined ? intentValue : taskInput;
    if (!valueToSet.trim()) return;

    const trimmed = valueToSet.trim();
    if (trimmed.length < 3) return;

    setActiveTask(trimmed);

    setRecentTasks((prev) => {
      const filtered = prev.filter(t => t.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...filtered].slice(0, 5);
    });

    setTaskInput(""); 
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSetIntent();
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 border border-gray-200 p-6 rounded-2xl shadow-[0_6px_30px_rgba(0,0,0,0.05)] space-y-6 transition-all">
      
      {/* HEADER & STATUS */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          🎯 Current Intent
        </h2>
        <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all shadow-sm ${
          isActive 
            ? "bg-orange-100 text-orange-700 border border-orange-200" 
            : activeTaskId 
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-gray-100 text-gray-500 border border-gray-200"
        }`}>
          {isActive ? "Locked" : activeTaskId ? "Ready" : "Pending"}
        </span>
      </div>

      {/* 🥇 HERO BLOCK: ACTIVE INTENT DISPLAY */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isActive 
          ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-inner"
          : activeTaskId
            ? "bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm"
            : "bg-white border-gray-100 shadow-sm"
      }`}>
        <div className="flex justify-between items-center mb-2">
          <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">
            Active Intent
          </div>
          
          {isActive && (
            <div className="text-[10px] text-orange-600 font-bold animate-pulse uppercase tracking-wider bg-orange-100 px-2 py-0.5 rounded border border-orange-200">
              🔒 Locked during session
            </div>
          )}

          {activeTaskId && !isActive && (
            <button 
              onClick={() => setActiveTask(null)}
              className="text-[10px] uppercase tracking-wider font-bold text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="text-lg md:text-xl font-bold text-gray-900 leading-snug break-words">
          {displayTask || "No intent declared"}
        </div>
        
        <div className="text-xs text-gray-500 mt-2 font-medium">
          {isActive
            ? "Execution locked. Stay committed to the target."
            : "Define one clear goal before starting."}
        </div>
      </div>

      {!isActive && (
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* USER INPUT LAYER */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={suggested ? `e.g., ${suggested}` : "What is your primary focus?"}
              disabled={isActive}
              className="w-full sm:flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 bg-white shadow-sm text-sm disabled:bg-gray-50 disabled:text-gray-400 transition-all placeholder:text-gray-400 font-medium"
            />
            <button
              onClick={() => handleSetIntent()}
              disabled={isActive || taskInput.trim().length < 3}
              className="w-full sm:w-auto px-6 py-3 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-30 transition-all active:scale-95 shadow-md"
            >
              Commit
            </button>
          </div>

          {/* 🎯 DAILY GOAL SETTING - NOW USING GLOBAL CONTEXT */}
          <div className="flex items-center justify-between bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl px-4 py-3 shadow-sm">
            <div className="text-xs text-green-700 font-bold uppercase tracking-wider">
              Daily Target
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={dailyGoal / 3600}
                onChange={(e) => updateDailyGoal(Number(e.target.value) * 3600)}
                className="w-12 text-center text-sm font-bold bg-white border border-green-200 text-green-800 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-300 transition-shadow"
                min={1}
                max={16}
              />
              <span className="text-xs text-green-600 font-bold uppercase tracking-widest">hrs</span>
            </div>
          </div>

          {/* RECENT / QUICK SUGGESTIONS */}
          {recentTasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Quick Start
                </span>
                {recentTasks.length > 3 && (
                  <span className="text-[10px] text-gray-400 font-medium">Last used</span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {recentTasks.map((task, idx) => {
                  const isSelected = activeTaskId === task;
                  return (
                    <button
                      key={idx}
                      disabled={isActive}
                      onClick={() => handleSetIntent(task)}
                      className={`
                        px-3 py-1.5 text-xs font-bold rounded-full transition-all border active:scale-95
                        ${isSelected 
                          ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                          : "bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-200"
                        }
                      `}
                    >
                      {task}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🧠 FOCUS HISTORY */}
          {intentHistory.length > 0 && (
            <div className="space-y-2 mt-2 pt-5 border-t border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Focus History
                </span>
                {intentHistory.length > 3 && (
                  <button
                    onClick={() => setShowHistory(prev => !prev)}
                    className="text-[10px] font-bold text-gray-500 hover:text-black transition-colors"
                  >
                    {showHistory ? "Hide" : "Show All"}
                  </button>
                )}
              </div>
              
              <div className={`space-y-1.5 transition-all duration-300 ${showHistory ? "max-h-[200px] overflow-y-auto custom-scrollbar pr-1" : "max-h-[140px] overflow-hidden"}`}>
                {visibleHistory.map(([task, count], i) => (
                  <div 
                    key={i}
                    className="flex justify-between items-center text-xs px-3 py-2.5 rounded-lg bg-white hover:bg-orange-50 border border-gray-100 transition-all cursor-pointer hover:shadow-sm active:scale-[0.98]"
                    onClick={() => handleSetIntent(task)}
                  >
                    <span className="font-semibold text-gray-700 truncate pr-3">{task}</span>
                    <span className="text-orange-600 text-[10px] font-bold tracking-wide whitespace-nowrap bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                      {count} session{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>

              {!showHistory && intentHistory.length > 3 && (
                <div 
                  className="text-[10px] font-bold text-gray-400 text-center mt-2 cursor-pointer hover:text-gray-600 transition-colors pt-1" 
                  onClick={() => setShowHistory(true)}
                >
                  +{intentHistory.length - 3} more
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}