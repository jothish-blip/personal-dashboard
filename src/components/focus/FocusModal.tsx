"use client";

import React, { useEffect, useState } from "react";

// Versioning allows us to force users to re-read rules if we fundamentally change the system later.
const ONBOARDING_VERSION = "focus_onboarding_v1";

export default function FocusModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [canAgree, setCanAgree] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(ONBOARDING_VERSION);

    if (!hasSeen) {
      setIsOpen(true);

      // 🔥 Prevent background scroll while modal is open
      document.body.style.overflow = "hidden";

      // ⏳ Force intentional reading time (2.5 seconds)
      const timer = setTimeout(() => {
        setCanAgree(true);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAgree = () => {
    localStorage.setItem(ONBOARDING_VERSION, "true");
    setIsOpen(false);

    // 🔥 Restore scroll when they enter the dashboard
    document.body.style.overflow = "auto";
  };

  // If they've already onboarded, render absolutely nothing
  if (!isOpen) return null;

  return (
    // Backdrop: Blurs the dashboard, completely blocking interaction
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 transition-all duration-500">
      
      {/* Modal Container */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 sm:p-8 space-y-7 animate-in fade-in zoom-in-95 duration-500">
        
        {/* HEADER */}
        <div className="text-center space-y-3">
          <div className="text-5xl mb-2 animate-pulse">🧠</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            The Focus Engine
          </h2>
          <p className="text-sm text-gray-500 max-w-[280px] mx-auto leading-relaxed">
            Execute with clarity. Track your discipline. Master your attention.
          </p>
        </div>

        {/* RULES OF EXECUTION */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 text-sm text-gray-800 space-y-4">
          <p className="font-bold text-gray-900 uppercase tracking-widest text-[10px]">
            Rules of Execution
          </p>

          <ul className="space-y-3.5">
            <li className="flex items-start gap-3">
              <span className="text-lg leading-none">🎯</span>
              <span className="leading-snug"><strong>Declare Intent:</strong> Define a single, clear target before starting the timer.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg leading-none">🔒</span>
              <span className="leading-snug"><strong>Lock In:</strong> No task switching allowed during an active session.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg leading-none">⚠️</span>
              <span className="leading-snug"><strong>Log Breaks:</strong> If your focus breaks, you must track the distraction honestly.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg leading-none">📊</span>
              <span className="leading-snug"><strong>Review:</strong> Analyze your behavior patterns after the session ends.</span>
            </li>
          </ul>
        </div>

        {/* FOOTER ACTION AREA */}
        <div className="space-y-3 pt-2">
          
          {/* PROGRESS / LOCK STATE INDICATOR */}
          <div className="text-center text-[11px] font-bold uppercase tracking-widest text-gray-400 h-4">
            {!canAgree ? "Initializing focus environment..." : "System Ready"}
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={handleAgree}
            disabled={!canAgree}
            className={`w-full py-4 text-sm font-bold rounded-xl transition-all shadow-md flex justify-center items-center gap-2
              ${
                canAgree
                  ? "bg-gray-900 text-white hover:bg-black active:scale-[0.98]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
              }
            `}
          >
            {canAgree ? "I Understand, Enter Dashboard" : (
              <>
                <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></span>
                Please wait...
              </>
            )}
          </button>
          
        </div>

      </div>
    </div>
  );
}