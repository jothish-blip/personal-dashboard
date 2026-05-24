"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

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
        
        // Guard clause to ensure supabase is not null
        if (!supabase) {
          console.error("❌ Supabase client failed to initialize.");
          router.replace("/login");
          return;
        }

        const code = searchParams.get("code");

        // Only exchange if code exists in the URL
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("❌ Exchange failed:", error);
            router.replace("/login");
            return;
          }

          const user = data?.user;

          if (user) {
            // 1. Check if profile exists without overwriting current data
            // (Using 'as any' bypasses outdated local TS schema errors)
            const { data: existingProfile } = await (supabase as any)
              .from("profiles")
              .select("onboarding_completed")
              .eq("id", user.id)
              .maybeSingle();

            // 2. Safely insert a fresh profile if this is a brand new user
            if (!existingProfile) {
              const profileData: any = {
                id: user.id,
                full_name: user.user_metadata?.full_name ?? null,
                avatar_url: user.user_metadata?.avatar_url ?? null,
                updated_at: new Date().toISOString(),
                onboarding_completed: false, 
              };

              await (supabase as any).from("profiles").insert(profileData);
            }

            // 3. Fetch current status to route correctly
            const { data: routingCheck } = await (supabase as any)
              .from("profiles")
              .select("onboarding_completed")
              .eq("id", user.id)
              .maybeSingle();

            // 4. Redirect to onboarding if not completed
            if (!routingCheck?.onboarding_completed) {
              router.replace("/onboarding");
              return; // Halt execution so we don't hit the home redirect
            }
          }
        }

        // Redirect to home/dashboard for existing, onboarded users
        router.replace("/");
      } catch (err) {
        console.error("❌ Auth callback error:", err);
        router.replace("/login");
      }
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="flex flex-col items-center gap-3 animate-in fade-in duration-500">
        {/* Spinner */}
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        {/* Minimalist Text */}
        <div className="text-gray-400 text-sm font-medium tracking-wide">Securing session...</div>
      </div>
    </div>
  );
}