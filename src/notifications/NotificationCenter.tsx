"use client";

import React, { useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, Trash2, X, Info, Calendar, Brain, 
  Book, ListTodo, Search, LayoutGrid, AlertCircle
} from 'lucide-react';
import { NexNotification, NexModule } from './types';

// ✅ Re-added unreadCount to the interface
interface NotificationCenterProps {
  notifications: NexNotification[];
  unreadCount: number; // <--- Re-added
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

const ModuleIcon = ({ module }: { module: NexModule }) => {
  switch (module) {
    case 'task': return <ListTodo size={14} className="text-blue-500" />;
    case 'planner': return <Calendar size={14} className="text-purple-500" />;
    case 'focus': return <Brain size={14} className="text-orange-500" />;
    case 'diary': return <Book size={14} className="text-green-500" />;
    default: return <Info size={14} className="text-gray-500" />;
  }
};

export default function NotificationCenter({ 
  notifications, unreadCount, markAsRead, clearAll, isOpen, onClose 
}: NotificationCenterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const [filter, setFilter] = useState<NexModule | 'all'>('all');
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
    if (n.actionUrl) {
      router.push(n.actionUrl);
      onClose(); 
    }
  };

  const getPriorityClass = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50/30';
      case 'medium': return 'border-l-amber-500 bg-amber-50/30';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <div className="absolute top-full right-0 mt-3 w-80 md:w-[420px] bg-white border border-gray-200 rounded-3xl shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-black text-gray-900 text-base tracking-tight">Intelligence Hub</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active System Logs</p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={clearAll} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all">
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 text-gray-400 rounded-xl transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input 
            type="text"
            placeholder="Search intelligence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
          {['all', 'task', 'planner', 'focus', 'diary'].map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-all ${
                filter === m ? 'bg-black text-white' : 'bg-white text-gray-500 border border-gray-100'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div ref={scrollRef} className="overflow-y-auto flex-1 p-3 space-y-2 bg-white custom-scrollbar min-h-[300px]">
        {filteredNotifications.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <LayoutGrid size={24} className="text-gray-200 mb-4" />
            <p className="text-xs font-bold text-gray-400">No signals detected.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div 
              key={n.id} 
              onClick={() => handleNotificationClick(n)}
              className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer border-l-4 ${getPriorityClass(n.priority)} ${
                n.read ? 'opacity-60 border-transparent bg-gray-50/50' : 'border-gray-100'
              }`}
            >
              <div className="flex gap-4">
                <div className="mt-1 shrink-0">
                  <div className="p-2 rounded-xl bg-white shadow-sm border border-gray-100">
                    <ModuleIcon module={n.module} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`text-xs font-black truncate ${n.read ? 'text-gray-500' : 'text-gray-900'}`}>
                      {n.title}
                    </h4>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                      {formatTimeAgo(n.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                    {n.body}
                  </p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-orange-500 mt-1 animate-pulse" />}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <AlertCircle size={12} />
          {unreadCount} New Signals
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-900 hover:bg-gray-50 transition-colors uppercase tracking-widest">
          Dismiss Hub
        </button>
      </div>
    </div>
  );
}