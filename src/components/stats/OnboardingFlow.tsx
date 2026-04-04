import React, { useState, useEffect } from 'react';
import { BrainCircuit, Laptop, Shield, Activity, CheckCircle2, ServerOff, AlertTriangle, Download, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Task, Meta } from '../../types';
import { getLocalDate } from './utils';

interface OnboardingProps {
  tasks: Task[];
  meta: Meta;
  onComplete: () => void;
}

export default function OnboardingFlow({ tasks, meta, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [deviceId, setDeviceId] = useState('Detecting...');
  const [agreements, setAgreements] = useState({ beta: false, localOnly: false, noSync: false });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      let os = "Unknown";
      let browser = "Browser";
      if (ua.indexOf("Win") !== -1) os = "Win";
      if (ua.indexOf("Mac") !== -1) os = "Mac";
      if (ua.indexOf("Linux") !== -1) os = "Linux";
      if (ua.indexOf("Android") !== -1) os = "Android";
      if (ua.indexOf("like Mac") !== -1) os = "iOS";
      if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
      else if (ua.indexOf("Safari") !== -1) browser = "Safari";
      else if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
      
      const hash = Math.floor(Math.random() * 9000) + 1000;
      setDeviceId(`${browser}-${os}-${hash}`);
    }
  }, []);

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

  const allAgreed = agreements.beta && agreements.localOnly && agreements.noSync;

  return (
    <div className="fixed inset-0 z-[200] flex items-start md:items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="mt-8 md:mt-0 mb-8 bg-white/95 backdrop-blur-xl max-w-2xl w-full rounded-[24px] shadow-2xl border border-white/50 overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-5 sm:px-8 py-6 border-b border-gray-100 bg-white/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
              <BrainCircuit className="text-orange-500" /> Nextask Workspace
            </h2>
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Initialization Sequence</p>
          </div>
          <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-1">
            <span className="px-2.5 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
              <Laptop size={12}/> {deviceId}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold">Version: v0.8.2 Beta</span>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-100 h-1.5">
          <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500 ease-out" style={{ width: `${(currentStep / 4) * 100}%` }} />
        </div>
        <div className="px-5 sm:px-8 pt-4 pb-2">
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Step {currentStep} of 4</span>
        </div>

        {/* Content */}
        <div className="px-5 sm:px-8 py-6 min-h-[320px]">
          {currentStep === 1 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-6">Current System Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/50 flex flex-col gap-2">
                  <div className="flex justify-between items-center"><Shield className="text-blue-500" size={20}/><span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">Active</span></div>
                  <span className="font-bold text-gray-900">System Phase</span>
                  <span className="text-xs text-gray-500 font-medium">Public Beta Testing</span>
                </div>
                <div className="p-4 rounded-2xl border border-orange-100 bg-orange-50/50 flex flex-col gap-2">
                  <div className="flex justify-between items-center"><Activity className="text-orange-500" size={20}/><span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded uppercase">Partial</span></div>
                  <span className="font-bold text-gray-900">Stability Index</span>
                  <span className="text-xs text-gray-500 font-medium">Updates shipped weekly</span>
                </div>
                <div className="p-4 rounded-2xl border border-green-100 bg-green-50/50 flex flex-col gap-2">
                  <div className="flex justify-between items-center"><CheckCircle2 className="text-green-500" size={20}/><span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Verified</span></div>
                  <span className="font-bold text-gray-900">Core Features</span>
                  <span className="text-xs text-gray-500 font-medium">Local execution functional</span>
                </div>
                <div className="p-4 rounded-2xl border border-red-100 bg-red-50/50 flex flex-col gap-2">
                  <div className="flex justify-between items-center"><ServerOff className="text-red-500" size={20}/><span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">Offline</span></div>
                  <span className="font-bold text-gray-900">Cloud Sync</span>
                  <span className="text-xs text-gray-500 font-medium">Not available in build</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Data Storage & Control</h3>
              <p className="text-sm text-gray-500 mb-6">Your data is stored exclusively on this device.</p>
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6">
                <h4 className="font-bold text-orange-800 flex items-center gap-2 mb-2 text-sm"><AlertTriangle size={16} /> Data Risk Profile</h4>
                <p className="text-xs text-orange-700 leading-relaxed font-medium">Clearing your browser cache or switching devices will result in permanent data loss. We highly recommend utilizing the local backup tools provided below.</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-colors gap-4">
                  <div><p className="font-bold text-gray-800 text-sm">Manual JSON Backup</p><p className="text-xs text-gray-500 mt-0.5">Export all tasks & notes.</p></div>
                  <button onClick={handleBackupJSON} className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-2"><Download size={14}/> Export</button>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-xl bg-white gap-4">
                  <div><p className="font-bold text-gray-800 text-sm">System Wipe</p><p className="text-xs text-gray-500 mt-0.5">Factory reset this environment.</p></div>
                  <button onClick={handleSystemReset} className="w-full sm:w-auto px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-2"><RotateCcw size={14}/> Reset</button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Module Completion Status</h3>
              <p className="text-sm text-gray-500 mb-6">Visual overview of feature readiness in v0.8.</p>
              <div className="space-y-5">
                {[
                  { name: 'Tasks (To-Do)', progress: 70, color: 'bg-green-500' },
                  { name: 'MINI (Notes)', progress: 40, color: 'bg-orange-400' },
                  { name: 'Calendar Planner', progress: 40, color: 'bg-orange-400' },
                  { name: 'Diary System', progress: 30, color: 'bg-red-400' },
                  { name: 'Finance Engine', progress: 10, color: 'bg-gray-300', status: 'In Progress' },
                ].map((mod) => (
                  <div key={mod.name}>
                    <div className="flex justify-between text-sm font-bold mb-1.5">
                      <span className="text-gray-700">{mod.name}</span>
                      <span className={mod.status ? 'text-gray-400' : 'text-gray-600'}>{mod.status || `${mod.progress}%`}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ease-out ${mod.color}`} style={{ width: `${mod.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Final Authorization</h3>
              <p className="text-sm text-gray-500 mb-6">Acknowledge the system parameters to initialize.</p>
              <div className="space-y-3">
                <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${agreements.beta ? 'bg-green-50 border-green-500 shadow-sm transform scale-[1.01]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                  <input type="checkbox" checked={agreements.beta} onChange={(e) => setAgreements(prev => ({ ...prev, beta: e.target.checked }))} className="w-5 h-5 mt-0.5 accent-green-600 shrink-0" />
                  <span className={`text-sm font-semibold leading-snug ${agreements.beta ? 'text-green-800' : 'text-gray-700'}`}>I understand this is a beta environment subject to changes.</span>
                </label>
                <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${agreements.localOnly ? 'bg-green-50 border-green-500 shadow-sm transform scale-[1.01]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                  <input type="checkbox" checked={agreements.localOnly} onChange={(e) => setAgreements(prev => ({ ...prev, localOnly: e.target.checked }))} className="w-5 h-5 mt-0.5 accent-green-600 shrink-0" />
                  <span className={`text-sm font-semibold leading-snug ${agreements.localOnly ? 'text-green-800' : 'text-gray-700'}`}>I accept that data is stored locally and requires manual backups.</span>
                </label>
                <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${agreements.noSync ? 'bg-green-50 border-green-500 shadow-sm transform scale-[1.01]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                  <input type="checkbox" checked={agreements.noSync} onChange={(e) => setAgreements(prev => ({ ...prev, noSync: e.target.checked }))} className="w-5 h-5 mt-0.5 accent-green-600 shrink-0" />
                  <span className={`text-sm font-semibold leading-snug ${agreements.noSync ? 'text-green-800' : 'text-gray-700'}`}>I acknowledge cloud sync is not currently available.</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center rounded-b-[24px]">
          <button onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))} className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <ChevronLeft size={16}/> <span className="hidden sm:inline">Back</span>
          </button>
          {currentStep < 4 ? (
            <button onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))} className="px-5 sm:px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg">
              Continue <ChevronRight size={16}/>
            </button>
          ) : (
            <button onClick={onComplete} disabled={!allAgreed} className={`px-5 sm:px-6 py-2.5 text-white text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg ${allAgreed ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:scale-[1.02] shadow-orange-500/30' : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'}`}>
              Initialize <ChevronRight size={16}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}