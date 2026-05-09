export type EventStatus = "pending" | "completed" | "missed";
export type Priority = "high" | "medium" | "low";
export type TaskType = "Work" | "Study" | "Health" | "Finance" | "Personal" | "Deep Work" | "Learning" | "Meeting";

export interface SystemLog {
  id: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_TOGGLE" | "RESCHEDULE" | "STATUS"; 
  details: string;
  timestamp: number;
}

export interface PlannerEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: TaskType;
  priority: Priority;
  status: EventStatus;
  history: Record<string, EventStatus>; 
  createdAt: number;
}

export interface SystemPayload {
  events: PlannerEvent[];
  logs: SystemLog[];
  version: number;
  lastSync: number;
}