import React, { useState, useEffect } from 'react';
import { 
  Mic, MicOff, CheckCircle2, Zap, Edit3, History, ArrowUpRight, 
  Sparkles, Flag, ChevronDown, ChevronUp, Lock
} from 'lucide-react';

export default function StoryEditor({ system }: any) {
  const { 
    currentEntry, updateEntry, saveStatus, voiceField, 
    startVoiceInput, lockCurrentDay, saveNewVersion, generateAutoSummary, 
    showVersions, setShowVersions, writingActivity 
  } = system;

  const [timeAgo, setTimeAgo] = useState('just now');
  const [expanded, setExpanded] = useState(true);
  
  // Directly read the lock state to control UI access
  const isLocked = currentEntry.isLocked;

  useEffect(() => {
    if (saveStatus === 'saving') {
      setTimeAgo('Saving...');
      return;
    }
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - writingActivity.lastEdit) / 1000);
      if (seconds < 5) setTimeAgo('just now');
      else if (seconds < 60) setTimeAgo(`${seconds}s ago`);
      else setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
    }, 5000);
    return () => clearInterval(interval);
  }, [writingActivity.lastEdit, saveStatus]);

  const VoiceIndicator = ({ field }: { field: string }) => (
    <div className="flex items-center gap-2">
      {voiceField === field && (
        <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest animate-pulse">
          Listening...
        </span>
      )}
      <button 
        disabled={isLocked}
        onClick={() => startVoiceInput(field)} 
        className={`p-2 rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
          voiceField === field 
            ? 'bg-orange-100 text-orange-600 shadow-sm' 
            : 'bg-gray-50 text-gray-400 hover:bg-orange-50 hover:text-orange-500'
        }`}
        title={voiceField === field ? "Stop recording" : "Start voice dictation"}
      >
        {voiceField === field ? <MicOff size={16} /> : <Mic size={16} />}
      </button>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-[24px] shadow-sm relative overflow-hidden mt-6 transition-all duration-300">
      
      {/* 🔒 LOCKED BANNER */}
      {isLocked && (
        <div className="p-3 bg-red-50 text-red-600 text-[11px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 border-b border-red-100">
          <Lock size={14} /> This day is locked and read-only
        </div>
      )}

      {/* Editor Header with Collapse Toggle & Save Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-gray-50 border-b border-gray-100">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 uppercase tracking-widest transition-colors w-fit"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? 'Collapse View' : 'Expand View'}
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[9px] font-bold text-gray-500 uppercase tracking-widest transition-all shadow-sm w-fit">
          {saveStatus === 'saving' ? (
            <><Zap size={12} className="text-orange-500 animate-pulse" /> Saving...</>
          ) : (
            <><CheckCircle2 size={12} className="text-emerald-500" /> Saved • {timeAgo}</>
          )}
        </div>
      </div>

      {expanded ? (
        <div className="flex flex-col divide-y divide-gray-100 animate-in fade-in duration-300">
          
          {/* 1. Morning Intention */}
          <div className="p-4 sm:p-6 focus-within:bg-orange-50/30 transition-colors group">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="bg-gray-100 text-gray-500 w-5 h-5 rounded flex items-center justify-center">1</span> 
                Morning Intention
              </label>
              <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto">
                <input 
                  disabled={isLocked}
                  type="text" 
                  value={currentEntry.morningTime || ''} 
                  onChange={(e) => updateEntry({ morningTime: e.target.value })} 
                  placeholder="Time (e.g. 7:00 AM)" 
                  className="text-xs w-full sm:w-28 bg-transparent border-b border-gray-200 focus:border-orange-400 text-right outline-none pb-1 transition-colors disabled:opacity-60 font-medium" 
                />
                <VoiceIndicator field="morning" />
              </div>
            </div>
            <textarea 
              disabled={isLocked}
              value={currentEntry.morning} 
              onChange={(e) => updateEntry({ morning: e.target.value })} 
              placeholder="What was your primary intention for today? How did the morning start?" 
              className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none resize-y min-h-[90px] placeholder:text-gray-300 leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed" 
            />
          </div>

          {/* 2. Afternoon Execution */}
          <div className="p-4 sm:p-6 focus-within:bg-orange-50/30 transition-colors group">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="bg-gray-100 text-gray-500 w-5 h-5 rounded flex items-center justify-center">2</span> 
                Afternoon Execution
              </label>
              <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto">
                <input 
                  disabled={isLocked}
                  type="text" 
                  value={currentEntry.afternoonTime || ''} 
                  onChange={(e) => updateEntry({ afternoonTime: e.target.value })} 
                  placeholder="Time (e.g. 2:30 PM)" 
                  className="text-xs w-full sm:w-28 bg-transparent border-b border-gray-200 focus:border-orange-400 text-right outline-none pb-1 transition-colors disabled:opacity-60 font-medium" 
                />
                <VoiceIndicator field="afternoon" />
              </div>
            </div>
            <textarea 
              disabled={isLocked}
              value={currentEntry.afternoon} 
              onChange={(e) => updateEntry({ afternoon: e.target.value })} 
              placeholder="What did you actually execute? Did you face any friction or distractions?" 
              className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none resize-y min-h-[90px] placeholder:text-gray-300 leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed" 
            />
          </div>

          {/* 3. Evening Reflection */}
          <div className="p-4 sm:p-6 focus-within:bg-orange-50/30 transition-colors group">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="bg-gray-100 text-gray-500 w-5 h-5 rounded flex items-center justify-center">3</span> 
                Evening Reflection
              </label>
              <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto">
                <input 
                  disabled={isLocked}
                  type="text" 
                  value={currentEntry.eveningTime || ''} 
                  onChange={(e) => updateEntry({ eveningTime: e.target.value })} 
                  placeholder="Time (e.g. 10:00 PM)" 
                  className="text-xs w-full sm:w-28 bg-transparent border-b border-gray-200 focus:border-orange-400 text-right outline-none pb-1 transition-colors disabled:opacity-60 font-medium" 
                />
                <VoiceIndicator field="evening" />
              </div>
            </div>
            <textarea 
              disabled={isLocked}
              value={currentEntry.evening} 
              onChange={(e) => updateEntry({ evening: e.target.value })} 
              placeholder="How did the day end? What worked well, and what didn't?" 
              className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none resize-y min-h-[90px] placeholder:text-gray-300 leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed" 
            />
          </div>

          {/* 4. Learning & Breakthrough */}
          <div className="p-4 sm:p-6 bg-gray-50/50 focus-within:bg-orange-50/30 transition-colors">
            <label className="text-[11px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Sparkles size={14} /> Key Takeaway
            </label>
            <textarea 
              disabled={isLocked}
              value={currentEntry.learning} 
              onChange={(e) => updateEntry({ learning: e.target.value })} 
              placeholder="What is the one major thing you learned today?" 
              className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none resize-y min-h-[90px] placeholder:text-gray-400 leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed" 
            />
          </div>

          {/* 5. Tomorrow's Focus */}
          <div className="p-4 sm:p-6 bg-gray-100/50 focus-within:bg-blue-50/30 transition-colors">
            <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Flag size={14} /> Tomorrow's Directive
            </label>
            <textarea 
              disabled={isLocked}
              value={currentEntry.tomorrow} 
              onChange={(e) => updateEntry({ tomorrow: e.target.value })} 
              placeholder="What is your singular, non-negotiable focus for tomorrow?" 
              className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none resize-y min-h-[90px] placeholder:text-gray-400 leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed" 
            />
          </div>

          {/* Completion & Utilities */}
          <div className="p-5 sm:p-6 bg-white">
            {!isLocked && (
              <button 
                onClick={lockCurrentDay}
                className="w-full mb-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} /> Finish Day & Lock Entry
              </button>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button 
                  disabled={isLocked}
                  onClick={saveNewVersion} 
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-50 text-orange-600 hover:bg-orange-100 disabled:opacity-50 disabled:hover:bg-orange-50 rounded-lg font-bold transition-colors"
                >
                  <Edit3 size={14} /> Save Snapshot
                </button>
                <button 
                  onClick={generateAutoSummary} 
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg font-bold transition-colors"
                >
                  <Zap size={14} className="text-amber-500" /> Summarize Day
                </button>
              </div>
              
              {currentEntry.versions && currentEntry.versions.length > 0 && (
                <button 
                  onClick={() => setShowVersions(!showVersions)} 
                  className="text-gray-500 hover:text-gray-800 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <History size={14} /> {currentEntry.versions.length} Previous Versions
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Preview Mode */
        <div className="p-5 sm:p-6 text-sm text-gray-600 space-y-4 animate-in fade-in duration-300">
          {currentEntry.morning && (
            <p>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Morning</span>
              <strong className="text-gray-800 font-medium">
                {currentEntry.morning.slice(0, 80)}{currentEntry.morning.length > 80 ? '...' : ''}
              </strong>
            </p>
          )}
          {currentEntry.afternoon && (
            <p>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Afternoon</span>
              <strong className="text-gray-800 font-medium">
                {currentEntry.afternoon.slice(0, 80)}{currentEntry.afternoon.length > 80 ? '...' : ''}
              </strong>
            </p>
          )}
          {currentEntry.evening && (
            <p>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Evening</span>
              <strong className="text-gray-800 font-medium">
                {currentEntry.evening.slice(0, 80)}{currentEntry.evening.length > 80 ? '...' : ''}
              </strong>
            </p>
          )}
          {currentEntry.tomorrow && (
            <p>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-1">Tomorrow</span>
              <strong className="text-gray-900 font-bold">
                {currentEntry.tomorrow.slice(0, 80)}{currentEntry.tomorrow.length > 80 ? '...' : ''}
              </strong>
            </p>
          )}
          {(!currentEntry.morning && !currentEntry.afternoon && !currentEntry.evening && !currentEntry.tomorrow) && (
            <p className="text-gray-400 italic py-4 text-center">No story written for this entry yet.</p>
          )}
        </div>
      )}

      {/* Version History Drawer */}
      {showVersions && currentEntry.versions && expanded && (
        <div className="px-4 sm:px-6 pb-6 bg-gray-50 border-t border-gray-100 max-h-64 overflow-y-auto animate-in slide-in-from-top-2">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest my-4">Snapshot History</h4>
          <div className="flex flex-col gap-2">
            {currentEntry.versions.map((v: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-xl shadow-sm text-xs transition-colors hover:border-orange-300">
                <span className="font-mono font-bold text-gray-500">
                  {new Date(v.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                </span>
                <button 
                  onClick={() => alert("Preview mode loaded. Snapshot restoration available in production.")} 
                  className="text-orange-600 hover:text-orange-700 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                >
                  View <ArrowUpRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}