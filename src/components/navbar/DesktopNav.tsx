"use client";

import React, { useState } from "react";
import {
  LayoutGrid,
  ListTodo,
  BookOpen,
  Brain,
  CalendarDays,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  User,
  Settings,
  LogOut
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider"; // Added theme hook

import NotificationCenter from "@/notifications/NotificationCenter";
import { NexNotification } from "@/notifications/types";

interface DesktopNavProps {
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

export default function DesktopNav({
  activePaths,
  handleNav,
  notifications,
  unreadCount,
  markAsRead,
  clearAll,
  isNoteOpen,
  setIsNoteOpen,
  handleLogout,
  userProfile
}: DesktopNavProps) {
  const { isDarkMode } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="hidden md:flex h-[64px] items-center px-6 max-w-[1500px] mx-auto w-full relative">

      {/* BRAND */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold shadow-sm ${
          isDarkMode ? "bg-[#111111] text-white border border-gray-800" : "bg-gray-900 text-white"
        }`}>
          Nx
        </div>

        {!isCollapsed && (
          <span className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            NexTask <span className="text-orange-500 text-xs ml-0.5 font-bold">v1.2</span>
          </span>
        )}
      </div>

      <div className={`mx-4 w-px h-5 ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`} />

      {/* NAV */}
      <div className="flex gap-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePaths[item.key as keyof typeof activePaths];

          return (
            <button
              key={item.label}
              onClick={() => handleNav(item.path)}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 hover:scale-[1.05] ${
                isActive
                  ? isDarkMode ? "bg-orange-950/30 text-orange-400" : "bg-orange-50 text-orange-600"
                  : isDarkMode ? "text-gray-400 hover:bg-[#111111] hover:text-gray-300" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={16} />
              {!isCollapsed && item.label}
              {/* Active Underline Indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-orange-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        <ThemeToggle />

        {/* 🔔 NOTIFICATIONS */}
        <div className="relative flex items-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsNoteOpen(!isNoteOpen);
            }}
            className={`relative p-2 transition-all duration-200 hover:scale-[1.05] rounded-full ${
              isDarkMode ? "text-gray-400 hover:text-white hover:bg-[#111111]" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Bell size={18} />

            {unreadCount > 0 && (
              <span className={`absolute top-0 -right-1 text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full shadow-sm border ${isDarkMode ? "border-[#050505]" : "border-white"}`}>
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
            className="flex items-center gap-2 hover:opacity-80 transition-all duration-200 hover:scale-[1.05]"
          >
            {userProfile?.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                className={`w-8 h-8 rounded-full object-cover shadow-sm border ${isDarkMode ? "bg-[#111111] border-gray-800" : "bg-gray-100 border-gray-200"}`}
                alt="Profile"
              />
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm border text-sm font-bold uppercase ${
                isDarkMode ? "bg-[#111111] border-gray-800 text-gray-300" : "bg-gray-100 border-gray-200 text-gray-700"
              }`}>
                {userProfile?.full_name?.[0] || "U"}
              </div>
            )}

            {userProfile?.full_name && (
              <span className={`text-sm font-semibold hidden lg:block ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                {userProfile.full_name}
              </span>
            )}
          </button>

          {/* DROPDOWN */}
          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileOpen(false)}
              />

              <div className={`absolute right-0 mt-3 w-56 border rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200 ${
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
                  className={`w-full px-4 py-2.5 text-sm text-left font-medium flex items-center gap-2 transition ${
                    isDarkMode ? "text-gray-300 hover:bg-[#111111]" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Settings size={14} className={isDarkMode ? "text-gray-500" : "text-gray-400"} /> Settings
                </button>

                <button
                  onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                  className={`w-full px-4 py-2.5 text-sm text-left font-medium flex items-center gap-2 transition ${
                    isDarkMode ? "text-red-400 hover:bg-red-950/30" : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </>
          )}
        </div>

        {/* COLLAPSE */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 ml-1 rounded-lg transition-all duration-200 ${
            isDarkMode ? "text-gray-400 hover:text-white hover:bg-[#111111]" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

      </div>
    </div>
  );
}