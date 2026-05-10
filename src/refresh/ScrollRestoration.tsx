"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function ScrollLock() {
  const pathname = usePathname();
  const restoredRef = useRef(false);

  // Save scroll position
  useEffect(() => {
    const saveScroll = () => {
      // Prioritize explicit scroll container, fallback to window
      const container = document.getElementById("main-scroll-container");
      const scrollY = container ? container.scrollTop : window.scrollY;
      
      sessionStorage.setItem(`scroll:${pathname}`, String(scrollY));
    };

    const container = document.getElementById("main-scroll-container");
    const target = container || window;

    target.addEventListener("scroll", saveScroll, { passive: true });

    return () => {
      saveScroll();
      target.removeEventListener("scroll", saveScroll);
    };
  }, [pathname]);

  // Restore scroll position
  useEffect(() => {
    restoredRef.current = false;

    const restoreScroll = () => {
      const saved = sessionStorage.getItem(`scroll:${pathname}`);
      if (!saved) return;

      const y = parseInt(saved);
      const container = document.getElementById("main-scroll-container");

      // Double rAF waits for browser paint
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
          } else {
            window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
          }
          restoredRef.current = true;
        });
      });
    };

    restoreScroll();

    // Catch any late asynchronous rendering shifts
    const timeout = setTimeout(() => {
      if (!restoredRef.current) {
        restoreScroll();
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [pathname]);

  // Browser tab visibility restore
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState !== "visible") return;

      const saved = sessionStorage.getItem(`scroll:${pathname}`);
      if (!saved) return;

      const y = parseInt(saved);
      const container = document.getElementById("main-scroll-container");

      if (container) {
        container.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
      } else {
        window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
      }
    };

    document.addEventListener("visibilitychange", handleVisible);

    return () => document.removeEventListener("visibilitychange", handleVisible);
  }, [pathname]);

  return null;
}