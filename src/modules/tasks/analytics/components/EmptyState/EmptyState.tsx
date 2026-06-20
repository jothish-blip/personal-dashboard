"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

interface EmptyStateProps {
  title?: string;
  description?: string;
  type?: "nexspace" | "performance" | "focus" | "advanced";
}

export default function EmptyState({
  title,
  description,
  type = "performance",
}: EmptyStateProps) {
  const { isDarkMode } = useTheme();

  const content = {
    nexspace: {
      title: "Build your operating system",
      description:
        "Complete tasks consistently to unlock execution DNA, focus drift, and deep work analytics.",
    },
    performance: {
      title: "Analytics waiting for data",
      description:
        "Complete tasks and build momentum to reveal performance trends.",
    },
    focus: {
      title: "No focus distribution yet",
      description:
        "Complete tasks across different areas to see where your attention goes.",
    },
    advanced: {
      title: "Advanced analytics locked",
      description:
        "Unlock deeper insights after building enough activity history.",
    },
  };

  const activeContent = content[type];

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
      <div
        className={`
          w-full max-w-md
          rounded-[28px]
          border
          px-8
          py-10
          text-center
          backdrop-blur-xl
          transition-all
          duration-300
          ${
            isDarkMode
              ? "border-white/[0.05] bg-black/[0.45]"
              : "border-black/[0.05] bg-white/[0.75]"
          }
        `}
      >
        {/* Icon */}
        <div
          className={`
            mx-auto mb-5
            flex h-14 w-14 items-center justify-center
            rounded-2xl
            border
            ${
              isDarkMode
                ? "border-orange-500/20 bg-orange-500/10"
                : "border-orange-500/15 bg-orange-500/10"
            }
          `}
        >
          <BarChart3
            size={24}
            className="text-orange-500"
          />
        </div>

        {/* Title */}
        <h3
          className={`
            text-[15px]
            font-semibold
            tracking-[-0.02em]
            ${
              isDarkMode
                ? "text-white"
                : "text-slate-900"
            }
          `}
        >
          {title || activeContent.title}
        </h3>

        {/* Description */}
        <p
          className={`
            mt-2
            text-sm
            leading-relaxed
            ${
              isDarkMode
                ? "text-white/50"
                : "text-slate-500"
            }
          `}
        >
          {description || activeContent.description}
        </p>

        {/* Fake Analytics Preview */}
        <div className="mt-8 space-y-3 opacity-50">
          <div
            className={`
              h-2 rounded-full
              ${
                isDarkMode
                  ? "bg-white/[0.08]"
                  : "bg-black/[0.06]"
              }
            `}
          >
            <div className="h-full w-[82%] rounded-full bg-orange-500/60" />
          </div>

          <div
            className={`
              h-2 rounded-full
              ${
                isDarkMode
                  ? "bg-white/[0.08]"
                  : "bg-black/[0.06]"
              }
            `}
          >
            <div className="h-full w-[54%] rounded-full bg-orange-500/50" />
          </div>

          <div
            className={`
              h-2 rounded-full
              ${
                isDarkMode
                  ? "bg-white/[0.08]"
                  : "bg-black/[0.06]"
              }
            `}
          >
            <div className="h-full w-[93%] rounded-full bg-orange-500/40" />
          </div>
        </div>

        {/* Status */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <span
            className={`
              text-[11px]
              font-medium
              ${
                isDarkMode
                  ? "text-white/35"
                  : "text-slate-400"
              }
            `}
          >
            Waiting for execution history
          </span>
        </div>
      </div>
    </div>
  );
}