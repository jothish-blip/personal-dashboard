"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Palette,
  Settings,
  LogOut,
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
  { label: "Tasks", path: "/", key: "isTasks" },
  { label: "Focus", path: "/focus", key: "isFocus" },
  { label: "Planner", path: "/Planner", key: "isCalendar" },
  { label: "Journal", path: "/diary", key: "isDiary" },
  { label: "Workspace", path: "/Workspace", key: "isMini" },
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

  // Esc to close profile dropdown
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
      <div className="hidden md:block w-full px-4 lg:px-6 mt-4 relative z-[999] select-none">
        <div
          className={`relative w-full max-w-[1800px] mx-auto rounded-[28px] transition-all duration-500 ${
            isDarkMode
              ? "bg-black/[0.14] backdrop-blur-[28px] shadow-[0_10px_50px_rgba(0,0,0,0.3)]"
              : "bg-white/50 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.01)]"
          }`}
          style={{
            backgroundImage: isDarkMode 
              ? "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))" 
              : "none"
          }}
        >
          {/* Breathing Room: 76px */}
          <div className="relative h-[76px] px-6 flex items-center justify-between">
            
            {/* LEFT: ARCHITECTURAL LOGO ONLY */}
            <div className="flex items-center flex-shrink-0">
              <div 
                className="relative flex items-center cursor-pointer group"
                onClick={() => handleNav("/")}
              >
                {/* Subtle Orange Pulse for Dark Mode */}
                {isDarkMode && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-orange-500/[0.08] blur-[40px] rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-60" />
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
                const isActive = Boolean(safePaths[item.key]);

                return (
                  <button
                    key={item.label}
                    onClick={() => handleNav(item.path)}
                    // Subtle hover lift (translateY(-1px))
                    className={`relative px-4 py-2 text-[14px] font-medium tracking-wide transition-all duration-200 hover:-translate-y-px whitespace-nowrap z-10 ${
                      isActive
                        ? isDarkMode
                          ? "text-orange-400"
                          : "text-orange-600"
                        : isDarkMode
                        ? "text-zinc-400 hover:text-zinc-200"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    <span className="relative z-10">{item.label}</span>

                    {/* LIQUID ACTIVE PILL INDICATOR */}
                    {isActive && (
                      <motion.div
                        layoutId="desktop-active-pill"
                        className={`absolute inset-0 rounded-full backdrop-blur-xl ${
                          isDarkMode 
                            ? "bg-orange-500/12 border border-orange-500/10 shadow-[0_0_40px_rgba(249,115,22,0.15)]" 
                            : "bg-orange-500/8"
                        }`}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* RIGHT: IDENTITY ANCHOR */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {/* Elevated z-index ensures button sits above the fixed backdrop for proper toggle logic */}
                <button
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className={`relative z-[100000] flex items-center gap-3 px-2 py-1.5 pr-4 rounded-full transition-all duration-200 hover:scale-[1.02] ${
                    isDarkMode 
                      ? "hover:bg-white/5" 
                      : "hover:bg-black/5"
                  } ${isProfileOpen ? (isDarkMode ? "bg-white/5" : "bg-black/5") : ""}`}
                >
                  <div className={`relative w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${
                    isDarkMode ? "bg-white/5" : "bg-black/5"
                  }`}>
                    {userProfile?.avatar_url?.startsWith("http") ? (
                      <Image
                        src={userProfile.avatar_url}
                        alt="Profile"
                        width={36}
                        height={36}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <User size={15} className={isDarkMode ? "text-zinc-400" : "text-zinc-500"} />
                    )}
                  </div>

                  {/* Combined Name & Streak Identity */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[14px] font-medium tracking-wide ${isDarkMode ? "text-zinc-200" : "text-zinc-800"}`}>
                      {userProfile?.full_name?.split(" ")[0] || "Jothish"}
                    </span>
                    <div className={`w-[1px] h-3 ${isDarkMode ? "bg-white/20" : "bg-black/20"}`} />
                    <span className="text-[13px] font-bold text-orange-500 flex items-center gap-1">
                      🔥 {currentStreak}
                    </span>
                  </div>
                </button>

                {/* WORKSTATION SYSTEM DROPDOWN */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <>
                      {/* Invisible backdrop to capture outside clicks */}
                      <div
                        className="fixed inset-0 z-[99998]"
                        onClick={() => setIsProfileOpen(false)}
                      />

                      <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 6 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute top-[60px] right-0 w-64 rounded-[32px] p-2 z-[99999] shadow-2xl border ${
                          isDarkMode
                            ? "bg-zinc-950/95 backdrop-blur-md border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                            : "bg-white/95 backdrop-blur-md border-zinc-200/80 shadow-[0_10px_40px_rgba(0,0,0,0.06)]"
                        }`}
                      >
                        {/* Unified Profile Header inside Dropdown */}
                        <div className="flex flex-col items-center text-center pt-4 pb-5 mb-2 border-b border-zinc-500/10">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden mb-3 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                            {userProfile?.avatar_url?.startsWith("http") ? (
                              <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <User size={20} className={isDarkMode ? "text-zinc-400" : "text-zinc-500"} />
                            )}
                          </div>
                          <p className={`text-[16px] font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                            {userProfile?.full_name || "NexUP Pioneer"}
                          </p>
                          <p className="text-[13px] font-medium text-orange-500 mt-1 flex items-center gap-1">
                            🔥 {currentStreak} Day Streak
                          </p>
                        </div>

                        <div className="p-1 space-y-0.5">
                          {/* Profile Action */}
                          <button
                            onClick={() => {
                              handleNav("/profile");
                              setIsProfileOpen(false);
                            }}
                            className={`w-full px-3 py-2.5 rounded-[20px] text-sm font-medium text-left flex items-center gap-3 transition-colors ${
                              isDarkMode 
                                ? "text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-100" 
                                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                            }`}
                          >
                            <User size={16} className={isDarkMode ? "text-zinc-400" : "text-zinc-500"} />
                            Profile
                          </button>

                          {/* Settings Action */}
                          <button
                            onClick={() => {
                              handleNav("/settings");
                              setIsProfileOpen(false);
                            }}
                            className={`w-full px-3 py-2.5 rounded-[20px] text-sm font-medium text-left flex items-center gap-3 transition-colors ${
                              isDarkMode 
                                ? "text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-100" 
                                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                            }`}
                          >
                            <Settings size={16} className={isDarkMode ? "text-zinc-400" : "text-zinc-500"} />
                            Settings
                          </button>

                          {/* Integrated Theme Toggle Row */}
                          <div
                            className={`w-full px-3 py-2 rounded-[20px] text-sm font-medium flex items-center justify-between ${
                              isDarkMode ? "text-zinc-300" : "text-zinc-600"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Palette size={16} className={isDarkMode ? "text-zinc-400" : "text-zinc-500"} />
                              <span>Appearance</span>
                            </div>
                            <div className="scale-90 origin-right">
                              <ThemeToggle />
                            </div>
                          </div>

                          {/* Structural Partition Divider */}
                          <div className={`h-[1px] my-1.5 ${isDarkMode ? "bg-white/[0.06]" : "bg-zinc-100"}`} />

                          {/* Log Out Action */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setIsProfileOpen(false);
                              if (handleLogout) handleLogout();
                            }}
                            className={`w-full px-3 py-2.5 rounded-[20px] text-sm font-medium text-left flex items-center gap-3 transition-colors ${
                              isDarkMode 
                                ? "text-red-400 hover:bg-red-500/10 hover:text-red-300" 
                                : "text-red-600 hover:bg-red-50 hover:text-red-700"
                            }`}
                          >
                            <LogOut size={16} />
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