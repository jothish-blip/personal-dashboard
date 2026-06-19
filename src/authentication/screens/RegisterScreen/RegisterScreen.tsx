"use client";

import { useState, useEffect, Suspense, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FaGithub, FaDiscord } from "react-icons/fa";
import Image from "next/image";
import { 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  ArrowUp
} from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

// ============================================================================
// ICONS & ASSETS
// ============================================================================

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="drop-shadow-sm transition-all duration-300">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.85-6.85C35.91 2.14 30.4 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.36 13.4 17.72 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v9h12.4c-.54 2.9-2.2 5.36-4.7 7.02l7.26 5.64C43.96 37.36 46.1 31.4 46.1 24.5z"/>
    <path fill="#FBBC05" d="M10.54 28.42A14.5 14.5 0 019.5 24c0-1.53.26-3 .72-4.38l-7.98-6.2A23.96 23.96 0 000 24c0 3.87.92 7.53 2.56 10.78l7.98-6.36z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.91-2.14 15.88-5.8l-7.26-5.64c-2.02 1.36-4.6 2.18-8.62 2.18-6.28 0-11.64-3.9-13.46-9.92l-7.98 6.36C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

// ============================================================================
// UTILS & HOOKS
// ============================================================================

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function Reveal({ children, delay = 0, direction = "up" }: { children: ReactNode, delay?: number, direction?: "up" | "fade" }) {
  const { ref, isVisible } = useScrollReveal();
  const baseClass = "transition-all duration-700 ease-out will-change-[opacity,transform]";
  const hiddenClass = direction === "up" ? "opacity-0 translate-y-6" : "opacity-0 scale-[0.98]";
  const visibleClass = direction === "up" ? "opacity-100 translate-y-0" : "opacity-100 scale-100";

  return (
    <div ref={ref} className={`${baseClass} ${isVisible ? visibleClass : hiddenClass}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// Fallback for missing screenshots during dev
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, isDarkMode: boolean, name: string) => {
  e.currentTarget.style.display = 'none';
  e.currentTarget.parentElement!.innerHTML = `<div class="absolute inset-0 flex items-center justify-center text-[12px] font-medium tracking-widest uppercase text-center p-4 ${isDarkMode ? 'text-zinc-600 bg-zinc-900/50' : 'text-zinc-400 bg-zinc-100/50'}">[ Screenshot: ${name} ]</div>`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function LandingExperience() {
  const router = useRouter();
  const { isDarkMode } = useTheme(); 
  
  const [checkingSession, setCheckingSession] = useState(true);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [oauthStarted, setOauthStarted] = useState(false);
  const [error, setError] = useState("");

  // 1. Initial Session Check
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        router.replace("/");
        return;
      } else {
        setCheckingSession(false);
      }
    };
    checkUser();
  }, [router]);

  // 2. Realtime Auth State Change Detection
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        router.replace("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // 3. Page Visibility Detection
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== "visible") return;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        router.replace("/");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [router]);

  // Handle Social Login Execution
  const handleSocialLogin = async (provider: string) => {
    if (oauthStarted || loadingProvider) return; 

    setOauthStarted(true);
    setLoadingProvider(provider);
    setError("");

    // OAuth Timeout Fallback
    const timeout = setTimeout(() => {
      setLoadingProvider(null);
      setOauthStarted(false);
      setError("Connection timed out. Please try again.");
    }, 15000);
    
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({ 
        provider: provider as any, 
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (authError) throw authError;
    } catch (err: any) {
      clearTimeout(timeout);
      setError(err.message?.toLowerCase().includes("popup_closed") ? "Registration cancelled." : "Connection failed. Please try again.");
      setOauthStarted(false);
      setLoadingProvider(null);
    }
  };

  const scrollToHeroAuth = () => {
    document.getElementById("hero-auth")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (checkingSession) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-300 select-none ${isDarkMode ? "bg-[#000000] text-white" : "bg-[#FAFAFA] text-zinc-900"}`}>
        <div className={`w-12 h-12 border rounded-xl flex items-center justify-center mb-6 shadow-sm animate-pulse ${isDarkMode ? "bg-white/[0.02] border-white/[0.05]" : "bg-white border-zinc-200"}`}>
          <img src="/favicon.ico" alt="NexSpace" className="w-6 h-6 object-contain" />
        </div>
      </div>
    );
  }

  // Premium Glass Classes
  const premiumGlass = isDarkMode 
    ? "bg-white/[0.03] backdrop-blur-[30px] border-white/[0.08] shadow-[0_10px_80px_rgba(0,0,0,0.45)]"
    : "bg-white/70 backdrop-blur-[30px] border-zinc-200/50 shadow-[0_10px_50px_rgba(0,0,0,0.05)]";

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-500 selection:bg-orange-500/20 ${
      isDarkMode ? "bg-[#000000] text-zinc-200" : "bg-[#FAFAFA] text-zinc-800"
    }`}>
      
      {/* Subtle Grain */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ 
        opacity: isDarkMode ? 0.04 : 0.02,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' 
      }} />

      <style dangerouslySetInnerHTML={{__html: `
        html { scroll-behavior: smooth; }
        @keyframes float1 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-8px) rotate(-1deg); } }
        @keyframes float2 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-12px) rotate(1deg); } }
        @keyframes float3 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        @keyframes ambientOrange { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, -30px) scale(1.05); } }
      `}} />

      {/* Ambient Orange Glow */}
      <div className={`absolute top-0 left-1/4 w-[40vw] h-[40vw] max-w-[600px] rounded-full blur-[140px] pointer-events-none transition-colors duration-1000 ${isDarkMode ? "bg-orange-600/10" : "bg-orange-400/10"}`} style={{ animation: 'ambientOrange 20s infinite ease-in-out' }} />

      {/* Loading Overlay */}
      {loadingProvider && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in p-4">
          <div className={`px-6 py-3.5 rounded-full flex items-center gap-3 shadow-2xl border max-w-[90vw] overflow-hidden ${isDarkMode ? "bg-[#0A0A0A] border-white/10 text-zinc-200" : "bg-white border-zinc-200 text-zinc-800"}`}>
            <Loader2 className={`w-4 h-4 animate-spin shrink-0 ${isDarkMode ? "text-orange-500" : "text-orange-500"}`} />
            <span className="font-medium text-[13px] truncate">Connecting to {loadingProvider === 'google' ? 'Google' : loadingProvider === 'github' ? 'GitHub' : 'Discord'}...</span>
          </div>
        </div>
      )}

{/* ========================================================= */}
{/* 1. ULTRA PREMIUM TOP NAV */}
{/* ========================================================= */}
<nav className="fixed top-2 sm:top-3 lg:top-4 left-0 right-0 z-50 px-2 sm:px-4 md:px-6 lg:px-8">
  <div
    className={`w-full max-w-[1800px] mx-auto transition-all duration-500 rounded-[22px] sm:rounded-[28px] border backdrop-blur-2xl ${
      isDarkMode
        ? "bg-black/35 border-white/[0.08] shadow-[0_10px_60px_rgba(0,0,0,0.45)]"
        : "bg-white/70 border-zinc-200/70 shadow-[0_10px_40px_rgba(0,0,0,0.06)]"
    }`}
  >
    <div className="relative h-[64px] sm:h-[70px] lg:h-[74px] 2xl:h-[82px] px-3 sm:px-5 md:px-6 lg:px-7 xl:px-8 flex items-center justify-between">

<div
  onClick={() => router.push("/")}
  className="flex items-center cursor-pointer select-none shrink-0"
>
  <Image
    src={isDarkMode ? "/logo-dark.png" : "/logo-light.png"}
    alt="NexSpace"
    width={160}
    height={40}
    priority
    className={`
      w-auto
      object-contain
      object-left
      transition-all
      duration-300
      hover:scale-105
      h-[32px]
      sm:h-[40px]
      lg:h-[48px]
      ${isDarkMode ? "translate-y-0.5" : ""}
    `}
  />
</div>

      {/* Center: subtle trust indicator */}
      <div
        className={`hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-2 lg:gap-3 text-[11px] lg:text-[12px] font-medium whitespace-nowrap ${
          isDarkMode ? "text-zinc-500" : "text-zinc-500"
        }`}
      >
        <span>Tasks</span>
        <span className="w-1 h-1 rounded-full bg-orange-500/50" />

        <span>Focus</span>
        <span className="w-1 h-1 rounded-full bg-orange-500/50" />

        <span>Planner</span>
        <span className="w-1 h-1 rounded-full bg-orange-500/50" />

        <span>Reflection</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">

        {/* Sign In */}
        <button
          onClick={() => router.push("/login")}
          className={`flex h-10 sm:h-11 lg:h-12 px-3 sm:px-4 lg:px-5 rounded-[18px] sm:rounded-2xl items-center justify-center text-[12px] sm:text-[13px] font-semibold transition-all duration-300 active:scale-95 whitespace-nowrap shrink-0 ${
            isDarkMode
              ? "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
          }`}
        >
          <span className="sm:hidden">Login</span>
          <span className="hidden sm:block">
            Sign in
          </span>
        </button>

        {/* Primary CTA */}
        <button
          onClick={scrollToHeroAuth}
          className="group relative overflow-hidden h-10 sm:h-11 lg:h-12 px-4 sm:px-5 lg:px-6 rounded-[18px] sm:rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-[12px] sm:text-[13px] lg:text-[14px] font-semibold transition-all duration-300 active:scale-95 shadow-[0_8px_30px_rgba(249,115,22,0.28)] whitespace-nowrap shrink-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />

          <div className="relative flex items-center gap-1.5 sm:gap-2">
            <span className="hidden min-[420px]:block">
              Start Free
            </span>

            <span className="block min-[420px]:hidden">
              Start
            </span>

            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </div>
        </button>
      </div>
    </div>
  </div>
</nav>

<main className="relative z-10 pt-[100px] sm:pt-[120px] lg:pt-[140px]">

{/* ========================================================= */}
{/* 2. HERO SECTION */}
{/* ========================================================= */}
<section className="min-h-[100vh] lg:min-h-[90vh] flex flex-col lg:flex-row items-center justify-between px-6 lg:px-12 max-w-[1450px] mx-auto gap-16 lg:gap-20 pt-10 lg:pt-0 pb-20 lg:pb-0">

  {/* ========================================================= */}
  {/* LEFT SIDE */}
  {/* ========================================================= */}
  <div className="w-full lg:w-[42%] flex flex-col items-start z-20 pt-10 lg:pt-0 animate-in fade-in slide-in-from-bottom-8 duration-1000">

    {/* Badge */}
    <div
      className={`mb-7 px-4 py-2 rounded-full border backdrop-blur-xl text-[12px] font-semibold tracking-wide ${
        isDarkMode
          ? "bg-white/[0.03] border-white/[0.06] text-zinc-400"
          : "bg-white/80 border-zinc-200 text-zinc-600"
      }`}
    >
      Built for consistency & deep work
    </div>

    {/* Heading */}
    <h1
      className={`text-[42px] sm:text-[56px] lg:text-[74px] font-semibold tracking-[-0.05em] leading-[0.98] mb-7 ${
        isDarkMode ? "text-white" : "text-zinc-900"
      }`}
    >
      Build consistency.
      <br />
      <span
        className={
          isDarkMode ? "text-zinc-500" : "text-zinc-400"
        }
      >
        Not just tasks.
      </span>
    </h1>

    {/* Description */}
    <p
      className={`text-[16px] sm:text-[18px] lg:text-[19px] leading-[1.8] mb-10 max-w-[520px] font-medium ${
        isDarkMode ? "text-zinc-400" : "text-zinc-600"
      }`}
    >
      The operating system for focus, planning,
      execution, reflection and consistency.
      Everything connected in one place.
    </p>

    {/* ========================================================= */}
    {/* AUTH BLOCK */}
    {/* ========================================================= */}
    <div id="hero-auth" className="w-full max-w-[520px]">

     <div
  className={`p-2.5 rounded-[30px] border mb-4 overflow-hidden ${premiumGlass}`}
>
  {/* Fixed responsive layout */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

    {/* ========================================================= */}
    {/* Google */}
    {/* ========================================================= */}
    <button
      onClick={() => handleSocialLogin("google")}
      disabled={!!loadingProvider || oauthStarted}
      className={`group relative overflow-hidden flex items-center justify-center gap-2 h-[58px] sm:h-[56px] rounded-[20px] text-[14px] font-semibold transition-all duration-300 active:scale-[0.98] border ${
        isDarkMode
          ? "bg-white/[0.04] border-white/[0.03] hover:bg-white/[0.08] text-white"
          : "bg-white border-zinc-200/80 hover:bg-zinc-50 text-zinc-800 shadow-sm"
      }`}
    >

      {/* Hover layer */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-white/[0.03] to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-2">
        <GoogleIcon />
        <span>Google</span>
      </div>
    </button>

    {/* ========================================================= */}
    {/* GitHub */}
    {/* ========================================================= */}
    <button
      onClick={() => handleSocialLogin("github")}
      disabled={!!loadingProvider || oauthStarted}
      className={`group relative overflow-hidden flex items-center justify-center gap-2 h-[58px] sm:h-[56px] rounded-[20px] text-[14px] font-semibold transition-all duration-300 active:scale-[0.98] border ${
        isDarkMode
          ? "bg-white/[0.04] border-white/[0.03] hover:bg-white/[0.08] text-white"
          : "bg-white border-zinc-200/80 hover:bg-zinc-50 text-zinc-800 shadow-sm"
      }`}
    >

      {/* Hover layer */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-white/[0.03] to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-2">
        <FaGithub size={18} />
        <span>GitHub</span>
      </div>
    </button>

    {/* ========================================================= */}
    {/* Discord */}
    {/* ========================================================= */}
    <button
      onClick={() => handleSocialLogin("discord")}
      disabled={!!loadingProvider || oauthStarted}
      className={`group relative overflow-hidden flex items-center justify-center gap-2 h-[58px] sm:h-[56px] rounded-[20px] text-[14px] font-semibold transition-all duration-300 active:scale-[0.98] border ${
        isDarkMode
          ? "bg-white/[0.04] border-white/[0.03] hover:bg-[#5865F2]/10 hover:text-[#7289DA] text-white"
          : "bg-white border-zinc-200/80 hover:bg-[#5865F2]/5 hover:text-[#5865F2] text-zinc-800 shadow-sm"
      }`}
    >

      {/* Discord glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#5865F2]/10 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-2">
        <FaDiscord size={18} />
        <span>Discord</span>
      </div>
    </button>
  </div>
</div>
      {/* Trust */}
      <div
        className={`flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-[12px] font-medium tracking-wide ${
          isDarkMode
            ? "text-zinc-500"
            : "text-zinc-500"
        }`}
      >
        <span>No setup</span>
        <span className="w-1 h-1 rounded-full bg-orange-500 opacity-60" />
        <span>Private</span>
        <span className="w-1 h-1 rounded-full bg-orange-500 opacity-60" />
        <span>Free</span>
        <span className="w-1 h-1 rounded-full bg-orange-500 opacity-60" />
        <span>Cross-platform</span>
      </div>

      {error && (
        <div className="mt-3 text-[13px] text-red-500 font-medium">
          {error}
        </div>
      )}
    </div>

    {/* Audience */}
    <div
      className={`mt-10 sm:mt-14 text-[12px] sm:text-[13px] font-medium ${
        isDarkMode
          ? "text-zinc-600"
          : "text-zinc-400"
      }`}
    >
      <div className="flex flex-wrap gap-3 sm:gap-6">
        <span>Students</span>
        <span className="opacity-30">•</span>
        <span>Creators</span>
        <span className="opacity-30">•</span>
        <span>Founders</span>
        <span className="opacity-30">•</span>
        <span>Deep workers</span>
      </div>
    </div>
  </div>

  {/* ========================================================= */}
  {/* Section -2: RIGHT SIDE - PREMIUM PRODUCT STACK */}
  {/* ========================================================= */}
  <div className="w-full lg:w-[58%] relative flex items-center justify-center animate-in fade-in zoom-in-[0.98] duration-1000 delay-200">

    {/* ================= MOBILE ================= */}
    <div className="lg:hidden w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-6 px-6">
      <div className="flex gap-5 w-max">

        {[
          "/images/module-tasks.png",
          "/images/module-focus.png",
          "/images/module-planner.png",
          "/images/module-diary.png",
          "/images/module-workspace.png",
        ].map((image, index) => (
          <div
            key={index}
            className={`snap-center shrink-0 w-[85vw] sm:w-[60vw] rounded-[32px] overflow-hidden border ${premiumGlass}`}
          >
            <div className="relative aspect-[16/10]">
              <img
                src={image}
                alt="module"
                className="w-full h-full object-cover"
                onError={(e) => handleImageError(e, isDarkMode, `Module ${index + 1}`)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* ================= DESKTOP ================= */}
    <div className="hidden lg:flex relative w-full h-[700px] max-w-[850px]">

      {/* Ambient Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[520px] h-[520px] rounded-full bg-orange-500/10 blur-[140px]" />
      </div>

      {/* Planner */}
      <div
        className={`absolute top-[2%] right-[5%] w-[56%] rounded-[28px] overflow-hidden border transition-all duration-700 hover:scale-[1.04] hover:-translate-y-3 hover:z-50 ${premiumGlass}`}
        style={{
          animation:
            "float1 14s ease-in-out infinite",
        }}
      >
        <img
          src="/images/module-planner.png"
          alt="Planner Module"
          className="w-full h-full object-cover aspect-[16/10]"
          onError={(e) => handleImageError(e, isDarkMode, "Planner")}
        />
      </div>

      {/* Diary */}
      <div
        className={`absolute top-[18%] left-[0%] w-[42%] rounded-[28px] overflow-hidden border transition-all duration-700 hover:scale-[1.05] hover:-translate-y-3 hover:z-50 ${premiumGlass}`}
        style={{
          animation:
            "float2 17s ease-in-out infinite",
        }}
      >
        <img
          src="/images/module-diary.png"
          alt="Diary Module"
          className="w-full h-full object-cover aspect-[16/10]"
          onError={(e) => handleImageError(e, isDarkMode, "Diary")}
        />
      </div>

      {/* Main Dashboard */}
      <div
        className={`absolute bottom-[6%] left-[50%] -translate-x-1/2 w-[72%] rounded-[36px] overflow-hidden border shadow-[0_30px_100px_rgba(0,0,0,0.45)] transition-all duration-700 hover:scale-[1.02] hover:-translate-y-3 hover:z-50 ${premiumGlass}`}
        style={{
          animation:
            "float3 10s ease-in-out infinite",
        }}
      >
        <img
          src="/images/module-tasks.png"
          alt="Tasks Dashboard"
          className="w-full h-full object-cover aspect-[16/10]"
          onError={(e) => handleImageError(e, isDarkMode, "Main Dashboard")}
        />
      </div>

      {/* Focus */}
      <div
        className={`absolute bottom-[22%] right-[0%] w-[42%] rounded-[26px] overflow-hidden border transition-all duration-700 hover:scale-[1.05] hover:-translate-y-3 hover:z-50 ${premiumGlass}`}
        style={{
          animation:
            "float2 16s ease-in-out infinite",
        }}
      >
        <img
          src="/images/module-focus.png"
          alt="Focus Module"
          className="w-full h-full object-cover aspect-[16/10]"
          onError={(e) => handleImageError(e, isDarkMode, "Focus")}
        />
      </div>

      {/* Workspace */}
      <div
        className={`absolute bottom-[4%] left-[4%] w-[28%] rounded-[24px] overflow-hidden border transition-all duration-700 hover:scale-[1.08] hover:-translate-y-2 hover:z-50 ${premiumGlass}`}
        style={{
          animation:
            "float1 18s ease-in-out infinite",
        }}
      >
        <img
          src="/images/module-workspace.png"
          alt="Workspace Module"
          className="w-full h-full object-cover aspect-square"
          onError={(e) => handleImageError(e, isDarkMode, "Workspace")}
        />
      </div>
    </div>
  </div>
</section>

{/* ========================================================= */}
{/* 3. WHY NEXSPACE WORKS */}
{/* ========================================================= */}
<section
  id="problem"
  className={`relative py-20 lg:py-40 px-6 overflow-hidden border-t ${
    isDarkMode
      ? "border-white/[0.04] bg-[#020202]"
      : "border-zinc-200 bg-zinc-50/50"
  }`}
>
  {/* Ambient Glow */}
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute top-20 left-[10%] w-[320px] h-[320px] rounded-full bg-orange-500/5 blur-[120px]" />
    <div className="absolute bottom-10 right-[10%] w-[280px] h-[280px] rounded-full bg-orange-500/5 blur-[120px]" />
  </div>

  <div className="relative z-10 max-w-[1250px] mx-auto">

    {/* ========================================================= */}
    {/* SECTION HEADING */}
    {/* ========================================================= */}
    <Reveal>
      <div className="max-w-[850px] mx-auto text-center mb-16 lg:mb-24" style={{ animationDelay: "200ms" }}>

        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 text-[12px] font-semibold tracking-wide ${
            isDarkMode
              ? "bg-white/[0.03] border-white/[0.06] text-zinc-500"
              : "bg-white border-zinc-200 text-zinc-500"
          }`}
        >
          Why people fail to stay consistent
        </div>

        <h2
          className={`text-[34px] sm:text-[46px] lg:text-[62px] font-semibold tracking-[-0.04em] leading-[1.1] lg:leading-[1.05] mb-8 ${
            isDarkMode
              ? "text-white"
              : "text-zinc-900"
          }`}
        >
          Productivity tools fail
          <br />
          because they stop at
          <span className="text-orange-500">
            {" "}organization.
          </span>
        </h2>

        <p
          className={`text-[16px] sm:text-[18px] lg:text-[19px] leading-[1.8] lg:leading-[1.9] max-w-[760px] mx-auto ${
            isDarkMode
              ? "text-zinc-400"
              : "text-zinc-600"
          }`}
        >
          Most apps become storage systems —
          places where tasks go to die.
          They help you plan, but they do not
          help you execute, focus or reflect.
          NexSpace is designed to close that gap.
        </p>
      </div>
    </Reveal>

    {/* ========================================================= */}
    {/* CONTENT */}
    {/* ========================================================= */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr] gap-12 sm:gap-8 lg:gap-0 items-start">

      {/* ========================================================= */}
      {/* ITEM 1 */}
      {/* ========================================================= */}
      <Reveal delay={100}>
          <div className="flex flex-col w-full max-w-[360px] mx-auto lg:mx-0 lg:justify-self-start text-center lg:text-left items-center lg:items-start">

          {/* Icon */}
          <div className="mb-6 lg:mb-8">
            <div className="relative">
              <div className="absolute inset-0 w-[70px] lg:w-[82px] h-[70px] lg:h-[82px] rounded-full bg-orange-500/20 blur-[22px]" />

              <div className="relative w-[70px] lg:w-[82px] h-[70px] lg:h-[82px] rounded-full bg-orange-500 flex items-center justify-center shadow-[0_25px_60px_rgba(249,115,22,0.24)]">
                <ShieldCheck
                  size={24}
                  className="text-white lg:w-7 lg:h-7"
                />
              </div>
            </div>
          </div>

          {/* Label */}
          <span className="text-[11px] lg:text-[12px] uppercase tracking-[0.22em] font-semibold text-orange-500 mb-4 lg:mb-5">
            Execution System
          </span>

          {/* Title */}
          <h3
            className={`text-[28px] sm:text-[32px] lg:text-[42px] font-semibold tracking-[-0.04em] leading-[1.1] lg:leading-[1.04] mb-6 lg:mb-8 ${
              isDarkMode
                ? "text-white"
                : "text-zinc-900"
            }`}
          >
            Execution,
            <br />
            not task dumping.
          </h3>

          {/* Content */}
          <p
            className={`text-[15px] lg:text-[16px] leading-[1.8] lg:leading-[1.95] mb-4 lg:mb-6 max-w-[370px] ${
              isDarkMode
                ? "text-zinc-400"
                : "text-zinc-600"
            }`}
          >
            Most people don’t fail because
            they forgot what to do.
            They fail because nothing helps
            them consistently execute
            meaningful work.
          </p>

          <p
            className={`text-[15px] lg:text-[16px] leading-[1.8] lg:leading-[1.95] max-w-[370px] ${
              isDarkMode
                ? "text-zinc-500"
                : "text-zinc-500"
            }`}
          >
            NexSpace bridges the gap between
            planning and action —
            helping intention become
            completion.
          </p>
        </div>
      </Reveal>

      {/* ========================================================= */}
      {/* ITEM 2 */}
      {/* ========================================================= */}
      <Reveal delay={200}>
          <div className="flex flex-col w-full max-w-[360px] mx-auto lg:mx-0 lg:justify-self-center text-center lg:text-left items-center lg:items-start">

          {/* Icon */}
          <div className="mb-6 lg:mb-8">
            <div className="relative">
              <div className="absolute inset-0 w-[70px] lg:w-[82px] h-[70px] lg:h-[82px] rounded-full bg-orange-500/20 blur-[22px]" />

              <div className="relative w-[70px] lg:w-[82px] h-[70px] lg:h-[82px] rounded-full bg-orange-500 flex items-center justify-center shadow-[0_25px_60px_rgba(249,115,22,0.24)]">
                <Target
                  size={24}
                  className="text-white lg:w-7 lg:h-7"
                />
              </div>
            </div>
          </div>

          {/* Label */}
          <span className="text-[11px] lg:text-[12px] uppercase tracking-[0.22em] font-semibold text-orange-500 mb-4 lg:mb-5">
            Sustainable Consistency
          </span>

          {/* Title */}
          <h3
            className={`text-[28px] sm:text-[32px] lg:text-[42px] font-semibold tracking-[-0.04em] leading-[1.1] lg:leading-[1.04] mb-6 lg:mb-8 ${
              isDarkMode
                ? "text-white"
                : "text-zinc-900"
            }`}
          >
            Systems beat
            <br />
            motivation.
          </h3>

          {/* Content */}
          <p
            className={`text-[15px] lg:text-[16px] leading-[1.8] lg:leading-[1.95] mb-4 lg:mb-6 max-w-[370px] ${
              isDarkMode
                ? "text-zinc-400"
                : "text-zinc-600"
            }`}
          >
            Motivation disappears.
            Discipline becomes inconsistent.
            Relying only on willpower
            eventually breaks.
          </p>

          <p
            className={`text-[15px] lg:text-[16px] leading-[1.8] lg:leading-[1.95] max-w-[370px] ${
              isDarkMode
                ? "text-zinc-500"
                : "text-zinc-500"
            }`}
          >
            NexSpace creates repeatable
            systems that pull you back
            into focused work —
            even on difficult days.
          </p>
        </div>
      </Reveal>

      {/* ========================================================= */}
      {/* ITEM 3 */}
      {/* ========================================================= */}
      <Reveal delay={300}>
         <div className="flex flex-col w-full max-w-[360px] mx-auto lg:mx-0 sm:col-span-2 lg:col-span-1 lg:justify-self-end text-center lg:text-left items-center lg:items-start">

          {/* Icon */}
          <div className="mb-6 lg:mb-8">
            <div className="relative">
              <div className="absolute inset-0 w-[70px] lg:w-[82px] h-[70px] lg:h-[82px] rounded-full bg-orange-500/20 blur-[22px]" />

              <div className="relative w-[70px] lg:w-[82px] h-[70px] lg:h-[82px] rounded-full bg-orange-500 flex items-center justify-center shadow-[0_25px_60px_rgba(249,115,22,0.24)]">
                <Zap
                  size={24}
                  className="text-white lg:w-7 lg:h-7"
                />
              </div>
            </div>
          </div>

          {/* Label */}
          <span className="text-[11px] lg:text-[12px] uppercase tracking-[0.22em] font-semibold text-orange-500 mb-4 lg:mb-5">
            One Connected Flow
          </span>

          {/* Title */}
          <h3
            className={`text-[28px] sm:text-[32px] lg:text-[42px] font-semibold tracking-[-0.04em] leading-[1.1] lg:leading-[1.04] mb-6 lg:mb-8 ${
              isDarkMode
                ? "text-white"
                : "text-zinc-900"
            }`}
          >
            No context
            <br />
            switching.
          </h3>

          {/* Content */}
          <p
            className={`text-[15px] lg:text-[16px] leading-[1.8] lg:leading-[1.95] mb-4 lg:mb-6 max-w-[370px] ${
              isDarkMode
                ? "text-zinc-400"
                : "text-zinc-600"
            }`}
          >
            Jumping between planners,
            notes, calendars and timers
            destroys momentum
            and attention.
          </p>

          <p
            className={`text-[15px] lg:text-[16px] leading-[1.8] lg:leading-[1.95] max-w-[370px] ${
              isDarkMode
                ? "text-zinc-500"
                : "text-zinc-500"
            }`}
          >
            NexSpace keeps planning,
            focus, execution and reflection
            connected inside one
            unified system.
          </p>
        </div>
      </Reveal>
    </div>
  </div>
