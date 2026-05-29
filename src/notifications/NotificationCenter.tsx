"use client";

import React, { useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, Trash2, X, Info, Calendar, Brain, 
  Book, ListTodo, Search, LayoutGrid, FileText
} from 'lucide-react';
import { NexNotification, NexModule } from "@/notifications/types/types";

import { useTheme } from "@/theme/ThemeProvider";

interface NotificationCenterProps {
  notifications: NexNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const ModuleIcon = ({ module }: { module: string }) => {
  switch (module) {
    case 'task': return <ListTodo size={16} className="text-emerald-500" />;
    case 'planner': return <Calendar size={16} className="text-blue-500" />;
    case 'focus': return <Brain size={16} className="text-purple-500" />;
    case 'diary': return <Book size={16} className="text-indigo-500" />;
    case 'Workspace': return <FileText size={16} className="text-amber-500" />;
    case 'system': return <Bell size={16} className="text-zinc-500" />;
    default: return <Info size={16} className="text-zinc-400" />;
  }
};

export default function NotificationCenter({ 
  notifications, unreadCount, markAsRead, clearAll, isOpen, onClose 
}: NotificationCenterProps) {

  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [filter, setFilter] = useState<NexModule | 'all' | 'mini' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter(n => filter === 'all' || n.module === filter)
      .filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.body.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        return b.timestamp - a.timestamp;
      });
  }, [notifications, filter, searchQuery]);

  if (!isOpen) return null;

  const handleNotificationClick = (n: NexNotification) => {
    markAsRead(n.id);
    if (n.actionUrl && n.actionUrl !== "#" && n.actionUrl !== "/") {
      router.push(n.actionUrl);
      onClose(); 
    }
  };

  return (
    <div
      className={`
        fixed
        md:top-[84px]
        md:right-[110px]

        top-[72px]
        left-3
        right-3
        bottom-[88px]

        md:left-auto
        md:bottom-auto
        md:w-[420px]

        z-[99999]
        overflow-hidden
        flex flex-col
        rounded-[28px]
        border
        shadow-[0_24px_80px_rgba(0,0,0,0.28)]
        backdrop-blur-[18px]
        transition-all duration-300
        animate-in fade-in zoom-in-95
        ${
          isDarkMode
            ? "bg-neutral-950/96 border-white/[0.06]"
            : "bg-white/96 border-zinc-200"
        }
      `}
    >
      {/* Header */}
      <div className={`px-4 py-4 border-b space-y-4 transition-colors shrink-0 ${isDarkMode ? "border-white/[0.08]" : "border-gray-100"}`}>

        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Notifications
          </h3>

          <div className="flex gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); clearAll(); }} 
              className={`p-2 rounded-md transition-colors ${isDarkMode ? "hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}
              title="Clear all"
            >
              <Trash2 size={16} />
            </button>

            <button 
              onClick={onClose} 
              className={`p-2 rounded-md transition-colors ${isDarkMode ? "hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-zinc-600" : "text-gray-400"}`} size={14} />
          <input 
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-2 text-sm bg-transparent border-b outline-none transition-colors ${
              isDarkMode ? "border-white/[0.08] text-white focus:border-zinc-500 placeholder-zinc-600" : "border-gray-200 text-gray-900 focus:border-black placeholder-gray-400"
            }`}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 text-xs overflow-x-auto scrollbar-hide pb-1">
          {['all', 'task', 'planner', 'focus', 'diary', 'mini', 'system'].map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m as any)}
              className={`capitalize transition-colors whitespace-nowrap ${
                filter === m
                  ? (isDarkMode ? "text-white font-semibold" : "text-black font-semibold")
                  : (isDarkMode ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-600")
              }`}
            >
              {m === 'mini' ? 'notes' : m}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-hide">

        {filteredNotifications.length === 0 ? (
          <div className={`py-16 flex flex-col items-center justify-center text-center h-full ${isDarkMode ? "text-zinc-600" : "text-gray-400"}`}>
            <LayoutGrid size={20} className="mb-2" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`flex gap-3 px-3 py-3 rounded-md cursor-pointer transition-all ${
                isDarkMode ? "hover:bg-white/[0.04]" : "hover:bg-gray-50"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                <ModuleIcon module={n.module} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className={`text-sm truncate pr-2 ${
                    n.read 
                      ? (isDarkMode ? "text-zinc-500" : "text-gray-600") 
                      : (isDarkMode ? "text-white font-medium" : "text-gray-900 font-medium")
                  }`}>
                    {n.title}
                  </p>

                  <span className={`text-xs shrink-0 ${isDarkMode ? "text-zinc-600" : "text-gray-400"}`}>
                    {formatTimeAgo(n.timestamp)}
                  </span>
                </div>

                <p className={`text-sm mt-1 line-clamp-2 ${isDarkMode ? "text-zinc-400" : "text-gray-500"}`}>
                  {n.body}
                </p>
              </div>

              {!n.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
              )}
            </div>
          ))
        )}

      </div>

      {/* Footer */}
      <div className={`px-4 py-3 border-t shrink-0 flex items-center justify-between transition-colors ${
        isDarkMode ? "border-white/[0.08] bg-black/40" : "border-gray-100 bg-gray-50/50"
      }`}>

        <span className={`text-xs ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
          {unreadCount} unread
        </span>

        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className={`text-xs transition-colors ${isDarkMode ? "text-zinc-400 hover:text-white" : "text-gray-500 hover:text-black"}`}
          >
            Close
          </button>

          <button 
            onClick={() => {
              router.push('/notifications');
              onClose();
            }}
            className={`text-xs font-bold transition-colors ${isDarkMode ? "text-white hover:text-zinc-300" : "text-black hover:text-gray-600"}`}
          >
            View all
          </button>
        </div>

      </div>
    </div>
  );
}