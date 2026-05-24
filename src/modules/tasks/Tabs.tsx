"use client";

import React from "react";
import { useTheme } from "@/theme/ThemeProvider"; // 🔥 Import the Theme Provider

interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Tabs({
  activeTab,
  setActiveTab,
}: TabsProps) {
  const { isDarkMode } = useTheme(); // 🔥 Consume theme state

  const tabs = [
    { id: "matrix", label: "Tasks" },
    { id: "analytics", label: "Insights" },
    { id: "audit", label: "Audit Logs" },
  ];

  return (
    // mt-32 (128px) clears the fixed ~100px MobileNav perfectly on mobile.
    // md:mt-12 keeps the original spacing on desktop.
    <div className="relative z-10 w-full flex justify-center mt-32 md:mt-12 mb-6 md:mb-8 px-4">
      <div className={`flex items-center gap-1 md:gap-2 p-1.5 rounded-2xl border max-w-full overflow-x-auto scrollbar-hide transition-colors duration-300 ${
        isDarkMode 
          ? "bg-[#0D0D0D] border-[#1E293B] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]" 
          : "bg-white border-gray-200 shadow-sm"
      }`}>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 md:px-5 md:py-2.5 rounded-xl
                text-xs md:text-sm font-semibold
                transition-all duration-300
                whitespace-nowrap shrink-0
                ${
                  isActive
                    ? `
                      bg-orange-500
                      text-white
                      shadow-[0_8px_20px_rgba(249,115,22,0.25)]
                    `
                    : (isDarkMode 
                        ? `text-gray-400 hover:text-white hover:bg-[#171717]` 
                        : `text-gray-500 hover:text-gray-900 hover:bg-gray-50`)
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}