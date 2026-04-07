// src/notifications/nexNotificationBrain.ts

import { sendToServiceWorker } from "./useNotificationSystem";

// --- CORE UTILS ---

/**
 * 🔥 CORE ENGINE: Uses localStorage to prevent spam across page reloads and tabs.
 * Includes "Adaptive Frequency" logic by allowing cooldown overrides.
 */
const canNotify = (key: string, cooldown: number) => {
  if (typeof window === "undefined") return false;
  const now = Date.now();
  const last = Number(localStorage.getItem(`brain_lock_${key}`)) || 0;

  if (now - last > cooldown) {
    localStorage.setItem(`brain_lock_${key}`, now.toString());
    return true;
  }
  return false;
};

/**
 * 🎯 PRIORITY ROUTING SYSTEM
 */
const routeNotification = (
  title: string,
  body: string,
  url: string,
  priority: 'high' | 'medium' | 'low'
) => {
  // High and Medium priority trigger a Native OS Popup via Service Worker
  if (priority === 'high' || priority === 'medium') {
    sendToServiceWorker(title, body, url);
  }
  
  // Note: 'low' priority items are typically handled by React hooks 
  // for internal UI "Bell" updates (silent feed).
};

/**
 * 🧠 USER STATE DETECTOR
 * Determines the cognitive/productivity state of the user.
 */
const getUserState = (tasks: any[], today: string) => {
  const total = tasks.length;
  const done = tasks.filter((t: any) => t.history[today]).length;
  const pending = total - done;

  if (total > 0 && pending === 0) return "completed";
  if (pending > 5) return "overloaded";
  if (done === 0 && total > 0) return "inactive";
  return "active";
};

// --- TASKS & PROGRESS ---

export const handleTaskUpdate = (tasks: any[], today: string) => {
  const total = tasks.length;
  const done = tasks.filter((t: any) => t.history[today]).length;
  const pending = total - done;
  const percentage = total > 0 ? (done / total) * 100 : 0;

  // 1. Progress Intelligence: Motivation Curve (Halfway point)
  if (percentage >= 50 && percentage < 80 && canNotify("mid_progress", 2 * 60 * 60 * 1000)) {
    routeNotification(
      "Halfway There ⚡",
      `You've crossed 50% (${done}/${total}). Keep that momentum.`,
      "/",
      "medium"
    );
  }

  // 2. Perfect completion: Priority HIGH
  if (pending === 0 && total > 0 && canNotify("task_complete", 60 * 60 * 1000)) {
    routeNotification(
      "Perfect Execution 🏆",
      "All objectives completed today. Elite performance.",
      "/",
      "high"
    );
  }

  // 3. Low priority silent update
  if (pending > 0 && done > 0 && canNotify("task_progress_low", 15 * 60 * 1000)) {
    routeNotification("Task Update", `${done}/${total} done.`, "/", "low");
  }
};

// --- PLANNER ---

export const handlePlannerEvent = (event: any, type: "1h" | "10m" | "now") => {
  const key = `planner_${type}_${event.id}`;
  if (!canNotify(key, 2 * 60 * 60 * 1000)) return;

  const titles = {
    "1h": "Plan Ahead ⏳",
    "10m": "Upcoming Event ⏰",
    "now": "Event Starting ▶️"
  };

  routeNotification(titles[type], `${event.title}`, "/calender-event", "high");
};

// --- FOCUS & WORKSPACE ---

/**
 * 🔥 FOCUS-AWARE SYSTEM
 * Detects high-quality execution flow.
 */
export const handleFocusState = (isActive: boolean, durationInSeconds: number) => {
  if (isActive && durationInSeconds > 25 * 60 && canNotify("deep_focus", 60 * 60 * 1000)) {
    routeNotification(
      "Deep Focus Achieved 🔥",
      "You’re in a strong execution flow. Keep the zone locked.",
      "/focus",
      "medium"
    );
  }
};

