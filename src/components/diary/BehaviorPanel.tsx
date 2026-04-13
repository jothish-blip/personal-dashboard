import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Smile, Meh, Frown, 
  BatteryFull, BatteryMedium, Battery, 
  Moon, Cloud, CloudRain,
  Tag as TagIcon, Target, Link as LinkIcon, 
  ChevronDown, ChevronUp, Zap, Lightbulb, 
  HelpCircle, Undo, Sparkles, Lock
} from 'lucide-react';
import { PREDEFINED_TAGS, PREDEFINED_FRICTIONS } from './types';

// --- Mobile-Friendly Click-to-Toggle Help Tooltip ---
const HelpTip = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tipRef.current && !tipRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block ml-1.5" ref={tipRef}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); setOpen(!open); }}
        className={`transition-colors focus:outline-none ${open ? 'text-orange-500' : 'text-gray-300 hover:text-orange-400'}`}
      >
        <HelpCircle size={13} />
      </button>

      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 max-w-[85vw] p-3 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-medium shadow-xl text-center leading-relaxed animate-in fade-in zoom-in-95 duration-150">
          {text}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45" />
        </div>
      )}
    </div>
  );
};

const TAG_CATEGORIES = {
  "Focus": ['Deep Work', 'Focused', 'Learning'],
  "State": ['Breakthrough', 'Motivated', 'Tired', 'Busy', 'Lazy'],
  "Blocks": ['Failure', 'Distraction Day']
};

