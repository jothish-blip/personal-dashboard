"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme/ThemeProvider";
import { Moon, Sun, Loader2 } from "lucide-react";
import { FaGithub, FaDiscord } from "react-icons/fa";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.85-6.85C35.91 2.14 30.4 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.36 13.4 17.72 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v9h12.4c-.54 2.9-2.2 5.36-4.7 7.02l7.26 5.64C43.96 37.36 46.1 31.4 46.1 24.5z"/>
    <path fill="#FBBC05" d="M10.54 28.42A14.5 14.5 0 019.5 24c0-1.53.26-3 .72-4.38l-7.98-6.2A23.96 23.96 0 000 24c0 3.87.92 7.53 2.56 10.78l7.98-6.36z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.91-2.14 15.88-5.8l-7.26-5.64c-2.02 1.36-4.6 2.18-8.62 2.18-6.28 0-11.64-3.9-13.46-9.92l-7.98 6.36C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();

  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/");
      } else {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (provider: "google" | "github" | "discord") => {
    if (loadingProvider) return;
    setLoadingProvider(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (checkingSession) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#050505]" : "bg-[#F8F8F8]"}`}>
        <Loader2 className="animate-spin text-orange-500 w-6 h-6" />
      </div>
    );
  }

  return (
    <main
      className={`min-h-screen relative overflow-hidden transition-colors duration-700 ${
        isDarkMode ? "bg-[#050505] text-white" : "bg-[#F8F8F8] text-zinc-900"
      }`}
    >
      {/* Ultra-calm Keyframes for Productivity Trust */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-back {
          0%, 100% { transform: translateY(0) rotate(-0.5deg); }
          50% { transform: translateY(-2px) rotate(-0.2deg); }
        }
        @keyframes float-mid {
          0%, 100% { transform: translateY(0) rotate(2deg); }
          50% { transform: translateY(-3px) rotate(2.5deg); }
        }
        @keyframes float-front {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-4px) rotate(-0.5deg); }
        }
      `}} />

      {/* Global Environmental Glow Backgrounds */}
      <div className="absolute top-[-150px] left-[-50px] w-[500px] h-[500px] bg-orange-500/[0.04] blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[5%] w-[600px] h-[600px] bg-orange-500/[0.03] blur-[150px] rounded-full pointer-events-none" />

      {/* Luxury Digital Grain */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />

      {/* Focused Top Navigation */}
      <nav className="absolute top-0 left-0 w-full px-6 sm:px-12 py-8 z-50 flex items-center justify-between">
        
        {/* Left: Minimal Logo */}
        <div 
          onClick={() => router.push("/")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img src="/favicon.ico" className="w-8 h-8 group-hover:scale-105 transition-transform duration-500 ease-out" />
          <div className="hidden sm:block">
            <div className="font-semibold text-[14px] tracking-tight leading-tight">NexTask</div>
            <div className="text-[11px] text-zinc-500 font-medium tracking-wide">Build consistency</div>
          </div>
        </div>

        {/* Right: Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500 ${
            isDarkMode
              ? "text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.02]"
              : "text-zinc-400 hover:text-zinc-500 hover:bg-black/[0.02]"
          }`}
        >
          {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </nav>

      <section className="relative z-10 min-h-screen grid lg:grid-cols-[48%_52%] pt-16 lg:pt-0">

        {/* LEFT SIDE: Luxury Space & Layered Composition */}
        <div className="hidden lg:flex flex-col justify-start pt-[25vh] pl-24 pr-8 relative min-h-screen">
          
          <div className="mb-10 relative z-20">
            <h1 className="text-[52px] font-semibold leading-[1.1] tracking-[-0.04em] mb-5">
              Welcome back.
              <br />
              <span className={`transition-colors duration-500 ${isDarkMode ? "text-zinc-500" : "text-zinc-400"}`}>
                Continue where
                <br />
                you left off.
              </span>
            </h1>

            <p className={`text-[16px] max-w-[390px] leading-[1.75] font-medium ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
              Your tasks, focus sessions, plans and reflections are waiting. Let's keep the momentum going.
            </p>
          </div>

          <div className="relative h-[360px] w-full max-w-[480px] -mt-2 ml-4">
            <div className="absolute top-[40%] right-[-10%] w-[450px] h-[450px] bg-orange-500/[0.07] blur-[120px] rounded-full pointer-events-none z-0 animate-pulse" style={{ animationDuration: '6s' }} />

            {/* Planner (Back Layer - Tucked) */}
            <img
              src="/images/module-planner.png"
              className="absolute top-[8%] right-[12%] w-[42%] rounded-[20px] border border-white/10 shadow-2xl z-0 filter brightness-[0.85]"
              style={{ animation: 'float-back 9s ease-in-out infinite' }}
            />

            {/* Focus (Middle Layer - Subtler) */}
            <img
              src="/images/module-focus.png"
              className="absolute bottom-[22%] right-[32%] w-[32%] rounded-[16px] border border-white/10 shadow-2xl z-10 filter brightness-[0.95]"
              style={{ animation: 'float-mid 7s ease-in-out infinite' }}
            />

            {/* Tasks (Front Layer - Dominant anchor) */}
            <img
              src="/images/module-tasks.png"
              className="absolute top-[16%] left-[-2%] w-[82%] rounded-[24px] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] z-20"
              style={{ animation: 'float-front 8s ease-in-out infinite' }}
            />
          </div>
        </div>

        {/* RIGHT SIDE: Floating Ambient Auth Stack */}
        <div className="flex flex-col items-center justify-start lg:pt-[28vh] px-6 sm:px-12 w-full">
          
          <div className="block lg:hidden w-full max-w-[420px] mb-8 text-center sm:text-left mt-2">
            <h2 className="text-[36px] font-semibold tracking-[-0.04em] leading-tight">
              Welcome back.
            </h2>
            <p className={`mt-2.5 text-[15px] ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
              Continue where you left off.
            </p>
          </div>

          <div className="w-full max-w-[420px] relative transition-all duration-500 lg:mt-[10vh]">
            
            <div className="mb-6 text-center lg:text-left flex flex-col items-center lg:items-start">
              <h3 className={`text-[16px] font-medium tracking-tight ${isDarkMode ? "text-zinc-300" : "text-zinc-700"}`}>
                Continue to NexTask
              </h3>
              <p className={`text-[13px] mt-1 ${isDarkMode ? "text-zinc-500" : "text-zinc-400"}`}>
                Restore your tasks, focus sessions and planning history.
              </p>
            </div>

            <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[320px] h-[320px] bg-orange-500/[0.03] blur-[80px] rounded-full pointer-events-none" />

            {/* Adjusted Button Hierarchy */}
            <div className="relative z-10 space-y-3.5">
              
              {/* Google - Primary Weight */}
              <button
                onClick={() => handleLogin("google")}
                disabled={!!loadingProvider}
                className={`w-full h-[62px] sm:h-[68px] px-6 rounded-[24px] border flex items-center justify-center gap-3.5 font-medium text-[15px] transition-all duration-500 group ${
                  isDarkMode
                    ? "bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.06] hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] disabled:opacity-50"
                    : "bg-white/90 border-black/10 text-zinc-900 hover:bg-white hover:border-black/[0.15] hover:shadow-md disabled:opacity-50"
                }`}
              >
                {loadingProvider === "google" ? (
                  <><Loader2 className="animate-spin w-4 h-4 text-orange-500" /> Authenticating with Google...</>
                ) : (
                  <>
                    <div className="group-hover:scale-105 transition-transform duration-500 ease-out"><GoogleIcon /></div>
                    Continue with Google
                  </>
                )}
              </button>

              {/* GitHub - Secondary Weight */}
              <button
                onClick={() => handleLogin("github")}
                disabled={!!loadingProvider}
                className={`w-full h-[62px] sm:h-[68px] px-6 rounded-[24px] border flex items-center justify-center gap-3.5 font-medium text-[15px] transition-all duration-500 group ${
                  isDarkMode
                    ? "bg-white/[0.015] border-white/[0.03] text-zinc-300 hover:bg-white/[0.04] hover:text-white hover:border-white/[0.06] hover:shadow-[0_8px_30px_rgba(255,255,255,0.02)] disabled:opacity-50"
                    : "bg-white/50 border-black/[0.04] text-zinc-700 hover:bg-white/80 hover:border-black/[0.08] hover:shadow-sm disabled:opacity-50"
                }`}
              >
                {loadingProvider === "github" ? (
                  <><Loader2 className="animate-spin w-4 h-4 text-orange-500" /> Authenticating with GitHub...</>
                ) : (
                  <>
                    <FaGithub size={18} className="opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out" />
                    Continue with GitHub
                  </>
                )}
              </button>

              {/* Discord - Secondary Weight */}
              <button
                onClick={() => handleLogin("discord")}
                disabled={!!loadingProvider}
                className={`w-full h-[62px] sm:h-[68px] px-6 rounded-[24px] border flex items-center justify-center gap-3.5 font-medium text-[15px] transition-all duration-500 group ${
                  isDarkMode
                    ? "bg-white/[0.015] border-white/[0.03] text-zinc-300 hover:bg-white/[0.04] hover:text-white hover:border-white/[0.06] hover:shadow-[0_8px_30px_rgba(255,255,255,0.02)] disabled:opacity-50"
                    : "bg-white/50 border-black/[0.04] text-zinc-700 hover:bg-white/80 hover:border-black/[0.08] hover:shadow-sm disabled:opacity-50"
                }`}
              >
                {loadingProvider === "discord" ? (
                  <><Loader2 className="animate-spin w-4 h-4 text-orange-500" /> Authenticating with Discord...</>
                ) : (
                  <>
                    <FaDiscord size={18} className="text-[#5865F2]/80 group-hover:text-[#5865F2] group-hover:scale-105 transition-all duration-500 ease-out" />
                    Continue with Discord
                  </>
                )}
              </button>
            </div>

            {/* Provider Reassurance */}
            <div className={`mt-4 text-center ${loadingProvider ? 'hidden' : 'block'}`}>
              <p className={`text-[12px] ${isDarkMode ? "text-zinc-600" : "text-zinc-400"}`}>
                We never post anything to your accounts.
              </p>
            </div>

            {/* Premium Loading Intercept */}
            {loadingProvider && (
              <div className="mt-8 flex flex-col items-center justify-center gap-2">
                <div className="text-[14px] font-medium text-orange-500/90 animate-pulse">
                  Preparing your workspace...
                </div>
              </div>
            )}

            {/* Register CTA (Intentional Onboarding Choice) */}
            <div className={`mt-10 ${loadingProvider ? 'hidden' : 'block'}`}>
              <div className="text-center flex flex-col sm:flex-row items-center justify-center gap-2">
                <span className={`text-[14px] ${isDarkMode ? "text-zinc-500" : "text-zinc-500"}`}>
                  New to NexTask?
                </span>
                <button
                  onClick={() => router.push("/register")}
                  className="text-[14px] font-semibold text-orange-500 hover:text-orange-400 transition-colors"
                >
                  Create your account
                </button>
              </div>
            </div>
            
          </div>

          {/* Footer Trust Row (Aligned to SaaS Value) */}
          <div className="mt-10 flex justify-center gap-4 text-[12px] font-medium tracking-wide opacity-50 text-zinc-500 pointer-events-none selection:bg-transparent">
            <span>Private</span>
            <span>•</span>
            <span>Secure OAuth</span>
            <span>•</span>
            <span>Cross-device sync</span>
          </div>

        </div>
      </section>
    </main>
  );
}