</section>
        {/* ========================================================= */}
        {/* 4. MODULES (70/30 VISUAL HEAVY) */}
        {/* ========================================================= */}
        <section id="modules" className="py-20 lg:py-32 px-6 max-w-[1400px] mx-auto space-y-24 lg:space-y-32">
          
{/* ========================================================= */}
{/* TASKS — EXECUTION ENGINE */}
{/* ========================================================= */}
<Reveal>
  <section className="relative">

    <div className="grid grid-cols-1 lg:grid-cols-[42%,58%] gap-12 lg:gap-20 items-center">

      {/* ========================================================= */}
      {/* LEFT CONTENT */}
      {/* ========================================================= */}
      <div className="flex flex-col">

        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 w-fit px-4 py-2 rounded-full border mb-6 lg:mb-7 text-[11px] lg:text-[12px] font-semibold tracking-wide ${
            isDarkMode
              ? "bg-white/[0.03] border-white/[0.06] text-zinc-500"
              : "bg-white border-zinc-200 text-zinc-500"
          }`}
        >
          Task Engine
        </div>

        {/* Heading */}
        <h2
          className={`text-[32px] sm:text-[42px] lg:text-[58px] font-semibold tracking-[-0.04em] leading-[1.1] lg:leading-[1.02] mb-5 lg:mb-7 ${
            isDarkMode
              ? "text-white"
              : "text-zinc-900"
          }`}
        >
          Execution.
          <br />
          Without overwhelm.
        </h2>

        {/* Paragraphs */}
        <p
          className={`text-[16px] sm:text-[17px] lg:text-[18px] leading-[1.8] lg:leading-[1.9] mb-5 lg:mb-7 ${
            isDarkMode
              ? "text-zinc-400"
              : "text-zinc-600"
          }`}
        >
          Most productivity apps become giant
          storage systems for unfinished work.
          Tasks pile up, priorities disappear,
          and momentum breaks.
        </p>

        <p
          className={`text-[16px] sm:text-[17px] lg:text-[18px] leading-[1.8] lg:leading-[1.9] mb-8 lg:mb-10 ${
            isDarkMode
              ? "text-zinc-500"
              : "text-zinc-500"
          }`}
        >
          NexSpace is built around execution —
          helping you prioritize what matters,
          stay consistent and actually finish
          meaningful work every day.
        </p>

        {/* Features */}
        <div className="space-y-4 lg:space-y-5 mb-8 lg:mb-10">
          {[
            {
              title: "Priority-based workflow",
              desc: "Know exactly what deserves attention first.",
            },
            {
              title: "Momentum tracking",
              desc: "Build consistency instead of restarting every week.",
            },
            {
              title: "Smarter organization",
              desc: "Group work without clutter and chaos.",
            },
            {
              title: "Execution-first interface",
              desc: "Spend less time planning and more time doing.",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="flex gap-3 lg:gap-4"
            >
              <div className="mt-2 w-2 h-2 rounded-full bg-orange-500 shrink-0" />

              <div>
                <div
                  className={`text-[14px] lg:text-[15px] font-semibold mb-1 ${
                    isDarkMode
                      ? "text-zinc-100"
                      : "text-zinc-900"
                  }`}
                >
                  {item.title}
                </div>

                <div
                  className={`text-[13px] lg:text-[14px] leading-relaxed ${
                    isDarkMode
                      ? "text-zinc-500"
                      : "text-zinc-500"
                  }`}
                >
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 lg:gap-3">
          {[
            "Execution",
            "Consistency",
            "Momentum",
            "Deep Work",
          ].map((chip) => (
            <div
              key={chip}
              className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-[11px] lg:text-[12px] font-medium ${
                isDarkMode
                  ? "bg-white/[0.04] text-zinc-400 border border-white/[0.05]"
                  : "bg-zinc-100 text-zinc-600 border border-zinc-200"
              }`}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT VISUAL SYSTEM */}
      {/* ========================================================= */}
      <div className="relative mt-8 lg:mt-0">

        {/* ================= MOBILE ================= */}
        <div className="lg:hidden flex flex-col gap-5">

          {/* Main Tasks Image */}
          <div
            className={`rounded-[24px] overflow-hidden border shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${premiumGlass}`}
          >
            <img
              src="/images/module-tasks.png"
              alt="Tasks Module"
              className="w-full aspect-[16/10] object-cover"
              onError={(e) =>
                handleImageError(
                  e,
                  isDarkMode,
                  "Task Engine"
                )
              }
            />
          </div>

          {/* Stats */}
          <div
            className={`rounded-[20px] border p-4 backdrop-blur-xl ${
              isDarkMode
                ? "bg-black/40 border-white/[0.08]"
                : "bg-white/80 border-zinc-200"
            }`}
          >
            <div className="text-[11px] text-orange-500 font-semibold mb-1.5">
              Daily Momentum
            </div>

            <div
              className={`text-[24px] font-semibold mb-1 ${
                isDarkMode
                  ? "text-white"
                  : "text-zinc-900"
              }`}
            >
              +42%
            </div>

            <div
              className={`text-[12px] ${
                isDarkMode
                  ? "text-zinc-500"
                  : "text-zinc-500"
              }`}
            >
              completion consistency
            </div>
          </div>
        </div>

        {/* ================= DESKTOP ================= */}
        <div className="hidden lg:flex relative h-[640px] items-center justify-center">

          {/* Ambient Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[440px] h-[440px] rounded-full bg-orange-500/10 blur-[150px]" />
          </div>

          {/* Top Supporting Tasks Screenshot */}
          <div
            className={`absolute top-[4%] right-[0%] w-[38%] rounded-[30px] overflow-hidden border transition-all duration-700 hover:scale-[1.04] hover:-translate-y-3 z-10 ${premiumGlass}`}
            style={{
              animation:
                "float1 16s ease-in-out infinite",
            }}
          >
            <img
              src="/images/module-tasks.png"
              alt="Task Insights"
              className="w-full aspect-[16/10] object-cover opacity-90"
              onError={(e) => handleImageError(e, isDarkMode, "Insights")}
            />
          </div>

          {/* Main Tasks Screenshot */}
          <div
            className={`absolute bottom-[4%] left-[0%] w-[86%] rounded-[40px] overflow-hidden border transition-all duration-700 hover:scale-[1.02] hover:-translate-y-2 shadow-[0_30px_100px_rgba(0,0,0,0.42)] z-20 ${premiumGlass}`}
            style={{
              animation:
                "float3 10s ease-in-out infinite",
            }}
          >
            <img
              src="/images/module-tasks.png"
              alt="Tasks Module"
              className="w-full aspect-[16/10] object-cover"
              onError={(e) =>
                handleImageError(
                  e,
                  isDarkMode,
                  "Task Engine"
                )
              }
            />
          </div>

          {/* Floating Stats Card */}
          <div
            className={`absolute bottom-[12%] right-[0%] rounded-[28px] p-6 border backdrop-blur-xl z-30 ${
              isDarkMode
                ? "bg-black/40 border-white/[0.08]"
                : "bg-white/85 border-zinc-200 shadow-xl"
            }`}
          >
            <div className="text-[12px] text-orange-500 font-semibold mb-2">
              Daily Momentum
            </div>

            <div
              className={`text-[30px] font-semibold mb-1 ${
                isDarkMode
                  ? "text-white"
                  : "text-zinc-900"
              }`}
            >
              +42%
            </div>

            <div
              className={`text-[13px] ${
                isDarkMode
                  ? "text-zinc-500"
                  : "text-zinc-500"
              }`}
            >
              completion consistency
            </div>
          </div>

          {/* Floating Priorities Card */}
          <div
            className={`absolute top-[40%] left-[3%] rounded-[24px] px-5 py-4 border backdrop-blur-xl z-30 ${
              isDarkMode
                ? "bg-black/40 border-white/[0.08]"
                : "bg-white/85 border-zinc-200 shadow-lg"
            }`}
          >
            <div className="text-[12px] text-orange-500 font-semibold mb-1">
              Focused Today
            </div>

            <div
              className={`text-[18px] font-semibold ${
                isDarkMode
                  ? "text-white"
                  : "text-zinc-900"
              }`}
            >
              5 Priorities
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</Reveal>

