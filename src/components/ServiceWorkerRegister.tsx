"use client";

import { useEffect, useState } from "react";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { startInactivityEngine, initActivityTracker } from "@/notifications/inactivityEngine"; // ✅ Added initActivityTracker
import { useNotificationSystem } from "@/notifications/useNotificationSystem";
import { handlePlannerEvent } from "@/notifications/nexNotificationBrain";
import { getSupabaseClient } from "@/lib/supabase";

export default function ServiceWorkerRegister() {
  const supabase = getSupabaseClient();
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Initialize the notification system
  const { addNotification } = useNotificationSystem(userId);

  // 2. Auth Listener with explicit types to satisfy TS
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    checkUser();

    // ✅ Added explicit types for _event and session
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUserId(session?.user?.id || null);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    // 3. REGISTER OS SERVICE WORKER
    if ("serviceWorker" in navigator) {
      const registerSW = async () => {
        try {
          await navigator.serviceWorker.register("/sw.js");
        } catch (err) {
          console.error("Service Worker registration failed:", err);
        }
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
      }
    }

    // ✅ Wait for user to be logged in before starting intelligent tracking
    if (!userId) return;

    // 4. START INACTIVITY ENGINE & TRACKER
    initActivityTracker(); // 🔥 Listens to mouse/keyboard to track idle time
    startInactivityEngine(addNotification); // 🔥 Passes DB link so it can push UI notifications

    // 5. START PLANNER ENGINE
    const plannerTimer = setInterval(() => {
      try {
        const raw = localStorage.getItem("taskflow_planner_v1");
        if (!raw) return;

        const payload = JSON.parse(raw);
        const events = payload.events || [];
        const now = Date.now();

        events.forEach((event: any) => {
          if (event.status !== "pending") return;

          const eventTime = new Date(`${event.date}T${event.time}`).getTime();
          const diff = eventTime - now;

          // 🔥 Reminders delegated to centralized Brain
          if (diff <= 3600000 && diff > 2400000) {
            handlePlannerEvent(addNotification, event, "1h");
          }
          else if (diff <= 600000 && diff > 300000) {
            handlePlannerEvent(addNotification, event, "10m");
          }
          else if (diff <= 60000 && diff > -300000) {
            handlePlannerEvent(addNotification, event, "now");
          }
        });
      } catch (e) {
        console.error("Planner Engine Failed:", e);
      }
    }, 60000);

    return () => clearInterval(plannerTimer);
  }, [userId, addNotification]);

  return null;
}