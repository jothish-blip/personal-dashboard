"use client";

import React, { useState, useMemo } from 'react';
import { Activity, Flame, BarChart2, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Minus, HelpCircle, ChevronDown } from 'lucide-react';
import { parseLocalDate } from './utils';

interface SidebarProps {
  overallDiff: number;
  consistencyScore: number;
  validDays: { date: string; label: string; count: number }[];
  chartMaxCount: number;
  bestGlobalStreak: number;
  globalWeekStats: { best: any; worst: any };
  compareCurrentWeek: { date: string; label: string; dayNum: string; count: number }[];
  comparePrevWeek: { date: string; count: number }[];
  weekOffset: number;
  setWeekOffset: React.Dispatch<React.SetStateAction<number>>;
  totalCurrent: number;
  actualToday: string;
}

export default function Sidebar({
  overallDiff, consistencyScore, validDays, chartMaxCount, bestGlobalStreak,
  globalWeekStats, compareCurrentWeek, comparePrevWeek, weekOffset, setWeekOffset,
  totalCurrent, actualToday
}: SidebarProps) {
  
  const todayDateObj = useMemo(() => parseLocalDate(actualToday), [actualToday]);

  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string>('hud');

  // 🔥 9. PERFORMANCE OPTIMIZATION: Best Day calculation
  const bestDay = useMemo(() => {
    if (!validDays || validDays.length === 0) return null;
    return validDays.reduce((max, d) => d.count > max.count ? d : max, validDays[0]);
  }, [validDays]);

  return (
    <div className="w-full xl:w-[340px] flex-shrink-0 flex flex-col gap-4 md:gap-7">
      
      {/* =========================================
          SECTION 1: ANALYTICS HUD
      ========================================= */}
      {/* 🔥 10. Micro Polish: smooth transition, hover lift, softer border */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-6 flex flex-col gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all duration-300 ease-out hover:-translate-y-[2px]">
        
        {/* Header & Mobile Toggle */}
        <div 
          className="flex justify-between items-start cursor-pointer md:cursor-default group"
          onClick={() => setOpenSection(openSection === 'hud' ? '' : 'hud')}
        >
          <div className="flex flex-col gap-1.5 flex-1 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Activity size={12} /> Performance HUD
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveHelp('hud'); }} 
                className="text-gray-300 hover:text-gray-500 transition-colors p-1"
              >
                <HelpCircle size={12} />
              </button>
            </div>
            
            <span className="text-sm font-bold text-gray-800">
              {overallDiff > 0 ? "You're doing better than last week 🔥" : overallDiff < 0 ? "Performance dropped — take action" : "Same as last week"}
            </span>

            {/* 🔥 1. ONE-LINE INSIGHT */}
            <div className="bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 mt-2">
              {overallDiff > 0 
                ? "You're improving — keep momentum 🔥"
                : overallDiff < 0 
                  ? "You're slipping — act today ⚠️"
                  : "Stable performance — push further"}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
                style={{ background: `conic-gradient(#22c55e ${consistencyScore}%, #f3f4f6 0%)` }}
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-800">{consistencyScore}%</span>
                </div>
              </div>
              <span className="text-[8px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest">Consistency</span>
              {/* 🔥 4. Consistency Label Context */}
              <span className="text-[9px] font-medium text-gray-400 text-center mt-0.5 leading-tight w-16">Based on completed days</span>
            </div>
            {/* 🔥 7. Mobile Indicator Bounce */}
            <div className={`md:hidden ${openSection !== 'hud' ? 'animate-bounce' : ''}`}>
              <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${openSection === 'hud' ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>

        {/* Collapsible Content */}
        <div className={`${openSection === 'hud' ? 'flex' : 'hidden'} md:flex flex-col gap-7`}>
          
          {/* 🔥 8. Empty State Handling */}
          {validDays.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
              Start completing tasks to see analytics
            </div>
          ) : (
            <>
              {/* PERFORMANCE BAR CHART */}
              <div className="w-full flex flex-col gap-1">
                <div className="flex items-end justify-between h-20 gap-1.5 bg-gray-100/60 rounded-xl p-2 border border-gray-200">
                  {validDays.slice(-7).map((d, i) => { 
                    const heightPct = chartMaxCount === 0 ? 0 : (d.count / chartMaxCount) * 100;
                    const isToday = d.date === actualToday;
                    
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 gap-2 group cursor-crosshair" title={`${d.count} tasks`}>
                        <div className="w-full relative flex-1 flex items-end rounded-sm overflow-hidden bg-gray-200">
                          <div 
                            className={`w-full rounded-sm transition-all duration-500 ease-out group-hover:scale-110 transform origin-bottom ${isToday ? 'bg-orange-400' : 'bg-green-500 group-hover:bg-green-400'}`} 
                            style={{ height: `${heightPct}%` }} 
                          />
                        </div>
                        <span className={`text-[9px] font-bold uppercase ${isToday ? 'text-orange-500' : 'text-gray-400'}`}>{d.label.charAt(0)}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-between items-start mt-1 px-1">
                  {/* 🔥 6. Best Day Insight */}
                  {bestDay ? (
                    <div className="text-xs text-gray-600">
                      Best day: <span className="font-bold text-green-600">{bestDay.label}</span>
                    </div>
                  ) : <div />}
                  {/* 🔥 3. Chart Max Context */}
                  <span className="text-[9px] text-gray-400 font-semibold text-right">
                    Max: {chartMaxCount}
                  </span>
                </div>
              </div>

              {/* MONTHLY HEATMAP */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monthly Activity</span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {validDays.map((d, i) => {
                    const intensity =
                      d.count === 0 ? 'bg-gray-100/60' :
                      d.count < 2 ? 'bg-green-200' :
                      d.count < 4 ? 'bg-green-400' :
                      'bg-green-600';

                    return (
                      <div 
                        key={i}
                        className={`w-3.5 h-3.5 rounded-sm transition-colors hover:ring-1 hover:ring-gray-300 ${intensity}`}
                        title={`${d.date}: ${d.count} tasks`}
                      />
                    );
                  })}
                </div>
                {/* 🔥 2. Heatmap Legend */}
                <div className="flex items-center justify-end gap-2 text-[9px] text-gray-400 mt-2.5 font-medium">
                  <span>Low</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-gray-100/60 rounded-sm border border-gray-200"/>
                    <div className="w-3 h-3 bg-green-200 rounded-sm"/>
                    <div className="w-3 h-3 bg-green-400 rounded-sm"/>
                    <div className="w-3 h-3 bg-green-600 rounded-sm"/>
                  </div>
                  <span>High</span>
                </div>
              </div>
            </>
          )}

          {/* STREAK & TREND FOOTER */}
          <div className="flex flex-col gap-3">
            {bestGlobalStreak > 1 && (
              <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <span className="text-xs font-bold text-gray-600">All-Time Peak Streak</span>
                <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-1 rounded-md text-xs font-bold border border-orange-100 shadow-[0_0_8px_rgba(249,115,22,0.2)]">
                  <Flame size={14} /> {bestGlobalStreak} Days
                </div>
              </div>
            )}
            {globalWeekStats.worst && (
              <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <span className="text-[10px] font-bold text-gray-500">Weakest Window:</span>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{globalWeekStats.worst.label}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* =========================================
          SECTION 2: WEEK COMPARISON ENGINE
      ========================================= */}
      {/* 🔥 10. Micro Polish: smooth transition, hover lift, softer border */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all duration-300 ease-out hover:-translate-y-[2px]">
        
        {/* Header & Mobile Toggle */}
        <div 
          className="flex items-center justify-between cursor-pointer md:cursor-default mb-2"
          onClick={() => setOpenSection(openSection === 'comparison' ? '' : 'comparison')}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
              <BarChart2 size={16} className="text-gray-500" /> Comparison
            </h2>
            <button 
              onClick={(e) => { e.stopPropagation(); setActiveHelp('comparison'); }} 
              className="text-gray-300 hover:text-gray-500 transition-colors p-1"
            >
              <HelpCircle size={12} />
            </button>
          </div>
          
          {/* 🔥 7. Mobile Indicator Bounce */}
          <div className={`flex items-center gap-2 md:hidden ${openSection !== 'comparison' ? 'animate-bounce' : ''}`}>
            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${openSection === 'comparison' ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Collapsible Content */}
        <div className={`${openSection === 'comparison' ? 'block' : 'hidden'} md:block`}>
          
          <div className="text-xs text-gray-500 mb-4">
            This week vs last week performance
          </div>

          <div className="flex items-center justify-between mb-4 bg-gray-100/60 rounded-lg p-1 border border-gray-200">
            <button onClick={() => setWeekOffset(o => Math.max(o - 1, -52))} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded transition-colors shadow-sm"><ChevronLeft size={14}/></button>
            <span className="text-[10px] font-bold w-20 text-center text-gray-600">{weekOffset === 0 ? 'THIS WEEK' : weekOffset < 0 ? `${Math.abs(weekOffset)}W AGO` : `${weekOffset}W NEXT`}</span>
            <button onClick={() => setWeekOffset(o => Math.min(o + 1, 12))} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded transition-colors shadow-sm"><ChevronRight size={14}/></button>
          </div>

          <div className="space-y-3">
            {compareCurrentWeek.map((day, i) => {
              const prevCount = comparePrevWeek[i]?.count ?? 0;
              const isFuture = parseLocalDate(day.date) > todayDateObj;
              const diff = isFuture ? null : day.count - prevCount;
              const isToday = day.date === actualToday;
              
              return (
                <div key={day.date} className={`flex items-center justify-between p-3 rounded-[16px] border transition-colors hover:scale-[1.01] ${isToday ? 'bg-orange-50 border-orange-200' : 'bg-gray-100/60 border-transparent hover:bg-gray-100 hover:border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-orange-500' : 'text-gray-400'}`}>{day.label}</span>
                        {/* 🔥 5. Today Highlight Text */}
                        {isToday && <span className="text-[9px] text-orange-500 font-bold ml-1.5 px-1.5 py-0.5 bg-orange-100 rounded-sm leading-none">Today</span>}
                      </div>
                      <span className={`text-sm font-bold ${isToday ? 'text-orange-700' : 'text-gray-700'}`}>{day.dayNum}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold w-6 text-right ${isFuture ? 'text-gray-300' : 'text-gray-800'}`}>{isFuture ? '-' : day.count}</span>
                    <div className={`flex items-center justify-center w-14 py-1.5 rounded-md text-[10px] font-bold gap-1 ${diff === null ? 'bg-transparent text-gray-300' : diff > 0 ? 'bg-green-50 text-green-700 border border-green-200' : diff < 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                      {diff === null && <span>--</span>}
                      {diff !== null && diff > 0 && <><ArrowUpRight size={12} strokeWidth={3} /> +{diff}</>}
                      {diff !== null && diff < 0 && <><ArrowDownRight size={12} strokeWidth={3} /> {diff}</>}
                      {diff !== null && diff === 0 && <><Minus size={12} strokeWidth={3} /> 0</>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col gap-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-500">Week Load Total:</span>
              <span className="font-bold text-gray-800">{totalCurrent}</span>
            </div>
            <div className="text-gray-500 mt-1 italic text-right font-medium">
              {totalCurrent > 20 ? "Strong week 💪" : totalCurrent > 0 ? "Building momentum" : "Room to improve"}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          HELP MODAL SYSTEM
      ========================================= */}
      {activeHelp && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => setActiveHelp(null)}
        >
          <div 
            className="bg-white p-6 rounded-3xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-xl">
                <HelpCircle size={20} className="text-gray-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">
                {activeHelp === 'hud' && "Performance Overview"}
                {activeHelp === 'comparison' && "Week Comparison"}
              </h3>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {activeHelp === 'hud' && "Shows your overall improvement trajectory, consistency score, and daily activity trends at a glance. The heatmap helps you spot long-term habits."}
              {activeHelp === 'comparison' && "Directly compares your output this week against the previous week. Green arrows mean you completed more tasks on that specific day."}
            </p>

            <button 
              onClick={() => setActiveHelp(null)}
              className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
}