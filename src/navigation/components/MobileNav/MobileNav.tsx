"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  LayoutPanelLeft, // Replaced ListTodo
  BookOpen,
  Brain,
  CalendarDays,
  Settings,
  LogOut,
  X,
} from "lucide-react";

import ThemeToggle from "@/theme/ThemeToggle";
import { useTheme } from "@/theme/ThemeProvider";
import ProfileStreakSwitcher from "@/navigation/components/ProfileStreakSwitcher/ProfileStreakSwitcher";

interface MobileNavProps {
  activePaths?: Record<string, boolean> | null;
  handleNav?: (path: string) => void;
  handleLogout?: () => void;
  userProfile?: any;
  currentStreak?: number;
}

const NATIVE_NAV_ITEMS = [
  { label: "Tasks", icon: LayoutGrid, path: "/", key: "isTasks" },
  { label: "Focus", icon: Brain, path: "/focus", key: "isFocus" },
  { label: "Planner", icon: CalendarDays, path: "/Planner", key: "isCalendar" },
  { label: "Diary", icon: BookOpen, path: "/diary", key: "isDiary" },
  { label: "Workspace", icon: LayoutPanelLeft, path: "/Workspace", key: "isMini" }, // Updated Icon
];

export default function MobileNav(props: MobileNavProps) {
  const {
    activePaths = {},
    handleNav = () => {},
    handleLogout = () => {},
    userProfile = null,
    currentStreak = 0,
  } = props;

  const safePaths = activePaths || {};
  const { isDarkMode } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Touch state for swipe-up navigation bar logic
  const [touchStart, setTouchStart] = useState<{ y: number; time: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // Handle drag mechanics for closing the bottom sheet drawer manually
  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.y > 120 || info.velocity.y > 600) {
      setIsDrawerOpen(false);
    }
  };

  // React-native touch handlers to prevent document event listener memory leaks
  const handleNavTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ y: e.touches[0].clientY, time: Date.now() });
  };

  const handleNavTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentY = e.touches[0].clientY;
    const distance = touchStart.y - currentY;
    const time = Date.now() - touchStart.time;
    const velocity = distance / time;

    // Rigorous swipe check (distance > 100px + swift speed)
    if (distance > 100 && velocity > 0.35) {
      setIsDrawerOpen(true);
      setTouchStart(null); // Reset to prevent multiple rapid triggers
    }
  };

  const handleNavTouchEnd = () => {
    setTouchStart(null);
  };

  // Memoized Bottom Navigation Items
  const bottomNavItems = useMemo(() => {
    return NATIVE_NAV_ITEMS.map((item) => {
      const Icon = item.icon;
      const isActive = Boolean(safePaths[item.key]);
      const uniqueKey = `${item.path}-${item.key}`;

      return (
        <button
          key={uniqueKey}
          onClick={() => handleNav(item.path)}
          aria-label={`Maps to ${item.label}`}
          aria-current={isActive ? "page" : undefined}
          className={`relative flex flex-col items-center justify-center w-full h-[65px] rounded-xl transition-all duration-300 mx-1 ${
            isActive
              ? isDarkMode ? "bg-orange-500/10 text-orange-400" : "bg-orange-50 text-orange-600"
              : isDarkMode ? "text-zinc-400 hover:text-zinc-200" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <div className="relative p-1">
            <Icon size={20} className="shrink-0" />
          </div>
          
          <span className="text-[10px] font-medium tracking-[0.02em] mt-0.5">{item.label}</span>

          {isActive && (
            <motion.div
              layoutId="native-active-dot"
              className="absolute -bottom-1 w-1 h-1 rounded-full bg-orange-500"
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
            />
          )}
        </button>
      );
    });
  }, [safePaths, isDarkMode, handleNav]);

  // Memoized Drawer Module Items
  const drawerNavItems = useMemo(() => {
    return NATIVE_NAV_ITEMS.map((item) => {
      const Icon = item.icon;
      const isActive = Boolean(safePaths[item.key]);
      const uniqueKey = `drawer-${item.path}-${item.key}`;

      return (
        <button
          key={uniqueKey}
          onClick={() => {
            handleNav(item.path);
            setIsDrawerOpen(false);
          }}
          aria-current={isActive ? "page" : undefined}
          className={`p-3.5 rounded-xl flex items-center gap-3 transition-all text-left ${
            isActive
              ? isDarkMode ? "bg-orange-500/10 border border-orange-500/20 text-orange-400 font-medium" : "bg-orange-50 text-orange-600 font-medium border border-transparent"
              : isDarkMode
              ? "bg-white/[0.025] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-zinc-100 text-zinc-300"
              : "bg-white hover:bg-gray-100 text-gray-700 shadow-sm border border-transparent"
          }`}
        >
          <Icon size={18} className={isActive ? "text-orange-500" : "text-zinc-400"} />
          <span className="text-sm font-medium tracking-wide">{item.label}</span>
        </button>
      );
    });
  }, [safePaths, isDarkMode, handleNav]);

  return (
    <>
      {/* ─── LAYER 1: TOP AREA (NATURAL APP HEADER) ─── */}
      <div className="md:hidden w-full flex items-center justify-between px-5 pt-5 pb-2 relative z-[999] select-none">
        {/* Brand Logo */}
        <div className="flex items-center flex-shrink-0 min-w-0">
          <div 
            className="relative flex items-center cursor-pointer active:opacity-80 transition-opacity"
            onClick={() => handleNav("/")}
          >
            {isDarkMode && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-orange-500/10 blur-2xl rounded-full z-0 pointer-events-none" />
            )}
            <Image
              src={isDarkMode ? "/logo-dark.svg" : "/logo-light.svg"}
              alt="NexSpace"
              width={165}
              height={40}
              className="relative z-10 h-[40px] w-auto object-contain object-left"
              priority
            />
          </div>
        </div>

        {/* Top Tools Matrix */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open navigation drawer"
            className="active:scale-95 transition-transform duration-200"
          >
            <ProfileStreakSwitcher
              userProfile={userProfile}
              currentStreak={currentStreak}
              isDarkMode={isDarkMode}
            />
          </button>
        </div>
      </div>

      {/* ─── LAYER 2: SYSTEM APP BOTTOM NAVIGATION ─── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[99999] select-none">
        {/* Subtle swipe-up handle indicator */}
        <div className="w-full flex justify-center mb-2 pointer-events-none">
           <div className={`w-10 h-1 rounded-full transition-colors ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />
        </div>

        {/* Shell Matrix Track */}
        <div 
          className={`w-full h-[90px] pb-[env(safe-area-inset-bottom)] px-2 flex justify-between items-center backdrop-blur-[12px] rounded-t-[32px] ${
            isDarkMode
              ? "bg-black/80 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]"
              : "bg-white/[0.88] shadow-[0_-8px_30px_rgba(0,0,0,0.04)]"
          }`}
          onTouchStart={handleNavTouchStart}
          onTouchMove={handleNavTouchMove}
          onTouchEnd={handleNavTouchEnd}
        >
          {bottomNavItems}
        </div>
      </div>

      {/* ─── LAYER 3: EXPANDABLE APP DRAWER BOTTOM SHEET ─── */}
      {isDrawerOpen && mounted && createPortal(
        <AnimatePresence mode="wait">
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/80 z-[999998] backdrop-blur-xl md:hidden"
          />

          <motion.div
            key="drawer-sheet"
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.9 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className={`fixed bottom-0 inset-x-0 h-[85vh] rounded-t-[32px] z-[999999] flex flex-col overflow-hidden md:hidden pb-[calc(20px+env(safe-area-inset-bottom))] ${
              isDarkMode
                ? "bg-zinc-950 text-zinc-100 border-t border-white/[0.08]"
                : "bg-zinc-50 text-gray-900 shadow-2xl"
            }`}
          >
            {/* Gesture Notch */}
            <div className="w-full flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className={`w-16 h-1.5 rounded-full ${isDarkMode ? "bg-zinc-700" : "bg-black/[0.15]"}`} />
            </div>

            {/* Header */}
            <div className={`flex items-center justify-between px-6 pb-4 pt-1 border-b ${isDarkMode ? "border-white/[0.06]" : "border-black/[0.05]"}`}>
              <Image
                src={isDarkMode ? "/logo-dark.svg" : "/logo-light.svg"}
                alt="NexSpace"
                width={160}
                height={38}
                className="h-[38px] w-auto object-contain object-left"
                priority
              />
              <button
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close navigation drawer"
                className={`p-1.5 rounded-full transition-colors ${
                  isDarkMode ? "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400" : "bg-black/[0.04] hover:bg-black/[0.08] text-gray-600"
                }`}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Profile Card with Streak Indicator */}
              <div className={`p-4 rounded-2xl flex items-center gap-4 ${
                isDarkMode ? "bg-white/[0.025] border border-white/[0.08]" : "bg-white shadow-sm border border-black/[0.05]"
              }`}>
                <div className="scale-100 origin-left shrink-0">
                  <ProfileStreakSwitcher
                    userProfile={userProfile}
                    currentStreak={currentStreak}
                    isDarkMode={isDarkMode}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm font-medium truncate ${isDarkMode ? "text-zinc-100" : "text-gray-900"}`}>
                    {userProfile?.full_name || "NexUP Pioneer"}
                  </span>
                  {userProfile?.email && (
                    <span className={`text-xs truncate ${isDarkMode ? "text-zinc-400" : "text-gray-500"}`}>
                      {userProfile.email}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-orange-500 mt-1 flex items-center gap-1">
                    🔥 {currentStreak} Day Streak
                  </span>
                </div>
              </div>

              {/* Modules Grid */}
              <div className="space-y-2.5">
                <span className={`text-[11px] font-medium uppercase tracking-widest pl-1 ${
                  isDarkMode ? "text-zinc-600" : "text-gray-400"
                }`}>
                  MODULES
                </span>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {drawerNavItems}
                </div>
              </div>

              {/* System Settings Layer */}
              <div className="space-y-2">
                <span className={`text-[11px] font-medium uppercase tracking-widest pl-1 ${
                  isDarkMode ? "text-zinc-600" : "text-gray-400"
                }`}>
                  SYSTEM
                </span>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleNav("/settings");
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full p-3.5 rounded-xl text-sm flex items-center gap-3.5 transition-colors text-left ${
                      isDarkMode
                        ? "bg-white/[0.025] border border-white/[0.08] hover:bg-white/[0.06] text-zinc-300 hover:text-zinc-100"
                        : "bg-white hover:bg-gray-100 text-gray-700 shadow-sm border border-transparent"
                    }`}
                  >
                    <Settings size={18} className={isDarkMode ? "text-zinc-400" : "text-gray-500"} />
                    <span className="text-sm font-medium tracking-wide">Account Settings</span>
                  </button>

                  <button
                    onClick={async () => {
                      setIsDrawerOpen(false);
                      if (handleLogout) await handleLogout();
                    }}
                    aria-label="Log out"
                    className={`w-full p-3.5 rounded-xl text-sm flex items-center gap-3.5 transition-colors text-left ${
                      isDarkMode
                        ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                        : "bg-red-50 border border-red-100 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-medium tracking-wide">Log Out</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}