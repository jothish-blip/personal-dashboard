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
  User // Added User icon
} from "lucide-react";
import { useNotificationSystem } from "@/notifications/useNotificationSystem";
import { getSupabaseClient } from "@/lib/supabase"; // Correct client import

interface NavbarProps {
  meta: Meta;
  setMonthYear: (val: string) => void;
  exportData: () => void;
  importData: (file: File) => void;
}

const COMMAND_ROUTES = [
  { label: "Go to Tasks", path: "/", icon: LayoutGrid },
  { label: "Go to Mini Nisc", path: "/mini-nisc", icon: ListTodo },
  { label: "Go to Diary", path: "/diary", icon: BookOpen },
  { label: "Go to Focus Engine", path: "/focus", icon: Brain },
  { label: "Go to Planner", path: "/calender-event", icon: CalendarDays },
  { label: "Settings", path: "/settings", icon: User }, // Added Settings Route
];

export default function Navbar({ 
  meta, setMonthYear, exportData, importData 
}: NavbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname() || ""; 

  // Safely instantiate supabase
  const supabase = getSupabaseClient();

  const { notifications, unreadCount, markAsRead, clearAll } = useNotificationSystem();
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 🔥 Add User Profile State
  const [userProfile, setUserProfile] = useState<any>(null);

  // 🔥 Fetch Profile on Mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) setUserProfile(data);
    };

    fetchProfile();
  }, [supabase]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCmdKOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsCmdKOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNav = (path: string) => {
    router.push(path);
    setIsCmdKOpen(false);
    setSearchQuery("");
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const activePaths = {
    isTasks: pathname === "/",
    isMini: pathname === "/mini-nisc",
    isDiary: pathname === "/diary",
    isFocus: pathname === "/focus",
    isCalendar: pathname === "/calender-event",
  };

  const [y, m] = (meta.currentMonth || "2024-01").split('-');

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);
  }, []);

  const navProps = {
    activePaths,
    handleNav,
    handleLogout,
    y, m, years,
    setMonthYear,
    handleImportClick,
    exportData,
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    isNoteOpen,
    setIsNoteOpen,
    userProfile // Passed down in case child components need it
  };

  const filteredCommands = COMMAND_ROUTES.filter(route => 
    route.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <nav className="sticky top-0 z-[100] bg-white border-b border-gray-200 shadow-sm transition-all">
        <DesktopNav {...navProps} />
        <MobileNav {...navProps} />
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".json"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              importData(e.target.files[0]);
              e.target.value = ""; 
            }
          }} 
        />
      </nav>

      {isCmdKOpen && (
        <div className="fixed inset-0 z-[9999] bg-gray-900/50 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4">
          <div className="absolute inset-0" onClick={() => setIsCmdKOpen(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-4 py-4 border-b border-gray-100">
              <Search size={20} className="text-gray-400 mr-3" />
              <input 
                autoFocus
                type="text"
                placeholder="Where do you want to go?..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-gray-900 font-medium text-lg outline-none placeholder:text-gray-300"
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">No matching routes found.</div>
              ) : (
                <>
                  {filteredCommands.map((route, i) => (
                    <button
                      key={i}
                      onClick={() => handleNav(route.path)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors group
                        ${pathname === route.path ? "bg-gray-50 text-gray-400 cursor-default" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <route.icon size={16} />
                        {route.label}
                      </div>
                    </button>
                  ))}
                  
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    {/* 🔥 User Profile displayed right above logout */}
                    {userProfile && (
                      <div className="flex items-center gap-3 px-4 py-3 mb-1">
                        <img 
                          src={userProfile.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} 
                          alt="Avatar"
                          className="w-8 h-8 rounded-full border border-gray-200" 
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-bold text-gray-900">
                            {userProfile.full_name || "User"}
                          </span>
                          <span className="text-xs text-gray-400">Signed in</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors group"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}