import { handleInactivityNudge } from "./nexNotificationBrain";

let started = false;

// Helper to get today's date string locally
const getTodayLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

/**
 * Tracks user mouse/keyboard activity to reset the idle timer.
 * Call this once in your root Layout or App component.
 */
export const initActivityTracker = () => {
  if (typeof window === "undefined") return;
  
  const updateActivity = () => {
    // Throttle localStorage writes to once every 10 seconds to save performance
    const last = Number(sessionStorage.getItem("temp_activity_tick")) || 0;
    if (Date.now() - last > 10000) {
      localStorage.setItem("last_activity", Date.now().toString());
      sessionStorage.setItem("temp_activity_tick", Date.now().toString());
    }
  };

  window.addEventListener("mousemove", updateActivity);
  window.addEventListener("keydown", updateActivity);
  window.addEventListener("click", updateActivity);
  window.addEventListener("scroll", updateActivity);
  
  // Set initial
  if (!localStorage.getItem("last_activity")) {
    localStorage.setItem("last_activity", Date.now().toString());
  }
};

/**
 * The core loop that checks if the user has abandoned the app.
 */
export const startInactivityEngine = (addNotification: any) => {
  if (started || typeof window === "undefined") return;
  started = true;

  // Run the check every 15 minutes
  setInterval(() => {
    checkInactivity(addNotification);
  }, 15 * 60 * 1000); 
};

const checkInactivity = (addNotification: any) => {
  const now = Date.now();
  const lastActivity = Number(localStorage.getItem("last_activity")) || now;
  const diffMs = now - lastActivity;
  const idleHours = diffMs / (1000 * 60 * 60);

  // Read tasks from local state to make the notification context-aware
  let pendingTasks = 0;
  try {
    const stateStr = localStorage.getItem("NEXTASK_V12_PRO_FINAL");
    if (stateStr) {
      const state = JSON.parse(stateStr);
      const today = getTodayLocal();
      if (state.tasks && Array.isArray(state.tasks)) {
        const total = state.tasks.length;
        const done = state.tasks.filter((t: any) => t.history[today] === true).length;
        pendingTasks = total - done;
      }
    }
  } catch (e) {
    console.error("Inactivity Engine failed to read tasks.", e);
  }

  // Pass logic to the brain for dispatch
  handleInactivityNudge(addNotification, idleHours, pendingTasks);
};