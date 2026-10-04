"use client";

import { useState, useEffect, useCallback } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'; 
import { getSupabaseClient } from "@/lib/supabase"; 
import { NexNotification, NexModule } from "@/notifications/types/types";

const recentNotifications = new Set<string>();

export const sendToServiceWorker = async (title: string, body: string, url: string = "/") => {
  const signature = `${title}:${body}`;
  if (recentNotifications.has(signature)) return; 
  recentNotifications.add(signature);
  setTimeout(() => recentNotifications.delete(signature), 2000); 

  if (!("Notification" in window)) return;
  if (Notification.permission === "default") await Notification.requestPermission();
  if (Notification.permission !== "granted") return;

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "SHOW_NOTIFICATION", title, body, url });
  } else {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
};

const normalizeNotification = (n: any): NexNotification => ({
  ...n,
  actionUrl: n.action_url,
  timestamp: new Date(n.created_at).getTime(),
  archived: n.archived ?? false, 
});

// -------------------------------------------------------------
// GLOBAL SINGLETON STATE (Ensures only 1 Realtime Subscription)
// -------------------------------------------------------------
let globalNotifications: NexNotification[] = [];
let globalSubscribers = new Set<(notes: NexNotification[]) => void>();
let globalActiveChannel: any = null;
let currentUserId: string | null = null;
let isFetching = false;

const notifySubscribers = () => {
  globalSubscribers.forEach(fn => fn(globalNotifications));
};

const fetchGlobalNotifications = async (userId: string, supabase: any) => {
  if (isFetching) return;
  isFetching = true;
  
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!error && data) {
    globalNotifications = data.map(normalizeNotification);
    notifySubscribers();
  }
  
  isFetching = false;
};

const initGlobalSubscription = (userId: string, supabase: any) => {
  if (currentUserId === userId && globalActiveChannel) return; // Already subscribed
  
  // Clean up existing channel if switching users
  if (globalActiveChannel) {
    supabase.removeChannel(globalActiveChannel);
    globalActiveChannel = null;
  }
  
  currentUserId = userId;
  fetchGlobalNotifications(userId, supabase);

  const channelName = `notifications:global:${userId}`;
  const channel = supabase.channel(channelName);
  
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
    (payload: RealtimePostgresChangesPayload<any>) => {
      if (payload.eventType === "INSERT") {
        const newNote = normalizeNotification(payload.new);
        if (!newNote.archived) {
          if (!globalNotifications.some(n => n.id === newNote.id)) {
            globalNotifications = [newNote, ...globalNotifications].slice(0, 50);
            notifySubscribers();
          }
        }
      } else {
        // Debounce updates slightly
        fetchGlobalNotifications(userId, supabase);
      }
    }
  ).subscribe();

  globalActiveChannel = channel;
};


export function useNotificationSystem(userId: string | null | undefined) {
  const [notifications, setNotifications] = useState<NexNotification[]>(globalNotifications);
  
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!userId || !supabase) {
      if (globalSubscribers.size === 0 && globalActiveChannel) {
        // We shouldn't necessarily kill it immediately in case another mounts soon, 
        // but if userId becomes null (logout), we definitely clear it.
        if (currentUserId) {
            currentUserId = null;
            globalNotifications = [];
            setNotifications([]);
            if (supabase && globalActiveChannel) supabase.removeChannel(globalActiveChannel);
            globalActiveChannel = null;
        }
      }
      return;
    }

    // Subscribe local state to global state
    globalSubscribers.add(setNotifications);
    
    // Ensure global subscription is running for this user
    initGlobalSubscription(userId, supabase);

    // Initial sync just in case
    setNotifications(globalNotifications);

    return () => {
      globalSubscribers.delete(setNotifications);
      // Optional: if (globalSubscribers.size === 0) cleanup channel
    };
  }, [userId, supabase]);

  const addNotification = useCallback(async (
    module: NexModule, title: string, body: string, 
    priority: 'low' | 'medium' | 'high' = 'medium', actionUrl: string = "/" 
  ) => {
    if (!userId || !supabase) return;

    // Prevent duplicate generation locally
    const recentTime = new Date(Date.now() - 30000).toISOString(); 
    const { data: existing } = await (supabase as any)
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("title", title)
      .gte("created_at", recentTime)
      .maybeSingle();

    if (existing) return; 

    const { error } = await (supabase as any).from("notifications").insert({
      user_id: userId, 
      module, 
      title, 
      body, 
      priority, 
      action_url: actionUrl, 
      read: false, 
      archived: false
    }).select();

    if (!error && priority !== 'low') {
      sendToServiceWorker(title, body, actionUrl);
    }
  }, [userId, supabase]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic UI update on global state
    globalNotifications = globalNotifications.map(n => n.id === id ? { ...n, read: true } : n);
    notifySubscribers();
    
    if (supabase) {
      await (supabase as any).from("notifications").update({ read: true }).eq("id", id);
    }
  }, [supabase]);

  const clearAll = useCallback(async () => {
    if (!userId || !supabase) return;
    
    // Optimistic UI clear
    globalNotifications = [];
    notifySubscribers();
    
    await (supabase as any).from("notifications")
      .update({ archived: true })
      .eq("user_id", userId)
      .eq("archived", false);
  }, [userId, supabase]);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    addNotification,
    markAsRead,
    clearAll
  };
}