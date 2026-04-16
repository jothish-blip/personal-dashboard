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

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="hidden md:flex h-[64px] items-center px-6 max-w-[1500px] mx-auto w-full relative">

      {/* BRAND */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center rounded-lg text-sm font-bold shadow-sm">
          Nx
        </div>

        {!isCollapsed && (
          <span className="font-semibold text-gray-900">
            NexTask <span className="text-orange-500 text-xs ml-0.5 font-bold">v1.2</span>
          </span>
        )}
      </div>

      <div className="mx-4 w-px h-5 bg-gray-200" />

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
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-100"
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

        {/* 🔔 NOTIFICATIONS */}
        <div className="relative flex items-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsNoteOpen(!isNoteOpen);
            }}
            className="relative p-2 text-gray-500 hover:text-gray-900 transition-all duration-200 hover:scale-[1.05] rounded-full hover:bg-gray-100"
          >
            <Bell size={18} />

            {unreadCount > 0 && (
              <span className="absolute top-0 -right-1 text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white">
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
                className="w-8 h-8 rounded-full object-cover bg-gray-100 shadow-sm border border-gray-200"
                alt="Profile"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shadow-sm border border-gray-200 text-sm font-bold text-gray-700 uppercase">
                {userProfile?.full_name?.[0] || "U"}
              </div>
            )}

            {userProfile?.full_name && (
              <span className="text-sm font-semibold text-gray-800 hidden lg:block">
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

              <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-gray-100 mb-1">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {userProfile?.full_name || "User"}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {userProfile?.email || ""}
                  </p>
                </div>

                <button
                  onClick={() => { handleNav("/settings"); setIsProfileOpen(false); }}
                  className="w-full px-4 py-2.5 text-sm text-left font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
                >
                  <Settings size={14} className="text-gray-400" /> Settings
                </button>

                <button
                  onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                  className="w-full px-4 py-2.5 text-sm text-left font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
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
          className="p-2 ml-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

      </div>
    </div>
  );
}