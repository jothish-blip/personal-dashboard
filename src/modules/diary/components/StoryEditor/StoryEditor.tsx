"use client";

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Lock } from 'lucide-react';
import { useTheme } from "@/theme/ThemeProvider";

export default function StoryEditor({ system }: any) {
  const { 
    currentEntry, updateEntry, saveStatus, voiceField, 
    startVoiceInput, lockCurrentDay, writingActivity 
  } = system;
  const { isDarkMode } = useTheme();

  const [timeStr, setTimeStr] = useState('Saved just now');
  const [isReadingView, setIsReadingView] = useState(false); 
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  
  const isLocked = currentEntry.isLocked;

  useEffect(() => {
    if (saveStatus === 'saving') {
      setTimeStr('Saving...');
      return;
    }
    const interval = setInterval(() => {
      if (!writingActivity?.lastEdit) return;
      const seconds = Math.floor((Date.now() - writingActivity.lastEdit) / 1000);
      if (seconds < 5) setTimeStr('Saved just now');
      else if (seconds < 60) setTimeStr(`Last edited ${seconds}s ago`);
      else setTimeStr(`Last edited ${Math.floor(seconds / 60)}m ago`);
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
            ? (isDarkMode ? 'bg-orange-950/30 text-orange-400' : 'bg-orange-50 text-orange-600')
            : (isDarkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-300 hover:text-gray-600')
        }`}
      >
        {voiceField === field ? <MicOff size={14} /> : <Mic size={14} />}
      </button>
    </div>
  );

  const textareaBaseClass = `w-full bg-transparent text-sm font-medium outline-none resize-y leading-relaxed disabled:opacity-60 transition-all rounded-xl px-2 py-1.5 -ml-2 ${
    isDarkMode 
      ? "text-gray-200 placeholder-gray-700 focus:bg-orange-950/10" 
      : "text-gray-800 placeholder-gray-300 focus:bg-orange-50/50"
  }`;

  return (
    <div className={`border rounded-[24px] shadow-sm relative overflow-hidden mt-6 text-left transition-colors ${
      isDarkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-white border-gray-200"
    }`}>
      
      {/* 🔒 LOCKED BANNER */}
      {isLocked && (
        <div className={`p-3 text-[11px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 border-b ${
          isDarkMode ? "bg-[#111111] text-gray-400 border-gray-800" : "bg-gray-50 text-gray-500 border-gray-100"
        }`}>
          <Lock size={12} /> Entry Locked
        </div>
      )}

      {/* Header: Clean & Minimal */}
      <div className={`flex items-center justify-between p-5 border-b transition-colors ${
        isDarkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-white border-gray-100"
      }`}>
        <button 
          onClick={() => setIsReadingView(!isReadingView)}
          className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${
            isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-900"
          }`}
        >
          {isReadingView ? 'Edit Entry' : 'Reading View'}
        </button>

        <span className={`text-[10px] font-medium transition-colors ${
          isDarkMode ? "text-gray-500" : "text-gray-400"
        }`}>
          {timeStr}
        </span>
      </div>

      {!isReadingView ? (
        <div className={`flex flex-col transition-colors ${isDarkMode ? "bg-[#0a0a0a]" : "bg-white"}`}>
          
          {/* 1. Morning - Planning */}
          <div className={`p-5 md:p-6 border-b ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>1. Morning</h3>
                <p className={`text-sm font-bold mt-0.5 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Planning</p>
              </div>
              <VoiceIndicator field="morning" />
            </div>
            
            <textarea 
              disabled={isLocked}
              value={currentEntry.morning || ''} 
              onChange={(e) => updateEntry({ morning: e.target.value })} 
              placeholder="What matters most today?" 
              className={`${textareaBaseClass} min-h-[60px]`} 
            />
          </div>

          {/* 2. Afternoon - Execution */}
          <div className={`p-5 md:p-6 border-b ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>2. Afternoon</h3>
                <p className={`text-sm font-bold mt-0.5 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Execution</p>
              </div>
              <VoiceIndicator field="afternoon" />
            </div>
            
            <textarea 
              disabled={isLocked}
              value={currentEntry.afternoon || ''} 
              onChange={(e) => updateEntry({ afternoon: e.target.value })} 
              placeholder="What did today actually look like?" 
              className={`${textareaBaseClass} min-h-[60px]`} 
            />
          </div>

          {/* 3. Evening - Reflection */}
          <div className={`p-5 md:p-6 border-b ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>3. Evening</h3>
                <p className={`text-sm font-bold mt-0.5 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Reflection</p>
              </div>
              <VoiceIndicator field="evening" />
            </div>
            
            <textarea 
              disabled={isLocked}
              value={currentEntry.evening || ''} 
              onChange={(e) => updateEntry({ evening: e.target.value })} 
              placeholder="How did today go?" 
              className={`${textareaBaseClass} min-h-[60px]`} 
            />
          </div>

          {/* 4. Learning - Key Insight */}
          <div className={`p-5 md:p-6 border-b ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
            <div className="mb-3">
              <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>4. Learning</h3>
              <p className={`text-sm font-bold mt-0.5 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Key Insight</p>
            </div>
            <textarea 
              disabled={isLocked}
              value={currentEntry.learning || ''} 
              onChange={(e) => updateEntry({ learning: e.target.value })} 
              placeholder="What stayed with you today?" 
              className={`${textareaBaseClass} min-h-[40px]`} 
            />
          </div>

          {/* 5. Tomorrow - Next Focus */}
          <div className={`p-5 md:p-6 border-b ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
            <div className="mb-3">
              <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>5. Tomorrow</h3>
              <p className={`text-sm font-bold mt-0.5 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Next Focus</p>
            </div>
            <textarea 
              disabled={isLocked}
              value={currentEntry.tomorrow || ''} 
              onChange={(e) => updateEntry({ tomorrow: e.target.value })} 
              placeholder="What deserves attention tomorrow?" 
              className={`${textareaBaseClass} font-bold min-h-[40px]`} 
            />
          </div>

          {/* Footer: Lock Day Only */}
          <div className={`p-5 md:p-6 transition-colors ${isDarkMode ? "bg-[#0f0f0f]" : "bg-gray-50/50"}`}>
            {!isLocked && (
              showLockConfirm ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                  <p className={`text-xs font-bold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Lock this day? This cannot be edited later.
                  </p>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => setShowLockConfirm(false)} 
                      className={`px-4 py-2 text-xs font-bold border rounded-lg transition-colors ${
                        isDarkMode ? "text-gray-400 border-gray-700 bg-transparent hover:bg-gray-800" : "text-gray-500 border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => { lockCurrentDay(); setShowLockConfirm(false); }} 
                      className={`px-4 py-2 text-xs font-bold border rounded-lg transition-colors ${
                        isDarkMode ? "border-orange-900/40 text-orange-400 bg-orange-950/20 hover:bg-orange-900/30" : "border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100"
                      }`}
                    >
                      Lock
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowLockConfirm(true)}
                  className={`w-full py-3 rounded-xl font-bold text-sm shadow-sm border transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                    isDarkMode ? "border-orange-900/40 text-orange-400 bg-orange-950/10 hover:bg-orange-950/20" : "border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100"
                  }`}
                >
                  <Lock size={14} /> Lock Day
                </button>
              )
            )}
          </div>

        </div>
      ) : (
        /* Reading View */
        <div className={`p-5 md:p-6 text-sm space-y-4 animate-in fade-in duration-300 transition-colors ${
          isDarkMode ? "bg-[#0a0a0a] text-gray-300" : "bg-white text-gray-700"
        }`}>
          {currentEntry.morning && (
            <p className="truncate flex gap-2">
              <span className={`font-bold w-20 shrink-0 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Planning:</span>
              <span className={`truncate ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{currentEntry.morning}</span>
            </p>
          )}
          {currentEntry.afternoon && (
            <p className="truncate flex gap-2">
              <span className={`font-bold w-20 shrink-0 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Execution:</span>
              <span className={`truncate ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{currentEntry.afternoon}</span>
            </p>
          )}
          {currentEntry.evening && (
            <p className="truncate flex gap-2">
              <span className={`font-bold w-20 shrink-0 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Reflection:</span>
              <span className={`truncate ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{currentEntry.evening}</span>
            </p>
          )}
          {currentEntry.learning && (
            <p className="truncate flex gap-2">
              <span className={`font-bold w-20 shrink-0 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Insight:</span>
              <span className={`truncate ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{currentEntry.learning}</span>
            </p>
          )}
          {currentEntry.tomorrow && (
            <p className="truncate flex gap-2">
              <span className={`font-bold w-20 shrink-0 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Next Focus:</span>
              <span className={`font-semibold truncate ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>{currentEntry.tomorrow}</span>
            </p>
          )}
          
          {!(currentEntry.morning || currentEntry.afternoon || currentEntry.evening || currentEntry.learning || currentEntry.tomorrow) && (
            <p className={`italic text-center py-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
              Nothing written for this day yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}