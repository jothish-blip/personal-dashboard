"use client";

import { useState, useEffect, useCallback } from 'react';
import { NexNotification, NexModule } from './types';

const recentNotifications = new Set<string>();

export const sendToServiceWorker = async (title: string, body: string, url: string = "/") => {
  const signature = `${title}:${body}`;
  if (recentNotifications.has(signature)) return; 
  
  recentNotifications.add(signature);
  setTimeout(() => recentNotifications.delete(signature), 2000); 

  if (!("Notification" in window)) return;

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return; 
  }

  if (Notification.permission === "denied") return;

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SHOW_NOTIFICATION",
      title,
      body,
      url
    });
  } else {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
};

export function useNotificationSystem() {
  const [notifications, setNotifications] = useState<NexNotification[]>([]);

  const syncFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const saved = localStorage.getItem("nex_global_notifications");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // ✅ Fix: Use functional update to avoid unnecessary re-renders
        setNotifications(prev => {
          if (JSON.stringify(prev) === saved) return prev;
          return parsed;
        });
      } catch (e) {
        console.error("Failed to load notifications", e);
      }
    }
  }, []);

  useEffect(() => {
    syncFromStorage();

    const handleGlobalUpdate = () => syncFromStorage();
    window.addEventListener("nex_notification_update", handleGlobalUpdate);
    window.addEventListener("storage", handleGlobalUpdate);

    return () => {
      window.removeEventListener("nex_notification_update", handleGlobalUpdate);
      window.removeEventListener("storage", handleGlobalUpdate);
    };
  }, [syncFromStorage]);

  const addNotification = useCallback((
    module: NexModule, 
    title: string, 
    body: string, 
    priority: 'low' | 'medium' | 'high' = 'medium',
    actionUrl: string = "/" 
  ) => {
    // ✅ Logic inside setTimeout ensures this runs AFTER the current render cycle
    setTimeout(() => {
      const saved = localStorage.getItem("nex_global_notifications");
      let current: NexNotification[] = saved ? JSON.parse(saved) : [];

      if (current.length > 0 && current[0].title === title && current[0].body === body) return;

      const newNote: NexNotification = {
        id: crypto.randomUUID(),
        module, title, body,
        timestamp: Date.now(),
        read: false,
        priority, actionUrl, 
      };

      const updated = [newNote, ...current].slice(0, 50);
      localStorage.setItem("nex_global_notifications", JSON.stringify(updated));
      window.dispatchEvent(new Event("nex_notification_update"));

      if (priority !== 'low') {
        sendToServiceWorker(title, body, actionUrl);
      }
    }, 0);
  }, []);

  const markAsRead = useCallback((id: string) => {
    const saved = localStorage.getItem("nex_global_notifications");
    if (!saved) return;
    const current: NexNotification[] = JSON.parse(saved);
    const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
    
    localStorage.setItem("nex_global_notifications", JSON.stringify(updated));
    window.dispatchEvent(new Event("nex_notification_update"));
  }, []);

  const clearAll = useCallback(() => {
    localStorage.setItem("nex_global_notifications", JSON.stringify([]));
    window.dispatchEvent(new Event("nex_notification_update"));
  }, []);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    addNotification,
    markAsRead,
    clearAll
  };
}