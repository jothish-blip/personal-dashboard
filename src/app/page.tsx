"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useNexCore } from "../hooks/useNexCore";

import Navbar from "../components/Navbar";
import StatsGrid from "../components/StatsGrid";
import Tabs from "../components/Tabs";
import MatrixView from "../components/MatrixView";
import AnalyticsView from "../components/AnalyticsView";
import AuditView from "../components/AuditView";

export default function Home() {
  // 1. Initialize state with a fallback to avoid SSR mismatches
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
    addAuditLog,
    exportData
  } = useNexCore();

  // 2. Load the active tab from session storage on refresh
  useEffect(() => {
    const savedTab = sessionStorage.getItem("nexengine_active_tab");
    if (savedTab) {
      setActiveTab(savedTab);
    }
    setIsStateLoaded(true);
  }, []);

  // 3. Save the active tab whenever it changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    sessionStorage.setItem("nexengine_active_tab", tab);
  };

  // Prevent hydration mismatch: wait until mounted and session state is loaded
  if (!mounted || !isStateLoaded) {
    return <div className="min-h-screen bg-gray-50"></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 transition-colors duration-200">
      
      <Navbar
        meta={state.meta}
        setMonthYear={setMonthYear}
        exportData={exportData}
        importData={() => {}}
      />

      {!isMini ? (
        <div className="flex flex-col animate-in fade-in duration-300">
          
          {/* Top Performance Dashboard */}
          <StatsGrid tasks={state.tasks} meta={state.meta} />

          {/* Persistent Tab Navigation */}
          <Tabs activeTab={activeTab} setActiveTab={handleTabChange} />

          <main className="flex-1 flex flex-col">
            
            {/* Main Task Matrix */}
            {activeTab === "matrix" && (
              <MatrixView
                tasks={state.tasks}
                meta={state.meta}
                addTask={addTask}
                deleteTask={deleteTask}
                toggleTask={toggleTask}
                lockToday={lockToday}
                addAuditLog={addAuditLog}
                setMonthYear={setMonthYear}
              />
            )}

            {/* Deep Analytics View */}
            {activeTab === "analytics" && (
              <AnalyticsView
                tasks={state.tasks}
                meta={state.meta}
              />
            )}

            {/* System Audit Logs */}
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
        /* MINI PAGE VIEW FALLBACK */
        <div className="flex-1 p-8 flex justify-center items-center animate-in slide-in-from-right-4">
          <div className="bg-white p-12 rounded-3xl border border-purple-100 shadow-sm text-center max-w-lg">
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900">
              Mini Nisc
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              Personal workspace for reflection and deep notes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}