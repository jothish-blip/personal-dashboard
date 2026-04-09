// ✅ Tasks
export interface Task {
  id: string; // UUID
  name: string;
  group: string;
  history: Record<string, boolean>;
}

// ✅ Logs
export interface Log {
  id: string;
  time: string;
  action: string;
  name: string;
  detail: string;
}

// ✅ Meta
export interface Meta {
  currentMonth: string;
  isFocus: boolean;
  theme: "light" | "dark";
  lockedDates: string[];
  rollbackUsedDates: string[];
}

// ✅ Global State
export interface NexState {
  tasks: Task[];
  logs: Log[];
  meta: Meta;
}

// ✅ Profile (UPDATED - matches your DB)
export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  age: number | null;
  gender: string | null;
  location: string | null;
  avatar_url: string | null;
  updated_at: string | null;
}