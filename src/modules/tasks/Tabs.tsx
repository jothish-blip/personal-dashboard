"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckSquare, BarChart3, Activity } from "lucide-react";
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
    { id: "matrix", label: "Tasks", icon: CheckSquare },
    { id: "analytics", label: "Insights", icon: BarChart3 },
    { id: "audit", label: "Activity", icon: Activity },
  ];

  return (
    // Desktop: Left-aligned and contained. Mobile: Centered.
    <div className="relative z-10 w-full flex justify-center md:justify-start max-w-[1600px] mx-auto mt-4 md:mt-5 mb-5 md:mb-6">
      
      {/* Pure, solid substrate. No expensive backdrop-blurs. */}
      <div
        className={`
          flex items-center p-1.5 gap-1 w-full sm:w-auto
          rounded-2xl border transition-colors duration-300
          ${
            isDarkMode
              ? "bg-black border-white/[0.06]"
              : "bg-white border-black/[0.06]"
          }
        `}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex-1 sm:flex-none flex items-center justify-center gap-2
                min-h-[44px] px-3 md:px-6 py-2 md:py-2.5 rounded-xl
                whitespace-nowrap shrink-0 transition-colors duration-200
                text-[13px] tracking-wide outline-none select-none
                ${
                  isActive
                    ? "text-white"
                    : isDarkMode
                    ? "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    : "text-gray-500 hover:text-gray-900 hover:bg-black/[0.04]"
                }
              `}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* Keep content above the sliding background indicator */}
              <span className="relative z-10 flex items-center gap-2 font-medium">
                <Icon 
                  size={16} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={isActive ? "opacity-100" : "opacity-70"} 
                />
                {tab.label}
              </span>

              {/* The "Liquid" Morphism Indicator */}
              {isActive && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="absolute inset-0 z-0 rounded-xl bg-orange-500 border border-orange-400/20 shadow-[0_0_20px_rgba(249,115,22,0.25)]"
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 32,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}