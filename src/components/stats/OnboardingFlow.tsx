import React, { useState, useEffect } from 'react';
import { BrainCircuit, Download, RotateCcw, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Task, Meta } from '../../types';
import { getLocalDate } from './utils';

interface OnboardingProps {
  tasks: Task[];
  meta: Meta;
  onComplete: () => void;
}

export default function OnboardingFlow({ tasks, meta, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isVisible, setIsVisible] = useState(false);

  // STEP 1: Show Only Once Logic
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem("nextask_onboarding_seen");
      if (seen) {
        onComplete(); // Skip entirely if already seen
      } else {
        setIsVisible(true); // Only render if they haven't seen it
      }
    }
  }, [onComplete]);

  const handleComplete = () => {
    localStorage.setItem("nextask_onboarding_seen", "true");
    onComplete();
  };

  const handleBackupJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ tasks, meta, exportDate: new Date() }, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `Nextask_Backup_${getLocalDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSystemReset = () => {
    if (confirm("CRITICAL: This will erase ALL local tasks and notes. Ensure you have downloaded a backup first. Proceed?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!isVisible) return null;

  return (
    // REMOVED BLACK UI: Using white/70 backdrop and bottom sheet layout for mobile
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-white/70 backdrop-blur-sm p-0 md:p-6 transition-opacity">
      
      {/* Container: Scroll Safe & Mobile Bottom Sheet */}
      <div className="bg-white w-full md:max-w-2xl rounded-t-[2rem] md:rounded-[24px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col transform transition-all animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-300 max-h-[90vh]">
        
        {/* Header (Simplified) */}
        <div className="px-5 md:px-8 py-5 md:py-6 border-b border-gray-100 bg-white flex justify-between items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
              <BrainCircuit className="text-orange-500" /> Nextask
            </h2>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              Getting Started
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-1.5">
          <div 
            className="h-full bg-orange-500 transition-all duration-500 ease-out" 
            style={{ width: `${(currentStep / 4) * 100}%` }} 
          />
        </div>
        <div className="px-5 md:px-8 pt-4 pb-0">
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Step {currentStep} of 4</span>
        </div>

        {/* Scrollable Content Area */}
        <div className="px-5 md:px-8 py-5 md:py-6 overflow-y-auto scrollbar-hide">
          
          {/* STEP 1: How to use */}
          {currentStep === 1 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              <h3 className="text-xl font-bold text-gray-800 mb-5">How to Use Tasks System</h3>
              <div className="space-y-5 text-sm text-gray-600">
                <div>
                  <p className="font-bold text-gray-900">Create Tasks</p>
                  <p className="mt-0.5">Add multiple tasks for your day using the + button.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Daily Check System</p>
                  <p className="mt-0.5">You can only complete tasks for today. Yesterday is locked and tomorrow is not editable.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Track Performance</p>
                  <p className="mt-0.5">See how many tasks you complete each day and improve consistency.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">History & Activity</p>
                  <p className="mt-0.5">View all actions like completed tasks, updates, and changes.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Filters & Views</p>
                  <p className="mt-0.5">Switch between Today, All Tasks, and Activity easily.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Weekly Comparison</p>
                  <p className="mt-0.5">Compare your performance with previous days and weeks.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Your Data */}
          {currentStep === 2 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Your Data</h3>
              <p className="text-sm text-gray-500 mb-6">Your data is saved only on this device.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={handleBackupJSON}
                  className="w-full text-left p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex justify-between items-center group"
                >
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Backup</p>
                    <p className="text-xs text-gray-500 mt-0.5">Download your tasks and notes anytime.</p>
                  </div>
                  <Download size={18} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
                </button>

                <button 
                  onClick={handleSystemReset}
                  className="w-full text-left p-4 border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-100 transition-colors flex justify-between items-center group"
                >
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Reset</p>
                    <p className="text-xs text-gray-500 mt-0.5">Clear all data if needed.</p>
                  </div>
                  <RotateCcw size={18} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Available Features */}
          {currentStep === 3 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              <h3 className="text-xl font-bold text-gray-800 mb-5">Available Features</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p><span className="font-bold text-gray-900">Tasks</span> – Plan and track your daily work</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p><span className="font-bold text-gray-900">Notes (Mini)</span> – Write and manage notes</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p><span className="font-bold text-gray-900">Calendar</span> – Plan events and schedule tasks</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p><span className="font-bold text-gray-900">Diary</span> – Track personal reflections</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Ready */}
          {currentStep === 4 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300 py-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">You're Ready</h3>
              <p className="text-base text-gray-600 mb-6 leading-relaxed">
                Start by adding 2–3 tasks and completing them today.<br/>
                <span className="font-bold text-gray-900">Consistency is key.</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-5 md:px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <button 
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))} 
            className={`px-3 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <ChevronLeft size={18}/> Back
          </button>
          
          {currentStep < 4 ? (
            <button 
              onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))} 
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-orange-500/20 active:scale-95"
            >
              Continue <ChevronRight size={18}/>
            </button>
          ) : (
            <button 
              onClick={handleComplete} 
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-orange-500/20 active:scale-95"
            >
              Start Using Nextask <ChevronRight size={18}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}