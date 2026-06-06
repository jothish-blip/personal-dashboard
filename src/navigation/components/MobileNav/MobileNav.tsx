"use client";

import React, { useState } from "react";
import Image from "next/image";
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
    handleLogout = () => {},
    userProfile = null,
    currentStreak = 0,
  } = props;

  const safePaths = activePaths || {};
  const { isDarkMode } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const navItems = DEFAULT_NAV_ITEMS;

  return (
    <>
      {/* FLOATING TRANSPARENT GLASS NAVBAR (MOBILE ONLY) */}
      {/* FIX: Added 'relative z-[999]' to ensure the stacking context is higher than the tabs */}
      <div className="md:hidden w-full px-3 sm:px-4 mt-2 relative z-[999]">
        <div
          className={`w-full mx-auto rounded-[24px] border backdrop-blur-2xl transition-all duration-500 flex flex-col space-y-1 pb-1 ${
            isDarkMode
              ? "bg-black/40 border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
              : "bg-white/[0.72] border-zinc-200/60 shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
          }`}
        >
          {/* TOP ROW: LOGO & TOOLS */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            {/* BRAND */}
            <div className="flex items-center gap-2.5">
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-[12px] border overflow-hidden transition-all duration-300 cursor-pointer hover:scale-[1.03] ${
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
                  width={18}
                  height={18}
                  className="relative z-10 w-[18px] h-[18px]"
                  unoptimized
                />
              </div>
              <span
                className={`font-bold tracking-tight text-[15px] transition-colors ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Nextask{" "}
                <span className="text-orange-500 text-[10px] ml-0.5 font-bold">
                  v1.2
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* PROFILE */}
              <div className="relative flex items-center justify-center w-9 h-9">
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

                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[99998]"
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
                        z-[99999]
                        animate-in fade-in zoom-in-95 duration-200
                        ${
                          isDarkMode
                            ? "bg-black border-white/10"
                            : "bg-white border-gray-200"
                        }
                      `}
                    >
                      <div
                        className={`px-4 py-3 border-b mb-1 ${
                          isDarkMode ? "border-white/[0.08]" : "border-gray-100"
                        }`}
                      >
                        <p
                          className={`text-sm font-bold truncate ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {userProfile?.full_name || "User"}
                        </p>
                        <p
                          className={`text-[10px] font-bold uppercase tracking-widest truncate mt-0.5 ${
                            isDarkMode ? "text-zinc-500" : "text-gray-400"
                          }`}
                        >
                          {userProfile?.email || ""}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          handleNav("/settings");
                          setIsProfileOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition ${
                          isDarkMode
                            ? "text-zinc-300 hover:bg-white/[0.03]"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Settings
                          size={15}
                          className={isDarkMode ? "text-zinc-500" : "text-gray-400"}
                        />{" "}
                        Settings
                      </button>

                      <button
                        onClick={async () => {
                          setIsProfileOpen(false);
                          await handleLogout();
                        }}
                        className={`w-full px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition ${
                          isDarkMode
                            ? "text-red-400 hover:bg-red-950/30"
                            : "text-red-600 hover:bg-red-50"
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
          <div className="flex justify-between items-center px-2 pb-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = Boolean(safePaths[item.key]);

              return (
                <div key={item.label} className="relative">
                  <button
                    onClick={() => {
                      handleNav(item.path);
                    }}
                    className={`relative flex flex-col items-center gap-1 text-[10px] font-semibold tracking-wide py-1.5 px-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? isDarkMode
                          ? "text-orange-400 bg-orange-500/10 border border-orange-500/15"
                          : "text-orange-600 bg-orange-50 border border-orange-200"
                        : isDarkMode
                        ? "text-zinc-500 hover:text-zinc-300"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="leading-none">{item.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-orange-500 rounded-t-full shadow-[0_-2px_6px_rgba(249,115,22,0.6)]" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}