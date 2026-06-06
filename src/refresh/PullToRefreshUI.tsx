"use client";

import React, { useEffect } from "react";
import { ArrowDown, Loader2, Check } from "lucide-react";
import { useGlobalRefresh } from "@/refresh/engine/useGlobalRefresh"; 
import { usePullToRefresh } from "./engine/usePullToRefresh";

export default function PullToRefreshUI() {
  const { refreshPage } = useGlobalRefresh();
  
  const { 
    pullDistance, 
    isDragging, 
    readyToRefresh, 
    isRefreshing, 
    isSuccess 
  } = usePullToRefresh(async () => {
    await refreshPage();
  });

  // Haptic feedback trigger when the release threshold is met
  useEffect(() => {
    if (readyToRefresh && typeof navigator !== "undefined" && navigator.vibrate && !isRefreshing && !isSuccess) {
      navigator.vibrate(10);
    }
  }, [readyToRefresh, isRefreshing, isSuccess]);

  // Keep DOM clean when completely idle
  if (pullDistance <= 0 && !isRefreshing && !isSuccess) return null;

  const REFRESH_THRESHOLD = 35;
  const progress = Math.min((pullDistance / REFRESH_THRESHOLD) * 100, 100);
  
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // When actively dragging, follow finger. 
  // When refreshing/success, lock at 60px.
  const translateY = isRefreshing || isSuccess ? 60 : Math.min(pullDistance * 1.2, 80);
  const isVisible = pullDistance > 0 || isRefreshing || isSuccess;

  return (
    <div
      className="fixed top-0 left-0 w-full flex justify-center z-[9999] pointer-events-none"
      style={{
        transform: `translateY(${translateY}px) scale(${isVisible ? 1 : 0.8})`,
        opacity: isVisible ? 1 : 0,
        // Disable transitions while finger is down. Enable spring when finger releases.
        transition: isDragging 
          ? "none" 
          : "transform 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease",
      }}
    >
      <div 
        className={`relative flex items-center justify-center h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-md text-[var(--foreground)] transition-all duration-300 overflow-hidden ${
          isRefreshing || isSuccess ? "w-auto px-4 gap-2" : "w-10 px-0"
        }`}
      >
        {isSuccess ? (
          <>
            <Check size={16} className="text-emerald-500 shrink-0 animate-in zoom-in duration-200" />
            <span className="text-xs font-bold text-[var(--foreground)] pr-1 animate-in fade-in slide-in-from-right-4 duration-300">
              Updated
            </span>
          </>
        ) : isRefreshing ? (
          <>
            <Loader2 size={16} className="animate-spin text-blue-500 shrink-0" />
            <span className="text-xs font-bold text-[var(--foreground)] pr-1 animate-in fade-in slide-in-from-right-4 duration-300">
              Syncing...
            </span>
          </>
        ) : (
          <>
            {/* SVG Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
              <circle 
                cx="20" cy="20" r={radius} 
                stroke="currentColor" 
                strokeWidth="2.5" 
                fill="none" 
                className="text-[var(--border)] opacity-30" 
              />
              <circle 
                cx="20" cy="20" r={radius} 
                stroke="currentColor" 
                strokeWidth="2.5" 
                fill="none" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
                className="text-blue-500 transition-all duration-75 ease-out" 
              />
            </svg>
            
            {/* Inner Arrow */}
            <ArrowDown
              size={16}
              className={`transition-transform duration-300 ${
                readyToRefresh ? "rotate-180 text-blue-500" : "text-[var(--muted)]"
              }`}
            />
          </>
        )}
      </div>
    </div>
  );
}