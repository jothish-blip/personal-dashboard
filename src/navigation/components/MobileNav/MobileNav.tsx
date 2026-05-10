"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  LayoutGrid,
  ListTodo,
  BookOpen,
  Brain,
  CalendarDays,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import ThemeToggle from "@/theme/ThemeToggle";
import { useTheme } from "@/theme/ThemeProvider";

import NotificationCenter from "@/notifications/NotificationCenter";
import { NexNotification } from "@/notifications/types/types";
import ProfileStreakSwitcher from "@/navigation/components/ProfileStreakSwitcher/ProfileStreakSwitcher";

interface MobileNavProps {
  activePaths?: Record<string, boolean> | null; // Allow null to prevent crashes
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

export default function MobileNav(props: MobileNavProps) {
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

  // 🔥 Bulletproof fallback to prevent crashes if passed explicitly as null
  const safePaths = activePaths || {};

  const { isDarkMode } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Mobile Reordering
  const [navItems, setNavItems] = useState(DEFAULT_NAV_ITEMS);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  // Hydrate persistence
  useEffect(() => {
    if (typeof window !== "undefined") {
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

  const saveOrder = (newOrder: typeof DEFAULT_NAV_ITEMS) => {
    setNavItems(newOrder);
    localStorage.setItem("nextask_nav_order", JSON.stringify(newOrder.map(i => i.label)));
  };

  const moveItem = (index: number, direction: 'left' | 'right') => {
    const newItems = [...navItems];
    if (direction === 'left' && index > 0) {
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      saveOrder(newItems);
    } else if (direction === 'right' && index < newItems.length - 1) {
      [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
      saveOrder(newItems);
    }
  };

  // Touch Drag Handlers
  const handleTouchStart = (idx: number) => {
    pressTimer.current = setTimeout(() => {
      setIsEditMode(true);
      setDraggingIdx(idx);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500); 
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isEditMode || draggingIdx === null) return;
    e.preventDefault(); 
    
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetIdxStr = el?.closest('[data-index]')?.getAttribute('data-index');
    
    if (targetIdxStr !== undefined && targetIdxStr !== null) {
      const targetIdx = parseInt(targetIdxStr);
      if (targetIdx !== draggingIdx && targetIdx >= 0 && targetIdx < navItems.length) {
        const newItems = [...navItems];
        const temp = newItems[draggingIdx];
        newItems[draggingIdx] = newItems[targetIdx];
        newItems[targetIdx] = temp;
        setDraggingIdx(targetIdx);
        saveOrder(newItems);
        if (navigator.vibrate) navigator.vibrate(20);
      }
    }
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (draggingIdx !== null) setDraggingIdx(null);
  };

  useEffect(() => {
    const clickOutside = () => setIsEditMode(false);
    if (isEditMode) window.addEventListener("click", clickOutside);
    return () => window.removeEventListener("click", clickOutside);
  }, [isEditMode]);

  return (
    <>
      {/* Notification Blur Overlay */}
      {isNoteOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsNoteOpen(false)}
        />
      )}

      <div className={`md:hidden space-y-1 z-50 relative transition-colors duration-300 pb-1 ${
        isDarkMode ? "bg-[#050505]/95 border-b border-gray-800" : "bg-white/95 border-b border-gray-100"
      }`}>

        {/* TOP ROW: LOGO & TOOLS */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          
          <div className="flex items-center gap-2.5">
            <div 
              className={`flex items-center justify-center w-[28px] h-[28px] rounded-lg border shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-all duration-300 cursor-pointer ${
                isDarkMode ? "bg-[#111111] border-white/8" : "bg-[#f4f4f5] border-black/8"
              }`}
              onClick={() => handleNav("/")}
            >
             <Image 
          src="/favicon.ico" 
          alt="Nextask" 
          width={18} 
          height={18} 
          className="w-[18px] h-[18px]"
          unoptimized
            />
            </div>
            <span className={`font-bold tracking-tight text-base transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Nextask <span className="text-orange-500 text-[10px] ml-0.5 font-bold">v1.2</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            
            {/* 🔔 Notifications */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsNoteOpen(!isNoteOpen);
                }}
                className={`flex items-center justify-center w-[40px] h-[40px] transition-colors rounded-full ${
                  unreadCount > 0 
                    ? (isDarkMode ? "text-orange-400" : "text-orange-500") 
                    : (isDarkMode ? "text-gray-500" : "text-gray-400")
                }`}
              >
                <Bell size={20} className={unreadCount > 0 ? "animate-pulse drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]" : ""} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full" />
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
            <div className="relative flex items-center justify-center w-[40px] h-[40px]">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="active:scale-95 transition-transform">
                <ProfileStreakSwitcher 
                  userProfile={userProfile} 
                  currentStreak={currentStreak} 
                  isDarkMode={isDarkMode} 
                />
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className={`absolute right-0 top-12 mt-2 w-56 border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200 ${
                    isDarkMode ? "bg-[#111111] border-gray-800 shadow-black/50" : "bg-white border-gray-200 shadow-gray-200/50"
                  }`}>
                    <div className={`px-4 py-3 border-b mb-1 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
                      <p className={`text-sm font-bold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {userProfile?.full_name || "User"}
                      </p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest truncate mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {userProfile?.email || ""}
                      </p>
                    </div>

                    <button
                      onClick={() => { handleNav("/settings"); setIsProfileOpen(false); }}
                      className={`w-full px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition ${
                        isDarkMode ? "text-gray-300 hover:bg-[#1a1a1a]" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Settings size={15} className={isDarkMode ? "text-gray-500" : "text-gray-400"} /> Settings
                    </button>

                    <button
                      onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                      className={`w-full px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition ${
                        isDarkMode ? "text-red-400 hover:bg-red-950/30" : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        {/* BOTTOM ROW: NAVIGATION TABS */}
        <div 
          className="flex justify-between items-center px-1 pb-1"
          onTouchMove={handleTouchMove} 
          onTouchEnd={handleTouchEnd}
        >
          {navItems.map((item, index) => {
            const Icon = item.icon;
            // 🔥 Bulletproof verification
            const isActive = Boolean(safePaths[item.key]);
            const isDraggingThis = draggingIdx === index;

            return (
              <div 
                key={item.label} 
                data-index={index}
                className="relative"
              >
                {/* EDIT MODE ARROWS */}
                {isEditMode && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/80 rounded-full px-1 py-0.5 z-50">
                    <button onClick={(e) => { e.stopPropagation(); moveItem(index, 'left'); }} disabled={index === 0} className="text-white disabled:opacity-30 p-0.5"><ChevronLeft size={12}/></button>
                    <button onClick={(e) => { e.stopPropagation(); moveItem(index, 'right'); }} disabled={index === navItems.length - 1} className="text-white disabled:opacity-30 p-0.5"><ChevronRight size={12}/></button>
                  </div>
                )}

                <button
                  onTouchStart={() => handleTouchStart(index)}
                  onClick={(e) => {
                    if (isEditMode) e.stopPropagation(); 
                    else handleNav(item.path);
                  }}
                  className={`relative flex flex-col items-center gap-1 text-[10px] font-semibold tracking-wide py-1.5 px-3 rounded-xl transition-all duration-300 ${
                    isEditMode ? "animate-[wiggle_0.3s_ease-in-out_infinite] scale-95" : ""
                  } ${
                    isDraggingThis ? "opacity-50 scale-110 shadow-lg z-50" : "opacity-100"
                  } ${
                    isActive 
                      ? isDarkMode ? "text-orange-400 bg-orange-950/30" : "text-orange-600 bg-orange-50" 
                      : isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Icon size={18} className={isEditMode ? "text-gray-400" : ""} />
                  <span className="leading-none">{item.label}</span>
                  {isActive && !isEditMode && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-orange-500 rounded-t-full shadow-[0_-2px_6px_rgba(249,115,22,0.6)]" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes wiggle {
            0%, 100% { transform: rotate(-3deg); }
            50% { transform: rotate(3deg); }
          }
        `}} />
      </div>
    </>
  );
}