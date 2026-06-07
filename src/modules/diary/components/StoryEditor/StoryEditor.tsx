"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mic, MicOff, Lock, CheckCircle2, Circle, Flame, 
  Sun, Zap, Moon, Lightbulb, ArrowRight, ChevronDown, ChevronRight,
  Trophy, AlertTriangle
} from 'lucide-react';
import { useTheme } from "@/theme/ThemeProvider";

const SECTIONS = [
  { id: 'morning', title: 'Morning', subtitle: 'Planning', icon: Sun, prompt: 'What matters most today?' },
  { id: 'afternoon', title: 'Afternoon', subtitle: 'Execution', icon: Zap, prompt: 'What did you actually spend your time on?' },
  { id: 'evening', title: 'Evening', subtitle: 'Reflection', icon: Moon, prompt: 'What happened today and how do you feel about it?' },
  { id: 'learning', title: 'Learning', subtitle: 'Key Insight', icon: Lightbulb, prompt: 'What stayed with you today?' },
  { id: 'tomorrow', title: 'Tomorrow', subtitle: 'Next Focus', icon: ArrowRight, prompt: 'What deserves attention tomorrow?' },
] as const;

const getWordCount = (text?: string) => text ? text.trim().split(/\s+/).filter(Boolean).length : 0;

