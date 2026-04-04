import React from 'react';
import { Smile, Meh, Frown, BatteryFull, BatteryMedium, Battery, Tag as TagIcon, Target, Lock, Link as LinkIcon } from 'lucide-react';
import { PREDEFINED_TAGS, PREDEFINED_FRICTIONS } from './types';

export default function BehaviorPanel({ system }: any) {
  const { currentEntry, updateEntry, handleTagToggle, handleFrictionToggle, newRelatedDate, setNewRelatedDate, addRelatedDate, removeRelatedDate } = system;

  return (
    <div className="bg-white border border-gray-200 rounded-[20px] p-5 shadow-sm mt-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Mood State</span>
          <div className="flex gap-2">
            <button onClick={() => updateEntry({ mood: 'good' })} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-colors ${currentEntry.mood === 'good' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}><Smile size={18} /> <span className="text-[10px] font-bold uppercase">Good</span></button>
            <button onClick={() => updateEntry({ mood: 'neutral' })} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-colors ${currentEntry.mood === 'neutral' ? 'bg-gray-100 border-gray-300 text-gray-800' : 'bg-gray-50 border-gray-100 text-gray-500'}`}><Meh size={18} /> <span className="text-[10px] font-bold uppercase">Neutral</span></button>
            <button onClick={() => updateEntry({ mood: 'bad' })} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-colors ${currentEntry.mood === 'bad' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}><Frown size={18} /> <span className="text-[10px] font-bold uppercase">Low</span></button>
          </div>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Energy Level</span>
          <div className="flex gap-2">
            <button onClick={() => updateEntry({ energy: 'high' })} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-colors ${currentEntry.energy === 'high' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}><BatteryFull size={18} /> <span className="text-[10px] font-bold uppercase">High</span></button>
            <button onClick={() => updateEntry({ energy: 'medium' })} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-colors ${currentEntry.energy === 'medium' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}><BatteryMedium size={18} /> <span className="text-[10px] font-bold uppercase">Med</span></button>
            <button onClick={() => updateEntry({ energy: 'low' })} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-colors ${currentEntry.energy === 'low' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}><Battery size={18} /> <span className="text-[10px] font-bold uppercase">Low</span></button>
          </div>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Life Direction</span>
          <select value={currentEntry.focusArea} onChange={(e) => updateEntry({ focusArea: e.target.value as any })} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none">
            <option value="None">No focus selected</option><option value="Work">Work</option><option value="Health">Health</option><option value="Learning">Learning</option><option value="Social">Social</option>
          </select>
          <div className="mt-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Goal Alignment</span>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="100" value={currentEntry.goalAlignment || 50} onChange={(e) => updateEntry({ goalAlignment: parseInt(e.target.value) })} className="flex-1 accent-orange-500" />
              <span className="font-mono text-sm font-bold w-12 text-right">{currentEntry.goalAlignment || 50}%</span>
            </div>
          </div>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Who were you today?</span>
          <input value={currentEntry.identity || ''} onChange={(e) => updateEntry({ identity: e.target.value })} placeholder="Focused builder • Distracted" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-6">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><TagIcon size={14} /> Context Tags</span>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_TAGS.map(tag => (
              <button key={tag} onClick={() => handleTagToggle(tag)} className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors border ${currentEntry.tags.includes(tag) ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{tag}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Target size={14} /> Frictions Faced</span>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_FRICTIONS.map(friction => (
              <button key={friction} onClick={() => handleFrictionToggle(friction)} className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors border ${currentEntry.frictions?.includes(friction) ? 'bg-red-500 text-white border-red-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{friction}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Life Chapter</span>
          <input value={currentEntry.chapter || ''} onChange={(e) => updateEntry({ chapter: e.target.value })} placeholder="Startup Phase • Gym Era" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" />
        </div>
        <div className="flex items-center gap-3">
          <Lock size={18} className="text-gray-400" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={currentEntry.isLocked || false} onChange={(e) => updateEntry({ isLocked: e.target.checked })} className="w-4 h-4 accent-orange-500" />
            <span className="text-sm font-medium">Lock as private memory</span>
          </label>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><LinkIcon size={14} /> Linked Memories</span>
          <div className="flex flex-wrap gap-2 mb-3">
            {(currentEntry.relatedDates || []).map((date: string) => (
              <div key={date} className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-3xl">{date}<button onClick={() => removeRelatedDate(date)} className="text-orange-400">×</button></div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newRelatedDate} onChange={(e) => setNewRelatedDate(e.target.value)} placeholder="YYYY-MM-DD" className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm outline-none" />
            <button onClick={addRelatedDate} className="px-6 bg-orange-500 text-white text-xs font-bold rounded-2xl">Link</button>
          </div>
        </div>
      </div>
    </div>
  );
}