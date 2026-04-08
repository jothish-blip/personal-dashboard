"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { PlannerEvent, SystemLog, SystemPayload, TaskType, Priority, EventStatus } from "./types";
import { useNotificationSystem } from "@/notifications/useNotificationSystem"; 
import { getSupabaseClient } from "@/lib/supabase";
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

const SYSTEM_VERSION = 1.2;
const STORAGE_KEY = "taskflow_planner_v1";

export type TabType = "today" | "all" | "logs";

// --- STRICT DB TYPES ---
type DBPlannerEvent = {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  event_time: string;
  event_type: string;
  priority: string;
  status: EventStatus;
  history: Record<string, EventStatus>;
  created_at: number;
};

// Optimized time-sorting helper
const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// Universal Row Mapper
const mapRow = (row: DBPlannerEvent): PlannerEvent => ({
  id: row.id,
  title: row.title,
  date: row.event_date,
  time: row.event_time.substring(0, 5),
  type: row.event_type as TaskType,
  priority: row.priority as Priority,
  status: row.status as EventStatus,
  history: row.history || {},
  createdAt: row.created_at
});

export function usePlannerSystem() {
  const supabase = getSupabaseClient();

  // --- AUTH STATE (Moved up to support Notification Hook) ---
  const [currentUser, setCurrentUser] = useState<any>(null); 
  const userRef = useRef<any>(null); 

  // --- NOTIFICATION HOOK (Updated to pass userId) ---
  const { addNotification } = useNotificationSystem(currentUser?.id);

  // --- APP STATE ---
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  
  const [activeTab, setActiveTab] = useState<TabType>("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(""); 
  
  const [isReady, setIsReady] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<PlannerEvent>>({
    id: "", title: "", date: new Date().toISOString().split('T')[0], time: "09:00", type: "Work", priority: "medium"
  });

  const saveRef = useRef<NodeJS.Timeout | null>(null); 

  // --- NOTIFICATION SPAM FIX ---
  const safeNotify = useCallback((key: string, fn: () => void) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      fn();
    }
  }, []);

  // --- THROTTLE SEARCH EFFECT ---
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // --- DB SYNC HELPERS (BATCHED) ---
  const syncEventsToDB = async (eventsToSync: PlannerEvent[]) => {
    try {
      const user = userRef.current;
      if (!user || !supabase || eventsToSync.length === 0) return;

      const payloads: DBPlannerEvent[] = eventsToSync.map(e => ({
        id: e.id,
        user_id: user.id,
        title: e.title,
        event_date: e.date,
        event_time: e.time,
        event_type: e.type,
        priority: e.priority,
        status: e.status,
        history: e.history,
        created_at: e.createdAt
      }));

      await supabase.from('planner_events').upsert(payloads, { onConflict: 'id' });
    } catch (e) { console.error("Event Sync Exception", e); }
  };

  const deleteEventFromDB = async (id: string) => {
    if (!supabase) return;
    await supabase.from('planner_events').delete().eq('id', id);
  };

  const syncLogToDB = async (log: SystemLog) => {
    try {
      const user = userRef.current;
      if (!user || !supabase) return;
      await supabase.from('planner_logs').insert({
        id: log.id, user_id: user.id, action: log.action, details: log.details, timestamp: log.timestamp
      });
    } catch (e) { console.error("Log Sync Error", e); }
  };

  // --- FIX 1: AUTH RE-SYNC (Single Source of Truth) ---
  useEffect(() => {
    if (!supabase) return;

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        const user = session?.user ?? null;
        userRef.current = user;
        setCurrentUser(user);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  // --- FIX 2: BOOT-UP & DATA FETCH (Driven by currentUser) ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasSeenStatus = sessionStorage.getItem("app_status_seen");
    if (!hasSeenStatus) setIsStatusModalOpen(true);

    const initPlanner = async () => {
      let loadedEvents: PlannerEvent[] = [];
      let loadedLogs: SystemLog[] = [];

      try {
        const user = userRef.current; 

        if (user && supabase) {
          const [eventsRes, logsRes] = await Promise.all([
            supabase.from('planner_events').select('*').eq('user_id', user.id).order('event_date', { ascending: false }),
            supabase.from('planner_logs').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }).limit(50)
          ]);

          if (eventsRes.data) {
            loadedEvents = (eventsRes.data as DBPlannerEvent[]).map(mapRow);
          }

          if (logsRes.data) {
            loadedLogs = (logsRes.data as any[]).map((row) => ({
              id: row.id, action: row.action, details: row.details, timestamp: row.timestamp
            }));
          }
        } else if (!user) {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const payload: SystemPayload = JSON.parse(raw);
            loadedEvents = payload.events || [];
            loadedLogs = payload.logs || [];
          }
        }
      } catch (err) {
        console.error("DB Load failed", err);
      } finally {
        setEvents(loadedEvents);
        setLogs(loadedLogs);
        setIsReady(true); 

        // Notifications logic
        if (!sessionStorage.getItem("planner_behavior_scanned") && loadedEvents.length > 0) {
          sessionStorage.setItem("planner_behavior_scanned", "true");
          const todayStr = new Date().toISOString().split('T')[0];
          const todayEvents = loadedEvents.filter(e => e.date === todayStr);

          if (todayEvents.length === 0) {
            setTimeout(() => addNotification('planner', 'No Plan Today', 'Your schedule is empty.', 'high', '/calender-event'), 4000);
          } else if (todayEvents.length > 8) {
            setTimeout(() => addNotification('planner', 'Overload Warning', `You have ${todayEvents.length} events scheduled today.`, 'high', '/calender-event'), 4000);
          }
        }
      }
    };

    initPlanner();
  }, [currentUser, addNotification]); 

  // --- FIX 3: REALTIME ENGINE (Strictly tied to currentUser) ---
  useEffect(() => {
    if (!supabase || !currentUser) return;

    const channel = supabase
      .channel(`planner-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "planner_events",
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setEvents(prev => [mapRow(payload.new), ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setEvents(prev =>
              prev.map(e => e.id === payload.new.id ? mapRow(payload.new) : e)
            );
          } else if (payload.eventType === "DELETE") {
            setEvents(prev =>
              prev.filter(e => e.id !== payload.old.id)
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "planner_logs",
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setLogs(prev => [{
              id: payload.new.id, 
              action: payload.new.action, 
              details: payload.new.details, 
              timestamp: payload.new.timestamp 
            }, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUser]);

  // --- RECOVERY SYNC ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (!navigator.onLine) return;

      const user = userRef.current;
      if (!user || !supabase) return;

      supabase
        .from('planner_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false })
        .then((res: { data: DBPlannerEvent[] | null }) => {
          const data = res.data;
          if (data) setEvents(data.map(mapRow));
        });
    }, 15000);

    return () => clearInterval(interval);
  }, [supabase]);

  // --- AUTO-UPDATE MISSED TASKS ---
  useEffect(() => {
    if (!isReady || events.length === 0) return;

    const checkMissedTasks = () => {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      setEvents(prev => {
        let stateChanged = false;
        const newlyMissed: PlannerEvent[] = [];

        const updated = prev.map(event => {
          if (event.status === "pending" && event.date <= todayStr) {
            const eventDateTime = new Date(`${event.date}T${event.time}`);
            if (eventDateTime < now) {
              stateChanged = true;
              const updatedEvent = { ...event, status: "missed" as const };
              newlyMissed.push(updatedEvent);
              
              safeNotify(`missed_notified_${event.id}`, () => {
                addNotification('planner', 'Missed Event ⚠️', `You missed: ${event.title}`, 'high', '/calender-event');
              });
              
              return updatedEvent;
            }
          }
          return event;
        });

        if (stateChanged && newlyMissed.length > 0) {
          syncEventsToDB(newlyMissed); 
        }

        return stateChanged ? updated : prev; 
      });
    };

    checkMissedTasks();
    const timer = setInterval(checkMissedTasks, 60000); 
    return () => clearInterval(timer);
  }, [isReady, events.length, addNotification, safeNotify]);

  // --- THROTTLED LOCAL PERSISTENCE ---
  useEffect(() => {
    if (!isReady) return;
    if (saveRef.current) clearTimeout(saveRef.current);

    saveRef.current = setTimeout(() => {
      const payload: SystemPayload = { events, logs: logs.slice(0, 50), version: SYSTEM_VERSION, lastSync: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, 2000);
  }, [events, logs, isReady]);

  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    sessionStorage.setItem("app_status_seen", "true");
  };

  const createLog = (action: string, details: string) => {
    const newLog: SystemLog = { id: crypto.randomUUID(), action: action as any, details, timestamp: Date.now() };
    setLogs(prev => [newLog, ...prev]);
    syncLogToDB(newLog); 
  };

  // --- ACTIONS ---
  const handleSave = () => {
    if (!formData.title || !formData.date || !formData.time || !formData.type || !formData.priority) return;
    
    if (formData.id) {
      let targetEvent: PlannerEvent | null = null;
      setEvents(prev => prev.map(e => {
        if (e.id === formData.id) {
          targetEvent = { ...e, ...formData } as PlannerEvent;
          return targetEvent;
        }
        return e;
      }));
      
      if (targetEvent) syncEventsToDB([targetEvent]); 
      createLog("UPDATE", `Modified: ${formData.title}`);
      
      localStorage.removeItem(`missed_notified_${formData.id}`);
      localStorage.removeItem(`planner_1h_${formData.id}`);
      localStorage.removeItem(`planner_10m_${formData.id}`);
      localStorage.removeItem(`planner_now_${formData.id}`);
      
      addNotification('planner', 'Event Updated', `Modified: ${formData.title}`, 'low', '/calender-event');
    } else {
      const newEv: PlannerEvent = { 
        id: crypto.randomUUID(), 
        title: formData.title, date: formData.date, time: formData.time, type: formData.type as TaskType, priority: formData.priority as Priority,
        status: "pending", history: { [formData.date]: "pending" }, createdAt: Date.now() 
      };
      setEvents(prev => [...prev, newEv]);
      syncEventsToDB([newEv]); 
      createLog("CREATE", `Added: ${formData.title}`);
      
      addNotification('planner', 'Event Scheduled', `${formData.title} added at ${formData.time}`, 'low', '/calender-event');
    }
    
    setIsAddModalOpen(false);
    setFormData({ id: "", title: "", date: new Date().toISOString().split('T')[0], time: "09:00", type: "Work", priority: "medium" });
  };

  const toggleStatus = (id: string) => {
    let updatedEvent: PlannerEvent | null = null;
    setEvents(prev => prev.map(e => {
      if (e.id === id) {
        const nextStatus = e.status === "completed" ? "pending" : "completed";
        updatedEvent = { ...e, status: nextStatus, history: { ...e.history, [e.date]: nextStatus } };
        
        createLog("STATUS_TOGGLE", `${e.title} marked ${nextStatus}`);
        if (nextStatus === "completed") {
          addNotification('planner', 'Event Completed ✅', `${e.title} marked as completed`, 'low', '/calender-event');
        }
        return updatedEvent;
      }
      return e;
    }));
    
    if (updatedEvent) syncEventsToDB([updatedEvent]); 
  };

  const deleteWithUndo = (id: string) => {
    const target = events.find(e => e.id === id);
    setEvents(prev => prev.filter(e => e.id !== id));
    
    deleteEventFromDB(id); 
    createLog("DELETE", `Removed: ${target?.title}`);
    
    localStorage.removeItem(`missed_notified_${id}`);
    localStorage.removeItem(`planner_1h_${id}`);
    localStorage.removeItem(`planner_10m_${id}`);
    localStorage.removeItem(`planner_now_${id}`);
    
    addNotification('planner', 'Event Removed', `${target?.title} deleted from schedule`, 'medium', '/calender-event');
  };

  const findNextAvailableSlot = (currentEvents: PlannerEvent[], baseDate = new Date()) => {
    const newDate = new Date(baseDate);
    newDate.setHours(newDate.getHours() + 1, 0, 0, 0);

    for (let i = 0; i < 48; i++) {
      const dateStr = newDate.toISOString().split("T")[0];
      const timeStr = `${String(newDate.getHours()).padStart(2, "0")}:00`;
      const isTaken = currentEvents.some(e => e.date === dateStr && e.time === timeStr && e.status === "pending");

      if (!isTaken) return { date: dateStr, time: timeStr };
      newDate.setHours(newDate.getHours() + 1);
    }
    return null;
  };

  const rescheduleTask = (id: string) => {
    setEvents(prev => {
      let updatedEvents = [...prev];
      const taskIndex = updatedEvents.findIndex(e => e.id === id);
      if (taskIndex === -1) return prev;
      
      const slot = findNextAvailableSlot(updatedEvents);
      if (slot) {
        updatedEvents[taskIndex] = { ...updatedEvents[taskIndex], date: slot.date, time: slot.time, status: "pending" };
        syncEventsToDB([updatedEvents[taskIndex]]); 
        createLog("RESCHEDULE", `Recovered: ${updatedEvents[taskIndex].title}`);
        
        localStorage.removeItem(`missed_notified_${id}`);
        localStorage.removeItem(`planner_1h_${id}`);
        localStorage.removeItem(`planner_10m_${id}`);
        localStorage.removeItem(`planner_now_${id}`);
        
        addNotification('planner', 'Event Rescheduled 🔄', `${updatedEvents[taskIndex].title} moved to ${slot.time}`, 'medium', '/calender-event');
      }
      return updatedEvents;
    });
  };

  const rescheduleAllMissed = () => {
    setEvents(prev => {
      let updatedEvents = [...prev];
      let count = 0;
      const recovered: PlannerEvent[] = [];

      updatedEvents = updatedEvents.map(e => {
        if (e.status === "missed") {
          const slot = findNextAvailableSlot(updatedEvents);
          if (slot) {
            count++;
            localStorage.removeItem(`missed_notified_${e.id}`);
            localStorage.removeItem(`planner_1h_${e.id}`);
            localStorage.removeItem(`planner_10m_${e.id}`);
            localStorage.removeItem(`planner_now_${e.id}`);
            
            const updated = { ...e, date: slot.date, time: slot.time, status: "pending" as const };
            recovered.push(updated);
            return updated;
          }
        }
        return e;
      });
      
      if (count > 0) {
        syncEventsToDB(recovered); 
        createLog("RESCHEDULE", `Auto-recovered ${count} tasks`);
        addNotification('planner', 'Tasks Recovered', `${count} missed tasks have been auto-rescheduled.`, 'medium', '/calender-event');
      }
      
      return updatedEvents;
    });
  };

  // --- FILTER & SORT OPTIMIZATION ---
  const filteredEvents = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return events.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(debouncedSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (activeTab === "today") return e.date === today;
      if (activeTab === "all") return true;
      return false; 
    }).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)); 
  }, [events, activeTab, debouncedSearch]);

  const analytics = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const todayEvents = events.filter(e => e.date === todayStr);
    const yesterdayEvents = events.filter(e => e.date === yesterdayStr);
    
    const statusCounts = {
      completed: events.filter(e => e.status === "completed").length,
      pending: events.filter(e => e.status === "pending").length,
      missed: events.filter(e => e.status === "missed").length
    };

    const missedTasks = events
      .filter(e => e.status === "missed")
      .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime())
      .slice(0, 5);

    const missedByType: Record<string, number> = {};
    events.forEach(e => {
      if (e.status === "missed") {
        missedByType[e.type] = (missedByType[e.type] || 0) + 1;
      }
    });
    
    const sortedMissedByType = Object.fromEntries(
      Object.entries(missedByType).sort(([,a], [,b]) => b - a)
    );

    return {
      rate: todayEvents.length ? Math.round((todayEvents.filter(e => e.status === "completed").length / todayEvents.length) * 100) : 0,
      statusCounts,
      today: { 
        done: todayEvents.filter(e => e.status === "completed").length, 
        total: todayEvents.length,
        missed: todayEvents.filter(e => e.status === "missed").length
      },
      yesterday: {
        done: yesterdayEvents.filter(e => e.status === "completed").length,
        total: yesterdayEvents.length
      },
      missedTasks,
      missedByType: sortedMissedByType
    };
  }, [events]);

  return {
    SYSTEM_VERSION, isReady, events, logs,
    activeTab, setActiveTab, searchQuery, setSearchQuery,
    isAddModalOpen, setIsAddModalOpen, isStatusModalOpen, closeStatusModal,
    formData, setFormData, filteredEvents, analytics,
    handleSave, toggleStatus, deleteWithUndo, rescheduleTask, rescheduleAllMissed
  };
}