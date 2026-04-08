"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DiaryEntry, Task, getLocalDate, DEFAULT_ENTRY } from './types';
import { useNotificationSystem } from '@/notifications/useNotificationSystem'; 
import { handleDiary } from '@/notifications/nexNotificationBrain'; 
import { getSupabaseClient } from "@/lib/supabase";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

const STORAGE_PREFIX = 'nextask_diary_';

// --- STRICT DB TYPE ---
type DBDiaryEntry = {
  id?: string;
  user_id?: string;
  entry_date: string;
  morning: string;
  afternoon: string;
  evening: string;
  learning: string;
  tomorrow: string;
  mood: string;
  energy: string;
  tags: string[];
  is_missed: boolean;
  related_dates: string[];
  focus_area: string;
  goal_alignment: number;
  frictions: string[];
  identity: string;
  chapter: string;
  is_locked: boolean;
  versions: any;
  morning_time: string;
  afternoon_time: string;
  evening_time: string;
  updated_at?: string;
};

const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const acquireLock = (lockKey: string, cooldownMs: number): boolean => {
  if (typeof window === "undefined") return false;
  const last = Number(localStorage.getItem(lockKey) || 0);
  const now = Date.now();
  if (now - last > cooldownMs) {
    localStorage.setItem(lockKey, now.toString());
    return true;
  }
  return false;
};

