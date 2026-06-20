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
  const logoutRef = useRef<boolean>(false);

  const mergedProfile = userProfile || currentUser;

  // ─── AUTH STATE LISTENER (REAL-TIME LOGOUT DETECTION) ───
  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // ─── CACHE & PROFILE CONTAINER LOADING ───
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

  // ─── TERMINATE ACTIVE ENVIRONMENT SESSION ───
  const handleLogout = useCallback(async () => {
    if (logoutRef.current) return;
    logoutRef.current = true;

    try {
      if (!supabase) return;
      
      if (currentUser?.id) {
        localStorage.removeItem(`nexspace_profile_${currentUser.id}`);
      }

      sessionStorage.clear();

      router.replace("/login");

      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout runtime error:", error);
      logoutRef.current = false; // unlock on error so user can try again
    }
  }, [supabase, currentUser, router]);

  // ─── SYSTEM-LEVEL NAVIGATION ROUTER GUARD ───
  const handleNav = useCallback((path: string) => {
    const now = Date.now();

    // Balanced 300ms Cooldown to handle overlap safely
    if (now - lastNavigationRef.current < 300) {
      return;
    }
    lastNavigationRef.current = now;

    if (pathname === path) return;

    router.push(path);
  }, [pathname, router]);

  const activePaths = useMemo(() => ({
    isTasks: pathname === "/",
    isFocus: pathname.startsWith("/focus"),
    isCalendar: pathname.startsWith("/planner"),
    isDiary: pathname.startsWith("/diary"),
    isMini: pathname.startsWith("/workspace"),
  }), [pathname]);

  const navProps = useMemo(() => ({
    activePaths,
    handleNav,
    handleLogout,
    userProfile: mergedProfile,
    currentStreak,
  }), [activePaths, handleNav, handleLogout, mergedProfile, currentStreak]);

  return (
    <header className="w-full relative z-[50] select-none no-swipe">
      {/* Desktop Shell Linkage */}
      <DesktopNav {...navProps} />

      {/* Mobile Shell Linkage */}
      <MobileNav {...navProps} />
    </header>
  );
}