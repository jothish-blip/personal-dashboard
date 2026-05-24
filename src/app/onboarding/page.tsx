"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme/ThemeProvider";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, BrainCircuit, Target, CalendarDays, BookOpen } from "lucide-react";

type OnboardingData = {
  full_name: string;
  phone: string;
  age: string;
  bio: string;
  discovery_source: string;
  usage_reason: string[];
  work_style: string;
  planning_style: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<OnboardingData>({
    full_name: "",
    phone: "",
    age: "",
    bio: "",
    discovery_source: "",
    usage_reason: [],
    work_style: "",
    planning_style: "",
  });

  // Fetch initial user data to auto-populate
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      
      setUserId(session.user.id);

      // Cast to any to prevent 'never' TS errors on new DB columns
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile) {
        // If they already completed it, kick them back to home
        if (profile.onboarding_completed) {
          router.replace("/");
          return;
        }

        setFormData(prev => ({
          ...prev,
          full_name: profile.full_name || session.user.user_metadata?.full_name || "",
          phone: profile.phone || "",
          age: profile.age ? String(profile.age) : "",
          bio: profile.bio || "",
          discovery_source: profile.discovery_source || "",
          usage_reason: profile.usage_reason || [],
          work_style: profile.work_style || "",
          planning_style: profile.planning_style || "",
        }));
      }
      setLoading(false);
    };

    fetchUser();
  }, [router]);

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const toggleUsageReason = (reason: string) => {
    setFormData(prev => ({
      ...prev,
      usage_reason: prev.usage_reason.includes(reason)
        ? prev.usage_reason.filter(r => r !== reason)
        : [...prev.usage_reason, reason]
    }));
  };

  const completeOnboarding = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      const updatePayload: any = {
        full_name: formData.full_name,
        phone: formData.phone || null,
        age: formData.age ? parseInt(formData.age) : null,
        bio: formData.bio || null,
        discovery_source: formData.discovery_source || null,
        usage_reason: formData.usage_reason,
        work_style: formData.work_style || null,
        planning_style: formData.planning_style || null,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from("profiles")
        .update(updatePayload)
        .eq("id", userId);

      if (error) throw error;
      
      // Force reload the session flag and route to home
      sessionStorage.removeItem("nextask_session_loaded");
      router.replace("/");
      
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#050505]" : "bg-[#FAFAFA]"}`}>
        <Loader2 className={`w-6 h-6 animate-spin ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
      </div>
    );
  }

  // --- SUBCOMPONENTS FOR STEPS ---

  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-10">
      {[1, 2, 3, 4].map(i => (
        <React.Fragment key={i}>
          <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
            step >= i 
              ? "bg-orange-500" 
              : isDarkMode ? "bg-white/[0.06]" : "bg-black/[0.06]"
          }`} />
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-500 ${
      isDarkMode ? "bg-[#050505] text-white" : "bg-[#FAFAFA] text-[#111827]"
    }`}>
      
      <div className="w-full max-w-[560px] animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
        <StepIndicator />

        {/* STEP 1: IDENTITY */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Personalize your space</h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Let's set up your system with your identity.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className={`w-full h-[52px] px-4 rounded-2xl text-sm font-medium outline-none transition-all border ${
                    isDarkMode 
                      ? "bg-[#111111] border-white/[0.06] text-white focus:border-orange-500" 
                      : "bg-white border-black/[0.08] text-gray-900 focus:border-black"
                  }`}
                  placeholder="Your name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Phone (Optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full h-[52px] px-4 rounded-2xl text-sm font-medium outline-none transition-all border ${
                      isDarkMode 
                        ? "bg-[#111111] border-white/[0.06] text-white focus:border-orange-500" 
                        : "bg-white border-black/[0.08] text-gray-900 focus:border-black"
                    }`}
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    className={`w-full h-[52px] px-4 rounded-2xl text-sm font-medium outline-none transition-all border ${
                      isDarkMode 
                        ? "bg-[#111111] border-white/[0.06] text-white focus:border-orange-500" 
                        : "bg-white border-black/[0.08] text-gray-900 focus:border-black"
                    }`}
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Short Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  className={`w-full h-[100px] p-4 rounded-2xl text-sm font-medium outline-none transition-all border resize-none ${
                    isDarkMode 
                      ? "bg-[#111111] border-white/[0.06] text-white focus:border-orange-500" 
                      : "bg-white border-black/[0.08] text-gray-900 focus:border-black"
                  }`}
                  placeholder="What are you currently building or studying?"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DISCOVERY */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Intentions</h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                What brings you to Nextask?
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>How did you find us?</label>
                <div className="flex flex-wrap gap-2">
                  {["Google", "Friend", "Instagram", "YouTube", "GitHub", "Discord", "Other"].map(source => (
                    <button
                      key={source}
                      onClick={() => setFormData({ ...formData, discovery_source: source })}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                        formData.discovery_source === source
                          ? "bg-orange-500 text-white border-orange-500"
                          : isDarkMode 
                            ? "bg-[#111111] border-white/[0.06] text-gray-400 hover:text-white" 
                            : "bg-white border-black/[0.08] text-gray-600 hover:text-black"
                      }`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Why are you here? (Select multiple)</label>
                <div className="flex flex-wrap gap-2">
                  {["Focus", "Study", "Consistency", "Deep Work", "Task Management", "Planning", "Life Organization", "Career"].map(reason => {
                    const isSelected = formData.usage_reason.includes(reason);
                    return (
                      <button
                        key={reason}
                        onClick={() => toggleUsageReason(reason)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border flex items-center gap-2 ${
                          isSelected
                            ? isDarkMode ? "bg-orange-500/10 border-orange-500/50 text-orange-500" : "bg-orange-50 border-orange-200 text-orange-600"
                            : isDarkMode ? "bg-[#111111] border-white/[0.06] text-gray-400 hover:text-white" : "bg-white border-black/[0.08] text-gray-600 hover:text-black"
                        }`}
                      >
                        {isSelected && <CheckCircle2 size={14} />}
                        {reason}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: WORK STYLE */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Work Style</h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Help us understand how you execute.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>How do you usually work?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["I need structure", "I struggle with consistency", "I already have systems", "Still figuring things out"].map(style => (
                    <button
                      key={style}
                      onClick={() => setFormData({ ...formData, work_style: style })}
                      className={`p-4 rounded-2xl text-sm font-semibold text-left transition-all border ${
                        formData.work_style === style
                          ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
                          : isDarkMode 
                            ? "bg-[#111111] border-white/[0.06] text-gray-400 hover:text-white" 
                            : "bg-white border-black/[0.08] text-gray-600 hover:text-black"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>How do you currently plan?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["No planning", "Mental planning", "Calendar", "Todo app", "Structured system"].map(style => (
                    <button
                      key={style}
                      onClick={() => setFormData({ ...formData, planning_style: style })}
                      className={`p-4 rounded-2xl text-sm font-semibold text-left transition-all border ${
                        formData.planning_style === style
                          ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
                          : isDarkMode 
                            ? "bg-[#111111] border-white/[0.06] text-gray-400 hover:text-white" 
                            : "bg-white border-black/[0.08] text-gray-600 hover:text-black"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: NEXTASK INTRO */}
        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#111111] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <img src="/favicon.ico" alt="NexTask" className="w-8 h-8 object-contain" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Your system is ready.</h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Four modules built for uncompromised execution.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#111111] border-white/[0.06]" : "bg-white border-black/[0.08]"}`}>
                <Target className="w-5 h-5 text-orange-500 mb-3" />
                <h3 className="font-bold text-sm mb-1">Tasks</h3>
                <p className={`text-xs font-medium ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>Meaningful execution.</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#111111] border-white/[0.06]" : "bg-white border-black/[0.08]"}`}>
                <BrainCircuit className="w-5 h-5 text-emerald-500 mb-3" />
                <h3 className="font-bold text-sm mb-1">Focus</h3>
                <p className={`text-xs font-medium ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>Deep sessions.</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#111111] border-white/[0.06]" : "bg-white border-black/[0.08]"}`}>
                <CalendarDays className="w-5 h-5 text-blue-500 mb-3" />
                <h3 className="font-bold text-sm mb-1">Planner</h3>
                <p className={`text-xs font-medium ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>Deadlines & planning.</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#111111] border-white/[0.06]" : "bg-white border-black/[0.08]"}`}>
                <BookOpen className="w-5 h-5 text-purple-500 mb-3" />
                <h3 className="font-bold text-sm mb-1">Diary</h3>
                <p className={`text-xs font-medium ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>Reflection & growth.</p>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM NAVIGATION */}
        <div className="mt-12 flex items-center justify-between pt-6 border-t border-white/[0.06]">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={saving}
              className={`flex items-center gap-2 font-semibold text-sm transition-colors ${
                isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"
              }`}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div /> // Empty div to keep 'Next' button on the right
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className={`flex items-center gap-2 h-12 px-6 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                isDarkMode 
                  ? "bg-white text-black hover:bg-gray-200" 
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={completeOnboarding}
              disabled={saving}
              className={`flex items-center justify-center gap-2 h-12 px-8 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                saving 
                  ? "bg-orange-500/70 text-white cursor-not-allowed" 
                  : "bg-orange-500 text-white hover:bg-orange-600 shadow-[0_4px_20px_rgba(249,115,22,0.25)]"
              }`}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enter Workspace"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}