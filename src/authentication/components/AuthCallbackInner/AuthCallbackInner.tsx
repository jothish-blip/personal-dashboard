"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { Database } from "@/types/supabase";

export default function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasRun.current) return;
    hasRun.current = true;

    const handleAuth = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // 🔥 FIX: Guard clause to ensure supabase is not null
        if (!supabase) {
          console.error("❌ Supabase client failed to initialize.");
          router.replace("/login");
          return;
        }

        const code = searchParams.get("code");

        // 🔥 Only exchange if code exists in the URL
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("❌ Exchange failed:", error);
            router.replace("/login");
            return;
          }

          const user = data?.user;

          // Upsert profile data if user exists
          if (user) {
            const profileData: Database["public"]["Tables"]["profiles"]["Insert"] = {
              id: user.id,
              full_name: user.user_metadata?.full_name ?? null,
              avatar_url: user.user_metadata?.avatar_url ?? null,
              updated_at: new Date().toISOString(),
            };

            await supabase.from("profiles").upsert(profileData as any);
          }
        }

        // Redirect to home/dashboard
        router.replace("/");
      } catch (err) {
        console.error("❌ Auth callback error:", err);
        router.replace("/login");
      }
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        {/* Spinner */}
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        {/* Minimalist Text */}
        <div className="text-gray-400 text-sm font-medium">Loading...</div>
      </div>
    </div>
  );
}