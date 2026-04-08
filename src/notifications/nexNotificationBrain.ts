import { sendToServiceWorker } from "./useNotificationSystem";
import { NexModule } from "./types";

// --- CORE UTILS ---

/**
 * 🔒 ANTI-SPAM ENGINE
 * Prevents the same notification from firing multiple times within a cooldown window.
 */
const canNotify = (key: string, cooldown: number): boolean => {
  if (typeof window === "undefined") return false;
  const now = Date.now();
  const last = Number(localStorage.getItem(`nex_brain_lock_${key}`)) || 0;

  if (now - last > cooldown) {
    localStorage.setItem(`nex_brain_lock_${key}`, now.toString());
    return true;
  }
  return false;
};

/**
 * 🎯 CENTRAL DISPATCHER
 * Routes to BOTH the Database (UI Bell Icon) AND Service Worker (OS Popups)
 */
const routeNotification = (
  addNote: any, 
  module: NexModule,
  title: string,
  body: string,
  url: string,
  priority: 'high' | 'medium' | 'low'
) => {
  if (addNote) addNote(module, title, body, priority, url);
  if (priority === 'high' || priority === 'medium') {
    sendToServiceWorker(title, body, url);
  }
};

// --- SUBSYSTEM: ALARMS (URGENT) ---

export const handleAlarm = (addNote: any, title: string, body: string, url: string = "/") => {
  // Alarms bypass standard cooldowns and are always HIGH priority
  routeNotification(addNote, "system", `🚨 ALARM: ${title}`, body, url, "high");
};

// --- SUBSYSTEM: INACTIVITY & ENGAGEMENT (COME BACK!) ---

export const handleInactivityNudge = (addNote: any, idleHours: number, pendingTasks: number) => {
  // 2 Hours Idle + Tasks remaining
  if (idleHours >= 2 && idleHours < 5 && pendingTasks > 0 && canNotify("nudge_2hr", 4 * 60 * 60 * 1000)) {
    routeNotification(addNote, "task", "Momentum Dropped ⚠️", `You have ${pendingTasks} tasks waiting. Come back and knock one out.`, "/", "high");
  }
  
  // 5 Hours Idle
  if (idleHours >= 5 && idleHours < 24 && canNotify("nudge_5hr", 12 * 60 * 60 * 1000)) {
    routeNotification(addNote, "system", "System Idle 🛑", "Your execution engine is cooling down. Log in to regain focus.", "/", "medium");
  }

  // 24 Hours Idle (Critical Retention)
  if (idleHours >= 24 && canNotify("nudge_24hr", 24 * 60 * 60 * 1000)) {
    routeNotification(addNote, "system", "Consistency at Risk 📉", "A day skipped is momentum lost. Open the app to secure your streak.", "/", "high");
  }
};

// --- SUBSYSTEM: TASK INTELLIGENCE ---

export const handleTaskUpdate = (addNote: any, tasks: any[], today: string) => {
  const total = tasks.length;
  const done = tasks.filter((t: any) => t.history[today]).length;
  const pending = total - done;
  const percentage = total > 0 ? (done / total) * 100 : 0;

  if (pending === 0 && total > 0 && canNotify("task_complete", 4 * 60 * 60 * 1000)) {
    routeNotification(addNote, "task", "Perfect Execution 🏆", "All objectives completed. System efficiency at 100%.", "/", "high");
  }

  if (percentage >= 50 && percentage < 100 && canNotify("mid_progress", 2 * 60 * 60 * 1000)) {
    routeNotification(addNote, "task", "Halfway There ⚡", `You've secured ${done}/${total} objectives. Keep momentum.`, "/", "medium");
  }

  if (pending > 0 && done > 0 && canNotify("task_low_update", 30 * 60 * 1000)) {
    routeNotification(addNote, "task", "Progress Update", `${done} done, ${pending} remaining.`, "/", "low");
  }
};

// --- SUBSYSTEM: PLANNER & EVENTS ---

