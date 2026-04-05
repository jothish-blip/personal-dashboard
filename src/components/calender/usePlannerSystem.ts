import { useState, useEffect, useMemo } from "react";
import { PlannerEvent, SystemLog, SystemPayload, TaskType, Priority } from "./types";

const SYSTEM_VERSION = 1.2;
const STORAGE_KEY = "taskflow_planner_v1";

export type TabType = "today" | "all" | "logs";

export function usePlannerSystem() {
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  
  const [activeTab, setActiveTab] = useState<TabType>("today");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // 🚨 THE FIX: Explicitly type this state as Partial<PlannerEvent>
  const [formData, setFormData] = useState<Partial<PlannerEvent>>({
    id: "",
    title: "",
    date: new Date().toISOString().split('T')[0],
    time: "09:00",
    type: "Work",
    priority: "medium"
  });

  // Initial Load
  useEffect(() => {
    const hasSeenStatus = sessionStorage.getItem("app_status_seen");
    if (!hasSeenStatus) setIsStatusModalOpen(true);

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const payload: SystemPayload = JSON.parse(raw);
        setEvents(payload.events || []);
        setLogs(payload.logs || []);
      } catch (e) {
        console.error("Storage Recovery Failed", e);
      }
    }
    setIsReady(true);
  }, []);

  // Auto-Update "Missed" Status
  useEffect(() => {
    if (!isReady || events.length === 0) return;

    const checkMissedTasks = () => {
      const now = new Date();
      setEvents(prev => prev.map(event => {
        if (event.status === "pending") {
          const eventDateTime = new Date(`${event.date}T${event.time}`);
          if (eventDateTime < now) {
            return { ...event, status: "missed" as const };
          }
        }
        return event;
      }));
    };

    checkMissedTasks();
    const timer = setInterval(checkMissedTasks, 60000); 

    return () => clearInterval(timer);
  }, [isReady, events.length]);

  // Persist State
  useEffect(() => {
    if (!isReady) return;
    const payload: SystemPayload = { events, logs: logs.slice(0, 50), version: SYSTEM_VERSION, lastSync: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [events, logs, isReady]);

  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    sessionStorage.setItem("app_status_seen", "true");
  };

  const createLog = (action: string, details: string) => {
    const uniqueId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newLog: SystemLog = { id: uniqueId, action: action as any, details, timestamp: Date.now() };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleSave = () => {
    // Ensure we have the minimum required fields before saving
    if (!formData.title || !formData.date || !formData.time || !formData.type || !formData.priority) return;
    
    if (formData.id) {
      setEvents(prev => prev.map(e => e.id === formData.id ? { ...e, ...formData } as PlannerEvent : e));
      createLog("UPDATE", `Modified: ${formData.title}`);
    } else {
      const newId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newEv: PlannerEvent = { 
        id: newId,
        title: formData.title,
        date: formData.date,
        time: formData.time,
        type: formData.type,
        priority: formData.priority,
        status: "pending", 
        history: { [formData.date]: "pending" }, 
        createdAt: Date.now() 
      };
      setEvents(prev => [...prev, newEv]);
      createLog("CREATE", `Added: ${formData.title}`);
    }
    
    setIsAddModalOpen(false);
    setFormData({ id: "", title: "", date: new Date().toISOString().split('T')[0], time: "09:00", type: "Work", priority: "medium" });
  };

  const toggleStatus = (id: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === id) {
        const nextStatus = e.status === "completed" ? "pending" : "completed";
        createLog("STATUS_TOGGLE", `${e.title} marked ${nextStatus}`);
        return { ...e, status: nextStatus, history: { ...e.history, [e.date]: nextStatus } };
      }
      return e;
    }));
  };

  const deleteWithUndo = (id: string) => {
    const target = events.find(e => e.id === id);
    setEvents(prev => prev.filter(e => e.id !== id));
    createLog("DELETE", `Removed: ${target?.title}`);
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
        createLog("RESCHEDULE", `Recovered: ${updatedEvents[taskIndex].title}`);
      }
      return updatedEvents;
    });
  };

  const rescheduleAllMissed = () => {
    setEvents(prev => {
      let updatedEvents = [...prev];
      let count = 0;
      updatedEvents = updatedEvents.map(e => {
        if (e.status === "missed") {
          const slot = findNextAvailableSlot(updatedEvents);
          if (slot) {
            count++;
            return { ...e, date: slot.date, time: slot.time, status: "pending" };
          }
        }
        return e;
      });
      if (count > 0) createLog("RESCHEDULE", `Auto-recovered ${count} tasks`);
      return updatedEvents;
    });
  };

  const filteredEvents = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    return events.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeTab === "today") return e.date === today;
      if (activeTab === "all") return true;

      return false; 
    }).sort((a, b) => {
      return new Date(`1970-01-01T${a.time}`).getTime() - new Date(`1970-01-01T${b.time}`).getTime();
    });
  }, [events, activeTab, searchQuery]);

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
    SYSTEM_VERSION,
    isReady,
    events,
    logs,
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    isAddModalOpen, setIsAddModalOpen,
    isStatusModalOpen, closeStatusModal,
    formData, setFormData,
    filteredEvents,
    analytics,
    handleSave,
    toggleStatus,
    deleteWithUndo,
    rescheduleTask,
    rescheduleAllMissed
  };
}