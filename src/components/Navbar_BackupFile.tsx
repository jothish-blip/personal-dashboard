"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Task, Meta } from '../types/index';
import DesktopNav from "./navbar/DesktopNav";
import MobileNav from "./navbar/MobileNav";

import { useNotificationSystem } from "@/notifications/engine/useNotificationSystem";
import { getSupabaseClient } from "@/lib/supabase";
import { useFocusSystem } from "@/modules/focus/engine/useFocusSystem"; // 🔥 FIX: Updated import path to match new structure
// 🔥 Imported useNexCore directly from your hooks path
import { useNexCore } from "@/modules/tasks/engine/useNexCore";

interface NavbarProps {
  meta: Meta;
  setMonthYear: (val: string) => void;
  exportData: () => void;
  importData: (file: File) => void;
}

export default function Navbar({
  meta,
  setMonthYear,
  exportData,
  importData,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const supabase = getSupabaseClient();

  const { currentUser } = useFocusSystem(); 
  
  // 🔥 Pull the active currentStreak directly from the core engine
  const { currentStreak } = useNexCore();
  
  const [userProfile, setUserProfile] = useState<any>(null);

  const { notifications, unreadCount, markAsRead, clearAll } =
    useNotificationSystem(currentUser?.id);

  const [isNoteOpen, setIsNoteOpen] = useState(false);

  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);
  
  // 🔥 FIX: Ref for dynamic height tracking
  const navRef = useRef<HTMLElement>(null);

  // 🔥 FIX 5: Check if we are in the workspace
  const isWorkspace = pathname === "/Workspace";

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!supabase || !currentUser?.id) {
        if (isMounted) setUserProfile(null);
        return;
      }

      // Changed .single() to .maybeSingle()
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch user profile in Navbar:", JSON.stringify(error, null, 2));
      } else if (data && isMounted) {
        setUserProfile(data);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
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
    currentStreak, // 🔥 Passed down seamlessly to DesktopNav and MobileNav
  };

  // Scroll detection for auto-hiding
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;

      if (currentScroll < 10) {
        setShowNavbar(true);
      } else if (currentScroll > lastScrollY.current) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }

      lastScrollY.current = currentScroll;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 🔥 FIX: Track exact navbar height and expose as CSS variable
  useEffect(() => {
    const updateHeight = () => {
      if (navRef.current) {
        const height = navRef.current.offsetHeight;
        document.documentElement.style.setProperty("--navbar-h", `${height}px`);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <nav
      ref={navRef}
      style={{ height: "auto" }}
      className={`fixed top-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-in-out ${
        /* 🔥 FIX 5: If in workspace, NEVER hide. Otherwise, follow scroll behavior */
        isWorkspace ? "translate-y-0" : showNavbar ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <DesktopNav {...navProps} />
      <MobileNav {...navProps} />
    </nav>
  );
}