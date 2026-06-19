"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  X, 
  Target, 
  BrainCircuit, 
  CalendarDays, 
  BookOpen, 
  LayoutPanelLeft, 
  Sparkles, 
  ArrowRight 
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [ninetyDayGoal, setNinetyDayGoal] = useState("");

  // ─── FETCH USER & VERIFY STATUS ───
  useEffect(() => {
    setMounted(true);

    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      
      setUserId(session.user.id);

      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("onboarding_completed, welcome_modal_seen")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile && (profile.onboarding_completed || profile.welcome_modal_seen)) {
        router.replace("/");
        return;
      }

      setLoading(false);
      setShowModal(true);
    };

    fetchUser();
  }, [router]);

  // ─── SCROLL LOCK & ESCAPE KEY (HEADER MODAL PATTERN) ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        handleSkip();
      }
    };

    if (showModal) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      document.documentElement.style.overflow = "hidden";
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.documentElement.style.overflow = "";
    }
    
    return () => { 
      document.body.style.overflow = ""; 
      document.body.style.touchAction = "";
      document.documentElement.style.overflow = "";
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal]);

  // ─── ACTIONS ───
  const completeOnboarding = async (goal: string) => {
    if (!userId) return;
    
    try {
      const updatePayload: any = {
        onboarding_completed: true,
        welcome_modal_seen: true,
        onboarding_completed_at: new Date().toISOString(),
      };

      if (goal.trim()) {
        updatePayload.ninety_day_goal = goal.trim();
      }

      await (supabase as any)
        .from("profiles")
        .update(updatePayload)
        .eq("id", userId);
        
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const handleContinue = async () => {
    setSaving(true);
    await completeOnboarding(ninetyDayGoal);
    setShowModal(false);
    router.replace("/");
  };

  const handleSkip = () => {
    // Optimistic close and route, complete in background
    completeOnboarding("");
    setShowModal(false);
    router.replace("/");
  };

  if (loading || !mounted) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[var(--background)]" : "bg-[#FAFAFA]"}`}>
        <Loader2 className={`w-6 h-6 animate-spin ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
      </div>
    );
  }

  const modalSurfaceClass = isDarkMode 
    ? "bg-[#0A0A0A] border border-white/[0.08] shadow-2xl" 
    : "bg-white border border-black/[0.05] shadow-xl";

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, y: 10 }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? "bg-[var(--background)] text-white" : "bg-[#FAFAFA] text-[#111827]"}`}>
      
      {createPortal(
        <AnimatePresence>
          {showModal && (
            <motion.div 
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              onClick={handleSkip}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className={`rounded-3xl p-6 sm:p-8 max-w-[720px] w-full max-h-[90vh] overflow-y-auto ${modalSurfaceClass}`}
              >
                {/* Header Section */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                      isDarkMode ? "bg-[#111111] border-white/10" : "bg-zinc-50 border-zinc-200"
                    }`}>
                      <img src="/favicon.ico" alt="NexSpace" className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                      <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                        Welcome to NexSpace
                      </h1>
                      <p className={`text-sm mt-1 font-medium ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                        Your personal operating system for intentional consistency.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleSkip} 
                    className={`p-2 rounded-xl transition-colors ${
                      isDarkMode ? "text-zinc-400 hover:text-white hover:bg-white/10" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* 90-Day Goal Input */}
                <div className="mb-8">
                  <label className={`block text-xs font-bold uppercase tracking-widest mb-3 ${isDarkMode ? "text-zinc-500" : "text-zinc-400"}`}>
                    What are you trying to achieve in the next 90 days?
                  </label>
                  <textarea
                    value={ninetyDayGoal}
                    onChange={e => setNinetyDayGoal(e.target.value)}
                    className={`w-full h-[80px] p-4 rounded-2xl text-sm font-medium outline-none transition-all border resize-none ${
                      isDarkMode 
                        ? "bg-[#111111] border-white/[0.06] text-white focus:border-orange-500" 
                        : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-orange-500"
                    }`}
                    placeholder="E.g., Launch my startup, get certified, build a consistent workout habit..."
                  />
                </div>

                {/* Ecosystem Cards */}
                <div className="mb-8">
                  <label className={`block text-xs font-bold uppercase tracking-widest mb-3 ${isDarkMode ? "text-zinc-500" : "text-zinc-400"}`}>
                    The Ecosystem
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    
                    <div className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#111111] border-white/[0.06]" : "bg-white border-zinc-200"}`}>
                      <Target className="w-5 h-5 text-orange-500 mb-3" />
                      <h3 className={`font-bold text-sm mb-1 ${isDarkMode ? "text-zinc-100" : "text-zinc-900"}`}>Tasks</h3>
                      <p className={`text-xs font-medium ${isDarkMode ? "text-zinc-500" : "text-zinc-500"}`}>Execute meaningful work.</p>
                    </div>
                    
                    <div className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#111111] border-white/[0.06]" : "bg-white border-zinc-200"}`}>
                      <BrainCircuit className="w-5 h-5 text-emerald-500 mb-3" />
                      <h3 className={`font-bold text-sm mb-1 ${isDarkMode ? "text-zinc-100" : "text-zinc-900"}`}>Focus</h3>
                      <p className={`text-xs font-medium ${isDarkMode ? "text-zinc-500" : "text-zinc-500"}`}>Deep work sessions.</p>
                    </div>
                    
                    <div className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#111111] border-white/[0.06]" : "bg-white border-zinc-200"}`}>
                      <CalendarDays className="w-5 h-5 text-blue-500 mb-3" />
                      <h3 className={`font-bold text-sm mb-1 ${isDarkMode ? "text-zinc-100" : "text-zinc-900"}`}>Planner</h3>
                      <p className={`text-xs font-medium ${isDarkMode ? "text-zinc-500" : "text-zinc-500"}`}>Time and deadlines.</p>
                    </div>
                    
                    <div className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#111111] border-white/[0.06]" : "bg-white border-zinc-200"}`}>
                      <BookOpen className="w-5 h-5 text-purple-500 mb-3" />
                      <h3 className={`font-bold text-sm mb-1 ${isDarkMode ? "text-zinc-100" : "text-zinc-900"}`}>Diary</h3>
                      <p className={`text-xs font-medium ${isDarkMode ? "text-zinc-500" : "text-zinc-500"}`}>Reflection and growth.</p>
                    </div>

                    <div className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#111111] border-white/[0.06]" : "bg-white border-zinc-200"}`}>
                      <LayoutPanelLeft className="w-5 h-5 text-indigo-500 mb-3" />
                      <h3 className={`font-bold text-sm mb-1 ${isDarkMode ? "text-zinc-100" : "text-zinc-900"}`}>Workspace</h3>
                      <p className={`text-xs font-medium ${isDarkMode ? "text-zinc-500" : "text-zinc-500"}`}>Your command center.</p>
                    </div>

                    <div className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#111111] border-white/[0.06]" : "bg-white border-zinc-200"}`}>
                      <Sparkles className="w-5 h-5 text-amber-400 mb-3" />
                      <h3 className={`font-bold text-sm mb-1 ${isDarkMode ? "text-zinc-100" : "text-zinc-900"}`}>NexUP</h3>
                      <p className={`text-xs font-medium ${isDarkMode ? "text-zinc-500" : "text-zinc-500"}`}>Future ecosystem.</p>
                    </div>

                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-white/[0.06]">
                  <button
                    onClick={handleSkip}
                    disabled={saving}
                    className={`font-semibold text-sm transition-colors ${
                      isDarkMode ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    Skip for now
                  </button>
                  
                  <button
                    onClick={handleContinue}
                    disabled={saving}
                    className={`flex items-center justify-center gap-2 h-12 px-8 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                      saving 
                        ? "bg-orange-500/70 text-white cursor-not-allowed" 
                        : "bg-orange-500 text-white hover:bg-orange-600 shadow-[0_4px_20px_rgba(249,115,22,0.25)]"
                    }`}
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        Continue <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}