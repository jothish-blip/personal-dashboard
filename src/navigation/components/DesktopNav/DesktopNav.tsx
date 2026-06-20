"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
  handleNav?: (path: string) => void;
  handleLogout?: () => Promise<void>;
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

const MODULE_BRANDS = {
  tasks: {
    light: "/modules/tasks/task-light.png",
    dark: "/modules/tasks/task-dark.png",
    name: "TASKS",
    height: 56,
  },
  focus: {
    light: "/modules/focus/focus-light.png",
    dark: "/modules/focus/focus-dark.png",
    name: "FOCUS",
    height: 54,
  },
  planner: {
    light: "/modules/planner/planner-light.png",
    dark: "/modules/planner/planner-dark.png",
    name: "PLANNER",
    height: 58,
  },
  diary: {
    light: "/modules/journal/journal-light.png",
    dark: "/modules/journal/journal-dark.png",
    name: "JOURNAL",
    height: 56,
  },
  workspace: {
    light: "/modules/workspace/workspace-light.png",
    dark: "/modules/workspace/workspace-dark.png",
    name: "WORKSPACE",
    height: 56,
  },
  // Master brand for the root/home page
  master: {
    light: "/logo-light.svg",
    dark: "/logo-dark.svg",
    name: null,
    height: 56,
  }
};

