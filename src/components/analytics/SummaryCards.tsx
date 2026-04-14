import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Activity, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Info, 
  AlertTriangle 
} from 'lucide-react';
import { FilteredData } from './utils';

interface SummaryCardsProps {
  stats: FilteredData['stats'];
  momentum: number;
  isSyncing?: boolean;
}

function SummaryCards({ stats, momentum, isSyncing = false }: SummaryCardsProps) {
  // 🔥 STEP 1: Clean Interactive Help State
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  
  // 🔥 STEP 1 (NEW): Collapsible State
  const [isOpen, setIsOpen] = useState(true);

  // 🔥 STEP 2: Auto Mobile Close
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, []);

  const toggleHelp = (id: string) => {
    setActiveHelp(prev => prev === id ? null : id);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[20px] shadow-sm overflow-hidden">

      {/* 🔥 HEADER */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between p-4 text-left outline-none"
      >
        <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">
          Insights
        </span>

        <span className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          <TrendingUp size={16} />
        </span>
      </button>

      {/* 🔥 COLLAPSIBLE CONTENT */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100 p-4 pt-0" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          
          {/* 🔴 GLOBAL WARNING BANNER */}
          {stats.consistencyPercent < 30 && (
            <div className="col-span-full bg-red-50 border border-red-200 text-red-600 text-sm font-bold p-3 rounded-xl flex items-center gap-2 shadow-sm animate-in fade-in">
              <AlertTriangle size={18} />
              ⚠️ Execution collapsing — take corrective action
            </div>
          )}

          {/* 🟢 1. MOMENTUM CARD */}
          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Momentum</span>
                <button onClick={() => toggleHelp("momentum")} className="text-gray-300 hover:text-gray-600 transition-colors outline-none">
                  <Info size={12} />
                </button>
              </div>
              <Activity size={16} className={momentum >= 0 ? "text-green-500" : "text-red-500"} />
            </div>
            <h3 className={`text-2xl font-black ${momentum >= 0 ? "text-green-600" : "text-red-500"}`}>
              {momentum >= 0 ? `+${momentum}` : momentum}
            </h3>
            <span className="text-[10px] font-bold mt-1 text-gray-400">
              vs yesterday
            </span>

            {/* 🔥 STEP 2: Ultra Simple Help */}
            {activeHelp === "momentum" && (
              <div className="mt-2 text-[11px] text-gray-500 animate-in fade-in duration-200">
                Change compared to yesterday.
              </div>
            )}
          </div>
          
          {/* 2. TOTAL DONE */}
          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Done</span>
                <button onClick={() => toggleHelp("total")} className="text-gray-300 hover:text-gray-600 transition-colors outline-none">
                  <Info size={12} />
                </button>
              </div>
              <CheckCircle2 size={16} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-800 flex items-end gap-2">
              {stats.totalCompletions}
            </h3>
            <div className="flex flex-col mt-1">
              <span className={`text-[10px] font-bold ${stats.delta > 0 ? 'text-green-600' : stats.delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {stats.delta > 0 ? "↑ " : stats.delta < 0 ? "↓ " : "→ "}
                {stats.delta > 0 && "Improving 📈"}
                {stats.delta < 0 && "Declining 📉"}
                {stats.delta === 0 && "No change"}
              </span>
              <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                {stats.totalCompletions > 50 ? "High output 🚀" :
                 stats.totalCompletions > 20 ? "Good progress 👍" : "Low activity ⚠️"}
              </span>
              {isSyncing && (
                <span className="text-[9px] text-blue-500 font-bold mt-1 animate-pulse">
                  Syncing...
                </span>
              )}
            </div>

            {activeHelp === "total" && (
              <div className="mt-2 text-[11px] text-gray-500 animate-in fade-in duration-200">
                Total completed tasks.
              </div>
            )}
          </div>
          
          {/* 3. CONSISTENCY */}
          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Consistency</span>
                <button onClick={() => toggleHelp("consistency")} className="text-gray-300 hover:text-gray-600 transition-colors outline-none">
                  <Info size={12} />
                </button>
              </div>
              <Activity size={16} className={stats.consistencyPercent >= 70 ? 'text-green-500' : stats.consistencyPercent >= 40 ? 'text-orange-500' : 'text-red-500'} />
            </div>
            <h3 className={`text-2xl font-black ${stats.consistencyPercent >= 70 ? 'text-green-600' : stats.consistencyPercent >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
              {stats.consistencyPercent}%
            </h3>
            <div className={`text-[9px] font-bold mt-2 px-2 py-1 rounded inline-block w-max ${
              stats.consistencyPercent >= 70 ? 'bg-green-50 text-green-700' : 
              stats.consistencyPercent >= 40 ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'
            }`}>
              {stats.consistencyPercent >= 70 && "Execution Strong 💪"}
              {stats.consistencyPercent >= 40 && stats.consistencyPercent < 70 && "Inconsistent ⚖️"}
              {stats.consistencyPercent < 40 && "Breaking Pattern ⚠️"}
            </div>

            {activeHelp === "consistency" && (
              <div className="mt-2 text-[11px] text-gray-500 animate-in fade-in duration-200">
                How regularly you complete tasks.
              </div>
            )}
          </div>

          {/* 4. ACTIVE DAYS */}
          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Days</span>
                <button onClick={() => toggleHelp("active")} className="text-gray-300 hover:text-gray-600 transition-colors outline-none">
                  <Info size={12} />
                </button>
              </div>
              <CalendarIcon size={16} className="text-orange-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-800">{stats.activeDays} <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Days</span></h3>
            <span className={`text-[10px] font-bold mt-1 ${stats.zeroDays > 0 ? 'text-red-500' : 'text-orange-500'}`}>
              {stats.zeroDays > 0 ? `${stats.zeroDays} missed days` : "No breaks 🔥"}
            </span>

            {activeHelp === "active" && (
              <div className="mt-2 text-[11px] text-gray-500 animate-in fade-in duration-200">
                Days you actually worked.
              </div>
            )}
          </div>
          
          {/* 5. PEAK VELOCITY */}
          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Peak Velocity</span>
                <button onClick={() => toggleHelp("peak")} className="text-gray-300 hover:text-gray-600 transition-colors outline-none">
                  <Info size={12} />
                </button>
              </div>
              <TrendingUp size={16} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-800">{stats.peakVolume} <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Reps</span></h3>
            <span className="text-[10px] font-bold mt-1 text-orange-500">
              Best performance {stats.peakText}
            </span>

            {activeHelp === "peak" && (
              <div className="mt-2 text-[11px] text-gray-500 animate-in fade-in duration-200">
                Your highest output day.
              </div>
            )}
          </div>

          {/* 6. AVG / DAY */}
          <div className="bg-white p-5 rounded-[16px] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg / Day</span>
                <button onClick={() => toggleHelp("avg")} className="text-gray-300 hover:text-gray-600 transition-colors outline-none">
                  <Info size={12} />
                </button>
              </div>
              <Activity size={16} className="text-blue-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-800">{stats.avgPerDay}</h3>
            <div className="text-[9px] mt-2 font-bold text-gray-500">
              {stats.avgPerDay > 5 ? "High Load 🔥" :
               stats.avgPerDay > 2 ? "Moderate Load ⚖️" : "Low Load 💤"}
            </div>

            {activeHelp === "avg" && (
              <div className="mt-2 text-[11px] text-gray-500 animate-in fade-in duration-200">
                Average tasks per day.
              </div>
            )}
          </div>

          {/* 7. WEAKEST DAY */}
          <div className="bg-red-50 p-5 rounded-[16px] border border-red-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Weakest Day</span>
                <button onClick={() => toggleHelp("weak")} className="text-red-300 hover:text-red-600 transition-colors outline-none">
                  <Info size={12} />
                </button>
              </div>
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <h3 className="text-[13px] font-bold text-red-600 leading-snug mt-1">
              {stats.worstDayInsight}
            </h3>
            
            {stats.consistencyPercent < 40 && (
              <div className="mt-2 text-[10px] text-red-500 font-bold flex items-center gap-1 bg-red-100/50 p-1.5 rounded-lg w-max border border-red-100">
                ⚠️ System instability detected
              </div>
            )}

            {activeHelp === "weak" && (
              <div className="mt-2 text-[11px] text-red-500 animate-in fade-in duration-200">
                Where you fail most.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default React.memo(SummaryCards);