export function useDiarySystem() {
  const supabase = getSupabaseClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { addNotification } = useNotificationSystem(currentUser?.id);  
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
  
  // --- UI & Feature State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(''); 
  
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
  const isInitializing = useRef(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null); 
  
  const userRef = useRef<any>(null);
  const isEditingRef = useRef(false);

  // Safe Notification Wrapper
  const safeNotify = useCallback((key: string, cooldownMs: number, fn: () => void) => {
    if (acquireLock(key, cooldownMs)) fn();
  }, []);

  // --- AUTH LISTENER ---
  useEffect(() => {
    if (!supabase) return;

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const user = session?.user ?? null;
        userRef.current = user;
        setCurrentUser(user);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  // --- DB SYNC HELPERS ---
  const syncEntryToDB = async (dateStr: string, entry: DiaryEntry) => {
    try {
      const user = userRef.current; 
      if (!user || !supabase) return;

      const payload: DBDiaryEntry = {
        user_id: user.id,
        entry_date: dateStr,
        morning: entry.morning || '',
        afternoon: entry.afternoon || '',
        evening: entry.evening || '',
        learning: entry.learning || '',
        tomorrow: entry.tomorrow || '',
        mood: entry.mood || 'neutral',
        energy: entry.energy || 'medium',
        tags: entry.tags || [],
        is_missed: entry.isMissed || false,
        // ✅ FIX: Changed entry.related_dates to entry.relatedDates
        related_dates: entry.relatedDates || [],
        focus_area: entry.focusArea || 'None',
        goal_alignment: entry.goalAlignment || 50,
        frictions: entry.frictions || [],
        identity: entry.identity || '',
        chapter: entry.chapter || '',
        is_locked: entry.isLocked || false,
        versions: entry.versions || [],
        morning_time: entry.morningTime || '',
        afternoon_time: entry.afternoonTime || '',
        evening_time: entry.eveningTime || '',
        updated_at: new Date().toISOString()
      };

      await supabase.from('diary_entries').upsert(payload, { onConflict: 'user_id, entry_date' });
    } catch (err) { console.error("Diary DB Sync Exception:", err); }
  };

  const [writingActivity, setWritingActivity] = useState({
    lastEdit: Date.now(),
    isSyncing: false,
    totalEdits: 0
  });

  // --- Popup Init & Voice Cleanup ---
  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('nexengine_diary_wip_seen');
    if (!hasSeenPopup) {
      setShowWipPopup(true);
      sessionStorage.setItem('nexengine_diary_wip_seen', 'true');
    }
    
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Debounce Search Query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const startVoiceInput = (field: keyof DiaryEntry) => {
    if (currentEntry.isLocked) return; 
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

  // --- INITIAL LOAD FROM SUPABASE ---
  useEffect(() => {
    if (isInitializing.current || typeof window === "undefined") return;
    isInitializing.current = true;

    const initDiary = async () => {
      const storedTasks = localStorage.getItem('nextask_tasks');
      if (storedTasks) setTasks(JSON.parse(storedTasks));

      const entriesMap: Record<string, DiaryEntry> = {};
      let oldestDate = actualToday;

      try {
        const user = userRef.current; 
        if (user && supabase) {
          const { data, error } = await supabase
            .from('diary_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('entry_date', { ascending: false })
            .limit(30);

          if (data && !error) {
            (data as DBDiaryEntry[]).forEach(row => {
              entriesMap[row.entry_date] = {
                ...DEFAULT_ENTRY,
                morning: row.morning, afternoon: row.afternoon, evening: row.evening,
                learning: row.learning, tomorrow: row.tomorrow,
                mood: row.mood as any, energy: row.energy as any, tags: row.tags,
                isMissed: row.is_missed, relatedDates: row.related_dates,
                focusArea: row.focus_area as any, goalAlignment: row.goal_alignment,
                frictions: row.frictions, identity: row.identity, chapter: row.chapter,
                isLocked: row.is_locked, versions: row.versions,
                morningTime: row.morning_time, afternoonTime: row.afternoon_time, eveningTime: row.evening_time
              };
              if (row.entry_date < oldestDate) oldestDate = row.entry_date;
              localStorage.setItem(`${STORAGE_PREFIX}${row.entry_date}`, JSON.stringify(entriesMap[row.entry_date]));
            });
          }
        }
      } catch (err) { console.error("Failed to load DB", err); }

      let currDate = parseLocalDate(oldestDate);
      const todayObj = parseLocalDate(actualToday);
      let newMissedCount = 0;
      
      while (currDate <= todayObj) {
        const dStr = getLocalDate(currDate);
        if (!entriesMap[dStr]) {
          const missedEntry: DiaryEntry = { ...DEFAULT_ENTRY, isMissed: true, morning: "No entry written." };
          entriesMap[dStr] = missedEntry;
          localStorage.setItem(`${STORAGE_PREFIX}${dStr}`, JSON.stringify(missedEntry));
          syncEntryToDB(dStr, missedEntry); 
          
          newMissedCount++;
          handleDiary(addNotification, "missed", dStr);
        }
        currDate.setDate(currDate.getDate() + 1);
      }

      if (newMissedCount >= 2) {
        safeNotify('diary_consecutive_missed', 24 * 60 * 60 * 1000, () => {
          setTimeout(() => addNotification('diary', 'Consistency Broken 🚨', 'Multiple missed days detected.', 'high', '/diary'), 4000);
        });
      }

      if (!entriesMap[actualTomorrow]) {
        entriesMap[actualTomorrow] = DEFAULT_ENTRY;
      }

      setAllEntries(entriesMap);
      setCurrentEntry(entriesMap[actualToday] || DEFAULT_ENTRY);
      setIsLoaded(true);
    };

    initDiary();

    return () => { isInitializing.current = false; };
  }, [currentUser]); 

  // --- Switch Date Effect ---
  useEffect(() => {
    if (!isLoaded) return;
    const stored = allEntries[selectedDate] || JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${selectedDate}`) || 'null');
    if (stored) {
      setCurrentEntry({
        ...DEFAULT_ENTRY, ...stored,
        tags: stored.tags || [], frictions: stored.frictions || [],
        relatedDates: stored.relatedDates || [], versions: stored.versions || []
      });
    } else {
      setCurrentEntry(DEFAULT_ENTRY);
    }
  }, [selectedDate, isLoaded, allEntries]);

  // --- Live Task Stats ---
  const { doneCount, totalCount, consistency, missedTasks } = useMemo(() => {
    if (tasks.length === 0) return { doneCount: 0, totalCount: 0, consistency: 0, missedTasks: [] };
    const done = tasks.filter(t => t.history?.[selectedDate]);
    const missed = tasks.filter(t => !t.history?.[selectedDate]);
    return { 
      doneCount: done.length, totalCount: tasks.length, 
      consistency: Math.round((done.length / tasks.length) * 100), missedTasks: missed 
    };
  }, [tasks, selectedDate]);

  const getTomorrowAdaptation = useCallback((todaySnapshot: any) => {
    if (todaySnapshot.energy === 'low') return "Rest protocol: Prioritize recovery and low-effort tasks tomorrow.";
    if (todaySnapshot.consistency < 40) return "Simplified focus: Complete just 1 high-value task tomorrow.";
    if (todaySnapshot.mood === 'bad') return "Environment reset: Start tomorrow with a clean workspace.";
    return "Maintain current momentum.";
  }, []);

  // --- DEBOUNCED DB & LOCAL AUTO-SAVE ---
  useEffect(() => {
    if (!isLoaded) return;
    setSaveStatus('saving');
    setWritingActivity(prev => ({ ...prev, isSyncing: true }));

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      const insightSnapshot = {
        consistency, doneCount, totalCount, mood: currentEntry.mood, energy: currentEntry.energy, timestamp: new Date().toISOString()
      };

      const entryToSave = { ...currentEntry, insightSnapshot };
      if (entryToSave.isMissed && (entryToSave.morning !== "No entry written." || entryToSave.afternoon !== "")) {
        delete entryToSave.isMissed;
      }
      
      localStorage.setItem(`${STORAGE_PREFIX}${selectedDate}`, JSON.stringify(entryToSave));
      setAllEntries(prev => ({ ...prev, [selectedDate]: entryToSave }));

      syncEntryToDB(selectedDate, entryToSave).then(() => {
        isEditingRef.current = false; 
      });

      if (selectedDate === actualToday) {
        const tomorrowKey = `${STORAGE_PREFIX}${actualTomorrow}`;
        const existingTomorrow = allEntries[actualTomorrow] || JSON.parse(localStorage.getItem(tomorrowKey) || 'null');
        
        if (!existingTomorrow || existingTomorrow.morning === "") {
          const tmrwEntry = {
            ...DEFAULT_ENTRY, suggestedAction: getTomorrowAdaptation(insightSnapshot),
            focusArea: currentEntry.focusArea, carryOver: { prevEnergy: currentEntry.energy, prevConsistency: consistency }
          };
          localStorage.setItem(tomorrowKey, JSON.stringify(tmrwEntry));
          syncEntryToDB(actualTomorrow, tmrwEntry);
          setAllEntries(prev => ({ ...prev, [actualTomorrow]: tmrwEntry }));
          
          safeNotify(`diary_tomorrow_plan_${actualToday}`, 12 * 60 * 60 * 1000, () => {
            addNotification('diary', 'Tomorrow Plan Ready 📅', 'Suggested action prepared for tomorrow.', 'low', '/diary');
          });
        }
      }

      setSaveStatus('saved');
      setWritingActivity(prev => ({ ...prev, isSyncing: false, lastEdit: Date.now() }));

      safeNotify(`diary_saved_${selectedDate}`, 60000, () => {
        addNotification('diary', 'Entry Saved', 'Your reflection is secured.', 'low', '/diary');
      });

      if (writingActivity.totalEdits >= 30) {
        safeNotify(`diary_reflection_complete_${selectedDate}`, 12 * 60 * 60 * 1000, () => {
          addNotification('diary', 'Reflection Complete 📖', 'You captured your thoughts well.', 'low', '/diary');
        });
      }

    }, 2000); 

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [currentEntry]); 

  // --- ACTIONS ---
  const updateEntry = (updates: Partial<DiaryEntry>) => {
    if (currentEntry.isLocked) return; 
    
    isEditingRef.current = true; 

    setWritingActivity(prev => {
      const newCount = prev.totalEdits + 1;
      
      if (prev.totalEdits === 0) {
        const yesterdayEntry = allEntries[actualYesterday];
        const isRecovery = yesterdayEntry && yesterdayEntry.isMissed && selectedDate === actualToday;

        if (isRecovery) {
          safeNotify(`diary_recovery_${actualToday}`, 24 * 60 * 60 * 1000, () => {
            addNotification('diary', 'Back on Track 📈', 'Consistency resumed.', 'medium', '/diary');
          });
        } else {
          safeNotify(`diary_started_${selectedDate}`, 12 * 60 * 60 * 1000, () => {
            addNotification('diary', 'Entry Started ✍️', 'Capture your day.', 'low', '/diary');
          });
        }
      }

      if (newCount === 30) {
        safeNotify(`diary_deep_focus_${selectedDate}`, 12 * 60 * 60 * 1000, () => {
          addNotification('diary', 'Deep Reflection Mode 🧠', 'You are thinking deeply.', 'low', '/diary');
        });
      }
      return { ...prev, totalEdits: newCount };
    });
    setCurrentEntry(prev => ({ ...prev, ...updates }));
  };

  const lockCurrentDay = () => {
    const updated = { ...currentEntry, isLocked: true };
    setCurrentEntry(updated);
    setAllEntries(prev => ({ ...prev, [selectedDate]: updated }));
    syncEntryToDB(selectedDate, updated);
    addNotification('diary', 'Day Locked 🔒', 'This day is now final and immutable.', 'high', '/diary');
  };

  const handleTagToggle = (tag: string) => {
    const newTags = currentEntry.tags.includes(tag) ? currentEntry.tags.filter(t => t !== tag) : [...currentEntry.tags, tag];
    updateEntry({ tags: newTags });
  };

  const handleFrictionToggle = (friction: string) => {
    const newFrictions = currentEntry.frictions?.includes(friction) ? currentEntry.frictions.filter(f => f !== friction) : [...(currentEntry.frictions || []), friction];
    updateEntry({ frictions: newFrictions });

    if (newFrictions.length >= 4) {
      safeNotify(`diary_high_friction_${selectedDate}`, 12 * 60 * 60 * 1000, () => {
        addNotification('diary', 'High Friction Detected ⚠️', 'Remove blockers now.', 'high', '/diary');
      });
    }
  };

  const addRelatedDate = () => {
    if (!newRelatedDate || !allEntries[newRelatedDate]) return;
    const currentRelated = currentEntry.relatedDates || [];
    if (!currentRelated.includes(newRelatedDate)) updateEntry({ relatedDates: [...currentRelated, newRelatedDate] });
    setNewRelatedDate('');
  };

  const removeRelatedDate = (date: string) => updateEntry({ relatedDates: (currentEntry.relatedDates || []).filter(d => d !== date) });

  const saveNewVersion = () => {
    const timestamp = new Date().toISOString();
    const snapshot = { ...currentEntry };
    delete snapshot.versions;
    updateEntry({ versions: [...(currentEntry.versions || []), { timestamp, snapshot }].slice(-5) });
  };

  const changeDate = (days: number) => {
    if (!selectedDate) return;
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + days);
    const newD = getLocalDate(d);
    if (newD <= actualToday) setSelectedDate(newD);
  };

  // --- 🔥 REALTIME ENGINE ---
  useEffect(() => {
    if (!supabase || !currentUser) return;

    const channel = supabase
      .channel(`diary-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "diary_entries",
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload: any) => {
          if (isEditingRef.current) return; 

          const row = payload.new;
          if (!row) return;

          const mapped: DiaryEntry = {
            ...DEFAULT_ENTRY,
            morning: row.morning,
            afternoon: row.afternoon,
            evening: row.evening,
            learning: row.learning,
            tomorrow: row.tomorrow,
            mood: row.mood,
            energy: row.energy,
            tags: row.tags,
            isMissed: row.is_missed,
            relatedDates: row.related_dates,
            focusArea: row.focus_area,
            goalAlignment: row.goal_alignment,
            frictions: row.frictions,
            identity: row.identity,
            chapter: row.chapter,
            isLocked: row.is_locked,
            versions: row.versions,
            morningTime: row.morning_time,
            afternoonTime: row.afternoon_time,
            eveningTime: row.evening_time
          };

          setAllEntries(prev => ({
            ...prev,
            [row.entry_date]: mapped
          }));

          if (row.entry_date === selectedDate) {
            setCurrentEntry(mapped);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUser, selectedDate]);

  // --- DEEP FILTERING ENGINE ---
  const filteredHistory = useMemo(() => {
    let dates = Object.keys(allEntries).filter(d => d <= actualToday).sort().reverse();
    if (rangeFilter === '7d') dates = dates.slice(0, 7);
    if (rangeFilter === '30d') dates = dates.slice(0, 30);

    return dates.filter(date => {
      const entry = allEntries[date];
      if (entry.isMissed && (debouncedSearch || moodFilter || energyFilter || tagFilter)) return false;
      if (moodFilter && entry.mood !== moodFilter) return false;
      if (energyFilter && entry.energy !== energyFilter) return false;
      if (tagFilter && !(entry.tags || []).includes(tagFilter)) return false;

      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        const content = `${entry.morning||''} ${entry.afternoon||''} ${entry.evening||''} ${entry.learning||''} ${entry.tomorrow||''} ${(entry.tags||[]).join(' ')} ${(entry.frictions||[]).join(' ')} ${entry.focusArea||''} ${entry.chapter||''}`.toLowerCase();
        if (!content.includes(q)) return false;
      }
      return true;
    });
  }, [allEntries, actualToday, debouncedSearch, moodFilter, energyFilter, tagFilter, rangeFilter]);

  const historyDates = Object.keys(allEntries).filter(d => d <= actualToday).sort().reverse().slice(0, 14);
  const searchResults: any[] = []; 

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
      if (streak > 30) break;
    }
    if (streak >= 7) earnedBadges.push("🔥 Week Warrior");
    if (consistency >= 80) earnedBadges.push("⚡ Execution Master");
    if (Object.values(allEntries).filter(e => !e.isMissed && e.goalAlignment && e.goalAlignment >= 80).length >= 5) earnedBadges.push("🎯 Goal Aligned");
    return { currentStreak: streak, badges: earnedBadges };
  }, [allEntries, actualToday, consistency]);

  // --- BEHAVIORAL NOTIFICATION ENGINE ---
  useEffect(() => {
    if (!isLoaded) return;

    if (consistency >= 80) {
      safeNotify('diary_peak_performance', 24 * 60 * 60 * 1000, () => {
        setTimeout(() => addNotification('diary', 'Peak Performance ⚡', 'You are operating at high efficiency.', 'medium', '/diary'), 4000);
      });
    }

    detectedPatterns.forEach((pattern, index) => {
      const safeKey = pattern.replace(/\s+/g, '_').toLowerCase();
      safeNotify(`diary_pattern_${safeKey}`, 2 * 24 * 60 * 60 * 1000, () => {
        setTimeout(() => addNotification('diary', 'Behavior Pattern 🧠', pattern, 'medium', '/diary'), 5000 + (index * 1000));
      });
    });

    activeAlerts.forEach((alertStr, index) => {
      const safeKey = alertStr.replace(/\s+/g, '_').toLowerCase();
      safeNotify(`diary_alert_${safeKey}`, 24 * 60 * 60 * 1000, () => {
        setTimeout(() => addNotification('diary', 'System Alert ⚠️', alertStr, 'high', '/diary'), 6000 + (index * 1000));
      });
    });

    if (currentStreak > 0 && currentStreak % 7 === 0) {
      safeNotify(`diary_streak_${currentStreak}`, 7 * 24 * 60 * 60 * 1000, () => {
        setTimeout(() => addNotification('diary', `🔥 ${currentStreak} Day Streak`, 'Consistency is building.', 'high', '/diary'), 7000);
      });
    }

    badges.forEach((badge, index) => {
      const safeKey = badge.replace(/\s+/g, '_').toLowerCase();
      safeNotify(`diary_badge_${safeKey}`, 7 * 24 * 60 * 60 * 1000, () => {
        setTimeout(() => addNotification('diary', 'Achievement Unlocked 🏆', badge, 'medium', '/diary'), 8000 + (index * 1000));
      });
    });

  }, [isLoaded, consistency, detectedPatterns, activeAlerts, currentStreak, badges, addNotification, safeNotify]);

  // --- REFLECTION REMINDER INTERVAL ---
  useEffect(() => {
    const reminderInterval = setInterval(() => {
      const hour = new Date().getHours();
      const hasWritten = !!(currentEntry.morning || currentEntry.afternoon || currentEntry.evening);
      
      if (!hasWritten) {
        if (hour >= 9 && hour <= 12) {
          safeNotify('diary_morning_reminder', 12 * 60 * 60 * 1000, () => {
            addNotification('diary', 'No Reflection Yet 🌅', 'Start your day with clarity.', 'medium', '/diary');
          });
        } 
        else if (hour >= 20 && hour <= 23) {
          handleDiary(addNotification, "reminder");
        }
      }
    }, 30 * 60 * 1000); 
    
    return () => clearInterval(reminderInterval);
  }, [currentEntry, addNotification, safeNotify]);

  const generateAutoSummary = () => {
    const summary = `Today was a ${currentEntry.mood} mood, ${currentEntry.energy} energy day.\nFocus area: ${currentEntry.focusArea}. Goal alignment: ${currentEntry.goalAlignment}%.\nKey friction: ${currentEntry.frictions?.[0] || 'none'}.\nIdentity: ${currentEntry.identity || 'not reflected'}.\n${currentEntry.learning ? `Breakthrough: ${currentEntry.learning}` : ''}`;
    
    safeNotify('diary_summary_gen', 5 * 60 * 1000, () => {
      addNotification('diary', 'Insight Generated 📊', 'Your daily pattern is ready for review.', 'low', '/diary');
    });

    alert(summary);
    return summary;
  };

  const exportTXT = () => {
    const content = `DATE: ${selectedDate}\nMOOD: ${currentEntry.mood.toUpperCase()}\nENERGY: ${currentEntry.energy.toUpperCase()}\nTAGS: ${(currentEntry.tags || []).join(', ')}\nFOCUS: ${currentEntry.focusArea}\nGOAL ALIGNMENT: ${currentEntry.goalAlignment}%\nFRICTIONS: ${currentEntry.frictions?.join(', ') || 'none'}\nIDENTITY: ${currentEntry.identity || '—'}\nCHAPTER: ${currentEntry.chapter || '—'}\n\n--- MORNING ---\n${currentEntry.morning}\n\n--- AFTERNOON ---\n${currentEntry.afternoon}\n\n--- EVENING ---\n${currentEntry.evening}\n\n--- LEARNING ---\n${currentEntry.learning}\n\n--- TOMORROW ---\n${currentEntry.tomorrow}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `NexEngine_Diary_${selectedDate}.txt`; link.click();
    
    addNotification('diary', 'Export Complete 💾', 'Diary text exported successfully.', 'low', '/diary');
  };

  const exportAllJSON = () => {
    const blob = new Blob([JSON.stringify(allEntries, null, 2)], { type: 'application/json' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `NexEngine_FullArchive_${actualToday}.json`; link.click();
    
    addNotification('diary', 'Archive Exported 💾', 'Full diary database exported successfully.', 'low', '/diary');
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