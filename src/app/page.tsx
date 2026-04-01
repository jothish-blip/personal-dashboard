"use client";

import { useState } from "react";
import { useNexCore } from "../hooks/useNexCore";
import Navbar from "../components/Navbar";
import StatsGrid from "../components/StatsGrid";
import Tabs from "../components/Tabs";
import MatrixView from "../components/MatrixView";
import AnalyticsView from "../components/AnalyticsView";
import AuditView from "../components/AuditView";

export default function Home() {
  const [activeTab, setActiveTab] = useState('matrix');
  const { state, mounted, setFocus, setMonthYear, addTask, deleteTask, toggleTask, exportData, importData, clearLogs } = useNexCore();

  if (!mounted) return <div className="min-h-screen bg-white"></div>;

  return (
    <div className="flex flex-col min-h-screen overflow-auto bg-white text-gray-900 transition-colors duration-200">
        <Navbar 
          meta={state.meta} 
          setFocus={setFocus} 
          setMonthYear={setMonthYear} 
          exportData={exportData}
          importData={importData}
        />
        
        <StatsGrid tasks={state.tasks} meta={state.meta} />
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 overflow-visible flex flex-col">
          {activeTab === 'matrix' && (
            <MatrixView tasks={state.tasks} meta={state.meta} addTask={addTask} deleteTask={deleteTask} toggleTask={toggleTask} />
          )}
          {activeTab === 'analytics' && <AnalyticsView tasks={state.tasks} meta={state.meta} />}
          {activeTab === 'audit' && <AuditView logs={state.logs} meta={state.meta} clearLogs={clearLogs} />}
        </main>
      </div>
  );
}