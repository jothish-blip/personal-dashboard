"use client";

import { ReactNode, useEffect } from "react";
import PullToRefreshUI from "@/refresh/PullToRefreshUI";
import { ThemeProvider } from "@/theme/ThemeProvider";

export default function ClientWrapper({ children }: { children: ReactNode }) {
  // FIX 10: Debug logs to trace remounts
  useEffect(() => {
    console.log("ClientWrapper Mounted");

    return () => {
      console.log("ClientWrapper Unmounted");
    };
  }, []);

  return (
    <ThemeProvider>
      <PullToRefreshUI />
      {children}
    </ThemeProvider>
  );
}