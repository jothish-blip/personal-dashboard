"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useFocusSystem } from "../../engine/useFocusSystem";
import { Distraction } from "../../types/types";
import { useTheme } from "@/theme/ThemeProvider";

const REASONS = [
  { id: "phone", label: "📱 Phone (scrolling)" },
  { id: "social", label: "🌐 Social media" },
  { id: "thought", label: "🧠 Random thoughts" },
  { id: "task_switch", label: "🔄 Task switching" },
  { id: "noise", label: "🔊 Environment" },
  { id: "fatigue", label: "😴 Low energy" },
];

type Insights = {
  topReason: string | null;
  stability: number;
  lastTime: string | null;
  avgGap: number;
};

const computeInsights = (distractions: Distraction[], distractionStreak: number): Insights => {
  const count = distractions.length;
  if (count === 0) {
    return { topReason: null, stability: 100, lastTime: null, avgGap: 0 };
  }

  const counts = distractions.reduce<Record<string, number>>((acc, d) => {
    acc[d.reason] = (acc[d.reason] || 0) + 1;
    return acc;
  }, {});

  const sortedCounts = Object.entries(counts) as [string, number][];
  sortedCounts.sort((a, b) => b[1] - a[1]);

  const topReason = sortedCounts.length > 0 ? sortedCounts[0][0] : null;

  // Stability computation (Focus Trend)
  const stability = Math.max(0, 100 - count * 8 - distractionStreak * 5);

  const lastItem = distractions[count - 1];
  const lastTime = lastItem
    ? new Date(lastItem.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Average gap computation
  let avgGap = 0;
  if (count > 1) {
    const first = distractions[0].timestamp;
    const last = distractions[count - 1].timestamp;
    avgGap = Math.round(((last - first) / 60000) / (count - 1));
  }

  return { topReason, stability, lastTime, avgGap };
};

export default function DistractionTracker() {
  const { distractions = [], addDistraction, undoDistraction, isActive } = useFocusSystem();
  const { isDarkMode } = useTheme();
  
  const [isLogging, setIsLogging] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [bumpAnim, setBumpAnim] = useState(false);
  
  const [riskAlert, setRiskAlert] = useState(false);
  const [timeSinceLast, setTimeSinceLast] = useState(0);
  const [mounted, setMounted] = useState(false);

  const count = distractions.length;

  // Handle client hydration for Portal safety
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const distractionStreak = useMemo(() => {
    if (distractions.length === 0) return 0;
    if (distractions.length === 1) return 1;

    let streak = 1;
    for (let i = distractions.length - 1; i > 0; i--) {
      const gap = (distractions[i].timestamp - distractions[i - 1].timestamp) / 60000;
      if (gap < 3) streak++;
      else break;
    }
    return streak;
  }, [distractions]);

  const insights = useMemo(
    () => computeInsights(distractions, distractionStreak), 
    [distractions, distractionStreak]
  );

  // Distraction Risk Prediction
  useEffect(() => {
    if (!isActive || insights.avgGap === 0 || distractions.length === 0) return;

    const last = distractions[distractions.length - 1]?.timestamp;
    if (!last) return;

    let timeout: NodeJS.Timeout;

    const interval = setInterval(() => {
      const now = Date.now();
      const gap = (now - last) / 60000;

      if (gap >= insights.avgGap - 1 && gap <= insights.avgGap) {
        setRiskAlert(true);
        timeout = setTimeout(() => setRiskAlert(false), 8000);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [distractions, insights.avgGap, isActive]);

  // Time Since Last Distraction Ticker
  useEffect(() => {
    if (count === 0 || !isActive) return;
    
    const updateTicker = () => {
      const lastTimestamp = distractions[distractions.length - 1]?.timestamp;
      if (lastTimestamp) {
        setTimeSinceLast(Math.floor((Date.now() - lastTimestamp) / 1000));
      }
    };

    updateTicker(); // Initial paint
    const interval = setInterval(updateTicker, 1000);
    
    return () => clearInterval(interval);
  }, [distractions, count, isActive]);

  // Strict Screen and Scroll Lock for both body and documentElement
  useEffect(() => {
    if (!isLogging) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyTouchAction = document.body.style.touchAction;
    const originalDocOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.touchAction = originalBodyTouchAction;
      document.documentElement.style.overflow = originalDocOverflow;
    };
  }, [isLogging]);

  // Behavior Feedback Tone
  const getWarning = () => {
    if (count === 0) {
      return { badge: null, text: "Focused" };
    }
    if (count < 3) {
      return { badge: "Minor shift", text: "Small interruption logged." };
    }
    if (count < 5) {
      return { badge: "Attention shifted", text: "Take a moment to refocus." };
    }
    return { badge: "Frequent interruptions", text: "Consider a short reset." };
  };
  const warning = getWarning();

  // Recovery State Logic
  const getRecoveryState = () => {
    if (count === 0) return "Stable";
    if (recoveryMode) return "Recovering";
    if (timeSinceLast < 120) return "Regaining flow";
    return "Stable";
  };

  // --- ACTIONS ---
  const handleLogDistraction = (reason: string) => {
    addDistraction(reason);
    setIsLogging(false);
    
    setTimeSinceLast(0);
    
    setBumpAnim(true);
    setRecoveryMode(true);
    
    setTimeout(() => setBumpAnim(false), 300);
    
    const recoveryTime = Math.min(15000, (count + 1) * 3000);
    setTimeout(() => setRecoveryMode(false), recoveryTime); 
  };

  useEffect(() => {
    if (!isActive) {
      setIsLogging(false);
      setRecoveryMode(false);
    }
  }, [isActive]);

  return (
    <div className={`p-4 md:p-5 rounded-2xl shadow-sm flex flex-col gap-4 transition-all duration-500 relative overflow-hidden border ${
      isDarkMode ? "bg-black" : "bg-white"
    } ${
      recoveryMode 
        ? (isDarkMode ? "border-orange-500/50 bg-orange-500/10 ring-2 ring-orange-500/20" : "border-orange-400 bg-orange-50/30 ring-2 ring-orange-100")
        : (isDarkMode ? "border-white/[0.04]" : "border-gray-200")
    }`}>
      
      {/* Predictive Risk Alert UI */}
      {riskAlert && (
        <div className={`absolute top-0 left-0 w-full px-4 py-1.5 text-xs font-semibold animate-in slide-in-from-top-4 flex justify-center items-center gap-2 z-10 shadow-sm backdrop-blur-md border-b ${
          isDarkMode ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "bg-orange-50 border-orange-100 text-orange-600"
        }`}>
          <span className="animate-pulse">⚠️</span> Take a moment to reset attention.
        </div>
      )}

      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${riskAlert ? 'mt-4' : ''}`}>
        
        {/* LEFT INFO */}
        <div className="flex-1" title={insights.topReason ? `You mostly get distracted by ${insights.topReason}` : undefined}>
          
          <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            Focus Insights
            {warning.badge && (
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                count >= 5 
                  ? (isDarkMode ? "bg-orange-950/40 text-orange-400" : "bg-orange-100 text-orange-700")
                  : (isDarkMode ? "bg-black border border-white/[0.04] text-zinc-400" : "bg-gray-100 text-gray-600")
              }`}>
                {warning.badge}
              </span>
            )}
          </h3>
          
          <div className={`text-xs mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 ${isDarkMode ? "text-zinc-400" : "text-gray-500"}`}>
            <div className="flex items-center gap-1">
              <span className={`inline-block transition-transform duration-200 ${bumpAnim ? 'scale-150 text-orange-500 font-bold' : 'scale-100'}`}>
                {count}
              </span>
              <span>{count === 1 ? "break" : "breaks"} in focus</span>
            </div>
            
            {/* Streak Indicator */}
            {distractionStreak >= 2 && (
              <div className={`font-bold flex items-center gap-1 ${isDarkMode ? "text-orange-400" : "text-orange-500"}`}>
                🔥 {distractionStreak} slip-ups in a row
              </div>
            )}
            
            {count > 0 && !recoveryMode && (
              <button 
                onClick={() => undoDistraction()}
                className={`underline text-[10px] transition-colors w-fit sm:ml-1 ${
                  isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-700"
                }`}
              >
                Undo last
              </button>
            )}
          </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap items-center justify-end gap-2">

            {!isLogging && !recoveryMode && (
              <button
                onClick={() => setIsLogging(true)}
                disabled={!isActive}
                className={`
                  px-5 py-3 md:px-4 md:py-2 text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm border
                  ${isActive 
                    ? (isDarkMode ? "bg-orange-950/30 text-orange-400 border-orange-900/50 hover:bg-orange-900/40" : "bg-orange-50 text-orange-600 hover:bg-orange-100 hover:shadow-md border-orange-100") 
                    : (isDarkMode ? "bg-black text-zinc-600 cursor-not-allowed border-white/[0.04]" : "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100")}
                `}
              >
                What pulled your attention?
              </button>
            )}

            {isLogging && (
              <div className={`hidden md:flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200 p-1.5 rounded-xl border ${
                isDarkMode ? "bg-black border-white/[0.04] shadow-none" : "bg-gray-50 border-gray-100 shadow-inner"
              }`}>
                <span className={`text-xs font-bold uppercase tracking-wider ml-2 mr-1 ${isDarkMode ? "text-zinc-500" : "text-gray-500"}`}>Why?</span>
                {REASONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleLogDistraction(r.label)}
                    className={`px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all active:scale-95 shadow-sm ${
                      isDarkMode ? "bg-black border-white/[0.04] text-zinc-300 hover:border-white/[0.06] hover:bg-white/[0.04]" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
                <button
                  onClick={() => setIsLogging(false)}
                  className={`px-2 py-1.5 text-xs font-bold ml-1 transition-colors ${
                    isDarkMode ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  ✕
                </button>
              </div>
            )}

            {recoveryMode && (
              <div className={`px-5 py-3 md:py-2 text-sm font-bold rounded-xl animate-in zoom-in duration-300 flex items-center gap-2 shadow-sm border ${
                isDarkMode ? "bg-orange-950/30 text-orange-400 border-orange-900/50" : "bg-orange-100 text-orange-700 border-orange-200"
              }`}>
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                Refocused
              </div>
            )}
          </div>
          
          {count >= 3 && !isLogging && !recoveryMode && isActive && (
             <span className={`text-[10px] font-bold mr-1 ${isDarkMode ? "text-orange-400" : "text-orange-500"}`}>
               Frequent interruptions detected.
             </span>
          )}
        </div>
      </div>

      {/* MOBILE LOGGING SHEET PORTAL CONTAINER */}
      {isLogging && mounted && createPortal(
        <div 
          className={`fixed inset-0 z-[999999] flex flex-col justify-end md:hidden animate-in fade-in duration-200 ${
            isDarkMode ? "bg-black" : "bg-black/80"
          }`}
          onTouchMove={(e) => e.stopPropagation()}
          onClick={() => setIsLogging(false)}
        >
          <div 
            className={`rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom-full duration-300 border-t ${
              isDarkMode ? "bg-black shadow-[0_-10px_40px_rgba(0,0,0,0.8)] border-white/[0.04]" : "bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-gray-100"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex justify-between items-center mb-5 sticky top-0 z-10 pt-2 pb-2 ${isDarkMode ? "bg-black" : "bg-white"}`}>
              <div className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Why did you lose focus?</div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLogging(false);
                }}
                className={`rounded-full w-8 h-8 flex items-center justify-center transition-colors border ${
                  isDarkMode ? "text-zinc-400 hover:text-zinc-300 bg-black hover:bg-white/[0.04] border-white/[0.04]" : "text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 border-transparent"
                }`}
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleLogDistraction(r.label)}
                  className={`py-4 px-3 text-sm font-semibold rounded-xl border transition-all shadow-sm active:scale-95 ${
                    isDarkMode ? "bg-black border-white/[0.04] text-zinc-300 hover:border-white/[0.06] active:bg-white/[0.04]" : "bg-gray-50 border-gray-200 text-gray-800 hover:border-gray-300 active:bg-gray-100"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* INTELLIGENCE METRICS FOOTER */}
      <div className={`pt-3 mt-1 border-t transition-opacity duration-500 ${recoveryMode ? "opacity-40" : "opacity-100"} ${isDarkMode ? "border-white/[0.04]" : "border-gray-100"}`}>
        
        <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
          <div className={`text-xs font-medium flex items-center gap-3 ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>
            <span>Focus Trend: <span className={`font-bold ${insights.stability > 70 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-orange-400' : 'text-orange-600')}`}>{insights.stability}%</span></span>
            
            {count > 0 && (
              <>
                <span className={isDarkMode ? "text-zinc-600" : "text-gray-300"}>|</span>
                <span>State: <span className={`font-bold ${getRecoveryState() === 'Stable' ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-orange-400' : 'text-orange-500')}`}>{getRecoveryState()}</span></span>
              </>
            )}
          </div>
          
          <div className={`text-xs font-bold ${count < 3 ? (isDarkMode ? "text-zinc-500" : "text-gray-500") : (isDarkMode ? "text-orange-400" : "text-orange-500")}`}>
            {warning.text}
          </div>
        </div>

        {count > 0 && (
          <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] p-2.5 rounded-lg border mt-2 ${
            isDarkMode ? "text-zinc-400 bg-black border-white/[0.04]" : "text-gray-500 bg-gray-50/80 border-gray-100"
          }`}>
            <div className="flex items-center gap-1.5">
              <span className={`uppercase tracking-wider font-bold ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>Top distraction:</span> 
              <span className={`font-bold px-1.5 py-0.5 rounded border shadow-sm ${
                isDarkMode ? "text-zinc-300 bg-black border-white/[0.04]" : "text-gray-700 bg-white border-gray-100"
              }`}>{insights.topReason}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className={`uppercase tracking-wider font-bold ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>Last slip:</span>
              <span className={`font-semibold ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>{Math.floor(timeSinceLast / 60)}m ago</span>
            </div>
            
            {insights.avgGap > 0 && (
              <div className="flex items-center gap-1.5">
                <span className={`uppercase tracking-wider font-bold ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>Pace:</span>
                <span className={`font-semibold ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>Every {insights.avgGap}m</span>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}