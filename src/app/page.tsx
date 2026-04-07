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

// 🚀 Fix: Prevent Next.js from trying to pre-render this page as static
export const dynamic = "force-dynamic";

export default function Home() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<string>("matrix");
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  const pathname = usePathname();
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

  // 🔐 AUTH CHECK
  useEffect(() => {
    const checkUser = async () => {
      const supabase = getSupabaseClient(); 
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.warn("No session found - redirecting to login");
        router.replace("/login");
      } else {
        setIsAuthenticated(true);
      }
    };

    checkUser();
  }, [router]);

  // Load tab preference from session storage
  useEffect(() => {
    const savedTab = sessionStorage.getItem("nexengine_active_tab");
    if (savedTab) setActiveTab(savedTab);
    setIsStateLoaded(true);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    sessionStorage.setItem("nexengine_active_tab", tab);
  };

  // 🎨 Professional Loading State
  if (isAuthenticated === null || !mounted || !isStateLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400 text-sm font-semibold tracking-wide uppercase">
          Initializing Workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      
      <Navbar
        meta={state.meta}
        setMonthYear={setMonthYear}
        exportData={exportData}
        importData={() => {}}
      />

      {!isMini ? (
        <div className="flex flex-col">
          
          <StatsGrid tasks={state.tasks} meta={state.meta} />
          <Tabs activeTab={activeTab} setActiveTab={handleTabChange} />

          <main className="flex-1 flex flex-col">
            
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
        </div>
      ) : (
        <div className="flex-1 p-8 flex justify-center items-center">
          <div className="bg-white p-12 rounded-3xl border text-center max-w-lg shadow-sm">
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-xl font-black">Mini Nisc</h2>
            <p className="text-gray-400 text-sm mt-2">
              Personal workspace for reflection and deep notes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}