"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValue, useTransform, Variants } from "framer-motion";
import { useModuleSwipe } from "./useModuleSwipe";
import ModuleNavigator from "./ModuleNavigator";

export default function ModuleContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentIndex, direction, handleDragEnd } = useModuleSwipe();
  
  const [isMobile, setIsMobile] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  // Monitor Mobile Nav state so we can disable the swipe gesture when the menu is active
  useEffect(() => {
    const checkNavOpen = () => {
      setNavOpen(document.body.dataset.navOpen === "true");
    };
    
    checkNavOpen(); // Initial Check
    
    const observer = new MutationObserver(checkNavOpen);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-nav-open"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Framer Motion Values for Parallax & Reveal
  const x = useMotionValue(0);
  const scale = useTransform(x, [-300, 0, 300], [0.92, 1, 0.92]);
  const borderRadius = useTransform(x, [-300, 0, 300], [32, 0, 32]);

  const variants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      scale: 0.95,
      opacity: 0.5,
      zIndex: 1,
    }),
    center: {
      x: 0,
      scale: 1,
      opacity: 1,
      zIndex: 2,
      borderRadius: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "30%" : "-30%",
      scale: 0.95,
      opacity: 0,
      zIndex: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    })
  };

  // Only allow swiping if the route is defined in MODULES config
  const isSupportedRoute = currentIndex !== -1;

  return (
    <div className="relative w-full h-[100dvh] bg-[var(--background)] overflow-hidden perspective-[1000px] module-container">
      
      {/* 1. Background Peek Layer */}
      {isMobile && <ModuleNavigator dragX={x} currentIndex={currentIndex} />}

      {/* 2. Hardware Accelerated Route Container */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={pathname}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          
          // DRAG PHYSICS: Completely disabled if the nav drawer is open
          drag={isMobile && isSupportedRoute && !navOpen ? "x" : false}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.8}
          
          style={isMobile && isSupportedRoute ? { x, scale, borderRadius } : undefined}
          onDragEnd={handleDragEnd}
          
          className="absolute inset-0 w-full h-full bg-[var(--background)] shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 origin-center overflow-y-auto"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
          .module-container * {
            -webkit-tap-highlight-color: transparent;
          }
          .module-container > div {
            will-change: transform, opacity, border-radius;
            contain: layout paint style;
            transform: translateZ(0);
            backface-visibility: hidden;
          }
        `
      }} />
    </div>
  );
}