"use client";

import React, { useState, useEffect, useRef } from "react";
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

const NAV_ITEMS = [
  { label: "Tasks", icon: LayoutGrid, path: "/", key: "isTasks" },
  { label: "Focus", icon: Brain, path: "/focus", key: "isFocus" },
  { label: "Planner", icon: CalendarDays, path: "/Planner", key: "isCalendar" },
  { label: "Diary", icon: BookOpen, path: "/diary", key: "isDiary" },
  { label: "Workspace", icon: LayoutPanelLeft, path: "/Workspace", key: "isMini" },
];

// Helper to generate premium initials if no avatar exists
const getInitials = (name?: string) => {
  if (!name) return "NX";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

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
  
  const [mounted, setMounted] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Discoverability Check: Only show "Swipe up" hint if never seen before
    const hintSeen = localStorage.getItem("nexspace_nav_hint");
    if (!hintSeen) {
      setShowHint(true);
    }
  }, []);

  const handleOpenNav = () => {
    // Optional Android haptic feedback for opening the dock
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    setIsNavExpanded(true);
    if (showHint) {
      setShowHint(false);
      localStorage.setItem("nexspace_nav_hint", "true");
    }
  };

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  // Strict structural layout lock (Scroll lock & touch-action block)
  useEffect(() => {
    const isAnyMenuOpen = isNavExpanded || isProfileMenuOpen;
    document.body.dataset.navOpen = isAnyMenuOpen ? "true" : "false";

    if (isAnyMenuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.body.dataset.navOpen = "false";
    };
  }, [isNavExpanded, isProfileMenuOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* ─── HEADER ─── */}
      <header className="md:hidden w-full flex items-center justify-between px-6 pt-6 pb-2 relative z-[100] select-none">
        {/* Brand Logo */}
        <div 
          className=" relative flex items-center cursor-pointer
    active:opacity-80 transition-opacity group
    rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          onClick={() => handleNav("/")}
        >
          {/* Subtle Orange Pulse for Dark Mode behind the logo */}
          {isDarkMode && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-orange-500/[0.08] blur-[30px] rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-60" />
          )}

          <Image
            src={isDarkMode ? "/logo-dark.svg" : "/logo-light.svg"}
            alt="NexSpace"
            width={150}
            height={36}
            // mix-blend-multiply eliminates the white box issue in light mode without modifying the SVG
            className={`relative z-10 h-[36px]   w-auto object-contain object-left ${!isDarkMode ? "mix-blend-multiply" : ""}`}
            priority
          />
        </div>

        {/* Profile Avatar Trigger (Visible when dock is closed) */}
        <div className="relative prevent-pull-refresh" ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-label="Open profile menu"
            className="active:scale-95 transition-transform duration-200"
          >
            <ProfileStreakSwitcher
              userProfile={userProfile}
              currentStreak={currentStreak}
              isDarkMode={isDarkMode}
            />
          </button>

          {/* Premium Mini Account Center Menu */}
          <AnimatePresence>
            {isProfileMenuOpen && (
              <>
                {/* Pure Black / White Full Screen Backdrop for Focus */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsProfileMenuOpen(false)}
                  className={`fixed inset-0 z-[100000] backdrop-blur-xl ${
                    isDarkMode ? "bg-black/95" : "bg-white/95"
                  }`}
                />

                {/* Unified Design System */}
                <motion.div
                  initial={{ opacity: 0, y: -15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  transition={{ type: "spring", damping: 20, stiffness: 250 }}
                  className={`fixed top-20 right-4 left-4 sm:left-auto sm:w-80 p-6 rounded-[36px] shadow-2xl border z-[100001] ${
                    isDarkMode
                      ? "bg-black border-white/5 shadow-black/90"
                      : "bg-white border-black/5 shadow-black/10"
                  }`}
                >
                  {/* Account Header with Avatar */}
                  <div className="flex flex-col items-center text-center pb-5 mb-4 border-b border-zinc-500/10">
                    <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden mb-3">
                      {userProfile?.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[17px] font-semibold text-zinc-600 dark:text-zinc-400 tracking-wide">
                          {getInitials(userProfile?.full_name)}
                        </span>
                      )}
                    </div>
                    <p className="text-[16px] font-semibold tracking-tight">
                      {userProfile?.full_name || "NexUP Pioneer"}
                    </p>
                    <p className="text-[13px] font-medium text-orange-500 mt-1 flex items-center gap-1">
                      🔥 {currentStreak} Day Streak
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className={`flex items-center justify-between px-3 py-3 rounded-2xl mb-2 ${
                      isDarkMode ? "bg-white/5" : "bg-black/5"
                    }`}>
                      <span className="text-[13px] font-medium tracking-wide">Theme</span>
                      <ThemeToggle />
                    </div>
                    
                    <button
                      onClick={() => {
                        handleNav("/settings");
                        setIsProfileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-medium text-[13px] transition-colors ${
                        isDarkMode ? "hover:bg-white/5 text-zinc-300" : "hover:bg-black/5 text-zinc-700"
                      }`}
                    >
                      <Settings size={18} />
                      <span>Settings</span>
                    </button>

                    <button
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        if (handleLogout) await handleLogout();
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-medium text-[13px] transition-colors mt-1 ${
                        isDarkMode ? "text-red-400 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <LogOut size={18} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ─── LIQUID SPATIAL NAVIGATION DOCK ─── */}
      <div className="md:hidden">
        {/* Full Viewport High Opacity Backdrop */}
        <AnimatePresence>
          {isNavExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNavExpanded(false)}
              className={`fixed inset-0 z-[99998] backdrop-blur-xl ${
                isDarkMode ? "bg-black/95" : "bg-white/95"
              }`}
            />
          )}
        </AnimatePresence>

        {/* Bottom Interactive Zone */}
        <div 
          className="fixed bottom-0 left-0 right-0 z-[100000] flex justify-center pb-6 pointer-events-none prevent-pull-refresh"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <AnimatePresence mode="wait">
            {!isNavExpanded ? (
              // STATE 1: GESTURE-FIRST INTERACTIVE CAPSULE
              <motion.div
                key="minimal-nav"
                initial={{ y: 20, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                whileDrag={{ scaleX: 1.8, scaleY: 0.5 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y < -24 || info.velocity.y < -500) handleOpenNav();
                }}
                onClick={handleOpenNav}
                className="pointer-events-auto cursor-pointer p-4 relative flex flex-col items-center justify-center"
              >
                <AnimatePresence>
                  {showHint && (
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute -top-3 text-[10px] font-medium tracking-wide text-zinc-500 dark:text-zinc-400"
                    >
                      Swipe up
                    </motion.span>
                  )}
                </AnimatePresence>
                <div 
                  className="w-14 h-2 bg-orange-500 rounded-full transition-shadow duration-300 mt-2"
                  style={{
                    boxShadow: "0 0 12px rgba(249,115,22,0.4), 0 0 20px rgba(249,115,22,0.2)"
                  }}
                />
              </motion.div>
            ) : (
              // STATE 2: EXPANDED COMMAND CENTER
              <motion.div
                key="expanded-nav"
                initial={{ scaleY: 0.6, opacity: 0, y: 60, borderRadius: "50px" }}
                animate={{ scaleY: 1, opacity: 1, y: 0, borderRadius: "36px" }}
                exit={{ scaleY: 0.6, opacity: 0, y: 60, borderRadius: "50px" }}
                transition={{ type: "spring", damping: 26, stiffness: 280 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 24 || info.velocity.y > 500) setIsNavExpanded(false);
                }}
                style={{ transformOrigin: "bottom center" }}
                className={`pointer-events-auto relative w-[92vw] max-w-sm overflow-hidden shadow-2xl border ${
                  isDarkMode
                    ? "bg-black border-white/5 shadow-black/90"
                    : "bg-white border-black/5 shadow-black/10"
                }`}
              >
                {/* Subtle Drag Handle */}
                <div className="w-full flex justify-center pt-5 pb-5">
                  <div className="w-10 h-1.5 rounded-full bg-zinc-500/30" />
                </div>

                {/* Unified Profile Header (Compact Space-Saver) */}
                <div className="flex flex-col items-center justify-center pb-6 px-6">
                  <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden mb-2">
                    {userProfile?.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[16px] font-semibold text-zinc-600 dark:text-zinc-400 tracking-wide">
                        {getInitials(userProfile?.full_name)}
                      </span>
                    )}
                  </div>
                  <span className={`text-[16px] font-semibold tracking-[-0.01em] ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                    {userProfile?.full_name || "NexUP Pioneer"}
                  </span>
                  <div className="text-[12px] font-medium text-orange-500 mt-1 flex items-center gap-1.5 tracking-wide">
                    🔥 {currentStreak} Day Streak
                  </div>
                  
                  {/* Subtle Premium Branding */}
                  <span className="text-[11px] font-medium opacity-40 uppercase tracking-[0.2em] text-zinc-500 mt-4">
                    NexSpace
                  </span>
                </div>

                {/* Context-Aware Symmetric Module Layout */}
                <div className="grid grid-cols-2 gap-y-5 gap-x-4 px-6 pb-12">
                  {NAV_ITEMS.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = Boolean(safePaths[item.key]);
                    const isLastAndOdd = index === NAV_ITEMS.length - 1 && NAV_ITEMS.length % 2 !== 0;

                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          handleNav(item.path);
                          setIsNavExpanded(false);
                        }}
                        className={`flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform duration-300 ${
                          isLastAndOdd ? "col-span-2" : ""
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center transition-all duration-300 ${
                            isActive
                              ? isDarkMode
                                ? "w-[64px] h-[64px] rounded-[22px] bg-orange-500/[0.12] border border-orange-500/[0.15] text-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.1)] scale-100"
                                : "w-[64px] h-[64px] rounded-[22px] bg-orange-500/[0.12] border border-orange-500/[0.15] text-orange-600 shadow-[0_0_30px_rgba(249,115,22,0.1)] scale-100"
                              : isDarkMode
                              ? "w-[56px] h-[56px] rounded-[20px] bg-transparent border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5 opacity-70 hover:opacity-100 scale-95"
                              : "w-[56px] h-[56px] rounded-[20px] bg-transparent border border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-black/5 opacity-70 hover:opacity-100 scale-95"
                          }`}
                        >
                          <Icon size={isActive ? 26 : 22} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span
                          className={`transition-colors mt-0.5 ${
                            isActive
                              ? `text-[13px] font-medium tracking-[-0.01em] ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`
                              : `text-[12px] font-medium tracking-[-0.01em] opacity-70 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`
                          }`}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}