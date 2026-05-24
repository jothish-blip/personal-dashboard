"use client";

import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
} from "react";
import {
  useRouter,
  usePathname,
} from "next/navigation";
import { useTheme } from "@/theme/ThemeProvider";

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

const NEVER_HIDE_ROUTES = [
  "/Workspace",
  "/focus-session",
];

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

  const { isDarkMode } =
    useTheme();

  const { currentUser } =
    useFocusSystem();

  const { currentStreak } =
    useNexCore();

  const [userProfile, setUserProfile] =
    useState<any>(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
  } =
    useNotificationSystem(
      currentUser?.id
    );

  const [isNoteOpen, setIsNoteOpen] =
    useState(false);

  const [showNavbar, setShowNavbar] =
    useState(true);

  const lastScrollY =
    useRef(0);

  const navRef =
    useRef<HTMLElement>(null);

  const isProtectedWorkspace =
    NEVER_HIDE_ROUTES.includes(
      pathname
    );

  useEffect(() => {
    let isMounted = true;

    const fetchProfile =
      async () => {
        if (
          !supabase ||
          !currentUser?.id
        ) {
          if (isMounted)
            setUserProfile(
              null
            );
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

  // Hide on down scroll
  // Show ONLY near top
  useEffect(() => {
    if (
      isProtectedWorkspace
    )
      return;

    const handleScroll =
      () => {
        const currentScroll =
          window.scrollY;

        const diff =
          currentScroll -
          lastScrollY.current;

        // Always visible near top
        if (
          currentScroll <
          40
        ) {
          setShowNavbar(
            true
          );
        }

        // Hide when scrolling down
        else if (
          diff > 5
        ) {
          setShowNavbar(
            false
          );
        }

        // DO NOTHING on scroll up
        // stays hidden

        lastScrollY.current =
          currentScroll;
      };

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );
  }, [
    isProtectedWorkspace,
  ]);

  useEffect(() => {
    const updateHeight =
      () => {
        if (
          navRef.current
        ) {
          document.documentElement.style.setProperty(
            "--navbar-h",
            `${navRef.current.offsetHeight}px`
          );
        }
      };

    updateHeight();

    window.addEventListener(
      "resize",
      updateHeight
    );

    return () =>
      window.removeEventListener(
        "resize",
        updateHeight
      );
  }, []);

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-[100]
      backdrop-blur-2xl border-b
      transition-transform duration-500
      ease-[cubic-bezier(0.16,1,0.3,1)]
      ${
        showNavbar
          ? "translate-y-0"
          : "-translate-y-full"
      }
      ${
        isDarkMode
          ? "bg-[#050505]/78 border-white/[0.04]"
          : "bg-white/80 border-black/[0.04]"
      }`}
    >
      <DesktopNav {...navProps} />
      <MobileNav {...navProps} />
    </nav>
  );
}