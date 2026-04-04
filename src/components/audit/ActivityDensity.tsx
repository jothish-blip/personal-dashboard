import React from 'react';

interface ActivityDensityProps {
  hourMap: Record<number, number>;
}

export default function ActivityDensity({ hourMap }: ActivityDensityProps) {
  const maxHourActivity = Math.max(...Object.values(hourMap), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Activity Density (24h)</span>
        <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded font-medium">Session Clustering</span>
      </div>
      <div className="flex items-end gap-1 mt-2 h-16 w-full">
        {Array.from({length: 24}).map((_, i) => {
          const count = hourMap[i] || 0;
          const height = count === 0 ? 0 : (count / maxHourActivity) * 100;
          return (
            <div 
              key={i} 
              title={`${i}:00 - ${count} events`}
              className="flex-1 bg-orange-400 rounded-t-sm transition-all hover:bg-orange-500" 
              style={{ height: `${height}%`, opacity: count ? 1 : 0.1 }} 
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 font-medium tracking-wide mt-2">
        <span>00:00</span>
        <span>12:00</span>
        <span>23:59</span>
      </div>
    </div>
  );
}