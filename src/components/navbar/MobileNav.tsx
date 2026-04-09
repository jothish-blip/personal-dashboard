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
  activePaths: any;
  handleNav: (path: string) => void;
  y: string; m: string; years: number[];
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

export default function MobileNav({
  activePaths, handleNav, y, m, years, setMonthYear,
  notifications, unreadCount, markAsRead, clearAll, isNoteOpen, setIsNoteOpen,
  handleLogout, userProfile
}: MobileNavProps) {

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // ✅ Smart Auto Scroll (unchanged)
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.getElementById("active-mobile-nav");
      if (el) el.scrollIntoView({ behavior: "smooth", inline: "center" });
    }, 50);
    return () => clearTimeout(timer);
  }, [activePaths]);

  return (
    <div className="md:hidden px-4 py-3 space-y-3 bg-[#FAFAFA]">

      {/* HEADER */}
      <div className="flex items-center justify-between relative">

        {/* Brand */}
        <span className="text-sm font-semibold tracking-tight text-gray-900">
          NexTask
        </span>

        {/* Right */}
        <div className="flex items-center gap-3">

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNoteOpen(!isNoteOpen)}
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
                <img src={userProfile.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <User size={14} className="text-gray-500" />
              )}
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0" onClick={() => setIsProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-md shadow-sm py-1">
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
      <div className="flex gap-3 overflow-x-auto no-scrollbar">

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePaths[item.key];

          return (
            <button
              key={item.label}
              id={isActive ? "active-mobile-nav" : undefined}
              onClick={() => handleNav(item.path)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 whitespace-nowrap transition ${
                isActive
                  ? "text-black font-medium"
                  : "text-gray-400"
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

        <select
          value={y}
          onChange={(e) => setMonthYear(`${e.target.value}-${m}`)}
          className="bg-transparent outline-none"
        >
          {years.map((year) => (
            <option key={year}>{year}</option>
          ))}
        </select>

        <select
          value={m}
          onChange={(e) => setMonthYear(`${y}-${e.target.value}`)}
          className="bg-transparent outline-none"
        >
          {Array.from({ length: 12 }, (_, i) => {
            const val = String(i + 1).padStart(2, "0");
            return <option key={val}>{val}</option>;
          })}
        </select>

      </div>

    </div>
  );
}