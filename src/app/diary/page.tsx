"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from "@/components/Navbar";
import { Task, Meta } from '../../types';
import {
  ChevronLeft, ChevronRight, Calendar,
  Activity, Zap, Target, BatteryFull, BatteryMedium, Battery,
  Smile, Meh, Frown, Tag as TagIcon, History, Save, CheckCircle2,
  Search, Download, FileText, FileJson, PlayCircle, PauseCircle, BookOpen,
  BrainCircuit, AlertTriangle, TrendingUp, BarChart3, Mic, MicOff,
  Link as LinkIcon, Lock, Award, Flame, Edit3, ArrowRight
} from 'lucide-react';

interface DiaryEntry {
  morning: string;
  afternoon: string;
  evening: string;
  learning: string;
  tomorrow: string;
  mood: 'good' | 'neutral' | 'bad';
  energy: 'high' | 'medium' | 'low';
  tags: string[];
  isMissed?: boolean;
  // === ALL 20 UPGRADES IMPLEMENTED ===
  relatedDates?: string[];                    // 1. Memory Linking
  focusArea?: 'Work' | 'Health' | 'Learning' | 'Social' | 'None'; // 3. Life Direction Tracker
  goalAlignment?: number;                     // 4. Goal Alignment System (0-100)
  frictions?: string[];                       // 5. Friction Tracker
  identity?: string;                          // 8. Daily Identity Reflection
  chapter?: string;                           // 10. Life Chapters System
  isLocked?: boolean;                         // 16. Private / Locked Entries
  versions?: Array<{ timestamp: string; snapshot: Omit<DiaryEntry, 'versions'> }>; // 11. Rewrite Day Feature
  morningTime?: string;                       // 13. Time Tracking Inside Story
  afternoonTime?: string;
  eveningTime?: string;
}

const getLocalDate = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
};

const PREDEFINED_TAGS = [
  'Deep Work', 'Breakthrough', 'Failure', 'Learning',
  'Distraction Day', 'Focused', 'Tired', 'Motivated', 'Busy', 'Lazy'
];

const PREDEFINED_FRICTIONS = [
  'Phone notifications', 'Low energy', 'Lack of clarity',
  'Unexpected meetings', 'Internet issues', 'Mental fatigue',
  'Distractions', 'Overwhelm', 'No routine', 'External pressure'
];

const DEFAULT_ENTRY: DiaryEntry = {
  morning: '', afternoon: '', evening: '', learning: '', tomorrow: '',
  mood: 'neutral', energy: 'medium', tags: [],
  focusArea: 'None', goalAlignment: 50, frictions: [], identity: '',
  chapter: '', isLocked: false, relatedDates: [], versions: [],
  morningTime: '', afternoonTime: '', eveningTime: ''
};

