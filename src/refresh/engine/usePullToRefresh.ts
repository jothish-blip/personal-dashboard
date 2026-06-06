"use client";

import { useEffect, useState, useRef } from "react";

export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [readyToRefresh, setReadyToRefresh] = useState(false);

  // Use a ref for the callback so we don't re-bind DOM listeners on every render
  const savedOnRefresh = useRef(onRefresh);
  useEffect(() => {
    savedOnRefresh.current = onRefresh;
  }, [onRefresh]);

  const startY = useRef(0);
  const startX = useRef(0);
  const isPulling = useRef(false);
  const isTracking = useRef(false);
  const pullDistanceRef = useRef(0);

  // Reduced thresholds for native Android-like atomic feel
  const MAX_PULL = 60;
  const REFRESH_THRESHOLD = 35;
  const ACTIVATION_DISTANCE = 12;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return;

      const target = e.target as HTMLElement;

      // Ignore floating sidebars / menus / horizontal scrollers
      if (target && target.closest(".prevent-pull-refresh")) return;
      if (target && target.closest('[data-horizontal-scroll="true"]')) return;

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

      // Horizontal swipe → cancel tracking entirely
      if (Math.abs(diffX) > Math.abs(diffY)) {
        isTracking.current = false;
        isPulling.current = false;
        return;
      }

      // Only track downward gestures
      if (diffY <= 0) return;

      // Lock into the gesture once past activation
      if (diffY > ACTIVATION_DISTANCE) {
        isPulling.current = true;
        setIsDragging(true);
      }

      if (!isPulling.current) return;

      // Apply resistance to the pull (Parallax effect)
      const limitedPull = Math.min(diffY * 0.45, MAX_PULL);
      pullDistanceRef.current = limitedPull;

      setPullDistance(limitedPull);
      setReadyToRefresh(limitedPull >= REFRESH_THRESHOLD);
    };

    const triggerRefresh = async () => {
      try {
        setIsRefreshing(true);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(15);
        }
        await savedOnRefresh.current();
      } finally {
        setIsRefreshing(false);
        setIsSuccess(true); // Trigger the "✓ Updated" state
        
        // Wait 800ms before fading away completely
        setTimeout(() => {
          setIsSuccess(false);
          reset();
        }, 800);
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling.current) {
        reset();
        return;
      }

      // Disable drag immediately so the CSS spring transition can take over
      setIsDragging(false);

      // Atomic completion: If they crossed the 35px threshold and let go, DO NOT cancel.
      if (pullDistanceRef.current >= REFRESH_THRESHOLD) {
        triggerRefresh();
      } else {
        // Released too early -> smooth snap back
        reset();
      }
    };

    const reset = () => {
      pullDistanceRef.current = 0;
      setPullDistance(0);
      setReadyToRefresh(false);
      isPulling.current = false;
      isTracking.current = false;
      setIsDragging(false);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return {
    pullDistance,
    isDragging,
    isRefreshing,
    readyToRefresh,
    isSuccess,
  };
}