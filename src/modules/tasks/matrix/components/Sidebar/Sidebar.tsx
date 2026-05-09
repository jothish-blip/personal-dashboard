"use client";

import React, { useState, useMemo } from 'react';
import { Activity, Flame, BarChart2, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Minus, HelpCircle, ChevronDown } from 'lucide-react';
import { parseLocalDate } from "../../utils";
import { useTheme } from "@/theme/ThemeProvider";

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
  
  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state
  const todayDateObj = useMemo(() => parseLocalDate(actualToday), [actualToday]);

  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string>('hud');

  // PERFORMANCE OPTIMIZATION: Best Day calculation
  const bestDay = useMemo(() => {
    if (!validDays || validDays.length === 0) return null;
    return validDays.reduce((max, d) => d.count > max.count ? d : max, validDays[0]);
  }, [validDays]);

  return (
    <div className="w-full xl:w-[340px] flex-shrink-0 flex flex-col gap-4 md:gap-7">
      
      {/* =========================================
          SECTION 1: ANALYTICS HUD
      ========================================= */}
      <div className={`border rounded-[20px] p-6 flex flex-col gap-6 transition-all duration-300 ease-out hover:-translate-y-[2px] ${
        isDarkMode ? "bg-[#111111] border-gray-800 shadow-none" : "bg-white border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
      }`}>
        
        {/* Header & Mobile Toggle */}
        <div 
          className="flex justify-between items-start cursor-pointer md:cursor-default group"
          onClick={() => setOpenSection(openSection === 'hud' ? '' : 'hud')}
        >
          <div className="flex flex-col gap-1.5 flex-1 pr-4">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                <Activity size={12} /> Performance HUD
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveHelp('hud'); }} 
                className={`transition-colors p-1 rounded-md ${isDarkMode ? "text-gray-600 hover:text-gray-400 hover:bg-gray-800" : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"}`}
              >
                <HelpCircle size={12} />
              </button>
            </div>
            
            <span className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              {overallDiff > 0 ? "You're doing better than last week 🔥" : overallDiff < 0 ? "Performance dropped — take action" : "Same as last week"}
            </span>

            {/* ONE-LINE INSIGHT */}
            <div className={`border rounded-xl px-3 py-2 text-xs font-semibold mt-2 ${
              isDarkMode ? "bg-gray-900/50 border-gray-800 text-gray-300" : "bg-gray-100/60 border-gray-200 text-gray-700"
            }`}>
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
                style={{ background: `conic-gradient(${isDarkMode ? '#10b981' : '#22c55e'} ${consistencyScore}%, ${isDarkMode ? '#1f2937' : '#f3f4f6'} 0%)` }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? "bg-[#111111]" : "bg-white"}`}>
                  <span className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{consistencyScore}%</span>
                </div>
              </div>
              <span className={`text-[8px] font-bold mt-1.5 uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Consistency</span>
              <span className={`text-[9px] font-medium text-center mt-0.5 leading-tight w-16 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>Based on completed days</span>
            </div>
            {/* Mobile Indicator Bounce */}
            <div className={`md:hidden ${openSection !== 'hud' ? 'animate-bounce' : ''}`}>
              <ChevronDown size={16} className={`transition-transform duration-300 ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              } ${openSection === 'hud' ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>

        {/* Collapsible Content */}
        <div className={`${openSection === 'hud' ? 'flex' : 'hidden'} md:flex flex-col gap-7`}>
          
          {/* Empty State Handling */}
          {validDays.length === 0 ? (
            <div className={`text-xs text-center py-4 rounded-xl border border-dashed ${
              isDarkMode ? "bg-[#1a1a1a] border-gray-800 text-gray-500" : "bg-gray-50 border-gray-200 text-gray-400"
            }`}>
              Start completing tasks to see analytics
            </div>
          ) : (
            <>
              {/* PERFORMANCE BAR CHART */}
              <div className="w-full flex flex-col gap-1">
                <div className={`flex items-end justify-between h-20 gap-1.5 rounded-xl p-2 border ${
                  isDarkMode ? "bg-gray-900/30 border-gray-800" : "bg-gray-100/60 border-gray-200"
                }`}>
                  {validDays.slice(-7).map((d, i) => { 
                    const heightPct = chartMaxCount === 0 ? 0 : (d.count / chartMaxCount) * 100;
                    const isToday = d.date === actualToday;
                    
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 gap-2 group cursor-crosshair" title={`${d.count} tasks`}>
                        <div className={`w-full relative flex-1 flex items-end rounded-sm overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`}>
                          <div 
                            className={`w-full rounded-sm transition-all duration-500 ease-out group-hover:scale-110 transform origin-bottom ${
                              isToday ? 'bg-orange-500' : (isDarkMode ? 'bg-emerald-600 group-hover:bg-emerald-500' : 'bg-green-500 group-hover:bg-green-400')
                            }`} 
                            style={{ height: `${heightPct}%` }} 
                          />
                        </div>
                        <span className={`text-[9px] font-bold uppercase ${
                          isToday ? 'text-orange-500' : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                        }`}>{d.label.charAt(0)}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-between items-start mt-1 px-1">
                  {bestDay ? (
                    <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Best day: <span className={`font-bold ${isDarkMode ? "text-emerald-500" : "text-green-600"}`}>{bestDay.label}</span>
                    </div>
                  ) : <div />}
                  <span className={`text-[9px] font-semibold text-right ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    Max: {chartMaxCount}
                  </span>
                </div>
              </div>

              {/* MONTHLY HEATMAP */}
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Monthly Activity</span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {validDays.map((d, i) => {
                    const intensity =
                      d.count === 0 ? (isDarkMode ? 'bg-gray-800/60' : 'bg-gray-100/60') :
                      d.count < 2 ? (isDarkMode ? 'bg-emerald-900/40' : 'bg-green-200') :
                      d.count < 4 ? (isDarkMode ? 'bg-emerald-700/60' : 'bg-green-400') :
                      (isDarkMode ? 'bg-emerald-500' : 'bg-green-600');

                    return (
                      <div 
                        key={i}
                        className={`w-3.5 h-3.5 rounded-sm transition-colors hover:ring-1 ${
                          isDarkMode ? "hover:ring-gray-600" : "hover:ring-gray-300"
                        } ${intensity}`}
                        title={`${d.date}: ${d.count} tasks`}
                      />
                    );
                  })}
                </div>
                {/* Heatmap Legend */}
                <div className={`flex items-center justify-end gap-2 text-[9px] mt-2.5 font-medium ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  <span>Low</span>
                  <div className="flex gap-1">
                    <div className={`w-3 h-3 rounded-sm border ${isDarkMode ? "bg-gray-800/60 border-gray-700" : "bg-gray-100/60 border-gray-200"}`}/>
                    <div className={`w-3 h-3 rounded-sm ${isDarkMode ? "bg-emerald-900/40" : "bg-green-200"}`}/>
                    <div className={`w-3 h-3 rounded-sm ${isDarkMode ? "bg-emerald-700/60" : "bg-green-400"}`}/>
                    <div className={`w-3 h-3 rounded-sm ${isDarkMode ? "bg-emerald-500" : "bg-green-600"}`}/>
                  </div>
                  <span>High</span>
                </div>
              </div>
            </>
          )}

          {/* STREAK & TREND FOOTER */}
          <div className="flex flex-col gap-3">
            {bestGlobalStreak > 1 && (
              <div className={`rounded-xl p-3 border flex items-center justify-between transition-colors ${
                isDarkMode ? "bg-[#1a1a1a] border-gray-800 hover:bg-gray-800" : "bg-white border-gray-200 hover:bg-gray-50"
              }`}>
                <span className={`text-xs font-bold ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>All-Time Peak Streak</span>
                <div className={`flex items-center gap-1 text-xs font-bold rounded-md px-2 py-1 border ${
                  isDarkMode ? "text-orange-400 bg-orange-950/30 border-orange-900/50 shadow-none" : "text-orange-500 bg-orange-50 border-orange-100 shadow-[0_0_8px_rgba(249,115,22,0.2)]"
                }`}>
                  <Flame size={14} /> {bestGlobalStreak} Days
                </div>
              </div>
            )}
            {globalWeekStats.worst && (
              <div className={`rounded-xl p-3 border flex items-center justify-between transition-colors ${
                isDarkMode ? "bg-[#1a1a1a] border-gray-800 hover:bg-gray-800" : "bg-white border-gray-200 hover:bg-gray-50"
              }`}>
                <span className={`text-[10px] font-bold ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Weakest Window:</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-red-400" : "text-red-500"}`}>{globalWeekStats.worst.label}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* =========================================
          SECTION 2: WEEK COMPARISON ENGINE
      ========================================= */}
      <div className={`border rounded-[20px] p-6 transition-all duration-300 ease-out hover:-translate-y-[2px] ${
        isDarkMode ? "bg-[#111111] border-gray-800 shadow-none" : "bg-white border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
      }`}>
        
        {/* Header & Mobile Toggle */}
        <div 
          className="flex items-center justify-between cursor-pointer md:cursor-default mb-2"
          onClick={() => setOpenSection(openSection === 'comparison' ? '' : 'comparison')}
        >
          <div className="flex items-center gap-2">
            <h2 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              <BarChart2 size={16} className={isDarkMode ? "text-gray-500" : "text-gray-500"} /> Comparison
            </h2>
            <button 
              onClick={(e) => { e.stopPropagation(); setActiveHelp('comparison'); }} 
              className={`transition-colors p-1 rounded-md ${
                isDarkMode ? "text-gray-600 hover:text-gray-400 hover:bg-gray-800" : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
              }`}
            >
              <HelpCircle size={12} />
            </button>
          </div>
          
          {/* Mobile Indicator Bounce */}
          <div className={`flex items-center gap-2 md:hidden ${openSection !== 'comparison' ? 'animate-bounce' : ''}`}>
            <ChevronDown size={16} className={`transition-transform duration-300 ${
              isDarkMode ? "text-gray-500" : "text-gray-400"
            } ${openSection === 'comparison' ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Collapsible Content */}
        <div className={`${openSection === 'comparison' ? 'block' : 'hidden'} md:block`}>
          
          <div className={`text-xs mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            This week vs last week performance
          </div>

          <div className={`flex items-center justify-between mb-4 rounded-lg p-1 border ${
            isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-gray-100/60 border-gray-200"
          }`}>
            <button onClick={() => setWeekOffset(o => Math.max(o - 1, -52))} className={`p-1.5 rounded transition-colors shadow-sm ${
              isDarkMode ? "text-gray-400 hover:text-white hover:bg-[#1a1a1a]" : "text-gray-500 hover:text-gray-900 hover:bg-white"
            }`}><ChevronLeft size={14}/></button>
            <span className={`text-[10px] font-bold w-20 text-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {weekOffset === 0 ? 'THIS WEEK' : weekOffset < 0 ? `${Math.abs(weekOffset)}W AGO` : `${weekOffset}W NEXT`}
            </span>
            <button onClick={() => setWeekOffset(o => Math.min(o + 1, 12))} className={`p-1.5 rounded transition-colors shadow-sm ${
              isDarkMode ? "text-gray-400 hover:text-white hover:bg-[#1a1a1a]" : "text-gray-500 hover:text-gray-900 hover:bg-white"
            }`}><ChevronRight size={14}/></button>
          </div>

          <div className="space-y-3">
            {compareCurrentWeek.map((day, i) => {
              const prevCount = comparePrevWeek[i]?.count ?? 0;
              const isFuture = parseLocalDate(day.date) > todayDateObj;
              const diff = isFuture ? null : day.count - prevCount;
              const isToday = day.date === actualToday;
              
              return (
                <div key={day.date} className={`flex items-center justify-between p-3 rounded-[16px] border transition-colors hover:scale-[1.01] ${
                  isToday 
                    ? (isDarkMode ? 'bg-orange-950/20 border-orange-900/50' : 'bg-orange-50 border-orange-200') 
                    : (isDarkMode ? 'bg-gray-900/30 border-transparent hover:bg-gray-800 hover:border-gray-700' : 'bg-gray-100/60 border-transparent hover:bg-gray-100 hover:border-gray-200')
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className={`text-[10px] font-bold uppercase ${
                          isToday ? 'text-orange-500' : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                        }`}>{day.label}</span>
                        {/* Today Highlight Text */}
                        {isToday && <span className={`text-[9px] font-bold ml-1.5 px-1.5 py-0.5 rounded-sm leading-none ${
                          isDarkMode ? "text-orange-400 bg-orange-900/50" : "text-orange-500 bg-orange-100"
                        }`}>Today</span>}
                      </div>
                      <span className={`text-sm font-bold ${
                        isToday ? (isDarkMode ? 'text-orange-400' : 'text-orange-700') : (isDarkMode ? 'text-gray-200' : 'text-gray-700')
                      }`}>{day.dayNum}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold w-6 text-right ${
                      isFuture ? (isDarkMode ? 'text-gray-700' : 'text-gray-300') : (isDarkMode ? 'text-white' : 'text-gray-800')
                    }`}>{isFuture ? '-' : day.count}</span>
                    <div className={`flex items-center justify-center w-14 py-1.5 rounded-md text-[10px] font-bold gap-1 border ${
                      diff === null 
                        ? (isDarkMode ? 'bg-transparent border-transparent text-gray-600' : 'bg-transparent border-transparent text-gray-300') 
                        : diff > 0 
                          ? (isDarkMode ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' : 'bg-green-50 text-green-700 border-green-200') 
                          : diff < 0 
                            ? (isDarkMode ? 'bg-red-950/30 text-red-400 border-red-900/50' : 'bg-red-50 text-red-700 border-red-200') 
                            : (isDarkMode ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200')
                    }`}>
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
          
          <div className={`mt-6 pt-4 border-t flex flex-col gap-1 text-xs ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}>
            <div className="flex justify-between items-center">
              <span className={`font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Week Load Total:</span>
              <span className={`font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{totalCurrent}</span>
            </div>
            <div className={`mt-1 italic text-right font-medium ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
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
          className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[100] p-4 ${
            isDarkMode ? "bg-black/60" : "bg-gray-900/40"
          }`}
          onClick={() => setActiveHelp(null)}
        >
          <div 
            className={`p-6 rounded-3xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 border ${
              isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-transparent"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
                <HelpCircle size={20} className={isDarkMode ? "text-gray-400" : "text-gray-600"} />
              </div>
              <h3 className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {activeHelp === 'hud' && "Performance Overview"}
                {activeHelp === 'comparison' && "Week Comparison"}
              </h3>
            </div>

            <p className={`text-sm leading-relaxed mb-6 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              {activeHelp === 'hud' && "Shows your overall improvement trajectory, consistency score, and daily activity trends at a glance. The heatmap helps you spot long-term habits."}
              {activeHelp === 'comparison' && "Directly compares your output this week against the previous week. Green arrows mean you completed more tasks on that specific day."}
            </p>

            <button 
              onClick={() => setActiveHelp(null)}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-colors active:scale-95 ${
                isDarkMode ? "bg-white text-black hover:bg-gray-200" : "bg-gray-900 hover:bg-gray-800 text-white"
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