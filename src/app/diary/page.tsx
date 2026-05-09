"use client";

import React from "react";

import Navbar from "@/navigation/Navbar";
// Diary Module Imports
import { useDiarySystem } from "@/modules/diary/engine/useDiarySystem";

import { WipPopup } from "@/modules/diary/components/Modals/Modals";

import HeaderControls from "@/modules/diary/components/HeaderControls/HeaderControls";

import InsightsBoard from "@/modules/diary/components/InsightsBoard/InsightsBoard";

import BehaviorPanel from "@/modules/diary/components/BehaviorPanel/BehaviorPanel";

import StoryEditor from "@/modules/diary/components/StoryEditor/StoryEditor";

import HistoryTimeline from "@/modules/diary/components/HistoryTimeline/HistoryTimeline";

export default function DiaryPage() {

  const system = useDiarySystem();

  // Loading State
  if (!system.isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">

          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />

          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
            Initializing Life Engine...
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24 relative selection:bg-orange-100 selection:text-orange-900">

      {/* Modals */}
      <WipPopup
        showWipPopup={system.showWipPopup}
        setShowWipPopup={system.setShowWipPopup}
      />

      {/* Navbar */}
      <Navbar
        meta={{
          currentMonth: system.selectedDate.slice(0, 7),
          isFocus: false,
          theme: "light",
          lockedDates: [],
          rollbackUsedDates: [],
        }}
        setMonthYear={() => {}}
        exportData={() => {}}
        importData={() => {}}
      />

      {/* Main Layout */}
      <main
        style={{
          paddingTop:
            "calc(var(--navbar-h, 80px) + 1.5rem)",
        }}
        className="p-4 sm:p-6 md:p-8 max-w-[1040px] mx-auto w-full flex flex-col gap-8 md:gap-10 animate-in fade-in duration-500 slide-in-from-bottom-4 text-left"
      >

        {/* Controls */}
        <section aria-label="System Controls">
          <HeaderControls system={system} />
        </section>

        {/* Insights */}
        <section aria-label="Insights & Data">
          <InsightsBoard system={system} />
        </section>

        {/* Behavior */}
        <section aria-label="Behavior Tracking">
          <BehaviorPanel system={system} />
        </section>

        {/* Editor */}
        <section aria-label="Story Editor">
          <StoryEditor system={system} />
        </section>

        {/* Divider */}
        <hr className="border-gray-100 my-10" />

        {/* History */}
        <section
          aria-label="Timeline History"
          className="mt-12"
        >
          <HistoryTimeline system={system} />
        </section>

      </main>
    </div>
  );
}