"use client";

import React, { useState, useEffect, useRef } from "react";
import { BrainCircuit, ChevronLeft } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { useTheme } from "@/theme/ThemeProvider";

interface OnboardingProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingProps) {
  const { isDarkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const hasChecked = useRef(false);

  const supabase = getSupabaseClient();

  useEffect(() => {
    // 🔥 Fast synchronous check to prevent multiple popups / flashes
    const localSeen = localStorage.getItem("nextask_onboarding_seen");
    if (localSeen === "true") {
      onComplete();
      return;
    }

    const checkOnboarding = async () => {
      if (hasChecked.current) return;
      hasChecked.current = true;

      // 🔥 FIX: Guard clause to ensure supabase is not null
      if (!supabase) return;

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) return;

      // 🔥 FIX: Cast supabase to any FIRST to bypass strict 'never' table type errors
      const { data } = await (supabase as any)
        .from("profiles")
        .select("onboarding_seen")
        .eq("id", user.id)
        .single();

      if (data?.onboarding_seen) {
        localStorage.setItem("nextask_onboarding_seen", "true");
        onComplete();
      } else {
        setIsVisible(true);
      }
    };

    checkOnboarding();
  }, [onComplete, supabase]);

  const handleComplete = async () => {
    // 🔥 Immediately save locally so it never shows again on this device
    localStorage.setItem("nextask_onboarding_seen", "true");
    setIsVisible(false);
    onComplete();

    // 🔥 FIX: Guard clause before doing background sync
    if (!supabase) return;

    // Sync to database in the background
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (user) {
      // 🔥 FIX: Cast supabase to any FIRST to bypass strict 'never' table type errors
      await (supabase as any)
        .from("profiles")
        .update({ onboarding_seen: true })
        .eq("id", user.id);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-end md:items-center justify-center backdrop-blur-md px-4 ${
      isDarkMode ? "bg-black/60" : "bg-slate-900/40"
    }`}>

      <div className={`w-full md:max-w-2xl border rounded-t-[2rem] md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 md:zoom-in-95 transition-colors duration-300 ${
        isDarkMode ? "bg-[#111111] border-gray-800" : "bg-[#ffffff] border-gray-200"
      }`}>

        {/* HEADER */}
        <div className={`px-6 py-6 border-b flex justify-between items-center ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <div>
            <h2 className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              <BrainCircuit className="text-orange-400" /> NexTask OS
            </h2>
            <p className={`text-[10px] uppercase tracking-widest mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              System Initialization
            </p>
          </div>
        </div>

        {/* PROGRESS */}
        <div className={`w-full h-1 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
          <div
            className="h-full bg-orange-500 transition-all"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        <div className={`px-6 pt-4 flex justify-between text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          <span>Step {currentStep} of 4</span>
          <span>Your data follows you — not your device</span>
        </div>

        {/* CONTENT */}
        <div className="px-6 py-6 overflow-y-auto">

          {currentStep === 1 && (
            <div>
              <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Execution Engine</h3>
              <div className={`space-y-4 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                <p><b className={isDarkMode ? "text-white" : "text-gray-900"}>Deploy Objectives</b> – Add your daily targets.</p>
                <p><b className={isDarkMode ? "text-white" : "text-gray-900"}>Daily Lock</b> – Only today is actionable.</p>
                <p><b className={isDarkMode ? "text-white" : "text-gray-900"}>Momentum Tracking</b> – Build consistency over time.</p>
                <p><b className={isDarkMode ? "text-white" : "text-gray-900"}>Unified System</b> – Tasks, Diary, Notes connected.</p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Your System</h3>
              <p className={`mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Synced, secure, and available across all your devices.
              </p>

              <div className={`space-y-4 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                <p>✔ Account Sync (Google / Facebook / GitHub)</p>
                <p>✔ Real-time updates across devices</p>
                <p>✔ Cloud storage (no backups needed)</p>
                <p>✔ Multi-module integration</p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Modules</h3>
              <div className={`space-y-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                <p>Tasks – Daily execution</p>
                <p>Focus – Deep work tracking</p>
                <p>Notes – Idea system</p>
                <p>Calendar – Planning</p>
                <p>Diary – Reflection + insights</p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center py-6">
              <h3 className={`text-3xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                You're Ready
              </h3>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                Your system is live and synced.
                <br /><br />
                <span className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Execution builds everything.
                </span>
              </p>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className={`px-6 py-5 border-t flex justify-between ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>

          <button
            onClick={() => setCurrentStep((p) => Math.max(1, p - 1))}
            className={`transition-colors ${currentStep === 1 ? "opacity-0 pointer-events-none" : ""} ${
              isDarkMode ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-900"
            }`}
          >
            <ChevronLeft />
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep((p) => Math.min(4, p + 1))}
              // 🔥 FIXED: Used hardcoded hex values to prevent global.css bg-white override in dark mode
              className={`px-6 py-2 rounded-lg font-semibold transition-transform active:scale-95 ${
                isDarkMode ? "bg-[#ffffff] text-[#000000] hover:bg-[#e5e7eb]" : "bg-[#111827] text-[#ffffff] hover:bg-[#1f2937]"
              }`}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-[#f97316] hover:bg-[#ea580c] text-[#ffffff] rounded-lg font-semibold transition-transform active:scale-95 shadow-md"
            >
              Start
            </button>
          )}

        </div>
      </div>
    </div>
  );
}