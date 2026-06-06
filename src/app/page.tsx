"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/theme/ThemeProvider";

// 🔥 FIX: Alias the import to 'nextDynamic' to avoid colliding with 'export const dynamic'
import nextDynamic from "next/dynamic";

// Tasks Engine
import { useNexCore } from "@/modules/tasks/engine/useNexCore";

// Supabase
import { supabase } from "@/lib/supabase";

import Navbar from "@/navigation/Navbar"; 
import FeedbackPopup from "@/settings/components/FeedbackPopup/FeedbackPopup";

// Tasks Module Components
import Tabs from "@/modules/tasks/Tabs";

// 🔥 OPTIMIZATION: Use the aliased 'nextDynamic'
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

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDarkMode } = useTheme();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("matrix");
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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

  // AUTH + FEEDBACK
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
          .insert([
            {
              user_id: currentUser.id,
              feedback_given: false,
              daily_prompt_count: 0,
            },
          ])
          .select()
          .single();

        if (insertError) return;
        data = newRow;
      }

      if (!data) return;

      if (data.last_prompt_date !== today) {
        await (supabase as any)
          .from("user_feedback_status")
          .update({
            daily_prompt_count: 0,
            last_prompt_date: today,
          })
          .eq("user_id", currentUser.id);

        data.daily_prompt_count = 0;
      }

      if (!data.feedback_given && data.daily_prompt_count < 3) {
        await (supabase as any)
          .from("user_feedback_status")
          .update({
            daily_prompt_count: data.daily_prompt_count + 1,
          })
          .eq("user_id", currentUser.id);

        setTimeout(() => {
          setShowFeedback(true);
        }, 45000);
      }
    };

    runFeedbackCheck();

  }, [currentUser, isFocusLoaded, router]);

  useEffect(() => {
    const savedTab = sessionStorage.getItem("nexengine_active_tab");
    if (savedTab) {
      setActiveTab(savedTab);
    }
    setIsStateLoaded(true);
  }, []);

  // SESSION MEMORY GATE
  useEffect(() => {
    if (mounted && isStateLoaded && isFocusLoaded && isAuthenticated) {
      sessionStorage.setItem("nexspace_session_loaded", "true");
    }
  }, [mounted, isStateLoaded, isFocusLoaded, isAuthenticated]);

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
    <div className={`flex flex-col min-h-screen transition-colors duration-300 ${
      isDarkMode ? "bg-[#050505]" : "bg-[#F9FAFB]"
    }`}>

      <Navbar
        meta={state.meta}
        setMonthYear={setMonthYear}
        exportData={exportData}
        importData={() => {}}
      />

      {!isMini ? (
        <>
          <main className="flex-1">
            <div className="max-w-[1600px] mx-auto px-4 pt-6">
              <Tabs
                activeTab={activeTab}
                setActiveTab={handleTabChange}
              />
            </div>

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
          </main>
        </>
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
    </div>
  );
}