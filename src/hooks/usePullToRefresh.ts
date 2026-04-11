"use client";

import { useEffect, useRef, useState } from "react";

export const usePullToRefresh = (onRefresh: () => void) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [readyToRefresh, setReadyToRefresh] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const startY = useRef(0);
  const pullingRef = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        pullingRef.current = true;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        const limited = Math.min(diff, 150); // prevent too much pull
        setPullDistance(limited);

        if (limited > 80) {
          setReadyToRefresh(true);
        } else {
          setReadyToRefresh(false);
        }
      }
    };

    const handleTouchEnd = () => {
      if (readyToRefresh) {
        onRefresh();
      }

      setPullDistance(0);
      setReadyToRefresh(false);
      setIsPulling(false);
      pullingRef.current = false;
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [readyToRefresh, onRefresh]);

  return {
    pullDistance,
    readyToRefresh,
    isPulling,
  };
};