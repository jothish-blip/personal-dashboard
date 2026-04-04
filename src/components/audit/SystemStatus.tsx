import React from 'react';
import { AlertTriangle, BrainCircuit } from 'lucide-react';

interface SystemStatusProps {
  focusScore: number;
  instabilityIndex: number;
}

export default function SystemStatus({ focusScore, instabilityIndex }: SystemStatusProps) {
  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shadow-inner ${
            focusScore > 60 ? 'bg-green-500' :
            instabilityIndex > 50 ? 'bg-red-500' :
            'bg-orange-500'
          }`} />
          <span className="text-sm font-semibold text-gray-700">
            {focusScore > 60
              ? "Execution Stable"
              : instabilityIndex > 50
              ? "System Volatile"
              : "Moderate Activity"}
          </span>
        </div>
        <span className="text-xs text-gray-400 font-medium tracking-wide">
          Live Audit
        </span>
      </div>

      {instabilityIndex > 50 && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-medium flex items-center gap-3 shadow-sm">
          <AlertTriangle size={18} /> High deletion activity — unstable workflow detected
        </div>
      )}

      <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mt-2">
        <div className="flex flex-row items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-500 rounded-xl text-white shadow-sm">
            <BrainCircuit size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-800 m-0">NexEngine Intel</h1>
            <p className="text-xs text-gray-400 mt-0.5">Behavior Analytics</p>
          </div>
        </div>
      </div>
    </>
  );
}