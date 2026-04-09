"use client";

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, Trash2, X, Info, Calendar, Brain, 
  Book, ListTodo, Search, LayoutGrid, FileText
} from 'lucide-react';
import { NexNotification, NexModule } from './types';

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
    case 'mini': return <FileText size={16} className="text-amber-500" />;
    case 'system': return <Bell size={16} className="text-gray-500" />;
    default: return <Info size={16} className="text-gray-400" />;
  }
};

export default function NotificationCenter({ 
  notifications, unreadCount, markAsRead, clearAll, isOpen, onClose 
}: NotificationCenterProps) {

  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [filter, setFilter] = useState<NexModule | 'all' | 'mini' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState("");

  // 🔥 REAL FIX: LOCK BODY SCROLL COMPLETELY FOR MOBILE
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;

    // Lock body completely preventing background scroll and jump
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    return () => {
      const y = document.body.style.top;

      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";

      if (y) {
        window.scrollTo(0, parseInt(y) * -1);
      }
    };
  }, [isOpen]);

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
    <>
      {/* ✅ BACKDROP (prevents scroll + closes on outside click) */}
      <div 
        className="fixed inset-0 bg-black/10 z-[9998]"
        onClick={onClose}
      />

      {/* ✅ FIXED DROPDOWN (NO layout shift anymore) */}
      <div className="fixed top-[60px] right-2 left-2 md:left-auto md:right-4 md:w-[420px] w-auto bg-white rounded-xl border border-gray-100 z-[9999] overflow-hidden flex flex-col max-h-[70vh] shadow-xl">

        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100 space-y-4">

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
            </h3>

            <div className="flex gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); clearAll(); }} 
                className="p-2 hover:bg-gray-100 rounded-md text-gray-400"
              >
                <Trash2 size={16} />
              </button>

              <button 
                onClick={onClose} 
                className="p-2 hover:bg-gray-100 rounded-md text-gray-400"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-transparent border-b border-gray-200 focus:outline-none focus:border-black"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-4 text-xs overflow-x-auto no-scrollbar pb-1">
            {['all', 'task', 'planner', 'focus', 'diary', 'mini', 'system'].map((m) => (
              <button
                key={m}
                onClick={() => setFilter(m as any)}
                className={`capitalize whitespace-nowrap ${
                  filter === m
                    ? "text-black font-medium"
                    : "text-gray-400"
                }`}
              >
                {m === 'mini' ? 'notes' : m}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-2 space-y-1">

          {filteredNotifications.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center text-gray-400">
              <LayoutGrid size={20} className="mb-2" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className="flex gap-3 px-3 py-3 rounded-md hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="mt-0.5">
                  <ModuleIcon module={n.module} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm ${
                      n.read ? "text-gray-600" : "text-gray-900 font-medium"
                    }`}>
                      {n.title}
                    </p>

                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(n.timestamp)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {n.body}
                  </p>
                </div>

                {!n.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                )}
              </div>
            ))
          )}

        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">

          <span className="text-xs text-gray-400">
            {unreadCount} unread
          </span>

          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-black"
            >
              Close
            </button>

            <button 
              onClick={() => {
                router.push('/notifications');
                onClose();
              }}
              className="text-xs font-medium text-black"
            >
              View all
            </button>
          </div>

        </div>

      </div>
    </>
  );
}