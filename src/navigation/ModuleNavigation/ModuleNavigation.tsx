"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useTheme } from "@/theme/ThemeProvider";

const MODULES = [
  { path: "/", name: "Tasks" },
  { path: "/focus", name: "Focus" },
  { path: "/Planner", name: "Planner" },
  { path: "/diary", name: "Diary" },
  { path: "/Workspace", name: "Workspace" },
];

const SWIPE_THRESHOLD = 100; // Increased threshold to avoid accidental triggers

export default function ModuleNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [slideDirection, setSlideDirection] = useState(1);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const touchStartRef = useRef({ x: 0, y: 0 });
  const isValidSwipeRef = useRef(false);
  const lastNavTime = useRef<number>(0);

  const currentIndex = MODULES.findIndex((m) => m.path === pathname);
  const currentModuleIndex = currentIndex === -1 ? 0 : currentIndex;

  // Seamless wrap-around tracking
  const nextIndex = (currentModuleIndex + 1) % MODULES.length;
  const prevIndex = (currentModuleIndex - 1 + MODULES.length) % MODULES.length;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (document.body.dataset.navOpen === "true") return;
      if ((e.target as HTMLElement).closest(".no-swipe")) return;

      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      isValidSwipeRef.current = true;
      setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isValidSwipeRef.current) return;

      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;

      // Kill swipe tracking if user intends to scroll vertically
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
        isValidSwipeRef.current = false;
        setDragX(0);
        return;
      }

      setDragX(deltaX);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      if (!isValidSwipeRef.current) {
        setDragX(0);
        return;
      }

      const now = Date.now();
      if (now - lastNavTime.current < 400) {
        setDragX(0);
        return;
      }

      if (dragX < -SWIPE_THRESHOLD) {
        triggerNavigation(nextIndex, 1);
      } else if (dragX > SWIPE_THRESHOLD) {
        triggerNavigation(prevIndex, -1);
      } else {
        setDragX(0);
      }
    };

    const triggerNavigation = (targetIndex: number, direction: number) => {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(15); 
      }
      setSlideDirection(direction);
      lastNavTime.current = Date.now();
      router.push(MODULES[targetIndex].path);
      
      setTimeout(() => setDragX(0), 50);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dragX, nextIndex, prevIndex, router]);

  // Premium, full-bleed transition variants (No scale card transformation)
  const pageVariants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 220,
        damping: 26,
        mass: 0.8,
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "-100%" : "100%",
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    }),
  };

  const showNextLabel = dragX < -40;
  const showPrevLabel = dragX > 40;

  return (
    <div className={`relative flex flex-col min-h-screen overflow-hidden overscroll-none touch-pan-y ${isDarkMode ? "bg-black" : "bg-[#F9FAFB]"}`}>
      
      {/* PREDICTIVE NAVIGATION HUD */}
      <AnimatePresence>
        {isDragging && (showPrevLabel || showNextLabel) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-[9000] px-5 py-2 rounded-full text-[13px] font-medium tracking-wide backdrop-blur-xl shadow-xl border ${
              isDarkMode 
                ? "bg-zinc-950/80 text-zinc-200 border-zinc-800" 
                : "bg-white/95 text-zinc-800 border-zinc-200"
            }`}
          >
            {showPrevLabel && `← ${MODULES[prevIndex].name}`}
            {showNextLabel && `${MODULES[nextIndex].name} →`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* REVEAL LAYER: Live Dynamic Partial Page Edge Previews */}
      {isDragging && dragX < 0 && (
        <div 
          className="fixed inset-y-0 right-0 z-0 w-64 pointer-events-none opacity-40 border-l border-orange-500/10"
          style={{
            transform: `translateX(${window.innerWidth + dragX * 0.75}px)`,
            background: isDarkMode 
              ? "linear-gradient(to right, transparent, rgba(39,39,42,0.3))" 
              : "linear-gradient(to right, transparent, rgba(0,0,0,0.02))"
          }}
        />
      )}
      {isDragging && dragX > 0 && (
        <div 
          className="fixed inset-y-0 left-0 z-0 w-64 pointer-events-none opacity-40 border-r border-orange-500/10"
          style={{
            transform: `translateX(${-256 + dragX * 0.75}px)`,
            background: isDarkMode 
              ? "linear-gradient(to left, transparent, rgba(39,39,42,0.3))" 
              : "linear-gradient(to left, transparent, rgba(0,0,0,0.02))"
          }}
        />
      )}

      {/* FULL-SCALE GRAPHICS LAYER WORKSPACE CONTAINER */}
      <div className="flex-1 w-full relative z-10 flex flex-col">
        <AnimatePresence initial={false} custom={slideDirection} mode="wait">
          <motion.main
            key={pathname}
            custom={slideDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ x: isDragging ? dragX * 0.75 : 0 }} // Enhanced tracking reactivity
            className="flex-1 w-full h-full flex flex-col"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* ARCHITECTURAL MODULAR RAIL NAVIGATION */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99] pointer-events-auto">
        <div className={`flex items-center gap-5 px-6 py-2.5 rounded-full backdrop-blur-xl border shadow-xl ${
          isDarkMode ? "bg-zinc-950/70 border-zinc-900 shadow-black/80" : "bg-white/80 border-zinc-200 shadow-zinc-200/50"
        }`}>
          {MODULES.map((mod, idx) => {
            const isActive = idx === currentModuleIndex;
            return (
              <button
                key={mod.path}
                onClick={() => {
                  if (pathname === mod.path) return;
                  setSlideDirection(idx > currentModuleIndex ? 1 : -1);
                  router.push(mod.path);
                }}
                className={`text-[12px] font-medium tracking-wider uppercase transition-all relative pb-1 ${
                  isActive 
                    ? isDarkMode ? "text-white" : "text-zinc-900" 
                    : isDarkMode ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {mod.name}
                {isActive && (
                  <motion.div 
                    layoutId="activeWorkspaceLine"
                    className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-orange-500 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}