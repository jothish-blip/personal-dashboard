"use client";

import React, { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { clearUserDataOnLogout } from "@/lib/auth";

const PUBLIC_EXEMPT_ROUTES = [
  "/auth/callback",
  "/privacy",
  "/terms",
  "/contact",
  "/help",
  "/not-found",
];

const AUTH_PAGES = ["/login", "/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isPublicExempt = PUBLIC_EXEMPT_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );
  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isProtectedRoute = !isPublicExempt && !isAuthPage;

  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated">(
    isProtectedRoute ? "checking" : "unauthenticated"
  );

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          setAuthStatus("authenticated");
          if (isAuthPage) {
            startTransition(() => {
              router.replace("/");
            });
          }
        } else {
          setAuthStatus("unauthenticated");
          if (isProtectedRoute) {
            clearUserDataOnLogout();
            startTransition(() => {
              router.replace("/login");
            });
          }
        }
      } catch (err) {
        console.error("AuthGuard session check error:", err);
        if (isMounted) {
          setAuthStatus("unauthenticated");
          if (isProtectedRoute) {
            clearUserDataOnLogout();
            startTransition(() => {
              router.replace("/login");
            });
          }
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT" || !session) {
        setAuthStatus("unauthenticated");
        if (isProtectedRoute) {
          clearUserDataOnLogout();
          startTransition(() => {
            router.replace("/login");
          });
        }
      } else if (session?.user) {
        setAuthStatus("authenticated");
        if (isAuthPage) {
          startTransition(() => {
            router.replace("/");
          });
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [pathname, isAuthPage, isProtectedRoute, router]);

  // Public informational pages are always visible without blocking
  if (isPublicExempt) {
    return <>{children}</>;
  }

  // Auth pages (login/register) render immediately if unauthenticated
  if (isAuthPage) {
    if (authStatus === "authenticated") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      );
    }
    return <>{children}</>;
  }

  // Protected pages require an authenticated session
  if (isProtectedRoute) {
    if (authStatus !== "authenticated") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      );
    }
  }

  return <>{children}</>;
}
