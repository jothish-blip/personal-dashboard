import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="flex flex-col items-center text-center p-8 border border-gray-200 rounded-[16px] bg-white shadow-sm max-w-sm w-full">
        {/* 🔥 Softer, slightly smaller icon with a subtle pulse */}
        <AlertCircle size={28} className="text-gray-300 mb-3 opacity-80 animate-pulse" />

        {/* 🔥 Direct, human-readable title */}
        <p className="text-sm font-bold text-gray-700">
          No activity found
        </p>

        {/* 🔥 Clear, actionable subtitle */}
        <p className="text-xs text-gray-400 mt-1">
          Try a different filter or start tasks.
        </p>
      </div>
    </div>
  );
}