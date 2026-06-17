"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/theme/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
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

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDarkMode } = useTheme();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("matrix");
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // FIX 1: Hydration safe session storage check
  const [hasSessionLoaded, setHasSessionLoaded] = useState(false);

  useEffect(() => {
    setHasSessionLoaded(sessionStorage.getItem("nexspace_session_loaded") === "true");
  }, []);

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

  // ─── LOCAL TAB MEMORY ───
  useEffect(() => {
    const savedTab = sessionStorage.getItem("nexengine_active_tab");
    if (savedTab) setActiveTab(savedTab);
    setIsStateLoaded(true);
  }, []);

  // ─── SESSION MEMORY GATE ───
  useEffect(() => {
    if (mounted && isStateLoaded && isFocusLoaded && isAuthenticated) {
      sessionStorage.setItem("nexspace_session_loaded", "true");
    }
  }, [mounted, isStateLoaded, isFocusLoaded, isAuthenticated]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    sessionStorage.setItem("nexengine_active_tab", tab);
  };

  const shouldBlockRender =
    isAuthenticated === null ||
    isAuthenticated === false ||
    !mounted ||
    !isStateLoaded ||
    !isFocusLoaded;

  if (shouldBlockRender) {
    if (!hasSessionLoaded) {
      return (
        // FIX 3: Removed JS-based ternary for theme colors to prevent Server/Client hydration mismatch.
        // Using Tailwind dark mode classes instead so CSS handles it purely.
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#000000] text-gray-500 dark:text-gray-400 transition-colors duration-300">
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
    <>
      <Navbar
        meta={state.meta}
        setMonthYear={setMonthYear}
        exportData={exportData}
        importData={() => {}}
      />

      {!isMini ? (
        <div className="flex-1 w-full flex flex-col">
          <div className="max-w-[1600px] w-full mx-auto px-4 pt-6">
            <Tabs
              activeTab={activeTab}
              setActiveTab={handleTabChange}
            />
          </div>

          {/* Sub-tab view transition for Matrix, Analytics, Audit */}
          <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 relative">
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
                    userName={currentUser?.user_metadata?.full_name || currentUser?.email || "User"}
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
          </div>
        </div>
      ) : (
        <div className={`flex-1 flex items-center justify-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Mini Nisc
        </div>
      )}

      {showFeedback && userId && (
        <FeedbackPopup
          userId={userId}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </>
  );
}