"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/theme/ThemeProvider";

import DesktopNav from "@/navigation/components/DesktopNav/DesktopNav";
import MobileNav from "@/navigation/components/MobileNav/MobileNav";

import { useNotificationSystem } from "@/notifications/engine/useNotificationSystem";
import { getSupabaseClient } from "@/lib/supabase";
import { useFocusSystem } from "@/modules/focus/engine/useFocusSystem";
import { useNexCore } from "@/modules/tasks/engine/useNexCore";

// 🔥 Explicitly define the props that Home.tsx is passing
export interface NavbarProps {
  meta?: any;
  setMonthYear?: (val: string) => void;
  exportData?: () => void;
  importData?: (file?: any) => void;
}

const NEVER_HIDE_ROUTES = ["/Workspace", "/focus-session"];

export default function Navbar({
  meta,
  setMonthYear,
  exportData,
  importData,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const supabase = getSupabaseClient();
  const { isDarkMode } = useTheme();

  const { currentUser } = useFocusSystem(); 
  const { currentStreak } = useNexCore();
  
  const [userProfile, setUserProfile] = useState<any>(null);

  const { notifications, unreadCount, markAsRead, clearAll } =
    useNotificationSystem(currentUser?.id);

  const [isNoteOpen, setIsNoteOpen] = useState(false);

  // Advanced Scroll State
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);
  const scrollDelta = useRef(0);
  
  const navRef = useRef<HTMLElement>(null);
  const isProtectedWorkspace = NEVER_HIDE_ROUTES.includes(pathname);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      if (!supabase || !currentUser?.id) {
        if (isMounted) setUserProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (data && isMounted) setUserProfile(data);
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, [supabase, currentUser]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
  };

  const handleNav = (path: string) => {
    router.push(path);
  };

  const activePaths = useMemo(
    () => ({
      isTasks: pathname === "/",
      isFocus: pathname === "/focus",
      isCalendar: pathname === "/Planner",
      isDiary: pathname === "/diary",
      isMini: pathname === "/Workspace",
    }),
    [pathname]
  );

  // 🔥 These are the ONLY props passed down to DesktopNav and MobileNav
  const navProps = {
    activePaths,
    handleNav,
    handleLogout,
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    isNoteOpen,
    setIsNoteOpen,
    userProfile,
    currentStreak,
  };

  // Advanced Auto-Hide Logic
  useEffect(() => {
    const handleScroll = () => {
      if (isProtectedWorkspace) return;

      const currentScroll = window.scrollY;
      const diff = currentScroll - lastScrollY.current;

      if (currentScroll < 10) {
        setShowNavbar(true);
        scrollDelta.current = 0;
      } else {
        scrollDelta.current += diff;
        if (diff > 0) {
          if (scrollDelta.current > 80) {
            setShowNavbar(false);
            scrollDelta.current = 80;
          }
        } else if (diff < 0) {
          if (scrollDelta.current < -15) {
            setShowNavbar(true);
            scrollDelta.current = -15;
          }
        }
      }
      lastScrollY.current = currentScroll;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isProtectedWorkspace]);

  useEffect(() => {
    const updateHeight = () => {
      if (navRef.current) {
        document.documentElement.style.setProperty("--navbar-h", `${navRef.current.offsetHeight}px`);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-[100] backdrop-blur-2xl border-b transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isProtectedWorkspace || showNavbar ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
      } ${
        isDarkMode ? "bg-[#050505]/78 border-white/[0.04]" : "bg-white/80 border-black/[0.04]"
      }`}
    >
      <DesktopNav {...navProps} />
      <MobileNav {...navProps} />
    </nav>
  );
}