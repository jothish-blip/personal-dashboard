"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  ListTodo,
  BookOpen,
  Brain,
  CalendarDays,
  Settings,
  LogOut,
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

// Shortened labels for mobile elegance
const DEFAULT_NAV_ITEMS = [
  { label: "Tasks", icon: LayoutGrid, path: "/", key: "isTasks" },
  { label: "Focus", icon: Brain, path: "/focus", key: "isFocus" },
  { label: "Plan", icon: CalendarDays, path: "/Planner", key: "isCalendar" },
  { label: "Journal", icon: BookOpen, path: "/diary", key: "isDiary" },
  { label: "Files", icon: ListTodo, path: "/Workspace", key: "isMini" },
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent SSR hydration mismatch with portals
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const navItems = DEFAULT_NAV_ITEMS;

  // Glass panel shared styles
  const glassPanelClass = `w-full rounded-[20px] border backdrop-blur-3xl transition-all duration-500 ${
    isDarkMode
      ? "bg-black/[0.28] border-white/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.25)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/[0.06] before:rounded-t-[20px]"
      : "bg-white/[0.72] border-zinc-200/60 shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
  }`;

  return (
    <>
      {/* FLOATING TRANSPARENT GLASS NAVBAR (MOBILE ONLY) */}
      <div className="md:hidden w-full px-3 sm:px-4 mt-3 relative z-[999] flex flex-col gap-2">
        
        {/* LAYER 1: LOGO & TOOLS */}
        <div className={`relative flex items-center justify-between px-4 h-[54px] ${glassPanelClass}`}>
          {/* BRAND */}
          <div className="flex items-center flex-shrink-0 min-w-0">
            <div 
              className="relative flex items-center cursor-pointer"
              onClick={() => handleNav("/")}
            >
              {/* Subtle Ambient Glow */}
              {isDarkMode && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-orange-500/20 blur-2xl rounded-full z-0 pointer-events-none" />
              )}
              
              <Image
                src={isDarkMode ? "/logo-dark.svg" : "/logo-light.svg"}
                alt="NexSpace"
                width={140}
                height={34}
                className="relative z-10 h-[34px] w-auto object-contain object-left"
                priority
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* PROFILE */}
            <div className="relative flex items-center justify-center">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="active:scale-95 transition-transform"
              >
                <ProfileStreakSwitcher
                  userProfile={userProfile}
                  currentStreak={currentStreak}
                  isDarkMode={isDarkMode}
                />
              </button>

              {/* RENDER DROPDOWN IN PORTAL */}
              {isProfileOpen && mounted && createPortal(
                <>
                  <div
                    className="fixed inset-0 z-[999998]"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div
                    className={`
                      fixed
                      top-[72px]
                      right-4
                      w-64
                      rounded-2xl
                      border
                      shadow-2xl
                      py-2
                      z-[999999]
                      animate-in fade-in zoom-in-95 duration-200
                      ${
                        isDarkMode
                          ? "bg-black border-white/[0.04] shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                          : "bg-white border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
                      }
                    `}
                  >
                    {/* Dropdown Header */}
                    <div className={`px-4 py-4 border-b mb-1 ${isDarkMode ? "border-white/[0.04]" : "border-gray-100"}`}>
                      <div className="flex items-center gap-3">
                        <div className="pointer-events-none scale-90 origin-left">
                           <ProfileStreakSwitcher
                            userProfile={userProfile}
                            currentStreak={currentStreak}
                            isDarkMode={isDarkMode}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-sm font-semibold truncate ${isDarkMode ? "text-zinc-200" : "text-gray-800"}`}>
                            {userProfile?.full_name || "User"}
                          </span>
                          {userProfile?.email && (
                            <span className={`text-xs truncate ${isDarkMode ? "text-zinc-500" : "text-gray-500"}`}>
                              {userProfile.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dropdown Actions */}
                    <div className="px-1.5">
                      <button
                        onClick={() => {
                          handleNav("/settings");
                          setIsProfileOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-sm text-left flex items-center gap-3 transition-colors ${
                          isDarkMode 
                            ? "text-zinc-300 hover:bg-orange-500/[0.08] hover:text-white" 
                            : "text-gray-600 hover:bg-gray-100 hover:text-black"
                        }`}
                      >
                        <Settings size={15} />
                        Settings
                      </button>

                      <button
                        onClick={async () => {
                          setIsProfileOpen(false);
                          if (handleLogout) await handleLogout();
                        }}
                        className={`w-full mt-1 px-3 py-2 rounded-xl text-sm text-left flex items-center gap-3 transition-colors ${
                          isDarkMode 
                            ? "text-red-500 hover:bg-red-500/[0.08] hover:text-red-400" 
                            : "text-red-500 hover:bg-red-50 hover:text-red-600"
                        }`}
                      >
                        <LogOut size={15} /> 
                        Logout
                      </button>
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>
          </div>
        </div>

        {/* LAYER 2: NAVIGATION TABS */}
        <div className={`relative flex justify-between items-center px-1.5 h-[56px] ${glassPanelClass}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = Boolean(safePaths[item.key]);

            return (
              <button
                key={item.label}
                onClick={() => handleNav(item.path)}
                className={`relative flex flex-col items-center justify-center gap-1 w-full h-full rounded-xl transition-colors duration-300 z-10 ${
                  isActive
                    ? isDarkMode
                      ? "text-orange-400"
                      : "text-orange-600"
                    : isDarkMode
                    ? "text-zinc-500 hover:text-zinc-300"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {/* Framer Motion Active Pill */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-active-nav-pill"
                    className={`absolute inset-1 rounded-lg -z-10 ${
                      isDarkMode ? "bg-orange-500/[0.16]" : "bg-orange-500/[0.08]"
                    }`}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                
                <Icon size={18} className="shrink-0" />
                <span className="text-[10px] font-semibold tracking-wide leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}