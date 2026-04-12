"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Meta } from "../types";

import DesktopNav from "./navbar/DesktopNav";
import MobileNav from "./navbar/MobileNav";

import {
  Search,
  LayoutGrid,
  ListTodo,
  BookOpen,
  Brain,
  CalendarDays,
  LogOut,
  User,
} from "lucide-react";

import { useNotificationSystem } from "@/notifications/useNotificationSystem";
import { getSupabaseClient } from "@/lib/supabase";

// 🔥 FIX: Import the context hook so we don't fetch auth manually
// Adjust this path to wherever your useFocusSystem is located!
import { useFocusSystem } from "../components/focus/useFocusSystem";

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

  // 🔥 FIX 1: Consume currentUser from the global provider instead of local state
  const { currentUser } = useFocusSystem(); 
  
  const [userProfile, setUserProfile] = useState<any>(null);

  const { notifications, unreadCount, markAsRead, clearAll } =
    useNotificationSystem(currentUser?.id);

  const [isNoteOpen, setIsNoteOpen] = useState(false);

  // 🔥 SCROLL STATE
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

  // ✅ USER PROFILE FETCH (No more auth lock crashing!)
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      // 🔥 FIX 2: If no user is passed down from Context, clear profile and abort.
      // This completely removes the need for supabase.auth.getUser() here.
      if (!supabase || !currentUser?.id) {
        if (isMounted) setUserProfile(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (error) throw error;
        if (data && isMounted) setUserProfile(data);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [supabase, currentUser]); // 🔥 Re-run only when context currentUser changes

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
      isMini: pathname === "/mini-nisc",
      isDiary: pathname === "/diary",
      isFocus: pathname === "/focus",
      isCalendar: pathname === "/calender-event",
    }),
    [pathname]
  );

  const [y, m] = (meta.currentMonth || "2024-01").split("-");

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);
  }, []);

  const navProps = {
    activePaths,
    handleNav,
    handleLogout,
    y,
    m,
    years,
    setMonthYear,
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    isNoteOpen,
    setIsNoteOpen,
    userProfile,
  };

  // 🔥 SCROLL DETECTION (MAIN LOGIC)
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;

      if (currentScroll < 10) {
        setShowNavbar(true);
      } else if (currentScroll > lastScrollY.current) {
        // scrolling down
        setShowNavbar(false);
      } else {
        // scrolling up
        setShowNavbar(true);
      }

      lastScrollY.current = currentScroll;
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* 🔥 NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-200 shadow-sm transition-transform duration-300 ${
          showNavbar ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <DesktopNav {...navProps} />
        <MobileNav {...navProps} />
      </nav>

      {/* ✅ SPACER (IMPORTANT) */}
      <div className="h-[120px] md:h-[64px]" />
    </>
  );
}