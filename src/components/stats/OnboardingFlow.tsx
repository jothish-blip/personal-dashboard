"use client";

import React, { useState, useEffect } from "react";
import { BrainCircuit, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

interface OnboardingProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isVisible, setIsVisible] = useState(false);

  const supabase = getSupabaseClient();

  // ✅ CHECK FROM DATABASE (NOT localStorage)
  useEffect(() => {
    const checkOnboarding = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("onboarding_seen")
        .eq("id", user.id)
        .single();

      if (data?.onboarding_seen) {
        onComplete(); // Skip onboarding
      } else {
        setIsVisible(true);
      }
    };

    checkOnboarding();
  }, []);

  // ✅ SAVE TO DATABASE
  const handleComplete = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_seen: true })
        .eq("id", user.id);
    }

    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-md px-4">

      <div className="w-full md:max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-t-[2rem] md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 md:zoom-in-95">

        {/* HEADER */}
        <div className="px-6 py-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <BrainCircuit className="text-orange-400" /> NexTask OS
            </h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
              System Initialization
            </p>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="w-full bg-white/10 h-1">
          <div
            className="h-full bg-orange-500 transition-all"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        <div className="px-6 pt-4 flex justify-between text-xs text-gray-400">
          <span>Step {currentStep} of 4</span>
          <span>Your data follows you — not your device</span>
        </div>

        {/* CONTENT */}
        <div className="px-6 py-6 overflow-y-auto">

          {currentStep === 1 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Execution Engine</h3>
              <div className="space-y-4 text-gray-300 text-sm">
                <p><b className="text-white">Deploy Objectives</b> – Add your daily targets.</p>
                <p><b className="text-white">Daily Lock</b> – Only today is actionable.</p>
                <p><b className="text-white">Momentum Tracking</b> – Build consistency over time.</p>
                <p><b className="text-white">Unified System</b> – Tasks, Diary, Notes connected.</p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Your System</h3>
              <p className="text-gray-400 mb-6">
                Synced, secure, and available across all your devices.
              </p>

              <div className="space-y-4 text-sm text-gray-300">
                <p>✔ Account Sync (Google / Facebook / GitHub)</p>
                <p>✔ Real-time updates across devices</p>
                <p>✔ Cloud storage (no backups needed)</p>
                <p>✔ Multi-module integration</p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Modules</h3>
              <div className="space-y-3 text-gray-300 text-sm">
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
              <h3 className="text-3xl font-bold text-white mb-4">
                You're Ready
              </h3>
              <p className="text-gray-400">
                Your system is live and synced.
                <br /><br />
                <span className="text-white font-semibold">
                  Execution builds everything.
                </span>
              </p>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-6 py-5 border-t border-white/10 flex justify-between">

          <button
            onClick={() => setCurrentStep((p) => Math.max(1, p - 1))}
            className={`text-gray-400 ${currentStep === 1 ? "opacity-0" : ""}`}
          >
            <ChevronLeft />
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep((p) => Math.min(4, p + 1))}
              className="px-6 py-2 bg-white text-black rounded-lg font-semibold"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-orange-500 rounded-lg font-semibold"
            >
              Start
            </button>
          )}

        </div>
      </div>
    </div>
  );
}