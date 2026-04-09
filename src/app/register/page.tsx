"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { FaGithub } from "react-icons/fa";
import { Loader2, ShieldCheck } from "lucide-react";

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
  const supabase = getSupabaseClient();
  
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Session State Awareness - Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/"); // Redirect to dashboard/home
      }
    };
    checkUser();
  }, [router, supabase]);

  // Progressive enhancement: OAuth handles both Sign Up and Sign In automatically
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

  return (
    <div className="min-h-screen flex bg-[#FAFAFA] text-gray-900 relative overflow-hidden selection:bg-indigo-100">
      
      {/* 🌌 DEPTH LAYERS: Ambient Light Background Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-indigo-200/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] rounded-full bg-blue-200/40 blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-[20vw] h-[20vw] rounded-full bg-orange-100/50 blur-[80px] pointer-events-none" />

      {/* 🖥️ LEFT SIDE: Brand & Emotion (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 relative z-10">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white shadow-sm border border-gray-200 rounded-xl flex items-center justify-center">
            <span className="font-bold text-lg text-gray-900">Nx</span>
          </div>
          <span className="font-semibold tracking-wide text-xl text-gray-900">
            NexTask <span className="text-orange-500 font-black text-sm">OS</span>
          </span>
        </div>

        {/* Emotional Copy */}
        <div className="max-w-xl">
          <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-[1.1] mb-6 text-gray-900">
            Build your system.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600">
              Not just your tasks.
            </span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed font-light">
            Your personal execution engine designed for deep work, relentless focus, and compounding daily growth. 
          </p>
        </div>

        {/* Trust Footer */}
        <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
          <ShieldCheck size={18} className="text-emerald-500" />
          Enterprise-grade encryption by Supabase
        </div>
      </div>

      {/* 📱 RIGHT SIDE / MOBILE: Auth Actions */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
        
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden flex flex-col items-center text-center mb-10 mt-8">
          <div className="w-12 h-12 bg-white shadow-sm border border-gray-200 rounded-2xl flex items-center justify-center mb-6">
            <span className="font-bold text-xl text-gray-900">Nx</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.1] mb-3 text-gray-900">
            Build your system.
          </h1>
          <p className="text-sm text-gray-500 px-4">
            Your execution engine for focus and growth.
          </p>
        </div>

        {/* ✨ PREMIUM LIGHT GLASS CARD */}
        <div className="w-full max-w-[420px] bg-white/70 backdrop-blur-2xl border border-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Initialize Your Account</h2>
            <p className="text-sm text-gray-500">Create your account to start building.</p>
          </div>

          {/* Provider Grid */}
          <div className="flex flex-col gap-4">
            
            {/* Google - Clean White */}
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={!!loadingProvider}
              className="group flex items-center justify-center gap-3 w-full min-h-[52px] rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold text-sm sm:text-base active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {loadingProvider === 'google' ? (
                <Loader2 size={18} className="animate-spin text-gray-500" />
              ) : (
                <>
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* GitHub - Solid Dark */}
            <button
              onClick={() => handleSocialLogin('github')}
              disabled={!!loadingProvider}
              className="group flex items-center justify-center gap-3 w-full min-h-[52px] rounded-xl bg-gray-900 border border-gray-900 text-white hover:bg-black hover:shadow-[0_4px_14px_rgba(0,0,0,0.2)] transition-all duration-200 font-semibold text-sm sm:text-base active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {loadingProvider === 'github' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <FaGithub className="text-xl" />
                  <span>Continue with GitHub</span>
                </>
              )}
            </button>

          </div>

          {/* Error UI */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-3 animate-in fade-in">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Mobile Trust Signals */}
          <div className="lg:hidden mt-8 flex justify-center items-center gap-2 text-[11px] text-gray-500 font-medium">
            <ShieldCheck size={14} className="text-emerald-500" />
            Secured by Supabase Auth
          </div>
        </div>

        {/* Login Link */}
        <p className="mt-8 text-sm text-gray-500 font-medium">
          Already have a system?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-gray-900 font-bold hover:text-orange-500 transition-colors underline decoration-gray-300 underline-offset-4 hover:decoration-orange-500"
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