"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { FaGithub } from "react-icons/fa";

// Official Google SVG Icon
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.85-6.85C35.91 2.14 30.4 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.36 13.4 17.72 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v9h12.4c-.54 2.9-2.2 5.36-4.7 7.02l7.26 5.64C43.96 37.36 46.1 31.4 46.1 24.5z"/>
    <path fill="#FBBC05" d="M10.54 28.42A14.5 14.5 0 019.5 24c0-1.53.26-3 .72-4.38l-7.98-6.2A23.96 23.96 0 000 24c0 3.87.92 7.53 2.56 10.78l7.98-6.36z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.91-2.14 15.88-5.8l-7.26-5.64c-2.02 1.36-4.6 2.18-8.62 2.18-6.28 0-11.64-3.9-13.46-9.92l-7.98 6.36C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();
  
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Check for Registration Success Banner
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMsg("Account created successfully! Please sign in.");
    }
  }, [searchParams]);

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

  // Progressive enhancement: accepts any string provider
  const handleSocialLogin = async (provider: string) => {
    if (loadingProvider) return; // Prevent double clicks / race conditions
    
    setLoadingProvider(provider);
    setError("");
    setSuccessMsg("");
    
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
        setError("Login cancelled.");
      } else {
        setError("Connection failed. Check your internet or try again.");
      }
      setLoadingProvider(null);
    }
  };

  return (
    <div className="relative min-h-screen flex items-start justify-center pt-12 pb-[env(safe-area-inset-bottom)] bg-gradient-to-br from-white via-gray-50 to-gray-100 px-4 overflow-hidden">
      
      {/* Subtle Background Motion - Hidden on mobile for performance */}
      <div className="hidden sm:block absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gray-200/40 rounded-full blur-3xl animate-pulse" />
      <div className="hidden sm:block absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gray-200/30 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md bg-white border border-gray-200 rounded-3xl px-4 py-6 sm:px-5 sm:py-8 shadow-sm transition-all duration-300 animate-in fade-in">
        
        {/* Registration Success Banner */}
        {successMsg && (
          <div className="mb-6 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100 animate-in slide-in-from-top-2">
            <span className="text-base">✨</span>
            <p className="text-xs sm:text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {/* Branding Identity */}
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">
          NexTask OS
        </div>

        {/* Header Section */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
            Welcome back
          </h2>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed max-w-xs mx-auto">
            Sign in to pick up right where you left off.
          </p>
          
          {/* Focus Cue */}
          <div className="mt-3 text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              Resume Focus Mode
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Sign in
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Provider Grid */}
        <div className="mt-8 flex flex-col gap-3.5">
          {/* Google - INDUSTRY STANDARD ACTION */}
          <button
            onClick={() => handleSocialLogin('google')}
            onKeyDown={(e) => e.key === "Enter" && handleSocialLogin('google')}
            disabled={!!loadingProvider}
            className="flex items-center justify-center gap-3 w-full min-h-[52px] rounded-xl bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 hover:shadow-md hover:-translate-y-[1px] transition-all font-semibold text-base active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-black/10 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {loadingProvider === 'google' ? (
              <>
                <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* GitHub - IDENTITY DRIVEN ACTION */}
          <button
            onClick={() => handleSocialLogin('github')}
            disabled={!!loadingProvider}
            className="flex items-center justify-center gap-3 w-full min-h-[52px] rounded-xl bg-gray-900 text-white hover:bg-black hover:shadow-md hover:-translate-y-[1px] transition-all font-semibold text-base active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-black/10 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {loadingProvider === 'github' ? (
              <>
                <span className="w-4 h-4 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                <span>Connecting to GitHub...</span>
              </>
            ) : (
              <>
                <FaGithub className="text-xl" />
                <span>Sign in with GitHub</span>
              </>
            )}
          </button>
        </div>

        {/* Error Handling UI */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 shadow-sm rounded-lg flex items-center justify-center gap-2 text-red-600 text-sm sm:text-xs font-medium animate-in fade-in">
            <span className="text-base">⚠️</span> {error}
          </div>
        )}

        {/* Link to Register */}
        <p className="text-xs text-center mt-8 text-gray-500">
          Don't have an account?{" "}
          <button
            onClick={() => router.push("/register")}
            className="text-gray-900 font-bold hover:underline transition-all"
          >
            Create one
          </button>
        </p>

        {/* Footer / Trust Signals */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 text-center flex flex-col items-center gap-1.5">
            <span>End-to-end encrypted session</span>
            <span className="flex items-center gap-1">
              Secured by <span className="font-bold text-emerald-600">Supabase Auth</span>
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}