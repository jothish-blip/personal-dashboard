"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { Database } from "@/types/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleAuth = async () => {
      try {
        const supabase = getSupabaseClient();

        // 🔥 FIX: Use getUser instead of getSession
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          console.warn("No user after OAuth:", error);
          router.replace("/login");
          return;
        }

        // Prepare profile data
        const profileData: Database["public"]["Tables"]["profiles"]["Insert"] = {
          id: user.id,
          full_name: user.user_metadata?.full_name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
        };

        // Upsert profile
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(profileData as any);

        if (profileError) {
          console.error("Profile error:", profileError);
        }

        // ✅ Redirect to home
        router.replace("/");
        
      } catch (err) {
        console.error("Auth callback error:", err);
        router.replace("/login");
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-400 text-sm font-semibold uppercase">
          Finalizing Workspace...
        </div>
      </div>
    </div>
  );
}