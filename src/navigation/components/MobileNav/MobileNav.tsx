"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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

interface UserProfile {
  full_name?: string;
  avatar_url?: string;
  [key: string]: unknown;
}

interface MobileNavProps {
  activePaths?: Record<string, boolean> | null;
  handleNav?: (path: string) => void;
  handleLogout?: () => Promise<void>;
  userProfile?: UserProfile | null;
  currentStreak?: number;
}

const NAV_ITEMS = [
  { label: "Tasks", icon: LayoutGrid, path: "/", key: "isTasks" },
  { label: "Focus", icon: Brain, path: "/focus", key: "isFocus" },
  { label: "Planner", icon: CalendarDays, path: "/Planner", key: "isCalendar" },
  { label: "Diary", icon: BookOpen, path: "/diary", key: "isDiary" },
  { label: "Workspace", icon: LayoutPanelLeft, path: "/Workspace", key: "isMini" },
];

const getInitials = (name?: string): string => {
  if (!name) return "NX";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export default function MobileNav({
  activePaths = {},
  handleNav = () => {},
  handleLogout,
  userProfile = null,
  currentStreak = 0,
}: MobileNavProps) {
  const { isDarkMode } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigatingRef = useRef(false);
  const loggingOutRef = useRef(false);

  const closeAllMenus = () => {
    setIsNavExpanded(false);
    setIsProfileMenuOpen(false);
  };

  // Reset menu state on any route change
  useEffect(() => {
    navigatingRef.current = false;
    closeAllMenus();
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle click outside for profile menu
  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isProfileMenuOpen]);

  const handleOpenNav = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    setIsProfileMenuOpen(false);
    setIsNavExpanded(true);
  };

  // Manage body scroll and touch behavior when menus are open
  useEffect(() => {
    const isAnyMenuOpen = isNavExpanded || isProfileMenuOpen;
    document.body.dataset.navOpen = isAnyMenuOpen ? "true" : "false";

    if (isAnyMenuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "pan-x pan-y";
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
    <div className="mobile-nav-root">
      <header className="md:hidden w-full flex items-center justify-between px-6 pt-6 pb-2 relative z-[100] select-none">
        <div
          className="relative flex items-center cursor-pointer active:opacity-80 transition-opacity group rounded-md focus:outline-none"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            closeAllMenus();
            setTimeout(() => {
              router.push("/");
            }, 100);
          }}
          style={{ touchAction: "manipulation" }}
        >
          {isDarkMode && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-orange-500/[0.08] blur-[30px] rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-60" />
          )}
          <Image
            src={isDarkMode ? "/logo-dark.png" : "/logo-light.png"}
            alt="NexSpace"
            width={280}
            height={80}
            className="relative z-10 h-[64px] sm:h-[72px] w-auto object-contain object-left transition-transform duration-300 group-hover:scale-105"
            priority
          />
        </div>

        <div className="relative prevent-pull-refresh" ref={profileMenuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsNavExpanded(false);
              setIsProfileMenuOpen((prev) => !prev);
            }}
            aria-label="Open profile menu"
            className="active:scale-95 transition-transform duration-200"
            style={{ touchAction: "manipulation" }}
          >
            <ProfileStreakSwitcher
              userProfile={userProfile}
              currentStreak={currentStreak}
              isDarkMode={isDarkMode}
            />
          </button>

          {createPortal(
            <AnimatePresence>
              {isProfileMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`fixed inset-0 z-[2147483645] ${isDarkMode ? "bg-black" : "bg-white"}`}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: "spring", stiffness: 800, damping: 45 }}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`fixed top-20 right-4 left-4 sm:left-auto sm:w-80 p-6 rounded-[36px] shadow-lg border z-[2147483647] ${
                      isDarkMode
                        ? "bg-black border-white/[0.08] shadow-black/90"
                        : "bg-white border-black/5 shadow-black/10"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center pb-5 mb-4 border-b border-zinc-500/10">
                      <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-black flex items-center justify-center overflow-hidden mb-3">
                        {userProfile?.avatar_url ? (
                          <img
                            src={userProfile.avatar_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
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
                      {/* Theme Toggle */}
                      <div
                        className={`flex items-center justify-between px-4 py-3.5 rounded-2xl mb-1 ${
                          isDarkMode ? "bg-white/[0.03]" : "bg-black/5"
                        }`}
                      >
                        <span className="text-[13px] font-medium tracking-wide">Theme</span>
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="relative z-[2147483647]"
                        >
                          <ThemeToggle />
                        </div>
                      </div>

                      {/* Settings Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          closeAllMenus();
                          setTimeout(() => {
                            router.push("/settings");
                          }, 150);
                        }}
                        style={{ touchAction: "manipulation" }}
                        className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-medium text-[13px] transition-colors ${
                          isDarkMode
                            ? "hover:bg-white/[0.03] text-zinc-300"
                            : "hover:bg-black/5 text-zinc-700"
                        }`}
                      >
                        <Settings size={18} />
                        <span>Settings</span>
                      </button>

                      {/* Log Out Button */}
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          if (loggingOutRef.current) return;
                          loggingOutRef.current = true;

                          closeAllMenus();

                          try {
                            if (handleLogout) await handleLogout();
                          } finally {
                            loggingOutRef.current = false;
                          }
                        }}
                        style={{ touchAction: "manipulation" }}
                        className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-medium text-[13px] transition-colors mt-1 ${
                          isDarkMode
                            ? "text-red-400 hover:bg-white/[0.03]"
                            : "text-red-600 hover:bg-red-50"
                        }`}
                      >
                        <LogOut size={18} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body
          )}
        </div>
      </header>

      {createPortal(
        <div className="md:hidden">
          <AnimatePresence>
            {isNavExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeAllMenus}
                className={`fixed inset-0 z-[2147483645] ${isDarkMode ? "bg-black" : "bg-white"}`}
              />
            )}
          </AnimatePresence>

          <div
            className="fixed bottom-0 left-0 right-0 z-[2147483646] flex justify-center pb-6 pointer-events-none prevent-pull-refresh"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          >
            <AnimatePresence mode="wait">
              {!isNavExpanded ? (
                <motion.div
                  key="minimal-nav"
                  initial={{ y: 20, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 20, opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 700, damping: 40, mass: 0.6 }}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.08}
                  dragMomentum={true}
                  dragDirectionLock
                  whileDrag={{ y: -2 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.y < -3 || info.velocity.y < -50) handleOpenNav();
                  }}
                  onClick={handleOpenNav}
                  style={{ touchAction: "manipulation" }}
                  className="pointer-events-auto cursor-pointer p-4 relative flex flex-col items-center justify-center"
                >
                  <motion.div
                    className="w-20 h-2.5 bg-orange-500 rounded-full transition-shadow mt-2"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      boxShadow: "0 0 12px rgba(249,115,22,0.4), 0 0 20px rgba(249,115,22,0.2)",
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="expanded-nav"
                  initial={{ scaleY: 0.6, opacity: 0, y: 80, borderRadius: "50px" }}
                  animate={{ scaleY: 1, opacity: 1, y: 0, borderRadius: "36px" }}
                  exit={{ scaleY: 0.6, opacity: 0, y: 80, borderRadius: "50px" }}
                  transition={{ type: "spring", stiffness: 700, damping: 40, mass: 0.6 }}
                  onClick={(e) => e.stopPropagation()}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.06}
                  dragMomentum={true}
                  dragDirectionLock
                  onDragEnd={(_, info) => {
                    if (info.offset.y > 3 || info.velocity.y > 50) closeAllMenus();
                  }}
                  style={{
                    transformOrigin: "bottom center",
                    zIndex: 2147483647,
                    touchAction: "manipulation",
                  }}
                  className={`pointer-events-auto relative w-[92vw] max-w-sm overflow-hidden shadow-lg border ${
                    isDarkMode
                      ? "bg-black border-white/[0.08] shadow-black/90"
                      : "bg-white border-black/5 shadow-black/10"
                  }`}
                >
                  <div className="w-full flex justify-center pt-5 pb-5">
                    <div className="w-10 h-1.5 rounded-full bg-zinc-500/30" />
                  </div>

                  <div className="grid grid-cols-2 max-w-[280px] mx-auto gap-y-6 gap-x-6 px-6 pb-12">
                    {NAV_ITEMS.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = Boolean(activePaths?.[item.key]);
                      const isLastAndOdd = index === NAV_ITEMS.length - 1 && NAV_ITEMS.length % 2 !== 0;

                      return (
                        <button
                          key={item.key}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            closeAllMenus();
                            setTimeout(() => {
                              router.push(item.path);
                            }, 100);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{ touchAction: "manipulation", zIndex: 2147483647 }}
                          className={`flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform duration-300 ${
                            isLastAndOdd ? "col-span-2 flex justify-center" : ""
                          }`}
                        >
                          <div
                            className={`flex items-center justify-center transition-all duration-300 ${
                              isActive
                                ? isDarkMode
                                  ? "w-[64px] h-[64px] rounded-[22px] bg-orange-500/[0.12] border border-orange-500/[0.15] text-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.1)] scale-100"
                                  : "w-[64px] h-[64px] rounded-[22px] bg-orange-500/[0.12] border border-orange-500/[0.15] text-orange-600 shadow-[0_0_30px_rgba(249,115,22,0.1)] scale-100"
                                : isDarkMode
                                ? "w-[56px] h-[56px] rounded-[20px] bg-transparent border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] opacity-70 hover:opacity-100 scale-95"
                                : "w-[56px] h-[56px] rounded-[20px] bg-transparent border border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-black/5 opacity-70 hover:opacity-100 scale-95"
                            }`}
                          >
                            <Icon size={isActive ? 26 : 22} strokeWidth={isActive ? 2.5 : 2} />
                          </div>
                          <span
                            className={`transition-colors mt-0.5 ${
                              isActive
                                ? `text-[13px] font-medium tracking-[-0.01em] ${
                                    isDarkMode ? "text-orange-400" : "text-orange-600"
                                  }`
                                : `text-[12px] font-medium tracking-[-0.01em] opacity-70 ${
                                    isDarkMode ? "text-zinc-400" : "text-zinc-500"
                                  }`
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
        </div>,
        document.body
      )}
    </div>
  );
}