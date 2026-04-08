"use client";

import React, { useEffect } from "react";
import {
  X,
  PlusCircle,
  CheckCircle2,
  RotateCcw,
  TrendingUp,
  Activity,
  BookOpen,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProgressModal({
  isOpen,
  onClose,
}: ProgressModalProps) {
  const supabase = getSupabaseClient();

  // ✅ CHECK FROM DATABASE (ONCE PER USER)
  useEffect(() => {
    const checkSeen = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("progress_guide_seen")
        .eq("id", user.id)
        .single();

      if (data?.progress_guide_seen) {
        onClose();
      }
    };

    if (isOpen) checkSeen();
  }, [isOpen]);

  // ✅ SAVE TO DATABASE
  const handleClose = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (user) {
      await supabase
        .from("profiles")
        .update({ progress_guide_seen: true })
        .eq("id", user.id);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[500] flex items-end md:items-center justify-center p-0 md:p-6"
    >
      {/* CONTAINER */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full md:max-w-lg rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-8 md:zoom-in-95"
      >
        {/* TOP ACCENT */}
        <div className="w-full h-1.5 bg-orange-500 rounded-t-[2rem] md:rounded-t-[2.5rem]" />

        <div className="p-6 md:p-8 space-y-6">

          {/* HEADER */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 rounded-xl">
                <BookOpen className="text-orange-600" size={22} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                  Your Task System
                </h2>
                <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-1">
                  Execution Guide
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* SYSTEM MESSAGE */}
          <p className="text-sm text-slate-500 leading-relaxed">
            Your tasks are synced, tracked, and optimized across your system.
          </p>

          <p className="text-xs text-slate-400">
            Your data follows your account — not your device.
          </p>

          {/* CONTENT */}
          <div className="space-y-5 text-sm text-slate-600">

            <div className="flex gap-3">
              <PlusCircle className="text-orange-500 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-slate-900">Add Tasks</p>
                <p>Plan your day with clear and structured objectives.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="text-emerald-500 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-slate-900">Execute</p>
                <p>Mark tasks complete and build daily momentum.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <RotateCcw className="text-red-400 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-slate-900">Recover Missed Work</p>
                <p>The system helps you reschedule without losing track.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <TrendingUp className="text-blue-500 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-slate-900">Track Progress</p>
                <p>Measure consistency and improve execution over time.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Activity className="text-purple-500 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-slate-900">Activity History</p>
                <p>Every action is logged and synced across devices.</p>
              </div>
            </div>

          </div>

          {/* FOOTER */}
          <div className="pt-6 border-t border-slate-100 space-y-4">

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <p className="text-xs text-slate-600 font-medium">
                Start simple. Stay consistent.
                <br />
                <span className="font-bold text-slate-900">
                  Execution builds everything.
                </span>
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-4 bg-orange-500 text-white rounded-2xl font-semibold shadow-md hover:bg-orange-600 transition active:scale-[0.98]"
            >
              Start Execution
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}