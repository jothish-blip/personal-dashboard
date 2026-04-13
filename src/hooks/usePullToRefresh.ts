"use client";

import { useEffect, useRef, useState } from "react";

export const usePullToRefresh = (onRefresh: () => void) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [readyToRefresh, setReadyToRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY = useRef(0);
  const pullingRef = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        pullingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      // Only act if pulling down while at the top of the page
      if (diff > 0 && window.scrollY === 0) {
        // Prevent default browser refresh UI from appearing
        if (e.cancelable) e.preventDefault(); 

        // Apply resistance so it feels like a physical pull
        const limited = Math.min(diff * 0.4, 150); 
        setPullDistance(limited);

        if (limited > 60) {
          setReadyToRefresh((prev) => {
            if (!prev && navigator.vibrate) {
              navigator.vibrate(40); // Gentle haptic pop when threshold is reached
            }
            return true;
          });
        } else {
          setReadyToRefresh(false);
        }
      }
    };

    const handleTouchEnd = () => {
      if (!pullingRef.current) return;
      pullingRef.current = false;

      setReadyToRefresh((ready) => {
        if (ready) {
          if (navigator.vibrate) navigator.vibrate([20, 50, 20]); // Success vibration
          setIsRefreshing(true);
          onRefresh();
        }
        return false;
      });
      
      setPullDistance(0);
    };

    // passive: false is REQUIRED to use e.preventDefault() on touchmove
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onRefresh]);

  return { pullDistance, readyToRefresh, isRefreshing };
};