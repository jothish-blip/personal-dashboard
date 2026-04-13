"use client";

import React, { useEffect } from "react";
import { BookOpen } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

/* ================= DIARY GUIDE POPUP ================= */

export function WipPopup({
  showWipPopup,
  setShowWipPopup,
}: {
  showWipPopup: boolean;
  setShowWipPopup: (val: boolean) => void;
}) {
  const supabase = getSupabaseClient();

  useEffect(() => {
    const checkSeen = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("diary_guide_seen")
        .eq("id", user.id)
        .single();

      if (data?.diary_guide_seen) {
        setShowWipPopup(false);
      }
    };

    if (showWipPopup) checkSeen();
  }, [showWipPopup, setShowWipPopup, supabase]);

  const handleClose = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (user) {
      await supabase
        .from("profiles")
        .update({ diary_guide_seen: true })
        .eq("id", user.id);
    }

    setShowWipPopup(false);
  };

  if (!showWipPopup) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-slate-900/20 backdrop-blur-sm px-4 text-left">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-t-[2rem] md:rounded-3xl shadow-2xl p-6 md:p-8 animate-in slide-in-from-bottom-8 md:zoom-in-95">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600 shadow-sm">
            <BookOpen size={22} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Your Behavior System
          </h2>
        </div>

        <p className="text-gray-600 text-sm mb-2 font-medium leading-relaxed">
          This system tracks your daily behavior, execution, and patterns to build meaningful insights.
        </p>

        <p className="text-xs text-gray-400 mb-6 font-bold uppercase tracking-wider">
          Your data follows your account.
        </p>

        {/* CONTENT */}
        <div className="space-y-6 text-sm text-gray-600 mb-8">
          <div className="flex gap-4">
            <span className="font-black text-orange-500 text-lg">1</span>
            <div>
              <p className="font-bold text-slate-800 mb-0.5">Capture your state</p>
              <p className="text-gray-500 font-medium">Select mood, energy, and behavior signals before writing.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="font-black text-orange-500 text-lg">2</span>
            <div>
              <p className="font-bold text-slate-800 mb-0.5">Write your day</p>
              <p className="text-gray-500 font-medium">Structure your planning, execution, and reflection clearly.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="font-black text-orange-500 text-lg">3</span>
            <div>
              <p className="font-bold text-slate-800 mb-0.5">Complete the day</p>
              <p className="text-gray-500 font-medium">Finish your reflection to build consistent behavioral insights.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="font-black text-orange-500 text-lg">4</span>
            <div>
              <p className="font-bold text-slate-800 mb-0.5">Review patterns</p>
              <p className="text-gray-500 font-medium">Understand your execution trends and frictions over time.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleClose}
          className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black hover:scale-[1.01] active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
        >
          Start Tracking
        </button>

        {/* TRUST */}
        <p className="text-[10px] text-gray-400 text-center mt-6 uppercase tracking-widest font-black">
          Secure • Synced • Private
        </p>
      </div>
    </div>
  );
}