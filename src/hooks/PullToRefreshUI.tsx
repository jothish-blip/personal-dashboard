"use client";

import { ArrowDown, Loader2 } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh"; 
import { useGlobalRefresh } from "@/hooks/useGlobalRefresh"; 

export default function PullToRefreshUI() {
  const { refreshPage } = useGlobalRefresh();
  const { pullDistance, readyToRefresh, isRefreshing } = usePullToRefresh(() => {
    refreshPage();
  });

  if (pullDistance <= 0 && !isRefreshing) return null;

  return (
    <div
      className="fixed top-0 left-0 w-full flex justify-center z-[9999] pointer-events-none transition-transform duration-200 ease-out"
      style={{
        // Lock at 60px while refreshing, otherwise follow the finger pull
        transform: `translateY(${isRefreshing ? 60 : Math.min(pullDistance, 100)}px)`,
      }}
    >
      <div className="mt-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-200 flex items-center gap-2 text-xs font-medium text-slate-800 transition-all duration-300">
        {isRefreshing ? (
          <>
            <Loader2 size={16} className="animate-spin text-slate-800" />
            <span>Refreshing...</span>
          </>
        ) : (
          <>
            <ArrowDown
              size={16}
              className={`transition-transform duration-300 ${
                readyToRefresh ? "rotate-180 text-slate-800" : "text-gray-400"
              }`}
            />
            <span className={readyToRefresh ? "text-slate-800" : "text-gray-500"}>
              {readyToRefresh ? "Release to refresh" : "Pull to refresh"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}