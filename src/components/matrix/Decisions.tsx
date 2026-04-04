import React from 'react';
import { Target, Zap, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface DecisionsProps {
  todayDataLength: number;
  weekAvg: number;
  tasksLength: number;
  momentumScore: number;
  patternInsight: string;
}

export default function Decisions({ todayDataLength, weekAvg, tasksLength, momentumScore, patternInsight }: DecisionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Efficiency Signal */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-5 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Efficiency</span>
          <span className={`text-xl font-bold mt-1 ${todayDataLength === 0 ? 'text-red-500' : todayDataLength < weekAvg ? 'text-orange-500' : 'text-green-600'}`}>
            {todayDataLength === 0 ? "Zero output" : `${todayDataLength} Done`}
          </span>
          <span className="text-[10px] font-semibold text-gray-400 mt-1">
            Wk Avg: <span className="text-gray-600">{weekAvg}/day</span>
          </span>
        </div>
        <div className="w-10 h-10 flex items-center justify-center">
          {todayDataLength > weekAvg && <ArrowUpRight className="text-green-500" size={24} />}
          {todayDataLength < weekAvg && todayDataLength > 0 && <ArrowDownRight className="text-orange-500" size={24} />}
          {todayDataLength === 0 && <Minus className="text-red-500" size={24} />}
        </div>
      </div>

      {/* Focus Recommendation */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-5 flex flex-col justify-center">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Target size={12} /> Priority</span>
        <div className="mt-2 text-sm font-semibold text-gray-800">
          {tasksLength === 0 ? "Initialize objectives." :
           todayDataLength === 0 ? "Start execution. Momentum is zero." :
           todayDataLength < tasksLength / 2 ? "Below threshold. Push now." :
           todayDataLength < tasksLength ? "Positive pace. Maintain focus." :
           "Execution complete."}
        </div>
      </div>

      {/* Pattern/Momentum Signal */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-5 flex flex-col justify-center">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <Zap size={12} className={momentumScore > 0 ? 'text-green-500' : momentumScore < 0 ? 'text-red-500' : 'text-orange-500'} /> 
          {momentumScore !== 0 ? 'Momentum Trend' : 'Pattern Insight'}
        </span>
        <div className="mt-2 text-sm font-semibold text-gray-800">
          {momentumScore > 0 ? "Upward trend detected. Maintain intensity." : 
           momentumScore < 0 ? "Declining trend. Intervene immediately." : 
           patternInsight}
        </div>
      </div>
    </div>
  );
}