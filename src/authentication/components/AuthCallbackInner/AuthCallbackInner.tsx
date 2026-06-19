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

        // Initial session check for back-navigation protection
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (!code && !existingSession) {
          router.replace("/login");
          return;
        }

        // Only exchange if code exists in the URL
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("❌ Exchange failed:", error);
            router.replace("/login");
            return;
          }
        }

        // Verify session existence after exchange
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          console.error("❌ Invalid session");
          router.replace("/login");
          return;
        }

        if (!session.user) {
          console.error("❌ Invalid user");
          router.replace("/login");
          return;
        }

        const user = session.user;

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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] transition-colors duration-300">
      <div className="flex flex-col items-center gap-3 animate-in fade-in duration-500">
        {/* Premium Spinner */}
        <div className="w-10 h-10 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    </div>
  );
}