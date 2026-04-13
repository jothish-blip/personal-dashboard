"use client";

import React from 'react';
import Navbar from "@/components/Navbar";
import { useDiarySystem } from "@/components/diary/useDiarySystem";
import { WipPopup } from "@/components/diary/Modals";
import HeaderControls from "@/components/diary/HeaderControls";
import InsightsBoard from "@/components/diary/InsightsBoard";
import BehaviorPanel from "@/components/diary/BehaviorPanel";
import StoryEditor from "@/components/diary/StoryEditor";
import HistoryTimeline from "@/components/diary/HistoryTimeline";

export default function DiaryPage() {
  const system = useDiarySystem();

  // 1️⃣ Sleek Loading State (Prevents blank screen flash)
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
      
      {/* Modals & Overlays */}
      <WipPopup showWipPopup={system.showWipPopup} setShowWipPopup={system.setShowWipPopup} />

      <Navbar
        meta={{ 
          currentMonth: system.selectedDate.slice(0, 7), 
          isFocus: false, 
          theme: 'light', 
          lockedDates: [], 
          rollbackUsedDates: [] 
        }}
        setMonthYear={() => {}} 
        exportData={() => {}} 
        importData={() => {}}
      />

      {/* Main Dashboard Layout */}
      <main className="p-4 sm:p-6 md:p-8 max-w-[1040px] mx-auto w-full flex flex-col gap-8 md:gap-10 pt-6 md:pt-10 animate-in fade-in duration-500 slide-in-from-bottom-4 text-left">
        
        {/* The Cockpit */}
        <section aria-label="System Controls">
          <HeaderControls system={system} />
        </section>
        
        {/* Analytics & Truth */}
        <section aria-label="Insights & Data">
          <InsightsBoard system={system} />
        </section>
        
        {/* Behavior & Metadata Configuration */}
        <section aria-label="Behavior Tracking">
          <BehaviorPanel system={system} />
        </section>
        
        {/* The Core Journaling Flow */}
        <section aria-label="Story Editor">
          <StoryEditor system={system} />
        </section>

        {/* Visual Break before History Vault */}
        <hr className="border-gray-100 my-10" />
        
        {/* The Temporal Vault */}
        <section aria-label="Timeline History" className="mt-12">
          <HistoryTimeline system={system} />
        </section>

      </main>
    </div>
  );
}