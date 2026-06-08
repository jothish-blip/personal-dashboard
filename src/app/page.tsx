"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/theme/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

// Alias the import to 'nextDynamic' to avoid colliding with 'export const dynamic'
import nextDynamic from "next/dynamic";

// Tasks Engine
import { useNexCore } from "@/modules/tasks/engine/useNexCore";

// Supabase
import { supabase } from "@/lib/supabase";

import Navbar from "@/navigation/Navbar"; 
import FeedbackPopup from "@/settings/components/FeedbackPopup/FeedbackPopup";

// Tasks Module Components
import Tabs from "@/modules/tasks/Tabs";

const MatrixView = nextDynamic(() => import("@/modules/tasks/matrix/MatrixView"), { 
  ssr: false, 
  loading: () => <div className="h-64 flex items-center justify-center text-gray-400 animate-pulse">Loading Matrix...</div> 
});
const AnalyticsView = nextDynamic(() => import("@/modules/tasks/analytics/AnalyticsView"), { 
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center text-gray-400 animate-pulse">Loading Analytics...</div>
});
const AuditView = nextDynamic(() => import("@/modules/tasks/audit/AuditView"), { 
  ssr: false 
});

// Focus Engine
import { useFocusSystem } from "@/modules/focus/engine/useFocusSystem";

export const dynamic = "force-dynamic";

