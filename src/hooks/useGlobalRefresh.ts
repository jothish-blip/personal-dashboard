"use client";

import { useRouter } from "next/navigation";

export const useGlobalRefresh = () => {
  const router = useRouter();

  const refreshPage = () => {
    router.refresh(); // Next.js App Router refresh
  };

  return { refreshPage };
};