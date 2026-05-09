"use client";

import React, { useEffect } from "react";
import {
  Folder,
  FileText,
  UploadCloud,
  History,
  BarChart2,
  X,
  Layout,
  LucideIcon,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

interface WorkspaceGuideProps {
  showWipPopup: boolean;
  setShowWipPopup: (val: boolean) => void;
}

interface FeatureItem {
  Icon: LucideIcon;
  title: string;
  desc: string;
}

export function WipPopup({
  showWipPopup,
  setShowWipPopup,
}: WorkspaceGuideProps) {
  const supabase = getSupabaseClient();

  // ✅ CHECK FROM DATABASE
  useEffect(() => {
    const checkSeenStatus = async () => {
      if (!supabase) return;

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("workspace_guide_seen")
        .eq("id", user.id)
        .single();

      if (data?.workspace_guide_seen) {
        setShowWipPopup(false);
      }
    };

    if (showWipPopup) {
      checkSeenStatus();
    }
  }, [showWipPopup, setShowWipPopup, supabase]);

  // ✅ SAVE FIRST → THEN CLOSE
  const handleClose = async () => {
    if (!supabase) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (user) {
      await supabase
        .from("profiles")
        .update({ workspace_guide_seen: true })
        .eq("id", user.id);
    }

    setShowWipPopup(false);
  };

  const features: FeatureItem[] = [
    {
      Icon: Folder,
      title: "Organized Structure",
      desc: "Create folders and manage everything in one unified system.",
    },
    {
      Icon: FileText,
      title: "Notes & Content",
      desc: "Write, edit, and store notes instantly with real-time cloud sync.",
    },
    {
      Icon: UploadCloud,
      title: "Cloud Storage",
      desc: "Your files and media are securely stored and always accessible.",
    },
    {
      Icon: History,
      title: "Activity Tracking",
      desc: "All changes are tracked and updated across devices instantly.",
    },
    {
      Icon: BarChart2,
      title: "Insights & Analytics",
      desc: "Understand your workflow patterns and improve execution.",
    },
  ];

  if (!showWipPopup) return null;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-white/80 backdrop-blur-sm p-0 md:p-4 transition-opacity animate-in fade-in duration-300"
    >
      {/* CONTAINER */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full md:max-w-lg p-6 md:p-10 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] md:shadow-[0_20px_50px_rgba(0,0,0,0.12)] max-h-[92vh] overflow-y-auto border border-slate-200 animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-300"
      >
        {/* Top Handle (mobile) */}
        <div className="md:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 -mt-2" />

        {/* Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500 rounded-t-[2.5rem]" />

        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-50 p-3 rounded-xl text-orange-600 border border-orange-100">
              <Layout size={22} />
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Your Workspace
              </h2>
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">
                System Intelligence
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* DESCRIPTION */}
        <div className="mb-8">
          <p className="text-gray-600 text-sm leading-relaxed">
            Your workspace is synced, secure, and accessible across all your devices.
          </p>

          <p className="text-xs text-gray-400 mt-3 font-medium">
            Your data follows your account — not your device.
          </p>
        </div>

        {/* FEATURES */}
        <div className="space-y-6 mb-10">
          {features.map((item, idx) => (
            <div key={idx} className="flex gap-4 items-start">
              <div className="bg-white p-2 rounded-lg border border-gray-100 text-orange-500 shadow-sm">
                <item.Icon size={18} />
              </div>

              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleClose}
          className="w-full py-4 bg-orange-500 text-white font-semibold text-sm rounded-2xl hover:bg-orange-600 transition active:scale-[0.98]"
        >
          Enter Workspace
        </button>
      </div>
    </div>
  );
}