export const handlePlannerEvent = (addNote: any, event: any, type: "1h" | "10m" | "now") => {
  const key = `planner_${type}_${event.id}`;
  if (!canNotify(key, 2 * 60 * 60 * 1000)) return;

  const config = {
    "1h": { title: "Plan Ahead ⏳", body: `${event.title} starts in 1 hour. Prep required.`, priority: "medium" as const },
    "10m": { title: "Upcoming Event ⏰", body: `${event.title} starts in 10 minutes.`, priority: "high" as const },
    "now": { title: "Event Starting ▶️", body: `${event.title} is starting now.`, priority: "high" as const }
  };

  const { title, body, priority } = config[type];
  routeNotification(addNote, "planner", title, body, "/calender-event", priority);
};

// --- SUBSYSTEM: FOCUS & FLOW ---

export const handleFocusState = (addNote: any, type: 'start' | 'end' | 'nudge', durationInSeconds?: number) => {
  if (type === 'nudge' && canNotify("focus_nudge", 12 * 60 * 60 * 1000)) {
    routeNotification(addNote, "focus", "Ready to Focus? 🎯", "It's been a while since your last deep work session. Lock in.", "/focus", "medium");
  }

  if (type === 'end' && durationInSeconds && durationInSeconds > 25 * 60 && canNotify("deep_focus_end", 2 * 60 * 60 * 1000)) {
    routeNotification(addNote, "focus", "Deep Focus Achieved 🔥", `You locked in for ${Math.floor(durationInSeconds / 60)} minutes. Great work.`, "/focus", "high");
  }
};

// --- SUBSYSTEM: WORKSPACE (NOTES) ---

export const handleWorkspaceAction = (addNote: any, type: 'save' | 'deepWork' | 'nudge') => {
  if (type === 'nudge' && canNotify("ws_nudge", 24 * 60 * 60 * 1000)) {
    routeNotification(addNote, "mini", "Review Your Ideas 💡", "You have pending notes in your workspace. Organize your thoughts.", "/mini-nisc", "low");
  }

  if (type === 'save' && canNotify("ws_autosave", 30 * 60 * 1000)) {
    routeNotification(addNote, "mini", "Workspace Synced 💾", "Your thoughts and documents are secured.", "/mini-nisc", "low");
  }

  if (type === 'deepWork' && canNotify("ws_deepwork", 45 * 60 * 1000)) {
    routeNotification(addNote, "focus", "Deep Work Pattern 🧠", "Heavy productivity detected in the workspace.", "/mini-nisc", "medium");
  }
};

// --- SUBSYSTEM: GLOBAL SUMMARIES ---

export const handleGlobalState = (addNote: any, tasks: any[], events: any[] = []) => {
  const today = new Date().toISOString().split("T")[0];
  const hour = new Date().getHours();
  
  const done = tasks.filter((t: any) => t.history[today]).length;
  const total = tasks.length;
  const pending = total - done;
  const todayEvents = events.filter((e: any) => e.date === today && e.status === 'pending').length;

  if (hour >= 7 && hour <= 10 && canNotify("morning_summary", 18 * 60 * 60 * 1000)) {
    routeNotification(addNote, "system", "Morning Strategy 🌅", `Today: ${total} objectives and ${todayEvents} events planned.`, "/", "high");
  }

  if (hour >= 21 && hour <= 23 && canNotify("evening_summary", 18 * 60 * 60 * 1000)) {
    const message = done === total && total > 0 ? "Perfect execution today. All targets secured." : `${done}/${total} objectives completed. Review for tomorrow.`;
    routeNotification(addNote, "diary", "Daily Debrief 🌙", message, "/diary", "high");
  }
};

// --- SUBSYSTEM: DIARY & REFLECTION ---

export const handleDiary = (addNote: any, type: "reminder" | "missed" | "nudge", dateStr?: string) => {
  if (type === "nudge" && canNotify("diary_nudge", 24 * 60 * 60 * 1000)) {
    routeNotification(addNote, "diary", "Clear Your Mind 🧘", "Taking 5 minutes to journal clears cognitive load.", "/diary", "medium");
  }

  if (type === "reminder" && canNotify("diary_reminder", 12 * 60 * 60 * 1000)) {
    routeNotification(addNote, "diary", "Reflection Pending 📓", "Capture your day's insights before they fade.", "/diary", "high");
  }

  if (type === "missed" && dateStr && canNotify(`diary_missed_${dateStr}`, 24 * 60 * 60 * 1000)) {
    routeNotification(addNote, "diary", "Missed Reflection ⚠️", `You skipped your entry on ${dateStr}. System consistency drop.`, "/diary", "high");
  }
};