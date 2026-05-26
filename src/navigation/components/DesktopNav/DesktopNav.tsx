"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  ListTodo,
  BookOpen,
  Brain,
  CalendarDays,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Settings,
  LogOut
} from "lucide-react";
import ThemeToggle from "@/theme/ThemeToggle";
import { useTheme } from "@/theme/ThemeProvider";

import NotificationCenter from "@/notifications/NotificationCenter";
import { NexNotification } from "@/notifications/types/types";
import ProfileStreakSwitcher from "@/navigation/components/ProfileStreakSwitcher/ProfileStreakSwitcher";

interface DesktopNavProps {
  activePaths?: Record<string, boolean> | null;
  handleNav?: (path: string) => void;
  notifications?: NexNotification[];
  unreadCount?: number;
  markAsRead?: (id: string) => void;
  clearAll?: () => void;
  isNoteOpen?: boolean;
  setIsNoteOpen?: (v: boolean) => void;
  handleLogout?: () => void;
  userProfile?: any;
  currentStreak?: number;
}

const DEFAULT_NAV_ITEMS = [
  { label: "Tasks", icon: LayoutGrid, path: "/", key: "isTasks" },
  { label: "Focus", icon: Brain, path: "/focus", key: "isFocus" },
  { label: "Planner", icon: CalendarDays, path: "/Planner", key: "isCalendar" },
  { label: "Diary", icon: BookOpen, path: "/diary", key: "isDiary" },
  { label: "Workspace", icon: ListTodo, path: "/Workspace", key: "isMini" },
];

