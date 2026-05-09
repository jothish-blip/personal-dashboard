import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Lock } from 'lucide-react';

export default function StoryEditor({ system }: any) {
  const { 
    currentEntry, updateEntry, saveStatus, voiceField, 
    startVoiceInput, lockCurrentDay, writingActivity 
  } = system;

  const [timeAgo, setTimeAgo] = useState('just now');
  const [focusMode, setFocusMode] = useState(false); // true = collapsed summary, false = full editor
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  
  const isLocked = currentEntry.isLocked;

  useEffect(() => {
    if (saveStatus === 'saving') {
      setTimeAgo('Saving...');
      return;
    }
    const interval = setInterval(() => {
      if (!writingActivity?.lastEdit) return;
      const seconds = Math.floor((Date.now() - writingActivity.lastEdit) / 1000);
      if (seconds < 5) setTimeAgo('just now');
      else if (seconds < 60) setTimeAgo(`${seconds}s ago`);
      else setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
    }, 5000);
    return () => clearInterval(interval);
  }, [writingActivity?.lastEdit, saveStatus]);

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
        className={`p-1.5 rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
          voiceField === field 
            ? 'bg-orange-50 text-orange-600' 
            : 'text-gray-300 hover:text-gray-600'
        }`}
      >
        {voiceField === field ? <MicOff size={14} /> : <Mic size={14} />}
      </button>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-[24px] shadow-sm relative overflow-hidden mt-6 text-left">
      
      {/* 🔒 LOCKED BANNER */}
      {isLocked && (
        <div className="p-3 bg-gray-50 text-gray-500 text-[11px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 border-b border-gray-100">
          <Lock size={12} /> Entry Locked
        </div>
      )}

      {/* Header: Clean & Minimal */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
        <button 
          onClick={() => setFocusMode(!focusMode)}
          className="text-[11px] font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors"
        >
          {focusMode ? 'Exit Focus Mode' : 'Focus Mode'}
        </button>

        <span className="text-[10px] font-medium text-gray-400">
          Saved ✓ • {timeAgo}
        </span>
      </div>

      {!focusMode ? (
        <div className="flex flex-col bg-white">
          
          {/* 1. Morning - Planning */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">1. Morning</h3>
                <p className="text-sm font-bold text-gray-900 mt-0.5">Planning</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  • Be specific &nbsp; • Mention actions, not feelings only
                </p>
              </div>
              <VoiceIndicator field="morning" />
            </div>
            
            <textarea 
              disabled={isLocked}
              value={currentEntry.morning || ''} 
              onChange={(e) => updateEntry({ morning: e.target.value })} 
              placeholder="What are you focusing on today?&#10;What matters most?" 
              className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none resize-y min-h-[60px] placeholder:text-gray-300 leading-relaxed disabled:opacity-60" 
            />
          </div>

          {/* 2. Afternoon - Execution */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">2. Afternoon</h3>
                <p className="text-sm font-bold text-gray-900 mt-0.5">Execution</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  • Be specific &nbsp; • Mention actions, not feelings only
                </p>
              </div>
              <VoiceIndicator field="afternoon" />
            </div>
            
            <textarea 
              disabled={isLocked}
              value={currentEntry.afternoon || ''} 
              onChange={(e) => updateEntry({ afternoon: e.target.value })} 
              placeholder="What did you actually work on?&#10;Where did you lose focus?" 
              className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none resize-y min-h-[60px] placeholder:text-gray-300 leading-relaxed disabled:opacity-60" 
            />
          </div>

          {/* 3. Evening - Reflection */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">3. Evening</h3>
                <p className="text-sm font-bold text-gray-900 mt-0.5">Reflection</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  • Be specific &nbsp; • Mention actions, not feelings only
                </p>
              </div>
              <VoiceIndicator field="evening" />
            </div>
            
            <textarea 
              disabled={isLocked}
              value={currentEntry.evening || ''} 
              onChange={(e) => updateEntry({ evening: e.target.value })} 
              placeholder="What worked?&#10;What didn't?&#10;Why?" 
              className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none resize-y min-h-[60px] placeholder:text-gray-300 leading-relaxed disabled:opacity-60" 
            />
          </div>

          {/* 4. Learning - Key Insight */}
          <div className="p-6 border-b border-gray-100">
            <div className="mb-3">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">4. Learning</h3>
              <p className="text-sm font-bold text-gray-900 mt-0.5">Key Insight</p>
            </div>
            <textarea 
              disabled={isLocked}
              value={currentEntry.learning || ''} 
              onChange={(e) => updateEntry({ learning: e.target.value })} 
              placeholder="What did you learn today?" 
              className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none resize-y min-h-[40px] placeholder:text-gray-300 leading-relaxed disabled:opacity-60" 
            />
          </div>

          {/* 5. Tomorrow - Next Focus */}
          <div className="p-6 border-b border-gray-100">
            <div className="mb-3">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">5. Tomorrow</h3>
              <p className="text-sm font-bold text-gray-900 mt-0.5">Next Focus</p>
            </div>
            <textarea 
              disabled={isLocked}
              value={currentEntry.tomorrow || ''} 
              onChange={(e) => updateEntry({ tomorrow: e.target.value })} 
              placeholder="What is your main priority for tomorrow?" 
              className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none resize-y min-h-[40px] placeholder:text-gray-300 leading-relaxed disabled:opacity-60" 
            />
          </div>

          {/* Footer: Lock Day Only */}
          <div className="p-6 bg-gray-50/50">
            {!isLocked && (
              showLockConfirm ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                  <p className="text-xs font-bold text-gray-600">
                    Locking this entry makes it read-only. Proceed?
                  </p>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => setShowLockConfirm(false)} className="px-4 py-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                    <button onClick={() => { lockCurrentDay(); setShowLockConfirm(false); }} className="px-4 py-2 text-xs font-bold text-white bg-gray-900 rounded-lg hover:bg-black">
                      Lock Day
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowLockConfirm(true)}
                  className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Lock size={14} /> Lock Day
                </button>
              )
            )}
          </div>

        </div>
      ) : (
        /* Collapsed / Focus Mode View */
        <div className="p-6 text-sm text-gray-700 space-y-4 animate-in fade-in duration-300 bg-white">
          {currentEntry.morning && (
            <p className="truncate flex gap-2">
              <span className="font-bold text-gray-900 w-20 shrink-0">Planning:</span>
              <span className="text-gray-600 truncate">{currentEntry.morning}</span>
            </p>
          )}
          {currentEntry.afternoon && (
            <p className="truncate flex gap-2">
              <span className="font-bold text-gray-900 w-20 shrink-0">Execution:</span>
              <span className="text-gray-600 truncate">{currentEntry.afternoon}</span>
            </p>
          )}
          {currentEntry.evening && (
            <p className="truncate flex gap-2">
              <span className="font-bold text-gray-900 w-20 shrink-0">Reflection:</span>
              <span className="text-gray-600 truncate">{currentEntry.evening}</span>
            </p>
          )}
          {currentEntry.learning && (
            <p className="truncate flex gap-2">
              <span className="font-bold text-gray-900 w-20 shrink-0">Insight:</span>
              <span className="text-gray-600 truncate">{currentEntry.learning}</span>
            </p>
          )}
          {currentEntry.tomorrow && (
            <p className="truncate flex gap-2">
              <span className="font-bold text-gray-900 w-20 shrink-0">Next Focus:</span>
              <span className="text-gray-900 font-semibold truncate">{currentEntry.tomorrow}</span>
            </p>
          )}
          
          {!(currentEntry.morning || currentEntry.afternoon || currentEntry.evening || currentEntry.learning || currentEntry.tomorrow) && (
            <p className="text-gray-400 italic text-center py-4">No data written yet. Exit Focus Mode to begin.</p>
          )}
        </div>
      )}
    </div>
  );
}