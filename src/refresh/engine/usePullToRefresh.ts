import { useEffect, useState, useRef } from "react";

export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [readyToRefresh, setReadyToRefresh] = useState(false);

  const startY = useRef(0);
  const startX = useRef(0);

  const isPulling = useRef(false);
  const isTracking = useRef(false);

  const THRESHOLD = 70;
  const ACTIVATION_DISTANCE = 12;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return;

      const target = e.target as HTMLElement;

      // Ignore floating sidebar / menus
      if (target && target.closest(".prevent-pull-refresh")) {
        return;
      }

      // Ignore horizontal scrollers
      const scrollableParent = target && target.closest('[data-horizontal-scroll="true"]');
      if (scrollableParent) return;

      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;

      isTracking.current = true;
      isPulling.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTracking.current) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;

      const diffY = currentY - startY.current;
      const diffX = currentX - startX.current;

      // Horizontal swipe → cancel
      if (Math.abs(diffX) > Math.abs(diffY)) {
        isTracking.current = false;
        isPulling.current = false;
        return;
      }

      // only downward gesture
      if (diffY <= 0) return;

      // don't activate instantly
      if (diffY > ACTIVATION_DISTANCE) {
        isPulling.current = true;
      }

      if (!isPulling.current) return;

      const limitedPull = Math.min(diffY * 0.5, 100);

      setPullDistance(limitedPull);
      setReadyToRefresh(limitedPull >= THRESHOLD);
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) {
        reset();
        return;
      }

      if (readyToRefresh && !isRefreshing) {
        try {
          setIsRefreshing(true);
          
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(15);
          }

          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      reset();
    };

    const reset = () => {
      setPullDistance(0);
      setReadyToRefresh(false);

      isPulling.current = false;
      isTracking.current = false;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [readyToRefresh, isRefreshing, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    readyToRefresh,
  };
}