export default function StoryEditor({ system }: any) {
  const { 
    currentEntry, updateEntry, saveStatus, voiceField, 
    startVoiceInput, lockCurrentDay, writingActivity, streak
  } = system;
  const { isDarkMode } = useTheme();

  const isLocked = currentEntry.isLocked;
  const writingStreak = streak || 12; // Fallback to 12 if not provided by system

  // Auto-default to reading view if locked
  const [isReadingView, setIsReadingView] = useState(() => isLocked); 
  const [timeStr, setTimeStr] = useState('Saved just now');
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  
  // Accordion state - expand empty sections by default
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    SECTIONS.forEach(s => {
      if (!currentEntry[s.id]?.trim()) initial.add(s.id);
    });
    // If all are filled, open none so it looks like a clean summary list
    return initial;
  });

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

  // Sync reading view if locked externally
  useEffect(() => {
    if (isLocked) setIsReadingView(true);
  }, [isLocked]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ==========================================================================
  // METRICS & PROGRESS
  // ==========================================================================
  const completedSections = SECTIONS.filter(s => currentEntry[s.id]?.trim());
  const missingSections = SECTIONS.filter(s => !currentEntry[s.id]?.trim());
  const progressPercent = Math.round((completedSections.length / SECTIONS.length) * 100);

  const totalChars = SECTIONS.reduce((acc, s) => acc + (currentEntry[s.id]?.length || 0), 0);
  const storyQuality = totalChars < 150 ? 'Minimal' : totalChars < 500 ? 'Good' : 'Detailed';
  const qualityColor = totalChars < 150 ? 'text-gray-400' : totalChars < 500 ? 'text-blue-500' : 'text-green-500';

  const snapshot = useMemo(() => {
    const arr = [];
    if (currentEntry.mood === 'good') arr.push('😊 Good Mood');
    else if (currentEntry.mood === 'neutral') arr.push('😐 Neutral Mood');
    else if (currentEntry.mood === 'bad') arr.push('😔 Low Mood');

    if (currentEntry.energy === 'high') arr.push('🔋 High Energy');
    else if (currentEntry.energy === 'medium') arr.push('🪫 Med Energy');
    else if (currentEntry.energy === 'low') arr.push('🔌 Low Energy');

    if (currentEntry.sleep === 'good') arr.push('🌙 Good Sleep');
    else if (currentEntry.sleep === 'average') arr.push('☁️ Avg Sleep');
    else if (currentEntry.sleep === 'poor') arr.push('🌧️ Poor Sleep');

    return arr;
  }, [currentEntry.mood, currentEntry.energy, currentEntry.sleep]);

  const displayDate = new Date().toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' });

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================
  const VoiceIndicator = ({ field }: { field: string }) => (
    <div className="flex items-center gap-2">
      {voiceField === field && (
        <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest animate-pulse">
          Listening...
        </span>
      )}
      <button 
        disabled={isLocked}
        onClick={(e) => {
          e.stopPropagation();
          startVoiceInput(field);
        }} 
        className={`p-1.5 rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
          voiceField === field 
            ? (isDarkMode ? 'bg-orange-950/30 text-orange-400' : 'bg-orange-50 text-orange-600')
            : (isDarkMode ? 'text-zinc-600 hover:text-white hover:bg-white/[0.05]' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100')
        }`}
      >
        {voiceField === field ? <MicOff size={14} /> : <Mic size={14} />}
      </button>
    </div>
  );

  const textareaBaseClass = `w-full bg-transparent text-[14px] font-medium outline-none resize-y leading-relaxed disabled:opacity-60 transition-all rounded-xl px-4 py-3 border ${
    isDarkMode 
      ? "text-zinc-200 border-white/[0.08] placeholder-zinc-700 focus:bg-white/[0.03] focus:border-orange-500/50" 
      : "text-gray-800 border-gray-200 placeholder-gray-300 focus:bg-orange-50/20 focus:border-orange-400"
  }`;

  return (
    <div className={`border rounded-[24px] shadow-sm relative overflow-hidden mt-6 text-left transition-colors ${
      isDarkMode ? "bg-black border-white/[0.08]" : "bg-white border-gray-200"
    }`}>
      
      {/* 🔒 LOCKED BANNER */}
      {isLocked && (
        <div className={`p-3 text-[11px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 border-b ${
          isDarkMode ? "bg-white/[0.02] text-zinc-500 border-white/[0.08]" : "bg-gray-50 text-gray-500 border-gray-100"
        }`}>
          <Lock size={12} /> Entry Locked Permanently
        </div>
      )}

      {/* HEADER & STREAK */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 md:p-7 border-b transition-colors ${
        isDarkMode ? "bg-black border-white/[0.08]" : "bg-white border-gray-100"
      }`}>
        <div>
          <h2 className={`text-xl font-bold tracking-tight mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {displayDate}
          </h2>
          <span className={`text-[11px] font-medium ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
            {timeStr}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600">
            <Flame size={16} />
            <span className="text-[13px] font-bold">{writingStreak} Day Writing Streak</span>
          </div>
          
          <button 
            onClick={() => setIsReadingView(!isReadingView)}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest border transition-colors ${
              isDarkMode 
                ? "bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:bg-white/[0.06]" 
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {isReadingView ? 'Writing Mode' : 'Journal View'}
          </button>
        </div>
      </div>

      {/* DAY SNAPSHOT */}
      {snapshot.length > 0 && (
        <div className={`px-5 py-3 border-b flex flex-wrap items-center gap-4 text-[12px] font-semibold ${
          isDarkMode ? "bg-white/[0.01] border-white/[0.08] text-zinc-400" : "bg-gray-50/50 border-gray-100 text-gray-600"
        }`}>
          {snapshot.map(s => <span key={s}>{s}</span>)}
        </div>
      )}

      {/* PROGRESS BAR (Only in Writing Mode) */}
      {!isReadingView && (
        <div className={`p-5 sm:p-6 md:px-7 border-b ${isDarkMode ? "border-white/[0.08]" : "border-gray-100"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Today's Story
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                isDarkMode ? "bg-white/[0.03] border-white/[0.08] text-zinc-400" : "bg-gray-50 border-gray-200 text-gray-500"
              }`}>
                Story Quality: <span className={qualityColor}>{storyQuality}</span>
              </span>
            </div>
            <span className={`text-xs font-bold ${progressPercent === 100 ? "text-green-500" : (isDarkMode ? "text-zinc-500" : "text-gray-400")}`}>
              {progressPercent}%
            </span>
          </div>
          
          <div className={`w-full h-1.5 rounded-full mb-4 overflow-hidden ${isDarkMode ? "bg-white/[0.06]" : "bg-gray-200"}`}>
            <div 
              className="h-full bg-orange-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {SECTIONS.map((s) => {
              const isDone = !!currentEntry[s.id]?.trim();
              return (
                <div key={`chk-${s.id}`} className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                  isDone ? (isDarkMode ? "text-zinc-300" : "text-gray-700") : (isDarkMode ? "text-zinc-600" : "text-gray-400")
                }`}>
                  {isDone ? <CheckCircle2 size={12} className="text-green-500" /> : <Circle size={12} />}
                  {s.title}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EDITOR CONTENT */}
      {!isReadingView ? (
        <div className={`flex flex-col transition-colors ${isDarkMode ? "bg-black" : "bg-white"}`}>
          
          {/* ACCORDION SECTIONS */}
          {SECTIONS.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const content = currentEntry[section.id] || '';
            const isFilled = content.trim().length > 0;
            const words = getWordCount(content);
            const Icon = section.icon;

            return (
              <div key={section.id} className={`border-b transition-colors ${isDarkMode ? "border-white/[0.08]" : "border-gray-100"}`}>
                
                {/* Accordion Header */}
                <div 
                  onClick={() => toggleSection(section.id)}
                  className={`flex items-center justify-between p-4 md:px-7 cursor-pointer select-none group transition-colors ${
                    isDarkMode ? "hover:bg-white/[0.02]" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={isFilled ? "text-green-500" : (isDarkMode ? "text-zinc-600" : "text-gray-300")}>
                      {isFilled ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDarkMode ? "bg-white/[0.04] text-zinc-400" : "bg-gray-100 text-gray-500"}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{section.title}</h3>
                          <span className={`text-[10px] uppercase tracking-widest font-semibold ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
                            {section.subtitle}
                          </span>
                        </div>
                        {isFilled && !isExpanded && (
                          <p className={`text-xs mt-0.5 truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px] ${isDarkMode ? "text-zinc-500" : "text-gray-500"}`}>
                            {content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {isFilled && (
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-zinc-600" : "text-gray-400"}`}>
                        {words} words
                      </span>
                    )}
                    <div className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""} ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className={`px-4 pb-6 md:px-7 md:pb-7 animate-in slide-in-from-top-2 duration-200`}>
                    <div className="flex justify-between items-center mb-3">
                      <p className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? "text-orange-400/80" : "text-orange-600/80"}`}>
                        {section.prompt}
                      </p>
                      <VoiceIndicator field={section.id} />
                    </div>
                    <textarea 
                      disabled={isLocked}
                      value={content} 
                      onChange={(e) => updateEntry({ [section.id]: e.target.value })} 
                      placeholder="Start writing..." 
                      className={`${textareaBaseClass} min-h-[100px]`} 
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* LOCK CONFIRMATION SECTION */}
          {!isLocked && (
            <div className={`p-5 sm:p-6 md:p-8 transition-colors ${isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-50/50"}`}>
              {showLockConfirm ? (
                <div className={`border rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 ${
                  isDarkMode ? "bg-black border-white/[0.1]" : "bg-white border-gray-200"
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy size={20} className="text-orange-500" />
                    <h3 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Finalize {displayDate}?
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>Completed</h4>
                      <ul className="space-y-2">
                        {completedSections.map(s => (
                          <li key={`comp-${s.id}`} className={`text-xs font-semibold flex items-center gap-2 ${isDarkMode ? "text-zinc-300" : "text-gray-700"}`}>
                            <CheckCircle2 size={14} className="text-green-500" /> {s.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {missingSections.length > 0 && (
                      <div>
                        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>Missing</h4>
                        <ul className="space-y-2">
                          {missingSections.map(s => (
                            <li key={`miss-${s.id}`} className={`text-xs font-semibold flex items-center gap-2 ${isDarkMode ? "text-zinc-500" : "text-gray-500"}`}>
                              <Circle size={14} /> {s.title} {s.id === 'tomorrow' ? 'Focus' : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className={`flex items-start gap-3 p-4 rounded-xl mb-6 border ${
                    isDarkMode ? "bg-orange-950/10 border-orange-900/30 text-orange-400/90" : "bg-orange-50 border-orange-100 text-orange-800"
                  }`}>
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <p className="text-xs font-medium leading-relaxed">
                      After finalization, this entry becomes an immutable part of your archive. You will not be able to edit it again.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => setShowLockConfirm(false)} 
                      className={`flex-1 px-4 py-3 text-sm font-bold border rounded-xl transition-colors ${
                        isDarkMode ? "text-zinc-300 border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.05]" : "text-gray-600 border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      Keep Editing
                    </button>
                    <button 
                      onClick={() => { lockCurrentDay(); setShowLockConfirm(false); }} 
                      className={`flex-1 px-4 py-3 text-sm font-bold border rounded-xl transition-colors ${
                        isDarkMode ? "border-orange-900/50 text-white bg-orange-600 hover:bg-orange-500" : "border-orange-500 text-white bg-orange-500 hover:bg-orange-600"
                      }`}
                    >
                      Lock Permanently
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowLockConfirm(true)}
                  className={`w-full py-4 rounded-xl font-bold text-sm shadow-sm border transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                    isDarkMode ? "border-white/[0.08] text-white bg-white/[0.03] hover:bg-white/[0.06]" : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                >
                  <Lock size={16} /> Finalize Story
                </button>
              )}
            </div>
          )}

        </div>
      ) : (
        /* ==========================================================================
           JOURNAL VIEW (TIMELINE)
           ========================================================================== */
        <div className={`p-6 sm:p-8 md:p-10 space-y-10 animate-in fade-in duration-300 transition-colors ${
          isDarkMode ? "bg-black text-zinc-300" : "bg-[#fcfcfc] text-gray-800"
        }`}>
          {completedSections.length === 0 ? (
            <div className={`py-12 text-center flex flex-col items-center gap-3 ${isDarkMode ? "text-zinc-600" : "text-gray-400"}`}>
              <Sun size={32} className="opacity-20" />
              <p className="italic font-medium">The pages for today are still blank.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Vertical Line */}
              <div className={`absolute left-[15px] top-4 bottom-4 w-px ${isDarkMode ? "bg-white/[0.08]" : "bg-gray-200"}`} />

              <div className="space-y-12">
                {completedSections.map((section) => {
                  const Icon = section.icon;
                  const content = currentEntry[section.id];
                  
                  return (
                    <div key={`read-${section.id}`} className="relative pl-12 group">
                      {/* Timeline Dot/Icon */}
                      <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isDarkMode ? "bg-black border-white/[0.1] text-zinc-400 group-hover:border-orange-500 group-hover:text-orange-400" : "bg-white border-gray-200 text-gray-400 group-hover:border-orange-500 group-hover:text-orange-500"
                      }`}>
                        <Icon size={14} />
                      </div>

                      {/* Content */}
                      <div>
                        <h3 className={`text-[12px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${
                          isDarkMode ? "text-zinc-500" : "text-gray-400"
                        }`}>
                          {section.title} <span className="w-1 h-1 rounded-full bg-current opacity-50" /> {section.subtitle}
                        </h3>
                        <p className={`text-[15px] leading-relaxed whitespace-pre-wrap font-medium ${
                          isDarkMode ? "text-zinc-200" : "text-gray-800"
                        }`}>
                          {content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}