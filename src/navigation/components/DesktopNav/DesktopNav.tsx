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
      {/* PURE BLACK WORKSTATION HEADER */}
      <div className="hidden md:block w-full px-4 lg:px-6 mt-4 relative z-[999] select-none">
        <div
          className={`relative w-full max-w-[1800px] mx-auto rounded-[24px] transition-all duration-500 ${
            isDarkMode
              ? "bg-[#000000] border border-white/[0.04] shadow-none"
              : "bg-white border border-zinc-200/80 shadow-[0_8px_24px_rgba(0,0,0,0.01)]"
          }`}
        >
          {/* Expanded Breathing Room: 82px */}
          <div className="relative h-[82px] px-6 flex items-center justify-between">
            
            {/* LEFT: CALIBRATED ARCHITECTURAL LOGO */}
            <div className="flex items-center flex-shrink-0">
              <div 
                className="relative flex items-center cursor-pointer group"
                onClick={() => handleNav("/")}
              >
                {/* Ultra-subtle Environmental Contrast Ring */}
                {isDarkMode && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-orange-500/[0.03] blur-[32px] rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50" />
                )}
                
                <Image
                  src={isDarkMode ? "/logo-dark.svg" : "/logo-light.svg"}
                  alt="NexSpace"
                  width={280}
                  height={70}
                  className="relative z-10 h-[70px] w-auto object-contain object-left"
                  priority
                />
              </div>
            </div>

            {/* CENTER: HIGH-CONTRAST TYPOGRAPHIC NAVIGATION */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
              {DEFAULT_NAV_ITEMS.map((item) => {
                const isActive = Boolean(safePaths[item.key]);

                return (
                  <button
                    key={item.label}
                    onClick={() => handleNav(item.path)}
                    className={`relative px-4 py-2 text-[14px] font-medium tracking-wide transition-all duration-200 whitespace-nowrap z-10 ${
                      isActive
                        ? isDarkMode
                          ? "text-white"
                          : "text-zinc-950"
                        : isDarkMode
                        ? "text-zinc-500 hover:text-white"
                        : "text-zinc-400 hover:text-zinc-900"
                    }`}
                  >
                    <span className="relative z-10">{item.label}</span>

                    {/* REFINED ARCHITECTURAL PILL INDICATOR */}
                    {isActive && (
                      <motion.div
                        layoutId="desktop-active-pill"
                        className={`absolute inset-0 rounded-full ${
                          isDarkMode 
                            ? "bg-white/[0.03] border border-white/[0.05]" 
                            : "bg-zinc-100 border border-zinc-200/50"
                        }`}
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}

                    {/* HIGH-PRECISION REFINED ACTIVE SUB-DOT */}
                    {isActive && (
                      <motion.div 
                        layoutId="desktop-active-dot"
                        className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-3 h-[1.5px] bg-orange-500 rounded-full"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* RIGHT: IDENTITY ANCHOR */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className={`relative z-[100000] flex items-center gap-3 px-2 py-1.5 pr-4 rounded-full transition-all duration-200 ${
                    isDarkMode 
                      ? "hover:bg-white/[0.02]" 
                      : "hover:bg-black/[0.02]"
                  } ${isProfileOpen ? (isDarkMode ? "bg-white/[0.02]" : "bg-black/[0.02]") : ""}`}
                >
                  <div className={`relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 border ${
                    isDarkMode ? "bg-[#000000] border-white/[0.05]" : "bg-black/5 border-transparent"
                  }`}>
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
                      <User size={14} className={isDarkMode ? "text-zinc-500" : "text-zinc-400"} />
                    )}
                  </div>

                  {/* Combined Structural Identity */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[13px] font-medium tracking-wide ${isDarkMode ? "text-zinc-300" : "text-zinc-800"}`}>
                      {userProfile?.full_name?.split(" ")[0] || "Jothish"}
                    </span>
                    <div className={`w-[1px] h-2.5 ${isDarkMode ? "bg-white/[0.08]" : "bg-black/10"}`} />
                    <span className="text-[12px] font-bold text-orange-500 flex items-center gap-0.5">
                      🔥 {currentStreak}
                    </span>
                  </div>
                </button>

                {/* SOLID PURE BLACK DROPDOWN SYSTEM */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-[99998]"
                        onClick={() => setIsProfileOpen(false)}
                      />

                      <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 4 }}
                        transition={{ duration: 0.12, ease: "easeOut" }}
                        className={`absolute top-[54px] right-0 w-60 rounded-[20px] p-1.5 z-[99999] border shadow-none ${
                          isDarkMode
                            ? "bg-[#000000] border-white/[0.06]"
                            : "bg-white border-zinc-200/80"
                        }`}
                      >
                        {/* Dropdown Header */}
                        <div className="flex flex-col items-center text-center pt-3 pb-4 mb-1 border-b border-white/[0.04]">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden mb-2.5 border ${
                            isDarkMode ? "bg-[#000000] border-white/[0.05]" : "bg-black/5 border-transparent"
                          }`}>
                            {userProfile?.avatar_url?.startsWith("http") ? (
                              <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <User size={18} className={isDarkMode ? "text-zinc-500" : "text-zinc-400"} />
                            )}
                          </div>
                          <p className={`text-[14px] font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                            {userProfile?.full_name || "NexUP Pioneer"}
                          </p>
                          <p className="text-[12px] font-medium text-orange-500 mt-0.5 flex items-center gap-0.5">
                            🔥 {currentStreak} Day Streak
                          </p>
                        </div>

                        <div className="space-y-0.5">
                          {/* Profile Action */}
                          <button
                            onClick={() => {
                              handleNav("/profile");
                              setIsProfileOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-[14px] text-[13px] font-medium text-left flex items-center gap-3 transition-colors ${
                              isDarkMode 
                                ? "text-zinc-400 hover:bg-white/[0.02] hover:text-white" 
                                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                            }`}
                          >
                            <User size={15} className={isDarkMode ? "text-zinc-500" : "text-zinc-400"} />
                            Profile
                          </button>

                          {/* Settings Action */}
                          <button
                            onClick={() => {
                              handleNav("/settings");
                              setIsProfileOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-[14px] text-[13px] font-medium text-left flex items-center gap-3 transition-colors ${
                              isDarkMode 
                                ? "text-zinc-400 hover:bg-white/[0.02] hover:text-white" 
                                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                            }`}
                          >
                            <Settings size={15} className={isDarkMode ? "text-zinc-500" : "text-zinc-400"} />
                            Settings
                          </button>

                          {/* Theme Toggle Row */}
                          <div
                            className={`w-full px-3 py-1.5 rounded-[14px] text-[13px] font-medium flex items-center justify-between ${
                              isDarkMode ? "text-zinc-400" : "text-zinc-600"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Palette size={15} className={isDarkMode ? "text-zinc-500" : "text-zinc-400"} />
                              <span>Appearance</span>
                            </div>
                            <div className="scale-75 origin-right">
                              <ThemeToggle />
                            </div>
                          </div>

                          {/* Structural Partition Divider */}
                          <div className={`h-[1px] my-1 ${isDarkMode ? "bg-white/[0.04]" : "bg-zinc-100"}`} />

                          {/* Log Out Action */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setIsProfileOpen(false);
                              if (handleLogout) handleLogout();
                            }}
                            className={`w-full px-3 py-2 rounded-[14px] text-[13px] font-medium text-left flex items-center gap-3 transition-colors ${
                              isDarkMode 
                                ? "text-red-400/90 hover:bg-red-500/[0.04] hover:text-red-400" 
                                : "text-red-600 hover:bg-red-50/60 hover:text-red-700"
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