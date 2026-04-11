"use client";

import { ReactNode } from "react";
import { useGlobalRefresh } from "@/hooks/useGlobalRefresh";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshUI from "@/hooks/PullToRefreshUI";

export default function ClientWrapper({ children }: { children: ReactNode }) {
  const { refreshPage } = useGlobalRefresh();

  const { pullDistance, readyToRefresh } =
    usePullToRefresh(refreshPage);

  return (
    <>
      {/* 🔥 Pull to Refresh UI */}
      <PullToRefreshUI
        pullDistance={pullDistance}
        ready={readyToRefresh}
      />

      {children}
    </>
  );
}