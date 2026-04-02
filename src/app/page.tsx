"use client";

import React, { useState } from "react";
import { useNexCore } from "../hooks/useNexCore";
import Navbar from "../components/Navbar";
import StatsGrid from "../components/StatsGrid";
import Tabs from "../components/Tabs";
import MatrixView from "../components/MatrixView";
import AnalyticsView from "../components/AnalyticsView";
import AuditView from "../components/AuditView";

export default function Home() {
  const [activeTab, setActiveTab] = useState('matrix');
  const [activeMode, setActiveMode] = useState<'matrix' | 'mini'>('matrix');

  // Destructure all required functions here
  const { 
    state, 
    mounted, 
    setFocus, 
    setMonthYear, 
    addTask, 
    deleteTask, 
    toggleTask, 
    lockToday,
    addAuditLog,
    exportData 
  } = useNexCore();

  if (!mounted) return <div className="min-h-screen bg-gray-50"></div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 transition-colors duration-200">
      <Navbar 
        meta={state.meta}
        setMonthYear={setMonthYear}
        exportData={exportData}
        mode={activeMode}
        setMode={setActiveMode} importData={function (file: File): void {
          throw new Error("Function not implemented.");
        } }      />
      
      {activeMode === 'matrix' ? (
        <div className="flex flex-col animate-in fade-in duration-300">
          <StatsGrid tasks={state.tasks} meta={state.meta} />
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <main className="flex-1 flex flex-col">
            {activeTab === 'matrix' && (
              <MatrixView 
                tasks={state.tasks}
                meta={state.meta}
                addTask={addTask}
                deleteTask={deleteTask}
                toggleTask={toggleTask}
                lockToday={lockToday}
                addAuditLog={addAuditLog} setMonthYear={function (value: string): void {
                  throw new Error("Function not implemented.");
                } }              />
            )}
            
            {activeTab === 'analytics' && (
              <AnalyticsView 
                tasks={state.tasks} 
                meta={state.meta} 
              />
            )}
            
            {activeTab === 'audit' && (
              <AuditView 
                logs={state.logs}
                meta={state.meta} clearLogs={function (): void {
                  throw new Error("Function not implemented.");
                } } deleteLog={function (id: string | number): void {
                  throw new Error("Function not implemented.");
                } }              />
            )}
          </main>
        </div>
      ) : (
        /* MINI NISC VIEW */
        <div className="flex-1 p-8 flex justify-center items-center animate-in slide-in-from-right-4">
          <div className="bg-white p-12 rounded-3xl border border-purple-100 shadow-sm text-center max-w-lg">
             <div className="text-4xl mb-4">📝</div>
             <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900">Mini Nisc</h2>
             <p className="text-gray-400 text-sm mt-2">Personal workspace for reflection and deep notes.</p>
          </div>
        </div>
      )}
    </div>
  );
}