"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Meta } from "../types";

import DesktopNav from "./navbar/DesktopNav";
import MobileNav from "./navbar/MobileNav";
import { Search, LayoutGrid, ListTodo, BookOpen, Brain, CalendarDays } from "lucide-react";

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
];

export default function Navbar({ 
  meta, setMonthYear, exportData, importData 
}: NavbarProps) {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname() || ""; 

  // --- CMD+K STATE ---
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Keyboard listener for Cmd+K / Ctrl+K
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

  // SINGLE SOURCE OF TRUTH
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
    y, m, years,
    setMonthYear,
    handleImportClick,
    exportData
  };

  // Filter command routes based on search
  const filteredCommands = COMMAND_ROUTES.filter(route => 
    route.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <nav className="sticky top-0 z-[100] bg-white border-b border-gray-200 shadow-sm transition-all">
        <DesktopNav {...navProps} />
        <MobileNav {...navProps} />

        {/* Hidden File Input for Data Import */}
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

      {/* ✅ NEXT LEVEL: CMD+K COMMAND PALETTE OVERLAY */}
      {isCmdKOpen && (
        <div className="fixed inset-0 z-[9999] bg-gray-900/50 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4">
          
          {/* Close background click */}
          <div className="absolute inset-0" onClick={() => setIsCmdKOpen(false)} />
          
          <div className="relative bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Search Input */}
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
              <div className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">ESC</div>
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">No matching routes found.</div>
              ) : (
                filteredCommands.map((route, i) => {
                  const Icon = route.icon;
                  const isActivePath = pathname === route.path;
                  return (
                    <button
                      key={i}
                      onClick={() => handleNav(route.path)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors group
                        ${isActivePath ? "bg-gray-50 text-gray-400 cursor-default" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={16} className={isActivePath ? "text-gray-300" : "text-gray-400 group-hover:text-gray-700"} />
                        {route.label}
                      </div>
                      {isActivePath && <span className="text-[10px] uppercase tracking-wider font-bold">Current</span>}
                    </button>
                  );
                })
              )}
            </div>

            <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-4">
              <span>Use <kbd className="font-sans bg-white border border-gray-200 px-1 rounded shadow-sm">↑</kbd> <kbd className="font-sans bg-white border border-gray-200 px-1 rounded shadow-sm">↓</kbd> to navigate</span>
              <span><kbd className="font-sans bg-white border border-gray-200 px-1.5 rounded shadow-sm">Enter</kbd> to select</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}