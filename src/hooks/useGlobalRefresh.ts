"use client";

import { useRouter } from "next/navigation";

export const useGlobalRefresh = () => {
  const router = useRouter();

  const refreshPage = () => {
    router.refresh();
  };

  return { refreshPage };
};