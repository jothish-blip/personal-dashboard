export type NexModule = 'task' | 'diary' | 'mini' | 'planner' | 'system' | 'focus';

export interface NexNotification {
  id: string;
  module: NexModule;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl: string; // Made consistent with DB action_url
  archived: boolean; // ✅ Required for the soft-delete/clear logic
}

export interface NotificationState {
  notifications: NexNotification[];
  unreadCount: number;
}