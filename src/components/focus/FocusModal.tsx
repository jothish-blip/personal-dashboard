"use client";

import React, { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export default function FocusModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [canAgree, setCanAgree] = useState(false);

  const supabase = getSupabaseClient();

  // ✅ CHECK FROM DATABASE (ONCE PER USER)
  useEffect(() => {
    const checkSeen = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("focus_guide_seen")
        .eq("id", user.id)
        .single();

      if (!data?.focus_guide_seen) {
        setIsOpen(true);

        // prevent scroll
        document.body.style.overflow = "hidden";

        // intentional delay
        const timer = setTimeout(() => {
          setCanAgree(true);
        }, 2500);

        return () => clearTimeout(timer);
      }
    };

    checkSeen();
  }, []);

  // ✅ SAVE TO DATABASE
  const handleAgree = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (user) {
      await supabase
        .from("profiles")
        .update({ focus_guide_seen: true })
        .eq("id", user.id);
    }

    setIsOpen(false);
    document.body.style.overflow = "auto";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 transition-all">

      {/* CONTAINER */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-7 animate-in fade-in zoom-in-95 duration-300">

        {/* HEADER */}
        <div className="text-center space-y-3">
          <div className="text-5xl">🧠</div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Focus Engine
          </h2>

          <p className="text-sm text-slate-500 max-w-[280px] mx-auto">
            Execute with clarity. Track discipline. Build attention control.
          </p>
        </div>

        {/* SYSTEM MESSAGE */}
        <div className="text-center text-xs text-slate-400">
          Your focus sessions are tracked and synced across your system.
        </div>

        {/* RULES */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-sm text-slate-700 space-y-4">

          <p className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">
            Rules of Execution
          </p>

          <ul className="space-y-3.5">

            <li className="flex gap-3">
              <span>🎯</span>
              <span><b>Declare Intent:</b> Define one clear target.</span>
            </li>

            <li className="flex gap-3">
              <span>🔒</span>
              <span><b>Lock In:</b> No switching during session.</span>
            </li>

            <li className="flex gap-3">
              <span>⚠️</span>
              <span><b>Log Breaks:</b> Track distractions honestly.</span>
            </li>

            <li className="flex gap-3">
              <span>📊</span>
              <span><b>Review:</b> Analyze patterns after completion.</span>
            </li>

          </ul>
        </div>

        {/* FOOTER */}
        <div className="space-y-3 pt-2">

          <div className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-400 h-4">
            {!canAgree ? "Initializing focus environment..." : "System Ready"}
          </div>

          <button
            onClick={handleAgree}
            disabled={!canAgree}
            className={`w-full py-4 text-sm font-semibold rounded-xl transition-all flex justify-center items-center gap-2
              ${
                canAgree
                  ? "bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98]"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              }
            `}
          >
            {canAgree ? (
              "Enter Focus Mode"
            ) : (
              <>
                <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></span>
                Please wait...
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}