export default function BehaviorPanel({ system }: any) {
  const { 
    currentEntry, updateEntry, 
    newRelatedDate, setNewRelatedDate, addRelatedDate, removeRelatedDate 
  } = system;
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [customFriction, setCustomFriction] = useState('');
  
  // --- Undo System ---
  const lastEntryRef = useRef<any>(null);
  
  const handleAction = (updates: any) => {
    lastEntryRef.current = { ...currentEntry };
    updateEntry(updates);
  };

  const handleUndo = () => {
    if (lastEntryRef.current) {
      updateEntry(lastEntryRef.current);
      lastEntryRef.current = null;
    }
  };

  const handleTagToggleAction = (tag: string) => {
    const newTags = currentEntry.tags?.includes(tag) 
      ? currentEntry.tags.filter((t: string) => t !== tag) 
      : [...(currentEntry.tags || []), tag];
    handleAction({ tags: newTags });
  };

  const handleFrictionToggleAction = (friction: string) => {
    const newFrictions = currentEntry.frictions?.includes(friction) 
      ? currentEntry.frictions.filter((f: string) => f !== friction) 
      : [...(currentEntry.frictions || []), friction];
    handleAction({ frictions: newFrictions });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customTag.trim()) {
      handleTagToggleAction(customTag.trim());
      setCustomTag('');
    } else if (e.key === 'Backspace' && customTag === '' && (currentEntry.tags?.length || 0) > 0) {
      const newTags = [...currentEntry.tags];
      newTags.pop();
      handleAction({ tags: newTags });
    }
  };

  const handleFrictionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customFriction.trim()) {
      handleFrictionToggleAction(customFriction.trim());
      setCustomFriction('');
    } else if (e.key === 'Backspace' && customFriction === '' && (currentEntry.frictions?.length || 0) > 0) {
      const newFrictions = [...currentEntry.frictions];
      newFrictions.pop();
      handleAction({ frictions: newFrictions });
    }
  };

  // --- Core Metrics Calculations ---
  const completionScore = [
    currentEntry.mood && currentEntry.mood !== 'neutral',
    currentEntry.energy,
    currentEntry.sleep,
    currentEntry.focusArea && currentEntry.focusArea !== 'None',
    currentEntry.identity,
    currentEntry.win,
    currentEntry.improvement,
    currentEntry.trigger,
    currentEntry.dayStructure,
    currentEntry.socialLoad,
    currentEntry.cognitiveLoad,
    currentEntry.momentum,
    currentEntry.executionQuality
  ].filter(Boolean).length;

  const energyScore = currentEntry.energy === 'high' ? 100 : currentEntry.energy === 'low' ? 0 : 50;
  const alignScore = currentEntry.goalAlignment || 50;
  const distractScore = 100 - (currentEntry.distractionLevel || 0);
  const dayQualityScore = Math.round((energyScore + alignScore + distractScore) / 3);

  // --- Auto-Generated Daily Summary Sentence ---
  const dailySummary = useMemo(() => {
    const eStr = currentEntry.energy ? currentEntry.energy.charAt(0).toUpperCase() + currentEntry.energy.slice(1) : 'Medium';
    const dStr = (currentEntry.distractionLevel || 0) > 50 ? 'high distraction' : 'strong focus';
    const exStr = currentEntry.executionQuality || 'standard';
    return `${eStr} energy and ${dStr} led to ${exStr} execution.`;
  }, [currentEntry.energy, currentEntry.distractionLevel, currentEntry.executionQuality]);

  // --- Intelligence Engine ---
  const activeInsights = useMemo(() => {
    const insights = [];
    
    // Pattern Recognition
    if (currentEntry.sleep === 'poor' && currentEntry.energy === 'low' && currentEntry.distractionLevel > 50) {
      insights.push({ icon: <Zap size={14}/>, text: 'Pattern Detected: Low sleep → low energy → high distraction. Prioritize rest tonight.' });
    } else if (currentEntry.energy === 'low') {
      insights.push({ icon: <Battery size={14}/>, text: 'Focus on recovery. Pick just 1 high-value task today.' });
    } else if (currentEntry.energy === 'high') {
      insights.push({ icon: <Zap size={14}/>, text: 'Peak energy! Tackle your hardest friction points right now.' });
    }

    const topFriction = (currentEntry.frictions || [])[0];
    if (topFriction) {
      insights.push({ icon: <Target size={14}/>, text: `Top Blocker (${topFriction}): Address this immediately to regain momentum.` });
    }

    if (currentEntry.distractionLevel > 60) {
      insights.push({ icon: <Sparkles size={14}/>, text: 'High distraction detected. Consider a hard environment reset tomorrow.' });
    }

    return insights;
  }, [currentEntry.energy, currentEntry.frictions, currentEntry.distractionLevel, currentEntry.sleep]);

  return (
    <div className="bg-white border border-gray-200 rounded-[24px] p-5 sm:p-6 shadow-sm mt-6">
      
      {/* Visual State & Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">Day Score:</span>
          <span className={`text-[12px] font-bold px-2.5 py-1 rounded-md ${dayQualityScore >= 70 ? 'bg-emerald-50 text-emerald-700' : dayQualityScore < 40 ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
            {dayQualityScore}/100
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {completionScore}/13 Completed
          </span>
          {lastEntryRef.current && (
            <button onClick={handleUndo} className="flex items-center gap-1 text-[10px] font-bold text-orange-500 hover:text-orange-600 uppercase tracking-widest transition-colors">
              <Undo size={12} /> Undo
            </button>
          )}
        </div>
      </div>

      {/* --- CORE SIGNALS (Top 3 Only) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-6 mb-6">
        
        {/* Mood */}
        <div>
          <div className="flex items-center mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mood State</span>
            <HelpTip text="How you emotionally felt today. Helps detect emotional patterns over time." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleAction({ mood: 'good' })} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${currentEntry.mood === 'good' ? 'bg-green-50 border-green-300 text-green-700 shadow-sm ring-2 ring-green-100 ring-offset-1' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200'}`}>
              <Smile size={20} /> <span className="text-[10px] font-bold uppercase">Good</span>
            </button>
            <button onClick={() => handleAction({ mood: 'neutral' })} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${currentEntry.mood === 'neutral' ? 'bg-gray-100 border-gray-400 text-gray-800 shadow-sm ring-2 ring-gray-100 ring-offset-1' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200'}`}>
              <Meh size={20} /> <span className="text-[10px] font-bold uppercase">Neutral</span>
            </button>
            <button onClick={() => handleAction({ mood: 'bad' })} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${currentEntry.mood === 'bad' ? 'bg-red-50 border-red-300 text-red-700 shadow-sm ring-2 ring-red-100 ring-offset-1' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200'}`}>
              <Frown size={20} /> <span className="text-[10px] font-bold uppercase">Low</span>
            </button>
          </div>
        </div>

        {/* Energy */}
        <div>
          <div className="flex items-center mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Energy Level</span>
            <HelpTip text="Your physical & mental energy level. Strongly impacts productivity patterns." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleAction({ energy: 'high' })} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${currentEntry.energy === 'high' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm ring-2 ring-emerald-100 ring-offset-1' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200'}`}>
              <BatteryFull size={20} /> <span className="text-[10px] font-bold uppercase">High</span>
            </button>
            <button onClick={() => handleAction({ energy: 'medium' })} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${currentEntry.energy === 'medium' ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-sm ring-2 ring-orange-100 ring-offset-1' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200'}`}>
              <BatteryMedium size={20} /> <span className="text-[10px] font-bold uppercase">Med</span>
            </button>
            <button onClick={() => handleAction({ energy: 'low' })} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${currentEntry.energy === 'low' ? 'bg-red-50 border-red-300 text-red-700 shadow-sm ring-2 ring-red-100 ring-offset-1' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200'}`}>
              <Battery size={20} /> <span className="text-[10px] font-bold uppercase">Low</span>
            </button>
          </div>
        </div>

        {/* Sleep Quality */}
        <div>
          <div className="flex items-center mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sleep Quality</span>
            <HelpTip text="The foundation of performance. Correlates directly with focus and willpower." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleAction({ sleep: 'good' })} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${currentEntry.sleep === 'good' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm ring-2 ring-indigo-100 ring-offset-1' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200'}`}>
              <Moon size={20} /> <span className="text-[10px] font-bold uppercase">Good</span>
            </button>
            <button onClick={() => handleAction({ sleep: 'average' })} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${currentEntry.sleep === 'average' ? 'bg-gray-100 border-gray-400 text-gray-800 shadow-sm ring-2 ring-gray-100 ring-offset-1' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200'}`}>
              <Cloud size={20} /> <span className="text-[10px] font-bold uppercase">Avg</span>
            </button>
            <button onClick={() => handleAction({ sleep: 'poor' })} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${currentEntry.sleep === 'poor' ? 'bg-red-50 border-red-300 text-red-700 shadow-sm ring-2 ring-red-100 ring-offset-1' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200'}`}>
              <CloudRain size={20} /> <span className="text-[10px] font-bold uppercase">Poor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Generated Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 mb-6 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-700 italic">
          "{dailySummary}"
        </p>
      </div>

      {/* Consolidated Insights Card */}
      {activeInsights.length > 0 && (
        <div className="mb-6 bg-white border border-gray-200 p-4 rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
            <Sparkles size={14} className="text-orange-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Intelligence</span>
          </div>
          <div className="space-y-3">
            {activeInsights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <div className="mt-0.5 text-orange-500 shrink-0">{insight.icon}</div>
                <p>{insight.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- ADVANCED TOGGLE --- */}
      <button 
        onClick={() => setShowAdvanced(!showAdvanced)} 
        className={`flex items-center justify-between w-full px-5 py-3.5 rounded-xl border transition-all ${
          showAdvanced ? 'bg-gray-50 border-gray-300 text-gray-800 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        <span className="text-xs font-bold uppercase tracking-widest">
          {showAdvanced ? "Deep Analysis Mode" : "Expand Full Analysis"}
        </span>
        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 
      </button>

      {/* --- ADVANCED CONTENT (Collapsible) --- */}
      {showAdvanced && (
        <div className="mt-6 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* SECTION 2: METRICS & ALIGNMENT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            <div>
              <div className="flex items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Environment</span>
                <HelpTip text="Where you spent the majority of your day." />
              </div>
              <select 
                value={currentEntry.environment || 'home'} 
                onChange={(e) => handleAction({ environment: e.target.value })} 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-700 outline-none focus:border-orange-400 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="home">🏡 Home Base</option>
                <option value="office">🏢 Office / Work</option>
                <option value="travel">✈️ Travel / Transit</option>
                <option value="mixed">🔄 Mixed / Mobile</option>
              </select>
            </div>

            <div>
              <div className="flex items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Life Direction</span>
                <HelpTip text="The primary domain where you spent your time." />
              </div>
              <select 
                value={currentEntry.focusArea || 'None'} 
                onChange={(e) => handleAction({ focusArea: e.target.value })} 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-700 outline-none focus:border-orange-400 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="None">No focus selected</option>
                <option value="Work">💼 Work</option>
                <option value="Health">🏋️ Health</option>
                <option value="Learning">📚 Learning</option>
                <option value="Social">🤝 Social</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Distraction Load</span>
                  <HelpTip text="Focus capacity lost to unintended distractions." />
                </div>
                 <span className={`text-[10px] font-bold ${currentEntry.distractionLevel > 60 ? 'text-red-500' : currentEntry.distractionLevel < 30 ? 'text-emerald-500' : 'text-orange-500'}`}>
                   {currentEntry.distractionLevel || 0}%
                 </span>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 mt-2 rounded-xl border border-gray-100 mb-2">
                <input 
                  type="range" min="0" max="100" 
                  value={currentEntry.distractionLevel || 0} 
                  onChange={(e) => handleAction({ distractionLevel: parseInt(e.target.value) })} 
                  className="flex-1 accent-red-500 cursor-pointer" 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Goal Alignment</span>
                  <HelpTip text="How closely your actions matched your intended goals today." />
                </div>
                 <span className={`text-[10px] font-bold ${currentEntry.goalAlignment >= 70 ? 'text-emerald-500' : currentEntry.goalAlignment < 40 ? 'text-red-500' : 'text-orange-500'}`}>
                   {currentEntry.goalAlignment || 50}%
                 </span>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 mt-2 rounded-xl border border-gray-100 mb-2">
                <input 
                  type="range" min="0" max="100" 
                  value={currentEntry.goalAlignment || 50} 
                  onChange={(e) => handleAction({ goalAlignment: parseInt(e.target.value) })} 
                  className="flex-1 accent-orange-500 cursor-pointer" 
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100 my-4" />

          {/* SECTION 3: ADVANCED DYNAMICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 lg:gap-6">
            <div>
              <div className="flex items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time Structure</span>
              </div>
              <select value={currentEntry.dayStructure || 'semi-structured'} onChange={(e) => handleAction({ dayStructure: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-orange-400 focus:bg-white transition-colors">
                <option value="structured">📐 Structured</option>
                <option value="semi-structured">📏 Semi-Structured</option>
                <option value="chaotic">🌪️ Chaotic</option>
              </select>
            </div>
            <div>
              <div className="flex items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Execution Depth</span>
              </div>
              <select value={currentEntry.executionQuality || 'shallow'} onChange={(e) => handleAction({ executionQuality: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-orange-400 focus:bg-white transition-colors">
                <option value="deep">🌊 Deep</option>
                <option value="shallow">💧 Shallow</option>
                <option value="fragmented">🧩 Fragmented</option>
              </select>
            </div>
            <div>
              <div className="flex items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cognitive Load</span>
              </div>
              <select value={currentEntry.cognitiveLoad || 'medium'} onChange={(e) => handleAction({ cognitiveLoad: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-orange-400 focus:bg-white transition-colors">
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
            <div>
              <div className="flex items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Social Exposure</span>
              </div>
              <select value={currentEntry.socialLoad || 'balanced'} onChange={(e) => handleAction({ socialLoad: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-orange-400 focus:bg-white transition-colors">
                <option value="isolated">🏝️ Isolated</option>
                <option value="balanced">⚖️ Balanced</option>
                <option value="overloaded">🎭 Overloaded</option>
              </select>
            </div>
            <div>
              <div className="flex items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Momentum State</span>
              </div>
              <select value={currentEntry.momentum || 'stable'} onChange={(e) => handleAction({ momentum: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-orange-400 focus:bg-white transition-colors">
                <option value="building">📈 Building</option>
                <option value="stable">➖ Stable</option>
                <option value="declining">📉 Declining</option>
              </select>
            </div>
          </div>

          <hr className="border-gray-100 my-4" />

          {/* SECTION 4: PSYCHOLOGICAL REFLECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Triggers & Identity */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center mb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trigger Context</span>
                  <HelpTip text="What caused today's behavior? (e.g., bad sleep, pressure)" />
                </div>
                <input 
                  value={currentEntry.trigger || ''} 
                  onChange={(e) => handleAction({ trigger: e.target.value })} 
                  placeholder="What caused this day?..." 
                  maxLength={60}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-orange-400 focus:bg-white transition-colors" 
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Bad sleep', 'Distractions', 'Heavy workload'].map(s => (
                    <button key={s} onClick={() => handleAction({ trigger: s })} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md hover:bg-gray-200 font-medium transition-colors">+{s}</button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center mb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Identity Reflection</span>
                </div>
                <input 
                  value={currentEntry.identity || ''} 
                  onChange={(e) => handleAction({ identity: e.target.value })} 
                  placeholder="Who were you today?..." 
                  maxLength={60}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-orange-400 focus:bg-white transition-colors" 
                />
              </div>
            </div>

            {/* Wins & Improvements */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center mb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">One Win</span>
                  <HelpTip text="Force positive reinforcement. What went right today?" />
                </div>
                <input 
                  value={currentEntry.win || ''} 
                  onChange={(e) => handleAction({ win: e.target.value })} 
                  placeholder="One win from today..." 
                  maxLength={100}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-orange-400 focus:bg-white transition-colors" 
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Deep work block', 'Cleared inbox', 'Good workout'].map(s => (
                    <button key={s} onClick={() => handleAction({ win: s })} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md hover:bg-gray-200 font-medium transition-colors">+{s}</button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center mb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">One Fix for Tomorrow</span>
                </div>
                <input 
                  value={currentEntry.improvement || ''} 
                  onChange={(e) => handleAction({ improvement: e.target.value })} 
                  placeholder="How will you improve tomorrow?..." 
                  maxLength={100}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-orange-400 focus:bg-white transition-colors" 
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Sleep earlier', 'Phone in other room', 'Plan night before'].map(s => (
                    <button key={s} onClick={() => handleAction({ improvement: s })} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md hover:bg-gray-200 font-medium transition-colors">+{s}</button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          <hr className="border-gray-100 my-4" />

          {/* SECTION 5: TAGS & FRICTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Tags Engine */}
            <div>
              <div className="flex items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <TagIcon size={14} /> Context Tags
                </span>
              </div>
              
              {(currentEntry.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {(currentEntry.tags || []).map((tag: string) => (
                    <button key={tag} onClick={() => handleTagToggleAction(tag)} className="px-3 py-1 bg-orange-50 text-orange-700 hover:bg-red-50 hover:text-red-700 border border-orange-200 rounded-lg text-xs font-bold shadow-sm transition-colors group flex items-center gap-1">
                      #{tag} <span className="opacity-60 group-hover:opacity-100">×</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-3 mb-4">
                {Object.entries(TAG_CATEGORIES).map(([category, tags]) => (
                  <div key={category}>
                    <span className="text-[9px] font-bold text-gray-400 uppercase mb-1.5 block">{category}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(tag => {
                        if (currentEntry.tags?.includes(tag)) return null;
                        return (
                          <button key={tag} onClick={() => handleTagToggleAction(tag)} className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all shadow-sm">
                            + {tag}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input value={customTag} onChange={(e) => setCustomTag(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Add custom tag (Press Enter)..." className="flex-1 px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-orange-400 transition-colors shadow-sm" />
                <button onClick={() => { if (!customTag.trim()) return; handleTagToggleAction(customTag.trim()); setCustomTag(''); }} className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                  Add
                </button>
              </div>
            </div>

            {/* Friction Engine */}
            <div>
              <div className="flex items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} /> Frictions Faced
                </span>
              </div>

              {(currentEntry.frictions || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {(currentEntry.frictions || []).map((friction: string, idx: number) => (
                    <button key={friction} onClick={() => handleFrictionToggleAction(friction)} className={`px-3 py-1 text-red-700 border rounded-lg text-xs font-bold shadow-sm transition-colors group flex items-center gap-1 ${idx === 0 ? 'bg-red-100 border-red-300 hover:bg-red-50' : 'bg-red-50 border-red-200 hover:bg-red-100'}`} title={idx === 0 ? "Top Blocker Today" : ""}>
                      {idx === 0 && <span className="mr-1 opacity-80">⚠️</span>}
                      {friction} <span className="opacity-60 group-hover:opacity-100">×</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="relative mb-4">
                <span className="text-[9px] font-bold text-gray-400 uppercase mb-1.5 block">Common Frictions</span>
                <div className="flex gap-2 overflow-x-auto pb-2 pr-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {PREDEFINED_FRICTIONS.map(friction => {
                    if (currentEntry.frictions?.includes(friction)) return null;
                    return (
                      <button key={friction} onClick={() => handleFrictionToggleAction(friction)} className="shrink-0 snap-start px-3 py-1.5 rounded-md text-[11px] font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all shadow-sm">
                        + {friction}
                      </button>
                    )
                  })}
                </div>
                <div className="absolute right-0 bottom-2 top-6 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
              </div>

              <div className="flex gap-2">
                <input value={customFriction} onChange={(e) => setCustomFriction(e.target.value)} onKeyDown={handleFrictionKeyDown} placeholder="Add custom friction (Press Enter)..." className="flex-1 px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-orange-400 transition-colors shadow-sm" />
                <button onClick={() => { if (!customFriction.trim()) return; handleFrictionToggleAction(customFriction.trim()); setCustomFriction(''); }} className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                  Add
                </button>
              </div>
            </div>

          </div>

          <hr className="border-gray-100 my-4" />

          {/* SECTION 6: CHAPTER & LINKS (STRICT SINGLE LINE) */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            
            {/* Chapter */}
            <div className="w-full">
              <div className="flex items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Life Chapter</span>
              </div>
              <input 
                value={currentEntry.chapter || ''} 
                onChange={(e) => handleAction({ chapter: e.target.value })} 
                placeholder="e.g. Startup Phase" 
                className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-orange-400 transition-colors" 
              />
            </div>

            {/* Linked Memories */}
            <div className="w-full">
              <div className="flex items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <LinkIcon size={14} /> Linked Memories
                </span>
              </div>
              
              {(currentEntry.relatedDates || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {(currentEntry.relatedDates || []).map((date: string) => (
                    <div key={date} className="flex items-center gap-1 bg-gray-50 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                      {date}
                      <button onClick={() => removeRelatedDate(date)} className="text-gray-400 hover:text-red-500 ml-1 transition-colors">×</button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  pattern="\d{4}-\d{2}-\d{2}"
                  maxLength={10}
                  value={newRelatedDate} 
                  onChange={(e) => setNewRelatedDate(e.target.value)} 
                  placeholder="YYYY-MM-DD" 
                  className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-orange-400 transition-colors shadow-sm" 
                />
                <button 
                  onClick={() => { addRelatedDate(); handleAction({}); }} 
                  className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-xl transition-all active:scale-95 shadow-sm whitespace-nowrap"
                >
                  Link
                </button>
              </div>
            </div>

          </div>

          {/* FINAL LOCK ACTION */}
          <div className="flex justify-end pt-6">
             <button 
               onClick={() => updateEntry({ isLocked: true })}
               disabled={completionScore < 5}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${completionScore >= 5 ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
             >
               <Lock size={16} />
               {completionScore >= 5 ? "Finalize & Lock Day" : `Complete ${5 - completionScore} more fields to Lock`}
             </button>
          </div>

        </div>
      )}
    </div>
  );
}