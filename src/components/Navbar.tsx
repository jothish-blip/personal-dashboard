"use client";

import React, { useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Meta } from "../types";

import DesktopNav from "./navbar/DesktopNav";
import MobileNav from "./navbar/MobileNav";

interface NavbarProps {
  meta: Meta;
  setMonthYear: (val: string) => void;
  exportData: () => void;
  importData: (file: File) => void;
}

export default function Navbar({ 
  meta, setMonthYear, exportData, importData 
}: NavbarProps) {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname() || ""; 

  // Single Source of Truth for Routing
  const activePaths = {
    isTasks: pathname === "/",
    isMini: pathname === "/mini-nisc",
    isDiary: pathname === "/diary",
    isFinance: pathname === "/finance",
    isCalendar: pathname === "/calender-event",
  };

  const handleNav = (path: string) => router.push(path);
  const handleImportClick = () => fileInputRef.current?.click();

  const [y, m] = meta.currentMonth.split('-');

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);
  }, []);

  const navProps = {
    activePaths,
    handleNav,
    y,
    m,
    years,
    setMonthYear,
    handleImportClick,
    exportData
  };

  return (
    <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all">
      
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
  );
}