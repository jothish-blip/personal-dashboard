"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { useTheme } from "@/theme/ThemeProvider"; // 🔥 Import the theme provider

interface HeatmapData {
  date: string; // YYYY-MM-DD
  count: number;
  intensity: number;
  delta: number;
}

interface HeatmapProps {
  heatmapData: HeatmapData[];
}

type TimeRange = '30D' | '90D' | 'Year';

export default function Heatmap({ heatmapData }: HeatmapProps) {
  const { isDarkMode } = useTheme(); // 🔥 Consume theme state

  const [selectedDay, setSelectedDay] = useState<HeatmapData | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{ day: HeatmapData, x: number, y: number } | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('90D');
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 1. FILTER DATA BY TIME RANGE
  const filteredData = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) return [];
    const days = timeRange === '30D' ? 30 : timeRange === '90D' ? 90 : 365;
    return heatmapData.slice(-days);
  }, [heatmapData, timeRange]);

  // Auto-select "today" (the last item)
  useEffect(() => {
    if (filteredData.length > 0) {
      setSelectedDay(filteredData[filteredData.length - 1]);
    }
  }, [filteredData]);

  // Handle smart scroll visibility & auto-scroll to latest
  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    // Show arrow if we are not at the very end
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
      checkScroll();
    }
  }, [filteredData]);

  // 2. CALENDAR ALIGNMENT (Mon-Sun)
  const { weeks, months } = useMemo(() => {
    if (filteredData.length === 0) return { weeks: [], months: [] };

    const w: (HeatmapData | null)[][] = [];
    const m: { label: string, colIndex: number }[] = [];
    
    // Find starting weekday (0 = Sun, 1 = Mon... we want Mon = 0, Sun = 6)
    const firstDate = new Date(filteredData[0].date);
    let startDayIndex = firstDate.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6; // Sunday wrap-around

    let currentWeek: (HeatmapData | null)[] = Array(startDayIndex).fill(null);
    let lastMonth = -1;

    filteredData.forEach((day) => {
      const dateObj = new Date(day.date);
      
      // Track month labels
      if (dateObj.getMonth() !== lastMonth && currentWeek.length === 0) {
        m.push({ label: dateObj.toLocaleString('default', { month: 'short' }), colIndex: w.length });
        lastMonth = dateObj.getMonth();
      }

      currentWeek.push(day);

      if (currentWeek.length === 7) {
        w.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      w.push(currentWeek);
    }

    return { weeks: w, months: m };
  }, [filteredData]);

  // 3. BEHAVIORAL COLOR SYSTEM (Updated for Dark Mode)
  const getColor = (day: HeatmapData | null) => {
    if (!day) return "bg-transparent"; // Empty padding cell
    
    if (day.count === 0) {
      return isDarkMode ? "bg-[#1a1a1a] border border-gray-800" : "bg-slate-100/80 border border-gray-200/60";
    }
    
    if (day.delta >= 0) {
      if (day.intensity >= 4) return isDarkMode ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" : "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]";
      if (day.intensity === 3) return isDarkMode ? "bg-emerald-600" : "bg-green-400";
      if (day.intensity === 2) return isDarkMode ? "bg-emerald-800/80" : "bg-green-300";
      return isDarkMode ? "bg-emerald-950/60" : "bg-green-200";
    } else {
      if (day.intensity >= 3) return isDarkMode ? "bg-red-600" : "bg-red-400";
      return isDarkMode ? "bg-red-950/60" : "bg-red-300";
    }
  };

  // 4. BEHAVIORAL INSIGHTS
  const getInsight = (day: HeatmapData) => {
    if (day.count === 0) return { text: "Rest day or missed", icon: "⏸️", color: isDarkMode ? "text-gray-500" : "text-gray-500" };
    if (day.delta >= 4) return { text: "Strong momentum", icon: "🔥", color: isDarkMode ? "text-orange-400" : "text-orange-500" };
    if (day.delta > 0) return { text: "Solid progress", icon: "📈", color: isDarkMode ? "text-emerald-400" : "text-green-600" };
    if (day.delta === 0) return { text: "Maintaining consistency", icon: "⚡", color: isDarkMode ? "text-blue-400" : "text-blue-500" };
    if (day.delta < -3) return { text: "Performance dip", icon: "⚠️", color: isDarkMode ? "text-red-400" : "text-red-500" };
    return { text: "Cooling down", icon: "📉", color: isDarkMode ? "text-amber-400" : "text-amber-500" };
  };

  const todayStr = heatmapData.length > 0 ? heatmapData[heatmapData.length - 1].date : "";

  return (
    <div className="flex flex-col xl:flex-row gap-4">
      
      {/* MAIN HEATMAP CONTAINER */}
      <div className={`border rounded-[20px] p-4 md:p-5 shadow-sm relative flex-1 min-w-0 transition-colors duration-300 ${
        isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
      }`}>
        
        {/* Header & Filters */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
            <Calendar size={16} className={isDarkMode ? "text-blue-400" : "text-blue-500"} /> Execution Map
          </h3>
          <div className={`flex items-center gap-1 p-1 rounded-lg border transition-colors ${
            isDarkMode ? "bg-[#1a1a1a] border-gray-800" : "bg-gray-100/80 border-gray-200/60"
          }`}>
            {(['30D', '90D', 'Year'] as TimeRange[]).map(range => (
              <button 
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  timeRange === range 
                    ? (isDarkMode ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') 
                    : (isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Heatmap Grid Area */}
        <div className="flex relative">
          
          {/* Weekday Labels (Y-Axis) */}
          <div className={`flex flex-col gap-[3px] mt-[22px] mr-2 text-[9px] font-bold select-none pt-[2px] ${
            isDarkMode ? "text-gray-600" : "text-gray-400"
          }`}>
            <span className="h-[18px] md:h-[13px] flex items-center">M</span>
            <span className="h-[18px] md:h-[13px]"></span>
            <span className="h-[18px] md:h-[13px] flex items-center">W</span>
            <span className="h-[18px] md:h-[13px]"></span>
            <span className="h-[18px] md:h-[13px] flex items-center">F</span>
            <span className="h-[18px] md:h-[13px]"></span>
            <span className="h-[18px] md:h-[13px] flex items-center">S</span>
          </div>

          {/* Scrollable Grid */}
          <div 
            className="w-full overflow-x-auto pb-4 custom-scrollbar relative scroll-smooth" 
            ref={scrollContainerRef}
            onScroll={checkScroll}
          >
            
            {/* Months Header (X-Axis) */}
            <div className="relative h-5 mb-1 min-w-max">
              {months.map((m, i) => (
                <span key={i} className={`absolute text-[10px] font-bold select-none ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} style={{ left: `${m.colIndex * (typeof window !== 'undefined' && window.innerWidth < 768 ? 21 : 16)}px` }}>
                  {m.label}
                </span>
              ))}
            </div>

            {/* Grid Columns */}
            <div className="min-w-max flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => {
                    if (!day) return <div key={`empty-${wi}-${di}`} className="w-[18px] h-[18px] md:w-[13px] md:h-[13px] bg-transparent" />;
                    
                    const isSelected = selectedDay?.date === day.date;
                    const isToday = day.date === todayStr;

                    return (
                      <div
                        key={day.date}
                        onClick={() => setSelectedDay(day)}
                        onMouseEnter={(e) => setHoveredDay({ day, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`relative w-[18px] h-[18px] md:w-[13px] md:h-[13px] rounded-[3px] md:rounded-[2px] cursor-pointer transition-all duration-200
                          ${getColor(day)} 
                          ${isSelected 
                            ? (isDarkMode ? 'ring-[2.5px] ring-gray-300 scale-110 z-20 animate-[scaleUp_0.2s_ease-out]' : 'ring-[2.5px] ring-gray-800 scale-110 z-20 animate-[scaleUp_0.2s_ease-out]') 
                            : (isDarkMode ? 'hover:scale-[1.08] hover:z-10 hover:ring-2 hover:ring-gray-600' : 'hover:scale-[1.08] hover:z-10 hover:ring-2 hover:ring-gray-300')
                          }
                        `}
                      >
                        {/* Premium "Today" indicator */}
                        {isToday && (
                          <div className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full border z-30 ${
                            isDarkMode ? "bg-blue-400 border-[#111111]" : "bg-blue-500 border-white"
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            
            {/* Scroll indicator fade */}
            {canScrollRight && (
              <div className={`sticky right-0 top-0 h-full w-8 pointer-events-none float-right -ml-8 flex items-center justify-end pr-1 opacity-70 transition-opacity duration-300 ${
                isDarkMode ? "bg-gradient-to-l from-[#111111] to-transparent" : "bg-gradient-to-l from-white to-transparent"
              }`}>
                <ChevronRight size={14} className={isDarkMode ? "text-gray-500 animate-pulse" : "text-gray-400 animate-pulse"}/>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className={`flex items-center justify-end gap-1.5 mt-2 text-[9px] font-bold uppercase tracking-wider ${
          isDarkMode ? "text-gray-600" : "text-gray-400"
        }`}>
          <span>Lower Output</span>
          <div className="flex gap-[2px]">
            <div className={`w-[10px] h-[10px] rounded-[2px] border ${isDarkMode ? "bg-[#1a1a1a] border-gray-800" : "bg-slate-100 border-gray-200"}`}></div>
            <div className={`w-[10px] h-[10px] rounded-[2px] ${isDarkMode ? "bg-emerald-950/60" : "bg-green-200"}`}></div>
            <div className={`w-[10px] h-[10px] rounded-[2px] ${isDarkMode ? "bg-emerald-800/80" : "bg-green-300"}`}></div>
            <div className={`w-[10px] h-[10px] rounded-[2px] ${isDarkMode ? "bg-emerald-600" : "bg-green-400"}`}></div>
            <div className={`w-[10px] h-[10px] rounded-[2px] ${isDarkMode ? "bg-emerald-500" : "bg-green-500"}`}></div>
          </div>
          <span>Higher Output</span>
        </div>

      </div>

      {/* SELECTED DAY INSIGHTS PANEL (Side panel) */}
      {selectedDay && (
        <div className={`border shadow-sm rounded-[20px] p-5 flex flex-col xl:w-64 transition-all duration-300 animate-in fade-in zoom-in-95 ${
          isDarkMode ? "bg-[#111111] border-gray-800" : "bg-[#f8fafc] border-gray-200/80"
        }`}>
          <div className={`text-[11px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5 ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}>
            {new Date(selectedDay.date).toLocaleDateString('en-US', { weekday: 'long' })}
            {selectedDay.date === todayStr && (
              <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] ml-auto ${
                isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700"
              }`}>
                Today
              </span>
            )}
          </div>
          <div className={`text-2xl font-black mb-6 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {new Date(selectedDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>

          <div className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            <span className={`font-black text-xl mr-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{selectedDay.count}</span> 
            Tasks
          </div>
          
          <div className={`text-sm font-bold mt-1 mb-4 ${
            selectedDay.delta > 0 
              ? (isDarkMode ? "text-emerald-400" : "text-green-600") 
              : selectedDay.delta < 0 
                ? (isDarkMode ? "text-red-400" : "text-red-500") 
                : (isDarkMode ? "text-gray-500" : "text-gray-500")
          }`}>
            {selectedDay.delta > 0 && `+${selectedDay.delta} improvement`}
            {selectedDay.delta < 0 && `${selectedDay.delta} from yesterday`}
            {selectedDay.delta === 0 && selectedDay.count > 0 && `Maintained output`}
            {selectedDay.delta === 0 && selectedDay.count === 0 && `No activity`}
          </div>

          <div className={`mt-auto pt-4 border-t text-sm font-bold flex items-center gap-2 ${
            isDarkMode ? "border-gray-800" : "border-gray-200"
          } ${getInsight(selectedDay).color}`}>
            <span>{getInsight(selectedDay).text}</span>
            <span>{getInsight(selectedDay).icon}</span>
          </div>
        </div>
      )}

      {/* CUSTOM HOVER TOOLTIP */}
      {hoveredDay && typeof window !== 'undefined' && window.innerWidth >= 768 && (
        <div 
          className={`fixed z-[100] text-xs px-3 py-2 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-10px] animate-in zoom-in-95 duration-100 ${
            isDarkMode ? "bg-white text-gray-900" : "bg-gray-900 text-white"
          }`}
          style={{ left: hoveredDay.x, top: hoveredDay.y }}
        >
          <div className="font-bold mb-0.5">{new Date(hoveredDay.day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          <div className={isDarkMode ? "text-gray-700" : "text-gray-300"}>
            <span className={`font-bold ${isDarkMode ? "text-black" : "text-white"}`}>{hoveredDay.day.count}</span> tasks
            <span className={`ml-2 font-bold ${
              hoveredDay.day.delta > 0 
                ? (isDarkMode ? "text-emerald-600" : "text-green-400") 
                : hoveredDay.day.delta < 0 
                  ? (isDarkMode ? "text-red-600" : "text-red-400") 
                  : (isDarkMode ? "text-gray-500" : "text-gray-400")
            }`}>
              {hoveredDay.day.delta > 0 ? `+${hoveredDay.day.delta}` : hoveredDay.day.delta < 0 ? hoveredDay.day.delta : "="}
            </span>
          </div>
          <div className={`absolute left-1/2 bottom-0 w-2 h-2 rotate-45 transform -translate-x-1/2 translate-y-1/2 ${
            isDarkMode ? "bg-white" : "bg-gray-900"
          }`}></div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? '#3f3f46' : '#e5e7eb'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? '#52525b' : '#d1d5db'}; }
        @keyframes scaleUp {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1.1); }
        }
      `}} />
    </div>
  );
}