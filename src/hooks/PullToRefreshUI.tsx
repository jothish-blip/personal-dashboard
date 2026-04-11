"use client";

import { ChevronDown } from "lucide-react";

export default function PullToRefreshUI({
  pullDistance,
  ready,
}: {
  pullDistance: number;
  ready: boolean;
}) {
  // 🔥 Hide completely when not pulling
  if (pullDistance <= 0) return null;

  return (
    <div
      className="fixed top-0 left-0 w-full flex justify-center z-[9999] pointer-events-none"
      style={{
        transform: `translateY(${Math.min(pullDistance, 100)}px)`,
      }}
    >
      <div className="mt-2 px-4 py-2 rounded-full bg-white shadow-md border border-gray-200 flex items-center gap-2 text-xs font-semibold text-gray-600">

        <ChevronDown
          size={16}
          className={`transition-transform ${
            ready
              ? "rotate-180 text-blue-600"
              : "text-gray-400"
          }`}
        />

        {ready ? "Release to refresh" : "Pull to refresh"}
      </div>
    </div>
  );
}