"use client";

import React, { useState } from "react";
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

interface DesktopNavProps {
  activePaths?: Record<string, boolean> | null;
  handleNav?: (path: string) => void;
  handleLogout?: () => void;
  userProfile?: any;
  currentStreak?: number;
}

const DEFAULT_NAV_ITEMS = [
  { label: "Tasks", icon: LayoutGrid, path: "/", key: "isTasks" },
  { label: "Focus", icon: Brain, path: "/focus", key: "isFocus" },
  { label: "Calendar", icon: CalendarDays, path: "/Planner", key: "isCalendar" },
  { label: "Journal", icon: BookOpen, path: "/diary", key: "isDiary" },
  { label: "Workspace", icon: ListTodo, path: "/Workspace", key: "isMini" },
];

export default function DesktopNav(props: DesktopNavProps) {
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
  const [navItems] = useState(DEFAULT_NAV_ITEMS);

  return (
    <>
      {/* FLOATING TRANSPARENT GLASS NAVBAR (DESKTOP ONLY) */}
      <div className="hidden md:block w-full px-4 lg:px-6 mt-3 relative z-[999]">
        <div
          className={`relative w-full max-w-[1800px] mx-auto rounded-[28px] border backdrop-blur-3xl transition-all duration-500 ${
            isDarkMode
              ? "bg-black/[0.28] border-white/[0.05] shadow-[0_10px_50px_rgba(0,0,0,0.25)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/[0.06] before:rounded-t-[28px]"
              : "bg-white/[0.72] border-zinc-200/60 shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
          }`}
        >
          {/* Increased height to 66px */}
          <div className="relative h-[66px] px-4 lg:px-6 flex items-center justify-between">
            
            {/* LEFT: BRAND */}
            <div className="flex items-center flex-shrink-0 min-w-0">
              {/* Removed hover scale, kept cursor pointer */}
              <div 
                className="relative flex items-center cursor-pointer transition-colors duration-300"
                onClick={() => handleNav("/")}
              >
                {/* Subtle Ambient Glow */}
                {isDarkMode && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-orange-500/20 blur-3xl rounded-full z-0 pointer-events-none" />
                )}
                
                {/* Increased logo size */}
                <Image
                  src={isDarkMode ? "/logo-dark.svg" : "/logo-light.svg"}
                  alt="NexSpace"
                  width={220}
                  height={52}
                  className="relative z-10 h-[52px] w-auto object-contain object-left"
                  priority
                />
              </div>
            </div>

            {/* CENTER NAV: FLOATING ISLAND */}
            <div 
              className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-[18px] transition-colors duration-300 ${
                isDarkMode ? "bg-white/[0.025] border border-white/[0.04]" : "bg-black/[0.025] border border-transparent"
              }`}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = Boolean(safePaths[item.key]);

                return (
                  <button
                    key={item.label}
                    onClick={() => handleNav(item.path)}
                    className={`relative flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl text-[13px] font-medium tracking-wide transition-colors duration-300 whitespace-nowrap z-10 ${
                      isActive
                        ? isDarkMode
                          ? "text-orange-400"
                          : "text-orange-600"
                        : isDarkMode
                        ? "text-zinc-500 hover:text-zinc-300"
                        : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    {/* Micro Motion Active Pill (Increased Opacity) */}
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-pill"
                        className={`absolute inset-0 rounded-xl -z-10 ${
                          isDarkMode ? "bg-orange-500/[0.16]" : "bg-orange-500/[0.08]"
                        }`}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    
                    <Icon size={15} className="shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* RIGHT SIDE: THEME & PROFILE */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <ThemeToggle />

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95"
                >
                  <ProfileStreakSwitcher
                    userProfile={userProfile}
                    currentStreak={currentStreak}
                    isDarkMode={isDarkMode}
                  />
                </button>

                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[99998]"
                      onClick={() => setIsProfileOpen(false)}
                    />

                    {/* Adjusted position to right-4, updated dark mode bg/blur/border */}
                    <div
                      className={`
                        fixed top-[74px] right-4 w-72 rounded-2xl border shadow-2xl py-2 z-[99999] 
                        animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200
                        ${
                          isDarkMode
                            ? "bg-black/95 backdrop-blur-xl border-white/[0.06] shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                            : "bg-white/90 backdrop-blur-xl border-gray-200/80 shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
                        }
                      `}
                    >
                      {/* Dropdown Header */}
                      <div className={`px-4 py-3 mb-1 border-b ${isDarkMode ? "border-white/[0.06]" : "border-gray-100"}`}>
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
                          onClick={(e) => {
                            e.stopPropagation();
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
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsProfileOpen(false);
                            if (handleLogout) handleLogout();
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}