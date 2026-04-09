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

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

const NAV_ITEMS = [
  { label: "Tasks", icon: LayoutGrid, path: "/", key: "isTasks" },
  { label: "Mini", icon: ListTodo, path: "/mini-nisc", key: "isMini" },
  { label: "Diary", icon: BookOpen, path: "/diary", key: "isDiary" },
  { label: "Focus", icon: Brain, path: "/focus", key: "isFocus" },
  { label: "Planner", icon: CalendarDays, path: "/calender-event", key: "isCalendar" },
];

export default function DesktopNav({
  activePaths,
  handleNav,
  y,
  m,
  years,
  setMonthYear,
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
        <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-lg text-sm font-bold">
          Nx
        </div>

        {!isCollapsed && (
          <span className="font-semibold">
            NexTask <span className="text-orange-500 text-xs">v1.2</span>
          </span>
        )}
      </div>

      <div className="mx-4 w-px h-5 bg-gray-200" />

      {/* NAV */}
      <div className="flex gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePaths[item.key as keyof typeof activePaths];

          return (
            <button
              key={item.label}
              onClick={() => handleNav(item.path)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                isActive
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={16} />
              {!isCollapsed && item.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* RIGHT */}
      <div className="flex items-center gap-3">

        {/* DATE */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <select
            value={y}
            onChange={(e) => setMonthYear(`${e.target.value}-${m}`)}
            className="bg-transparent outline-none cursor-pointer"
          >
            {years.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>

          <select
            value={m}
            onChange={(e) => setMonthYear(`${y}-${e.target.value}`)}
            className="bg-transparent outline-none cursor-pointer"
          >
            {MONTH_NAMES.map((name, i) => {
              const val = String(i + 1).padStart(2, "0");
              return <option key={val}>{name}</option>;
            })}
          </select>
        </div>

        {/* 🔔 NOTIFICATIONS */}
        <div className="relative flex items-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // ✅ FIX: Pass the updated boolean directly instead of the callback function
              setIsNoteOpen(!isNoteOpen);
            }}
            className="relative p-2 text-gray-500 hover:text-black transition"
          >
            <Bell size={18} />

            {unreadCount > 0 && (
              <span className="absolute -top-1 right-0 text-[10px] bg-black text-white px-1.5 py-0.5 rounded-full">
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
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            {userProfile?.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                className="w-8 h-8 rounded-full object-cover bg-gray-100"
                alt="Profile"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <User size={16} className="text-gray-500" />
              </div>
            )}

            {/* ✅ ADD NAME BACK */}
            {userProfile?.full_name && (
              <span className="text-sm font-medium text-gray-700 hidden lg:block">
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

              <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">

                {/* ✅ USER INFO */}
                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {userProfile?.full_name || "User"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {userProfile?.email || ""}
                  </p>
                </div>

                <button
                  onClick={() => { handleNav("/settings"); setIsProfileOpen(false); }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2 transition"
                >
                  <Settings size={14} /> Settings
                </button>

                <button
                  onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                  className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
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
          className="p-2 text-gray-400 hover:text-black transition"
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

      </div>
    </div>
  );
}