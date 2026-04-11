// 🔹 FOCUS MODES
export type FocusMode = "pomodoro" | "deepWork" | "custom";


// 🔹 TASK REFERENCE
export interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
}


// 🔹 DISTRACTION LOG
export interface Distraction {
  id: string;
  reason: string;
  timestamp: number; // epoch ms
}


// 🔥 ACTIVE SESSION (RUNNING SESSION STATE)
export interface ActiveSession {
  id: string;

  // Task binding
  taskId: string | null;
  taskTitle: string;

  // Mode
  mode: FocusMode;

  // 🔥 Core timing (SOURCE OF TRUTH)
  startTime: number; // epoch ms

  // 🔥 Planned duration (in seconds)
  initialDuration: number;

  // 🔥 Completion tracking
  completedAt?: number;     // when countdown reached 0
  extraStartTime?: number;  // when extra focus started

  // Distractions during session
  distractions: Distraction[];

  // 🔥 Optional sync helper (for multi-device freshness)
  lastUpdated?: number;
}


// 🔥 COMPLETED SESSION (PERSISTED HISTORY)
export interface FocusSession extends ActiveSession {
  // When session fully ended
  endTime: number;

  // 🔹 Planned focus time (seconds)
  durationSeconds: number;

  // 🔹 Total elapsed including pauses etc.
  totalSessionSeconds: number;

  // 🔥 Extra focus (after completion)
  extraDuration: number; // seconds

  // 🔥 Actual total time (focus + extra)
  actualDuration: number; // seconds

  // ISO date (derived from startTime)
  date: string;

  // Performance score
  score: number;

  // 🔥 Behavior analytics (for insights)
  distractionCount: number;
  topDistraction?: string | null;
  avgDistractionGap?: number; // minutes
}


// 🔥 FOCUS ENGINE STATE (GLOBAL CONTEXT)
export interface FocusState {
  // --- STATUS ---
  isActive: boolean;
  isPaused: boolean;
  isSessionComplete: boolean;

  mode: FocusMode;

  // --- TIMER STATE ---
  timeRemaining: number;         // seconds
  initialSessionTime: number;    // seconds

  // 🔥 Extra focus (derived stopwatch)
  extraTime: number;             // seconds

  // Optional tracking
  focusedTime: number;
  totalElapsed: number;

  activeTaskId: string | null;

  // --- DATA MODELS ---
  currentSession: ActiveSession | null;
  sessions: FocusSession[];
  distractions: Distraction[];

  // --- UI STATE ---
  isFocusMode: boolean;

  // --- CONFIG ACTIONS ---
  setIsSessionComplete: (val: boolean) => void;
  setMode: (mode: FocusMode) => void;
  setActiveTask: (id: string | null) => void;

  // --- SESSION CONTROL ---
  startSession: () => void;
  pauseSession: () => void;
  stopSession: (isNatural?: boolean) => void;

  // --- DISTRACTION CONTROL ---
  addDistraction: (reason: string) => void;
  undoDistraction: () => void;

  // --- TIMER CONTROL ---
  setInitialSessionTime: (time: number) => void;
  setTimeRemaining: (time: number | ((prev: number) => number)) => void;

  // --- ENVIRONMENT ---
  enterFocusMode: () => void;
  exitFocusMode: () => void;

  // --- DERIVED HELPERS (CRITICAL) ---
  getElapsedTime: () => number;
  getRemainingTime: () => number;

  // 🔥 NEW: Extra focus calculation
  getExtraTime: () => number;
}