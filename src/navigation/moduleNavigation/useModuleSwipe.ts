"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PanInfo } from "framer-motion";
import { MODULES, NATIVE_SWIPE_SETTINGS } from "./config";

export function useModuleSwipe() {
  const router = useRouter();
  const pathname = usePathname();
  
  // 1 = sliding left (going to next), -1 = sliding right (going to prev)
  const [direction, setDirection] = useState(0);

  // Case-insensitive match to guarantee we find the current index
  const currentIndex = MODULES.findIndex(
    (m) => m.path.toLowerCase() === pathname.toLowerCase()
  );
  
  const nextModule = MODULES[currentIndex + 1] || null;
  const prevModule = MODULES[currentIndex - 1] || null;

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offset = info.offset.x;
      const velocity = info.velocity.x;

      const { DRAG_THRESHOLD, VELOCITY_THRESHOLD } = NATIVE_SWIPE_SETTINGS;

      // Swipe Left (finger moves left) -> Go Next
      if (offset < -DRAG_THRESHOLD || velocity < -VELOCITY_THRESHOLD) {
        if (nextModule) {
          setDirection(1);
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
          router.push(nextModule.path);
        }
      } 
      // Swipe Right (finger moves right) -> Go Prev
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