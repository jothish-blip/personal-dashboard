import React from "react";
import { X, Construction, Terminal, Mail } from "lucide-react";

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProgressModal({ isOpen, onClose }: ProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden relative border border-orange-100">
        <div className="absolute top-0 left-0 w-full h-2 bg-orange-500" />
        
        <div className="p-8 md:p-10 space-y-6">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-orange-50 rounded-2xl">
              <Construction className="text-orange-600" size={32} />
            </div>
            <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-900 leading-tight">System Under Development</h2>
            <div className="flex items-center gap-2 text-orange-600">
              <Terminal size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Active Progress Mode</span>
            </div>
          </div>

          <div className="space-y-4 text-slate-600 text-sm leading-relaxed font-medium">
            <p>This system is currently <span className="text-slate-900 font-bold">Under Progress</span>. We are working hard with our developers to bring you advanced modules and refined logic.</p>
            <p>As this is an alpha build, you might encounter <span className="text-orange-600 font-bold">bugs</span>. We appreciate your patience as we stabilize the core features.</p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Feedback & Reports</p>
              <a href="mailto:jothishgandham2@gmail.com" className="flex items-center gap-2 text-slate-900 hover:text-orange-600 transition-colors">
                <Mail size={14} />
                <span className="font-bold underline">jothishgandham2@gmail.com</span>
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Developer Lead</p>
              <p className="text-sm font-black text-slate-900">Jothish Gandham</p>
            </div>
            <button 
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}