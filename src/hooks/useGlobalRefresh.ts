"use client";

export const useGlobalRefresh = () => {
  const refreshPage = () => {
    // Forces a true, full-page reload on mobile devices
    window.location.reload();
  };

  return { refreshPage };
};