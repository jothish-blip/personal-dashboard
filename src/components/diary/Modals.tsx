"use client";

import React, { useEffect } from "react";
import { Lock, BookOpen } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

/* ================= LOCKED SCREEN ================= */

export function LockedScreen({ passwordAttempt, setPasswordAttempt }: any) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-slate-900">
      <div className="max-w-md w-full bg-white border border-gray-200 p-8 rounded-3xl shadow-xl shadow-gray-200/50 text-center">
        
        <div className="bg-red-50/80 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6">
          <Lock className="text-red-500" size={32} />
        </div>

        <h2 className="text-2xl font-bold mb-2 text-slate-800">
          Locked Entry
        </h2>

        <p className="text-sm text-gray-500 mb-8">
          This memory is private and secured.
        </p>

        <div className="space-y-4">
          <input
            type="password"
            value={passwordAttempt}
            onChange={(e) => setPasswordAttempt(e.target.value)}
            placeholder="Enter password"
            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-center text-sm font-semibold outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
          />

          <button className="w-full py-3.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 hover:scale-[1.01] active:scale-[0.98] transition shadow-lg shadow-orange-500/20">
            Unlock
          </button>
        </div>

        <p className="text-[10px] text-gray-400 mt-8 uppercase tracking-widest font-medium">
          Demo: <span className="text-orange-600">nex</span>
        </p>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-slate-900/20 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-t-[2rem] md:rounded-3xl shadow-2xl p-6 md:p-8 animate-in slide-in-from-bottom-8 md:zoom-in-95">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600">
            <BookOpen size={22} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Your Diary System
          </h2>
        </div>

        <p className="text-gray-600 text-sm mb-2">
          Your diary is synced, private, and builds insights from your daily behavior.
        </p>

        <p className="text-xs text-gray-400 mb-6 font-medium">
          Your data follows your account — not your device.
        </p>

        {/* CONTENT */}
        <div className="space-y-5 text-sm text-gray-600 mb-8">
          <div className="flex gap-3">
            <span className="font-bold text-orange-600">1.</span>
            <div>
              <p className="font-semibold text-slate-800">Capture your state</p>
              <p className="text-gray-500">Select mood, energy, and focus before writing.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="font-bold text-orange-600">2.</span>
            <div>
              <p className="font-semibold text-slate-800">Write your day</p>
              <p className="text-gray-500">Track morning, afternoon, and evening clearly.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="font-bold text-orange-600">3.</span>
            <div>
              <p className="font-semibold text-slate-800">Close the day</p>
              <p className="text-gray-500">Lock entries to generate structured insights.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="font-bold text-orange-600">4.</span>
            <div>
              <p className="font-semibold text-slate-800">Review patterns</p>
              <p className="text-gray-500">Understand behavior trends over time.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleClose}
          className="w-full py-3.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 hover:scale-[1.01] active:scale-[0.98] transition shadow-lg shadow-orange-500/20"
        >
          Start Writing
        </button>

        {/* TRUST */}
        <p className="text-[10px] text-gray-400 text-center mt-6 uppercase tracking-widest font-bold">
          Secure • Synced • Private
        </p>
      </div>
    </div>
  );
}