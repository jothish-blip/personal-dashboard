"use client";

import { ReactNode } from "react";
import PullToRefreshUI from "@/hooks/PullToRefreshUI";
import { ThemeProvider } from "./ThemeProvider";

export default function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {/* 🔥 Pull to Refresh UI handles its own hooks now! No props needed. */}
      <PullToRefreshUI />

      {children}
    </ThemeProvider>
  );
}