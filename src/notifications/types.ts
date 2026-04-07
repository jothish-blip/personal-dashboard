export type NexModule = 'task' | 'diary' | 'mini' | 'planner' | 'system' | 'focus';

export interface NexNotification {
  id: string;
  module: NexModule;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string; // Where to go when clicked
}

export interface NotificationState {
  notifications: NexNotification[];
  unreadCount: number;
}