// Global Module Order for Edge Swiping
const MODULE_ORDER = [
  "/",
  "/focus",
  "/Planner",
  "/diary",
  "/Workspace",
];

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDarkMode } = useTheme();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("matrix");
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Navigation polish state
  const [slideDirection, setSlideDirection] = useState(1);
  const [showEdgeHint, setShowEdgeHint] = useState(false);
  const lastNavTime = useRef<number>(0);

  const isMini = pathname === "/Workspace";

  const {
    state,
    mounted,
    setMonthYear,
    addTask,
    deleteTask,
    toggleTask,
    renameTask,   
    renameGroup,  
    lockToday,
    exportData,
  } = useNexCore();

  const {
    currentUser,
    isLoaded: isFocusLoaded,
  } = useFocusSystem();

  // ─── AUTH + FEEDBACK ───
  useEffect(() => {
    if (!isFocusLoaded) return;

    if (!currentUser) {
      setIsAuthenticated(false);
      router.replace("/login");
      return;
    }

    setIsAuthenticated(true);
    setUserId(currentUser.id);

    const runFeedbackCheck = async () => {
      const today = new Date().toISOString().split("T")[0];

      let { data } = await (supabase as any)
        .from("user_feedback_status")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!data) {
        const {
          data: newRow,
          error: insertError,
        } = await (supabase as any)
          .from("user_feedback_status")
          .insert([{ user_id: currentUser.id, feedback_given: false, daily_prompt_count: 0 }])
          .select()
          .single();

        if (insertError) return;
        data = newRow;
      }

      if (!data) return;

      if (data.last_prompt_date !== today) {
        await (supabase as any)
          .from("user_feedback_status")
          .update({ daily_prompt_count: 0, last_prompt_date: today })
          .eq("user_id", currentUser.id);

        data.daily_prompt_count = 0;
      }

      if (!data.feedback_given && data.daily_prompt_count < 3) {
        await (supabase as any)
          .from("user_feedback_status")
          .update({ daily_prompt_count: data.daily_prompt_count + 1 })
          .eq("user_id", currentUser.id);

        setTimeout(() => {
          setShowFeedback(true);
        }, 45000);
      }
    };

    runFeedbackCheck();
  }, [currentUser, isFocusLoaded, router]);

  // ─── LOCAL TAB MEMORY & HINTS ───
  useEffect(() => {
    const savedTab = sessionStorage.getItem("nexengine_active_tab");
    if (savedTab) setActiveTab(savedTab);
    setIsStateLoaded(true);

    // Edge Swipe Discoverability Hint
    const edgeHintSeen = localStorage.getItem("nexspace_edge_hint");
    if (!edgeHintSeen) {
      setTimeout(() => {
        setShowEdgeHint(true);
        setTimeout(() => {
          setShowEdgeHint(false);
          localStorage.setItem("nexspace_edge_hint", "true");
        }, 4000);
      }, 1000);
    }
  }, []);

  // ─── SESSION MEMORY GATE ───
  useEffect(() => {
    if (mounted && isStateLoaded && isFocusLoaded && isAuthenticated) {
      sessionStorage.setItem("nexspace_session_loaded", "true");
    }
  }, [mounted, isStateLoaded, isFocusLoaded, isAuthenticated]);

  // ─── EDGE SWIPE NAVIGATION LISTENER ───
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let isEdgeSwipeValid = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (document.body.dataset.navOpen === "true") return;
      
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;

      // Only allow swipes starting from within 40px of screen edges
      if (touchStartX < 40 || touchStartX > window.innerWidth - 40) {
        isEdgeSwipeValid = true;
      } else {
        isEdgeSwipeValid = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isEdgeSwipeValid) return;
      if (document.body.dataset.navOpen === "true") return;
      
      const now = Date.now();
      // 300ms Gesture Cooldown to prevent rapid-fire module jumps
      if (now - lastNavTime.current < 300) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      if (Math.abs(deltaX) > 80 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        const currentIndex = MODULE_ORDER.indexOf(pathname);
        if (currentIndex === -1) return;

        if (deltaX < 0 && currentIndex < MODULE_ORDER.length - 1) {
          // Swiped Left -> Go to Next Module
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(5);
          setSlideDirection(1);
          lastNavTime.current = now;
          router.push(MODULE_ORDER[currentIndex + 1]);
        } else if (deltaX > 0 && currentIndex > 0) {
          // Swiped Right -> Go to Previous Module
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(5);
          setSlideDirection(-1);
          lastNavTime.current = now;
          router.push(MODULE_ORDER[currentIndex - 1]);
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pathname, router]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    sessionStorage.setItem("nexengine_active_tab", tab);
  };

  const hasSessionLoaded =
    typeof window !== "undefined"
      ? sessionStorage.getItem("nexspace_session_loaded") === "true"
      : false;

  const shouldBlockRender =
    isAuthenticated === null ||
    isAuthenticated === false ||
    !mounted ||
    !isStateLoaded ||
    !isFocusLoaded;

  if (shouldBlockRender) {
    if (!hasSessionLoaded) {
      return (
        <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          isDarkMode ? "bg-[#050505] text-gray-400" : "bg-[#F9FAFB] text-gray-500"
        }`}>
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <span className="text-sm font-bold uppercase tracking-widest text-orange-500">
              Initializing Workspace...
            </span>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`flex flex-col min-h-screen overflow-x-hidden transition-colors duration-300 ${
      isDarkMode ? "bg-[#050505]" : "bg-[#F9FAFB]"
    }`}>

      <Navbar
        meta={state.meta}
        setMonthYear={setMonthYear}
        exportData={exportData}
        importData={() => {}}
      />

      {/* Edge Swipe Hint Overlay */}
      <AnimatePresence>
        {showEdgeHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9000] px-5 py-2.5 rounded-full text-[13px] font-medium shadow-lg backdrop-blur-md ${
              isDarkMode ? "bg-white/10 text-white" : "bg-black/80 text-white"
            }`}
          >
            Swipe from edges to switch modules
          </motion.div>
        )}
      </AnimatePresence>

      {/* Directional Page Route Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: slideDirection * 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: slideDirection * -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex-1 w-full"
        >
          {!isMini ? (
            <>
              <main className="flex-1 w-full">
                <div className="max-w-[1600px] mx-auto px-4 pt-6">
                  <Tabs
                    activeTab={activeTab}
                    setActiveTab={handleTabChange}
                  />
                </div>

                {/* Sub-tab view transition for Matrix, Analytics, Audit */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="w-full"
                  >
                    {activeTab === "matrix" && (
                      <MatrixView
                        tasks={state.tasks}
                        meta={state.meta}
                        addTask={addTask}
                        deleteTask={deleteTask}
                        toggleTask={toggleTask}
                        renameTask={renameTask}   
                        renameGroup={renameGroup}  
                        lockToday={lockToday}
                        setMonthYear={setMonthYear}
                      />
                    )}

                    {activeTab === "analytics" && (
                      <AnalyticsView
                        tasks={state.tasks}
                        meta={state.meta}
                      />
                    )}

                    {activeTab === "audit" && (
                      <AuditView
                        logs={state.logs}
                        meta={state.meta}
                        taskCount={state.tasks.length}
                        clearLogs={() => {}}
                        deleteLog={() => {}}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>
            </>
          ) : (
            <div className={`flex-1 flex items-center justify-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Mini Nisc
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {showFeedback && userId && (
        <FeedbackPopup
          userId={userId}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}