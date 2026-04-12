"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Meta } from "../types";

import DesktopNav from "./navbar/DesktopNav";
import MobileNav from "./navbar/MobileNav";

import { useNotificationSystem } from "@/notifications/useNotificationSystem";
import { getSupabaseClient } from "@/lib/supabase";
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

  const { currentUser } = useFocusSystem(); 
  
  const [userProfile, setUserProfile] = useState<any>(null);

  const { notifications, unreadCount, markAsRead, clearAll } =
    useNotificationSystem(currentUser?.id);

  const [isNoteOpen, setIsNoteOpen] = useState(false);

  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
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
      isCalendar: pathname === "/calender-event",
      isDiary: pathname === "/diary",
      isMini: pathname === "/mini-nisc",
    }),
    [pathname]
  );

  // 🔥 1. Removed y, m, years, and setMonthYear from navProps
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
  };

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

  return (
    <>
      {/* 🔥 3.1 & 3.5 Premium Glass UI and Smoother Transitions */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-in-out ${
          showNavbar ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <DesktopNav {...navProps} />
        <MobileNav {...navProps} />
      </nav>

      <div className="h-[120px] md:h-[64px]" />
    </>
  );
}