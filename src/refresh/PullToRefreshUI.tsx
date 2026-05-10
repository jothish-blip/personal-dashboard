"use client";

import React, { useEffect } from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { useGlobalRefresh } from "@/refresh/engine/useGlobalRefresh"; 
import { usePullToRefresh } from "./engine/usePullToRefresh";

export default function PullToRefreshUI() {
  const { refreshPage } = useGlobalRefresh();
  const { pullDistance, readyToRefresh, isRefreshing } = usePullToRefresh(() => {
    refreshPage();
  });

  // Haptic feedback trigger when the release threshold is met
  useEffect(() => {
    if (readyToRefresh && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [readyToRefresh]);

  if (pullDistance <= 0 && !isRefreshing) return null;

  // Calculate circular progress (0 to 100)
  const progress = Math.min((pullDistance / 70) * 100, 100);
  const radius = 10;
  const circumference = 2 * Math.PI * radius; // ~62.8
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="fixed top-3 left-0 w-full flex justify-center z-[9999] pointer-events-none transition-transform duration-200 ease-out"
      style={{
        // Elastic drag formula + Subtle scale-up for responsiveness
        transform: `translateY(${
          isRefreshing ? 70 : Math.min(pullDistance * 0.65, 90)
        }px) scale(${Math.min(0.9 + pullDistance / 150, 1)})`,
      }}
    >
      <div 
        className={`px-4 py-2.5 rounded-full bg-[var(--surface)]/80 backdrop-blur-xl border border-[var(--border)] shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex items-center gap-3 text-xs font-semibold transition-all duration-300 ${
          isRefreshing ? "shadow-[0_0_20px_rgba(59,130,246,0.15)] animate-pulse" : ""
        }`}
      >
        {isRefreshing ? (
          <>
            <Loader2 size={16} className="animate-spin text-blue-500" />
            <span className="text-[var(--foreground)]">Syncing your system...</span>
          </>
        ) : (
          <>
            {/* SVG Progress Ring + Arrow */}
            <div className="relative flex items-center justify-center w-5 h-5">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 24 24">
                {/* Background Track */}
                <circle 
                  cx="12" cy="12" r={radius} 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  fill="none" 
                  className="text-[var(--border)] opacity-50" 
                />
                {/* Fill Track */}
                <circle 
                  cx="12" cy="12" r={radius} 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  fill="none" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={strokeDashoffset} 
                  className="text-blue-500 transition-all duration-75 ease-out" 
                />
              </svg>
              <ArrowDown
                size={10}
                className={`transition-transform duration-300 ${
                  readyToRefresh ? "rotate-180 scale-125 text-[var(--foreground)]" : "text-[var(--muted)]"
                }`}
              />
            </div>
            <span className={readyToRefresh ? "text-[var(--foreground)]" : "text-[var(--muted)]"}>
              {readyToRefresh ? "Release to update" : "Pull to sync"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}