import React from "react";
import { X, PlusCircle, CheckCircle2, RotateCcw, TrendingUp, Activity, BookOpen } from "lucide-react";

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProgressModal({ isOpen, onClose }: ProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 bg-white/70 backdrop-blur-sm z-[500] flex items-end md:items-center justify-center p-0 md:p-6 transition-opacity"
    >
      {/* Keyboard & Scroll Safe Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full md:max-w-lg rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto scrollbar-hide animate-in slide-in-from-bottom-8 md:zoom-in-95"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500" />
        
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 rounded-xl">
                <BookOpen className="text-orange-600" size={24} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">How to Use TaskFlow</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Core Content Blocks */}
          <div className="space-y-5 text-sm text-slate-600">
            
            <div className="flex gap-3 items-start">
              <PlusCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold text-slate-900">Add Tasks</p>
                <p className="mt-0.5 leading-relaxed">Tap + to create tasks and plan your day. Set the time, category, and priority.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold text-slate-900">Complete Tasks</p>
                <p className="mt-0.5 leading-relaxed">Tap a task's circle to mark it as done and track your daily progress.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <RotateCcw className="text-red-400 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold text-slate-900">Missed Tasks</p>
                <p className="mt-0.5 leading-relaxed">If you miss a task, don't worry. The system will catch it and help you easily reschedule.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <TrendingUp className="text-blue-500 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold text-slate-900">Track Progress</p>
                <p className="mt-0.5 leading-relaxed">Check your sidebar to see completion rates and improve your consistency over time.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <Activity className="text-purple-500 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold text-slate-900">Activity Logs</p>
                <p className="mt-0.5 leading-relaxed">View all your historical actions, completions, and edits in the Activity tab.</p>
              </div>
            </div>

          </div>

          {/* Footer & Action */}
          <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-600 leading-relaxed text-center">
                Start simple. Add 2–3 tasks and complete them. <br className="hidden md:block"/>
                <span className="text-slate-900 font-bold">Consistency is more important than quantity.</span>
              </p>
            </div>
            
            <button 
              onClick={onClose}
              className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-[0.98]"
            >
              Start Planning
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}