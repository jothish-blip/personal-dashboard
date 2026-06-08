"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
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

  const [userProfile, setUserProfile] = useState<any>(null);
  const lastNavigationRef = useRef<number>(0);

  // Profile Fallback: Always ensure we have at least the base user data to render
  const mergedProfile = userProfile || currentUser;

  // ─── CACHE & PROFILE LOADING ───
  useEffect(() => {
    if (!supabase || !currentUser?.id) return;

    let ignore = false;
    const cacheKey = `nexspace_profile_${currentUser.id}`;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (!ignore && data && !error) {
        setUserProfile(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
      }
    };

    // Attempt to load from user-specific cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setUserProfile(JSON.parse(cached));
      } catch (err) {
        console.error("Failed to parse cached profile", err);
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [supabase, currentUser]);

  // ─── AUTHENTICATION ───
  const handleLogout = useCallback(async () => {
    try {
      if (!supabase) return;
      
      // Clear user-specific cache to prevent leakage to next login
      if (currentUser?.id) {
        localStorage.removeItem(`nexspace_profile_${currentUser.id}`);
      }

      await supabase.auth.signOut();

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [supabase, currentUser, router]);

  // ─── ROUTING & NAVIGATION GUARD ───
  const handleNav = useCallback((path: string) => {
    const now = Date.now();

    // 300ms Cooldown to prevent rapid-fire mis-taps or duplicate edge swipes
    if (now - lastNavigationRef.current < 300) {
      return;
    }
    lastNavigationRef.current = now;

    // Prevent duplicate pushes if already on the exact path
    if (pathname === path) return;

    router.push(path);
  }, [pathname, router]);

  // Use startsWith for safer nested route matching, exact match for root
  const activePaths = useMemo(() => ({
    isTasks: pathname === "/",
    isFocus: pathname.startsWith("/focus"),
    isCalendar: pathname.startsWith("/Planner"),
    isDiary: pathname.startsWith("/diary"),
    isMini: pathname.startsWith("/Workspace"),
  }), [pathname]);

  // ─── MEMOIZED PROPS ───
  const navProps = useMemo(() => ({
    activePaths,
    handleNav,
    handleLogout,
    userProfile: mergedProfile,
    currentStreak,
  }), [activePaths, handleNav, handleLogout, mergedProfile, currentStreak]);

  return (
    <>
      {/* Desktop Navbar */}
      <DesktopNav {...navProps} />

      {/* Mobile Navbar */}
      <MobileNav {...navProps} />
    </>
  );
}