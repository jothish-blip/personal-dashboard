export interface Task {
  id: number;
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
  lockedDates: string[]; // ✅ New: Stores ISO date strings that are read-only
  rollbackUsedDates: string[];
}

export interface NexState {
  tasks: Task[];
  logs: Log[];
  meta: Meta;
}