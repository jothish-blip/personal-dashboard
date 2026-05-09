"use client";

import React, { useState, useEffect } from 'react';
import { Target, Zap, ArrowUpRight, ArrowDownRight, Minus, HelpCircle } from 'lucide-react';
import { useTheme } from "@/theme/ThemeProvider"; // 🔥 Consuming theme state
interface DecisionsProps {
  todayDataLength: number;
  weekAvg: number;
  tasksLength: number;
  momentumScore: number;
  patternInsight: string;
}

export default function Decisions({ todayDataLength, weekAvg, tasksLength, momentumScore, patternInsight }: DecisionsProps) {
  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state
  const [showInfo, setShowInfo] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  
  // Mobile-first Help Modal State
  const [activeHelp, setActiveHelp] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('decision_hint_seen')) {
      setShowHint(true);
      localStorage.setItem('decision_hint_seen', 'true');
    }
  }, []);

  const progressPct = tasksLength > 0 ? Math.min((todayDataLength / tasksLength) * 100, 100) : 0;

  const progressColor =
    progressPct < 40 ? (isDarkMode ? 'bg-red-500' : 'bg-red-500') :
    progressPct < 70 ? (isDarkMode ? 'bg-orange-500' : 'bg-yellow-400') :
    (isDarkMode ? 'bg-emerald-500' : 'bg-green-500');

  // Bulletproof dynamic backgrounds for the cards
  const efficiencyBg = todayDataLength === 0 
    ? (isDarkMode ? 'bg-red-950/20 border-red-900/50 hover:border-red-900/80' : 'bg-red-50 border-red-100 hover:border-red-200')
    : todayDataLength < weekAvg 
      ? (isDarkMode ? 'bg-orange-950/20 border-orange-900/50 hover:border-orange-900/80' : 'bg-orange-50 border-orange-100 hover:border-orange-200')
      : (isDarkMode ? `bg-emerald-950/10 border-emerald-900/30 hover:border-emerald-900/60 ${todayDataLength >= weekAvg ? 'shadow-[0_0_20px_rgba(16,185,129,0.05)]' : ''}` : `bg-green-50 border-green-100 hover:border-green-200 ${todayDataLength >= weekAvg ? 'shadow-[0_0_20px_rgba(34,197,94,0.15)]' : ''}`);

  const priorityBg = todayDataLength === 0 
    ? (isDarkMode ? 'bg-red-950/20 border-red-900/50 hover:border-red-900/80' : 'bg-red-50 border-red-100 hover:border-red-200')
    : (tasksLength > 0 && todayDataLength < tasksLength / 2) 
      ? (isDarkMode ? 'bg-orange-950/20 border-orange-900/50 hover:border-orange-900/80' : 'bg-orange-50 border-orange-100 hover:border-orange-200')
      : (isDarkMode ? 'bg-[#111111] border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300');

  const baseCardClass = "border rounded-[20px] p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-[2px] cursor-default flex flex-col justify-center min-h-[110px] group relative";
  const shadowClass = isDarkMode ? "shadow-none" : "shadow-[0_6px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]";

  return (
    <div className="flex flex-col gap-4">
      
      {/* HINT BANNER */}
      {showHint && (
        <div className={`text-xs px-4 py-3 rounded-xl flex justify-between items-center shadow-sm animate-in fade-in slide-in-from-top-2 border ${
          isDarkMode ? "bg-blue-950/30 border-blue-900/50 text-blue-400" : "bg-blue-50 border-blue-100 text-blue-700"
        }`}>
          <span>This section shows your daily performance, priority, and progress trend.</span>
          <button onClick={() => setShowHint(false)} className={`font-bold ml-4 shrink-0 transition-colors ${
            isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"
          }`}>
            Got it
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        
        {/* CARD 1: Today's Performance */}
        <div className={`${baseCardClass} ${shadowClass} ${efficiencyBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              
              <div className="relative inline-flex items-center gap-1.5 w-max">
                <span 
                  onMouseEnter={() => setShowInfo('performance')}
                  onMouseLeave={() => setShowInfo(null)}
                  className={`text-[10px] font-semibold uppercase tracking-widest cursor-help hidden md:block underline decoration-dashed underline-offset-4 ${
                    isDarkMode ? "text-gray-400 decoration-gray-600" : "text-gray-500 decoration-gray-300"
                  }`}
                >
                  Today's Performance
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-widest md:hidden ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Today's Performance
                </span>
                
                {/* Help Icon for Mobile */}
                <button 
                  onClick={() => setActiveHelp('performance')}
                  className={`transition-colors md:hidden p-1 rounded ${
                    isDarkMode ? "text-gray-600 hover:text-gray-400 hover:bg-white/5" : "text-gray-300 hover:text-gray-500 hover:bg-black/5"
                  }`}
                >
                  <HelpCircle size={12} />
                </button>

                {showInfo === 'performance' && (
                  <div className={`absolute top-6 left-0 text-[10px] px-3 py-2 rounded-lg shadow-lg w-48 z-50 animate-in fade-in zoom-in-95 hidden md:block leading-relaxed border ${
                    isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-900 text-white border-transparent"
                  }`}>
                    Measures how many tasks you completed today vs your normal average.
                  </div>
                )}
              </div>
              
              <span className={`text-xl font-bold mt-2 ${
                todayDataLength === 0 
                  ? (isDarkMode ? 'text-red-400' : 'text-red-500') 
                  : todayDataLength < weekAvg 
                    ? (isDarkMode ? 'text-orange-400' : 'text-orange-500') 
                    : (isDarkMode ? 'text-emerald-500' : 'text-green-600')
              }`}>
                {todayDataLength === 0 ? "Zero output" : `${todayDataLength} Done`}
              </span>
              
              <span className={`text-[10px] mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                Based on your weekly avg ({weekAvg}/day)
              </span>
            </div>
            
            <div className={`w-12 h-12 flex items-center justify-center rounded-xl shrink-0 ${
              isDarkMode ? "bg-gray-900/50 border border-gray-800" : "bg-white shadow-sm"
            }`}>
              {todayDataLength > weekAvg && <div title="Better than average"><ArrowUpRight className={isDarkMode ? "text-emerald-500" : "text-green-500"} size={24} /></div>}
              {todayDataLength < weekAvg && todayDataLength > 0 && <div title="Below your normal"><ArrowDownRight className={isDarkMode ? "text-orange-500" : "text-orange-500"} size={24} /></div>}
              {todayDataLength === 0 && <div title="No activity"><Minus className={isDarkMode ? "text-red-500" : "text-red-500"} size={24} /></div>}
            </div>
          </div>
          
          {tasksLength > 0 ? (
            <>
              <div className={`w-full h-1.5 rounded-full mt-4 overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-black/5"}`}>
                <div 
                  className={`h-full ${progressColor} transition-all duration-500 ease-out`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className={`flex justify-between text-[10px] mt-1.5 font-medium ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                <span>{Math.round(progressPct)}% complete</span>
                <span>{todayDataLength}/{tasksLength}</span>
              </div>
            </>
          ) : (
            <div className={`text-[10px] mt-3 font-medium ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
              No tasks available
            </div>
          )}
        </div>

        {/* CARD 2: What to do next */}
        <div className={`${baseCardClass} ${shadowClass} ${priorityBg}`}>
          <div className="relative inline-flex items-center gap-1.5 w-max">
            <span 
              onMouseEnter={() => setShowInfo('priority')}
              onMouseLeave={() => setShowInfo(null)}
              className={`text-[10px] font-semibold uppercase tracking-widest hidden md:flex items-center gap-2 cursor-help underline decoration-dashed underline-offset-4 ${
                isDarkMode ? "text-gray-400 decoration-gray-600" : "text-gray-500 decoration-gray-300"
              }`}
            >
              <Target size={12} /> What to do next
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-widest md:hidden flex items-center gap-2 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}>
              <Target size={12} /> What to do next
            </span>

             {/* Help Icon for Mobile */}
             <button 
                onClick={() => setActiveHelp('priority')}
                className={`transition-colors md:hidden p-1 rounded ${
                  isDarkMode ? "text-gray-600 hover:text-gray-400 hover:bg-white/5" : "text-gray-300 hover:text-gray-500 hover:bg-black/5"
                }`}
              >
                <HelpCircle size={12} />
              </button>

            {showInfo === 'priority' && (
              <div className={`absolute top-6 left-0 text-[10px] px-3 py-2 rounded-lg shadow-lg w-48 z-50 animate-in fade-in zoom-in-95 hidden md:block leading-relaxed border ${
                isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-900 text-white border-transparent"
              }`}>
                What you should focus on next based on your current daily progress.
              </div>
            )}
          </div>
          
          <div className={`mt-3 text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {tasksLength === 0 ? "Initialize objectives." :
             todayDataLength === 0 ? "Start now — no activity yet." :
             todayDataLength < tasksLength / 2 ? "You're behind — take action." :
             todayDataLength < tasksLength ? "Good pace — keep going." :
             "All objectives completed."}
          </div>

          <span className={`text-[10px] mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            {todayDataLength < tasksLength ? "Focus on completing remaining tasks" : "Great job for today"}
          </span>
        </div>

        {/* CARD 3: Your Trend */}
        <div className={`${baseCardClass} ${shadowClass} ${
          isDarkMode ? "bg-[#111111] border-gray-800 hover:border-gray-700" : "bg-white hover:border-gray-300 border-gray-200"
        }`}>
          <div className="relative inline-flex items-center gap-1.5 w-max">
            <span 
              onMouseEnter={() => setShowInfo('momentum')}
              onMouseLeave={() => setShowInfo(null)}
              className={`text-[10px] font-semibold uppercase tracking-widest hidden md:flex items-center gap-2 cursor-help underline decoration-dashed underline-offset-4 ${
                isDarkMode ? "text-gray-400 decoration-gray-600" : "text-gray-500 decoration-gray-300"
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${momentumScore > 0 ? 'bg-green-500 animate-pulse' : momentumScore < 0 ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`} />
              <Zap size={12} className={momentumScore > 0 ? 'text-green-500' : momentumScore < 0 ? 'text-red-500' : 'text-orange-500'} /> 
              Your Trend
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-widest md:hidden flex items-center gap-2 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${momentumScore > 0 ? 'bg-green-500 animate-pulse' : momentumScore < 0 ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`} />
              <Zap size={12} className={momentumScore > 0 ? 'text-green-500' : momentumScore < 0 ? 'text-red-500' : 'text-orange-500'} /> 
              Your Trend
            </span>

             {/* Help Icon for Mobile */}
             <button 
                onClick={() => setActiveHelp('momentum')}
                className={`transition-colors md:hidden p-1 rounded ${
                  isDarkMode ? "text-gray-600 hover:text-gray-400 hover:bg-white/5" : "text-gray-300 hover:text-gray-500 hover:bg-black/5"
                }`}
              >
                <HelpCircle size={12} />
              </button>

            {showInfo === 'momentum' && (
              <div className={`absolute top-6 left-0 text-[10px] px-3 py-2 rounded-lg shadow-lg w-48 z-50 animate-in fade-in zoom-in-95 hidden md:block leading-relaxed border ${
                isDarkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-gray-900 text-white border-transparent"
              }`}>
                Whether your performance is improving or dropping over the last few days.
              </div>
            )}
          </div>
          
          <div className={`mt-3 text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {momentumScore > 0 ? "Upward trend detected. Maintain intensity." : 
             momentumScore < 0 ? "Declining trend. Intervene immediately." : 
             patternInsight}
          </div>

          <span className={`text-[10px] mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            Compared to your last few days
          </span>
        </div>

      </div>

      {/* Global Mobile Help Modal */}
      {activeHelp && (
        <div 
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 pointer-events-auto"
          onClick={() => setActiveHelp(null)}
        >
          <div 
            className={`rounded-[24px] p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 border ${
              isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-transparent"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                <HelpCircle size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
              </div>
              <h3 className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {activeHelp === 'performance' && "Today's Performance"}
                {activeHelp === 'priority' && "What to do next"}
                {activeHelp === 'momentum' && "Your Trend"}
              </h3>
            </div>

            <p className={`text-sm leading-relaxed mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              {activeHelp === 'performance' && "Shows how many tasks you completed today compared to your usual average."}
              {activeHelp === 'priority' && "Guides what you should focus on next based on your current progress today."}
              {activeHelp === 'momentum' && "Shows whether your performance is improving or declining over the last few days."}
            </p>
            
            <p className={`text-[11px] mt-2 italic ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              This helps you understand your daily system.
            </p>

            <button 
              onClick={() => setActiveHelp(null)}
              className={`mt-6 w-full py-3 rounded-xl text-sm font-bold transition-colors active:scale-95 ${
                isDarkMode ? "bg-white text-black hover:bg-gray-200" : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}