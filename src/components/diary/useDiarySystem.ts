import { useState, useEffect, useMemo, useRef } from 'react';
import { DiaryEntry, Task, getLocalDate, DEFAULT_ENTRY } from './types';

export function useDiarySystem() {
  const actualToday = getLocalDate(new Date());
  const actualYesterday = getLocalDate(new Date(Date.now() - 86400000));
  const actualTomorrow = getLocalDate(new Date(Date.now() + 86400000));

  const [selectedDate, setSelectedDate] = useState(actualToday);
  const [currentEntry, setCurrentEntry] = useState<DiaryEntry>(DEFAULT_ENTRY);
  const [allEntries, setAllEntries] = useState<Record<string, DiaryEntry>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReplaying, setIsReplaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [moodFilter, setMoodFilter] = useState<'good' | 'neutral' | 'bad' | null>(null);
  const [energyFilter, setEnergyFilter] = useState<'high' | 'medium' | 'low' | null>(null);
  const [newRelatedDate, setNewRelatedDate] = useState('');
  const [voiceField, setVoiceField] = useState<keyof DiaryEntry | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [showWipPopup, setShowWipPopup] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('nexengine_diary_wip_seen');
    if (!hasSeenPopup) {
      setShowWipPopup(true);
      sessionStorage.setItem('nexengine_diary_wip_seen', 'true');
    }
  }, []);

  const startVoiceInput = (field: keyof DiaryEntry) => {
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

  useEffect(() => {
    const storedTasks = localStorage.getItem('nextask_tasks');
    if (storedTasks) setTasks(JSON.parse(storedTasks));

    const entriesMap: Record<string, DiaryEntry> = {};
    let oldestDate = actualToday;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nextask_diary_')) {
        const dateStr = key.replace('nextask_diary_', '');
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

    if (!localStorage.getItem(`nextask_diary_${actualTomorrow}`)) {
      localStorage.setItem(`nextask_diary_${actualTomorrow}`, JSON.stringify(DEFAULT_ENTRY));
    }

    setAllEntries(entriesMap);
    setCurrentEntry(entriesMap[actualToday] || DEFAULT_ENTRY);
    setIsLoaded(true);
  }, [actualToday, actualTomorrow]);

  useEffect(() => {
    if (!isLoaded) return;
    const stored = localStorage.getItem(`nextask_diary_${selectedDate}`);
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

  useEffect(() => {
    if (!isLoaded) return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      const entryToSave = { ...currentEntry };
      if (entryToSave.isMissed && (entryToSave.morning !== "No entry written." || entryToSave.afternoon !== "")) {
        delete entryToSave.isMissed;
      }
      localStorage.setItem(`nextask_diary_${selectedDate}`, JSON.stringify(entryToSave));
      setAllEntries(prev => ({ ...prev, [selectedDate]: entryToSave }));
      setSaveStatus('saved');
    }, 600);
    return () => clearTimeout(timer);
  }, [currentEntry, selectedDate, isLoaded]);

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

  const updateEntry = (updates: Partial<DiaryEntry>) => setCurrentEntry(prev => ({ ...prev, ...updates }));

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
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(getLocalDate(d));
  };

  const { doneCount, totalCount, consistency, missedTasks } = useMemo(() => {
    if (tasks.length === 0) return { doneCount: 0, totalCount: 0, consistency: 0, missedTasks: [] };
    const done = tasks.filter(t => t.history?.[selectedDate]);
    const missed = tasks.filter(t => !t.history?.[selectedDate]);
    return { doneCount: done.length, totalCount: tasks.length, consistency: Math.round((done.length / tasks.length) * 100), missedTasks: missed };
  }, [tasks, selectedDate]);

  const { aiInsight, detectedPatterns, futurePrediction, energyOutputCorrelation } = useMemo(() => {
    if (currentEntry.isMissed) return { aiInsight: "Day skipped. System integrity broken.", detectedPatterns: [], futurePrediction: "No data for prediction.", energyOutputCorrelation: "Insufficient data" };
    const patterns: string[] = [];
    const last7Dates = Array.from({ length: 7 }, (_, i) => getLocalDate(new Date(Date.now() - i * 86400000)));
    const last7Entries = last7Dates.map(d => allEntries[d]).filter(Boolean).filter(e => !e.isMissed);

    if (last7Entries.filter(e => e.energy === 'low').length >= 3 && consistency < 50) patterns.push("Low energy strongly correlates with reduced output");
    if (last7Entries.filter(e => e.tags.includes('Distraction Day')).length >= 3) patterns.push("Distraction pattern detected (3+ times this week)");

    let missedAfterBad = 0;
    for (let i = 1; i < last7Dates.length; i++) {
      const prev = allEntries[last7Dates[i - 1]];
      const curr = allEntries[last7Dates[i]];
      if (prev && curr && prev.mood === 'bad' && curr.isMissed) missedAfterBad++;
    }
    if (missedAfterBad > 0) patterns.push(`${missedAfterBad} missed day(s) followed bad mood`);

    const highEnergyDone = last7Entries.filter(e => e.energy === 'high').length > 0 ? Math.round((last7Entries.filter(e => e.energy === 'high' && consistency > 70).length / last7Entries.filter(e => e.energy === 'high').length) * 100) : 0;
    const correlation = `High energy days = ${highEnergyDone}% consistency • Low energy days = ${consistency < 40 ? '30%' : 'average'} consistency`;

    let insight = "System stable. Awaiting further data.";
    if (currentEntry.energy === 'low' && consistency > 60) insight = "Low energy but high execution. Elite resilience.";
    else if (currentEntry.tags.includes('Distraction Day') && consistency < 40) insight = "Distraction pattern active. Environment reset required.";
    else if (currentEntry.mood === 'bad' && consistency < 30) insight = "Emotional friction blocking output. Re-align required.";
    else if (consistency >= 80) insight = "Execution parameters optimal. Maintain momentum.";

    const last3Energy = last7Entries.slice(0, 3).filter(e => e.energy === 'low').length;
    const prediction = last3Energy >= 2 ? "Tomorrow likely lower productivity (based on last 3 days). Prepare rest protocol." : "Momentum stable. High probability of strong output.";

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
        e.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
        if (e.focusArea && e.focusArea !== 'None') { focusCounts[e.focusArea]++; totalFocusDays++; }
      }
    });

    const dominantMood = good > bad && good > neutral ? 'Positive' : bad > good && bad > neutral ? 'Negative' : 'Neutral';
    const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    const focusDistribution = Object.entries(focusCounts).filter(([_, count]) => count > 0).map(([area, count]) => `${area}: ${Math.round((count / (totalFocusDays || 1)) * 100)}%`).join(' • ') || 'No focus data';
    return { dominantMood, topTag, focusDistribution };
  }, [allEntries, actualToday]);

  const { currentStreak, badges } = useMemo(() => {
    let streak = 0; let date = new Date(actualToday);
    const earnedBadges: string[] = [];
    while (true) {
      const entry = allEntries[getLocalDate(date)];
      if (!entry || entry.isMissed || entry.mood === 'bad') break;
      streak++; date.setDate(date.getDate() - 1);
      if (streak > 30) break;
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

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && !moodFilter && !energyFilter) return [];
    const query = searchQuery.toLowerCase();
    return Object.entries(allEntries).filter(([_, entry]) => {
      if (entry.isMissed) return false;
      const matchesText = !searchQuery.trim() || entry.morning.toLowerCase().includes(query) || entry.afternoon.toLowerCase().includes(query) || entry.evening.toLowerCase().includes(query) || entry.learning.toLowerCase().includes(query) || entry.tags.some(t => t.toLowerCase().includes(query)) || entry.frictions?.some(f => f.toLowerCase().includes(query));
      const matchesMood = !moodFilter || entry.mood === moodFilter;
      const matchesEnergy = !energyFilter || entry.energy === energyFilter;
      return matchesText && matchesMood && matchesEnergy;
    }).sort((a, b) => b[0].localeCompare(a[0]));
  }, [searchQuery, allEntries, moodFilter, energyFilter]);

  const historyDates = Object.keys(allEntries).filter(d => d <= actualToday).sort().reverse().slice(0, 14);

  const exportTXT = () => {
    const content = `DATE: ${selectedDate}\nMOOD: ${currentEntry.mood.toUpperCase()}\nENERGY: ${currentEntry.energy.toUpperCase()}\nTAGS: ${currentEntry.tags.join(', ')}\nFOCUS: ${currentEntry.focusArea}\nGOAL ALIGNMENT: ${currentEntry.goalAlignment}%\nFRICTIONS: ${currentEntry.frictions?.join(', ') || 'none'}\nIDENTITY: ${currentEntry.identity || '—'}\nCHAPTER: ${currentEntry.chapter || '—'}\n\n--- MORNING ---\n${currentEntry.morning}\n\n--- AFTERNOON ---\n${currentEntry.afternoon}\n\n--- EVENING ---\n${currentEntry.evening}\n\n--- LEARNING ---\n${currentEntry.learning}\n\n--- TOMORROW ---\n${currentEntry.tomorrow}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `NexEngine_Diary_${selectedDate}.txt`; link.click();
  };

  const exportAllJSON = () => {
    const blob = new Blob([JSON.stringify(allEntries, null, 2)], { type: 'application/json' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `NexEngine_FullArchive_${actualToday}.json`; link.click();
  };

  return {
    actualToday, actualYesterday, selectedDate, setSelectedDate, currentEntry, allEntries, saveStatus,
    searchQuery, setSearchQuery, isReplaying, setIsReplaying, isLoaded, moodFilter, setMoodFilter,
    energyFilter, setEnergyFilter, newRelatedDate, setNewRelatedDate, voiceField, showVersions, setShowVersions,
    passwordAttempt, setPasswordAttempt, showWipPopup, setShowWipPopup, startVoiceInput, updateEntry,
    handleTagToggle, handleFrictionToggle, addRelatedDate, removeRelatedDate, saveNewVersion, changeDate,
    doneCount, totalCount, consistency, missedTasks, aiInsight, detectedPatterns, futurePrediction,
    energyOutputCorrelation, activeAlerts, weeklySummary, currentStreak, badges, generateAutoSummary,
    searchResults, historyDates, exportTXT, exportAllJSON
  };
}