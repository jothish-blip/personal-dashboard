import React from 'react';
import { Mic, MicOff, CheckCircle2, Zap, Edit3, History, ArrowRight } from 'lucide-react';

export default function StoryEditor({ system }: any) {
  const { currentEntry, updateEntry, saveStatus, voiceField, startVoiceInput, saveNewVersion, generateAutoSummary, showVersions, setShowVersions } = system;

  return (
    <div className="bg-white border border-gray-200 rounded-[20px] shadow-sm relative overflow-hidden mt-6">
      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[9px] font-bold text-gray-500 uppercase tracking-widest z-10">
        {saveStatus === 'saving' ? <><Zap size={10} className="text-orange-500 animate-pulse" /> Saving</> : <><CheckCircle2 size={10} className="text-green-500" /> Saved</>}
      </div>

      <div className="flex flex-col divide-y divide-gray-100">
        {/* Morning */}
        <div className="p-5 focus-within:bg-orange-50/20 transition-colors group">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Morning Protocol</label>
            <div className="flex items-center gap-3">
              <input type="text" value={currentEntry.morningTime || ''} onChange={(e) => updateEntry({ morningTime: e.target.value })} placeholder="7:00 AM" className="text-xs w-20 bg-transparent border-b text-right outline-none" />
              <button onClick={() => startVoiceInput('morning')} className={`p-1 rounded-full ${voiceField === 'morning' ? 'bg-orange-100 text-orange-500 animate-pulse' : 'text-gray-400 hover:text-orange-500'}`}>
                {voiceField === 'morning' ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
          </div>
          <textarea value={currentEntry.morning} onChange={(e) => updateEntry({ morning: e.target.value })} placeholder="How did the day start?" className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none resize-y min-h-[60px] placeholder:text-gray-300" />
        </div>

        {/* Afternoon */}
        <div className="p-5 focus-within:bg-orange-50/20 transition-colors group">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Afternoon Execution</label>
            <div className="flex items-center gap-3">
              <input type="text" value={currentEntry.afternoonTime || ''} onChange={(e) => updateEntry({ afternoonTime: e.target.value })} placeholder="2:30 PM" className="text-xs w-20 bg-transparent border-b text-right outline-none" />
              <button onClick={() => startVoiceInput('afternoon')} className={`p-1 rounded-full ${voiceField === 'afternoon' ? 'bg-orange-100 text-orange-500 animate-pulse' : 'text-gray-400 hover:text-orange-500'}`}>
                {voiceField === 'afternoon' ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
          </div>
          <textarea value={currentEntry.afternoon} onChange={(e) => updateEntry({ afternoon: e.target.value })} placeholder="Main block of work. Frictions faced?" className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none resize-y min-h-[60px] placeholder:text-gray-300" />
        </div>

        {/* Evening */}
        <div className="p-5 focus-within:bg-orange-50/20 transition-colors group">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Evening Wind Down</label>
            <div className="flex items-center gap-3">
              <input type="text" value={currentEntry.eveningTime || ''} onChange={(e) => updateEntry({ eveningTime: e.target.value })} placeholder="10:00 PM" className="text-xs w-20 bg-transparent border-b text-right outline-none" />
              <button onClick={() => startVoiceInput('evening')} className={`p-1 rounded-full ${voiceField === 'evening' ? 'bg-orange-100 text-orange-500 animate-pulse' : 'text-gray-400 hover:text-orange-500'}`}>
                {voiceField === 'evening' ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
          </div>
          <textarea value={currentEntry.evening} onChange={(e) => updateEntry({ evening: e.target.value })} placeholder="How did it end? Stress levels?" className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none resize-y min-h-[60px] placeholder:text-gray-300" />
        </div>

        {/* Learning & Tomorrow */}
        <div className="p-5 bg-gray-50 focus-within:bg-orange-50/30 transition-colors">
          <label className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-2">Key Learning / Breakthrough</label>
          <textarea value={currentEntry.learning} onChange={(e) => updateEntry({ learning: e.target.value })} placeholder="One thing you learned today..." className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none resize-y min-h-[60px] placeholder:text-gray-400" />
        </div>
        <div className="p-5 bg-slate-800 focus-within:bg-slate-900 transition-colors">
          <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">Tomorrow's Directive</label>
          <textarea value={currentEntry.tomorrow} onChange={(e) => updateEntry({ tomorrow: e.target.value })} placeholder="Primary focus for tomorrow..." className="w-full bg-transparent text-sm font-semibold text-white outline-none resize-y min-h-[60px] placeholder:text-slate-500" />
        </div>
      </div>

      {/* Utilities */}
      <div className="px-5 py-4 border-t flex items-center justify-between bg-gray-50 text-xs">
        <button onClick={saveNewVersion} className="flex items-center gap-2 text-orange-600 font-medium"><Edit3 size={14} /> Save as new version (Rewrite Day)</button>
        <button onClick={generateAutoSummary} className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 rounded-2xl font-semibold"><Zap size={14} /> Generate Auto Summary</button>
        {currentEntry.versions && currentEntry.versions.length > 0 && (
          <button onClick={() => setShowVersions(!showVersions)} className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <History size={14} /> {currentEntry.versions.length} previous versions
          </button>
        )}
      </div>

      {showVersions && currentEntry.versions && (
        <div className="px-5 pb-5 bg-white border-t max-h-64 overflow-auto">
          {currentEntry.versions.map((v: any, i: number) => (
            <div key={i} className="flex justify-between items-center py-3 border-b text-xs">
              <span className="font-mono text-gray-400">{new Date(v.timestamp).toLocaleString()}</span>
              <button onClick={() => alert("Preview mode loaded (full restore available in production).")} className="text-orange-500 flex items-center gap-1 text-[10px] font-medium">View snapshot <ArrowRight size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}