"use client";

import React from "react";

import { FocusProvider, useFocusSystem } from "@/modules/focus/engine/useFocusSystem";

import Navbar from "@/navigation/Navbar";

// Focus Module Components
import TopBar from "@/modules/focus/components/TopBar/TopBar";
import SessionTimer from "@/modules/focus/components/SessionTimer/SessionTimer";
import TaskSelector from "@/modules/focus/components/TaskSelector/TaskSelector";
import DistractionTracker from "@/modules/focus/components/DistractionTracker/DistractionTracker";
import FocusStats from "@/modules/focus/components/FocusStats/FocusStats";
import SessionHistory from "@/modules/focus/components/SessionHistory/SessionHistory";

// 1. Wrapper component to provide Context
export default function FocusPage() {
  return (
    <FocusProvider>
      <FocusPageContent />
    </FocusProvider>
  );
}

// 2. Main Page Layout
function FocusPageContent() {
  const {
    isFocusMode,
    exitFocusMode,
    timeRemaining,
    isActive,
    isPaused,
    pauseSession,
    startSession,
    stopSession,
    mode,
  } = useFocusSystem();

  // Helper for immersive timer formatting
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const s = (seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${m}:${s}`;
  };

  return (
    <>

      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24 md:pb-10">

        {/* MAIN NAVBAR */}
        {!isFocusMode && (
          <Navbar
            meta={{ currentMonth: "2026-04" } as any}
            setMonthYear={() => {}}
            exportData={() => {}}
            importData={() => {}}
          />
        )}

        {/* IMMERSIVE FOCUS OVERLAY */}
        {isFocusMode && (
          <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col animate-in fade-in duration-300">

            {/* Top Controls */}
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

            {/* Center Content */}
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
                  onClick={() => stopSession(false)}
                  className="px-8 py-4 text-lg font-medium rounded-full bg-red-600/20 text-red-500 hover:bg-red-600/30 transition active:scale-95"
                >
                  End Session
                </button>

              </div>
            </div>
          </div>
        )}

        {/* STANDARD DASHBOARD */}
        {!isFocusMode && (

          <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-5 md:pt-6 pb-6 space-y-5 md:space-y-6 animate-in fade-in duration-500">

            <div className="mb-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                Focus System
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Configure parameters, define your intent, and execute.
              </p>
            </div>

            <TopBar />

            <div className="grid grid-cols-12 gap-6 md:gap-8">

              {/* LEFT SIDE */}
              <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col gap-6 md:gap-8">

                {/* EXECUTION SETUP */}
                <div
                  className={`transition-all duration-500 ${
                    isActive
                      ? "opacity-60 pointer-events-none grayscale-[30%]"
                      : ""
                  }`}
                >
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                    1. Execution Setup
                  </h3>

                  <div className="sticky top-32 md:top-28 z-20">
                    <TaskSelector />
                  </div>
                </div>

                {/* EXECUTION */}
                <div className="relative z-20">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                    2. Execution
                  </h3>

                  <SessionTimer />
                </div>

                {/* TRACKING */}
                <div className="relative z-10">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                    3. Behavior Tracking
                  </h3>

                  <DistractionTracker />
                </div>

              </div>

              {/* RIGHT SIDE */}
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