{/* ========================================================= */}
{/* FOCUS — DEEP WORK ENVIRONMENT */}
{/* ========================================================= */}
<Reveal>
  <section className="relative mt-20 lg:mt-32">

    <div className="grid grid-cols-1 lg:grid-cols-[58%,42%] gap-12 lg:gap-20 items-center">

      {/* ========================================================= */}
      {/* LEFT VISUAL SYSTEM */}
      {/* ========================================================= */}
      <div className="relative order-2 lg:order-1 mt-8 lg:mt-0">

        {/* ================= MOBILE ================= */}
        <div className="lg:hidden flex flex-col gap-5">

          {/* Main Focus Screenshot */}
          <div
            className={`rounded-[24px] overflow-hidden border shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${premiumGlass}`}
          >
            <img
              src="/images/module-focus.png"
              alt="Focus Module"
              className="w-full aspect-[16/10] object-cover"
              onError={(e) =>
                handleImageError(
                  e,
                  isDarkMode,
                  "Focus Environment"
                )
              }
            />
          </div>

          {/* Stats Card */}
          <div
            className={`rounded-[20px] border p-4 backdrop-blur-xl ${
              isDarkMode
                ? "bg-black/40 border-white/[0.08]"
                : "bg-white/80 border-zinc-200"
            }`}
          >
            <div className="text-[11px] text-orange-500 font-semibold mb-1.5">
              Focus Session
            </div>

            <div
              className={`text-[24px] font-semibold mb-1 ${
                isDarkMode
                  ? "text-white"
                  : "text-zinc-900"
              }`}
            >
              02:14
            </div>

            <div
              className={`text-[12px] ${
                isDarkMode
                  ? "text-zinc-500"
                  : "text-zinc-500"
              }`}
            >
              uninterrupted work
            </div>
          </div>
        </div>

        {/* ================= DESKTOP ================= */}
        <div className="hidden lg:flex relative h-[640px] items-center justify-center">

          {/* Ambient Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[440px] h-[440px] rounded-full bg-orange-500/10 blur-[150px]" />
          </div>

          {/* Top Supporting Focus Screenshot */}
          <div
            className={`absolute top-[4%] left-[0%] w-[38%] rounded-[30px] overflow-hidden border transition-all duration-700 hover:scale-[1.04] hover:-translate-y-3 z-10 ${premiumGlass}`}
            style={{
              animation:
                "float1 16s ease-in-out infinite",
            }}
          >
            <img
              src="/images/module-focus.png"
              alt="Focus Insights"
              className="w-full aspect-[16/10] object-cover opacity-90"
              onError={(e) => handleImageError(e, isDarkMode, "Insights")}
            />
          </div>

          {/* Main Focus Screenshot */}
          <div
            className={`absolute bottom-[4%] right-[0%] w-[86%] rounded-[40px] overflow-hidden border transition-all duration-700 hover:scale-[1.02] hover:-translate-y-2 shadow-[0_30px_100px_rgba(0,0,0,0.42)] z-20 ${premiumGlass}`}
            style={{
              animation:
                "float3 10s ease-in-out infinite",
            }}
          >
            <img
              src="/images/module-focus.png"
              alt="Focus Module"
              className="w-full aspect-[16/10] object-cover"
              onError={(e) =>
                handleImageError(
                  e,
                  isDarkMode,
                  "Focus Environment"
                )
              }
            />
          </div>

          {/* Floating Session Card */}
          <div
            className={`absolute bottom-[12%] left-[0%] rounded-[28px] p-6 border backdrop-blur-xl z-30 ${
              isDarkMode
                ? "bg-black/40 border-white/[0.08]"
                : "bg-white/85 border-zinc-200 shadow-xl"
            }`}
          >
            <div className="text-[12px] text-orange-500 font-semibold mb-2">
              Focus Session
            </div>

            <div
              className={`text-[30px] font-semibold mb-1 ${
                isDarkMode
                  ? "text-white"
                  : "text-zinc-900"
              }`}
            >
              02:14
            </div>

            <div
              className={`text-[13px] ${
                isDarkMode
                  ? "text-zinc-500"
                  : "text-zinc-500"
              }`}
            >
              uninterrupted work
            </div>
          </div>

          {/* Floating Attention Card */}
          <div
            className={`absolute top-[40%] right-[4%] rounded-[24px] px-5 py-4 border backdrop-blur-xl z-30 ${
              isDarkMode
                ? "bg-black/40 border-white/[0.08]"
                : "bg-white/85 border-zinc-200 shadow-lg"
            }`}
          >
            <div className="text-[12px] text-orange-500 font-semibold mb-1">
              Deep Work
            </div>

            <div
              className={`text-[18px] font-semibold ${
                isDarkMode
                  ? "text-white"
                  : "text-zinc-900"
              }`}
            >
              Zero distractions
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT CONTENT */}
      {/* ========================================================= */}
      <div className="order-1 lg:order-2 flex flex-col">

        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 w-fit px-4 py-2 rounded-full border mb-6 lg:mb-7 text-[11px] lg:text-[12px] font-semibold tracking-wide ${
            isDarkMode
              ? "bg-white/[0.03] border-white/[0.06] text-zinc-500"
              : "bg-white border-zinc-200 text-zinc-500"
          }`}
        >
          Focus Environment
        </div>

        {/* Heading */}
        <h2
          className={`text-[32px] sm:text-[42px] lg:text-[58px] font-semibold tracking-[-0.04em] leading-[1.1] lg:leading-[1.02] mb-5 lg:mb-7 ${
            isDarkMode
              ? "text-white"
              : "text-zinc-900"
          }`}
        >
          Deep work.
          <br />
          Without distraction.
        </h2>

        {/* Paragraphs */}
        <p
          className={`text-[16px] sm:text-[17px] lg:text-[18px] leading-[1.8] lg:leading-[1.9] mb-5 lg:mb-7 ${
            isDarkMode
              ? "text-zinc-400"
              : "text-zinc-600"
          }`}
        >
          Attention is your most valuable
          resource. But notifications,
          multitasking and context switching
          constantly break momentum.
        </p>

        <p
          className={`text-[16px] sm:text-[17px] lg:text-[18px] leading-[1.8] lg:leading-[1.9] mb-8 lg:mb-10 ${
            isDarkMode
              ? "text-zinc-500"
              : "text-zinc-500"
          }`}
        >
          NexSpace creates a dedicated
          environment for uninterrupted work —
          helping you stay locked in,
          protect focus and finish meaningful
          work faster.
        </p>

        {/* Features */}
        <div className="space-y-4 lg:space-y-5 mb-8 lg:mb-10">
          {[
            {
              title: "Dedicated focus sessions",
              desc: "Create intentional blocks for meaningful work.",
            },
            {
              title: "Reduced distractions",
              desc: "Protect momentum while staying fully engaged.",
            },
            {
              title: "Less context switching",
              desc: "Avoid losing energy between tasks.",
            },
            {
              title: "Deeper concentration",
              desc: "Do fewer things with higher quality.",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="flex gap-3 lg:gap-4"
            >
              <div className="mt-2 w-2 h-2 rounded-full bg-orange-500 shrink-0" />

              <div>
                <div
                  className={`text-[14px] lg:text-[15px] font-semibold mb-1 ${
                    isDarkMode
                      ? "text-zinc-100"
                      : "text-zinc-900"
                  }`}
                >
                  {item.title}
                </div>

                <div
                  className={`text-[13px] lg:text-[14px] leading-relaxed ${
                    isDarkMode
                      ? "text-zinc-500"
                      : "text-zinc-500"
                  }`}
                >
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 lg:gap-3">
          {[
            "Deep Work",
            "Flow State",
            "Focus",
            "Attention",
          ].map((chip) => (
            <div
              key={chip}
              className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-[11px] lg:text-[12px] font-medium ${
                isDarkMode
                  ? "bg-white/[0.04] text-zinc-400 border border-white/[0.05]"
                  : "bg-zinc-100 text-zinc-600 border border-zinc-200"
              }`}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
