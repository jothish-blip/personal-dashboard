"use client";

export const useGlobalRefresh = () => {
  const refreshPage = () => {
    // Forces a silent data refresh without reloading the browser window
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("nexspace-refresh"));
    }
  };

  return { refreshPage };
};