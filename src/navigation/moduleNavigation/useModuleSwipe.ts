"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PanInfo } from "framer-motion";
import { MODULES, NATIVE_SWIPE_SETTINGS } from "./config";

export function useModuleSwipe() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [direction, setDirection] = useState(0);

  const currentIndex = MODULES.findIndex(
    (m) => m.path.toLowerCase() === pathname.toLowerCase()
  );
  
  const nextModule = MODULES[currentIndex + 1] || null;
  const prevModule = MODULES[currentIndex - 1] || null;

  useEffect(() => {
    if (nextModule) router.prefetch(nextModule.path);
    if (prevModule) router.prefetch(prevModule.path);
  }, [nextModule, prevModule, router]);

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offset = info.offset.x;
      const velocity = info.velocity.x;

      const { DRAG_THRESHOLD, VELOCITY_THRESHOLD } = NATIVE_SWIPE_SETTINGS;

      if (offset < -DRAG_THRESHOLD || velocity < -VELOCITY_THRESHOLD) {
        if (nextModule) {
          setDirection(1);
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
          router.push(nextModule.path);
        }
      } 
      else if (offset > DRAG_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
        if (prevModule) {
          setDirection(-1);
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
          router.push(prevModule.path);
        }
      }
    },
    [nextModule, prevModule, router]
  );

  return {
    currentIndex,
    nextModule, 
    prevModule,
    direction,
    handleDragEnd,
  };
}