"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useFocusSystem } from "./useFocusSystem";
import { Distraction } from "./types";

const REASONS = [
  { id: "phone", label: "📱 Phone (scrolling)" },
  { id: "social", label: "🌐 Social media" },
  { id: "thought", label: "🧠 Random thoughts" },
  { id: "task_switch", label: "🔄 Task switching" },
  { id: "noise", label: "🔊 Environment" },
  { id: "fatigue", label: "😴 Low energy" },
];

// 🔥 IMPROVEMENT 1: Strong typing for insights
type Insights = {
  topReason: string | null;
  stability: number;
  lastTime: string | null;
  avgGap: number;
};

// 🔥 IMPROVEMENT 3: Extract logic outside the component for clean architecture
const computeInsights = (distractions: Distraction[], distractionStreak: number): Insights => {
  const count = distractions.length;
  if (count === 0) {
    return { topReason: null, stability: 100, lastTime: null, avgGap: 0 };
  }

  // ✅ FIX: Strong typing on reduce, no implicit any
  const counts = distractions.reduce<Record<string, number>>((acc, d) => {
    acc[d.reason] = (acc[d.reason] || 0) + 1;
    return acc;
  }, {});

  // 🔥 IMPROVEMENT 6: Strong typing for entries
  const sortedCounts = Object.entries(counts) as [string, number][];
  sortedCounts.sort((a, b) => b[1] - a[1]);

  const topReason = sortedCounts.length > 0 ? sortedCounts[0][0] : null;

  // Stability computation
  const stability = Math.max(0, 100 - count * 8 - distractionStreak * 5);

  // 🔥 IMPROVEMENT 7: Defensive coding for the last item
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
  const [lastReason, setLastReason] = useState<string | null>(null);
  
  const [riskAlert, setRiskAlert] = useState(false);
  const [recoveryScore, setRecoveryScore] = useState(100);
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

  // 🔥 IMPROVEMENT 2: Memoize insights calculation
  const insights = useMemo(
    () => computeInsights(distractions, distractionStreak), 
    [distractions, distractionStreak]
  );

  // Distraction Risk Prediction
  useEffect(() => {
    // 🔥 IMPROVEMENT 4: Safety checks
    if (!isActive || insights.avgGap === 0 || distractions.length === 0) return;

    const last = distractions[distractions.length - 1]?.timestamp;
    if (!last) return;

    let timeout: NodeJS.Timeout; // 🔥 IMPROVEMENT 5: Prevent memory leaks

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

  // Focus Recovery Score Ticker
  useEffect(() => {
    if (!isActive || count === 0) return;
    const interval = setInterval(() => {
      setRecoveryScore(prev => Math.min(100, prev + 5));
    }, 3000);
    return () => clearInterval(interval);
  }, [isActive, count]);

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
    if (count === 0) return { badge: null, text: "Locked in 🔒" };
    if (count < 3) return { badge: "Minor slips", text: "Watch your discipline." };
    if (count < 5) return { badge: "Drifting", text: "⚠️ Refocus now. You're drifting." };
    return { badge: "Critical", text: "🚨 You are losing control. Lock in." };
  };
  const warning = getWarning();

  // --- ACTIONS ---
  const handleLogDistraction = (reason: string) => {
    addDistraction(reason);
    setLastReason(reason);
    setIsLogging(false);
    
    setRecoveryScore(0);
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
    <div className={`bg-white border p-4 md:p-5 rounded-xl shadow-sm flex flex-col gap-4 transition-all duration-500 relative overflow-hidden ${
      recoveryMode ? "border-amber-400 bg-amber-50/30 ring-4 ring-amber-100" : "border-gray-200"
    }`}>
      
      {/* Predictive Risk Alert UI */}
      {riskAlert && (
        <div className="absolute top-0 left-0 w-full bg-red-50 border-b border-red-100 px-4 py-1.5 text-xs text-red-600 font-semibold animate-in slide-in-from-top-4 flex justify-center items-center gap-2 z-10 shadow-sm">
          <span className="animate-pulse">⚠️</span> You usually lose focus around now — stay sharp!
        </div>
      )}

      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${riskAlert ? 'mt-4' : ''}`}>
        
        {/* LEFT INFO */}
        <div className="flex-1" title={insights.topReason ? `You mostly get distracted by ${insights.topReason}` : undefined}>
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            Behavior Tracker
            {warning.badge && (
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                count >= 5 ? "bg-red-100 text-red-600 animate-pulse" : "bg-amber-100 text-amber-700"
              }`}>
                {warning.badge}
              </span>
            )}
          </h3>
          
          <div className="text-xs text-gray-500 mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1">
              <span className={`inline-block transition-transform duration-200 ${bumpAnim ? 'scale-150 text-red-500 font-bold' : 'scale-100'}`}>
                {count}
              </span>
              <span>{count === 1 ? "break" : "breaks"} in focus</span>
            </div>
            
            {/* Streak Indicator */}
            {distractionStreak >= 2 && (
              <div className="text-red-500 font-bold animate-pulse">
                🔥 {distractionStreak} slip-ups in a row
              </div>
            )}
            
            {count > 0 && !recoveryMode && (
              <button 
                onClick={() => undoDistraction()}
                className="text-blue-500 hover:text-blue-700 underline text-[10px] transition-colors w-fit"
              >
                Undo last
              </button>
            )}
          </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap items-center justify-end gap-2">
            
            {lastReason && !isLogging && !recoveryMode && (
              <button
                onClick={() => handleLogDistraction(lastReason)}
                disabled={!isActive}
                className="px-4 py-3 md:py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
              >
                ⚡ Quick: {lastReason.split(" ")[1] || lastReason.split(" ")[0]}
              </button>
            )}

            {!isLogging && !recoveryMode && (
              <button
                onClick={() => setIsLogging(true)}
                disabled={!isActive}
                className={`
                  px-5 py-3 md:px-4 md:py-2 text-sm font-bold rounded-lg transition-all active:scale-95 shadow-sm
                  ${isActive ? "bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-md border border-red-100" : "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100"}
                  ${count >= 3 && isActive ? "animate-pulse ring-2 ring-red-200" : ""}
                `}
              >
                ⚠️ I lost focus
              </button>
            )}

            {isLogging && (
              <div className="hidden md:flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200 bg-gray-50 p-1.5 rounded-lg border border-gray-100 shadow-inner">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-2 mr-1">Why?</span>
                {REASONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleLogDistraction(r.label)}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-md transition-all active:scale-95 shadow-sm"
                  >
                    {r.label}
                  </button>
                ))}
                <button
                  onClick={() => setIsLogging(false)}
                  className="px-2 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 ml-1 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            {recoveryMode && (
              <div className="px-5 py-3 md:py-2 text-sm font-bold text-amber-700 bg-amber-100 rounded-lg animate-in zoom-in duration-300 flex items-center gap-2 shadow-sm border border-amber-200">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                Recovering Focus...
              </div>
            )}
          </div>
          
          {count >= 3 && !isLogging && !recoveryMode && isActive && (
             <span className="text-[10px] text-red-500 font-bold mr-1 animate-pulse">
               You’re slipping fast. Break the cycle.
             </span>
          )}
        </div>
      </div>

      {isLogging && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex flex-col justify-end md:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl p-5 pb-8 animate-in slide-in-from-bottom-full duration-300 shadow-2xl border-t border-gray-100">
            <div className="flex justify-between items-center mb-5">
              <div className="text-lg font-bold text-gray-900">Why did you lose focus?</div>
              <button onClick={() => setIsLogging(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleLogDistraction(r.label)}
                  className="py-4 px-2 text-sm font-semibold rounded-xl bg-gray-50 border border-gray-200 text-gray-800 hover:border-gray-300 active:bg-gray-100 active:scale-95 transition-all shadow-sm"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INTELLIGENCE METRICS FOOTER */}
      <div className={`pt-3 mt-1 border-t border-gray-100 transition-opacity duration-500 ${recoveryMode ? "opacity-40" : "opacity-100"}`}>
        
        <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
          <div className="text-xs font-medium text-gray-700 flex items-center gap-3">
            <span>Stability: <span className={`font-bold ${insights.stability > 70 ? 'text-green-600' : 'text-amber-600'}`}>{insights.stability}%</span></span>
            
            {count > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span>Recovery: <span className={`font-bold ${recoveryScore === 100 ? 'text-green-600' : 'text-blue-500'}`}>{recoveryScore}%</span></span>
              </>
            )}
          </div>
          
          <div className={`text-xs font-bold ${count < 3 ? "text-gray-500" : "text-red-500"}`}>
            {warning.text}
          </div>
        </div>

        {count > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-gray-500 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="uppercase tracking-wider font-bold text-gray-400">Nemesis:</span> 
              <span className="text-gray-700 font-bold bg-white px-1.5 py-0.5 rounded border border-gray-100 shadow-sm">{insights.topReason}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="uppercase tracking-wider font-bold text-gray-400">Last slip:</span>
              <span className="text-gray-700 font-semibold">{Math.floor(timeSinceLast / 60)}m ago</span>
            </div>
            
            {insights.avgGap > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="uppercase tracking-wider font-bold text-gray-400">Pace:</span>
                <span className="text-gray-700 font-semibold">Every {insights.avgGap}m</span>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}