"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
// Import the necessary payload type from Supabase
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'; 
import { getSupabaseClient } from "@/lib/supabase"; 
import { NexNotification, NexModule } from './types';

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

export function useNotificationSystem(userId: string | null | undefined) {
  const [notifications, setNotifications] = useState<NexNotification[]>([]);
  const activeChannelRef = useRef<any>(null);
  
  const supabase = getSupabaseClient();

  const fetchNotifications = useCallback(async () => {
    if (!userId || !supabase) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ [UI FETCH] Error:", error.message);
    } else if (data) {
      setNotifications(data.map(normalizeNotification));
    }
  }, [userId, supabase]);

  useEffect(() => {
    if (!userId || !supabase) return;

    fetchNotifications();

    const instanceId = Math.random().toString(36).substring(7);
    const channelName = `notifications:${userId}:${instanceId}`;

    const channel = supabase.channel(channelName);
    activeChannelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        // ✅ Explicitly typed the payload to fix the build error
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === "INSERT") {
            const newNote = normalizeNotification(payload.new);
            if (!newNote.archived) {
              setNotifications(prev => {
                if (prev.some(n => n.id === newNote.id)) return prev;
                return [newNote, ...prev].slice(0, 50);
              });
            }
          } else {
            fetchNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      if (activeChannelRef.current) {
        supabase.removeChannel(activeChannelRef.current);
        activeChannelRef.current = null;
      }
    };
  }, [userId, fetchNotifications, supabase]);

  const addNotification = useCallback(async (
    module: NexModule, title: string, body: string, 
    priority: 'low' | 'medium' | 'high' = 'medium', actionUrl: string = "/" 
  ) => {
    if (!userId || !supabase) {
      console.warn("⚠️ [DB SAVE] Blocked: No userId or Supabase client");
      return;
    }

    const { data, error } = await supabase.from("notifications").insert({
      user_id: userId, 
      module, 
      title, 
      body, 
      priority, 
      action_url: actionUrl, 
      read: false, 
      archived: false
    }).select();

    if (!error) {
      if (priority !== 'low') {
        sendToServiceWorker(title, body, actionUrl);
      }
    } else {
      console.error("❌ [DB SAVE] Error:", error.message);
    }
  }, [userId, supabase]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (supabase) {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    }
  }, [supabase]);

  const clearAll = useCallback(async () => {
    if (!userId || !supabase) return;
    setNotifications([]);
    await supabase.from("notifications")
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