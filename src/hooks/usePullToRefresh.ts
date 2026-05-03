import { useEffect, useState, useRef } from "react";

export function usePullToRefresh(onRefresh: () => void) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [readyToRefresh, setReadyToRefresh] = useState(false);

  const startY = useRef(0);
  const startX = useRef(0);
  const isPulling = useRef(false);

  const THRESHOLD = 70;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // ✅ Only start if at top of page
      if (window.scrollY > 0) return;

      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
      isPulling.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;

      const diffY = currentY - startY.current;
      const diffX = currentX - startX.current;

      // 🔥 CRITICAL FIX: Ignore horizontal scroll
      if (Math.abs(diffX) > Math.abs(diffY)) {
        isPulling.current = false;
        return;
      }

      // Only allow downward pull
      if (diffY <= 0) return;

      setPullDistance(diffY);

      if (diffY > THRESHOLD) {
        setReadyToRefresh(true);
      } else {
        setReadyToRefresh(false);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;

      if (readyToRefresh) {
        setIsRefreshing(true);

        await onRefresh();

        setIsRefreshing(false);
      }

      // reset
      setPullDistance(0);
      setReadyToRefresh(false);
      isPulling.current = false;
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
    isRefreshing,
    readyToRefresh,
  };
}