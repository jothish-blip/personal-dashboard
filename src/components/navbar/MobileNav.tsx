"use client";

import React, { useState } from "react";
import {
  LayoutGrid,
  ListTodo,
  BookOpen,
  Brain,
  CalendarDays,
  Bell,
  User,
  Settings,
  LogOut
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider"; // Added theme hook

import NotificationCenter from "@/notifications/NotificationCenter";
import { NexNotification } from "@/notifications/types";

interface MobileNavProps {
  activePaths: {
    isTasks: boolean;
    isMini: boolean;
    isDiary: boolean;
    isFocus: boolean;
    isCalendar: boolean;
  };
  handleNav: (path: string) => void;
  notifications: NexNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  isNoteOpen: boolean;
  setIsNoteOpen: (v: boolean) => void;
  handleLogout: () => void;
  userProfile?: any;
}

const NAV_ITEMS = [
  { label: "Tasks", icon: LayoutGrid, path: "/", key: "isTasks" },
  { label: "Focus", icon: Brain, path: "/focus", key: "isFocus" },
  { label: "Planner", icon: CalendarDays, path: "/calender-event", key: "isCalendar" },
  { label: "Diary", icon: BookOpen, path: "/diary", key: "isDiary" },
  { label: "Workspace", icon: ListTodo, path: "/mini-nisc", key: "isMini" },
];

export default function MobileNav(props: MobileNavProps) {
  const {
    activePaths, handleNav,
    notifications, unreadCount, markAsRead, clearAll,
    isNoteOpen, setIsNoteOpen, handleLogout, userProfile
  } = props;

  const { isDarkMode } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className={`md:hidden px-4 py-2 space-y-2 backdrop-blur-md shadow-sm border-b transition-colors duration-300 ${
      isDarkMode ? "bg-[#050505]/95 border-gray-800" : "bg-white/95 border-gray-100"
    }`}>

      {/* HEADER */}
      <div className="flex items-center justify-between">

        {/* NAME IN HEADER */}
        <div className="flex flex-col">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Welcome</span>
          <span className={`text-lg font-bold truncate max-w-[160px] leading-none mt-0.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {userProfile?.full_name || "User"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* 🔔 Notifications */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsNoteOpen(!isNoteOpen);
              }}
              className={`relative p-1.5 transition-all duration-200 hover:scale-[1.05] rounded-full ${
                isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className={`absolute top-0 -right-1 text-[9px] bg-red-500 text-white px-1 py-0.5 font-bold rounded-full border ${isDarkMode ? "border-[#050505]" : "border-white"}`}>
                  {unreadCount}
                </span>
              )}
            </button>

            <NotificationCenter
              isOpen={isNoteOpen}
              onClose={() => setIsNoteOpen(false)}
              notifications={notifications}
              unreadCount={unreadCount}
              markAsRead={markAsRead}
              clearAll={clearAll}
            />
          </div>

          {/* PROFILE */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border shadow-sm transition-all duration-200 hover:scale-[1.05] ${
                isDarkMode ? "bg-[#111111] border-gray-800" : "bg-gray-100 border-gray-200"
              }`}
            >
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="Avatar"/>
              ) : (
                <span className={`text-sm font-bold uppercase ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {userProfile?.full_name?.[0] || "U"}
                </span>
              )}
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />

                <div className={`absolute right-0 top-10 mt-2 w-56 border rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200 ${
                  isDarkMode ? "bg-[#050505] border-gray-800" : "bg-white border-gray-200"
                }`}>
                  <div className={`px-4 py-3 border-b mb-1 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
                    <p className={`text-sm font-bold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {userProfile?.full_name || "User"}
                    </p>
                    <p className={`text-xs truncate mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      {userProfile?.email || ""}
                    </p>
                  </div>

                  <button
                    onClick={() => { handleNav("/settings"); setIsProfileOpen(false); }}
                    className={`w-full px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${
                      isDarkMode ? "text-gray-300 hover:bg-[#111111]" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Settings size={14} className={isDarkMode ? "text-gray-500" : "text-gray-400"} /> Settings
                  </button>

                  <button
                    onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                    className={`w-full px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${
                      isDarkMode ? "text-red-400 hover:bg-red-950/30" : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      <div className="flex justify-between items-center px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePaths[item.key as keyof typeof activePaths];

          return (
            <button
              key={item.label}
              onClick={() => handleNav(item.path)}
              className={`relative flex flex-col items-center gap-1 text-[10px] font-semibold tracking-wide py-1 px-1 transition-all duration-200 hover:scale-[1.05] ${
                isActive 
                  ? isDarkMode ? "text-orange-400" : "text-orange-600" 
                  : isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${
                isActive ? (isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50') : 'bg-transparent'
              }`}>
                <Icon size={18} />
              </div>
              <span className="leading-none">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-orange-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}