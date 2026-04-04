import React from "react";
import { ShieldCheck, Activity, Download, Plus } from "lucide-react";

interface TopBarProps {
  systemVersion: number;
  onAddClick: () => void;
}

export default function TopBar({ systemVersion, onAddClick }: TopBarProps) {
  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-orange-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">v{systemVersion} Operational</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"><Download size={16} /></button>
          <button onClick={onAddClick} className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 transition-all flex items-center gap-2">
            <Plus size={14} /> New Record
          </button>
        </div>
      </div>
    </div>
  );
}