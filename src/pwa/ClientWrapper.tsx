"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@/theme/ThemeProvider";

export default function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {/* PullToRefreshUI has been removed to prevent scroll conflicts. 
        Refresh actions are now handled manually via the Navbar or background syncing.
      */}
      {children}
    </ThemeProvider>
  );
}