</Reveal>

{/* ========================================================= */}
{/* PLANNER — DESIGN YOUR DAY */}
{/* ========================================================= */}
<Reveal>
  <section className="relative mt-20 lg:mt-32">

    <div className="grid grid-cols-1 lg:grid-cols-[42%,58%] gap-12 lg:gap-20 items-center">

      {/* ========================================================= */}
      {/* LEFT CONTENT */}
      {/* ========================================================= */}
      <div className="flex flex-col">

        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 w-fit px-4 py-2 rounded-full border mb-6 lg:mb-7 text-[11px] lg:text-[12px] font-semibold tracking-wide ${
            isDarkMode
              ? "bg-white/[0.03] border-white/[0.06] text-zinc-500"
              : "bg-white border-zinc-200 text-zinc-500"
          }`}
        >
          Planner System
        </div>

        {/* Heading */}
        <h2
          className={`text-[32px] sm:text-[42px] lg:text-[58px] font-semibold tracking-[-0.04em] leading-[1.1] lg:leading-[1.02] mb-5 lg:mb-7 ${
            isDarkMode
              ? "text-white"
              : "text-zinc-900"
          }`}
        >
          Design your day.
          <br />
          Before chaos starts.
        </h2>

        {/* Paragraphs */}
        <p
          className={`text-[16px] sm:text-[17px] lg:text-[18px] leading-[1.8] lg:leading-[1.9] mb-5 lg:mb-7 ${
            isDarkMode
              ? "text-zinc-400"
              : "text-zinc-600"
          }`}
        >
          Most people react to their day.
          Notifications, meetings and unfinished
          work decide what gets attention.
        </p>

        <p
          className={`text-[16px] sm:text-[17px] lg:text-[18px] leading-[1.8] lg:leading-[1.9] mb-8 lg:mb-10 ${
            isDarkMode
              ? "text-zinc-500"
              : "text-zinc-500"
          }`}
        >
          NexSpace helps you intentionally
          structure your time — plan priorities,
          reduce decision fatigue and build
          calmer, more predictable workdays.
        </p>

        {/* Features */}
        <div className="space-y-4 lg:space-y-5 mb-8 lg:mb-10">
          {[
            {
              title: "Intentional planning",
              desc: "Decide what matters before distractions arrive.",
            },
            {
              title: "Better time structure",
              desc: "Create clearer days with less overwhelm.",
            },
            {
              title: "Reduce decision fatigue",
              desc: "Know exactly what comes next.",
            },
            {
              title: "Energy-based scheduling",
              desc: "Match hard work with peak focus hours.",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="flex gap-3 lg:gap-4"
            >
              <div className="mt-2 w-2 h-2 rounded-full bg-orange-500 shrink-0" />

              <div>
                <div
                  className={`text-[14px] lg:text-[15px] font-semibold mb-1 ${
                    isDarkMode
                      ? "text-zinc-100"
                      : "text-zinc-900"
                  }`}
                >
                  {item.title}
                </div>

                <div
                  className={`text-[13px] lg:text-[14px] leading-relaxed ${
                    isDarkMode
                      ? "text-zinc-500"
                      : "text-zinc-500"
                  }`}
                >
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 lg:gap-3">
          {[
            "Planning",
            "Clarity",
            "Structure",
            "Intentionality",
          ].map((chip) => (
            <div
              key={chip}
              className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-[11px] lg:text-[12px] font-medium ${
                isDarkMode
                  ? "bg-white/[0.04] text-zinc-400 border border-white/[0.05]"
                  : "bg-zinc-100 text-zinc-600 border border-zinc-200"
              }`}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT VISUAL SYSTEM */}
      {/* ========================================================= */}
      <div className="relative mt-8 lg:mt-0">

        {/* ================= MOBILE ================= */}
        <div className="lg:hidden flex flex-col gap-5">

          {/* Main Planner Screenshot */}
          <div
            className={`rounded-[24px] overflow-hidden border shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${premiumGlass}`}
          >
            <img
              src="/images/module-planner.png"
              alt="Planner Module"
              className="w-full aspect-[16/10] object-cover"
              onError={(e) =>
                handleImageError(
                  e,
                  isDarkMode,
                  "Planner"
                )
              }
            />
          </div>

          {/* Stats Card */}
          <div
            className={`rounded-[20px] border p-4 backdrop-blur-xl ${
              isDarkMode
                ? "bg-black/40 border-white/[0.08]"
                : "bg-white/80 border-zinc-200"
            }`}
          >
            <div className="text-[11px] text-orange-500 font-semibold mb-1.5">
              Planned Today
            </div>

            <div
              className={`text-[24px] font-semibold mb-1 ${
                isDarkMode
                  ? "text-white"
                  : "text-zinc-900"
              }`}
            >
              7 Priorities
            </div>

            <div
              className={`text-[12px] ${
                isDarkMode
                  ? "text-zinc-500"
                  : "text-zinc-500"
              }`}
            >
              intentionally mapped
            </div>
          </div>
        </div>

        {/* ================= DESKTOP ================= */}
        <div className="hidden lg:flex relative h-[640px] items-center justify-center">

          {/* Ambient Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[440px] h-[440px] rounded-full bg-orange-500/10 blur-[150px]" />
          </div>

          {/* Top Supporting Planner Screenshot */}
          <div
            className={`absolute top-[4%] right-[0%] w-[38%] rounded-[30px] overflow-hidden border transition-all duration-700 hover:scale-[1.04] hover:-translate-y-3 z-10 ${premiumGlass}`}
            style={{
              animation:
                "float1 16s ease-in-out infinite",
            }}
          >
            <img
              src="/images/module-planner.png"
              alt="Planner Insights"
              className="w-full aspect-[16/10] object-cover opacity-90"
              onError={(e) => handleImageError(e, isDarkMode, "Insights")}
            />
          </div>

          {/* Main Planner Screenshot */}
          <div
            className={`absolute bottom-[4%] left-[0%] w-[86%] rounded-[40px] overflow-hidden border transition-all duration-700 hover:scale-[1.02] hover:-translate-y-2 shadow-[0_30px_100px_rgba(0,0,0,0.42)] z-20 ${premiumGlass}`}
            style={{
              animation:
                "float3 10s ease-in-out infinite",
            }}
          >
            <img
              src="/images/module-planner.png"
              alt="Planner Module"
              className="w-full aspect-[16/10] object-cover"
              onError={(e) =>
                handleImageError(
                  e,
                  isDarkMode,
                  "Planner"
                )
              }
            />
          </div>

          {/* Floating Planning Card */}
          <div
            className={`absolute bottom-[12%] right-[0%] rounded-[28px] p-6 border backdrop-blur-xl z-30 ${
              isDarkMode
                ? "bg-black/40 border-white/[0.08]"
                : "bg-white/85 border-zinc-200 shadow-xl"
            }`}
          >
            <div className="text-[12px] text-orange-500 font-semibold mb-2">
              Planned Today
            </div>

            <div
              className={`text-[30px] font-semibold mb-1 ${
                isDarkMode
                  ? "text-white"
                  : "text-zinc-900"
              }`}
            >
              7 Priorities
            </div>

            <div
              className={`text-[13px] ${
                isDarkMode
                  ? "text-zinc-500"
                  : "text-zinc-500"
              }`}
            >
              intentionally mapped
            </div>
          </div>

          {/* Floating Structure Card */}
          <div
            className={`absolute top-[40%] left-[3%] rounded-[24px] px-5 py-4 border backdrop-blur-xl z-30 ${
              isDarkMode
                ? "bg-black/40 border-white/[0.08]"
                : "bg-white/85 border-zinc-200 shadow-lg"
            }`}
          >
            <div className="text-[12px] text-orange-500 font-semibold mb-1">
              Daily Structure
            </div>

            <div
              className={`text-[18px] font-semibold ${
                isDarkMode
                  ? "text-white"
                  : "text-zinc-900"
              }`}
            >
              Calm workflow
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</Reveal>
{/* ========================================================= */}
{/* DIARY + WORKSPACE */}
{/* ========================================================= */}
<Reveal>
  <section className="relative mt-20 lg:mt-32">

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-10 items-start">

      {/* ========================================================= */}
      {/* DIARY SYSTEM */}
      {/* ========================================================= */}
      <div className="flex flex-col h-full">

        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 w-fit px-4 py-2 rounded-full border mb-6 lg:mb-7 text-[11px] lg:text-[12px] font-semibold tracking-wide ${
            isDarkMode
              ? "bg-white/[0.03] border-white/[0.06] text-zinc-500"
              : "bg-white border-zinc-200 text-zinc-500"
          }`}
        >
          Reflection System
        </div>

        {/* Heading */}
        <h2
          className={`text-[30px] sm:text-[38px] lg:text-[48px] font-semibold tracking-[-0.04em] leading-[1.1] lg:leading-[1.02] mb-5 lg:mb-6 ${
            isDarkMode
              ? "text-white"
              : "text-zinc-900"
          }`}
        >
          Reflect.
          Learn.
          <br />
          Improve.
        </h2>

        {/* Content */}
        <p
          className={`text-[15px] sm:text-[16px] lg:text-[17px] leading-[1.8] lg:leading-[1.9] mb-4 lg:mb-6 ${
            isDarkMode
              ? "text-zinc-400"
              : "text-zinc-600"
          }`}
        >
          Growth happens when you stop
          repeating the same mistakes.
          Reflection turns experiences
          into improvement.
        </p>

        <p
          className={`text-[15px] sm:text-[16px] lg:text-[17px] leading-[1.8] lg:leading-[1.9] mb-6 lg:mb-8 ${
            isDarkMode
              ? "text-zinc-500"
              : "text-zinc-500"
          }`}
        >
          NexSpace helps you reflect on wins,
          failures, emotions and patterns —
          building awareness that compounds
          every single day.
        </p>

        {/* Features */}
        <div className="space-y-3 lg:space-y-4 mb-8 lg:mb-10">

          {[
            "Morning & evening reflections",
            "Track emotional patterns",
            "Build self-awareness daily",
            "Learn from real behavior",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 lg:gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />

              <span
                className={`text-[13px] lg:text-[14px] ${
                  isDarkMode
                    ? "text-zinc-300"
                    : "text-zinc-700"
                }`}
              >
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* ========================================================= */}
        {/* DIARY VISUAL SYSTEM */}
        {/* ========================================================= */}
        <div className="relative mt-auto">

          {/* Mobile */}
          <div className="lg:hidden flex flex-col gap-4">

            <div
              className={`rounded-[24px] overflow-hidden border shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${premiumGlass}`}
            >
              <img
                src="/images/module-diary.png"
                alt="Diary"
                className="w-full aspect-[16/10] object-cover"
                onError={(e) => handleImageError(e, isDarkMode, "Diary")}
              />
            </div>

            <div
              className={`rounded-[20px] border p-4 ${
                isDarkMode
                  ? "bg-black/40 border-white/[0.08]"
                  : "bg-white/80 border-zinc-200"
              }`}
            >
              <div className="text-[11px] text-orange-500 font-semibold mb-1.5">
                Reflection Streak
              </div>

              <div
                className={`text-[24px] font-semibold ${
                  isDarkMode
                    ? "text-white"
                    : "text-zinc-900"
                }`}
              >
                21 Days
              </div>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden lg:flex relative h-[460px]">

            {/* Glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[260px] h-[260px] rounded-full bg-orange-500/10 blur-[100px]" />
            </div>

            {/* Main Image */}
            <div
              className={`absolute bottom-0 left-0 w-[88%] rounded-[36px] overflow-hidden border shadow-[0_30px_100px_rgba(0,0,0,0.42)] z-20 ${premiumGlass}`}
            >
              <img
                src="/images/module-diary.png"
                alt="Diary"
                className="w-full aspect-[16/10] object-cover"
                onError={(e) => handleImageError(e, isDarkMode, "Diary")}
              />
            </div>

            {/* Floating Card */}
            <div
              className={`absolute top-[6%] right-[0%] rounded-[26px] p-5 border backdrop-blur-xl z-30 ${
                isDarkMode
                  ? "bg-black/40 border-white/[0.08]"
                  : "bg-white/85 border-zinc-200 shadow-xl"
              }`}
            >
              <div className="text-[12px] text-orange-500 font-semibold mb-2">
                Reflection Streak
              </div>

              <div
                className={`text-[26px] font-semibold mb-1 ${
                  isDarkMode
                    ? "text-white"
                    : "text-zinc-900"
                }`}
              >
                21 Days
              </div>

              <div
                className={`text-[13px] ${
                  isDarkMode
                    ? "text-zinc-500"
                    : "text-zinc-500"
                }`}
              >
                consistency in growth
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* WORKSPACE SYSTEM */}
      {/* ========================================================= */}
      <div className="flex flex-col h-full">

        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 w-fit px-4 py-2 rounded-full border mb-6 lg:mb-7 text-[11px] lg:text-[12px] font-semibold tracking-wide ${
            isDarkMode
              ? "bg-white/[0.03] border-white/[0.06] text-zinc-500"
              : "bg-white border-zinc-200 text-zinc-500"
          }`}
        >
          Connected Workspace
        </div>

        {/* Heading */}
        <h2
          className={`text-[30px] sm:text-[38px] lg:text-[48px] font-semibold tracking-[-0.04em] leading-[1.1] lg:leading-[1.02] mb-5 lg:mb-6 ${
            isDarkMode
              ? "text-white"
              : "text-zinc-900"
          }`}
        >
          Keep everything.
          <br />
          Connected.
        </h2>

        {/* Content */}
        <p
          className={`text-[15px] sm:text-[16px] lg:text-[17px] leading-[1.8] lg:leading-[1.9] mb-4 lg:mb-6 ${
            isDarkMode
              ? "text-zinc-400"
              : "text-zinc-600"
          }`}
        >
          Ideas disappear when they live
          across disconnected apps,
          folders and notes.
        </p>

        <p
          className={`text-[15px] sm:text-[16px] lg:text-[17px] leading-[1.8] lg:leading-[1.9] mb-6 lg:mb-8 ${
            isDarkMode
              ? "text-zinc-500"
              : "text-zinc-500"
          }`}
        >
          NexSpace keeps files, thoughts,
          resources and work connected —
          reducing friction between
          thinking and execution.
        </p>

        {/* Features */}
        <div className="space-y-3 lg:space-y-4 mb-8 lg:mb-10">

          {[
            "Store files & resources",
            "Keep ideas connected",
            "Reduce app switching",
            "Everything stays contextual",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 lg:gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />

              <span
                className={`text-[13px] lg:text-[14px] ${
                  isDarkMode
                    ? "text-zinc-300"
                    : "text-zinc-700"
                }`}
              >
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* ========================================================= */}
        {/* WORKSPACE VISUAL SYSTEM */}
        {/* ========================================================= */}
        <div className="relative mt-auto">

          {/* Mobile */}
          <div className="lg:hidden flex flex-col gap-4">

            <div
              className={`rounded-[24px] overflow-hidden border shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${premiumGlass}`}
            >
              <img
                src="/images/module-workspace.png"
                alt="Workspace"
                className="w-full aspect-[16/10] object-cover"
                onError={(e) => handleImageError(e, isDarkMode, "Workspace")}
              />
            </div>

            <div
              className={`rounded-[20px] border p-4 ${
                isDarkMode
                  ? "bg-black/40 border-white/[0.08]"
                  : "bg-white/80 border-zinc-200"
              }`}
            >
              <div className="text-[11px] text-orange-500 font-semibold mb-1.5">
                Workspace
              </div>

              <div
                className={`text-[24px] font-semibold ${
                  isDarkMode
                    ? "text-white"
                    : "text-zinc-900"
                }`}
              >
                All Connected
              </div>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden lg:flex relative h-[460px]">

            {/* Glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[260px] h-[260px] rounded-full bg-orange-500/10 blur-[100px]" />
            </div>

            {/* Main Image */}
            <div
              className={`absolute bottom-0 right-0 w-[88%] rounded-[36px] overflow-hidden border shadow-[0_30px_100px_rgba(0,0,0,0.42)] z-20 ${premiumGlass}`}
            >
              <img
                src="/images/module-workspace.png"
                alt="Workspace"
                className="w-full aspect-[16/10] object-cover"
                onError={(e) => handleImageError(e, isDarkMode, "Workspace")}
              />
            </div>

            {/* Floating Card */}
            <div
              className={`absolute top-[6%] left-[0%] rounded-[26px] p-5 border backdrop-blur-xl z-30 ${
                isDarkMode
                  ? "bg-black/40 border-white/[0.08]"
                  : "bg-white/85 border-zinc-200 shadow-xl"
              }`}
            >
              <div className="text-[12px] text-orange-500 font-semibold mb-2">
                Mini Files
              </div>

              <div
                className={`text-[26px] font-semibold mb-1 ${
                  isDarkMode
                    ? "text-white"
                    : "text-zinc-900"
                }`}
              >
                All Connected
              </div>

              <div
                className={`text-[13px] ${
                  isDarkMode
                    ? "text-zinc-500"
                    : "text-zinc-500"
                }`}
              >
                notes • files • ideas
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>
</Reveal>

        </section>

        {/* ========================================================= */}
{/* 5. DAILY RHYTHM — FLOW */}
{/* ========================================================= */}
<section
  id="rhythm"
  className={`relative py-24 lg:py-44 px-6 border-y overflow-hidden ${
    isDarkMode
      ? "border-white/[0.04] bg-[#020202]"
      : "border-zinc-200 bg-zinc-50/50"
  }`}
>

  {/* Ambient Glow */}
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute top-[10%] left-[12%] w-[320px] h-[320px] rounded-full bg-orange-500/5 blur-[140px]" />
    <div className="absolute bottom-[0%] right-[8%] w-[320px] h-[320px] rounded-full bg-orange-500/5 blur-[140px]" />
  </div>

  <div className="relative z-10 max-w-[1300px] mx-auto">

    {/* ========================================================= */}
    {/* HEADER */}
    {/* ========================================================= */}
    <Reveal>
      <div className="max-w-[860px] mx-auto text-center mb-20 lg:mb-28">

        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 text-[12px] font-semibold tracking-wide ${
            isDarkMode
              ? "bg-white/[0.03] border-white/[0.06] text-zinc-500"
              : "bg-white border-zinc-200 text-zinc-500"
          }`}
        >
          Daily Operating Rhythm
        </div>

        <h2
          className={`text-[36px] sm:text-[48px] lg:text-[68px] font-semibold tracking-[-0.05em] leading-[1.1] lg:leading-[1.02] mb-8 ${
            isDarkMode
              ? "text-white"
              : "text-zinc-900"
          }`}
        >
          Consistency isn’t built
          <br />
          in one perfect day.
        </h2>

        <p
          className={`text-[16px] sm:text-[18px] lg:text-[19px] leading-[1.8] lg:leading-[1.9] max-w-[760px] mx-auto ${
            isDarkMode
              ? "text-zinc-400"
              : "text-zinc-600"
          }`}
        >
          Motivation fades.
          Systems stay.
          NexSpace helps you build
          a rhythm that compounds —
          helping you intentionally plan,
          execute deeply and improve
          without burnout.
        </p>
      </div>
    </Reveal>

    {/* ========================================================= */}
    {/* FLOW SYSTEM */}
    {/* ========================================================= */}
    <Reveal delay={100}>
      <div className="relative">

        {/* Line */}
        <div
          className={`hidden lg:block absolute top-[44px] left-0 right-0 h-px ${
            isDarkMode
              ? "bg-white/[0.06]"
              : "bg-zinc-200"
          }`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 relative z-10">

          {[
            {
              time: "Morning",
              title: "Plan",
              desc:
                "Start intentionally. Decide what matters before distractions decide for you.",
            },
            {
              time: "Day",
              title: "Execute",
              desc:
                "Focus deeply and move meaningful work forward without overwhelm.",
            },
            {
              time: "Night",
              title: "Reflect",
              desc:
                "Understand patterns, review progress and learn from today.",
            },
            {
              time: "Repeat",
              title: "Compound",
              desc:
                "Small improvements repeated daily become long-term momentum.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="relative flex flex-col items-center text-center lg:items-start lg:text-left"
            >

              {/* Dot */}
              <div className="relative z-10 mb-6 lg:mb-8">
                <div className="w-[70px] lg:w-[88px] h-[70px] lg:h-[88px] rounded-full bg-orange-500 flex items-center justify-center shadow-[0_20px_60px_rgba(249,115,22,0.25)] relative lg:-mt-0">
                  <span className="text-white text-[18px] lg:text-[20px] font-semibold">
                    0{index + 1}
                  </span>
                </div>
              </div>

              {/* Time */}
              <span className="text-[11px] lg:text-[12px] font-semibold tracking-[0.2em] uppercase text-orange-500 mb-3 lg:mb-4">
                {item.time}
              </span>

              {/* Title */}
              <h3
                className={`text-[28px] sm:text-[32px] lg:text-[38px] font-semibold tracking-tight mb-3 lg:mb-5 ${
                  isDarkMode
                    ? "text-white"
                    : "text-zinc-900"
                }`}
              >
                {item.title}
              </h3>

              {/* Description */}
              <p
                className={`text-[14px] lg:text-[15px] leading-[1.8] lg:leading-[1.9] max-w-[280px] lg:max-w-[260px] ${
                  isDarkMode
                    ? "text-zinc-400"
                    : "text-zinc-600"
                }`}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Reveal>

    {/* ========================================================= */}
    {/* END MESSAGE */}
    {/* ========================================================= */}
    <Reveal delay={200}>
      <div className="max-w-[900px] mx-auto text-center mt-20 lg:mt-28">

        <h3
          className={`text-[28px] sm:text-[36px] lg:text-[42px] font-semibold tracking-[-0.04em] leading-[1.15] lg:leading-[1.1] mb-5 lg:mb-6 ${
            isDarkMode
              ? "text-white"
              : "text-zinc-900"
          }`}
        >
          Productivity is not intensity.
          <br />
          It’s rhythm.
        </h3>

        <p
          className={`text-[15px] sm:text-[17px] lg:text-[18px] leading-[1.8] lg:leading-[1.9] max-w-[720px] mx-auto ${
            isDarkMode
              ? "text-zinc-400"
              : "text-zinc-600"
          }`}
        >
          The goal isn’t to become perfect.
          It’s to create a repeatable system
          that slowly compounds into the person
          you want to become.
        </p>
      </div>
    </Reveal>
  </div>
</section>
        
{/* ========================================================= */}
{/* 6. FINAL CTA + FOOTER */}
{/* ========================================================= */}
<section
  className={`relative overflow-hidden border-t ${
    isDarkMode
      ? "border-white/[0.04] bg-[#020202]"
      : "border-zinc-200 bg-zinc-50/40"
  }`}
>

  {/* Ambient Glow */}
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[140px]" />
  </div>

  <div className="relative z-10 max-w-[1300px] mx-auto px-6">

    {/* ========================================================= */}
    {/* CTA */}
    {/* ========================================================= */}
    <div className="py-20 lg:py-36 text-center">

      <Reveal>
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 lg:mb-8 text-[11px] lg:text-[12px] font-semibold tracking-wide ${
            isDarkMode
              ? "bg-white/[0.03] border-white/[0.06] text-zinc-500"
              : "bg-white border-zinc-200 text-zinc-500"
          }`}
        >
          Build consistency intentionally
        </div>

        <h2
          className={`text-[36px] sm:text-[48px] lg:text-[72px] font-semibold tracking-[-0.05em] leading-[1.1] lg:leading-[1.02] mb-6 lg:mb-8 ${
            isDarkMode
              ? "text-white"
              : "text-zinc-900"
          }`}
        >
          Build your
          <br />
          personal operating system.
        </h2>

        <p
          className={`max-w-[760px] mx-auto text-[16px] sm:text-[18px] lg:text-[19px] leading-[1.8] lg:leading-[1.9] mb-10 lg:mb-12 ${
            isDarkMode
              ? "text-zinc-400"
              : "text-zinc-600"
          }`}
        >
          Stop relying on motivation.
          Plan intentionally, execute deeply,
          reflect consistently and build
          momentum that compounds over time.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

          <button
            onClick={scrollToHeroAuth}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-[14px] lg:text-[15px] font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-all active:scale-95 shadow-[0_15px_50px_rgba(249,115,22,0.25)]"
          >
            Start Free
          </button>

          <button
            onClick={() =>
              document
                .getElementById("modules")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
            className={`w-full sm:w-auto px-8 py-4 rounded-2xl text-[14px] lg:text-[15px] font-semibold border transition-all active:scale-95 ${
              isDarkMode
                ? "border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.05]"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            Explore Features
          </button>

        </div>
      </Reveal>
    </div>

    {/* ========================================================= */}
    {/* FOOTER */}
    {/* ========================================================= */}
    <Reveal>
      <footer
        className={`border-t py-10 lg:py-14 ${
          isDarkMode
            ? "border-white/[0.04]"
            : "border-zinc-200"
        }`}
      >

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr,1fr,1fr,1fr] gap-10 lg:gap-14">

          {/* Brand */}
          <div>

            <div className="flex items-center gap-3 mb-4 lg:mb-5">
              <img
                src="/favicon.ico"
                alt="NexSpace"
                className="w-6 h-6 object-contain"
              />

              <span
                className={`font-semibold text-[16px] lg:text-[18px] tracking-tight ${
                  isDarkMode
                    ? "text-white"
                    : "text-zinc-900"
                }`}
              >
                NexSpace
              </span>
            </div>

            <p
              className={`text-[13px] lg:text-[14px] leading-[1.8] lg:leading-[1.9] max-w-[320px] ${
                isDarkMode
                  ? "text-zinc-500"
                  : "text-zinc-600"
              }`}
            >
              A personal operating system
              built to help you plan,
              focus, execute and reflect —
              consistently.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4
              className={`text-[13px] lg:text-[14px] font-semibold mb-4 lg:mb-5 ${
                isDarkMode
                  ? "text-zinc-200"
                  : "text-zinc-900"
              }`}
            >
              Product
            </h4>

            <div className="space-y-3 lg:space-y-4 text-[13px] lg:text-[14px]">

              {[
                {
                  label: "Tasks",
                  id: "modules",
                },
                {
                  label: "Focus",
                  id: "modules",
                },
                {
                  label: "Planner",
                  id: "modules",
                },
                {
                  label: "Diary",
                  id: "modules",
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() =>
                    document
                      .getElementById(item.id)
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                  className={`block transition-colors ${
                    isDarkMode
                      ? "text-zinc-500 hover:text-white"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4
              className={`text-[13px] lg:text-[14px] font-semibold mb-4 lg:mb-5 ${
                isDarkMode
                  ? "text-zinc-200"
                  : "text-zinc-900"
              }`}
            >
              Navigation
            </h4>

            <div className="space-y-3 lg:space-y-4 text-[13px] lg:text-[14px]">

              {[
                {
                  label: "Why NexSpace?",
                  id: "problem",
                },
                {
                  label: "Modules",
                  id: "modules",
                },
                {
                  label: "Daily Rhythm",
                  id: "rhythm",
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() =>
                    document
                      .getElementById(item.id)
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                  className={`block transition-colors ${
                    isDarkMode
                      ? "text-zinc-500 hover:text-white"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Back to top */}
          <div className="flex lg:justify-end items-start mt-4 sm:mt-0">

            <button
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
              className={`group flex items-center justify-center gap-3 w-full lg:w-auto px-5 py-3 lg:py-4 rounded-2xl border transition-all ${
                isDarkMode
                  ? "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]"
                  : "bg-white border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <ArrowUp size={16} />

              <span
                className={`text-[13px] lg:text-[14px] font-medium ${
                  isDarkMode
                    ? "text-zinc-300"
                    : "text-zinc-700"
                }`}
              >
                Back to top
              </span>
            </button>
          </div>
        </div>

        {/* Bottom */}
        <div
          className={`mt-10 lg:mt-14 pt-6 lg:pt-8 border-t flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 text-[12px] lg:text-[13px] text-center sm:text-left ${
            isDarkMode
              ? "border-white/[0.04] text-zinc-600"
              : "border-zinc-200 text-zinc-500"
          }`}
        >
          <span>
            © 2026 NexSpace. All rights reserved.
          </span>

          <span>
            Built for intentional consistency.
          </span>
        </div>
      </footer>
    </Reveal>
  </div>
</section>

      </main>

      {/* ========================================================= */}
      {/* 7. FOOTER */}
      {/* ========================================================= */}
    {/* ========================================================= */}
{/* 7. FOOTER */}
{/* ========================================================= */}
<footer
  className={`py-8 lg:py-12 text-center border-t ${
    isDarkMode ? "border-white/[0.04]" : "border-zinc-200"
  }`}
>
  <div className="flex flex-col items-center gap-4">

    <p
      className={`text-[11px] lg:text-[12px] font-semibold tracking-widest uppercase ${
        isDarkMode ? "text-zinc-600" : "text-zinc-400"
      }`}
    >
      Harder to open. Harder to quit.
    </p>

    <div
      className={`flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[12px] lg:text-[13px] ${
        isDarkMode ? "text-zinc-500" : "text-zinc-500"
      }`}
    >
      <a
        href="/privacy"
        className="hover:text-orange-500 transition-colors"
      >
        Privacy Policy
      </a>

      <span className="opacity-40">•</span>

      <a
        href="/terms"
        className="hover:text-orange-500 transition-colors"
      >
        Terms & Conditions
      </a>

      <span className="opacity-40">•</span>

      <a
        href="/contact"
        className="hover:text-orange-500 transition-colors"
      >
        Contact
      </a>
    </div>

    <p
      className={`text-[11px] ${
        isDarkMode ? "text-zinc-700" : "text-zinc-400"
      }`}
    >
      © {new Date().getFullYear()} NexSpace. All rights reserved.
    </p>

  </div>
</footer>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#000000]">
        <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
      </div>
    }>
      <LandingExperience />
    </Suspense>
  );
}