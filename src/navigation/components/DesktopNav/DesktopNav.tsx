"use client";

import React, { useState, useEffect } from "react";
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
  LogOut,
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
  {
    label: "Tasks",
    icon: LayoutGrid,
    path: "/",
    key: "isTasks",
  },
  {
    label: "Focus",
    icon: Brain,
    path: "/focus",
    key: "isFocus",
  },
  {
    label: "Planner",
    icon: CalendarDays,
    path: "/Planner",
    key: "isCalendar",
  },
  {
    label: "Diary",
    icon: BookOpen,
    path: "/diary",
    key: "isDiary",
  },
  {
    label: "Workspace",
    icon: ListTodo,
    path: "/Workspace",
    key: "isMini",
  },
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
    currentStreak = 0,
  } = props;

  const safePaths = activePaths || {};
  const { isDarkMode } = useTheme();
  const router = useRouter();

  const [isCompact, setIsCompact] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [navItems] = useState(DEFAULT_NAV_ITEMS);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCompact = localStorage.getItem("nextask_nav_compact");
      if (savedCompact) {
        setIsCompact(savedCompact === "true");
      }
    }
  }, []);

  const handleCompactToggle = () => {
    const newState = !isCompact;
    setIsCompact(newState);
    localStorage.setItem("nextask_nav_compact", String(newState));
  };

  return (
    <>
      {isNoteOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
          onClick={() => setIsNoteOpen(false)}
        />
      )}

      {/* FLOATING TRANSPARENT GLASS NAVBAR (DESKTOP ONLY) */}
      {/* <div className="hidden md:block fixed top-3 left-0 right-0 z-50 px-4 lg:px-6"> When you want stick use this Note: Not now*/}
      <div className="hidden md:block w-full px-4 lg:px-6 mt-3">
        <div className="hidden md:block fixed top-3 left-0 right-0 z-50 px-4 lg:px-6"></div>
        <div
          className={`w-full max-w-[1800px] mx-auto rounded-[28px] border backdrop-blur-2xl transition-all duration-500 ${
            isDarkMode
              ? "bg-black/40 border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
              : "bg-white/[0.72] border-zinc-200/60 shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
          }`}
        >
          <div className="relative h-[68px] px-4 lg:px-6 flex items-center justify-between">
            
            {/* BRAND */}
            <div className="flex items-center gap-2.5 flex-shrink-0 min-w-0">
              <div
                className={`relative w-11 h-11 rounded-2xl flex items-center justify-center border overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] ${
                  isDarkMode
                    ? "bg-white/[0.03] border-white/[0.08]"
                    : "bg-white border-zinc-200"
                }`}
                onClick={() => handleNav("/")}
              >
                <div className="absolute inset-0 bg-orange-500/10 blur-xl" />

                <Image
                  src="/favicon.ico"
                  alt="Nextask"
                  width={22}
                  height={22}
                  className="relative z-10 w-[22px] h-[22px]"
                  unoptimized
                />
              </div>

              {!isCompact && (
                <div className="flex flex-col leading-none min-w-0">
                  <span
                    className={`font-semibold tracking-tight text-[15px] lg:text-[16px] truncate ${
                      isDarkMode ? "text-white" : "text-zinc-900"
                    }`}
                  >
                    Nextask
                    <span className="text-orange-500 text-xs ml-1 font-bold">
                      v1.2
                    </span>
                  </span>

                  <span
                    className={`text-[11px] font-medium truncate ${
                      isDarkMode ? "text-zinc-500" : "text-zinc-400"
                    }`}
                  >
                    Build consistency
                  </span>
                </div>
              )}
            </div>

            {/* CENTER NAV */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 lg:gap-1.5 overflow-x-auto scrollbar-hide">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = Boolean(safePaths[item.key]);

                return (
                  <button
                    key={item.label}
                    onClick={() => handleNav(item.path)}
                    className={`relative flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 whitespace-nowrap hover:-translate-y-[1px] ${
                      isActive
                        ? isDarkMode
                          ? "bg-orange-500/10 border border-orange-500/15 text-orange-400"
                          : "bg-orange-50 text-orange-600"
                        : isDarkMode
                        ? "text-zinc-500 hover:bg-white/[0.03] hover:text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-black"
                    }`}
                  >
                    <Icon size={16} className="shrink-0" />

                    {!isCompact && <span>{item.label}</span>}

                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-orange-500 rounded-t-full shadow-[0_-2px_8px_rgba(249,115,22,0.8)]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
              <ThemeToggle />

              {/* Notifications */}
              {unreadCount > 0 && (
                <div className="relative flex items-center">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsNoteOpen(!isNoteOpen);
                    }}
                    className={`relative p-2 rounded-full transition-all duration-300 ${
                      isDarkMode
                        ? "text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20"
                        : "text-orange-500 bg-orange-50 hover:bg-orange-100 border border-orange-200"
                    }`}
                  >
                    <Bell size={18} />
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

              {/* Profile */}
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
                    <span
                      className={`hidden 2xl:block text-sm font-semibold ${
                        isDarkMode ? "text-zinc-200" : "text-gray-800"
                      }`}
                    >
                      {userProfile.full_name}
                    </span>
                  )}
                </button>

                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileOpen(false)}
                    />

                    <div
                      className={`absolute right-0 mt-3 w-56 border rounded-xl shadow-2xl py-2 z-50 ${
                        isDarkMode
                          ? "bg-black border-white/[0.08]"
                          : "bg-white border-gray-100"
                      }`}
                    >
                      <button
                        onClick={() => {
                          handleNav("/settings");
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-3"
                      >
                        <Settings size={15} />
                        Settings
                      </button>

                      <button
                        onClick={() => {
                          handleLogout();
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-3 text-red-500"
                      >
                        <LogOut size={15} />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Compact Toggle */}
              <button
                onClick={handleCompactToggle}
                className={`p-2 rounded-xl transition-all duration-300 border ${
                  isDarkMode
                    ? "bg-white/[0.03] border-white/[0.08] text-zinc-500 hover:text-white hover:bg-white/[0.05]"
                    : "bg-white border-gray-200 text-gray-400 hover:text-black"
                }`}
              >
                {isCompact ? (
                  <PanelLeftOpen size={16} />
                ) : (
                  <PanelLeftClose size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}