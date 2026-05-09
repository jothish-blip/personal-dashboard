"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "@/theme/ThemeProvider";
import {
  BrainCircuit,
  TrendingUp,
  Trophy,
  Users,
  ShieldAlert,
  Route,
  Home,
  X,
  Menu
} from "lucide-react";

// Grouped Pages with Nextask-specific Shortcuts
const systemPages = [
  { title: "Gamification System", href: "/help?page=gamification-system", icon: Trophy, shortcut: "ALT 1" }, 
  { title: "Discipline Engine", href: "/help?page=discipline-engine", icon: BrainCircuit, shortcut: "ALT 2" },
  { title: "Progression Economy", href: "/help?page=progression-economy", icon: TrendingUp, shortcut: "ALT 3" },
  { title: "Rewards & Badges", href: "/help?page=rewards-badges", icon: Trophy, shortcut: "ALT 4" },
];

const environmentPages = [
  { title: "Social System", href: "/help?page=social-system", icon: Users, shortcut: "ALT 5" },
  { title: "Failure & Recovery", href: "/help?page=failure-recovery", icon: ShieldAlert, shortcut: "ALT 6" },
  { title: "Roadmap", href: "/help?page=roadmap", icon: Route, shortcut: "ALT 7" },
];

const allPages = [...systemPages, ...environmentPages];

