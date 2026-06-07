"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  LayoutPanelLeft,
  BookOpen,
  Brain,
  CalendarDays,
  Settings,
  LogOut,
  User,
  Palette,
} from "lucide-react";

import ThemeToggle from "@/theme/ThemeToggle";
import { useTheme } from "@/theme/ThemeProvider";

interface DesktopNavProps {
  activePaths?: Record<string, boolean> | null;
  handleNav?: (path: string) => void;
  handleLogout?: () => void;
  userProfile?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  } | null;
  currentStreak?: number;
}

const DEFAULT_NAV_ITEMS = [
  { label: "Tasks", icon: LayoutGrid, path: "/", key: "isTasks" },
  { label: "Focus", icon: Brain, path: "/focus", key: "isFocus" },
  { label: "Planner", icon: CalendarDays, path: "/Planner", key: "isCalendar" },
  { label: "Journal", icon: BookOpen, path: "/diary", key: "isDiary" },
  { label: "Workspace", icon: LayoutPanelLeft, path: "/Workspace", key: "isMini" },
];

export default function DesktopNav(props: DesktopNavProps) {
  const {
    activePaths = {},
    handleNav = () => {},
    handleLogout = () => {},
    userProfile = null,
    currentStreak = 42,
  } = props;

  const safePaths = activePaths || {};
  const { isDarkMode } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  return (
    <>
      {/* FLAT 2030 SYSTEM WORKSTATION HEADER */}
      <div className="hidden md:block w-full px-4 lg:px-6 mt-3 relative z-[999] select-none">
        <div
          className={`relative w-full max-w-[1800px] mx-auto rounded-[24px] border backdrop-blur-sm transition-all duration-500 ${
            isDarkMode
              ? "bg-black/[0.35] border-white/[0.06] shadow-[0_10px_50px_rgba(0,0,0,0.3)]"
              : "bg-white/80 border-zinc-200/60 shadow-[0_8px_24px_rgba(0,0,0,0.01)]"
          }`}
        >
          {/* Strictly Balanced Height: 68px */}
          <div className="relative h-[68px] px-6 flex items-center justify-between">
            
            {/* LEFT: ARCHITECTURAL LOGO ONLY */}
            <div className="flex items-center flex-shrink-0">
              <div 
                className="relative flex items-center cursor-pointer"
                onClick={() => handleNav("/")}
              >
                {isDarkMode && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />
                )}
                
                <Image
                  src={isDarkMode ? "/logo-dark.svg" : "/logo-light.svg"}
                  alt="NexSpace"
                  width={220}
                  height={48}
                  className="relative z-10 h-[48px] w-auto object-contain object-left"
                  priority
                />
              </div>
            </div>

            {/* CENTER: MINIMAL TEXT-ONLY NAVIGATION LINKS */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
              {DEFAULT_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = Boolean(safePaths[item.key]);

                return (
                  <div key={item.label} className="relative">
                    <button
                      onClick={() => handleNav(item.path)}
                      className={`relative flex items-center gap-1.5 px-3 py-1 text-[13px] font-medium tracking-wide transition-colors duration-200 whitespace-nowrap z-10 ${
                        isActive
                          ? isDarkMode
                            ? "text-orange-400"
                            : "text-orange-600"
                          : isDarkMode
                          ? "text-zinc-400 hover:text-white"
                          : "text-zinc-500 hover:text-black"
                      }`}
                    >
                      <Icon size={14} className={`shrink-0 ${isActive ? "" : "opacity-60"}`} />
                      <span>{item.label}</span>

                      {/* HIGH-VISIBILITY GLOWING DOT INDICATOR */}
                      {isActive && (
                        <motion.div
                          layoutId="desktop-active-dot"
                          className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.45)]"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* RIGHT: IDENTITY ANCHOR (AVATAR + NAME) */}
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-transparent transition-all duration-200 ${
                    isDarkMode 
                      ? "hover:border-orange-500/20" 
                      : "hover:border-orange-500/20"
                  }`}
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-400 p-px shrink-0">
                    <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                      {userProfile?.avatar_url?.startsWith("http") ? (
                        <Image
                          src={userProfile.avatar_url}
                          alt="Profile"
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <User size={12} className="text-orange-400" />
                      )}
                    </div>
                  </div>

                  <span className={`text-sm font-medium tracking-wide ${isDarkMode ? "text-zinc-200" : "text-zinc-800"}`}>
                    {userProfile?.full_name?.split(" ")[0] || "Jothish"}
                  </span>
                </button>

                {/* WORKSTATION SYSTEM DROPDOWN */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-[99998]"
                        onClick={() => setIsProfileOpen(false)}
                      />

                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute top-[46px] right-0 w-64 rounded-2xl border p-1.5 z-[99999] shadow-2xl ${
                          isDarkMode
                            ? "bg-zinc-950/95 backdrop-blur-md border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                            : "bg-white/95 backdrop-blur-md border-zinc-200/80 shadow-[0_10px_40px_rgba(0,0,0,0.06)]"
                        }`}
                      >
                        <div className="p-1 space-y-0.5">
                          {/* ANALYTICS TRANSFERRED INSIDE DROPDOWN HEADER */}
                          <div className={`px-3 py-2 mb-1 flex items-center justify-between text-xs border-b ${
                            isDarkMode ? "border-white/[0.04]" : "border-zinc-100"
                          }`}>
                            <span className={isDarkMode ? "text-zinc-500" : "text-zinc-400"}>Current Progress</span>
                            <span className="text-orange-500 font-medium flex items-center gap-1">
                              🔥 {currentStreak} Days
                            </span>
                          </div>

                          {/* Profile Action */}
                          <button
                            onClick={() => {
                              handleNav("/profile");
                              setIsProfileOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-sm font-medium text-left flex items-center gap-3 transition-colors ${
                              isDarkMode 
                                ? "text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-100" 
                                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                            }`}
                          >
                            <User size={15} className={isDarkMode ? "text-zinc-400" : "text-zinc-500"} />
                            Profile
                          </button>

                          {/* Settings Action */}
                          <button
                            onClick={() => {
                              handleNav("/settings");
                              setIsProfileOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-sm font-medium text-left flex items-center gap-3 transition-colors ${
                              isDarkMode 
                                ? "text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-100" 
                                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                            }`}
                          >
                            <Settings size={15} className={isDarkMode ? "text-zinc-400" : "text-zinc-500"} />
                            Settings
                          </button>

                          {/* Integrated Theme Toggle Row */}
                          <div
                            className={`w-full px-3 py-1.5 rounded-xl text-sm font-medium flex items-center justify-between ${
                              isDarkMode ? "text-zinc-300" : "text-zinc-600"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Palette size={15} className={isDarkMode ? "text-zinc-400" : "text-zinc-500"} />
                              <span>Appearance</span>
                            </div>
                            <div className="scale-90 origin-right">
                              <ThemeToggle />
                            </div>
                          </div>

                          {/* Structural Partition Divider */}
                          <div className={`h-[1px] my-1 ${isDarkMode ? "bg-white/[0.06]" : "bg-zinc-100"}`} />

                          {/* Log Out Action */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setIsProfileOpen(false);
                              if (handleLogout) handleLogout();
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-sm font-medium text-left flex items-center gap-3 transition-colors ${
                              isDarkMode 
                                ? "text-red-400 hover:bg-red-500/10 hover:text-red-300" 
                                : "text-red-600 hover:bg-red-50 hover:text-red-700"
                            }`}
                          >
                            <LogOut size={15} />
                            Log Out
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}