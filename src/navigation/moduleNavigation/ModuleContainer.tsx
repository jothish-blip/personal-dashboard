"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValue, Variants, animate } from "framer-motion";
import { useModuleSwipe } from "./useModuleSwipe";

export default function ModuleContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentIndex, direction, handleDragEnd } = useModuleSwipe();
  
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);

  // Hydration Sync
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Check Nav State gracefully on interaction
  useEffect(() => {
    const checkNav = () => setNavOpen(document.body.dataset.navOpen === "true");
    document.addEventListener("touchstart", checkNav, { passive: true });
    document.addEventListener("click", checkNav, { passive: true });
    return () => {
      document.removeEventListener("touchstart", checkNav);
      document.removeEventListener("click", checkNav);
    };
  }, []);

  // Reset scroll to top and explicitly reset horizontal translation on route change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    x.set(0);
  }, [pathname, x]);

  // Ultra-minimal fast transitions
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

  // Return static shell during SSR to prevent hydration jump
  if (!mounted) {
    return (
      <div className="w-full h-[100dvh] bg-[var(--background)]">
        {children}
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] bg-[var(--background)] overflow-hidden module-container">
      
      {/* Scroll container sits OUTSIDE the animated element */}
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto z-10">
        
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={pathname}
            custom={direction}
            variants={isMobile ? mobileVariants : desktopVariants}
            initial="enter"
            animate="center"
            exit="exit"
            
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
            
            // Scale only applies actively during touch
            whileDrag={isMobile ? { scale: 0.98 } : undefined}
            
            // Strictly just tracking X to prevent layout thrashing
            style={isMobile && isSupportedRoute ? { x } : undefined}
            
            onDragEnd={(e, info) => {
              handleDragEnd(e, info);

              // Force the page back to center if threshold wasn't met
              animate(x, 0, {
                duration: 0.2,
                ease: "easeOut",
              });
            }}
            
            // Added max-w-full, overflow-x-hidden, and touch-pan-y
            className="w-full min-h-full max-w-full overflow-x-hidden origin-center animated-page touch-pan-y"
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
            touch-action: pan-y;
          }
        `
      }} />
    </div>
  );
}