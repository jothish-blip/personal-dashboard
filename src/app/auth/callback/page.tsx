"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { Database } from "@/types/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasRun.current) return;
    hasRun.current = true;

    const handleAuth = async () => {
      try {
        const supabase = getSupabaseClient();

        // 1. Get session (IMPORTANT for OAuth)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.warn("No session found after OAuth:", sessionError);
          router.replace("/login");
          return;
        }

        const user = session.user;

        // 2. Prepare profile data
        const profileData: Database["public"]["Tables"]["profiles"]["Insert"] = {
          id: user.id,
          full_name: user.user_metadata?.full_name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
        };

        // 3. Upsert profile
        // Cast to any to bypass strict Postgrest types if needed
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(profileData as any);

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }

        // 4. Successful auth and profile sync -> Go Home
        router.replace("/");
        
      } catch (err) {
        console.error("Auth callback exception:", err);
        router.replace("/login");
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="animate-pulse text-gray-400 text-sm font-semibold tracking-wide uppercase">
          Finalizing Workspace...
        </div>
      </div>
    </div>
  );
}