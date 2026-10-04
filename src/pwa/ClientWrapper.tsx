"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@/theme/ThemeProvider";
import AuthGuard from "@/authentication/components/AuthGuard/AuthGuard";

export default function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthGuard>
        {children}
      </AuthGuard>
    </ThemeProvider>
  );
}