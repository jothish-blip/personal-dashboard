"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeProvider";

import {
  ArrowLeft,
  User,
  Shield,
  Bell,
  MessageSquare,
  Settings,
  Monitor
} from "lucide-react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseClient();
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);

  // 🔥 Swipe refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const load = async () => {
      // 🔥 FIX: Guard clause to ensure supabase is not null
      if (!supabase) {
        router.replace("/login");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setLoading(false);
    };

    load();
  }, [router, supabase]);

  if (loading) {
    return (
      <div
        className={`min-h-screen ${
          isDarkMode ? "bg-[#050505]" : "bg-[#FAFAFA]"
        }`}
      />
    );
  }

  const navItems = [
    { name: "Profile", path: "/settings/profile", icon: User },
    { name: "Account", path: "/settings/account-management", icon: Settings },
    { name: "Appearance", path: "/settings/appearance", icon: Monitor },
    { name: "Security", path: "/settings/security", icon: Shield },
    { name: "Notifications", path: "/settings/notifications", icon: Bell },
    { name: "Feedback", path: "/settings/feedback", icon: MessageSquare },
    { name: "Contact", path: "/settings/contact", icon: MessageSquare },
  ];

  // 🔥 Get current index
  const currentIndex = navItems.findIndex((i) =>
    pathname.startsWith(i.path)
  );

  // 🔥 Swipe Logic
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;

    const diff = touchStartX.current - touchEndX.current;

    // 👉 swipe threshold
    if (Math.abs(diff) < 60) return;

    // 👉 swipe left → next page
    if (diff > 0 && currentIndex < navItems.length - 1) {
      router.push(navItems[currentIndex + 1].path);
    }

    // 👉 swipe right → previous page
    if (diff < 0 && currentIndex > 0) {
      router.push(navItems[currentIndex - 1].path);
    }
  };

  return (
    <div
      className={`min-h-screen font-sans ${
        isDarkMode
          ? "bg-[#050505] text-white"
          : "bg-[#FAFAFA] text-[#111827]"
      }`}
    >
      {/* 🔝 HEADER */}
      <div
        className={`px-4 md:px-6 py-4 sticky top-0 z-30 border-b ${
          isDarkMode
            ? "bg-[#050505]/95 border-gray-800 backdrop-blur-sm"
            : "bg-white border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className={`flex items-center gap-2 text-sm ${
              isDarkMode
                ? "text-gray-400 hover:text-white"
                : "text-gray-500 hover:text-black"
            }`}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="font-semibold">Settings</div>

          <div className="w-10" />
        </div>
      </div>

      {/* 📱 MOBILE NAV (KEEP SAME DESIGN) */}
      <div
        className={`md:hidden sticky top-[56px] z-20 border-b ${
          isDarkMode
            ? "bg-[#050505] border-gray-800"
            : "bg-[#FAFAFA] border-gray-100"
        }`}
      >
        <div className="flex overflow-x-auto no-scrollbar px-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium ${
                  isActive
                    ? isDarkMode
                      ? "text-white border-b-2 border-white"
                      : "text-black border-b-2 border-black"
                    : isDarkMode
                    ? "text-gray-500 hover:text-gray-300"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🔥 SWIPE WRAPPER */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="max-w-6xl mx-auto px-4 md:px-6 mt-8 flex gap-10"
      >
        {/* 🖥 DESKTOP SIDEBAR */}
        <div className="hidden md:block w-60 shrink-0">
          <div className="space-y-1 sticky top-[100px]">
            <p
              className={`text-xs font-semibold uppercase mb-4 tracking-wider ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Settings
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
                    isActive
                      ? isDarkMode
                        ? "bg-[#111111] text-white"
                        : "bg-gray-100 text-black"
                      : isDarkMode
                      ? "text-gray-400 hover:text-white hover:bg-[#111111]"
                      : "text-gray-500 hover:text-black hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} />
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 max-w-2xl mx-auto md:mx-0 pb-24">
          {children}
        </div>
      </div>
    </div>
  );
}