export default function HelpSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isDarkMode } = useTheme();
  
  // Responsive States
  const [isDesktopHovered, setIsDesktopHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Floating Pill State (Desktop Only)
  const [showGuide, setShowGuide] = useState(true);

  const currentQuery = searchParams.get("page");
  const isHomeActive = pathname === "/help" && !currentQuery;
  const currentPageTitle = allPages.find(p => currentQuery && p.href.includes(currentQuery))?.title || "Dashboard";

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  // Intentional Hover Delays (Premium Feel - Desktop Only)
  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setIsDesktopHovered(true), 120);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setIsDesktopHovered(false), 180);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, []);

  // Close mobile drawer on navigation
  const handleNavClick = () => {
    setIsMobileOpen(false);
  };

  // Visibility helpers for responsive transitions
  const textVisibilityClasses = isDesktopHovered 
    ? "lg:opacity-100 lg:translate-x-0 lg:ml-3.5 lg:max-w-[200px]" 
    : "lg:opacity-0 lg:translate-x-2 lg:max-w-0 lg:ml-0";

  // Reusable Nav Item Renderer
  const renderNavItem = (page: any, active: boolean) => {
    const Icon = page.icon;
    return (
      <Link
        key={page.href}
        href={page.href}
        onClick={handleNavClick}
        className={`group relative flex items-center min-h-[56px] lg:min-h-[48px] rounded-xl px-3 transition-colors duration-300 ${
          active
            ? isDarkMode 
                ? "border border-white/8 bg-white/[0.03] text-white" 
                : "border border-black/5 bg-black/[0.03] text-black"
            : isDarkMode 
                ? "border border-transparent text-gray-400 hover:bg-white/[0.02] hover:text-gray-200" 
                : "border border-transparent text-gray-600 hover:bg-black/[0.02] hover:text-gray-900"
        }`}
      >
        {/* Elite Active Indicator Line */}
        {active && (
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-md transition-all ${
            isDarkMode ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.2)]" : "bg-black shadow-[0_0_8px_rgba(0,0,0,0.15)]"
          }`} />
        )}

        {/* Icon with Subtle Active/Hover Scaling */}
        <Icon 
          size={18} 
          className={`flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            active ? "scale-105" : "group-hover:scale-110"
          } ${active ? (isDarkMode ? "text-white" : "text-black") : ""}`} 
        />
        
        {/* Animated Open State Content (Mobile Default Open, Desktop Hover Open) */}
        <div className={`flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-100 translate-x-0 ml-4 max-w-[200px] ${textVisibilityClasses}`}>
          <span className={`font-medium text-[15px] lg:text-sm tracking-wide ${active ? "font-semibold" : ""}`}>
            {page.title}
          </span>
          {page.shortcut && (
            <span className={`hidden lg:inline-block text-[10px] font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
              isDarkMode ? "text-gray-500" : "text-gray-400"
            }`}>
              {page.shortcut}
            </span>
          )}
        </div>

        {/* Collapsed State Premium Tooltip (Desktop Only) */}
        {!isDesktopHovered && (
          <div className={`hidden lg:flex absolute left-full ml-4 px-3 py-2 rounded-lg shadow-xl pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-50 items-center gap-3 whitespace-nowrap border opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 ${
            isDarkMode ? "bg-[#1a1a1a] border-gray-800 text-white" : "bg-white border-gray-200 text-black shadow-md"
          }`}>
            <span className="font-semibold text-sm tracking-wide">{page.title}</span>
            {page.shortcut && (
              <span className={`text-[10px] font-mono tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {page.shortcut}
              </span>
            )}
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* ================= MOBILE HEADER ================= */}
      <header className={`lg:hidden sticky top-0 z-30 w-full flex items-center justify-between px-5 h-14 border-b ${
        isDarkMode ? "bg-[#0a0a0a]/90 border-gray-800/80 backdrop-blur-md" : "bg-white/90 border-gray-200 backdrop-blur-md"
      }`}>
        <button 
          onClick={() => setIsMobileOpen(true)}
          className={`p-2 -ml-2 rounded-lg transition-colors ${isDarkMode ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-black/5"}`}
        >
          <Menu size={20} />
        </button>
        <span className={`font-semibold text-sm tracking-wide ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Nextask Help
        </span>
        <div className="w-8" /> {/* Optical centering spacer */}
      </header>

      {/* ================= MOBILE OVERLAY ================= */}
      <div 
        onClick={() => setIsMobileOpen(false)}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-500 lg:hidden ${
          isMobileOpen ? "opacity-100 cursor-pointer" : "opacity-0 pointer-events-none"
        }`} 
      />

      {/* ================= SIDEBAR CONTAINER ================= */}
      <aside 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col h-full border-r flex-shrink-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:relative lg:translate-x-0 lg:z-40 after:content-[''] after:absolute after:top-0 after:-right-4 after:w-4 after:h-full after:bg-transparent ${
          isDarkMode ? "bg-[#0B0B0D] border-gray-800/80" : "bg-[#F9FAFB] border-gray-200"
        } ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:shadow-none"
        } w-[88vw] max-w-[320px] px-4 py-6 ${
          isDesktopHovered ? "lg:w-[260px] lg:px-3 lg:py-6" : "lg:w-[72px] lg:px-3 lg:py-6"
        }`}
      >
        
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className={`lg:hidden absolute top-5 right-5 p-2 rounded-full transition-colors ${
            isDarkMode ? "bg-white/10 text-white" : "bg-black/5 text-black"
          }`}
        >
          <X size={18} />
        </button>

        {/* Header / Logo */}
        <div className="flex items-center h-10 mb-8 lg:mb-6 overflow-hidden whitespace-nowrap">
          <Link 
            href="/help"
            onClick={handleNavClick}
            title={!isDesktopHovered ? "Help Dashboard" : undefined}
            className={`p-1.5 rounded-lg border transition-colors flex-shrink-0 ml-0.5 ${
              isDarkMode 
                ? "bg-[#1a1a1a] border-gray-800 shadow-sm hover:border-gray-600" 
                : "bg-white border-gray-200 shadow-sm hover:border-gray-300"
            }`}
          >
            <Image 
              src="/favicon.ico" 
              alt="Nextask Logo" 
              width={20} 
              height={20} 
              className="rounded-md"
              unoptimized
            />
          </Link>

          <div className={`flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-100 translate-x-0 ml-3.5 max-w-[200px] ${textVisibilityClasses}`}>
            <h1 className={`font-bold text-base lg:text-sm leading-tight tracking-wide transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Nextask
            </h1>
            <p className={`text-[11px] lg:text-[10px] uppercase tracking-[0.1em] mt-0.5 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              Help Center
            </p>
          </div>
        </div>

        {/* You Are Here Context */}
        <div className={`mb-6 overflow-hidden whitespace-nowrap transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-100 translate-x-0 px-2 h-auto ${
          isDesktopHovered ? "lg:opacity-100 lg:translate-x-0 lg:px-2 lg:h-auto" : "lg:opacity-0 lg:translate-x-2 lg:h-0"
        }`}>
          <p className={`text-[11px] lg:text-[9px] font-mono tracking-[0.15em] uppercase ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            <span className="lg:hidden">{currentPageTitle}</span>
            <span className="hidden lg:inline">HELP CENTER / {currentPageTitle}</span>
          </p>
        </div>

        {/* Navigation Area */}
        <div className={`flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isDesktopHovered ? "" : "lg:overflow-visible"}`}>
          <nav className="flex flex-col w-full pb-10 relative">
            
            {/* Home Dashboard */}
            {renderNavItem({ title: "Help Dashboard", href: "/help", icon: Home, shortcut: "ALT H" }, isHomeActive)}

            {/* Premium Separator */}
            <div className={`my-6 lg:my-5 h-px w-full transition-colors duration-700 ${
              isDarkMode ? "bg-white/[0.04]" : "bg-black/[0.04]"
            }`} />

            {/* SYSTEMS GROUP */}
            <div className="relative flex items-center h-6 mb-2 lg:mb-1">
              <div className={`absolute left-3 text-[11px] lg:text-[10px] font-semibold tracking-[0.18em] uppercase whitespace-nowrap transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-100 translate-x-0 ${
                isDesktopHovered ? "lg:opacity-100 lg:translate-x-0" : "lg:opacity-0 lg:translate-x-2"
              } ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Systems
              </div>
              <div className={`hidden lg:block absolute left-1/2 -translate-x-1/2 w-6 h-px transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isDesktopHovered ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
              } ${isDarkMode ? "bg-gray-800" : "bg-gray-300"}`} />
            </div>
            
            <div className="flex flex-col gap-1.5 lg:gap-1">
              {systemPages.map(page => renderNavItem(page, currentQuery ? page.href.includes(currentQuery) : false))}
            </div>

            {/* ENVIRONMENT GROUP */}
            <div className="relative flex items-center h-6 mt-8 lg:mt-6 mb-2 lg:mb-1">
              <div className={`absolute left-3 text-[11px] lg:text-[10px] font-semibold tracking-[0.18em] uppercase whitespace-nowrap transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-100 translate-x-0 ${
                isDesktopHovered ? "lg:opacity-100 lg:translate-x-0" : "lg:opacity-0 lg:translate-x-2"
              } ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Environment
              </div>
              <div className={`hidden lg:block absolute left-1/2 -translate-x-1/2 w-6 h-px transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isDesktopHovered ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
              } ${isDarkMode ? "bg-gray-800" : "bg-gray-300"}`} />
            </div>
            
            <div className="flex flex-col gap-1.5 lg:gap-1">
              {environmentPages.map(page => renderNavItem(page, currentQuery ? page.href.includes(currentQuery) : false))}
            </div>

          </nav>
        </div>
      </aside>

      {/* ================= DESKTOP FLOATING GUIDE PILL ================= */}
      {showGuide && (
        <div className={`hidden md:flex fixed bottom-5 right-5 z-50 items-center gap-4 pl-5 pr-3 py-3 rounded-full border shadow-lg backdrop-blur-md transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500 ${
          isDarkMode ? "bg-[#0B0B0D]/80 border-gray-800/80" : "bg-white/80 border-gray-200 shadow-sm"
        }`}>
          <div className="flex flex-col justify-center">
            <span className={`text-[10px] font-medium uppercase tracking-[0.15em] ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              Use sidebar to switch systems
            </span>
            <span className={`text-xs tracking-wide mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Help Center <span className="mx-1.5 opacity-40">•</span> <span className={isDarkMode ? "text-white font-medium drop-shadow-md" : "text-black font-medium"}>{currentPageTitle}</span>
            </span>
          </div>

          <div className={`w-px h-6 mx-1 ${isDarkMode ? "bg-gray-800" : "bg-gray-300"}`} />

          <button 
            onClick={() => setShowGuide(false)}
            className={`p-1.5 rounded-full transition-colors duration-200 ${
              isDarkMode ? "text-gray-500 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-black hover:bg-black/5"
            }`}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}