export default function DesktopNav(props: DesktopNavProps) {
  const {
    activePaths = {},
    handleNav = () => {},
    notifications = [],
    unreadCount = 0,
    markAsRead = () => {},
    clearAll = () => {},
    isNoteOpen = false,
    setIsNoteOpen = () => {},
    handleLogout = () => {},
    userProfile = null,
    currentStreak = 0 
  } = props;

  const safePaths = activePaths || {};
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [isCompact, setIsCompact] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [navItems, setNavItems] = useState(DEFAULT_NAV_ITEMS);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCompact = localStorage.getItem("nextask_nav_compact");
      if (savedCompact) setIsCompact(savedCompact === "true");

      const savedOrder = localStorage.getItem("nextask_nav_order");
      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder);
          const reordered = parsedOrder.map((label: string) => 
            DEFAULT_NAV_ITEMS.find((item) => item.label === label)
          ).filter(Boolean);
          if (reordered.length === DEFAULT_NAV_ITEMS.length) {
            setNavItems(reordered);
          }
        } catch (e) {}
      }
    }
  }, []);

  const handleCompactToggle = () => {
    const newState = !isCompact;
    setIsCompact(newState);
    localStorage.setItem("nextask_nav_compact", String(newState));
  };

  const handleSort = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      let _navItems = [...navItems];
      const draggedItemContent = _navItems.splice(dragItem.current, 1)[0];
      _navItems.splice(dragOverItem.current, 0, draggedItemContent);
      
      setNavItems(_navItems);
      localStorage.setItem("nextask_nav_order", JSON.stringify(_navItems.map(i => i.label)));
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setIsDragging(false);
  };

  const handleTabDrop = (e: React.DragEvent, path: string) => {
    e.preventDefault();
    const taskData = e.dataTransfer.getData("application/json");
    if (taskData) {
      sessionStorage.setItem("nextask_dropped_task", taskData);
      router.push(path);
    }
  };

  return (
    <>
      {isNoteOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsNoteOpen(false)}
        />
      )}

      <div className={`hidden md:flex h-[64px] items-center px-6 max-w-[1500px] mx-auto w-full relative z-50 transition-colors duration-300 ${
        isDarkMode ? "bg-black/90 border-b border-white/[0.08]" : "bg-white/90 border-b border-gray-100"
      }`}>

        {/* BRAND */}
        <div className="flex items-center gap-3">
          <div 
            className={`flex items-center justify-center w-9 h-9 rounded-xl border shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-all duration-300 hover:scale-105 hover:-translate-y-[1px] cursor-pointer ${
              isDarkMode ? "bg-black border-white/[0.08] hover:bg-white/[0.03]" : "bg-[#f4f4f5] border-black/8"
            }`}
            onClick={() => handleNav("/")}
          >
          <Image 
            src="/favicon.ico" 
            alt="Nextask" 
            width={22} 
            height={22} 
            className="w-[22px] h-[22px]"
            unoptimized
          />
          </div>

          {!isCompact && (
            <span className={`font-bold tracking-tight text-lg transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Nextask <span className="text-orange-500 text-xs ml-0.5 font-bold">v1.2</span>
            </span>
          )}
        </div>

        <div className={`mx-5 w-px h-6 transition-colors ${isDarkMode ? "bg-white/[0.08]" : "bg-gray-200"}`} />

        {/* NAV (DRAG & DROP) */}
        <div className="flex gap-2 relative">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = Boolean(safePaths[item.key]);
            const isDragTarget = dragOverItem.current === index;

            return (
              <div 
                key={item.label}
                draggable
                onDragStart={(e) => {
                  dragItem.current = index;
                  setIsDragging(true);
                  e.dataTransfer.setData("text/plain", "");
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  dragOverItem.current = index;
                }}
                onDragEnd={handleSort}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleTabDrop(e, item.path)}
                className={`relative group cursor-grab active:cursor-grabbing transition-all duration-300 ${
                  isDragging && dragItem.current === index ? "opacity-50 scale-95" : "opacity-100 scale-100"
                }`}
              >
                <button
                  onClick={() => handleNav(item.path)}
                  className={`relative flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 ease-out hover:-translate-y-[1px] ${
                    isActive
                      ? isDarkMode ? "bg-orange-500/10 border border-orange-500/15 text-orange-400" : "bg-orange-50 text-orange-600"
                      : isDarkMode ? "text-zinc-500 hover:bg-white/[0.03] hover:text-white" : "text-gray-600 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  {!isCompact && <span>{item.label}</span>}

                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-orange-500 rounded-t-full shadow-[0_-2px_8px_rgba(249,115,22,0.8)]" />
                  )}
                </button>

                {isCompact && (
                  <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 rounded-md text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-50 ${
                    isDarkMode ? "bg-black text-zinc-300 border border-white/[0.08]" : "bg-gray-900 text-white"
                  }`}>
                    {item.label}
                  </div>
                )}

                {isDragging && isDragTarget && dragItem.current !== index && (
                  <div className={`absolute top-0 bottom-0 w-[2px] bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] ${
                    index > (dragItem.current || 0) ? "-right-1" : "-left-1"
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* RIGHT CONTROLS */}
        <div className="flex items-center gap-4">
          
          <ThemeToggle />

          {/* 🔔 NOTIFICATIONS */}
          {unreadCount > 0 && (
            <div className="relative flex items-center">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsNoteOpen(!isNoteOpen);
                }}
                className={`relative p-2 transition-all duration-300 rounded-full hover:-translate-y-[1px] ${
                  isDarkMode ? "text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20" : "text-orange-500 bg-orange-50 hover:bg-orange-100 border border-orange-200"
                }`}
              >
                <Bell size={18} className="animate-[pulse_3s_ease-in-out_infinite]" />
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
          )}

          {/* PROFILE / STREAK SWITCHER */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 transition-all duration-300 hover:-translate-y-[1px]"
            >
              <ProfileStreakSwitcher 
                userProfile={userProfile} 
                currentStreak={currentStreak} 
                isDarkMode={isDarkMode} 
              />

              {!isCompact && userProfile?.full_name && (
                <span className={`text-sm font-semibold hidden lg:block ${isDarkMode ? "text-zinc-200" : "text-gray-800"}`}>
                  {userProfile.full_name}
                </span>
              )}
            </button>

            {/* DROPDOWN */}
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                <div className={`absolute right-0 mt-3 w-56 border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200 ${
                  isDarkMode ? "bg-black border-white/[0.08] shadow-black/50" : "bg-white border-gray-100 shadow-gray-200/50"
                }`}>
                  <div className={`px-4 py-3 border-b mb-1 ${isDarkMode ? "border-white/[0.08]" : "border-gray-50"}`}>
                    <p className={`text-sm font-bold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {userProfile?.full_name || "User"}
                    </p>
                    <p className={`text-[10px] truncate mt-0.5 uppercase tracking-widest font-bold ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
                      {userProfile?.email || ""}
                    </p>
                  </div>

                  <button
                    onClick={() => { handleNav("/settings"); setIsProfileOpen(false); }}
                    className={`w-full px-4 py-2.5 text-sm text-left font-medium flex items-center gap-3 transition-colors ${
                      isDarkMode ? "text-zinc-300 hover:bg-white/[0.03]" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Settings size={15} className={isDarkMode ? "text-zinc-500" : "text-gray-400"} /> Settings
                  </button>

                  <button
                    onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                    className={`w-full px-4 py-2.5 text-sm text-left font-medium flex items-center gap-3 transition-colors ${
                      isDarkMode ? "text-red-400 hover:bg-red-950/30" : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* COMPACT MODE TOGGLE */}
          <button 
            onClick={handleCompactToggle}
            className={`p-2 ml-2 rounded-xl transition-all duration-300 hover:-translate-y-[1px] border ${
              isDarkMode 
                ? "bg-black border-white/[0.08] text-zinc-500 hover:text-white hover:bg-white/[0.03]" 
                : "bg-white border-gray-200 text-gray-400 hover:text-black hover:border-gray-300"
            }`}
          >
            {isCompact ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>

        </div>
      </div>
    </>
  );
}