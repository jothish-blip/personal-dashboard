import React, { useState, useEffect, useMemo } from 'react';
import { Calendar } from 'lucide-react';

interface HeatmapData {
  date: string;
  count: number;
  intensity: number;
  delta: number;
}

interface HeatmapProps {
  heatmapData: HeatmapData[];
}

export default function Heatmap({ heatmapData }: HeatmapProps) {
  const [selectedDay, setSelectedDay] = useState<HeatmapData | null>(null);

  // Auto-select "today" (the last item) on load or data change
  useEffect(() => {
    if (heatmapData.length > 0) {
      const today = heatmapData[heatmapData.length - 1];
      setSelectedDay(today);
    }
  }, [heatmapData]);

  // Reformat data into GitHub-style weeks (Columns = Weeks, Rows = Days)
  const weeks = useMemo(() => {
    const w: HeatmapData[][] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      w.push(heatmapData.slice(i, i + 7));
    }
    return w;
  }, [heatmapData]);

  // Clean 3-state visual logic
  const getColor = (day: HeatmapData) => {
    if (day.delta > 0) return "bg-green-500";
    if (day.delta < 0) return "bg-red-400";
    return "bg-white border border-gray-200";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[20px] p-5 relative z-10">
      
      {/* Header & Legend */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Calendar size={16} className="text-gray-500" /> Execution Map
        </h3>

        <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 uppercase">
          <span>-</span>
          <div className="w-2.5 h-2.5 bg-red-400 rounded-[2px]"></div>
          <div className="w-2.5 h-2.5 bg-white border border-gray-300 rounded-[2px]"></div>
          <div className="w-2.5 h-2.5 bg-green-500 rounded-[2px]"></div>
          <span>+</span>
        </div>
      </div>

      {/* Grid */}
      <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
        <div className="min-w-max flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => {
                const isSelected = selectedDay?.date === day.date;
                return (
                  <div
                    key={day.date}
                    onClick={() => setSelectedDay(day)}
                    className={`relative w-[13px] h-[13px] rounded-[3px] cursor-pointer transition-all hover:scale-110 
                      ${getColor(day)} 
                      ${isSelected ? 'ring-2 ring-gray-800 scale-110 z-10' : ''}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* DETAILS PANEL (UX Upgrade) */}
      {selectedDay && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
          
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
            Selected Day
          </div>

          <div className="text-sm font-black text-gray-900">
            {selectedDay.date}
          </div>

          <div className="text-sm text-gray-600 font-medium">
            Tasks: <span className="font-bold text-gray-900">{selectedDay.count}</span>
          </div>

          <div className={`text-sm font-bold mt-1 ${
            selectedDay.delta > 0 ? "text-green-600" :
            selectedDay.delta < 0 ? "text-red-500" :
            "text-gray-500"
          }`}>
            {selectedDay.delta > 0 && `+${selectedDay.delta}`}
            {selectedDay.delta < 0 && `${selectedDay.delta}`}
            {selectedDay.delta === 0 && `0`}
          </div>

        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}} />
    </div>
  );
}