"use client";

import { ReactNode } from "react";
import PullToRefreshUI from "@/refresh/PullToRefreshUI";
import { ThemeProvider } from "@/theme/ThemeProvider";

export default function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {/* 🔥 Pull to Refresh UI handles its own hooks now! No props needed. */}
      <PullToRefreshUI />

      {children}
    </ThemeProvider>
  );
}