import React, { useState } from 'react';
import { 
  Smile, Meh, Frown, 
  BatteryFull, BatteryMedium, Battery, 
  Tag as TagIcon, Target, Lock, Link as LinkIcon, 
  ChevronDown, ChevronUp, LockKeyhole
} from 'lucide-react';
import { PREDEFINED_TAGS, PREDEFINED_FRICTIONS } from './types';

export default function BehaviorPanel({ system }: any) {
  const { 
    currentEntry, updateEntry, handleTagToggle, handleFrictionToggle, 
    newRelatedDate, setNewRelatedDate, addRelatedDate, removeRelatedDate 
  } = system;
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Contextual label for the goal slider
  const getGoalLabel = (val: number) => {
    if (val < 40) return "Low alignment";
    if (val < 70) return "Moderate alignment";
    return "High alignment";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[24px] p-5 sm:p-6 shadow-sm mt-6">
      
      {/* 1 & 2. STATE & DIRECTION (Primary Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
        
        {/* Mood */}
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Mood State</span>
          <div className="flex gap-2">
            <button 
              onClick={() => updateEntry({ mood: 'good' })} 
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${
                currentEntry.mood === 'good' 
                  ? 'bg-green-50 border-green-300 text-green-700 shadow-sm ring-2 ring-green-100 ring-offset-1' 
                  : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200'
              }`}
            >
              <Smile size={20} /> <span className="text-[10px] font-bold uppercase">Good</span>
            </button>
            <button 
              onClick={() => updateEntry({ mood: 'neutral' })} 
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${
                currentEntry.mood === 'neutral' 
                  ? 'bg-gray-100 border-gray-400 text-gray-800 shadow-sm ring-2 ring-gray-100 ring-offset-1' 
                  : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200'
              }`}
            >
              <Meh size={20} /> <span className="text-[10px] font-bold uppercase">Neutral</span>
            </button>
            <button 
              onClick={() => updateEntry({ mood: 'bad' })} 
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${
                currentEntry.mood === 'bad' 
                  ? 'bg-red-50 border-red-300 text-red-700 shadow-sm ring-2 ring-red-100 ring-offset-1' 
                  : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200'
              }`}
            >
              <Frown size={20} /> <span className="text-[10px] font-bold uppercase">Low</span>
            </button>
          </div>
        </div>

        {/* Energy */}
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Energy Level</span>
          <div className="flex gap-2">
            <button 
              onClick={() => updateEntry({ energy: 'high' })} 
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${
                currentEntry.energy === 'high' 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm ring-2 ring-emerald-100 ring-offset-1' 
                  : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200'
              }`}
            >
              <BatteryFull size={20} /> <span className="text-[10px] font-bold uppercase">High</span>
            </button>
            <button 
              onClick={() => updateEntry({ energy: 'medium' })} 
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${
                currentEntry.energy === 'medium' 
                  ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-sm ring-2 ring-orange-100 ring-offset-1' 
                  : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200'
              }`}
            >
              <BatteryMedium size={20} /> <span className="text-[10px] font-bold uppercase">Med</span>
            </button>
            <button 
              onClick={() => updateEntry({ energy: 'low' })} 
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${
                currentEntry.energy === 'low' 
                  ? 'bg-red-50 border-red-300 text-red-700 shadow-sm ring-2 ring-red-100 ring-offset-1' 
                  : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200'
              }`}
            >
              <Battery size={20} /> <span className="text-[10px] font-bold uppercase">Low</span>
            </button>
          </div>
        </div>

        {/* Focus */}
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Life Direction</span>
          <select 
            value={currentEntry.focusArea || 'None'} 
            onChange={(e) => updateEntry({ focusArea: e.target.value })} 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-700 outline-none focus:border-orange-400 focus:bg-white transition-colors cursor-pointer"
          >
            <option value="None">No focus selected</option>
            <option value="Work">Work</option>
            <option value="Health">Health</option>
            <option value="Learning">Learning</option>
            <option value="Social">Social</option>
          </select>
        </div>

        {/* Goal Alignment */}
        <div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Goal Alignment</span>
             <span className={`text-[10px] font-bold ${currentEntry.goalAlignment >= 70 ? 'text-emerald-500' : currentEntry.goalAlignment < 40 ? 'text-red-500' : 'text-orange-500'}`}>
               {getGoalLabel(currentEntry.goalAlignment || 50)}
             </span>
          </div>
          <p className="text-[10px] text-gray-400 mb-2">How aligned were your actions today?</p>
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
            <input 
              type="range" min="0" max="100" 
              value={currentEntry.goalAlignment || 50} 
              onChange={(e) => updateEntry({ goalAlignment: parseInt(e.target.value) })} 
              className="flex-1 accent-orange-500 cursor-pointer" 
            />
            <span className="font-mono text-sm font-bold w-10 text-right text-gray-700">{currentEntry.goalAlignment || 50}%</span>
          </div>
        </div>
      </div>

      {/* State Feedback Helper (Now visible on mobile) */}
      <div className="mt-4 block bg-gray-50/50 p-2 rounded-lg">
         <p className="text-[11px] font-semibold text-gray-500 text-center sm:text-left">
           {currentEntry.mood && currentEntry.energy 
             ? <span className="text-gray-700 capitalize">Recorded State: {currentEntry.mood} mood • {currentEntry.energy} energy</span>
             : 'Set your state for today to begin reflection'}
         </p>
      </div>

      <hr className="border-gray-100 my-6" />

      {/* 3. REFLECTION (Identity) */}
      <div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Identity Reflection</span>
        <input 
          value={currentEntry.identity || ''} 
          onChange={(e) => updateEntry({ identity: e.target.value })} 
          placeholder="Who were you today? (e.g. focused builder • distracted • disciplined)" 
          maxLength={60}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 outline-none focus:border-orange-400 focus:bg-white transition-colors placeholder:text-gray-400" 
        />
      </div>

      <hr className="border-gray-100 my-6" />

      {/* 4. ADVANCED TOGGLE */}
      <button 
        onClick={() => setShowAdvanced(!showAdvanced)} 
        className={`flex items-center justify-between w-full px-5 py-3.5 rounded-xl border transition-all ${
          showAdvanced ? 'bg-white border-orange-200 text-orange-600 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
        }`}
      >
        <span className="text-xs font-bold uppercase tracking-widest">Advanced Tracking Engine</span>
        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 
      </button>

      {/* ADVANCED CONTENT */}
      {showAdvanced && (
        <div className="mt-6 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* Tags & Frictions (Horizontal Scroll for Mobile with Fade) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Tags */}
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <TagIcon size={14} /> Context Tags
              </span>
              <div className="relative">
                <div className="flex gap-2 overflow-x-auto pb-2 pr-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {PREDEFINED_TAGS.slice(0, 8).map(tag => (
                    <button 
                      key={tag} 
                      onClick={() => handleTagToggle(tag)} 
                      className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${currentEntry.tags?.includes(tag) ? 'bg-orange-500 text-white border-orange-600 shadow-sm ring-2 ring-orange-100 ring-offset-1' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-white hover:border-gray-300'}`}
                    >
                      #{tag}
                    </button>
                  ))}
                  <button className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-white text-gray-400 border border-gray-200 border-dashed">
                    + More
                  </button>
                </div>
                {/* Scroll Fade Indicator */}
                <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Frictions */}
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Target size={14} /> Frictions Faced
              </span>
              <div className="relative">
                <div className="flex gap-2 overflow-x-auto pb-2 pr-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {PREDEFINED_FRICTIONS.slice(0, 8).map(friction => (
                    <button 
                      key={friction} 
                      onClick={() => handleFrictionToggle(friction)} 
                      className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${currentEntry.frictions?.includes(friction) ? 'bg-red-500 text-white border-red-600 shadow-sm ring-2 ring-red-100 ring-offset-1' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-white hover:border-gray-300'}`}
                    >
                      {friction}
                    </button>
                  ))}
                </div>
                {/* Scroll Fade Indicator */}
                <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Chapter, Lock, Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
            
            {/* Chapter */}
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Life Chapter</span>
              <input 
                value={currentEntry.chapter || ''} 
                onChange={(e) => updateEntry({ chapter: e.target.value })} 
                placeholder="e.g. Startup Phase • Gym Era" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-orange-400 focus:bg-white transition-colors" 
              />
            </div>
            
            {/* Lock */}
            <div className="flex items-end">
              <label className={`flex items-center gap-3 p-3 border rounded-xl w-full cursor-pointer transition-all group ${currentEntry.isLocked ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300'}`}>
                <div className={`p-2 rounded-lg transition-colors ${currentEntry.isLocked ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 border border-gray-200 group-hover:border-gray-300'}`}>
                  {currentEntry.isLocked ? <LockKeyhole size={16} /> : <Lock size={16} />}
                </div>
                <div className="flex flex-col">
                   <span className={`text-sm font-bold ${currentEntry.isLocked ? 'text-orange-900' : 'text-gray-800'}`}>Private Memory</span>
                   <span className={`text-[10px] font-medium ${currentEntry.isLocked ? 'text-orange-600' : 'text-gray-500'}`}>Lock from standard views</span>
                </div>
                <input type="checkbox" checked={currentEntry.isLocked || false} onChange={(e) => updateEntry({ isLocked: e.target.checked })} className="hidden" />
              </label>
            </div>

            {/* Linked Memories */}
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <LinkIcon size={14} /> Linked Memories
              </span>
              <div className="flex flex-wrap gap-2 mb-3">
                {(currentEntry.relatedDates || []).map((date: string) => (
                  <div key={date} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    {date}
                    <button onClick={() => removeRelatedDate(date)} className="text-gray-400 hover:text-red-500 ml-1 transition-colors">×</button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  pattern="\d{4}-\d{2}-\d{2}"
                  maxLength={10}
                  value={newRelatedDate} 
                  onChange={(e) => setNewRelatedDate(e.target.value)} 
                  placeholder="YYYY-MM-DD" 
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-orange-400 transition-colors shadow-sm" 
                />
                <button 
                  onClick={addRelatedDate} 
                  className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-sm"
                >
                  Link Day
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}