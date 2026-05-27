"use client";

import React, { useState, useMemo } from "react";
import { useFocusSystem } from "../../engine/useFocusSystem";
import { FocusSession } from "../../types/types";
import { Target } from "lucide-react";

// 🔥 UPDATE THIS PATH to match where your ThemeProvider actually lives!
import { useTheme } from "@/theme/ThemeProvider";

export default function TaskSelector() {
  const { activeTaskId, setActiveTask, isActive, currentSession, sessions, dailyGoal, updateDailyGoal } = useFocusSystem();
  
  // Consuming your local app theme state to perfectly sync light/dark mode
  const { isDarkMode } = useTheme(); 
  
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
    const map = new Map<
      string,
      {
        count: number;
        latest: number;
      }
    >();
  
    (sessions as FocusSession[]).forEach(
      (s: FocusSession) => {
        // 🔥 THE FIX: Fallback to taskId if taskTitle is missing
        const title = s.taskTitle || s.taskId || "";
        
        if (!title) return;
  
        const cleanTitle = title
          .trim()
          .replace(/\s+/g, " ");
  
        if (
          cleanTitle === "Untitled Focus" ||
          cleanTitle === "Archived Focus"
        )
          return;
  
        const normalized =
          cleanTitle.toLowerCase();
  
        const existing =
          map.get(normalized);
  
      map.set(normalized, {
      count:
     (existing?.count || 0) + 1,

      latest: Math.max(
      existing?.latest || 0,
      s.startTime ||
       Date.now()
      ),
      });
      }
    );
    
    
  
    return Array.from(map.entries())
      .sort((a, b) => {
        // Recent first
        if (
          b[1].latest !== a[1].latest
        ) {
          return (
            b[1].latest -
            a[1].latest
          );
        }
        
  
        // Then by session count
        return (
          b[1].count -
          a[1].count
        );
      })
      .map(([task, meta]) => [
        task
          .split(" ")
          .map(
            word =>
              word.charAt(0).toUpperCase() +
              word.slice(1)
          )
          .join(" "),
        meta.count,
        meta.latest
      ]);
  }, [sessions]);

  const visibleHistory = showHistory ? intentHistory : intentHistory.slice(0, 3);
  const suggested = intentHistory[0]?.[0] as string | undefined;

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

  const getLastUsedText = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
  
    return `${days}d ago`;
  };

  return (
    <div className={`p-6 rounded-2xl border space-y-7 transition-all ${
      isDarkMode 
        ? "bg-black border-gray-800 shadow-none" 
        : "bg-gradient-to-br from-white via-gray-50 to-blue-50 border-gray-200 shadow-[0_6px_30px_rgba(0,0,0,0.05)]"
    }`}>
      
      {/* HEADER & STATUS */}
      <div className="flex justify-between items-center">
        <h2 className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
          <Target size={16} className={isDarkMode ? "text-gray-400" : "text-gray-500"} /> Current Intent
        </h2>
        <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all shadow-sm ${
          isActive 
            ? isDarkMode ? "bg-orange-500/8 text-orange-400 border border-orange-500/15" : "bg-orange-50 text-orange-700 border border-orange-200"
            : activeTaskId 
              ? isDarkMode ? "bg-green-500/8 text-green-400 border border-green-500/15" : "bg-green-50 text-green-700 border border-green-200"
              : isDarkMode ? "bg-white/[0.04] text-gray-400 border border-white/[0.08]" : "bg-gray-50 text-gray-500 border border-gray-200"
        }`}>
          {isActive ? "Locked" : activeTaskId ? "Ready" : "Pending"}
        </span>
      </div>

      {/* 🥇 HERO BLOCK: ACTIVE INTENT DISPLAY */}
      <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
        isActive 
          ? isDarkMode ? "bg-[#0a0500] border-orange-900/50 shadow-inner" : "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-inner"
          : activeTaskId
            ? isDarkMode ? "bg-white/[0.02] border-white/[0.08] shadow-sm" : "bg-gradient-to-br from-gray-50 to-white border-gray-200 shadow-sm"
            : isDarkMode ? "bg-black border-gray-800 shadow-sm" : "bg-white border-gray-100 shadow-sm"
      }`}>
        
        {/* Subtle top accent line for active tasks */}
        {isActive && (
          <div className="absolute top-0 left-0 h-[2px] w-full bg-orange-500/40" />
        )}

        <div className="flex justify-between items-center mb-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
            Active Intent
          </div>
          
          {isActive && (
            <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              isDarkMode ? "text-orange-400 bg-orange-500/10 border-orange-500/20" : "text-orange-600 bg-orange-100 border-orange-200"
            }`}>
              🔒 Locked during session
            </div>
          )}

          {activeTaskId && !isActive && (
            <button 
              onClick={() => setActiveTask(null)}
              className={`text-[10px] uppercase tracking-wider font-bold transition-colors ${
                isDarkMode ? "text-gray-500 hover:text-red-400" : "text-gray-400 hover:text-red-500"
              }`}
            >
              Clear
            </button>
          )}
        </div>

        <div className={`text-lg md:text-xl font-bold leading-snug break-words ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          {displayTask || "Choose what matters now"}
        </div>
        
        <div className={`text-xs mt-2 font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          {isActive
            ? "Focus locked for this session."
            : "Choose one thing worth focusing on."}
        </div>
      </div>

      {!isActive && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* USER INPUT LAYER */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={suggested ? `e.g., ${suggested}` : "What are you focusing on?"}
              disabled={isActive}
              className={`w-full min-h-[48px] sm:flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 shadow-sm text-sm transition-all font-medium ${
                isDarkMode 
                  ? "bg-[#0a0a0a] border-gray-800 focus:ring-orange-500/30 focus:border-orange-500/30 text-white disabled:bg-gray-900 disabled:text-gray-600 placeholder:text-gray-600" 
                  : "bg-white border-gray-200 focus:ring-orange-500/30 focus:border-orange-500/30 text-gray-900 disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-400"
              }`}
            />
            <button
              onClick={() => handleSetIntent()}
              disabled={isActive || taskInput.trim().length < 3}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 text-sm font-bold bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-30 transition-all active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.12)]"
            >
              Commit
            </button>
          </div>

          {/* 🎯 DAILY GOAL SETTING */}
          <div className={`flex items-center justify-between border rounded-xl px-4 py-3 shadow-sm ${
            isDarkMode ? "bg-black border-gray-800" : "bg-gradient-to-br from-gray-50 to-white border-gray-200"
          }`}>
            <div className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Daily Focus Goal
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={dailyGoal / 3600}
                onChange={(e) => updateDailyGoal(Number(e.target.value) * 3600)}
                className={`w-14 text-center text-base font-extrabold border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 transition-shadow ${
                  isDarkMode 
                    ? "bg-[#0a0a0a] border-gray-700 text-orange-400 focus:ring-orange-500/30" 
                    : "bg-white border-gray-200 text-orange-600 focus:ring-orange-500/30"
                }`}
                min={1}
                max={16}
              />
              <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>hrs</span>
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
                      className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all border active:scale-95 ${
                        isSelected 
                          ? isDarkMode
                            ? "bg-orange-500/15 text-orange-300 border-orange-500/20"
                            : "bg-orange-50 text-orange-600 border-orange-200"
                          : isDarkMode 
                            ? "bg-black text-gray-400 border-gray-700 hover:bg-gray-800 hover:border-gray-600" 
                            : "bg-white text-gray-600 border-gray-200 hover:bg-orange-50/50 hover:border-orange-200/50"
                      }`}
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
            <div className={`space-y-2 mt-2 pt-5 border-t ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Focus History
                </span>
                {intentHistory.length > 3 && (
                  <button
                    onClick={() => setShowHistory(prev => !prev)}
                    className={`text-[10px] font-bold transition-colors ${isDarkMode ? "text-gray-500 hover:text-white" : "text-gray-500 hover:text-black"}`}
                  >
                    {showHistory ? "Hide" : "Show All"}
                  </button>
                )}
              </div>
              
              <div className={`space-y-1.5 transition-all duration-300 ${showHistory ? "max-h-[200px] overflow-y-auto custom-scrollbar pr-1" : "max-h-[140px] overflow-hidden"}`}>
                {visibleHistory.map((item, i) => {
                  const task = item[0] as string;
                  const count = item[1] as number;
                  const latest = item[2] as number;
                  
                  return (
                    <div
                      key={i}
                      onClick={() => handleSetIntent(task)}
                      className={`flex justify-between items-center text-xs px-3 py-3 rounded-lg border transition-all cursor-pointer active:scale-[0.98] ${
                        activeTaskId === task
                          ? isDarkMode
                            ? "bg-orange-500/10 border-orange-500/20"
                            : "bg-orange-50 border-orange-200"
                          : isDarkMode
                          ? "bg-black hover:bg-white/[0.03] border-gray-800 hover:border-white/[0.08]"
                          : "bg-white hover:bg-orange-50 border-gray-100"
                      }`}
                    >
                      <div className="min-w-0">
                        <div
                          className={`font-semibold truncate ${
                            isDarkMode
                              ? "text-gray-300"
                              : "text-gray-700"
                          }`}
                        >
                          {task}
                        </div>
                    
                        <div className={`text-[10px] mt-1 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>
                          {count} session{count !== 1 ? "s" : ""} • {getLastUsedText(latest)}
                        </div>
                      </div>
                    
                      {activeTaskId === task && (
                        <div className="text-[10px] font-semibold text-orange-400">
                          Selected
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!showHistory && intentHistory.length > 3 && (
                <div 
                  className={`text-[10px] font-bold text-center mt-2 cursor-pointer transition-colors pt-1 ${isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`} 
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



