export interface Folder {
  id: string;
  name: string;
}

export interface HistoryEntry {
  content: string;
  timestamp: number;
  title?: string;
}

export interface LogEntry {
  type: string;
  timestamp: number;
  meta?: any;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  tags: string[];
  pinned: boolean;
  history: HistoryEntry[];
  logs?: LogEntry[]; 
  mediaIds: string[];
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  version: number;
}

export interface Media {
  id: string;
  type: "image" | "video";
  url: string;
  name?: string;
  folderId: string | null;      
  createdAt: number;
}

export type View = "editor" | "analytics" | "history" | "media";

export function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)} hrs ago`;
  return new Date(ts).toLocaleDateString();
}