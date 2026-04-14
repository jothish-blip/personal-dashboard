"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function ScrollLock() {
  const pathname = usePathname();
  const restoringRef = useRef(false);

  // 🔹 SAVE SCROLL (AGGRESSIVE)
  useEffect(() => {
    const save = () => {
      sessionStorage.setItem(`scroll-${pathname}`, String(window.scrollY));
    };

    window.addEventListener("scroll", save);
    window.addEventListener("beforeunload", save);

    return () => {
      window.removeEventListener("scroll", save);
      window.removeEventListener("beforeunload", save);
    };
  }, [pathname]);

  // 🔥 HARD RESTORE FUNCTION
  const forceRestore = () => {
    const saved = sessionStorage.getItem(`scroll-${pathname}`);
    if (!saved) return;

    const y = parseInt(saved);

    restoringRef.current = true;

    let attempts = 0;

    const interval = setInterval(() => {
      window.scrollTo(0, y);

      attempts++;

      // stop after stable
      if (Math.abs(window.scrollY - y) < 2 || attempts > 20) {
        clearInterval(interval);
        restoringRef.current = false;
      }
    }, 50);
  };

  // 🔹 INITIAL LOAD
  useEffect(() => {
    forceRestore();
  }, [pathname]);

  // 🔹 TAB SWITCH
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        forceRestore();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [pathname]);

  // 🔥 BLOCK SCROLL RESETS (VERY IMPORTANT)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!restoringRef.current) return;

      const saved = sessionStorage.getItem(`scroll-${pathname}`);
      if (!saved) return;

      const y = parseInt(saved);

      if (Math.abs(window.scrollY - y) > 5) {
        window.scrollTo(0, y);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}