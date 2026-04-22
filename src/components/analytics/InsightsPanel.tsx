import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { FilteredData } from './utils';

interface InsightsProps {
  stats: FilteredData['stats'];
  momentum: number;
  loadLevel: 'High' | 'Moderate' | 'Low';
}

export default function InsightsPanel({ stats, momentum, loadLevel }: InsightsProps) {
  // Collapse State & Mobile Behavior
  const [isOpen, setIsOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🔥 STEP 1: PERFORMANCE INSIGHT
  const insightText =
    stats.totalCompletions === 0
      ? "No activity yet."
      : momentum < 0 && stats.consistencyPercent < 50
      ? "Performance dropping. Pattern breaking."
      : momentum < 0
      ? "Recent decline detected."
      : momentum > 0 && stats.consistencyPercent >= 70
      ? "Strong execution trend."
      : momentum > 0
      ? "Improving steadily."
      : "Stable execution.";

  // 🔥 STEP 3: CARD COLOR STATE
  const performanceColor =
    momentum > 0 ? "bg-green-50 border-green-200" :
    momentum < 0 ? "bg-red-50 border-red-200" :
    "bg-gray-50 border-gray-200";

  // 🔥 STEP 4: LOAD LEVEL COLOR
  const loadColorClass =
    loadLevel === 'High' ? 'text-green-500' :
    loadLevel === 'Moderate' ? 'text-gray-500' :
    'text-orange-500';

  const loadTextColorClass =
    loadLevel === 'High' ? 'text-green-600' :
    loadLevel === 'Moderate' ? 'text-gray-600' :
    'text-orange-600';

  return (
    <div className="bg-white border border-gray-200 rounded-[20px] shadow-sm overflow-hidden">
      
      {/* HEADER */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition-colors outline-none"
      >
        <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">
          Actionable Insights
        </span>

        {/* 🔥 STEP 7: DYNAMIC HEADER ICON */}
        <span className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          {momentum > 0 && <TrendingUp size={18} />}
          {momentum < 0 && <TrendingDown size={18} />}
          {momentum === 0 && <Minus size={18} />}
        </span>
      </button>

      {/* Preview when closed */}
      {!isOpen && (
        <div className="px-4 pb-4 text-xs text-gray-400 font-medium animate-in fade-in">
          Tap to view system diagnostics
        </div>
      )}

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[500px] opacity-100 p-4 pt-0" : "max-h-0 opacity-0 px-4"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* --- CARD 1: PERFORMANCE INSIGHT --- */}
          <div className={`${performanceColor} border rounded-xl p-5 flex flex-col justify-between h-full transition-colors duration-300`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                  Performance Diagnostic
                </span>
              </div>

              <p className="text-sm font-semibold text-gray-800 mt-2">
                {insightText}
              </p>

              {/* 🔥 STEP 5: URGENCY LINE */}
              {momentum < 0 && (
                <div className="mt-3 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                  ⚠ Immediate correction needed
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-black/5 flex items-center gap-6">
              <div className="flex items-center gap-2">
                {momentum > 0 && <TrendingUp size={14} className="text-green-500" />}
                {momentum < 0 && <TrendingDown size={14} className="text-red-500" />}
                {momentum === 0 && <Minus size={14} className="text-gray-400" />}
                <span className={`text-xs font-bold uppercase tracking-widest ${
                  momentum > 0 ? "text-green-600" : momentum < 0 ? "text-red-600" : "text-gray-500"
                }`}>
                  {momentum > 0 ? "Up" : momentum < 0 ? "Down" : "Flat"}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Activity size={14} className={loadColorClass} />
                <span className={`text-xs font-bold uppercase tracking-widest ${loadTextColorClass}`}>
                  {loadLevel} Load
                </span>
              </div>
            </div>
          </div>

          {/* --- CARD 2: EXECUTION SIGNAL --- */}
          <div className={`${performanceColor} border rounded-xl p-5 flex flex-col justify-start h-full transition-colors duration-300`}>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                Execution Signal
              </span>
            </div>

            {/* 🔥 STEP 2: EXACT NUMBERS & DIRECTION */}
            <p className="text-sm font-semibold text-gray-800 mt-2 leading-relaxed">
              {momentum > 0 && `+${momentum} improvement from yesterday`}
              {momentum < 0 && `${momentum} drop from yesterday`}
              {momentum === 0 && `No change from yesterday`}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}