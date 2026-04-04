import React from "react";
import { ShieldCheck, BarChart3 } from "lucide-react";

interface AnalyticsSidebarProps {
  analytics: {
    score: number;
    rate: number;
    statusCounts: { completed: number; pending: number; missed: number };
  }
}

function MiniStatus({ label, val, color }: { label: string, val: number, color: string }) {
  return (
    <div className="bg-slate-50 p-3 rounded-xl text-center">
      <div className={`w-2 h-2 ${color} rounded-full mx-auto mb-1`} />
      <p className="text-[8px] font-black text-slate-400 uppercase">{label}</p>
      <p className="text-xs font-bold">{val}</p>
    </div>
  );
}

export default function AnalyticsSidebar({ analytics }: AnalyticsSidebarProps) {
  return (
    <div className="lg:col-span-4 space-y-10">
      <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Core Performance</span>
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold">
              <ShieldCheck size={12} /> Live Sync
            </div>
          </div>
          <div>
            <h2 className="text-7xl font-bold tracking-tighter leading-none">{analytics.score}</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Net Efficiency Index</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
              <span>Global Accuracy</span>
              <span>{analytics.rate}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${analytics.rate}%` }} />
            </div>
          </div>
        </div>
        <BarChart3 className="absolute -right-10 -bottom-10 text-white/5" size={240} />
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Status Allocation</h3>
        <div className="flex justify-center py-4">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
              <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f97316" strokeWidth="4" 
                strokeDasharray={`${analytics.rate}, 100`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{analytics.statusCounts.completed}</span>
              <span className="text-[8px] font-black text-slate-400 uppercase">Records</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MiniStatus label="Done" val={analytics.statusCounts.completed} color="bg-emerald-500" />
          <MiniStatus label="Wait" val={analytics.statusCounts.pending} color="bg-orange-500" />
          <MiniStatus label="Miss" val={analytics.statusCounts.missed} color="bg-red-500" />
        </div>
      </div>
    </div>
  );
}