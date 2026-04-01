export interface Task {
  id: number;
  name: string;
  group: string;
  history: Record<string, boolean>;
}

export interface Log {
  time: string;
  action: string;
  name: string;
  detail: string;
}

export interface Meta {
  currentMonth: string;
  isFocus: boolean;
  theme: 'light' | 'dark';
}

export interface NexState {
  tasks: Task[];
  logs: Log[];
  meta: Meta;
}