"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useNotificationSystem } from "@/notifications/useNotificationSystem";
import { useNexCore } from "@/hooks/useNexCore"; 
import { 
  Bell, CheckCircle2, AlertTriangle, Brain, 
  Calendar, Book, FileText, ArrowLeft, Trash2, LayoutGrid, Search
} from "lucide-react";

// ✅ Native helper instead of needing 'date-fns'
const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

// Helper to pick the right icon and color based on the module
const ModuleIcon = ({ module, priority }: { module: string, priority?: string }) => {
  if (priority === 'high') return <AlertTriangle size={20} className="text-red-600" />;
  
  switch (module) {
    case 'task': return <CheckCircle2 size={20} className="text-emerald-600" />;
    case 'focus': return <Brain size={20} className="text-purple-600" />;
    case 'planner': return <Calendar size={20} className="text-blue-600" />;
    case 'diary': return <Book size={20} className="text-indigo-600" />;
    case 'mini': return <FileText size={20} className="text-amber-600" />;
    case 'system': default: return <Bell size={20} className="text-gray-600" />;
  }
};

const getPriorityStyle = (priority?: string) => {
  if (priority === 'high') return "bg-red-50 border-red-100";
  if (priority === 'medium') return "bg-amber-50 border-amber-100";
  return "bg-gray-50 border-gray-200";
};

export default function NotificationsPage() {
  const router = useRouter();
  
  // Fetch user and notifications internally
  const { currentUser } = useNexCore();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotificationSystem(currentUser?.id);
  
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
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 pb-20 font-sans">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-black border border-gray-200 shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                Intelligence Hub
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-in fade-in zoom-in">
                    {unreadCount} New
                  </span>
                )}
              </h1>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">
                Full System Log
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white transition-all"
              />
            </div>
            <button 
              onClick={() => clearAll()}
              className="flex items-center justify-center gap-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-4 py-2 rounded-xl transition-colors shrink-0"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          </div>

        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* TABS */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
          <button 
            onClick={() => setFilter('all')}
            className={`pb-3 text-sm font-semibold transition-colors relative ${filter === 'all' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            All Updates
            {filter === 'all' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full animate-in slide-in-from-bottom-1"></div>}
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2 ${filter === 'unread' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Unread
            {filter === 'unread' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full animate-in slide-in-from-bottom-1"></div>}
          </button>
        </div>

        {/* NOTIFICATION LIST */}
        <div className="space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-24 bg-white border border-gray-200 rounded-3xl shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-inner">
                <LayoutGrid size={28} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">System Clear</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                {searchQuery ? "No logs match your search query." : "Your intelligence feed is completely empty. You are caught up."}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const bgStyle = getPriorityStyle(note.priority);
              
              return (
                <div 
                  key={note.id} 
                  onClick={() => {
                    if (!note.read) markAsRead(note.id);
                    if (note.actionUrl && note.actionUrl !== "/" && note.actionUrl !== "#") {
                      router.push(note.actionUrl);
                    }
                  }}
                  className={`group relative flex gap-4 p-5 sm:p-6 rounded-2xl border transition-all cursor-pointer ${
                    note.read 
                      ? "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm" 
                      : "bg-blue-50/50 border-blue-200 shadow-sm hover:shadow-md"
                  }`}
                >
                  {/* Unread Dot */}
                  {!note.read && (
                    <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex flex-shrink-0 items-center justify-center border shadow-sm ${bgStyle}`}>
                    <ModuleIcon module={note.module} priority={note.priority} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pr-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1.5">
                      <h4 className={`text-base font-bold ${note.read ? 'text-gray-800' : 'text-gray-900'}`}>
                        {note.title}
                      </h4>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        {formatTimeAgo(note.timestamp)}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${note.read ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
                      {note.body}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}