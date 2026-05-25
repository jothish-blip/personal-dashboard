"use client";

import React from "react";
import { useTheme } from "@/theme/ThemeProvider";

interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Tabs({
  activeTab,
  setActiveTab,
}: TabsProps) {
  const { isDarkMode } = useTheme();

  const tabs = [
    { id: "matrix", label: "Tasks" },
    { id: "analytics", label: "Insights" },
    { id: "audit", label: "Audit Logs" },
  ];

  return (
    <div className="relative z-10 w-full flex justify-center mt-32 md:mt-12 mb-5 md:mb-7 px-4">
      <div
        className={`
          flex items-center gap-1
          p-1.5
          rounded-[1.5rem]
          border
          backdrop-blur-[24px]
          transition-all duration-300
          max-w-full overflow-x-auto
          scrollbar-hide
          ${
            isDarkMode
              ? `
                bg-black/[0.72]
                border-white/[0.04]
              `
              : `
                bg-white/[0.75]
                border-black/[0.04]
                shadow-[0_10px_35px_rgba(15,23,42,0.05)]
              `
          }
        `}
      >
        {tabs.map((tab) => {
          const isActive =
            activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id)
              }
              className={`
                relative
                px-4 md:px-5
                py-2 md:py-2.5
                rounded-[1rem]
                whitespace-nowrap
                shrink-0
                transition-all duration-200
                text-[12px] md:text-[13px]
                tracking-[-0.01em]
                ${
                  isActive
                    ? `
                      bg-orange-500
                      text-white
                      shadow-[0_8px_22px_rgba(249,115,22,0.24)]
                    `
                    : isDarkMode
                    ? `
                      text-white/52
                      hover:text-white
                      hover:bg-white/[0.04]
                    `
                    : `
                      text-gray-500
                      hover:text-gray-900
                      hover:bg-black/[0.03]
                    `
                }
              `}
              style={{
                fontWeight: isActive
                  ? 540
                  : 500,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}