export default function DesktopNav(props: DesktopNavProps) {
  const {
    handleLogout,
    userProfile = null,
  } = props;

  const { isDarkMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname() || "/";
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigatingRef = useRef(false);

  // Safe navigation lock to prevent spam clicking and perform smooth routing
  const safeNavigate = (path: string) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    router.push(path);
    setTimeout(() => {
      navigatingRef.current = false;
    }, 300);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle hidden Keyboard Shortcuts for power users
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= DEFAULT_NAV_ITEMS.length) {
          e.preventDefault();
          safeNavigate(DEFAULT_NAV_ITEMS[num - 1].path);
        }
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [router]);

  // Handle Dropdown Positioning & Esc/Resize Events
  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownCoords({
          top: rect.bottom + 10,
          right: window.innerWidth - rect.right,
        });
      }
    };

    const handleResize = () => setIsProfileOpen(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsProfileOpen(false);
    };

    if (isProfileOpen) {
      updatePosition();
      window.addEventListener("resize", handleResize);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  // Determine Current Brand based purely on the URL route
  const getBrandContext = () => {
    const lowerPath = pathname.toLowerCase();
    
    if (lowerPath.startsWith("/tasks")) return MODULE_BRANDS.tasks;
    if (lowerPath.startsWith("/focus")) return MODULE_BRANDS.focus;
    if (lowerPath.startsWith("/planner")) return MODULE_BRANDS.planner;
    if (lowerPath.startsWith("/diary")) return MODULE_BRANDS.diary;
    if (lowerPath.startsWith("/workspace")) return MODULE_BRANDS.workspace;
    
    return MODULE_BRANDS.master;
  };

  const currentBrand = getBrandContext();

  return (
    <>
      <div className="hidden md:block w-full px-4 lg:px-6 mt-4 relative z-[1000] select-none">
        <div
          className={`relative w-full max-w-[1600px] mx-auto rounded-[24px] transition-all duration-500 ${
            isDarkMode
              ? "bg-[#000000] border border-white/[0.04] shadow-none"
              : "bg-white border border-zinc-200/80 shadow-[0_8px_24px_rgba(0,0,0,0.01)]"
          }`}
        >
          <div className="relative h-[74px] px-6 flex items-center justify-between">
            
            <div className="flex items-center flex-shrink-0">
              <div 
                className="relative flex items-center cursor-pointer group"
                onClick={() => safeNavigate("/")}
              >
                {isDarkMode && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-orange-500/[0.03] blur-[32px] rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50" />
                )}
                
                <Image
                  src={isDarkMode ? currentBrand.dark : currentBrand.light}
                  alt={currentBrand.name ? `NexSpace ${currentBrand.name}` : "NexSpace"}
                  width={1000}
                  height={300}
                  priority
                  className="relative z-10 w-auto object-contain object-left transition-all duration-300"
                  style={{ height: `${currentBrand.height}px` }}
                />
              </div>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
              {DEFAULT_NAV_ITEMS.map((item) => {
                // Dynamically calculate active state based on the current pathname
                const isActive = pathname.toLowerCase().startsWith(item.path.toLowerCase());

                return (
                  <button
                    key={item.label}
                    onClick={() => safeNavigate(item.path)}
                    className={`relative group px-4 py-2 text-[14px] font-medium tracking-wide transition-all duration-200 whitespace-nowrap z-10 ${
                      isActive
                        ? isDarkMode ? "text-white" : "text-zinc-950"
                        : isDarkMode ? "text-zinc-500 hover:text-white" : "text-zinc-400 hover:text-zinc-900"
                    }`}
                  >
                    <span className="relative z-10">{item.label}</span>

                    {isActive && (
                      <motion.div
                        layoutId="desktop-active-pill"
                        className={`absolute inset-0 rounded-full ${
                          isDarkMode 
                            ? "bg-white/[0.03] border border-white/[0.05] shadow-[0_0_30px_rgba(249,115,22,0.08)]" 
                            : "bg-zinc-100 border border-zinc-200/50 shadow-[0_0_20px_rgba(249,115,22,0.05)]"
                        }`}
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4">
              <button
                ref={buttonRef}
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className={`relative flex items-center gap-3 px-2 py-1.5 pr-4 rounded-full transition-all duration-200 ${
                  isDarkMode ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"
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
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-medium tracking-wide ${isDarkMode ? "text-zinc-300" : "text-zinc-800"}`}>
                    {userProfile?.full_name?.split(" ")[0] || "User"}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PORTAL RENDERED DROPDOWN */}
      {mounted && createPortal(
        <AnimatePresence>
          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-[99998]"
                onClick={() => setIsProfileOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                style={{ 
                  position: 'fixed',
                  top: `${dropdownCoords.top}px`,
                  right: `${dropdownCoords.right}px`
                }}
                className={`w-[260px] rounded-[24px] p-2 z-[99999] border ${
                  isDarkMode
                    ? "bg-[#000000] border-white/[0.05] shadow-[0_32px_100px_rgba(0,0,0,0.85)]"
                    : "bg-white border-zinc-200 shadow-[0_24px_80px_rgba(0,0,0,0.12)]"
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-4 pb-3">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden shrink-0 border mb-3 ${
                    isDarkMode ? "bg-[#000000] border-white/[0.05]" : "bg-black/5 border-transparent"
                  }`}>
                    {userProfile?.avatar_url?.startsWith("http") ? (
                      <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className={isDarkMode ? "text-zinc-500" : "text-zinc-400"} />
                    )}
                  </div>
                  <p className={`text-[15px] font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                    {userProfile?.full_name || "NexUP Pioneer"}
                  </p>
                </div>

                <div className={`h-[1px] mx-2 mb-2 ${isDarkMode ? "bg-white/[0.05]" : "bg-zinc-100"}`} />

                <div className="space-y-0.5 mb-2">
                  <button
                    onClick={() => {
                      safeNavigate("/profile");
                      setIsProfileOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-[14px] text-[13.5px] font-medium text-left flex items-center gap-3 transition-colors ${
                      isDarkMode ? "text-zinc-400 hover:bg-white/[0.03] hover:text-white" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    <User size={16} className={isDarkMode ? "text-zinc-500" : "text-zinc-400"} />
                    Profile
                  </button>

                  <button
                    onClick={() => {
                      safeNavigate("/settings");
                      setIsProfileOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-[14px] text-[13.5px] font-medium text-left flex items-center gap-3 transition-colors ${
                      isDarkMode ? "text-zinc-400 hover:bg-white/[0.03] hover:text-white" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    <Settings size={16} className={isDarkMode ? "text-zinc-500" : "text-zinc-400"} />
                    Settings
                  </button>

                  <div className={`w-full px-3 py-2 rounded-[14px] text-[13.5px] font-medium flex items-center justify-between transition-colors ${
                    isDarkMode ? "text-zinc-400 hover:bg-white/[0.03]" : "text-zinc-600 hover:bg-zinc-50"
                  }`}>
                    <div className="flex items-center gap-3">
                      <Palette size={16} className={isDarkMode ? "text-zinc-500" : "text-zinc-400"} />
                      <span>Appearance</span>
                    </div>
                    <div className="scale-75 origin-right">
                      <ThemeToggle />
                    </div>
                  </div>
                </div>

                <div className={`h-[1px] mx-2 my-2 ${isDarkMode ? "bg-white/[0.05]" : "bg-zinc-100"}`} />

                <div>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();

                      if (navigatingRef.current) return;
                      navigatingRef.current = true;

                      setIsProfileOpen(false);

                      try {
                        if (handleLogout) {
                          await handleLogout();
                        }
                      } finally {
                        navigatingRef.current = false;
                      }
                    }}
                    className={`w-full px-3 py-2.5 rounded-[14px] text-[13.5px] font-medium text-left flex items-center gap-3 transition-colors ${
                      isDarkMode ? "text-red-400/90 hover:bg-white/[0.03] hover:text-red-400" : "text-red-600 hover:bg-red-50 hover:text-red-700"
                    }`}
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}