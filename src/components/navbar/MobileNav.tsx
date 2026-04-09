"use client";

import React, { useState, useEffect } from "react";
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
  y: string;
  m: string;
  years: number[];
  setMonthYear: (val: string) => void;
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
  { label: "Mini", icon: ListTodo, path: "/mini-nisc", key: "isMini" },
  { label: "Diary", icon: BookOpen, path: "/diary", key: "isDiary" },
  { label: "Focus", icon: Brain, path: "/focus", key: "isFocus" },
  { label: "Planner", icon: CalendarDays, path: "/calender-event", key: "isCalendar" },
];

export default function MobileNav(props: MobileNavProps) {
  const {
    activePaths, handleNav, y, m, years, setMonthYear,
    notifications, unreadCount, markAsRead, clearAll,
    isNoteOpen, setIsNoteOpen, handleLogout, userProfile
  } = props;

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // scroll fix
  useEffect(() => {
    const el = document.getElementById("active-mobile-nav");
    if (!el) return;

    el.scrollIntoView({
      behavior: "auto",
      inline: "center",
      block: "nearest"
    });
  }, []);

  return (
    <div className="md:hidden px-4 py-3 space-y-3 bg-[#FAFAFA]">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <span className="text-sm font-semibold text-gray-900">
          NexTask
        </span>

        <div className="flex items-center gap-3">

          {/* 🔔 Notifications */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // ✅ FIX: Passed the boolean directly instead of a callback function
                setIsNoteOpen(!isNoteOpen);
              }}
              className="relative p-2 text-gray-500 hover:text-black"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-black text-white px-1 rounded-full">
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

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden"
            >
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <User size={14} />
              )}
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0" onClick={() => setIsProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-sm py-1 z-50">
                  <button
                    onClick={() => { handleNav("/settings"); setIsProfileOpen(false); }}
                    className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Settings size={14} /> Settings
                  </button>

                  <button
                    onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                    className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* NAV */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePaths[item.key as keyof typeof activePaths];

          return (
            <button
              key={item.label}
              id={isActive ? "active-mobile-nav" : undefined}
              onClick={() => handleNav(item.path)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 whitespace-nowrap snap-center ${
                isActive ? "text-black font-medium" : "text-gray-400"
              }`}
            >
              <Icon size={14} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* DATE */}
      <div className="flex gap-4 text-xs text-gray-500">
        <select value={y} onChange={(e) => setMonthYear(`${e.target.value}-${m}`)} className="bg-transparent outline-none">
          {years.map((year) => <option key={year}>{year}</option>)}
        </select>

        <select value={m} onChange={(e) => setMonthYear(`${y}-${e.target.value}`)} className="bg-transparent outline-none">
          {Array.from({ length: 12 }, (_, i) => {
            const val = String(i + 1).padStart(2, "0");
            return <option key={val}>{val}</option>;
          })}
        </select>
      </div>

    </div>
  );
}