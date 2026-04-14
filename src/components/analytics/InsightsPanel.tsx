import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { FilteredData } from './utils';

interface InsightsProps {
  stats: FilteredData['stats'];
  momentum: number;
  loadLevel: 'High' | 'Moderate' | 'Low';
}

export default function InsightsPanel({ stats, momentum, loadLevel }: InsightsProps) {
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  
  // 🔥 STEP 1 & 4: Collapse State & Mobile Behavior
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

  const insightText =
    stats.totalCompletions === 0
      ? "No execution yet."
      : stats.consistencyPercent < 40
      ? "Execution unstable."
      : stats.consistencyPercent < 70
      ? "Execution improving."
      : "Execution strong.";

  return (
    // 🔥 STEP 2: Main Wrapper
    <div className="bg-white border border-gray-200 rounded-[20px] shadow-sm overflow-hidden">
      
      {/* HEADER */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">
          Insights
        </span>

        {/* 🔥 STEP 5: Smoother Icon */}
        <span className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          <TrendingUp size={18} />
        </span>
      </button>

      {/* Preview when closed */}
      {!isOpen && (
        <div className="px-4 pb-4 text-xs text-gray-400 font-medium animate-in fade-in">
          Tap to view insights
        </div>
      )}

      {/* 🔥 STEP 3: Collapsible Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[500px] opacity-100 p-4 pt-0" : "max-h-0 opacity-0 px-4"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* --- CARD 1: PERFORMANCE INSIGHT --- */}
          <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                  Performance Insight
                </span>
                <button
                  onClick={() => setActiveHelp(activeHelp === "performance" ? null : "performance")}
                  className="text-gray-300 hover:text-gray-600 transition-colors outline-none font-bold px-1"
                >
                  ?
                </button>
              </div>

              <p className="text-sm font-semibold text-gray-800 mt-2">
                {insightText}
              </p>

              {activeHelp === "performance" && (
                <div className="mt-2 text-[11px] text-gray-500 animate-in fade-in duration-200">
                  Overall execution quality across selected period.
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200/60 flex items-center gap-6">
              <div className="flex items-center gap-2">
                {momentum > 0 && <TrendingUp size={14} className="text-green-500" />}
                {momentum < 0 && <TrendingDown size={14} className="text-red-500" />}
                {momentum === 0 && <Minus size={14} className="text-gray-400" />}
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  {momentum > 0 ? "Up" : momentum < 0 ? "Down" : "Flat"}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Activity size={14} className={loadLevel === 'High' ? 'text-green-500' : loadLevel === 'Moderate' ? 'text-orange-500' : 'text-red-500'} />
                <span className={`text-xs font-bold uppercase tracking-widest ${
                  loadLevel === 'High' ? 'text-green-600' : 
                  loadLevel === 'Moderate' ? 'text-orange-500' : 'text-red-500'
                }`}>
                  {loadLevel}
                </span>
              </div>
            </div>
          </div>

          {/* --- CARD 2: EXECUTION SIGNAL --- */}
          <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 flex flex-col justify-start h-full">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                Execution Signal
              </span>
              <button
                onClick={() => setActiveHelp(activeHelp === "signal" ? null : "signal")}
                className="text-gray-300 hover:text-gray-600 transition-colors outline-none font-bold px-1"
              >
                ?
              </button>
            </div>

            <p className="text-sm font-semibold text-gray-800 mt-2 leading-relaxed">
              {momentum > 0
                ? "Gaining momentum."
                : momentum < 0
                ? "Losing momentum."
                : "No change."}
            </p>

            {activeHelp === "signal" && (
              <div className="mt-2 text-[11px] text-gray-500 animate-in fade-in duration-200">
                Change in execution compared to yesterday.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}