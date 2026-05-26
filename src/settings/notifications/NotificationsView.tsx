"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useNotificationSystem } from "@/notifications/engine/useNotificationSystem";
import { useTheme } from "@/theme/ThemeProvider";
import { useNexCore } from "@/modules/tasks/engine/useNexCore";

import { 
  Bell, CheckCircle2, AlertTriangle, Brain, 
  Calendar, Book, FileText, ArrowLeft, Trash2, LayoutGrid, Search
} from "lucide-react";

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const ModuleIcon = ({ module, priority }: { module: string, priority?: string }) => {
  if (priority === 'high') return <AlertTriangle size={18} className="text-red-500" />;
  
  switch (module) {
    case 'task': return <CheckCircle2 size={18} className="text-emerald-500" />;
    case 'focus': return <Brain size={18} className="text-purple-500" />;
    case 'planner': return <Calendar size={18} className="text-blue-500" />;
    case 'diary': return <Book size={18} className="text-indigo-500" />;
    case 'Workspace': return <FileText size={18} className="text-amber-500" />;
    default: return <Bell size={18} className="text-gray-400" />;
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const { currentUser } = useNexCore();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotificationSystem(currentUser?.id);
  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = useMemo(() => {
    return notifications
      .filter(n => filter === 'all' ? true : !n.read)
      .filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.body.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        return b.timestamp - a.timestamp;
      });
  }, [notifications, filter, searchQuery]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? "bg-[#050505] text-white" : "bg-[#FAFAFA] text-gray-900"
    }`}>

      {/* HEADER */}
      <div className={`px-4 sm:px-6 py-6 sticky top-0 z-20 transition-colors duration-300 ${
        isDarkMode ? "bg-[#050505]" : "bg-[#FAFAFA]"
      }`}>
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className={`p-2 rounded-md transition-colors ${
                isDarkMode ? "hover:bg-[#111111] text-gray-300" : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-xl font-semibold">
                Notifications
              </h1>
              <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
          </div>

          <button 
            onClick={() => clearAll()}
            className={`text-sm transition-colors ${
              isDarkMode ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-600"
            }`}
          >
            Clear
          </button>

        </div>

        {/* Search */}
        <div className="max-w-3xl mx-auto mt-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              isDarkMode ? "text-gray-500" : "text-gray-400"
            }`} size={14} />
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 text-sm border-b focus:outline-none transition-colors ${
                isDarkMode 
                  ? "bg-[#111111] border-gray-800 text-white focus:border-gray-500 placeholder-gray-600 rounded-t-md" 
                  : "bg-white border-gray-200 text-gray-900 focus:border-black placeholder-gray-400"
              }`}
            />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-6">

        {/* Tabs */}
        <div className="flex gap-6 mb-6 text-sm">
          <button 
            onClick={() => setFilter('all')}
            className={`transition-colors ${
              filter === 'all' 
                ? (isDarkMode ? "text-white font-medium" : "text-black font-medium") 
                : (isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600")
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`transition-colors ${
              filter === 'unread' 
                ? (isDarkMode ? "text-white font-medium" : "text-black font-medium") 
                : (isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600")
            }`}
          >
            Unread
          </button>
        </div>

        {/* List */}
        <div className="space-y-1 pb-20">

          {filteredNotes.length === 0 ? (
            <div className="text-center py-20">
              <LayoutGrid size={24} className={`mx-auto mb-3 ${isDarkMode ? "text-gray-700" : "text-gray-300"}`} />
              <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {searchQuery ? "No results found" : "No notifications"}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  if (!note.read) markAsRead(note.id);
                  if (note.actionUrl && note.actionUrl !== "/" && note.actionUrl !== "#") {
                    router.push(note.actionUrl);
                  }
                }}
                className={`flex gap-3 py-4 cursor-pointer rounded-md px-2 transition-colors ${
                  isDarkMode ? "hover:bg-[#111111]" : "hover:bg-gray-50"
                }`}
              >
                {/* Icon */}
                <div className="mt-1">
                  <ModuleIcon module={note.module} priority={note.priority} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm ${
                      note.read 
                        ? (isDarkMode ? "text-gray-500" : "text-gray-600") 
                        : (isDarkMode ? "text-white font-medium" : "text-gray-900 font-medium")
                    }`}>
                      {note.title}
                    </p>
                    <span className={`text-xs ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
                      {formatTimeAgo(note.timestamp)}
                    </span>
                  </div>

                  <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {note.body}
                  </p>
                </div>

                {/* Unread Dot */}
                {!note.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                )}
              </div>
            ))
          )}

        </div>

      </div>
    </div>
  );
}