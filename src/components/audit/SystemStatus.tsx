import React from 'react';
import { AlertTriangle, BrainCircuit } from 'lucide-react';

interface SystemStatusProps {
  focusScore: number;
  instabilityIndex: number;
  trend: number; // 🔥 Behavioral trend (delta from previous period)
}

export default function SystemStatus({ focusScore, instabilityIndex, trend }: SystemStatusProps) {
  
  // 🔥 STEP 2: Behavioral Status Logic
  const getStatus = () => {
    if (trend > 0) return "improving";
    if (trend < 0) return "dropping";
    if (instabilityIndex > 60) return "volatile";
    return "stable";
  };

  const status = getStatus();

  // 🔥 STEP 3 & 4: Color and Text Mapping
  const statusColor =
    status === "improving" ? "bg-green-500" :
    status === "dropping" ? "bg-red-500" :
    status === "volatile" ? "bg-red-400" :
    "bg-gray-400";

  const statusText =
    status === "improving" ? `+${trend} Improving` :
    status === "dropping" ? `${trend} Dropping` :
    status === "volatile" ? "Workflow Unstable" :
    "Stable Performance";

  const themeColor = 
    status === "improving" ? "bg-green-600" :
    status === "dropping" ? "bg-red-600" :
    status === "volatile" ? "bg-red-500" :
    "bg-gray-700";

  return (
    <>
      {/* MAIN STATUS BAR */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full shadow-inner animate-pulse ${statusColor}`} />
            <span className="text-sm font-bold text-gray-800">
              {statusText}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Live Audit
          </span>
        </div>
        
        {/* 🔥 STEP 7: MINI INSIGHT */}
        <div className="text-[11px] text-gray-500 font-medium ml-[22px]">
          {trend > 0 && "Current velocity is higher than previous period"}
          {trend < 0 && "Current velocity has dropped significantly"}
          {trend === 0 && "Execution remains consistent with yesterday"}
        </div>
      </div>

      {/* 🔥 STEP 6: IMPROVED ALERT LOGIC */}
      {(trend < 0 || instabilityIndex > 60) && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <AlertTriangle size={18} />
          {trend < 0
            ? "Performance decline detected — immediate intervention required"
            : "High churn rate — workflow instability detected"}
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mt-2">
        <div className="flex flex-row items-center gap-3">
          {/* 🔥 STEP 8: DYNAMIC THEME ICON */}
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-white shadow-md transition-colors duration-500 ${themeColor}`}>
            <BrainCircuit size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 m-0 tracking-tight">NexEngine Intel</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Behavior Analytics v2.0</p>
          </div>
        </div>
      </div>
    </>
  );
}