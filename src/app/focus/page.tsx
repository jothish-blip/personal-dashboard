"use client";

import React from "react";
import { FocusProvider, useFocusSystem } from "@/components/focus/useFocusSystem";

import Navbar from "@/components/Navbar"; // Assuming this is your global navbar path
// import { useNexCore } from "@/hooks/useNexCore"; // Uncomment when integrating your main state

import FocusModal from "@/components/focus/FocusModal";
import TopBar from "@/components/focus/TopBar";
import SessionTimer from "@/components/focus/SessionTimer";
import TaskSelector from "@/components/focus/TaskSelector";
import DistractionTracker from "@/components/focus/DistractionTracker";
import FocusStats from "@/components/focus/FocusStats";
import SessionHistory from "@/components/focus/SessionHistory";

// 1. Wrapper component to provide Context
export default function FocusPage() {
  return (
    <FocusProvider>
      <FocusPageContent />
    </FocusProvider>
  );
}

// 2. Main Page Layout (can now consume useFocusSystem hook)
function FocusPageContent() {
  // const { state, setMonthYear } = useNexCore(); // Uncomment when integrating
  const { 
    isFocusMode, exitFocusMode, 
    timeRemaining, isActive, isPaused, 
    pauseSession, startSession, stopSession, mode 
  } = useFocusSystem();

  // Helper for immersive timer formatting
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <>
      {/* ✅ ONBOARDING MODAL (Automatically hides itself after first use) */}
      <FocusModal />

      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24 md:pb-10">
        
        {/* ✅ MAIN NAVBAR (Hides during Focus Mode) */}
        {!isFocusMode && (
          <Navbar
            meta={{ currentMonth: "2026-04" } as any} // Mocked: replace with state.meta
            setMonthYear={() => {}} // Mocked: replace with setMonthYear
            exportData={() => {}}
            importData={() => {}}
          />
        )}

        {/* ✅ IMMERSIVE FOCUS OVERLAY (Shows ONLY in Focus Mode) */}
        {isFocusMode && (
          <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col animate-in fade-in duration-300">
            
            {/* Minimal Top Controls */}
            <div className="p-6 flex justify-between items-center border-b border-gray-900/50">
              <span className="text-gray-400 font-mono text-sm uppercase tracking-widest">
                Execution Sequence [{mode}]
              </span>
              <button 
                onClick={exitFocusMode}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-900/50 hover:bg-gray-800 rounded-md transition"
              >
                Exit Fullscreen
              </button>
            </div>

            {/* Immersive Center Content */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-12 pb-20">
              <div className="text-[120px] md:text-[200px] font-semibold tracking-tighter tabular-nums leading-none">
                {formatTime(timeRemaining)}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={isPaused ? startSession : pauseSession}
                  className={`px-8 py-4 text-lg font-medium rounded-full transition active:scale-95 ${
                    isPaused 
                      ? "bg-white text-black hover:bg-gray-200" 
                      : "bg-gray-800 text-white hover:bg-gray-700"
                  }`}
                >
                  {isPaused ? "Resume" : "Pause"}
                </button>
                
                <button
                  onClick={() => stopSession(false)} // ✅ FIX: explicitly pass false to prevent MouseEvent typing error
                  className="px-8 py-4 text-lg font-medium rounded-full bg-red-600/20 text-red-500 hover:bg-red-600/30 transition active:scale-95"
                >
                  End Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ STANDARD DASHBOARD (Hides during Focus Mode) */}
        {!isFocusMode && (
          <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
            
            <div className="mb-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                Focus Engine
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Configure parameters, define your intent, and execute.
              </p>
            </div>

            <TopBar />

            <div className="grid grid-cols-12 gap-6 md:gap-8">
              
              {/* LEFT: COGNITIVE WORKFLOW (Intent -> Execute -> Track) */}
              <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col gap-6 md:gap-8">
                
                {/* STEP 1: INTENT SETUP */}
                <div className={`transition-all duration-500 ${isActive ? "opacity-60 pointer-events-none grayscale-[30%]" : ""}`}>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                    1. Execution Setup
                  </h3>
                  <div className="sticky top-20 z-30">
                    <TaskSelector />
                  </div>
                </div>

                {/* STEP 2: EXECUTION */}
                <div className="relative z-20">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                    2. Execution
                  </h3>
                  <SessionTimer />
                </div>

                {/* STEP 3: TRACKING */}
                <div className="relative z-10">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                    3. Behavior Tracking
                  </h3>
                  <DistractionTracker />
                </div>

              </div>

              {/* RIGHT: ANALYTICS & INTELLIGENCE */}
              <div className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-6">
                <FocusStats />
                <SessionHistory />
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}