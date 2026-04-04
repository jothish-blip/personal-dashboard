import { useState, useEffect, useMemo } from "react";
import { PlannerEvent, SystemLog, SystemPayload, TaskType, Priority } from "./types";

const SYSTEM_VERSION = 1.2;
const STORAGE_KEY = "matrix_planner_v5_pro";

export function usePlannerSystem() {
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [activeTab, setActiveTab] = useState<"today" | "pending" | "completed" | "logs">("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    title: "",
    date: new Date().toISOString().split('T')[0],
    time: "09:00",
    type: "Work" as TaskType,
    priority: "medium" as Priority
  });

  useEffect(() => {
    const hasSeenStatus = sessionStorage.getItem("matrix_status_seen");
    if (!hasSeenStatus) setIsStatusModalOpen(true);

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const payload: SystemPayload = JSON.parse(raw);
        setEvents(payload.events || []);
        setLogs(payload.logs || []);
      } catch (e) {
        console.error("System Restore Failed", e);
      }
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const payload: SystemPayload = { events, logs: logs.slice(0, 50), version: SYSTEM_VERSION, lastSync: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [events, logs, isReady]);

  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    sessionStorage.setItem("matrix_status_seen", "true");
  };

  const createLog = (action: SystemLog["action"], details: string) => {
    const newLog: SystemLog = { id: `log_${Date.now()}`, action, details, timestamp: Date.now() };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleSave = () => {
    if (!formData.title) return;
    if (formData.id) {
      setEvents(prev => prev.map(e => e.id === formData.id ? { ...e, ...formData } : e));
      createLog("UPDATE", `Modified task: ${formData.title}`);
    } else {
      const newId = `mtx_${Date.now()}`;
      const newEv: PlannerEvent = { ...formData, id: newId, status: "pending", history: { [formData.date]: "pending" }, createdAt: Date.now() };
      setEvents(prev => [...prev, newEv]);
      createLog("CREATE", `New entry: ${formData.title}`);
    }
    setIsAddModalOpen(false);
    setFormData({ id: "", title: "", date: new Date().toISOString().split('T')[0], time: "09:00", type: "Work", priority: "medium" });
  };

  const toggleStatus = (id: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === id) {
        const nextStatus = e.status === "completed" ? "pending" : "completed";
        createLog("STATUS_TOGGLE", `${e.title} -> ${nextStatus.toUpperCase()}`);
        return { ...e, status: nextStatus, history: { ...e.history, [e.date]: nextStatus } };
      }
      return e;
    }));
  };

  const deleteWithUndo = (id: string) => {
    const target = events.find(e => e.id === id);
    setEvents(prev => prev.filter(e => e.id !== id));
    createLog("DELETE", `Removed task: ${target?.title}`);
  };

  const filteredEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeTab === "pending") return e.status === "pending";
      if (activeTab === "completed") return e.status === "completed";
      if (activeTab === "today") return e.date === today;
      return false;
    }).sort((a, b) => a.time.localeCompare(b.time));
  }, [events, activeTab, searchQuery]);

  const analytics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEvents = events.filter(e => e.date === todayStr);
    const statusCounts = {
      completed: events.filter(e => e.status === "completed").length,
      pending: events.filter(e => e.status === "pending").length,
      missed: events.filter(e => e.status === "missed").length
    };
    return {
      score: (statusCounts.completed * 2) - statusCounts.missed,
      rate: events.length ? Math.round((statusCounts.completed / events.length) * 100) : 0,
      statusCounts,
      today: { done: todayEvents.filter(e => e.status === "completed").length, total: todayEvents.length }
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
    deleteWithUndo
  };
}