"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { Loader2, Shield, LogOut } from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider"; // 🔥 Updated Import Path

export default function SecurityPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state

  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setEmail(session.user.email ?? null);

        const rawProvider = session.user.app_metadata?.provider;

        if (rawProvider) {
          setProvider(
            rawProvider.charAt(0).toUpperCase() + rawProvider.slice(1)
          );
        }
      }

      setLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setEmail(session.user.email ?? null);

        const rawProvider = session.user.app_metadata?.provider;

        setProvider(
          rawProvider
            ? rawProvider.charAt(0).toUpperCase() + rawProvider.slice(1)
            : "OAuth"
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogoutAll = async () => {
    if (!supabase) return;
    
    await supabase.auth.signOut();
    router.replace("/login"); // Safer client-side redirect
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className={`animate-spin ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">

      {/* Header */}
      <div>
        <h1 className={`text-2xl md:text-3xl font-bold transition-colors ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}>
          Security
        </h1>
        <p className={`text-sm mt-1 transition-colors ${
          isDarkMode ? "text-gray-400" : "text-gray-500"
        }`}>
          Manage your account security and authentication.
        </p>
      </div>

      {/* Authentication */}
      <div className="space-y-4">
        <h2 className={`text-xs font-semibold uppercase tracking-wide transition-colors ${
          isDarkMode ? "text-gray-500" : "text-gray-400"
        }`}>
          Authentication
        </h2>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Shield size={16} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
            <div>
              <p className={`text-sm font-medium transition-colors ${
                isDarkMode ? "text-gray-200" : "text-gray-800"
              }`}>
                Signed in with {provider || "OAuth"}
              </p>
              <p className={`text-xs transition-colors ${
                isDarkMode ? "text-gray-500" : "text-gray-500"
              }`}>
                {email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Explanation Note */}
      <div className={`rounded-2xl border px-4 py-4 transition-colors ${
        isDarkMode 
          ? "border-amber-900/40 bg-amber-950/20" 
          : "border-amber-100 bg-amber-50"
      }`}>
        <p className={`text-sm leading-relaxed transition-colors ${
          isDarkMode ? "text-amber-300" : "text-amber-800"
        }`}>
          💡 You signed in using{" "}
          <span className="font-semibold">
            {provider || "an OAuth provider"}
          </span>.
          If you selected a Google account while logging in to GitHub or Discord,
          you may still see your Google email or account name here. This is normal —
          your connected providers are securely linked to the same Nextask account.
        </p>
      </div>

      {/* Account Actions */}
      <div className={`space-y-4 pt-6 border-t transition-colors ${
        isDarkMode ? "border-gray-800" : "border-gray-100"
      }`}>
        <h2 className={`text-xs font-semibold uppercase tracking-wide transition-colors ${
          isDarkMode ? "text-gray-500" : "text-gray-400"
        }`}>
          Account Actions
        </h2>

        <button
          onClick={handleLogoutAll}
          className={`flex items-center gap-3 text-sm transition-colors ${
            isDarkMode 
              ? "text-red-400 hover:text-red-300" 
              : "text-red-600 hover:text-red-700"
          }`}
        >
          <LogOut size={16} />
          Sign out from this device
        </button>
      </div>

      {/* Info */}
      <div className={`pt-6 border-t text-xs leading-relaxed transition-colors ${
        isDarkMode 
          ? "border-gray-800 text-gray-500" 
          : "border-gray-100 text-gray-400"
      }`}>
        You are signed in using a third-party provider. Password management is handled by your provider (Google, GitHub, etc).
      </div>

    </div>
  );
}