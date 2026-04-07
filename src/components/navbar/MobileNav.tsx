"use client";

import React, { useState } from "react";
import { 
  LayoutGrid, 
  ListTodo, 
  BookOpen, 
  Brain, 
  CalendarDays, 
  Download, 
  Upload, 
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
  handleImportClick: () => void;
  exportData: () => void;
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
  activePaths, handleNav, y, m, years, setMonthYear, handleImportClick, exportData,
  notifications, unreadCount, markAsRead, clearAll, isNoteOpen, setIsNoteOpen,
  handleLogout, userProfile
}: MobileNavProps) {
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="md:hidden px-4 py-3 space-y-3 bg-white/95 backdrop-blur-md border-b border-gray-200">
      
      {/* ROW 1: Brand & Data Actions */}
      <div className="flex items-center justify-between relative">
        <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 bg-gray-900 text-white rounded-lg">
            <span className="text-xs font-bold">Nx</span>
          </div>
          NexTask
        </div>

        <div className="flex items-center gap-2">
          {/* ✅ MOBILE BELL ICON */}
          <button 
            onClick={() => setIsNoteOpen(!isNoteOpen)}
            className={`p-2 flex items-center justify-center rounded-lg border transition-all relative ${
              unreadCount > 0 
                ? "border-orange-200 bg-orange-50 text-orange-600 animate-in fade-in scale-105" 
                : "border-gray-200 bg-gray-50 text-gray-600 shadow-sm"
            }`}
          >
            <Bell size={16} className={unreadCount > 0 ? "animate-swing" : ""} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          <button 
            onClick={handleImportClick}
            className="p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 active:scale-90 transition-all shadow-sm"
          >
            <Download size={16} />
          </button>
          
          <button 
            onClick={exportData}
            className="p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 active:scale-90 transition-all shadow-sm"
          >
            <Upload size={16} />
          </button>

          {/* ✅ USER PROFILE DROPDOWN */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-all active:scale-95 overflow-hidden ml-1 shadow-sm"
              title="Account Settings"
            >
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={15} className="text-gray-600" />
              )}
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {userProfile?.full_name || "User"}
                    </p>
                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-0.5">
                      Online & Synced
                    </p>
                  </div>
                  
                  <div className="px-2">
                    <button 
                      onClick={() => {
                        handleNav("/settings");
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Settings size={15} className="text-gray-400" />
                      Settings
                    </button>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                    >
                      <LogOut size={15} className="text-red-400" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

        {/* ✅ MOBILE NOTIFICATION DROPDOWN */}
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
      <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePaths[item.key as keyof typeof activePaths];

          return (
            <button
              key={item.label}
              onClick={() => handleNav(item.path)}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all duration-200 active:scale-95
              ${isActive ? "bg-gray-900 text-white shadow-md scale-105" : "bg-gray-50 border border-gray-200 text-gray-600"}`}
            >
              <Icon size={14} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* ROW 3: DATE CONTROLS */}
      <div className="flex gap-2">
        <select
          value={y}
          onChange={(e) => setMonthYear(`${e.target.value}-${m}`)}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-bold text-gray-700 outline-none active:scale-[0.98] transition-transform shadow-sm"
        >
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
        <select
          value={m}
          onChange={(e) => setMonthYear(`${y}-${e.target.value}`)}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-bold text-gray-700 outline-none active:scale-[0.98] transition-transform shadow-sm"
        >
          {MONTH_NAMES.map((name, i) => {
            const val = String(i + 1).padStart(2, '0');
            return <option key={val} value={val}>{name}</option>;
          })}
        </select>
      </div>
    </div>
  );
}