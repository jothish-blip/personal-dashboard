"use client";

import React, {
  useMemo,
  useState,
  useEffect,
} from "react";

import {
  useRouter,
  usePathname,
} from "next/navigation";

import DesktopNav from "@/navigation/components/DesktopNav/DesktopNav";
import MobileNav from "@/navigation/components/MobileNav/MobileNav";

import { useNotificationSystem } from "@/notifications/engine/useNotificationSystem";
import { getSupabaseClient } from "@/lib/supabase";
import { useFocusSystem } from "@/modules/focus/engine/useFocusSystem";
import { useNexCore } from "@/modules/tasks/engine/useNexCore";

export interface NavbarProps {
  meta?: any;
  setMonthYear?: (
    val: string
  ) => void;
  exportData?: () => void;
  importData?: (
    file?: any
  ) => void;
}

export default function Navbar({
  meta,
  setMonthYear,
  exportData,
  importData,
}: NavbarProps) {
  const router = useRouter();

  const pathname =
    usePathname() || "";

  const supabase =
    getSupabaseClient();

  const { currentUser } =
    useFocusSystem();

  const { currentStreak } =
    useNexCore();

  const [
    userProfile,
    setUserProfile,
  ] = useState<any>(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
  } =
    useNotificationSystem(
      currentUser?.id
    );

  const [
    isNoteOpen,
    setIsNoteOpen,
  ] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile =
      async () => {
        if (
          !supabase ||
          !currentUser?.id
        ) {
          if (isMounted) {
            setUserProfile(
              null
            );
          }
          return;
        }

        const { data } =
          await supabase
            .from(
              "profiles"
            )
            .select("*")
            .eq(
              "id",
              currentUser.id
            )
            .maybeSingle();

        if (
          data &&
          isMounted
        ) {
          setUserProfile(
            data
          );
        }
      };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [
    supabase,
    currentUser,
  ]);

  const handleLogout =
    async () => {
      if (supabase) {
        await supabase.auth.signOut();

        window.location.href =
          "/login";
      }
    };

  const handleNav = (
    path: string
  ) => {
    router.push(path);
  };

  const activePaths =
    useMemo(
      () => ({
        isTasks:
          pathname === "/",

        isFocus:
          pathname ===
          "/focus",

        isCalendar:
          pathname ===
          "/Planner",

        isDiary:
          pathname ===
          "/diary",

        isMini:
          pathname ===
          "/Workspace",
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
    currentStreak,
  };

  return (
    <>
      {/* Desktop Navbar */}
      <DesktopNav
        {...navProps}
      />

      {/* Mobile Navbar */}
      <MobileNav
        {...navProps}
      />
    </>
  );
}