import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DiaryEntry, Task, getLocalDate, DEFAULT_ENTRY } from './types';

const STORAGE_PREFIX = 'nextask_diary_';

// --- SAFE DATE PARSER ---
// Fixes the "Invalid time value" crash by preventing JS from shifting timezones
const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function useDiarySystem() {
  const actualToday = getLocalDate(new Date());
  const actualYesterday = getLocalDate(new Date(Date.now() - 86400000));
  const actualTomorrow = getLocalDate(new Date(Date.now() + 86400000));

  // --- Core State ---
  const [selectedDate, setSelectedDate] = useState(actualToday);
  const [currentEntry, setCurrentEntry] = useState<DiaryEntry>(DEFAULT_ENTRY);
  const [allEntries, setAllEntries] = useState<Record<string, DiaryEntry>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isReplaying, setIsReplaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // --- UI & Feature State (UPGRADED FILTERS) ---
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<'good' | 'neutral' | 'bad' | null>(null);
  const [energyFilter, setEnergyFilter] = useState<'high' | 'medium' | 'low' | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [rangeFilter, setRangeFilter] = useState<'7d' | '30d' | 'all'>('7d');
  
  const [newRelatedDate, setNewRelatedDate] = useState('');
  const [voiceField, setVoiceField] = useState<keyof DiaryEntry | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [showWipPopup, setShowWipPopup] = useState(false);
  const recognitionRef = useRef<any>(null);

  // --- Live Sync State ---
  const [writingActivity, setWritingActivity] = useState({
    lastEdit: Date.now(),
    isSyncing: false,
    totalEdits: 0
  });

  // --- Popup Init ---
  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('nexengine_diary_wip_seen');
    if (!hasSeenPopup) {
      setShowWipPopup(true);
      sessionStorage.setItem('nexengine_diary_wip_seen', 'true');
    }
  }, []);

  // --- Voice Input ---
  const startVoiceInput = (field: keyof DiaryEntry) => {
    if (currentEntry.isLocked) return; // Prevent voice if locked
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice input not supported in this browser.");
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

  // --- Initial Load & Timeline Integrity ---
  useEffect(() => {
    const storedTasks = localStorage.getItem('nextask_tasks');
    if (storedTasks) setTasks(JSON.parse(storedTasks));

    const entriesMap: Record<string, DiaryEntry> = {};
    let oldestDate = actualToday;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const dateStr = key.replace(STORAGE_PREFIX, '');
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || '{}');
          entriesMap[dateStr] = {
            ...DEFAULT_ENTRY, ...parsed,
            tags: parsed.tags || [], frictions: parsed.frictions || [],
            relatedDates: parsed.relatedDates || [], versions: parsed.versions || []
          };
          if (dateStr < oldestDate) oldestDate = dateStr;
        } catch (e) { console.error("Parse error for", key); }
      }
    }

    // Safely calculate the while loop dates
    let currDate = parseLocalDate(oldestDate);
    const todayObj = parseLocalDate(actualToday);
    
    while (currDate <= todayObj) {
      const dStr = getLocalDate(currDate);
      if (!entriesMap[dStr]) {
        const missedEntry: DiaryEntry = { ...DEFAULT_ENTRY, isMissed: true, morning: "No entry written." };
        entriesMap[dStr] = missedEntry;
        localStorage.setItem(`${STORAGE_PREFIX}${dStr}`, JSON.stringify(missedEntry));
      }
      currDate.setDate(currDate.getDate() + 1);
    }

    if (!localStorage.getItem(`${STORAGE_PREFIX}${actualTomorrow}`)) {
      localStorage.setItem(`${STORAGE_PREFIX}${actualTomorrow}`, JSON.stringify(DEFAULT_ENTRY));
    }

    setAllEntries(entriesMap);
    setCurrentEntry(entriesMap[actualToday] || DEFAULT_ENTRY);
    setIsLoaded(true);
  }, [actualToday, actualTomorrow]);

  // --- Switch Date Effect ---
  useEffect(() => {
    if (!isLoaded) return;
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${selectedDate}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setCurrentEntry({
        ...DEFAULT_ENTRY, ...parsed,
        tags: parsed.tags || [], frictions: parsed.frictions || [],
        relatedDates: parsed.relatedDates || [], versions: parsed.versions || []
      });
    } else {
      setCurrentEntry(DEFAULT_ENTRY);
    }
  }, [selectedDate, isLoaded]);

  // --- Live Task Stats ---
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

  const getTomorrowAdaptation = useCallback((todaySnapshot: any) => {
    if (todaySnapshot.energy === 'low') return "Rest protocol: Prioritize recovery and low-effort tasks tomorrow.";
    if (todaySnapshot.consistency < 40) return "Simplified focus: Complete just 1 high-value task tomorrow.";
    if (todaySnapshot.mood === 'bad') return "Environment reset: Start tomorrow with a clean workspace.";
    return "Maintain current momentum.";
  }, []);

  // --- Auto-Save & Tomorrow Bridge Engine ---
  useEffect(() => {
    if (!isLoaded) return;
    setSaveStatus('saving');
    setWritingActivity(prev => ({ ...prev, isSyncing: true }));

    const timer = setTimeout(() => {
      // 1. Generate Truth Snapshot
      const insightSnapshot = {
        consistency,
        doneCount,
        totalCount,
        mood: currentEntry.mood,
        energy: currentEntry.energy,
        timestamp: new Date().toISOString()
      };

      const entryToSave = { ...currentEntry, insightSnapshot };
      
      if (entryToSave.isMissed && (entryToSave.morning !== "No entry written." || entryToSave.afternoon !== "")) {
        delete entryToSave.isMissed;
      }
      
      localStorage.setItem(`${STORAGE_PREFIX}${selectedDate}`, JSON.stringify(entryToSave));
      setAllEntries(prev => ({ ...prev, [selectedDate]: entryToSave }));

      // 2. Tomorrow Bridge Adapter
      if (selectedDate === actualToday) {
        const tomorrowKey = `${STORAGE_PREFIX}${actualTomorrow}`;
        const existingTomorrow = JSON.parse(localStorage.getItem(tomorrowKey) || 'null');
        
        if (!existingTomorrow || existingTomorrow.morning === "") {
          localStorage.setItem(tomorrowKey, JSON.stringify({
            ...DEFAULT_ENTRY,
            suggestedAction: getTomorrowAdaptation(insightSnapshot),
            focusArea: currentEntry.focusArea,
            carryOver: { prevEnergy: currentEntry.energy, prevConsistency: consistency }
          }));
        }
      }

      setSaveStatus('saved');
      setWritingActivity(prev => ({ ...prev, isSyncing: false, lastEdit: Date.now() }));
    }, 600);
    return () => clearTimeout(timer);
  }, [currentEntry, selectedDate, isLoaded, consistency, doneCount, totalCount, actualToday, actualTomorrow, getTomorrowAdaptation]);

  // --- Replay Engine ---
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

  // --- ACTIONS ---
  const updateEntry = (updates: Partial<DiaryEntry>) => {
    if (currentEntry.isLocked) return; // Hard guard against edits if locked
    setWritingActivity(prev => ({ ...prev, totalEdits: prev.totalEdits + 1 }));
    setCurrentEntry(prev => ({ ...prev, ...updates }));
  };

  // 🔥 LOCK DAY MECHANISM
  const lockCurrentDay = () => {
    const updated = { ...currentEntry, isLocked: true };
    localStorage.setItem(`${STORAGE_PREFIX}${selectedDate}`, JSON.stringify(updated));
    setCurrentEntry(updated);
    setAllEntries(prev => ({ ...prev, [selectedDate]: updated }));
  };

  const handleTagToggle = (tag: string) => {
    const newTags = currentEntry.tags.includes(tag) ? currentEntry.tags.filter(t => t !== tag) : [...currentEntry.tags, tag];
    updateEntry({ tags: newTags });
  };

  const handleFrictionToggle = (friction: string) => {
    const newFrictions = currentEntry.frictions?.includes(friction) ? currentEntry.frictions.filter(f => f !== friction) : [...(currentEntry.frictions || []), friction];
    updateEntry({ frictions: newFrictions });
  };

  const addRelatedDate = () => {
    if (!newRelatedDate || !allEntries[newRelatedDate]) return;
    const currentRelated = currentEntry.relatedDates || [];
    if (!currentRelated.includes(newRelatedDate)) updateEntry({ relatedDates: [...currentRelated, newRelatedDate] });
    setNewRelatedDate('');
  };

  const removeRelatedDate = (date: string) => {
    updateEntry({ relatedDates: (currentEntry.relatedDates || []).filter(d => d !== date) });
  };

  const saveNewVersion = () => {
    const timestamp = new Date().toISOString();
    const snapshot = { ...currentEntry };
    delete snapshot.versions;
    updateEntry({ versions: [...(currentEntry.versions || []), { timestamp, snapshot }] });
  };

  const changeDate = (days: number) => {
    if (!selectedDate) return;
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + days);
    const newD = getLocalDate(d);
    if (newD <= actualToday) setSelectedDate(newD);
  };

  // --- DEEP FILTERING ENGINE (UPGRADED) ---
  const filteredHistory = useMemo(() => {
    let dates = Object.keys(allEntries).filter(d => d <= actualToday).sort().reverse();
    
    // 1. Range Filter
    if (rangeFilter === '7d') dates = dates.slice(0, 7);
    if (rangeFilter === '30d') dates = dates.slice(0, 30);

    return dates.filter(date => {
      const entry = allEntries[date];
      
      // If missed day and we are actively filtering, hide the missed day
      if (entry.isMissed && (searchQuery || moodFilter || energyFilter || tagFilter)) return false;

      // 2. Strict Match Filters
      if (moodFilter && entry.mood !== moodFilter) return false;
      if (energyFilter && entry.energy !== energyFilter) return false;
      if (tagFilter && !(entry.tags || []).includes(tagFilter)) return false;

      // 3. Deep Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const content = `
          ${entry.morning || ''} 
          ${entry.afternoon || ''} 
          ${entry.evening || ''} 
          ${entry.learning || ''} 
          ${entry.tomorrow || ''} 
          ${(entry.tags || []).join(' ')} 
          ${(entry.frictions || []).join(' ')} 
          ${entry.focusArea || ''} 
          ${entry.chapter || ''}
        `.toLowerCase();
        
        if (!content.includes(q)) return false;
      }

      return true;
    });
  }, [allEntries, actualToday, searchQuery, moodFilter, energyFilter, tagFilter, rangeFilter]);

  // Fallback for UI components that still depend on historyDates and searchResults natively
  const historyDates = Object.keys(allEntries).filter(d => d <= actualToday).sort().reverse().slice(0, 14);
  
  // 🚀 FIX: Explicitly type the array to prevent TS implicit any error
  const searchResults: any[] = []; 

  // --- Complex Memos ---
  const { aiInsight, detectedPatterns, futurePrediction, energyOutputCorrelation } = useMemo(() => {
    if (currentEntry.isMissed) return { aiInsight: "Day skipped. System integrity broken.", detectedPatterns: [], futurePrediction: "No data for prediction.", energyOutputCorrelation: "Insufficient data" };
    
    const patterns: string[] = [];
    const last7Dates = Array.from({ length: 7 }, (_, i) => getLocalDate(new Date(Date.now() - i * 86400000)));
    const last7Entries = last7Dates.map(d => allEntries[d]).filter(Boolean).filter(e => !e.isMissed);

    if (last7Entries.filter(e => e.energy === 'low').length >= 3 && consistency < 50) patterns.push("Low energy strongly correlates with reduced output");
    if (last7Entries.filter(e => (e.tags || []).includes('Distraction Day')).length >= 3) patterns.push("Distraction pattern detected (3+ times this week)");

    let missedAfterBad = 0;
    for (let i = 1; i < last7Dates.length; i++) {
      const prev = allEntries[last7Dates[i - 1]];
      const curr = allEntries[last7Dates[i]];
      if (prev && curr && prev.mood === 'bad' && curr.isMissed) missedAfterBad++;
    }
    if (missedAfterBad > 0) patterns.push(`${missedAfterBad} missed day(s) followed bad mood`);

    const highEnergyDays = last7Entries.filter(e => e.energy === 'high');
    const highEnergyDone = highEnergyDays.length > 0 ? Math.round((highEnergyDays.filter(e => consistency > 70).length / highEnergyDays.length) * 100) : 0;
    const correlation = `High energy = ${highEnergyDone}% consistency • Low energy = ${consistency < 40 ? '30%' : 'average'} consistency`;

    let insight = "System stable. Awaiting further data.";
    if (currentEntry.energy === 'low' && consistency > 60) insight = "Low energy but high execution. Elite resilience.";
    else if ((currentEntry.tags || []).includes('Distraction Day') && consistency < 40) insight = "Distraction pattern active. Environment reset required.";
    else if (currentEntry.mood === 'bad' && consistency < 30) insight = "Emotional friction blocking output. Re-align required.";
    else if (consistency >= 80) insight = "Execution parameters optimal. Maintain momentum.";

    const last3Energy = last7Entries.slice(0, 3).filter(e => e.energy === 'low').length;
    const prediction = last3Energy >= 2 ? "Tomorrow likely lower productivity. Prepare rest protocol." : "Momentum stable. High probability of strong output.";

    return { aiInsight: insight, detectedPatterns: patterns, futurePrediction: prediction, energyOutputCorrelation: correlation };
  }, [currentEntry, consistency, allEntries]);

  const activeAlerts = useMemo(() => {
    const alerts: string[] = [];
    if (Object.values(allEntries).filter(e => !e.isMissed && e.mood === 'bad').length >= 3) alerts.push("3+ bad mood days detected → consider rest day");
    if (Object.values(allEntries).filter(e => e.isMissed).length >= 2) alerts.push("Multiple missed days → system instability risk");
    if (currentEntry.frictions && currentEntry.frictions.length >= 4) alerts.push("High friction load today → address blockers");
    return alerts;
  }, [allEntries, currentEntry]);

  const weeklySummary = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => getLocalDate(new Date(Date.now() - i * 86400000)));
    let good = 0, neutral = 0, bad = 0, totalFocusDays = 0;
    const tagCounts: Record<string, number> = {};
    const focusCounts: Record<string, number> = { Work: 0, Health: 0, Learning: 0, Social: 0, None: 0 };

    last7.forEach(d => {
      const e = allEntries[d];
      if (e && !e.isMissed) {
        if (e.mood === 'good') good++; if (e.mood === 'neutral') neutral++; if (e.mood === 'bad') bad++;
        (e.tags || []).forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
        if (e.focusArea && e.focusArea !== 'None') { 
          focusCounts[e.focusArea] = (focusCounts[e.focusArea] || 0) + 1; 
          totalFocusDays++; 
        }
      }
    });

    const dominantMood = good > bad && good > neutral ? 'Positive' : bad > good && bad > neutral ? 'Negative' : 'Neutral';
    const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    const focusDistribution = Object.entries(focusCounts).filter(([_, count]) => count > 0).map(([area, count]) => `${area}: ${Math.round((count / (totalFocusDays || 1)) * 100)}%`).join(' • ') || 'No focus data';
    return { dominantMood, topTag, focusDistribution };
  }, [allEntries, actualToday]);

  const { currentStreak, badges } = useMemo(() => {
    let streak = 0; 
    let dateObj = parseLocalDate(actualToday);
    const earnedBadges: string[] = [];
    
    while (true) {
      const entry = allEntries[getLocalDate(dateObj)];
      if (!entry || entry.isMissed || entry.mood === 'bad') break;
      streak++; 
      dateObj.setDate(dateObj.getDate() - 1);
      if (streak > 30) break; // Circuit breaker
    }
    if (streak >= 7) earnedBadges.push("🔥 Week Warrior");
    if (consistency >= 80) earnedBadges.push("⚡ Execution Master");
    if (Object.values(allEntries).filter(e => !e.isMissed && e.goalAlignment && e.goalAlignment >= 80).length >= 5) earnedBadges.push("🎯 Goal Aligned");
    return { currentStreak: streak, badges: earnedBadges };
  }, [allEntries, actualToday, consistency]);

  const generateAutoSummary = () => {
    const summary = `Today was a ${currentEntry.mood} mood, ${currentEntry.energy} energy day.\nFocus area: ${currentEntry.focusArea}. Goal alignment: ${currentEntry.goalAlignment}%.\nKey friction: ${currentEntry.frictions?.[0] || 'none'}.\nIdentity: ${currentEntry.identity || 'not reflected'}.\n${currentEntry.learning ? `Breakthrough: ${currentEntry.learning}` : ''}`;
    alert(summary);
    return summary;
  };

  const exportTXT = () => {
    const content = `DATE: ${selectedDate}\nMOOD: ${currentEntry.mood.toUpperCase()}\nENERGY: ${currentEntry.energy.toUpperCase()}\nTAGS: ${(currentEntry.tags || []).join(', ')}\nFOCUS: ${currentEntry.focusArea}\nGOAL ALIGNMENT: ${currentEntry.goalAlignment}%\nFRICTIONS: ${currentEntry.frictions?.join(', ') || 'none'}\nIDENTITY: ${currentEntry.identity || '—'}\nCHAPTER: ${currentEntry.chapter || '—'}\n\n--- MORNING ---\n${currentEntry.morning}\n\n--- AFTERNOON ---\n${currentEntry.afternoon}\n\n--- EVENING ---\n${currentEntry.evening}\n\n--- LEARNING ---\n${currentEntry.learning}\n\n--- TOMORROW ---\n${currentEntry.tomorrow}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `NexEngine_Diary_${selectedDate}.txt`; link.click();
  };

  const exportAllJSON = () => {
    const blob = new Blob([JSON.stringify(allEntries, null, 2)], { type: 'application/json' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `NexEngine_FullArchive_${actualToday}.json`; link.click();
  };

  return {
    actualToday, actualYesterday, selectedDate, setSelectedDate, currentEntry, allEntries, saveStatus,
    searchQuery, setSearchQuery, isReplaying, setIsReplaying, isLoaded, 
    moodFilter, setMoodFilter, energyFilter, setEnergyFilter, tagFilter, setTagFilter, rangeFilter, setRangeFilter,
    newRelatedDate, setNewRelatedDate, voiceField, showVersions, setShowVersions,
    passwordAttempt, setPasswordAttempt, showWipPopup, setShowWipPopup, 
    startVoiceInput, updateEntry, lockCurrentDay, handleTagToggle, handleFrictionToggle, 
    addRelatedDate, removeRelatedDate, saveNewVersion, changeDate,
    doneCount, totalCount, consistency, missedTasks, aiInsight, detectedPatterns, futurePrediction,
    energyOutputCorrelation, activeAlerts, weeklySummary, currentStreak, badges, generateAutoSummary,
    searchResults, historyDates, filteredHistory, exportTXT, exportAllJSON, writingActivity,
    recommendedAction: (currentEntry as any).suggestedAction || "Continue current focus area."
  };
}