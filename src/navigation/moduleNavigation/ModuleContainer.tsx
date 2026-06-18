"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValue, Variants } from "framer-motion";
import { useModuleSwipe } from "./useModuleSwipe";

export default function ModuleContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentIndex, direction, handleDragEnd } = useModuleSwipe();
  
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // FIX 1: Hydration Sync
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // FIX 7: Removed MutationObserver. Checking state gracefully on interaction instead.
  // Ideally, MobileNav should dispatch a custom event, but this passive listener bridges the gap without repaints.
  useEffect(() => {
    const checkNav = () => setNavOpen(document.body.dataset.navOpen === "true");
    document.addEventListener("touchstart", checkNav, { passive: true });
    document.addEventListener("click", checkNav, { passive: true });
    return () => {
      document.removeEventListener("touchstart", checkNav);
      document.removeEventListener("click", checkNav);
    };
  }, []);

  // Reset scroll to top on route change since scroll container is persistent
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [pathname]);

  const x = useMotionValue(0);

  // FIX 5, 8 & 9: Ultra-minimal fast transitions without bounces
  const mobileVariants: Variants = {
    enter: (direction: number) => ({ x: direction > 0 ? "5%" : "-5%" }),
    center: { x: 0 },
    exit: (direction: number) => ({ x: direction > 0 ? "-5%" : "5%" }),
  };

  const desktopVariants: Variants = {
    enter: { opacity: 0, y: 15 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const isSupportedRoute = currentIndex !== -1;

  // FIX 1: Return static shell during SSR to prevent hydration jump
  if (!mounted) {
    return (
      <div className="w-full h-[100dvh] bg-[var(--background)]">
        {children}
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] bg-[var(--background)] overflow-hidden module-container">
      
      {/* FIX 4: Scroll container sits OUTSIDE the animated element */}
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto z-10">
        
        {/* FIX 2: initial={false} and mode="wait" to prevent mount/layout jumping */}
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={pathname}
            custom={direction}
            variants={isMobile ? mobileVariants : desktopVariants}
            initial="enter"
            animate="center"
            exit="exit"
            
            // FIX 3: Replaced spring with a tight, fast easing curve
            transition={{
              duration: 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
            
            drag={isMobile && isSupportedRoute && !navOpen ? "x" : false}
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15} 
            dragListener={!navOpen}
            dragPropagation={false}
            
            // FIX 5: Scale only applies actively during touch
            whileDrag={isMobile ? { scale: 0.98 } : undefined}
            
            // Strictly just tracking X to prevent layout thrashing
            style={isMobile && isSupportedRoute ? { x } : undefined}
            onDragEnd={handleDragEnd}
            
            className="w-full min-h-full origin-center animated-page"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* GPU acceleration for the moving surface only */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .module-container * {
            -webkit-tap-highlight-color: transparent;
          }
          .animated-page {
            will-change: transform, opacity;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
          }
        `
      }} />
    </div>
  );
}