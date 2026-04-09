"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useNexCore } from "../hooks/useNexCore";
import { getSupabaseClient } from "@/lib/supabase";

import Navbar from "../components/Navbar";
import StatsGrid from "../components/StatsGrid";
import Tabs from "../components/Tabs";
import MatrixView from "../components/MatrixView";
import AnalyticsView from "../components/AnalyticsView";
import AuditView from "../components/AuditView";
import FeedbackPopup from "../components/FeedbackPopup";

export const dynamic = "force-dynamic";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("matrix");
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  const [showFeedback, setShowFeedback] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const isMini = pathname === "/mini-nisc";

  const {
    state,
    mounted,
    setMonthYear,
    addTask,
    deleteTask,
    toggleTask,
    lockToday,
    exportData
  } = useNexCore();

  // 🔐 AUTH + FEEDBACK
  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseClient();

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        router.replace("/login");
        return;
      }

      setIsAuthenticated(true);
      setUserId(user.id);

      const today = new Date().toISOString().split("T")[0];

      // ✅ SAFE FETCH
      let { data } = await supabase
        .from("user_feedback_status")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // ✅ CREATE IF NOT EXISTS (SAFE INSERT)
      if (!data) {
        const { data: newRow, error: insertError } = await supabase
          .from("user_feedback_status")
          .insert([
            {
              user_id: user.id,
              feedback_given: false,
              daily_prompt_count: 0,
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("Insert FULL error:", JSON.stringify(insertError));
          return;
        }

        data = newRow;
      }

      if (!data) return;

      // ✅ RESET DAILY COUNT
      if (data.last_prompt_date !== today) {
        const { error } = await supabase
          .from("user_feedback_status")
          .update({
            daily_prompt_count: 0,
            last_prompt_date: today,
          })
          .eq("user_id", user.id);

        if (error) {
          console.error("Reset error:", JSON.stringify(error));
          return;
        }

        data.daily_prompt_count = 0;
      }

      // ✅ SHOW POPUP
      if (!data.feedback_given && data.daily_prompt_count < 3) {
        const { error } = await supabase
          .from("user_feedback_status")
          .update({
            daily_prompt_count: data.daily_prompt_count + 1,
          })
          .eq("user_id", user.id);

        if (error) {
          console.error("Update error:", JSON.stringify(error));
          return;
        }

        setTimeout(() => {
          setShowFeedback(true);
        }, 45000);
      }
    };

    run();
  }, [router]);

  // Load tab
  useEffect(() => {
    const savedTab = sessionStorage.getItem("nexengine_active_tab");
    if (savedTab) setActiveTab(savedTab);
    setIsStateLoaded(true);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    sessionStorage.setItem("nexengine_active_tab", tab);
  };

  if (
    isAuthenticated === null ||
    isAuthenticated === false ||
    !mounted ||
    !isStateLoaded
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Initializing Workspace...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      <Navbar
        meta={state.meta}
        setMonthYear={setMonthYear}
        exportData={exportData}
        importData={() => {}}
      />

      {!isMini ? (
        <>
          <StatsGrid tasks={state.tasks} meta={state.meta} />
          <Tabs activeTab={activeTab} setActiveTab={handleTabChange} />

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
              <AnalyticsView tasks={state.tasks} meta={state.meta} />
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

      {/* 🔥 POPUP */}
      {showFeedback && userId && (
        <FeedbackPopup
          userId={userId}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}