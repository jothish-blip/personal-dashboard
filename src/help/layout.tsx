"use client";

import React, { Suspense } from "react";
import { useTheme } from "@/theme/ThemeProvider";
import HelpSidebar from "./components/HelpSidebar"; // Adjust path if needed

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDarkMode } = useTheme();

  return (
    // Responsive Flex: Stacks vertically on mobile (for the top header), side-by-side on desktop
    <div className={`h-screen w-full flex flex-col lg:flex-row overflow-hidden transition-colors duration-300 ${
      isDarkMode ? "bg-[#050505] text-white" : "bg-[#F9FAFB] text-gray-900"
    }`}>
      
      {/* Sidebar & Mobile Header Container */}
      <Suspense fallback={
        <div className={`hidden lg:block w-[72px] border-r h-full ${isDarkMode ? "border-gray-800" : "border-gray-200"}`} />
      }>
        <HelpSidebar />
      </Suspense>

      {/* Scrollable Main Content Area 
          min-h-0 and min-w-0 are critical flexbox properties that force overflow to work correctly 
      */}
      <main className="flex-1 min-h-0 min-w-0 overflow-y-auto relative scroll-smooth bg-transparent">
        {children}
      </main>
      
    </div>
  );
}