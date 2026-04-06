"use client";

import React, { useState, useEffect } from "react";
import { useFocusSystem } from "./useFocusSystem";

export default function TaskSelector() {
  const { activeTaskId, setActiveTask, isActive, currentSession } = useFocusSystem();
  
  // Local state for the input field
  const [taskInput, setTaskInput] = useState("");
  
  // Smart defaults / Recent tasks (Can later be wired to localStorage or DB)
  const [recentTasks, setRecentTasks] = useState<string[]>([
    "Deep Work", 
    "Admin & Emails", 
    "Learning & Research"
  ]);

  // Determine what to display: Locked session task vs. Staging task
  const displayTask = isActive && currentSession 
    ? currentSession.taskId 
    : activeTaskId;

  // Handle setting a new intent
  const handleSetIntent = (intentValue?: string) => {
    const valueToSet = intentValue !== undefined ? intentValue : taskInput;
    if (!valueToSet.trim()) return;

    const trimmed = valueToSet.trim();
    setActiveTask(trimmed);

    // Add to recent tasks (prevent duplicates, keep last 5)
    setRecentTasks((prev) => {
      const filtered = prev.filter(t => t.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...filtered].slice(0, 5);
    });

    setTaskInput(""); // Clear input after setting
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSetIntent();
    }
  };

  return (
    <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm flex flex-col gap-5 transition-all">
      
      {/* HEADER & STATUS */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          🎯 Current Intent
        </h2>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
          isActive 
            ? "bg-amber-100 text-amber-700" 
            : activeTaskId 
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
        }`}>
          {isActive ? "🔒 Locked" : activeTaskId ? "Ready" : "Pending"}
        </span>
      </div>

      {/* ACTIVE INTENT DISPLAY */}
      <div className={`p-4 rounded-xl border transition-all ${
        isActive 
          ? "bg-gray-50 border-gray-200 shadow-inner" 
          : "bg-white border-gray-100 shadow-sm"
      }`}>
        <div className="flex justify-between items-start gap-4">
          <div className="text-sm md:text-base font-semibold text-gray-900 break-words">
            {displayTask || "No intent declared."}
          </div>
          
          {/* Allow clearing the intent if it's set but the session hasn't started yet */}
          {activeTaskId && !isActive && (
            <button 
              onClick={() => setActiveTask(null)}
              className="text-[10px] uppercase tracking-wider font-bold text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1.5">
          {isActive
            ? "Execution locked. Stay committed to the target."
            : "Define your singular intent before initializing."}
        </div>
      </div>

      {/* INPUT & RECENTS (Hides completely during active session to prevent distraction) */}
      {!isActive && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* USER INPUT LAYER */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What is your primary focus?"
              disabled={isActive}
              className="flex-1 px-4 py-3 sm:py-2 sm:px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 disabled:bg-gray-50 disabled:text-gray-400 transition-all placeholder:text-gray-400"
            />
            <button
              onClick={() => handleSetIntent()}
              disabled={isActive || !taskInput.trim()}
              className="px-6 py-3 sm:px-5 sm:py-2 text-base sm:text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-gray-900 transition-all active:scale-95 shadow-sm"
            >
              Commit
            </button>
          </div>

          {/* RECENT / QUICK SUGGESTIONS */}
          {recentTasks.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Recent / Quick
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
                        px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all border active:scale-95
                        ${isSelected 
                          ? "bg-gray-100 text-gray-900 border-gray-300 shadow-inner" 
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-sm"
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

        </div>
      )}

    </div>
  );
}