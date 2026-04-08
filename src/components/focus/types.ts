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
  timestamp: number;
}

// 🔹 STRICT TYPE: Active running session
export interface ActiveSession {
  id: string;
  taskId: string | null; // 🔥 FIX: Strict null for Supabase relation safety
  taskTitle: string;
  mode: FocusMode;
  startTime: number;
  distractions: Distraction[];
}

// 🔹 STRICT TYPE: Completed session (extends Active)
export interface FocusSession extends ActiveSession {
  endTime: number;
  durationSeconds: number;
  totalSessionSeconds: number;
  date: string;
  score: number;
}

// 🔹 FOCUS ENGINE STATE & ACTIONS
export interface FocusState {
  // Config & Status
  isActive: boolean;
  isPaused: boolean;
  mode: FocusMode;
  
  // Timer State
  timeRemaining: number;
  initialSessionTime: number; 
  focusedTime: number; 
  totalElapsed: number; 
  activeTaskId: string | null;
  
  // Data Models
  currentSession: ActiveSession | null; 
  sessions: FocusSession[]; 
  distractions: Distraction[]; // Exposed for DistractionTracker UI
  
  // UI State
  isFocusMode: boolean;
  isSessionComplete: boolean;
  
  // Actions
  setIsSessionComplete: (val: boolean) => void;
  setMode: (mode: FocusMode) => void;
  setActiveTask: (id: string | null) => void;
  
  // Core Session Controls
  startSession: () => void;
  pauseSession: () => void;
  stopSession: (isNatural?: boolean) => void; 
  
  // Distraction Handling
  addDistraction: (reason: string) => void;
  undoDistraction: () => void;
  
  // Timer Overrides
  setInitialSessionTime: (time: number) => void;
  setTimeRemaining: (time: number | ((prev: number) => number)) => void;
  
  // Environment Controls
  enterFocusMode: () => void;
  exitFocusMode: () => void;

  // ✅ ADD THESE
  getElapsedTime: () => number;
  getRemainingTime: () => number;
}