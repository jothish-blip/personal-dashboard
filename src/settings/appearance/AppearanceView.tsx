"use client";

import React from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

type ThemeMode = "light" | "dark" | "system";

interface ThemeOption {
  mode: ThemeMode;
  title: string;
  description: string;
  icon: typeof Sun;
}

export default function AppearanceView() {
  const { themeMode, setThemeMode, isDarkMode } = useTheme();

  const themeOptions: ThemeOption[] = [
    {
      mode: "light",
      title: "Light",
      description: "Crisp white interface with high clarity and contrast",
      icon: Sun,
    },
    {
      mode: "dark",
      title: "Dark",
      description: "Deep obsidian tones designed to reduce eye strain in low-light environments",
      icon: Moon,
    },
    {
      mode: "system",
      title: "System",
      description: "Automatically synchronizes with your device operating system preferences",
      icon: Monitor,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <div>
        <h1
          className={`text-2xl md:text-3xl font-bold transition-colors ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Appearance
        </h1>
        <p
          className={`text-sm mt-1 transition-colors ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Customize how NexSpace looks across your devices.
        </p>
      </div>

      {/* Theme Selection Section */}
      <div className="space-y-4">
        <h2
          className={`text-xs font-semibold uppercase tracking-wide transition-colors ${
            isDarkMode ? "text-gray-500" : "text-gray-400"
          }`}
        >
          Theme Preferences
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themeOptions.map((opt) => {
            const isSelected = themeMode === opt.mode;
            const Icon = opt.icon;

            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setThemeMode(opt.mode)}
                className={`relative flex flex-col text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? isDarkMode
                      ? "border-orange-500 bg-[#141414] ring-1 ring-orange-500/50 shadow-sm"
                      : "border-orange-500 bg-orange-50/20 ring-1 ring-orange-500/40 shadow-sm"
                    : isDarkMode
                    ? "border-gray-800 bg-[#0d0d0d] hover:border-gray-700 hover:bg-[#121212]"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60"
                }`}
              >
                {/* Miniature Representation Box */}
                <div
                  className={`w-full h-20 rounded-xl mb-4 p-2.5 flex flex-col justify-between border transition-colors ${
                    opt.mode === "light"
                      ? "bg-[#f8fafc] border-gray-200"
                      : opt.mode === "dark"
                      ? "bg-[#050505] border-gray-800"
                      : isDarkMode
                      ? "bg-gradient-to-br from-[#050505] to-[#1a1a1a] border-gray-800"
                      : "bg-gradient-to-br from-[#f8fafc] to-gray-200 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <div
                        className={`h-1.5 w-10 rounded-full ${
                          opt.mode === "dark" || (opt.mode === "system" && isDarkMode)
                            ? "bg-gray-700"
                            : "bg-gray-300"
                        }`}
                      />
                    </div>
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center ${
                        isSelected
                          ? "text-orange-500"
                          : opt.mode === "dark" || (opt.mode === "system" && isDarkMode)
                          ? "text-gray-500"
                          : "text-gray-400"
                      }`}
                    >
                      <Icon size={12} />
                    </div>
                  </div>

                  <div
                    className={`p-1.5 rounded-lg border text-[10px] flex items-center justify-between ${
                      opt.mode === "dark" || (opt.mode === "system" && isDarkMode)
                        ? "bg-[#111111] border-gray-800 text-gray-300"
                        : "bg-white border-gray-200 text-gray-700 shadow-2xs"
                    }`}
                  >
                    <span className="font-semibold">{opt.title}</span>
                    {isSelected && <Check size={10} className="text-orange-500 stroke-[3]" />}
                  </div>
                </div>

                {/* Card Title & Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon
                      size={16}
                      className={
                        isSelected
                          ? "text-orange-500"
                          : isDarkMode
                          ? "text-gray-400"
                          : "text-gray-600"
                      }
                    />
                    <span
                      className={`text-sm font-semibold transition-colors ${
                        isSelected
                          ? isDarkMode
                            ? "text-white"
                            : "text-gray-900"
                          : isDarkMode
                          ? "text-gray-300"
                          : "text-gray-700"
                      }`}
                    >
                      {opt.title}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                      <Check size={10} className="text-white stroke-[3]" />
                    </div>
                  )}
                </div>

                <p
                  className={`text-xs mt-1.5 line-clamp-2 transition-colors ${
                    isDarkMode ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Information card matching Security trust card */}
      <div
        className={`rounded-2xl border px-4 py-4 transition-colors ${
          isDarkMode
            ? "border-amber-900/40 bg-amber-950/20"
            : "border-amber-100 bg-amber-50"
        }`}
      >
        <p
          className={`text-sm leading-relaxed transition-colors ${
            isDarkMode ? "text-amber-300" : "text-amber-800"
          }`}
        >
          💡 <span className="font-semibold">System mode</span> dynamically follows your operating system&apos;s dark and light appearance schedules (such as night shift or sunset triggers). Your chosen preference is automatically saved locally.
        </p>
      </div>

      {/* Interface Stability Note */}
      <div
        className={`pt-6 border-t text-xs leading-relaxed transition-colors ${
          isDarkMode
            ? "border-gray-800 text-gray-500"
            : "border-gray-100 text-gray-400"
        }`}
      >
        NexSpace uses isolated color interpolations for instant, flicker-free theme switches without layout disruption or UI shifts.
      </div>
    </div>
  );
}