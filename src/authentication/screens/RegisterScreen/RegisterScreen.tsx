"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FaGithub, FaDiscord } from "react-icons/fa";
import { Loader2, ShieldCheck, Sun, Moon } from "lucide-react";

// 🔥 UPDATE THIS PATH to match your ThemeProvider location
import { useTheme } from "@/theme/ThemeProvider";

// Official Google SVG Icon
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.85-6.85C35.91 2.14 30.4 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.36 13.4 17.72 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v9h12.4c-.54 2.9-2.2 5.36-4.7 7.02l7.26 5.64C43.96 37.36 46.1 31.4 46.1 24.5z"/>
    <path fill="#FBBC05" d="M10.54 28.42A14.5 14.5 0 019.5 24c0-1.53.26-3 .72-4.38l-7.98-6.2A23.96 23.96 0 000 24c0 3.87.92 7.53 2.56 10.78l7.98-6.36z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.91-2.14 15.88-5.8l-7.26-5.64c-2.02 1.36-4.6 2.18-8.62 2.18-6.28 0-11.64-3.9-13.46-9.92l-7.98 6.36C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

function RegisterContent() {
  const router = useRouter();
  
  const { isDarkMode, toggleTheme } = useTheme(); 
  
  const [checkingSession, setCheckingSession] = useState(true);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/");
      } else {
        setCheckingSession(false);
      }
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !loadingProvider) {
        handleSocialLogin("google");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loadingProvider]);

  const handleSocialLogin = async (provider: string) => {
    if (loadingProvider) return; 
    
    setLoadingProvider(provider);
    setError("");
    
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({ 
        provider: provider as any, 
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (authError) throw authError;
    } catch (err: any) {
      if (err.message?.toLowerCase().includes("popup_closed")) {
        setError("Registration cancelled.");
      } else {
        setError("Connection failed. Please try again.");
      }
      setLoadingProvider(null);
    }
  };

  if (checkingSession) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-300 select-none ${isDarkMode ? "bg-[#050505] text-white" : "bg-[#FAFAFA] text-gray-900"}`}>
        <div className="w-12 h-12 bg-[#111111] border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-lg animate-pulse">
          <img src="/favicon.ico" alt="NexTask" className="w-6 h-6 object-contain" />
        </div>
        <Loader2 className={`w-5 h-5 mb-4 animate-spin ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
        <p className={`text-xs font-medium tracking-widest uppercase animate-pulse ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
          Initializing workspace...
        </p>
      </div>
    );
  }

  const getProviderName = (id: string | null) => {
    if (id === 'google') return 'Google';
    if (id === 'github') return 'GitHub';
    if (id === 'discord') return 'Discord';
    return '';
  };

  return (
    <div 
      style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
      className={`min-h-screen flex relative overflow-hidden transition-colors duration-500 select-none animate-in fade-in duration-1000 ${
        isDarkMode 
          ? "bg-[#050505] text-white selection:bg-indigo-900" 
          : "bg-[#FAFAFA] text-[#111827] selection:bg-indigo-100"
      }`}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatIdle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
      `}} />

      {loadingProvider && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="w-14 h-14 bg-[#111111] border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-2xl animate-pulse">
            <img src="/favicon.ico" alt="NexTask" className="w-7 h-7 object-contain" />
          </div>
          <div className={`px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-md shadow-xl border ${
            isDarkMode ? "bg-[#111111]/90 border-gray-800 text-gray-200" : "bg-white/90 border-gray-200 text-gray-800"
          }`}>
            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
            <span className="font-semibold text-sm">Connecting to {getProviderName(loadingProvider)}...</span>
          </div>
        </div>
      )}

      <div className={`absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full blur-[120px] pointer-events-none transition-colors duration-700 delay-200 ${isDarkMode ? "bg-indigo-900/[0.12]" : "bg-indigo-200/30"}`} />
      <div className={`absolute bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] rounded-full blur-[100px] pointer-events-none transition-colors duration-700 delay-300 ${isDarkMode ? "bg-blue-900/[0.12]" : "bg-blue-200/30"}`} />
      <div className={`absolute top-[40%] left-[60%] w-[20vw] h-[20vw] rounded-full blur-[80px] pointer-events-none transition-colors duration-700 delay-500 ${isDarkMode ? "bg-orange-900/[0.12]" : "bg-orange-100/40"}`} />

      <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 relative z-10 animate-in fade-in slide-in-from-left-8 duration-1000 delay-100 fill-mode-both">
        
        <div className="flex items-center gap-3">
          <div 
            className="w-11 h-11 bg-[#111111] border border-white/10 rounded-2xl flex items-center justify-center shadow-sm hover:scale-[1.03] transition-all duration-300 cursor-pointer"
            style={{ animation: 'floatIdle 6s ease-in-out infinite' }}
          >
            <img src="/favicon.ico" alt="NexTask" className="w-6 h-6 object-contain" />
          </div>
          <span className={`font-semibold tracking-wide text-xl flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            NexTask 
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isDarkMode ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
              v1.2
            </span>
          </span>
        </div>

        <div className="max-w-xl">
          <h1 className={`text-[56px] xl:text-[64px] whitespace-nowrap font-black tracking-[-0.03em] leading-[1.05] mb-8 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}>
            Build your system.<br />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${
              isDarkMode ? "from-gray-500 to-gray-300" : "from-gray-400 to-gray-600"
            }`}>
              Not just your tasks.
            </span>
          </h1>
          
          <div className={`flex flex-col text-[10px] sm:text-xs font-bold tracking-[0.25em] leading-loose mb-10 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
            <span>HARDER TO OPEN</span>
            <span>HARDER TO CLOSE</span>
          </div>

          <div className={`text-lg leading-relaxed font-light space-y-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            <p>Built for deep work.</p>
            <p>Designed for consistency.</p>
            <p>Made for compound growth.</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          <ShieldCheck size={18} className={isDarkMode ? "text-gray-600" : "text-gray-400"} />
          Secure sign in. Private by default.
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
        
        <div className="lg:hidden flex flex-col items-center text-center mb-10 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          <div 
            className="w-[52px] h-[52px] bg-[#111111] border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm hover:scale-[1.03] transition-all duration-300"
            style={{ animation: 'floatIdle 6s ease-in-out infinite' }}
          >
            <img src="/favicon.ico" alt="NexTask" className="w-7 h-7 object-contain" />
          </div>
          <h1 className={`text-3xl sm:text-4xl font-black tracking-tight leading-[1.1] mb-6 max-w-[300px] mx-auto ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Build your system.
          </h1>
          
          <div className={`flex flex-col text-[10px] font-bold tracking-[0.25em] leading-loose mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
            <span>HARDER TO OPEN</span>
            <span>HARDER TO CLOSE</span>
          </div>
          
          <p className={`text-xs mt-2 font-medium ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            Deep work. Consistency. Growth.
          </p>
        </div>

        <div className={`relative w-full max-w-[390px] backdrop-blur-2xl rounded-3xl p-6 sm:p-10 transition-all duration-500 border animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both ${
          isDarkMode 
            ? "bg-[#111111]/80 border-gray-800 shadow-[0_0_40px_rgba(249,115,22,0.04)]" 
            : "bg-white/80 border-gray-100 shadow-[0_10px_50px_rgba(0,0,0,0.06)]"
        }`}>
          
          <button
            onClick={toggleTheme}
            className={`absolute top-5 right-5 sm:top-6 sm:right-6 w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center group transition-all duration-300 active:scale-95 ${
              isDarkMode 
                ? "bg-[#1A1A1A] border-gray-800 text-gray-400 hover:text-orange-400 hover:border-gray-700" 
                : "bg-gray-50 border-gray-200 text-gray-500 hover:text-indigo-500 hover:border-gray-300"
            }`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun size={16} className="transition-transform group-hover:rotate-45" />
            ) : (
              <Moon size={16} className="transition-transform group-hover:-rotate-12" />
            )}
          </button>

          <div className="text-center mb-8 pr-12">
            <h2 className={`text-2xl font-bold tracking-tight mb-2 ${isDarkMode ? "text-white" : "text-[#111827]"}`}>
              Create Account
            </h2>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Sign up to initialize your workspace.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={!!loadingProvider}
              className={`group relative flex items-center justify-center gap-3 w-full min-h-[56px] rounded-xl font-semibold text-base active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 border hover:-translate-y-[1px] hover:shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500 delay-[150ms] fill-mode-both ${
                isDarkMode 
                  ? "bg-[#0a0a0a] border-gray-700 text-[#E5E7EB] hover:bg-[#1f1f1f] hover:border-gray-600" 
                  : "bg-white border-gray-200 text-[#374151] hover:bg-[#F9FAFB] hover:border-gray-300 shadow-sm"
              }`}
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => handleSocialLogin('github')}
              disabled={!!loadingProvider}
              className={`group flex items-center justify-center gap-3 w-full min-h-[52px] rounded-xl font-semibold text-sm sm:text-base active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 border hover:-translate-y-[1px] hover:shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500 delay-[250ms] fill-mode-both ${
                isDarkMode 
                  ? "bg-[#ffffff] border-[#ffffff] text-[#111827] hover:bg-[#f3f4f6]" 
                  : "bg-[#24292f] border-[#24292f] text-[#ffffff] hover:bg-[#1b1f23]"
              }`}
            >
              <FaGithub className="text-xl" />
              <span>Continue with GitHub</span>
            </button>

            <button
              onClick={() => handleSocialLogin("discord")}
              disabled={!!loadingProvider}
              className="group flex items-center justify-center gap-3 w-full min-h-[52px] rounded-xl bg-[#5865F2] border border-[#5865F2] text-[#ffffff] hover:bg-[#4752C4] transition-all duration-300 font-semibold text-sm sm:text-base active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-[1px] hover:shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500 delay-[350ms] fill-mode-both"
            >
              <FaDiscord className="text-xl" />
              <span>Continue with Discord</span>
            </button>

          </div>

          {error && (
            <div className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in border select-text ${
              isDarkMode 
                ? "bg-red-900/20 border-red-800/50 text-red-400" 
                : "bg-red-50 border-red-100 text-red-600"
            }`}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div className={`lg:hidden mt-8 flex justify-center items-center gap-2 text-[11px] font-medium ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            <ShieldCheck size={14} className={isDarkMode ? "text-gray-600" : "text-gray-400"} />
            Secure sign in. Private by default.
          </div>
        </div>

        <p className={`mt-8 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-[500ms] fill-mode-both ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Already have a system?{" "}
          <button
            onClick={() => router.replace("/login")}
            className={`font-bold transition-colors underline underline-offset-4 ${
              isDarkMode 
                ? "text-white decoration-gray-700 hover:text-orange-400 hover:decoration-orange-400" 
                : "text-[#111827] decoration-gray-300 hover:text-orange-500 hover:decoration-orange-500"
            }`}
          >
            Sign in
          </button>
        </p>

      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}