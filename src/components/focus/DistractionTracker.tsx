"use client";

import React, { useState, useEffect } from "react";
import { useFocusSystem } from "./useFocusSystem";

const REASONS = [
  { id: "phone", label: "📱 Phone" },
  { id: "social", label: "🌐 Social" },
  { id: "noise", label: "🔊 Noise" },
  { id: "other", label: "❓ Other" },
];

export default function DistractionTracker() {
  const { distractions = [], addDistraction, undoDistraction, isActive } = useFocusSystem();
  
  const [isLogging, setIsLogging] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [bumpAnim, setBumpAnim] = useState(false);
  const [lastReason, setLastReason] = useState<string | null>(null);

  const count = distractions.length;

  // --- INTELLIGENCE COMPUTATIONS ---
  const getInsights = () => {
    // ✅ FIX: Safe explicit returns for TypeScript
    if (count === 0) return { topReason: null, stability: 100, lastTime: null, avgGap: 0 };
    
    const counts = distractions.reduce((acc, d) => {
      acc[d.reason] = (acc[d.reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Extract just the string name safely
    const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topReason = sortedCounts.length > 0 ? sortedCounts[0][0] : null;

    const stability = Math.max(0, 100 - count * 10);
    const lastTimeObj = new Date(distractions[count - 1].timestamp);
    const lastTime = lastTimeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let avgGap = 0;
    if (count > 1) {
      const first = distractions[0].timestamp;
      const last = distractions[count - 1].timestamp;
      avgGap = Math.round(((last - first) / 60000) / (count - 1));
    }

    return { topReason, stability, lastTime, avgGap };
  };

  const insights = getInsights();

  // --- DYNAMIC WARNINGS ---
  const getWarning = () => {
    if (count === 0) return { badge: null, text: "Perfect focus so far." };
    if (count < 3) return { badge: "Focus Slipping", text: "Watch your discipline." };
    if (count < 5) return { badge: "Drifting", text: "⚠️ Refocus now. You're drifting." };
    return { badge: "Critical Level", text: "🚨 You are losing control. Lock in." };
  };
  const warning = getWarning();

  // --- ACTIONS ---
  const handleLogDistraction = (reason: string) => {
    addDistraction(reason);
    setLastReason(reason);
    setIsLogging(false);
    
    setBumpAnim(true);
    setRecoveryMode(true);
    
    setTimeout(() => setBumpAnim(false), 300);
    setTimeout(() => setRecoveryMode(false), 5000); 
  };

  useEffect(() => {
    if (!isActive) {
      setIsLogging(false);
      setRecoveryMode(false);
    }
  }, [isActive]);

  return (
    <div className={`bg-white border p-4 md:p-5 rounded-xl shadow-sm flex flex-col gap-4 transition-all duration-500 relative ${
      recoveryMode ? "border-amber-400 bg-amber-50/30 ring-4 ring-amber-100" : "border-gray-200"
    }`}>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* LEFT INFO */}
        <div className="flex-1" title={insights.topReason ? `You mostly get distracted by ${insights.topReason}` : undefined}>
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            Behavior Tracker
            {warning.badge && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                count >= 5 ? "bg-red-100 text-red-600 animate-pulse" : "bg-amber-100 text-amber-700"
              }`}>
                {warning.badge}
              </span>
            )}
          </h3>
          
          {/* ✅ FIX: Changed <p> to <div> to prevent Invalid DOM Nesting of the <button> */}
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <span className={`inline-block transition-transform duration-200 ${bumpAnim ? 'scale-150 text-red-500 font-bold' : 'scale-100'}`}>
              {count}
            </span>
            <span>{count === 0 ? "breaks" : `break${count > 1 ? "s" : ""}`} in focus</span>
            
            {count > 0 && !recoveryMode && (
              <button 
                onClick={() => undoDistraction()} // ✅ FIX: Safe wrapped click handler
                className="ml-2 text-gray-400 hover:text-gray-700 underline text-[10px]"
              >
                Undo
              </button>
            )}
          </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          
          {lastReason && !isLogging && !recoveryMode && (
            <button
              onClick={() => handleLogDistraction(lastReason)}
              disabled={!isActive}
              className="px-4 py-3 md:py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
            >
              ⚡ Quick: {lastReason.split(" ")[0]}
            </button>
          )}

          {!isLogging && !recoveryMode && (
            <button
              onClick={() => setIsLogging(true)}
              disabled={!isActive}
              className={`
                px-5 py-3 md:px-4 md:py-2 text-sm font-medium rounded-lg transition-all active:scale-95
                ${isActive ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100" : "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100"}
              `}
            >
              ⚠️ I lost focus
            </button>
          )}

          {isLogging && (
            <div className="hidden md:flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
              <span className="text-xs font-medium text-gray-500 mr-1">Why?</span>
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleLogDistraction(r.label)}
                  className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-md transition-colors"
                >
                  {r.label}
                </button>
              ))}
              <button
                onClick={() => setIsLogging(false)}
                className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 ml-1"
              >
                Cancel
              </button>
            </div>
          )}

          {recoveryMode && (
            <div className="px-5 py-3 md:py-2 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg animate-in zoom-in duration-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              Recovering Focus...
            </div>
          )}
        </div>
      </div>

      {isLogging && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex flex-col justify-end md:hidden animate-in fade-in">
          <div className="bg-white rounded-t-2xl p-5 pb-8 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-4">
              <div className="text-base font-semibold text-gray-900">Why did you lose focus?</div>
              <button onClick={() => setIsLogging(false)} className="text-gray-400 hover:text-gray-600 p-2">✕</button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleLogDistraction(r.label)}
                  className="py-4 text-base font-medium rounded-xl bg-gray-50 border border-gray-100 text-gray-800 active:bg-gray-100 active:scale-95 transition-all"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`pt-3 mt-1 border-t border-gray-100 text-xs transition-opacity duration-500 ${recoveryMode ? "opacity-30" : "opacity-100"}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="font-medium text-gray-700">
            Stability: <span className={`${insights.stability > 70 ? 'text-green-600' : 'text-amber-600'}`}>{insights.stability}%</span>
          </div>
          <div className={`font-medium ${count < 3 ? "text-gray-500" : "text-red-500"}`}>
            {warning.text}
          </div>
        </div>

        {count > 0 && (
          <div className="hidden sm:flex items-center gap-4 text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-100">
            <div className="flex items-center gap-1.5">
              <span>Top Issue:</span> 
              <span className="text-gray-700 font-medium">{insights.topReason}</span>
            </div>
            <span className="text-gray-300">•</span>
            <div>Last: <span className="text-gray-700">{insights.lastTime}</span></div>
            {insights.avgGap > 0 && (
              <>
                <span className="text-gray-300">•</span>
                <div>Avg Gap: <span className="text-gray-700">{insights.avgGap} min</span></div>
              </>
            )}
          </div>
        )}
      </div>

    </div>
  );
}