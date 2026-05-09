"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Tasks Engine
import { useNexCore } from "@/modules/tasks/engine/useNexCore";

// Supabase
import { supabase } from "@/lib/supabase";

// Global Components
import Navbar from "@/navigation/Navbar";
import FeedbackPopup from "@/settings/components/FeedbackPopup/FeedbackPopup";

// Tasks Module Components
import Tabs from "@/modules/tasks/Tabs";
import StatsGrid from "@/modules/tasks/stats/StatsGrid";
import MatrixView from "@/modules/tasks/matrix/MatrixView";
import AnalyticsView from "@/modules/tasks/analytics/AnalyticsView";
import AuditView from "@/modules/tasks/audit/AuditView";

// Focus Engine
import { useFocusSystem } from "@/modules/focus/engine/useFocusSystem";

export const dynamic = "force-dynamic";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();

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
    lockToday,
    exportData,
  } = useNexCore();

  // Focus Context
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

      // Create row if missing
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

        if (insertError) {
          console.error(
            "Insert FULL error:",
            JSON.stringify(insertError)
          );
          return;
        }

        data = newRow;
      }

      if (!data) return;

      // Reset daily count
      if (data.last_prompt_date !== today) {
        const { error } = await (supabase as any)
          .from("user_feedback_status")
          .update({
            daily_prompt_count: 0,
            last_prompt_date: today,
          })
          .eq("user_id", currentUser.id);

        if (error) {
          console.error(
            "Reset error:",
            JSON.stringify(error)
          );
          return;
        }

        data.daily_prompt_count = 0;
      }

      // Show popup
      if (
        !data.feedback_given &&
        data.daily_prompt_count < 3
      ) {
        const { error } = await (supabase as any)
          .from("user_feedback_status")
          .update({
            daily_prompt_count: data.daily_prompt_count + 1,
          })
          .eq("user_id", currentUser.id);

        if (error) {
          console.error(
            "Update error:",
            JSON.stringify(error)
          );
          return;
        }

        setTimeout(() => {
          setShowFeedback(true);
        }, 45000);
      }
    };

    runFeedbackCheck();

  }, [currentUser, isFocusLoaded, router]);

  // Load tab
  useEffect(() => {
    const savedTab = sessionStorage.getItem("nexengine_active_tab");

    if (savedTab) {
      setActiveTab(savedTab);
    }

    setIsStateLoaded(true);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    sessionStorage.setItem("nexengine_active_tab", tab);
  };

  // Loading Screen
  if (
    isAuthenticated === null ||
    isAuthenticated === false ||
    !mounted ||
    !isStateLoaded ||
    !isFocusLoaded
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Initializing Workspace...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Navbar */}
      <Navbar
        meta={state.meta}
        setMonthYear={setMonthYear}
        exportData={exportData}
        importData={() => {}}
      />

      {!isMini ? (
        <>
          {/* Stats */}
          <StatsGrid
            tasks={state.tasks}
            meta={state.meta}
          />

          {/* Tabs */}
          <Tabs
            activeTab={activeTab}
            setActiveTab={handleTabChange}
          />

          {/* Main Views */}
          <main className="flex-1">

            {activeTab === "matrix" && (
              <MatrixView
                tasks={state.tasks}
                meta={state.meta}
                addTask={addTask}
                deleteTask={deleteTask}
                toggleTask={toggleTask}
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
                clearLogs={() => {}}
                deleteLog={() => {}}
              />
            )}

          </main>
        </>
      ) : (

        <div className="flex-1 flex items-center justify-center">
          Mini Nisc
        </div>

      )}

      {/* Feedback Popup */}
      {showFeedback && userId && (
        <FeedbackPopup
          userId={userId}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}