import React, { useState, useMemo } from 'react';

interface ActivityDensityProps {
  hourMap: Record<number, number>;
  prevHourMap?: Record<number, number>; 
  peakHour: number | null; // 🔥 ADDED
  weakHours: string[];     // 🔥 ADDED
}

export default function ActivityDensity({ hourMap, prevHourMap = {}, peakHour, weakHours }: ActivityDensityProps) {
  const [activeHour, setActiveHour] = useState<number | null>(null);
  const maxHourActivity = Math.max(...Object.values(hourMap), 1);

  const getColor = (count: number, prev: number, hourIndex: number) => {
    if (count === 0) return "bg-gray-200"; 
    if (weakHours.includes(String(hourIndex))) return "bg-orange-300"; // Highlight weak spots
    if (count > prev) return "bg-green-500"; 
    if (count < prev) return "bg-red-400"; 
    return "bg-gray-400"; 
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Activity Density (24h)</span>
        <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded font-medium">Session Clustering</span>
      </div>

      <div className="flex items-end gap-1 mt-2 h-20 w-full">
        {Array.from({ length: 24 }).map((_, i) => {
          const count = hourMap[i] || 0;
          const prev = prevHourMap[i] || 0;
          const height = count === 0 ? '4px' : `${(count / maxHourActivity) * 100}%`;
          
          const isPeak = i === peakHour;
          const isActive = i === activeHour;

          return (
            <div 
              key={i}
              onClick={() => setActiveHour(activeHour === i ? null : i)}
              className={`relative flex-1 rounded-t-[3px] cursor-pointer transition-all hover:opacity-80
                ${getColor(count, prev, i)}
                ${isPeak && !isActive ? 'ring-2 ring-green-600 ring-offset-1 z-10' : ''}
                ${isActive ? 'ring-2 ring-gray-900 ring-offset-1 z-20 scale-105' : ''}
              `}
              style={{ height, opacity: count === 0 ? 0.4 : 1 }} 
            />
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] text-gray-400 font-medium tracking-wide mt-3 px-1">
        <span>0h</span>
        <span>12h</span>
        <span>24h</span>
      </div>

      {activeHour !== null && (
        <div className="mt-5 bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Selected Block</div>
          <div className="font-black text-gray-900 text-sm">{activeHour}:00 - {activeHour + 1}:00</div>
          <div className="text-gray-600 mt-1 font-medium">
            Events: <span className="font-bold text-gray-900">{hourMap[activeHour] || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
}