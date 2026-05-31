"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useFocusSystem } from "../../engine/useFocusSystem";
import { Distraction } from "../../types/types";

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
  
  const [isLogging, setIsLogging] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [bumpAnim, setBumpAnim] = useState(false);
  
  const [riskAlert, setRiskAlert] = useState(false);
  const [timeSinceLast, setTimeSinceLast] = useState(0);

  const count = distractions.length;

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
    <div className={`bg-white dark:bg-zinc-900 border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col gap-4 transition-all duration-500 relative overflow-hidden ${
      recoveryMode 
        ? "border-orange-400 bg-orange-50/30 ring-2 ring-orange-100 dark:border-orange-500/50 dark:bg-orange-500/10 dark:ring-orange-500/20" 
        : "border-gray-200 dark:border-white/[0.06]"
    }`}>
      
      {/* Predictive Risk Alert UI */}
      {riskAlert && (
        <div className="absolute top-0 left-0 w-full bg-orange-50 dark:bg-orange-500/20 border-b border-orange-100 dark:border-orange-500/30 px-4 py-1.5 text-xs text-orange-600 dark:text-orange-400 font-semibold animate-in slide-in-from-top-4 flex justify-center items-center gap-2 z-10 shadow-sm backdrop-blur-md">
          <span className="animate-pulse">⚠️</span> Take a moment to reset attention.
        </div>
      )}

      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${riskAlert ? 'mt-4' : ''}`}>
        
        {/* LEFT INFO */}
        <div className="flex-1" title={insights.topReason ? `You mostly get distracted by ${insights.topReason}` : undefined}>
          
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
            Focus Insights
            {warning.badge && (
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                count >= 5 
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" 
                  : "bg-gray-100 text-gray-600 dark:bg-white/[0.04] dark:text-white/60"
              }`}>
                {warning.badge}
              </span>
            )}
          </h3>
          
          <div className="text-xs text-gray-500 dark:text-white/50 mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1">
              <span className={`inline-block transition-transform duration-200 ${bumpAnim ? 'scale-150 text-orange-500 font-bold' : 'scale-100'}`}>
                {count}
              </span>
              <span>{count === 1 ? "break" : "breaks"} in focus</span>
            </div>
            
            {/* Streak Indicator */}
            {distractionStreak >= 2 && (
              <div className="text-orange-500 dark:text-orange-400 font-bold flex items-center gap-1">
                🔥 {distractionStreak} slip-ups in a row
              </div>
            )}
            
            {count > 0 && !recoveryMode && (
              <button 
                onClick={() => undoDistraction()}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline text-[10px] transition-colors w-fit sm:ml-1"
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
                  px-5 py-3 md:px-4 md:py-2 text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm
                  ${isActive 
                    ? "bg-orange-50 text-orange-600 hover:bg-orange-100 hover:shadow-md border border-orange-100 dark:bg-orange-500/10 dark:text-orange-500 dark:border-orange-500/20 dark:hover:bg-orange-500/20" 
                    : "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100 dark:bg-white/[0.02] dark:text-white/30 dark:border-white/[0.04]"}
                `}
              >
                What pulled your attention?
              </button>
            )}

            {isLogging && (
              <div className="hidden md:flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200 bg-gray-50 dark:bg-zinc-800 p-1.5 rounded-xl border border-gray-100 dark:border-white/[0.06] shadow-inner dark:shadow-none">
                <span className="text-xs font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider ml-2 mr-1">Why?</span>
                {REASONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleLogDistraction(r.label)}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:bg-zinc-900 dark:border-white/[0.06] dark:text-white/80 dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04] rounded-lg transition-all active:scale-95 shadow-sm"
                  >
                    {r.label}
                  </button>
                ))}
                <button
                  onClick={() => setIsLogging(false)}
                  className="px-2 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/80 ml-1 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            {recoveryMode && (
              <div className="px-5 py-3 md:py-2 text-sm font-bold text-orange-700 bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 rounded-xl animate-in zoom-in duration-300 flex items-center gap-2 shadow-sm border border-orange-200 dark:border-orange-500/20">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                Refocused
              </div>
            )}
          </div>
          
          {count >= 3 && !isLogging && !recoveryMode && isActive && (
             <span className="text-[10px] text-orange-500 dark:text-orange-400 font-bold mr-1">
               Frequent interruptions detected.
             </span>
          )}
        </div>
      </div>

      {/* MOBILE LOGGING SHEET */}
      {isLogging && (
        <div className="fixed inset-0 z-[9999] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex flex-col justify-end md:hidden animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-t-3xl p-5 pb-8 max-h-[75vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.4)] border-t border-gray-100 dark:border-white/[0.08]">
            <div className="flex justify-between items-center mb-5 sticky top-0 bg-white dark:bg-zinc-900 z-10 pt-2 pb-2">
              <div className="text-lg font-bold text-gray-900 dark:text-white/90">Why did you lose focus?</div>
              <button 
                onClick={() => setIsLogging(false)} 
                className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-white/60 dark:hover:text-white/90 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleLogDistraction(r.label)}
                  className="py-4 px-3 text-sm font-semibold rounded-xl bg-gray-50 border border-gray-200 text-gray-800 hover:border-gray-300 active:bg-gray-100 dark:bg-zinc-800 dark:border-white/[0.06] dark:text-white/80 dark:hover:border-white/[0.1] dark:active:bg-white/[0.04] active:scale-95 transition-all shadow-sm"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INTELLIGENCE METRICS FOOTER */}
      <div className={`pt-3 mt-1 border-t border-gray-100 dark:border-white/[0.06] transition-opacity duration-500 ${recoveryMode ? "opacity-40" : "opacity-100"}`}>
        
        <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
          <div className="text-xs font-medium text-gray-700 dark:text-white/70 flex items-center gap-3">
            <span>Focus Trend: <span className={`font-bold ${insights.stability > 70 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>{insights.stability}%</span></span>
            
            {count > 0 && (
              <>
                <span className="text-gray-300 dark:text-white/20">|</span>
                <span>State: <span className={`font-bold ${getRecoveryState() === 'Stable' ? 'text-green-600 dark:text-green-400' : 'text-orange-500 dark:text-orange-400'}`}>{getRecoveryState()}</span></span>
              </>
            )}
          </div>
          
          <div className={`text-xs font-bold ${count < 3 ? "text-gray-500 dark:text-white/50" : "text-orange-500 dark:text-orange-400"}`}>
            {warning.text}
          </div>
        </div>

        {count > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-gray-500 dark:text-white/50 bg-gray-50/80 dark:bg-zinc-800 p-2.5 rounded-lg border border-gray-100 dark:border-white/[0.06] mt-2">
            <div className="flex items-center gap-1.5">
              <span className="uppercase tracking-wider font-bold text-gray-400 dark:text-white/40">Top distraction:</span> 
              <span className="text-gray-700 dark:text-white/80 font-bold bg-white dark:bg-white/[0.04] px-1.5 py-0.5 rounded border border-gray-100 dark:border-white/[0.04] shadow-sm">{insights.topReason}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="uppercase tracking-wider font-bold text-gray-400 dark:text-white/40">Last slip:</span>
              <span className="text-gray-700 dark:text-white/80 font-semibold">{Math.floor(timeSinceLast / 60)}m ago</span>
            </div>
            
            {insights.avgGap > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="uppercase tracking-wider font-bold text-gray-400 dark:text-white/40">Pace:</span>
                <span className="text-gray-700 dark:text-white/80 font-semibold">Every {insights.avgGap}m</span>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}