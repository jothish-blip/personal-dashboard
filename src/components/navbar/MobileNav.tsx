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
  activePaths: { isTasks: boolean; isMini: boolean; isDiary: boolean; isFocus: boolean; isCalendar: boolean; };
  handleNav: (path: string) => void;
  y: string; m: string; years: number[];
  setMonthYear: (val: string) => void;
  // ✅ Notification Props
  notifications: NexNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  isNoteOpen: boolean;
  setIsNoteOpen: (v: boolean) => void;
  // ✅ Auth & Profile Props
  handleLogout: () => void;
  userProfile?: any;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

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

  // 🔥 Smart Auto-Scroll: Automatically scrolls the active nav item into the center of the screen
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeElement = document.getElementById("active-mobile-nav");
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }, 50); // slight delay ensures rendering is complete
    return () => clearTimeout(timer);
  }, [activePaths]);

  return (
    <div className="md:hidden px-4 py-3 space-y-3 bg-white/95 backdrop-blur-md border-b border-gray-200">
      
      {/* ROW 1: Brand & User Controls */}
      <div className="flex items-center justify-between relative">
        <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 bg-gray-900 text-white rounded-lg">
            <span className="text-xs font-bold">Nx</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight">NexTask</span>
            <span className="text-[8px] text-orange-500 font-black uppercase">v1.2</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ✅ NOTIFICATION TRIGGER */}
          <button 
            onClick={() => setIsNoteOpen(!isNoteOpen)}
            className={`p-2 flex items-center justify-center rounded-lg border transition-all relative ${
              unreadCount > 0 
                ? "border-orange-200 bg-orange-50 text-orange-600 active:scale-95" 
                : "border-gray-200 bg-gray-50 text-gray-600"
            }`}
          >
            <Bell size={16} className={unreadCount > 0 ? "animate-pulse" : ""} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="w-[1px] h-4 bg-gray-200 mx-0.5" />

          {/* ✅ ACCOUNT MENU */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white active:scale-95 overflow-hidden"
            >
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={15} className="text-gray-500" />
              )}
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{userProfile?.full_name || "User"}</p>
                    <p className="text-[9px] text-green-600 font-bold uppercase tracking-tight">Active</p>
                  </div>
                  <div className="px-1">
                    <button 
                      onClick={() => { handleNav("/settings"); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <Settings size={14} className="text-gray-400" /> Settings
                    </button>
                    <button 
                      onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg mt-0.5"
                    >
                      <LogOut size={14} className="text-red-400" /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ✅ MOBILE NOTIFICATION HUB (Positioned relative to the header) */}
        <NotificationCenter 
          isOpen={isNoteOpen}
          onClose={() => setIsNoteOpen(false)}
          notifications={notifications}
          unreadCount={unreadCount}
          markAsRead={markAsRead}
          clearAll={clearAll}
        />
      </div>

      {/* ROW 2: SCROLLABLE NAVIGATION */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePaths[item.key as keyof typeof activePaths];

          return (
            <button
              key={item.label}
              id={isActive ? "active-mobile-nav" : undefined} // 🔥 Target ID for the auto-scroll
              onClick={() => handleNav(item.path)}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95
              ${isActive ? "bg-gray-900 text-white shadow-lg" : "bg-gray-50 border border-gray-100 text-gray-500"}`}
            >
              <Icon size={14} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* ROW 3: TOUCH DATE CONTROLS */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <select
            value={y}
            onChange={(e) => setMonthYear(`${e.target.value}-${m}`)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 outline-none appearance-none"
          >
            {years.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] font-bold text-gray-400 uppercase">Year</div>
        </div>

        <div className="flex-1 relative">
          <select
            value={m}
            onChange={(e) => setMonthYear(`${y}-${e.target.value}`)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 outline-none appearance-none"
          >
            {MONTH_NAMES.map((name, i) => {
              const val = String(i + 1).padStart(2, '0');
              return <option key={val} value={val}>{name}</option>;
            })}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] font-bold text-gray-400 uppercase">Month</div>
        </div>
      </div>
    </div>
  );
}