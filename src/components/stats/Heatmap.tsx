import React from 'react';
import { Calendar } from 'lucide-react';

interface HeatmapData {
  date: string;
  count: number;
  intensity: number;
}

interface HeatmapProps {
  heatmapData: HeatmapData[];
}

export default function Heatmap({ heatmapData }: HeatmapProps) {
  const getColorClass = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 0.3) return 'bg-orange-200';
    if (intensity < 0.6) return 'bg-orange-400';
    if (intensity < 0.9) return 'bg-green-400';
    return 'bg-green-600';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[20px] p-5">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Calendar size={16} className="text-gray-500" /> Execution Map
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase">
          <span>Less</span>
          <div className="w-3 h-3 rounded-[3px] bg-gray-100"></div>
          <div className="w-3 h-3 rounded-[3px] bg-orange-200"></div>
          <div className="w-3 h-3 rounded-[3px] bg-orange-400"></div>
          <div className="w-3 h-3 rounded-[3px] bg-green-400"></div>
          <div className="w-3 h-3 rounded-[3px] bg-green-600"></div>
          <span>More</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
        <div className="min-w-max flex flex-col gap-1">
          <div 
            className="grid gap-1.5" 
            style={{ 
              gridTemplateRows: 'repeat(7, 1fr)', 
              gridAutoFlow: 'column',
              gridAutoColumns: '14px' 
            }}
          >
            {heatmapData.map((day) => (
              <div 
                key={day.date} 
                title={`${day.date}: ${day.count} reps`}
                className={`w-[14px] h-[14px] rounded-[3px] transition-colors ${getColorClass(day.intensity)}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}} />
    </div>
  );
}