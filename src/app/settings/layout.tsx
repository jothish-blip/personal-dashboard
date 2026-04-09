"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

import {
  ArrowLeft,
  User,
  Shield,
  Bell,
  MessageSquare,
  Settings,
} from "lucide-react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseClient();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
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

  if (loading) return null;

  const navItems = [
    { name: "Profile", path: "/settings/profile", icon: User },
    { name: "Account", path: "/settings/account-management", icon: Settings },
    { name: "Security", path: "/settings/security", icon: Shield },
    { name: "Notifications", path: "/settings/notifications", icon: Bell },
    { name: "Feedback", path: "/settings/feedback", icon: MessageSquare },
    { name: "Contact", path: "/settings/contact", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans">

      {/* 🔝 Header */}
      <div className="bg-white px-4 md:px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-black"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="font-semibold text-gray-800">
            Settings
          </div>

          <div className="w-10" /> {/* spacer */}
        </div>
      </div>

      {/* 📱 MOBILE NAV (Tabs) */}
      <div className="md:hidden sticky top-[60px] z-20 bg-[#FAFAFA] border-b border-gray-100">
        <div className="flex overflow-x-auto no-scrollbar px-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "text-black border-b-2 border-black"
                    : "text-gray-400"
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🖥 DESKTOP LAYOUT */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 mt-8 flex gap-10">

        {/* Sidebar (Desktop Only) */}
        <div className="hidden md:block w-60 shrink-0">
          <div className="space-y-1">

            <p className="text-xs font-semibold text-gray-400 uppercase mb-4">
              Settings
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition ${
                    isActive
                      ? "bg-gray-100 text-black"
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

        {/* Content */}
        <div className="flex-1 max-w-2xl mx-auto md:mx-0 pb-20">
          {children}
        </div>

      </div>
    </div>
  );
}