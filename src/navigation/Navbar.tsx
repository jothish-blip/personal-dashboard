"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

import DesktopNav from "@/navigation/components/DesktopNav/DesktopNav";
import MobileNav from "@/navigation/components/MobileNav/MobileNav";

import { getSupabaseClient } from "@/lib/supabase";
import { useFocusSystem } from "@/modules/focus/engine/useFocusSystem";
import { useNexCore } from "@/modules/tasks/engine/useNexCore";

export interface NavbarProps {
  meta?: any;
  setMonthYear?: (val: string) => void;
  exportData?: () => void;
  importData?: (file?: any) => void;
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
  const { currentStreak } = useNexCore();

  const [userProfile, setUserProfile] = useState<any>(currentUser || null);

  useEffect(() => {
    if (!supabase || !currentUser?.id) return;

    let ignore = false;

    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (!ignore && data) {
        setUserProfile(data);
        localStorage.setItem("nexspace_profile", JSON.stringify(data));
      }
    };

    const cached = localStorage.getItem("nexspace_profile");

    if (cached) {
      try {
        setUserProfile(JSON.parse(cached));
      } catch {}
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [supabase, currentUser]);

  const handleLogout = async () => {
    try {
      if (!supabase) return;

      await supabase.auth.signOut();

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
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
    userProfile,
    currentStreak,
  };

  return (
    <>
      {/* Desktop Navbar */}
      <DesktopNav {...navProps} />

      {/* Mobile Navbar */}
      <MobileNav {...navProps} />
    </>
  );
}