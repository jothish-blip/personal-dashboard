"use client";

import { useEffect } from "react";
import { startInactivityEngine } from "@/notifications/inactivityEngine";
import { sendToServiceWorker } from "@/notifications/useNotificationSystem"; // Import the OS trigger

// Helper: Timestamp-based lock for the planner notifications
const acquireLock = (lockKey: string): boolean => {
  const last = Number(localStorage.getItem(lockKey) || 0);
  const now = Date.now();
  if (now - last > 2 * 60 * 60 * 1000) {
    localStorage.setItem(lockKey, now.toString());
    return true;
  }
  return false;
};

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // 1. REGISTER OS SERVICE WORKER
    if ("serviceWorker" in navigator) {
      const registerSW = async () => {
        try { await navigator.serviceWorker.register("/sw.js"); } 
        catch (err) { console.error("Service Worker registration failed:", err); }
      };

      if (document.readyState === "complete") { registerSW(); } 
      else { window.addEventListener("load", registerSW); }
    }

    // 2. START INACTIVITY ENGINE (Tasks)
    startInactivityEngine();

    // 3. START PLANNER ENGINE (Directly inline, no extra file needed)
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

          const lock1h = `notified_1h_${event.id}`;
          const lock10m = `notified_10m_${event.id}`;
          const lockNow = `notified_now_${event.id}`;

          // 🔥 1 HOUR REMINDER (60 to 40 minutes)
          if (diff <= 3600000 && diff > 2400000) {
            if (acquireLock(lock1h)) {
              sendToServiceWorker("Plan Ahead ⏳", `${event.title} begins in 1 hour.`, "/calender-event");
            }
          }
          // 🔥 10 MINUTE REMINDER (10 to 5 minutes)
          else if (diff <= 600000 && diff > 300000) {
            if (acquireLock(lock10m)) {
              sendToServiceWorker("Upcoming Event ⏰", `${event.title} begins in 10 minutes.`, "/calender-event");
            }
          }
          // 🔥 EVENT STARTING NOW (1 min before to 5 mins after)
          else if (diff <= 60000 && diff > -300000) {
            if (acquireLock(lockNow)) {
              sendToServiceWorker("Event Starting ▶️", `${event.title} is starting now.`, "/calender-event");
            }
          }
        });
      } catch (e) {
        console.error("Planner Engine Failed:", e);
      }
    }, 60000); // Check every 60 seconds

    // Cleanup timer if the bootstrapper ever unmounts
    return () => clearInterval(plannerTimer);

  }, []);

  return null;
}