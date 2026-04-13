"use client";

import { ReactNode } from "react";
import PullToRefreshUI from "@/hooks/PullToRefreshUI"; // Adjust path if needed

export default function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      {/* 🔥 Pull to Refresh UI handles its own hooks now! No props needed. */}
      <PullToRefreshUI />

      {children}
    </>
  );
}