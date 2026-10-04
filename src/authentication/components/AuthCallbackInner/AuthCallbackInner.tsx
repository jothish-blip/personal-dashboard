"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import {
  setLastLoggedInAccount,
  verifyAuthenticatedSession,
  ensureUserProfile,
  extractUserMetadata,
} from "@/lib/auth";

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

        // 1. Guard clause to ensure supabase is initialized
        if (!supabase) {
          console.error("❌ Supabase client failed to initialize.");
          router.replace("/login?error=" + encodeURIComponent("Client initialization failed"));
          return;
        }

        // 2. Check for explicit OAuth provider error parameters or user cancellation
        const oauthError = searchParams.get("error");
        const oauthErrorDesc = searchParams.get("error_description");

        if (oauthError) {
          // Graceful handling of user cancellation (e.g. access_denied)
          if (oauthError === "access_denied" || oauthErrorDesc?.includes("denied") || oauthErrorDesc?.includes("cancelled")) {
            console.log("ℹ️ OAuth was cancelled by user.");
            router.replace("/login");
            return;
          }

          console.error("❌ OAuth provider returned an error:", oauthError, oauthErrorDesc);
          const errorMsg = oauthErrorDesc || oauthError;
          router.replace("/login?error=" + encodeURIComponent(errorMsg));
          return;
        }

        const code = searchParams.get("code");
        let verifiedSession: { user: any; session: any } | null = null;

        // 3. Exchange authorization code for Supabase session if code exists
        if (code) {
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.warn("⚠️ Code exchange notice:", exchangeError.message);
            // In case code was already exchanged in a quick burst/prefetch, check for active session
            const existing = await verifyAuthenticatedSession();
            if (existing?.user && existing?.session) {
              verifiedSession = existing;
            } else {
              router.replace("/login?error=" + encodeURIComponent(exchangeError.message));
              return;
            }
          } else if (exchangeData?.user && exchangeData?.session) {
            verifiedSession = { user: exchangeData.user, session: exchangeData.session };
          }
        }

        // 4. Verify that a valid, authoritative authenticated session exists
        if (!verifiedSession) {
          verifiedSession = await verifyAuthenticatedSession();
        }

        if (!verifiedSession || !verifiedSession.user || !verifiedSession.session) {
          // If no code and no active session, user navigated to /auth/callback directly
          if (!code) {
            router.replace("/login");
            return;
          }
          console.error("❌ Invalid or unverified session after callback.");
          router.replace("/login?error=" + encodeURIComponent("Authentication verification failed"));
          return;
        }

        const user = verifiedSession.user;

        // 5. Ensure the NexSpace profile belongs to that exact auth.users.id
        const profileOk = await ensureUserProfile(user);
        if (!profileOk) {
          console.warn("⚠️ User profile check completed with warning; proceeding to dashboard.");
        }

        // 6. Record last logged-in account metadata with full provider profile image
        const meta = extractUserMetadata(user);
        setLastLoggedInAccount({
          email: user.email,
          name: meta.name,
          avatar_url: meta.avatar_url,
          provider: meta.provider,
        });

        // 7. Direct entry into NexSpace (no onboarding wall or reading material)
        router.replace("/");
      } catch (err: any) {
        console.error("❌ Auth callback error:", err);
        router.replace("/login?error=" + encodeURIComponent(err?.message || "An unexpected error occurred"));
      }
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] transition-colors duration-300">
      <div className="flex flex-col items-center gap-3 animate-in fade-in duration-500">
        <div className="w-10 h-10 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <span className="text-xs text-[var(--muted)] font-medium">Verifying authentication...</span>
      </div>
    </div>
  );
}