export const handleWorkspaceAction = (type: 'create' | 'delete' | 'save' | 'deepWork', details?: string) => {
  if (type === 'save' && canNotify("ws_autosave", 30 * 60 * 1000)) {
    routeNotification("Workspace Synced 💾", "Changes secured.", "/mini-nisc", "low");
  }

  if (type === 'deepWork' && canNotify("ws_deepwork", 60 * 60 * 1000)) {
    routeNotification("Deep Work Mode 🧠", "High productivity flow detected.", "/mini-nisc", "medium");
  }
};

// --- GLOBAL INTELLIGENCE (TIME, STATE, & TONE) ---

export const handleGlobalState = (tasks: any[], events: any[] = []) => {
  const today = new Date().toISOString().split("T")[0];
  const hour = new Date().getHours();
  
  const pendingTasks = tasks.filter((t: any) => !t.history[today]).length;
  const doneTasks = tasks.filter((t: any) => t.history[today]).length;
  const totalTasks = tasks.length;
  const todayEvents = events.filter((e: any) => e.date === today && e.status === 'pending').length;

  const state = getUserState(tasks, today);

  // 1. MORNING STRATEGY (7 AM - 10 AM)
  if (hour >= 7 && hour <= 10 && canNotify("morning_planning", 18 * 60 * 60 * 1000)) {
    routeNotification(
      "Morning Strategy 🌅",
      `Today: ${totalTasks} objectives and ${todayEvents} events. Set your intentions.`,
      "/",
      "medium"
    );
    return;
  }

  // 2. BEHAVIORAL REACTIVITY (Inactive State)
  if (state === "inactive" && hour > 11 && canNotify("behavior_inactive", 4 * 60 * 60 * 1000)) {
    routeNotification(
      "No Progress Detected ⏳",
      "Start with one small task to build momentum.",
      "/",
      "medium"
    );
  }

  // 3. SMART GROUPED SUMMARY (Adaptive Frequency)
  // Cooldown is shorter (1h) if overloaded to provide more guidance, longer (3h) if normal.
  const summaryCooldown = state === "overloaded" ? 1 * 60 * 60 * 1000 : 3 * 60 * 60 * 1000;
  if (canNotify("smart_summary", summaryCooldown)) {
    const tone = state === "overloaded" ? "urgent" : "calm";
    const body = tone === "urgent" 
      ? `High Pressure: ${pendingTasks} tasks & ${todayEvents} events. Prioritize now.` 
      : `System Summary: ${pendingTasks} tasks pending, ${todayEvents} events ahead.`;

    routeNotification("System Summary 🧠", body, "/", "medium");
  }

  // 4. EVENING DEBRIEF (9 PM - 11 PM)
  if (hour >= 21 && hour <= 23 && canNotify("evening_summary", 18 * 60 * 60 * 1000)) {
    routeNotification(
      "Daily Debrief 🌙",
      doneTasks === totalTasks 
        ? "Perfect execution today! All objectives secured." 
        : `${doneTasks}/${totalTasks} objectives completed. Reflect on your progress.`,
      "/diary",
      "high"
    );
  }

  // 5. NEXT-DAY PREPARATION (10 PM+)
  if (hour >= 22 && canNotify("next_day_prep", 18 * 60 * 60 * 1000)) {
    routeNotification(
      "Prepare Tomorrow 🧭",
      "Set up your plan for the next day to hit the ground running.",
      "/calender-event",
      "medium"
    );
  }
};

// --- DIARY ---

export const handleDiary = (type: "reminder" | "missed", dateStr?: string) => {
  if (type === "reminder" && canNotify("diary_reminder", 12 * 60 * 60 * 1000)) {
    routeNotification("Daily Reflection Pending 🌙", "Capture your day before it ends.", "/diary", "medium");
  }

  if (type === "missed" && dateStr && canNotify(`diary_missed_${dateStr}`, 24 * 60 * 60 * 1000)) {
    routeNotification("Missed Reflection ⚠️", `You skipped your diary on ${dateStr}.`, "/diary", "high");
  }
};