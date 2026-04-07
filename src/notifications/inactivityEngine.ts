// src/notifications/inactivityEngine.ts

import { sendToServiceWorker } from "./useNotificationSystem";

let started = false;

// Helper to get today's date string
const getTodayLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export const startInactivityEngine = () => {
  if (started) return;
  started = true;

  // Set initial activity time if it doesn't exist so it doesn't instantly fire on first load
  if (!localStorage.getItem("last_activity")) {
    localStorage.setItem("last_activity", Date.now().toString());
  }

  // Run the check every 10 minutes
  setInterval(() => {
    checkInactivity();
  }, 10 * 60 * 1000); 
};

const checkInactivity = () => {
  const now = Date.now();

  // 🔥 ANTI-SPAM LOCK: Prevent duplicate notifications within a 2-hour window
  const lastSent = Number(localStorage.getItem("last_inactive_alert")) || 0;
  if (now - lastSent < 2 * 60 * 60 * 1000) return;

  const lastActivity = Number(localStorage.getItem("last_activity")) || now;
  const diff = now - lastActivity;

  // Calculate if they have completed 0 tasks today
  let completedToday = 0;
  try {
    const stateStr = localStorage.getItem("NEXTASK_V12_PRO_FINAL");
    if (stateStr) {
      const state = JSON.parse(stateStr);
      const today = getTodayLocal();
      if (state.tasks) {
        completedToday = state.tasks.filter((t: any) => t.history[today] === true).length;
      }
    }
  } catch (e) {
    console.error("Inactivity Engine failed to read tasks.");
  }

  const twoHours = 2 * 60 * 60 * 1000;
  const fiveHours = 5 * 60 * 60 * 1000;
  const tenMinuteWindow = 11 * 60 * 1000; // Gives the setInterval time to catch the condition

  let alertSent = false;

  // 🔥 2 HOURS INACTIVE
  if (diff > twoHours && diff < twoHours + tenMinuteWindow) {
    const message = completedToday === 0 
      ? "You haven't completed ANY tasks today. Start now and build your momentum."
      : "You haven't worked on any tasks recently. Regain your momentum.";

    sendToServiceWorker(
      "Momentum Dropped ⚠️",
      message,
      "/"
    );
    alertSent = true;
  }

  // 🔥 5 HOURS INACTIVE
  else if (diff > fiveHours && diff < fiveHours + tenMinuteWindow) {
    sendToServiceWorker(
      "System Idle 🛑",
      "Your execution engine has been idle for 5 hours. Take control of your day.",
      "/"
    );
    alertSent = true;
  }

  // ✅ Register the lock only if an alert was successfully fired
  if (alertSent) {
    localStorage.setItem("last_inactive_alert", now.toString());
  }
};