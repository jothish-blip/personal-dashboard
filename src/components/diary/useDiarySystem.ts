"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DiaryEntry, Task, getLocalDate, DEFAULT_ENTRY } from './types';
import { useNotificationSystem } from '@/notifications/useNotificationSystem'; 
import { handleDiary } from '@/notifications/nexNotificationBrain'; 
import { getSupabaseClient } from "@/lib/supabase";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

const STORAGE_PREFIX = 'nextask_diary_';
const MAX_ENTRIES_IN_MEMORY = 60;
const MAX_RETRY = 20;
const MAX_LENGTH = 5000;
const DEBUG = false; 

// ✅ FIX: Enforce Strict Notification Types
type NotificationType = 'high' | 'medium' | 'low';

const logInfo = (...args: any[]) => {
  if (DEBUG) console.log("[DiarySystem]", ...args);
};

// --- SAFE PARSE UTILITY ---
const safeParse = (str: string | null) => {
  try {
    return str ? JSON.parse(str) : null;
  } catch {
    console.error("[DiarySystem] Corrupted JSON detected in cache.");
    return null;
  }
};

const truncateStr = (str: string) => str?.length > MAX_LENGTH ? str.slice(0, MAX_LENGTH) : str;

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

// --- SPLIT HEAVY COMPUTATIONS ---
function useDiaryInsights(allEntries: Record<string, DiaryEntry>, currentEntry: DiaryEntry, consistency: number, actualToday: string, allDates: string[]) {
  const allEntryList = useMemo(() => allDates.map(d => allEntries[d]), [allDates, allEntries]);

  return useMemo(() => {
    if (currentEntry.isMissed) {
      return { aiInsight: "Day skipped. System integrity broken.", detectedPatterns: [], futurePrediction: "No data for prediction.", energyOutputCorrelation: "Insufficient data", activeAlerts: [], weeklySummary: { dominantMood: 'Neutral', topTag: 'None', focusDistribution: 'No focus data' }, currentStreak: 0, badges: [] };
    }

    const patterns: string[] = [];
    const alerts: string[] = [];
    const last7Dates = Array.from({ length: 7 }, (_, i) => getLocalDate(new Date(Date.now() - i * 86400000)));
    const last7Entries = last7Dates.map(d => allEntries[d]).filter(Boolean).filter(e => !e.isMissed);

    // Patterns & Alerts
    if (last7Entries.filter(e => e.energy === 'low').length >= 3 && consistency < 50) patterns.push("Low energy strongly correlates with reduced output");
    if (last7Entries.filter(e => (e.tags || []).includes('Distraction Day')).length >= 3) patterns.push("Distraction pattern detected (3+ times this week)");
    if (allEntryList.filter(e => !e.isMissed && e.mood === 'bad').length >= 3) alerts.push("3+ bad mood days detected → consider rest day");
    if (allEntryList.filter(e => e.isMissed).length >= 2) alerts.push("Multiple missed days → system instability risk");
    if (currentEntry.frictions && currentEntry.frictions.length >= 4) alerts.push("High friction load today → address blockers");

    // Insights & Predictions
    const highEnergyDays = last7Entries.filter(e => e.energy === 'high');
    const highEnergyDone = highEnergyDays.length > 0 ? Math.round((highEnergyDays.filter(e => consistency > 70).length / highEnergyDays.length) * 100) : 0;
    const energyOutputCorrelation = `High energy = ${highEnergyDone}% consistency • Low energy = ${consistency < 40 ? '30%' : 'average'} consistency`;

    let aiInsight = "System stable. Awaiting further data.";
    if (currentEntry.energy === 'low' && consistency > 60) aiInsight = "Low energy but high execution. Elite resilience.";
    else if ((currentEntry.tags || []).includes('Distraction Day') && consistency < 40) aiInsight = "Distraction pattern active. Environment reset required.";
    else if (currentEntry.mood === 'bad' && consistency < 30) aiInsight = "Emotional friction blocking output. Re-align required.";
    else if (consistency >= 80) aiInsight = "Execution parameters optimal. Maintain momentum.";

    const last3Energy = last7Entries.slice(0, 3).filter(e => e.energy === 'low').length;
    const futurePrediction = last3Energy >= 2 ? "Tomorrow likely lower productivity. Prepare rest protocol." : "Momentum stable. High probability of strong output.";

    // Weekly Summary
    let good = 0, neutral = 0, bad = 0, totalFocusDays = 0;
    const tagCounts: Record<string, number> = {};
    const focusCounts: Record<string, number> = { Work: 0, Health: 0, Learning: 0, Social: 0, None: 0 };
    last7Dates.forEach(d => {
      const e = allEntries[d];
      if (e && !e.isMissed) {
        if (e.mood === 'good') good++; if (e.mood === 'neutral') neutral++; if (e.mood === 'bad') bad++;
        (e.tags || []).forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
        if (e.focusArea && e.focusArea !== 'None') { focusCounts[e.focusArea] = (focusCounts[e.focusArea] || 0) + 1; totalFocusDays++; }
      }
    });
    const dominantMood = good > bad && good > neutral ? 'Positive' : bad > good && bad > neutral ? 'Negative' : 'Neutral';
    const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    const focusDistribution = Object.entries(focusCounts).filter(([_, count]) => count > 0).map(([area, count]) => `${area}: ${Math.round((count / (totalFocusDays || 1)) * 100)}%`).join(' • ') || 'No focus data';

    // Streaks & Badges
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
    if (allEntryList.filter(e => !e.isMissed && e.goalAlignment && e.goalAlignment >= 80).length >= 5) earnedBadges.push("🎯 Goal Aligned");

    return { 
      aiInsight, 
      detectedPatterns: patterns, 
      futurePrediction, 
      energyOutputCorrelation, 
      activeAlerts: alerts, 
      weeklySummary: { dominantMood, topTag, focusDistribution }, 
      currentStreak: streak, 
      badges: earnedBadges 
    };
  }, [allEntryList, allEntries, currentEntry, consistency, actualToday]);
}

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
  const allDates = useMemo(() => Object.keys(allEntries), [allEntries]);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [dirty, setDirty] = useState(false);
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
  const [writingActivity, setWritingActivity] = useState({ lastEdit: Date.now(), isSyncing: false, totalEdits: 0 });
  
  // --- Refs ---
  const recognitionRef = useRef<any>(null);
  const isInitializing = useRef(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null); 
  const userRef = useRef<any>(null);
  const isEditingRef = useRef(false);
  const isSavingRef = useRef(false); 
  const lastSavedRef = useRef<string>("");
  const retryQueue = useRef<{date: string, entry: DiaryEntry}[]>([]);
  
  const notificationQueue = useRef<string[]>([]);
  const notificationTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Safe Notification Wrapper (Queue + Cleanup + Strict Type)
  const pushNotification = useCallback((
    msgKey: string, 
    title: string, 
    desc: string, 
    type: NotificationType, 
    url: string
  ) => {
    if (!notificationQueue.current.includes(msgKey)) {
      notificationQueue.current.push(msgKey);
      const t = setTimeout(() => {
        addNotification('diary', title, desc, type, url);
        notificationQueue.current = notificationQueue.current.filter(m => m !== msgKey);
      }, 2000);
      notificationTimeouts.current.push(t);
    }
  }, [addNotification]);

  // Wrapper to bridge external caller types safely into our strict types
  const notifyWrapper = useCallback((title: string, desc: string, type: string, path: string) => {
    const msgKey = `diary_${title.replace(/\s+/g, '_').toLowerCase()}`;
    // Force cast here since we assume handleDiary sends valid types, but keep signature broad for callback
    pushNotification(msgKey, title, desc, type as NotificationType, path);
  }, [pushNotification]);

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

  // --- DB SYNC HELPER ---
  const syncEntryToDB = async (dateStr: string, entry: DiaryEntry) => {
    if (entry.isLocked) return;
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

      const { error } = await supabase.from('diary_entries').upsert(payload, { onConflict: 'user_id, entry_date' });
      if (error) throw error;
      logInfo(`Synced entry to DB for ${dateStr}`);
    } catch (err) { 
      console.error("Diary DB Sync Exception:", err); 
      throw err; 
    }
  };

  // --- RETRY SYSTEM ---
  useEffect(() => {
    let isMounted = true;
    const retryFailedSyncs = async () => {
      if (!isMounted || retryQueue.current.length === 0) return;
      const toRetry = [...retryQueue.current];
      retryQueue.current = [];
      
      for (const item of toRetry) {
        try {
          await syncEntryToDB(item.date, item.entry);
        } catch {
          if (retryQueue.current.length >= MAX_RETRY) retryQueue.current.shift();
          retryQueue.current.push(item); 
        }
      }
    };
    const i = setInterval(retryFailedSyncs, 10000);
    return () => { isMounted = false; clearInterval(i); };
  }, []);

  // --- MEMORY LEAK CLEANUP & UNLOAD ---
  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('nexengine_diary_wip_seen');
    if (!hasSeenPopup) {
      setShowWipPopup(true);
      sessionStorage.setItem('nexengine_diary_wip_seen', 'true');
    }
    
    const handleBeforeUnload = () => {
      if (dirty && !currentEntry.isLocked) {
        localStorage.setItem(`${STORAGE_PREFIX}${selectedDate}`, JSON.stringify(currentEntry));
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      notificationTimeouts.current.forEach(clearTimeout);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [dirty, currentEntry, selectedDate]);

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
    let isMounted = true;
    if (isInitializing.current || typeof window === "undefined") return;
    isInitializing.current = true;

    const initDiary = async () => {
      const storedTasks = safeParse(localStorage.getItem('nextask_tasks'));
      if (storedTasks) setTasks(storedTasks);

      let entriesMap: Record<string, DiaryEntry> = {};
      let oldestDate = actualToday;

      try {
        const user = userRef.current; 
        if (user && supabase) {
          const { data, error } = await supabase
            .from('diary_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('entry_date', { ascending: false })
            .limit(MAX_ENTRIES_IN_MEMORY);

          if (!isMounted) return;

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
                morningTime: row.morning_time, afternoonTime: row.afternoon_time, eveningTime: row.evening_time,
                updatedAt: row.updated_at
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
          syncEntryToDB(dStr, missedEntry).catch(() => {});
          
          newMissedCount++;
          handleDiary(notifyWrapper, "missed", dStr);
        }
        currDate.setDate(currDate.getDate() + 1);
      }

      if (newMissedCount >= 2) {
        safeNotify('diary_consecutive_missed', 24 * 60 * 60 * 1000, () => {
          pushNotification('diary_broken', 'Consistency Broken 🚨', 'Multiple missed days detected.', 'high', '/diary');
        });
      }

      if (!entriesMap[actualTomorrow]) {
        entriesMap[actualTomorrow] = DEFAULT_ENTRY;
      }

      const dates = Object.keys(entriesMap).sort().reverse();
      if (dates.length > MAX_ENTRIES_IN_MEMORY) {
        const trimmed: Record<string, DiaryEntry> = {};
        dates.slice(0, MAX_ENTRIES_IN_MEMORY).forEach(d => trimmed[d] = entriesMap[d]);
        entriesMap = trimmed;
      }

      setAllEntries(entriesMap);
      setCurrentEntry(entriesMap[actualToday] || DEFAULT_ENTRY);
      lastSavedRef.current = JSON.stringify(entriesMap[actualToday] || DEFAULT_ENTRY);
      setIsLoaded(true);
    };

    initDiary();
    return () => { isMounted = false; isInitializing.current = false; };
  }, [currentUser, notifyWrapper]); 

  // --- Switch Date Effect ---
  useEffect(() => {
    if (!isLoaded) return;
    const stored = allEntries[selectedDate] || safeParse(localStorage.getItem(`${STORAGE_PREFIX}${selectedDate}`));
    if (stored) {
      const mapped = {
        ...DEFAULT_ENTRY, ...stored,
        tags: stored.tags || [], frictions: stored.frictions || [],
        relatedDates: stored.relatedDates || [], versions: stored.versions || []
      };
      setCurrentEntry(mapped);
      lastSavedRef.current = JSON.stringify(mapped);
    } else {
      setCurrentEntry(DEFAULT_ENTRY);
      lastSavedRef.current = JSON.stringify(DEFAULT_ENTRY);
    }
    setDirty(false);
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

  // --- CONTROLLED SAVE CYCLE ---
  const saveEntry = async () => {
    if (currentEntry.isLocked || isSavingRef.current) return;
    
    isSavingRef.current = true;

    try {
      const insightSnapshot = { consistency, doneCount, totalCount, mood: currentEntry.mood, energy: currentEntry.energy, timestamp: new Date().toISOString() };
      const entryToSave = { 
        ...currentEntry, 
        morning: truncateStr(currentEntry.morning || ""),
        afternoon: truncateStr(currentEntry.afternoon || ""),
        evening: truncateStr(currentEntry.evening || ""),
        learning: truncateStr(currentEntry.learning || ""),
        tomorrow: truncateStr(currentEntry.tomorrow || ""),
        insightSnapshot, 
        updatedAt: new Date().toISOString() 
      };
      
      if (entryToSave.isMissed && (entryToSave.morning !== "No entry written." || entryToSave.afternoon !== "")) {
        delete entryToSave.isMissed;
      }

      const str = JSON.stringify(entryToSave);
      if (lastSavedRef.current === str) return; 

      localStorage.setItem(`${STORAGE_PREFIX}${selectedDate}`, str);
      lastSavedRef.current = str;
      setAllEntries(prev => ({ ...prev, [selectedDate]: entryToSave }));

      try {
        await syncEntryToDB(selectedDate, entryToSave);
      } catch (err) {
        if (!supabase) {
          pushNotification('offline_mode', 'Offline Mode ⚠️', 'Saving locally only.', 'medium', '/diary');
        } else {
          if (retryQueue.current.length >= MAX_RETRY) retryQueue.current.shift();
          retryQueue.current.push({ date: selectedDate, entry: entryToSave });
          pushNotification('diary_sync_fail', 'Sync Failed ⚠️', 'Saved locally. Will retry automatically.', 'high', '/diary');
        }
      } finally {
        isEditingRef.current = false; 
      }

      if (selectedDate === actualToday) {
        const tomorrowKey = `${STORAGE_PREFIX}${actualTomorrow}`;
        const existingTomorrow = allEntries[actualTomorrow] || safeParse(localStorage.getItem(tomorrowKey));
        
        if (!existingTomorrow || (!existingTomorrow.morning && !existingTomorrow.afternoon)) {
          const tmrwEntry = {
            ...DEFAULT_ENTRY, suggestedAction: getTomorrowAdaptation(insightSnapshot),
            focusArea: currentEntry.focusArea, carryOver: { prevEnergy: currentEntry.energy, prevConsistency: consistency }
          };
          localStorage.setItem(tomorrowKey, JSON.stringify(tmrwEntry));
          syncEntryToDB(actualTomorrow, tmrwEntry).catch(e => {
            if (retryQueue.current.length >= MAX_RETRY) retryQueue.current.shift();
            retryQueue.current.push({ date: actualTomorrow, entry: tmrwEntry });
          });
          setAllEntries(prev => ({ ...prev, [actualTomorrow]: tmrwEntry }));
          
          safeNotify(`diary_tomorrow_plan_${actualToday}`, 12 * 60 * 60 * 1000, () => {
            pushNotification('diary_tomorrow', 'Tomorrow Plan Ready 📅', 'Suggested action prepared for tomorrow.', 'low', '/diary');
          });
        }
      }

      setSaveStatus('saved');
      setWritingActivity(prev => ({ ...prev, isSyncing: false, lastEdit: Date.now() }));
      logInfo(`Entry structurally saved for ${selectedDate}`);

      safeNotify(`diary_saved_${selectedDate}`, 60000, () => {
        pushNotification('diary_saved', 'Entry Saved', 'Your reflection is secured.', 'low', '/diary');
      });

      if (writingActivity.totalEdits >= 30) {
        safeNotify(`diary_reflection_complete_${selectedDate}`, 12 * 60 * 60 * 1000, () => {
          pushNotification('diary_reflect_comp', 'Reflection Complete 📖', 'You captured your thoughts well.', 'low', '/diary');
        });
      }
    } finally {
      isSavingRef.current = false;
    }
  };

  useEffect(() => {
    if (!dirty || !isLoaded) return;
    setSaveStatus('saving');
    setWritingActivity(prev => ({ ...prev, isSyncing: true }));

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      saveEntry();
      setDirty(false);
    }, 2000);

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [dirty, currentEntry, selectedDate]);

  // --- ACTIONS ---
  const updateEntry = (updates: Partial<DiaryEntry>) => {
    if (currentEntry.isLocked) return; 
    
    isEditingRef.current = true; 
    setDirty(true);

    setWritingActivity(prev => {
      const newCount = prev.totalEdits + 1;
      
      if (prev.totalEdits === 0) {
        const yesterdayEntry = allEntries[actualYesterday];
        const isRecovery = yesterdayEntry && yesterdayEntry.isMissed && selectedDate === actualToday;

        if (isRecovery) {
          safeNotify(`diary_recovery_${actualToday}`, 24 * 60 * 60 * 1000, () => {
            pushNotification('diary_recovery', 'Back on Track 📈', 'Consistency resumed.', 'medium', '/diary');
          });
        } else {
          safeNotify(`diary_started_${selectedDate}`, 12 * 60 * 60 * 1000, () => {
            pushNotification('diary_started', 'Entry Started ✍️', 'Capture your day.', 'low', '/diary');
          });
        }
      }

      if (newCount === 30) {
        safeNotify(`diary_deep_focus_${selectedDate}`, 12 * 60 * 60 * 1000, () => {
          pushNotification('diary_deep_focus', 'Deep Reflection Mode 🧠', 'You are thinking deeply.', 'low', '/diary');
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
    syncEntryToDB(selectedDate, updated).catch(e => {
      if (retryQueue.current.length >= MAX_RETRY) retryQueue.current.shift();
      retryQueue.current.push({ date: selectedDate, entry: updated });
    });
    pushNotification('diary_lock', 'Day Locked 🔒', 'This day is now final and immutable.', 'high', '/diary');
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
        pushNotification('diary_high_frict', 'High Friction Detected ⚠️', 'Remove blockers now.', 'high', '/diary');
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

  // --- REALTIME ENGINE ---
  useEffect(() => {
    if (!supabase || !currentUser) return;

    const channel = supabase
      .channel(`diary-${currentUser.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "diary_entries", filter: `user_id=eq.${currentUser.id}` },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;

          if (isEditingRef.current) return; 
          if (currentEntry.updatedAt && row.updated_at && new Date(row.updated_at) < new Date(currentEntry.updatedAt)) return;

          const mapped: DiaryEntry = {
            ...DEFAULT_ENTRY, morning: row.morning, afternoon: row.afternoon, evening: row.evening,
            learning: row.learning, tomorrow: row.tomorrow, mood: row.mood, energy: row.energy,
            tags: row.tags, isMissed: row.is_missed, relatedDates: row.related_dates, focusArea: row.focus_area,
            goalAlignment: row.goal_alignment, frictions: row.frictions, identity: row.identity, chapter: row.chapter,
            isLocked: row.is_locked, versions: row.versions, morningTime: row.morning_time, 
            afternoonTime: row.afternoon_time, eveningTime: row.evening_time, updatedAt: row.updated_at
          };

          setAllEntries(prev => ({ ...prev, [row.entry_date]: mapped }));

          if (row.entry_date === selectedDate) {
            setCurrentEntry(mapped);
            lastSavedRef.current = JSON.stringify(mapped);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, currentUser, selectedDate]);

  // --- DEEP FILTERING ENGINE ---
  const filteredHistory = useMemo(() => {
    let dates = allDates.filter(d => d <= actualToday).sort().reverse();
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
  }, [allDates, allEntries, actualToday, debouncedSearch, moodFilter, energyFilter, tagFilter, rangeFilter]);

  const historyDates = allDates.filter(d => d <= actualToday).sort().reverse().slice(0, 14);
  const searchResults: any[] = []; 

  // --- COMPUTATIONS EXTRACTED ---
  const { 
    aiInsight, detectedPatterns, futurePrediction, energyOutputCorrelation, 
    activeAlerts, weeklySummary, currentStreak, badges 
  } = useDiaryInsights(allEntries, currentEntry, consistency, actualToday, allDates);

  // --- BEHAVIORAL NOTIFICATION ENGINE ---
  useEffect(() => {
    if (!isLoaded) return;

    if (consistency >= 80) {
      safeNotify('diary_peak_performance', 24 * 60 * 60 * 1000, () => {
        pushNotification('peak_perf', 'Peak Performance ⚡', 'You are operating at high efficiency.', 'medium', '/diary');
      });
    }

    detectedPatterns.forEach((pattern) => {
      const safeKey = pattern.replace(/\s+/g, '_').toLowerCase();
      safeNotify(`diary_pattern_${safeKey}`, 2 * 24 * 60 * 60 * 1000, () => {
        pushNotification(safeKey, 'Behavior Pattern 🧠', pattern, 'medium', '/diary');
      });
    });

    activeAlerts.forEach((alertStr) => {
      const safeKey = alertStr.replace(/\s+/g, '_').toLowerCase();
      safeNotify(`diary_alert_${safeKey}`, 24 * 60 * 60 * 1000, () => {
        pushNotification(safeKey, 'System Alert ⚠️', alertStr, 'high', '/diary');
      });
    });

    if (currentStreak > 0 && currentStreak % 7 === 0) {
      safeNotify(`diary_streak_${currentStreak}`, 7 * 24 * 60 * 60 * 1000, () => {
        pushNotification('streak_notify', `🔥 ${currentStreak} Day Streak`, 'Consistency is building.', 'high', '/diary');
      });
    }

    badges.forEach((badge) => {
      const safeKey = badge.replace(/\s+/g, '_').toLowerCase();
      safeNotify(`diary_badge_${safeKey}`, 7 * 24 * 60 * 60 * 1000, () => {
        pushNotification(safeKey, 'Achievement Unlocked 🏆', badge, 'medium', '/diary');
      });
    });

  }, [isLoaded, consistency, detectedPatterns, activeAlerts, currentStreak, badges, pushNotification, safeNotify]);

  // --- REFLECTION REMINDER INTERVAL ---
  useEffect(() => {
    const reminderInterval = setInterval(() => {
      const hour = new Date().getHours();
      const hasWritten = !!(currentEntry.morning || currentEntry.afternoon || currentEntry.evening);
      
      if (!hasWritten) {
        if (hour >= 9 && hour <= 12) {
          safeNotify('diary_morning_reminder', 12 * 60 * 60 * 1000, () => {
            pushNotification('morning_remind', 'No Reflection Yet 🌅', 'Start your day with clarity.', 'medium', '/diary');
          });
        } 
        else if (hour >= 20 && hour <= 23) {
          handleDiary(notifyWrapper, "reminder");
        }
      }
    }, 30 * 60 * 1000); 
    
    return () => clearInterval(reminderInterval);
  }, [currentEntry, notifyWrapper, safeNotify]);

  const generateAutoSummary = () => {
    const summary = `Today was a ${currentEntry.mood} mood, ${currentEntry.energy} energy day.\nFocus area: ${currentEntry.focusArea}. Goal alignment: ${currentEntry.goalAlignment}%.\nKey friction: ${currentEntry.frictions?.[0] || 'none'}.\nIdentity: ${currentEntry.identity || 'not reflected'}.\n${currentEntry.learning ? `Breakthrough: ${currentEntry.learning}` : ''}`;
    
    safeNotify('diary_summary_gen', 5 * 60 * 1000, () => {
      pushNotification('diary_insight', 'Insight Generated 📊', 'Your daily pattern is ready for review.', 'low', '/diary');
    });

    alert(summary);
    return summary;
  };

  const exportTXT = () => {
    const content = `DATE: ${selectedDate}\nMOOD: ${currentEntry.mood.toUpperCase()}\nENERGY: ${currentEntry.energy.toUpperCase()}\nTAGS: ${(currentEntry.tags || []).join(', ')}\nFOCUS: ${currentEntry.focusArea}\nGOAL ALIGNMENT: ${currentEntry.goalAlignment}%\nFRICTIONS: ${currentEntry.frictions?.join(', ') || 'none'}\nIDENTITY: ${currentEntry.identity || '—'}\nCHAPTER: ${currentEntry.chapter || '—'}\n\n--- MORNING ---\n${currentEntry.morning}\n\n--- AFTERNOON ---\n${currentEntry.afternoon}\n\n--- EVENING ---\n${currentEntry.evening}\n\n--- LEARNING ---\n${currentEntry.learning}\n\n--- TOMORROW ---\n${currentEntry.tomorrow}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `NexEngine_Diary_${selectedDate}.txt`; link.click();
    
    pushNotification('export_txt', 'Export Complete 💾', 'Diary text exported successfully.', 'low', '/diary');
  };

  const exportAllJSON = () => {
    const blob = new Blob([JSON.stringify(allEntries, null, 2)], { type: 'application/json' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `NexEngine_FullArchive_${actualToday}.json`; link.click();
    
    pushNotification('export_json', 'Archive Exported 💾', 'Full diary database exported successfully.', 'low', '/diary');
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