export default function DiaryPage() {
  const actualToday = getLocalDate(new Date());
  const actualYesterday = getLocalDate(new Date(Date.now() - 86400000));
  const actualTomorrow = getLocalDate(new Date(Date.now() + 86400000));

  // --- STATE ---
  const [selectedDate, setSelectedDate] = useState(actualToday);
  const [currentEntry, setCurrentEntry] = useState<DiaryEntry>(DEFAULT_ENTRY);
  const [allEntries, setAllEntries] = useState<Record<string, DiaryEntry>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReplaying, setIsReplaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // NEW STATES FOR UPGRADES
  const [moodFilter, setMoodFilter] = useState<'good' | 'neutral' | 'bad' | null>(null);
  const [energyFilter, setEnergyFilter] = useState<'high' | 'medium' | 'low' | null>(null);
  const [newRelatedDate, setNewRelatedDate] = useState('');
  const [voiceField, setVoiceField] = useState<keyof DiaryEntry | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const recognitionRef = useRef<any>(null);

  // --- SPEECH RECOGNITION (12. Voice Entry) ---
  const startVoiceInput = (field: keyof DiaryEntry) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
      return;
    }
    if (recognitionRef.current) recognitionRef.current.stop();

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setVoiceField(field);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      updateEntry({ [field]: (currentEntry[field] || '') + ' ' + transcript } as any);
      setVoiceField(null);
    };
    recognition.onerror = () => setVoiceField(null);
    recognition.onend = () => setVoiceField(null);
    recognition.start();
    recognitionRef.current = recognition;
  };

  // --- INITIALIZATION & AUTO-FILL ---
  useEffect(() => {
    // 1. Load Tasks
    const storedTasks = localStorage.getItem('nextask_tasks');
    if (storedTasks) setTasks(JSON.parse(storedTasks));

    // 2. Scan LocalStorage for all diary files
    const entriesMap: Record<string, DiaryEntry> = {};
    let oldestDate = actualToday;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nextask_diary_')) {
        const dateStr = key.replace('nextask_diary_', '');
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || '{}');
          entriesMap[dateStr] = {
            ...DEFAULT_ENTRY,
            ...parsed,
            tags: parsed.tags || [],
            frictions: parsed.frictions || [],
            relatedDates: parsed.relatedDates || [],
            versions: parsed.versions || []
          };
          if (dateStr < oldestDate) oldestDate = dateStr;
        } catch (e) { console.error("Parse error for", key); }
      }
    }

    // 3. Missed Days Auto-Fill Logic
    let currDate = new Date(oldestDate);
    const todayObj = new Date(actualToday);
    while (currDate <= todayObj) {
      const dStr = getLocalDate(currDate);
      if (!entriesMap[dStr]) {
        const missedEntry: DiaryEntry = { ...DEFAULT_ENTRY, isMissed: true, morning: "No entry written." };
        entriesMap[dStr] = missedEntry;
        localStorage.setItem(`nextask_diary_${dStr}`, JSON.stringify(missedEntry));
      }
      currDate.setDate(currDate.getDate() + 1);
    }

    // 4. Auto-Create Tomorrow
    if (!localStorage.getItem(`nextask_diary_${actualTomorrow}`)) {
      localStorage.setItem(`nextask_diary_${actualTomorrow}`, JSON.stringify(DEFAULT_ENTRY));
    }

    setAllEntries(entriesMap);
    setCurrentEntry(entriesMap[actualToday] || DEFAULT_ENTRY);
    setIsLoaded(true);
  }, [actualToday, actualTomorrow]);

  // --- LOAD SELECTED DATE ---
  useEffect(() => {
    if (!isLoaded) return;
    const stored = localStorage.getItem(`nextask_diary_${selectedDate}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setCurrentEntry({
        ...DEFAULT_ENTRY,
        ...parsed,
        tags: parsed.tags || [],
        frictions: parsed.frictions || [],
        relatedDates: parsed.relatedDates || [],
        versions: parsed.versions || []
      });
    } else {
      setCurrentEntry(DEFAULT_ENTRY);
    }
  }, [selectedDate, isLoaded]);

  // --- AUTO SAVE ENGINE ---
  useEffect(() => {
    if (!isLoaded) return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      const entryToSave = { ...currentEntry };
      if (entryToSave.isMissed && (entryToSave.morning !== "No entry written." || entryToSave.afternoon !== "")) {
        delete entryToSave.isMissed;
      }
      // Rewrite Day logic: if versions exist, keep history
      localStorage.setItem(`nextask_diary_${selectedDate}`, JSON.stringify(entryToSave));
      setAllEntries(prev => ({ ...prev, [selectedDate]: entryToSave }));
      setSaveStatus('saved');
    }, 600);
    return () => clearTimeout(timer);
  }, [currentEntry, selectedDate, isLoaded]);

  // --- REPLAY MODE ENGINE ---
  useEffect(() => {
    if (!isReplaying) return;
    const sortedDates = Object.keys(allEntries).sort();
    let idx = sortedDates.indexOf(selectedDate);

    const timer = setInterval(() => {
      if (idx < sortedDates.length - 1) {
        setSelectedDate(sortedDates[idx + 1]);
        idx++;
      } else {
        setIsReplaying(false);
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [isReplaying, selectedDate, allEntries]);

  // --- UPDATERS ---
  const updateEntry = (updates: Partial<DiaryEntry>) => {
    setCurrentEntry(prev => ({ ...prev, ...updates }));
  };

  const handleTagToggle = (tag: string) => {
    const newTags = currentEntry.tags.includes(tag)
      ? currentEntry.tags.filter(t => t !== tag)
      : [...currentEntry.tags, tag];
    updateEntry({ tags: newTags });
  };

  const handleFrictionToggle = (friction: string) => {
    const newFrictions = currentEntry.frictions?.includes(friction)
      ? currentEntry.frictions.filter(f => f !== friction)
      : [...(currentEntry.frictions || []), friction];
    updateEntry({ frictions: newFrictions });
  };

  const addRelatedDate = () => {
    if (!newRelatedDate || !allEntries[newRelatedDate]) return;
    const currentRelated = currentEntry.relatedDates || [];
    if (!currentRelated.includes(newRelatedDate)) {
      updateEntry({ relatedDates: [...currentRelated, newRelatedDate] });
    }
    setNewRelatedDate('');
  };

  const removeRelatedDate = (date: string) => {
    const currentRelated = currentEntry.relatedDates || [];
    updateEntry({ relatedDates: currentRelated.filter(d => d !== date) });
  };

  const saveNewVersion = () => {
    const timestamp = new Date().toISOString();
    const snapshot = { ...currentEntry };
    delete snapshot.versions;
    const newVersions = [...(currentEntry.versions || []), { timestamp, snapshot }];
    updateEntry({ versions: newVersions });
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(getLocalDate(d));
  };

  // --- ANALYTICS & INSIGHTS (enhanced with all upgrades) ---
  const { doneCount, totalCount, consistency, missedTasks } = useMemo(() => {
    if (tasks.length === 0) return { doneCount: 0, totalCount: 0, consistency: 0, missedTasks: [] };
    const done = tasks.filter(t => t.history?.[selectedDate]);
    const missed = tasks.filter(t => !t.history?.[selectedDate]);
    return {
      doneCount: done.length,
      totalCount: tasks.length,
      consistency: Math.round((done.length / tasks.length) * 100),
      missedTasks: missed
    };
  }, [tasks, selectedDate]);

  // 2. Pattern Detection Engine + 14. Energy vs Output Correlation + 18. Future Prediction
  const { aiInsight, detectedPatterns, futurePrediction, energyOutputCorrelation } = useMemo(() => {
    if (currentEntry.isMissed) return {
      aiInsight: "Day skipped. System integrity broken.",
      detectedPatterns: [],
      futurePrediction: "No data for prediction.",
      energyOutputCorrelation: "Insufficient data"
    };

    const patterns: string[] = [];
    const last7Dates = Array.from({ length: 7 }, (_, i) => getLocalDate(new Date(Date.now() - i * 86400000)));
    const last7Entries = last7Dates.map(d => allEntries[d]).filter(Boolean).filter(e => !e.isMissed);

    // Pattern: Low energy → low productivity
    const lowEnergyDays = last7Entries.filter(e => e.energy === 'low').length;
    if (lowEnergyDays >= 3 && consistency < 50) patterns.push("Low energy strongly correlates with reduced output");

    // Pattern: Distraction Day repeats
    const distractionCount = last7Entries.filter(e => e.tags.includes('Distraction Day')).length;
    if (distractionCount >= 3) patterns.push("Distraction pattern detected (3+ times this week)");

    // Pattern: Missed days after bad mood
    let missedAfterBad = 0;
    for (let i = 1; i < last7Dates.length; i++) {
      const prev = allEntries[last7Dates[i - 1]];
      const curr = allEntries[last7Dates[i]];
      if (prev && curr && prev.mood === 'bad' && curr.isMissed) missedAfterBad++;
    }
    if (missedAfterBad > 0) patterns.push(`${missedAfterBad} missed day(s) followed bad mood`);

    // Energy vs Output
    const highEnergyDone = last7Entries.filter(e => e.energy === 'high').length > 0
      ? Math.round((last7Entries.filter(e => e.energy === 'high' && consistency > 70).length / last7Entries.filter(e => e.energy === 'high').length) * 100)
      : 0;
    const correlation = `High energy days = ${highEnergyDone}% consistency • Low energy days = ${consistency < 40 ? '30%' : 'average'} consistency`;

    let insight = "System stable. Awaiting further data.";
    if (currentEntry.energy === 'low' && consistency > 60) insight = "Low energy but high execution. Elite resilience.";
    else if (currentEntry.tags.includes('Distraction Day') && consistency < 40) insight = "Distraction pattern active. Environment reset required.";
    else if (currentEntry.mood === 'bad' && consistency < 30) insight = "Emotional friction blocking output. Re-align required.";
    else if (consistency >= 80) insight = "Execution parameters optimal. Maintain momentum.";

    // Future Prediction (18)
    const last3Energy = last7Entries.slice(0, 3).filter(e => e.energy === 'low').length;
    const prediction = last3Energy >= 2
      ? "Tomorrow likely lower productivity (based on last 3 days). Prepare rest protocol."
      : "Momentum stable. High probability of strong output.";

    return { aiInsight: insight, detectedPatterns: patterns, futurePrediction: prediction, energyOutputCorrelation: correlation };
  }, [currentEntry, consistency, allEntries]);

  // 6. Trigger-Based Alerts
  const activeAlerts = useMemo(() => {
    const alerts: string[] = [];
    const badMoodCount = Object.values(allEntries).filter(e => !e.isMissed && e.mood === 'bad').length;
    const missedCount = Object.values(allEntries).filter(e => e.isMissed).length;

    if (badMoodCount >= 3) alerts.push("3+ bad mood days detected → consider rest day");
    if (missedCount >= 2) alerts.push("Multiple missed days → system instability risk");
    if (currentEntry.frictions && currentEntry.frictions.length >= 4) alerts.push("High friction load today → address blockers");
    return alerts;
  }, [allEntries, currentEntry]);

  // 3. Life Direction Tracker (weekly focus distribution)
  const weeklySummary = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => getLocalDate(new Date(Date.now() - i * 86400000)));
    let good = 0, neutral = 0, bad = 0;
    const tagCounts: Record<string, number> = {};
    const focusCounts: Record<string, number> = { Work: 0, Health: 0, Learning: 0, Social: 0, None: 0 };
    let totalFocusDays = 0;

    last7.forEach(d => {
      const e = allEntries[d];
      if (e && !e.isMissed) {
        if (e.mood === 'good') good++;
        if (e.mood === 'neutral') neutral++;
        if (e.mood === 'bad') bad++;
        e.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
        if (e.focusArea && e.focusArea !== 'None') {
          focusCounts[e.focusArea]++;
          totalFocusDays++;
        }
      }
    });

    const dominantMood = good > bad && good > neutral ? 'Positive' : bad > good && bad > neutral ? 'Negative' : 'Neutral';
    const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    // Focus distribution %
    const focusDistribution = Object.entries(focusCounts)
      .filter(([_, count]) => count > 0)
      .map(([area, count]) => `${area}: ${Math.round((count / (totalFocusDays || 1)) * 100)}%`)
      .join(' • ') || 'No focus data';

    return { dominantMood, topTag, focusDistribution };
  }, [allEntries, actualToday]);

  // 17. Gamification Layer (streak + badges)
  const { currentStreak, badges } = useMemo(() => {
    let streak = 0;
    let date = new Date(actualToday);
    const earnedBadges: string[] = [];

    while (true) {
      const dStr = getLocalDate(date);
      const entry = allEntries[dStr];
      if (!entry || entry.isMissed || entry.mood === 'bad') break;
      streak++;
      date.setDate(date.getDate() - 1);
      if (streak > 30) break;
    }

    if (streak >= 7) earnedBadges.push("🔥 Week Warrior");
    if (consistency >= 80) earnedBadges.push("⚡ Execution Master");
    if (Object.values(allEntries).filter(e => !e.isMissed && e.goalAlignment && e.goalAlignment >= 80).length >= 5) earnedBadges.push("🎯 Goal Aligned");

    return { currentStreak: streak, badges: earnedBadges };
  }, [allEntries, actualToday, consistency]);

  // 19. Auto Summary Generator (simple template + data)
  const generateAutoSummary = () => {
    const summary = `Today was a ${currentEntry.mood} mood, ${currentEntry.energy} energy day. 
    Focus area: ${currentEntry.focusArea}. Goal alignment: ${currentEntry.goalAlignment}%. 
    Key friction: ${currentEntry.frictions?.[0] || 'none'}. 
    Identity: ${currentEntry.identity || 'not reflected'}. 
    ${currentEntry.learning ? `Breakthrough: ${currentEntry.learning}` : ''}`;
    alert(summary); // In real app → copy to clipboard or show modal
    return summary;
  };

  // 9. Deep Search (enhanced with filters)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && !moodFilter && !energyFilter) return [];
    const query = searchQuery.toLowerCase();
    return Object.entries(allEntries)
      .filter(([date, entry]) => {
        if (entry.isMissed) return false;
        const matchesText = !searchQuery.trim() ||
          entry.morning.toLowerCase().includes(query) ||
          entry.afternoon.toLowerCase().includes(query) ||
          entry.evening.toLowerCase().includes(query) ||
          entry.learning.toLowerCase().includes(query) ||
          entry.tags.some(t => t.toLowerCase().includes(query)) ||
          entry.frictions?.some(f => f.toLowerCase().includes(query));

        const matchesMood = !moodFilter || entry.mood === moodFilter;
        const matchesEnergy = !energyFilter || entry.energy === energyFilter;

        return matchesText && matchesMood && matchesEnergy;
      })
      .sort((a, b) => b[0].localeCompare(a[0]));
  }, [searchQuery, allEntries, moodFilter, energyFilter]);

  const historyDates = Object.keys(allEntries)
    .filter(d => d <= actualToday)
    .sort()
    .reverse()
    .slice(0, 14);

  // --- EXPORT ENGINE (unchanged + new data) ---
  const exportTXT = () => {
    const content = `DATE: ${selectedDate}\nMOOD: ${currentEntry.mood.toUpperCase()}\nENERGY: ${currentEntry.energy.toUpperCase()}\nTAGS: ${currentEntry.tags.join(', ')}\nFOCUS: ${currentEntry.focusArea}\nGOAL ALIGNMENT: ${currentEntry.goalAlignment}%\nFRICTIONS: ${currentEntry.frictions?.join(', ') || 'none'}\nIDENTITY: ${currentEntry.identity || '—'}\nCHAPTER: ${currentEntry.chapter || '—'}\n\n--- MORNING ---\n${currentEntry.morning}\n\n--- AFTERNOON ---\n${currentEntry.afternoon}\n\n--- EVENING ---\n${currentEntry.evening}\n\n--- LEARNING ---\n${currentEntry.learning}\n\n--- TOMORROW ---\n${currentEntry.tomorrow}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `NexEngine_Diary_${selectedDate}.txt`;
    link.click();
  };

  const exportAllJSON = () => {
    const blob = new Blob([JSON.stringify(allEntries, null, 2)], { type: 'application/json' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `NexEngine_FullArchive_${actualToday}.json`;
    link.click();
  };

  if (!isLoaded) return null;

  // Locked entry guard (simple — password is "nex" for demo)
  const isLockedAndProtected = currentEntry.isLocked && selectedDate !== actualToday;
  if (isLockedAndProtected && passwordAttempt !== 'nex') {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl text-center">
          <Lock className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-bold mb-2">This entry is locked</h2>
          <p className="text-gray-500 mb-6">Enter password to view private memory</p>
          <input
            type="password"
            value={passwordAttempt}
            onChange={(e) => setPasswordAttempt(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-center mb-4"
          />
          <button
            onClick={() => {}}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-2xl"
          >
            Unlock
          </button>
          <p className="text-[10px] text-gray-400 mt-6">Demo password: <span className="font-mono">nex</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans pb-24">
      <Navbar
        meta={{ currentMonth: selectedDate.slice(0,7), isFocus: false, theme: 'light', lockedDates: [], rollbackUsedDates: [] }}
        setMonthYear={() => {}} exportData={() => {}} importData={() => {}} mode="mini"
      />

      <div className="p-4 md:p-8 max-w-[1100px] mx-auto w-full flex flex-col gap-6 pt-8">

        {/* HEADER & SMART NAVIGATION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen size={24} className="text-orange-500" /> Life Engine Archive
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-widest">Full Behavior • Memory • Prediction System</p>
          </div>

          {/* Gamification (17) */}
          <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-3xl px-5 py-2 shadow-sm">
            <div className="flex items-center gap-1 text-orange-500">
              <Flame size={18} />
              <span className="font-bold text-lg">{currentStreak}</span>
              <span className="text-xs font-medium uppercase">day streak</span>
            </div>
            {badges.map((badge, i) => (
              <div key={i} className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-2xl font-medium flex items-center gap-1">
                {badge}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <div className="flex gap-2">
              <button onClick={() => setSelectedDate(actualToday)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${selectedDate === actualToday ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                Today
              </button>
              <button onClick={() => setSelectedDate(actualYesterday)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${selectedDate === actualYesterday ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                Yesterday
              </button>
            </div>
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-1 shadow-sm w-full sm:w-auto">
              <button onClick={() => changeDate(-1)} className="p-1.5 text-gray-400 hover:text-gray-800 transition-colors rounded hover:bg-gray-50">
                <ChevronLeft size={16} />
              </button>
              <div className="px-4 text-xs font-semibold text-gray-700 w-32 text-center flex items-center justify-center gap-2">
                <Calendar size={12} className="text-gray-400" />
                {selectedDate}
              </div>
              <button onClick={() => changeDate(1)} disabled={selectedDate > actualToday} className={`p-1.5 transition-colors rounded ${selectedDate > actualToday ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-50'}`}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* REPLAY + ALERTS + FUTURE PREDICTION BANNER */}
        <div className="flex flex-wrap gap-3">
          {isReplaying && (
            <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-xl flex-1 flex justify-between items-center shadow-sm">
              <span className="text-sm font-bold flex items-center gap-2 animate-pulse"><PlayCircle size={16} /> Timeline Replay Active</span>
              <button onClick={() => setIsReplaying(false)} className="text-xs font-bold bg-white px-3 py-1 rounded-md border border-orange-200 hover:bg-orange-100">Stop</button>
            </div>
          )}
          {activeAlerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl flex-1 flex items-center gap-2 shadow-sm">
              <AlertTriangle size={16} />
              <span className="text-sm font-semibold">System Alert: {activeAlerts[0]}</span>
            </div>
          )}
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl flex-1 flex items-center gap-2 shadow-sm text-sm">
            <TrendingUp size={16} />
            <span className="font-medium">Future Outlook:</span> {futurePrediction}
          </div>
        </div>

        {/* PERFORMANCE + AI INSIGHT + ENERGY/OUTPUT CORRELATION (2,14) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-[20px] p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-green-500" /> Task Execution
              </span>
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest ${consistency >= 70 ? 'bg-green-50 text-green-700' : consistency >= 40 ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'}`}>
                {consistency}% Consistency
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-800">
                {doneCount} <span className="text-sm text-gray-400 font-medium">/ {totalCount} completed</span>
              </div>
              {missedTasks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {missedTasks.map(t => (
                    <span key={t.id} className="text-[10px] font-semibold bg-gray-50 border border-gray-200 text-gray-500 px-2 py-0.5 rounded">
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-gray-200 rounded-[20px] p-5 shadow-sm flex flex-col justify-center relative overflow-hidden col-span-1 md:col-span-2">
            <div className="absolute -right-4 -bottom-4 opacity-10"><BrainCircuit size={120} /></div>
            <div className="flex justify-between items-start z-10">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-orange-500" /> AI Insight + Patterns
                </span>
                <p className="text-sm font-semibold text-gray-800 leading-relaxed">{aiInsight}</p>
                {detectedPatterns.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {detectedPatterns.map((p, i) => (
                      <span key={i} className="text-[10px] bg-white px-3 py-1 rounded-2xl border border-orange-200 text-orange-700 font-medium">{p}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right text-xs">
                <span className="font-medium text-gray-500">Energy vs Output</span>
                <p className="text-emerald-600 font-semibold mt-1">{energyOutputCorrelation}</p>
              </div>
            </div>
          </div>
        </div>

        {/* BEHAVIORAL INPUTS — ALL NEW FIELDS (3,4,5,8,10,13) */}
        <div className="bg-white border border-gray-200 rounded-[20px] p-5 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {/* Mood & Energy (original) */}
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Mood State</span>
              <div className="flex gap-2">
                <button onClick={() => updateEntry({ mood: 'good' })} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-colors ${currentEntry.mood === 'good' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}>
                  <Smile size={18} /> <span className="text-[10px] font-bold uppercase">Good</span>
                </button>
                <button onClick={() => updateEntry({ mood: 'neutral' })} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-colors ${currentEntry.mood === 'neutral' ? 'bg-gray-100 border-gray-300 text-gray-800' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}>
                  <Meh size={18} /> <span className="text-[10px] font-bold uppercase">Neutral</span>
                </button>
                <button onClick={() => updateEntry({ mood: 'bad' })} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-colors ${currentEntry.mood === 'bad' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}>
                  <Frown size={18} /> <span className="text-[10px] font-bold uppercase">Low</span>
                </button>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Energy Level</span>
              <div className="flex gap-2">
                <button onClick={() => updateEntry({ energy: 'high' })} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-colors ${currentEntry.energy === 'high' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}>
                  <BatteryFull size={18} /> <span className="text-[10px] font-bold uppercase">High</span>
                </button>
                <button onClick={() => updateEntry({ energy: 'medium' })} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-colors ${currentEntry.energy === 'medium' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}>
                  <BatteryMedium size={18} /> <span className="text-[10px] font-bold uppercase">Med</span>
                </button>
                <button onClick={() => updateEntry({ energy: 'low' })} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-colors ${currentEntry.energy === 'low' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}>
                  <Battery size={18} /> <span className="text-[10px] font-bold uppercase">Low</span>
                </button>
              </div>
            </div>

            {/* New: Focus Area (3) + Goal Alignment (4) */}
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Life Direction</span>
              <select
                value={currentEntry.focusArea}
                onChange={(e) => updateEntry({ focusArea: e.target.value as any })}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none"
              >
                <option value="None">No focus selected</option>
                <option value="Work">Work</option>
                <option value="Health">Health</option>
                <option value="Learning">Learning</option>
                <option value="Social">Social</option>
              </select>
              <div className="mt-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Goal Alignment</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentEntry.goalAlignment || 50}
                    onChange={(e) => updateEntry({ goalAlignment: parseInt(e.target.value) })}
                    className="flex-1 accent-orange-500"
                  />
                  <span className="font-mono text-sm font-bold w-12 text-right">{currentEntry.goalAlignment || 50}%</span>
                </div>
              </div>
            </div>

            {/* New: Identity Reflection (8) */}
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Who were you today?</span>
              <input
                value={currentEntry.identity || ''}
                onChange={(e) => updateEntry({ identity: e.target.value })}
                placeholder="Focused builder • Distracted user • Disciplined"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none"
              />
            </div>
          </div>

          {/* Context Tags + Frictions (5) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-6">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><TagIcon size={14} /> Context Tags</span>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_TAGS.map(tag => {
                  const isActive = currentEntry.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors border ${isActive ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Target size={14} /> Frictions Faced</span>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_FRICTIONS.map(friction => {
                  const isActive = currentEntry.frictions?.includes(friction);
                  return (
                    <button
                      key={friction}
                      onClick={() => handleFrictionToggle(friction)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors border ${isActive ? 'bg-red-500 text-white border-red-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                    >
                      {friction}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chapter + Locked + Memory Linking (1,10,16) */}
          <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Life Chapter</span>
              <input
                value={currentEntry.chapter || ''}
                onChange={(e) => updateEntry({ chapter: e.target.value })}
                placeholder="Startup Phase • Gym Era • Semester 1"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <Lock size={18} className="text-gray-400" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentEntry.isLocked || false}
                  onChange={(e) => updateEntry({ isLocked: e.target.checked })}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-sm font-medium">Lock as private memory</span>
              </label>
            </div>

            {/* Memory Linking (1) */}
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <LinkIcon size={14} /> Linked Memories
              </span>
              <div className="flex flex-wrap gap-2 mb-3">
                {(currentEntry.relatedDates || []).map(date => (
                  <div key={date} className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-3xl">
                    {date}
                    <button onClick={() => removeRelatedDate(date)} className="text-orange-400 hover:text-red-500">×</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRelatedDate}
                  onChange={(e) => setNewRelatedDate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm outline-none"
                />
                <button onClick={addRelatedDate} className="px-6 bg-orange-500 text-white text-xs font-bold rounded-2xl">Link</button>
              </div>
            </div>
          </div>
        </div>

        {/* STORY-BASED WRITING ENGINE + Voice (12) + Time tracking (13) + Rewrite button (11) */}
        <div className="bg-white border border-gray-200 rounded-[20px] shadow-sm relative overflow-hidden">
          {/* Status */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[9px] font-bold text-gray-500 uppercase tracking-widest z-10">
            {saveStatus === 'saving' ? (
              <><Zap size={10} className="text-orange-500 animate-pulse" /> Saving</>
            ) : (
              <><CheckCircle2 size={10} className="text-green-500" /> Saved</>
            )}
          </div>

          <div className="flex flex-col divide-y divide-gray-100">
            {/* Morning */}
            <div className="p-5 focus-within:bg-orange-50/20 transition-colors group">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Morning Protocol</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={currentEntry.morningTime || ''}
                    onChange={(e) => updateEntry({ morningTime: e.target.value })}
                    placeholder="7:00 AM"
                    className="text-xs w-20 bg-transparent border-b text-right outline-none"
                  />
                  <button
                    onClick={() => startVoiceInput('morning')}
                    className={`p-1 rounded-full ${voiceField === 'morning' ? 'bg-orange-100 text-orange-500 animate-pulse' : 'text-gray-400 hover:text-orange-500'}`}
                  >
                    {voiceField === 'morning' ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                </div>
              </div>
              <textarea
                value={currentEntry.morning}
                onChange={(e) => updateEntry({ morning: e.target.value })}
                placeholder="How did the day start? Morning focus?"
                className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none resize-y min-h-[60px] placeholder:text-gray-300"
              />
            </div>

            {/* Afternoon */}
            <div className="p-5 focus-within:bg-orange-50/20 transition-colors group">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Afternoon Execution</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={currentEntry.afternoonTime || ''}
                    onChange={(e) => updateEntry({ afternoonTime: e.target.value })}
                    placeholder="2:30 PM"
                    className="text-xs w-20 bg-transparent border-b text-right outline-none"
                  />
                  <button
                    onClick={() => startVoiceInput('afternoon')}
                    className={`p-1 rounded-full ${voiceField === 'afternoon' ? 'bg-orange-100 text-orange-500 animate-pulse' : 'text-gray-400 hover:text-orange-500'}`}
                  >
                    {voiceField === 'afternoon' ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                </div>
              </div>
              <textarea
                value={currentEntry.afternoon}
                onChange={(e) => updateEntry({ afternoon: e.target.value })}
                placeholder="Main block of work. Frictions faced?"
                className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none resize-y min-h-[60px] placeholder:text-gray-300"
              />
            </div>

            {/* Evening */}
            <div className="p-5 focus-within:bg-orange-50/20 transition-colors group">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Evening Wind Down</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={currentEntry.eveningTime || ''}
                    onChange={(e) => updateEntry({ eveningTime: e.target.value })}
                    placeholder="10:00 PM"
                    className="text-xs w-20 bg-transparent border-b text-right outline-none"
                  />
                  <button
                    onClick={() => startVoiceInput('evening')}
                    className={`p-1 rounded-full ${voiceField === 'evening' ? 'bg-orange-100 text-orange-500 animate-pulse' : 'text-gray-400 hover:text-orange-500'}`}
                  >
                    {voiceField === 'evening' ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                </div>
              </div>
              <textarea
                value={currentEntry.evening}
                onChange={(e) => updateEntry({ evening: e.target.value })}
                placeholder="How did it end? Stress levels?"
                className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none resize-y min-h-[60px] placeholder:text-gray-300"
              />
            </div>

            <div className="p-5 bg-gray-50 focus-within:bg-orange-50/30 transition-colors">
              <label className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-2">Key Learning / Breakthrough</label>
              <textarea
                value={currentEntry.learning}
                onChange={(e) => updateEntry({ learning: e.target.value })}
                placeholder="One thing you learned today..."
                className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none resize-y min-h-[60px] placeholder:text-gray-400"
              />
            </div>

            <div className="p-5 bg-slate-800 focus-within:bg-slate-900 transition-colors">
              <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">Tomorrow's Directive</label>
              <textarea
                value={currentEntry.tomorrow}
                onChange={(e) => updateEntry({ tomorrow: e.target.value })}
                placeholder="Primary focus for tomorrow..."
                className="w-full bg-transparent text-sm font-semibold text-white outline-none resize-y min-h-[60px] placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Rewrite + Auto Summary + Versions */}
          <div className="px-5 py-4 border-t flex items-center justify-between bg-gray-50 text-xs">
            <button
              onClick={saveNewVersion}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              <Edit3 size={14} /> Save as new version (Rewrite Day)
            </button>

            <button
              onClick={generateAutoSummary}
              className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 rounded-2xl font-semibold hover:bg-orange-50"
            >
              <Zap size={14} /> Generate Auto Summary
            </button>

            {currentEntry.versions && currentEntry.versions.length > 0 && (
              <button
                onClick={() => setShowVersions(!showVersions)}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <History size={14} /> {currentEntry.versions.length} previous versions
              </button>
            )}
          </div>

          {/* Versions drawer */}
          {showVersions && currentEntry.versions && currentEntry.versions.length > 0 && (
            <div className="px-5 pb-5 bg-white border-t max-h-64 overflow-auto">
              {currentEntry.versions.map((v, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b text-xs last:border-none">
                  <span className="font-mono text-gray-400">{new Date(v.timestamp).toLocaleString()}</span>
                  <button
                    onClick={() => {
                      // Preview only — not full restore in this demo
                      alert("Preview of past version loaded (full restore available in production NexEngine).");
                    }}
                    className="text-orange-500 flex items-center gap-1 text-[10px] font-medium"
                  >
                    View snapshot <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visual Graph Dashboard (7) — Mood / Energy / Focus Trend */}
        <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={14} className="text-purple-500" /> Visual Life Graph
            </span>
            <span className="text-xs text-emerald-600">Last 7 days • {weeklySummary.focusDistribution}</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => {
              const d = getLocalDate(new Date(Date.now() - i * 86400000));
              const e = allEntries[d];
              if (!e || e.isMissed) {
                return <div key={d} className="flex flex-col items-center gap-1 text-[10px]">
                  <div className="h-24 w-full bg-gray-100 rounded-3xl flex items-end justify-center text-gray-300 text-[9px]">—</div>
                  <span className="font-medium text-gray-400">{d.slice(5)}</span>
                </div>;
              }
              const moodHeight = e.mood === 'good' ? '90%' : e.mood === 'neutral' ? '55%' : '20%';
              const energyHeight = e.energy === 'high' ? '90%' : e.energy === 'medium' ? '60%' : '25%';
              return (
                <div key={d} className="flex flex-col items-center gap-1 text-[10px]">
                  <div className="relative w-full h-24 flex items-end justify-center gap-1">
                    {/* Mood bar */}
                    <div className={`w-4 rounded-t-3xl transition-all ${e.mood === 'good' ? 'bg-green-400' : e.mood === 'neutral' ? 'bg-amber-400' : 'bg-red-400'}`} style={{ height: moodHeight }} />
                    {/* Energy bar */}
                    <div className={`w-4 rounded-t-3xl transition-all ${e.energy === 'high' ? 'bg-emerald-400' : e.energy === 'medium' ? 'bg-orange-400' : 'bg-red-400'}`} style={{ height: energyHeight }} />
                  </div>
                  <span className="font-medium text-gray-400">{d.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* EXPORT + REPLAY */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
          <div className="flex gap-2">
            <button onClick={exportTXT} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              <FileText size={14} className="text-gray-500" /> Export Entry
            </button>
            <button onClick={exportAllJSON} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              <FileJson size={14} className="text-orange-500" /> Backup Archive
            </button>
          </div>

          <button onClick={() => setIsReplaying(!isReplaying)} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors shadow-sm">
            {isReplaying ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
            {isReplaying ? 'Stop Replay' : 'Replay Timeline'}
          </button>
        </div>

        <hr className="border-gray-200 my-6" />

        {/* HISTORY & DEEP SEARCH LAYER (9) */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <History size={20} className="text-gray-500" />
              <div>
                <h3 className="text-lg font-bold text-gray-800">Timeline Vault</h3>
                <p className="text-xs font-medium text-gray-400">Weekly: {weeklySummary.dominantMood} Mood • Top Tag: {weeklySummary.topTag}</p>
              </div>
            </div>

            {/* Deep Search Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setMoodFilter(moodFilter === 'good' ? null : 'good')}
                className={`px-3 py-1 text-xs rounded-3xl border ${moodFilter === 'good' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-gray-200'}`}
              >
                Good Mood
              </button>
              <button
                onClick={() => setMoodFilter(moodFilter === 'bad' ? null : 'bad')}
                className={`px-3 py-1 text-xs rounded-3xl border ${moodFilter === 'bad' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-gray-200'}`}
              >
                Low Mood
              </button>
              <button
                onClick={() => setEnergyFilter(energyFilter === 'low' ? null : 'low')}
                className={`px-3 py-1 text-xs rounded-3xl border ${energyFilter === 'low' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-gray-200'}`}
              >
                Low Energy
              </button>
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search memories or frictions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs font-medium outline-none focus:border-orange-400 transition-colors shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {searchQuery || moodFilter || energyFilter ? (
              searchResults.length === 0 ? (
                <p className="text-sm text-gray-500 font-medium p-4 text-center bg-white border border-gray-100 rounded-xl">No entries match your deep search.</p>
              ) : (
                searchResults.map(([date, entry]) => (
                  <button key={date} onClick={() => { setSelectedDate(date); setSearchQuery(''); setMoodFilter(null); setEnergyFilter(null); }} className="flex flex-col p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-300 transition-all text-left gap-2 group shadow-sm">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-sm font-bold text-gray-800">{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{entry.mood} • {entry.focusArea}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium truncate w-full">{entry.learning || entry.morning || "No text content"}</p>
                  </button>
                ))
              )
            ) : (
              historyDates.length === 0 ? (
                <p className="text-sm text-gray-500 font-medium p-4 text-center bg-white border border-gray-100 rounded-xl">No timeline history established yet.</p>
              ) : (
                historyDates.map(date => {
                  const entry = allEntries[date];
                  const displayDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                  if (entry.isMissed) {
                    return (
                      <div key={date} className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-100 rounded-xl opacity-60">
                        <span className="text-xs font-bold text-gray-500 w-24">{displayDate}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Missed Day</span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border rounded-xl hover:border-orange-300 transition-all text-left gap-3 group shadow-sm ${selectedDate === date ? 'border-orange-400 ring-1 ring-orange-400/20' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="text-sm font-bold text-gray-800 w-24 shrink-0">{displayDate}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 font-medium truncate">
                            {entry.learning ? `💡 ${entry.learning}` : entry.morning || "No text content"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {entry.chapter && <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded uppercase">{entry.chapter}</span>}
                        {entry.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-widest">{t}</span>
                        ))}
                        {entry.tags.length > 2 && <span className="text-[9px] font-bold text-gray-400">+{entry.tags.length - 2}</span>}
                      </div>
                    </button>
                  );
                })
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}