export type FocusMode = "pomodoro" | "deepWork" | "custom";

export interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
}

export interface Distraction {
  id: string;
  reason: string;
  timestamp: number;
}

// STRICT TYPE: No more Partial<FocusSession>
export interface ActiveSession {
  id: string;
  taskId?: string | null;
  taskTitle: string;
  mode: FocusMode;
  startTime: number;
  distractions: Distraction[];
}

export interface FocusSession extends ActiveSession {
  endTime: number;
  durationSeconds: number;
  totalSessionSeconds: number;
  date: string;
  score: number;
}

export interface FocusState {
  isActive: boolean;
  isPaused: boolean;
  mode: FocusMode;
  
  timeRemaining: number;
  initialSessionTime: number; 
  focusedTime: number; 
  totalElapsed: number; 
  activeTaskId: string | null;
  
  currentSession: ActiveSession | null; 
  sessions: FocusSession[]; 
  isFocusMode: boolean;
  isSessionComplete: boolean;

  // ✅ RESTORED: This is required for DistractionTracker to read data safely!
  distractions: Distraction[];
  
  // Actions
  setIsSessionComplete: (val: boolean) => void;
  setMode: (mode: FocusMode) => void;
  setActiveTask: (id: string | null) => void;
  startSession: () => void;
  pauseSession: () => void;
  stopSession: (isNatural?: boolean) => void; 
  addDistraction: (reason: string) => void;
  undoDistraction: () => void;
  
  // ✅ FIX: Added to resolve the TypeScript build error
  setInitialSessionTime: (time: number) => void;
  setTimeRemaining: (seconds: number | ((prev: number) => number)) => void;
  
  enterFocusMode: () => void;
  exitFocusMode: () => void;
}