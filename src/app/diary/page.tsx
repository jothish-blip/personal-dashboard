"use client";

import React from 'react';
import Navbar from "@/components/Navbar";
import { useDiarySystem } from "@/components/diary/useDiarySystem";
import { LockedScreen, WipPopup } from "@/components/diary/Modals";
import HeaderControls from "@/components/diary/HeaderControls";
import InsightsBoard from "@/components/diary/InsightsBoard";
import BehaviorPanel from "@/components/diary/BehaviorPanel";
import StoryEditor from "@/components/diary/StoryEditor";
import HistoryTimeline from "@/components/diary/HistoryTimeline";

export default function DiaryPage() {
  const system = useDiarySystem();

  if (!system.isLoaded) return null;

  const isLockedAndProtected = system.currentEntry.isLocked && system.selectedDate !== system.actualToday;
  
  if (isLockedAndProtected && system.passwordAttempt !== 'nex') {
    return <LockedScreen passwordAttempt={system.passwordAttempt} setPasswordAttempt={system.setPasswordAttempt} />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans pb-24 relative">
      
      <WipPopup showWipPopup={system.showWipPopup} setShowWipPopup={system.setShowWipPopup} />

      <Navbar
        meta={{ currentMonth: system.selectedDate.slice(0,7), isFocus: false, theme: 'light', lockedDates: [], rollbackUsedDates: [] }}
        setMonthYear={() => {}} exportData={() => {}} importData={() => {}}
      />

      <div className="p-4 md:p-8 max-w-[1100px] mx-auto w-full flex flex-col gap-6 pt-8">
        
        <HeaderControls system={system} />
        <InsightsBoard system={system} />
        <BehaviorPanel system={system} />
        <StoryEditor system={system} />
        <HistoryTimeline system={system} />

      </div>
    </div>
  );
}