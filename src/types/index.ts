export interface Task {
  id: string; // ✅ FIXED (was number → now string for UUID)
  name: string;
  group: string;
  history: Record<string, boolean>;
}

export interface Log {
  id: string;
  time: string;
  action: string;
  name: string;
  detail: string;
}

export interface Meta {
  currentMonth: string;
  isFocus: boolean;
  theme: 'light' | 'dark';
  lockedDates: string[];
  rollbackUsedDates: string[];
}

export interface NexState {
  tasks: Task[];
  logs: Log[];
  meta: Meta;
}