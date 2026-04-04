"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { usePlannerSystem } from "@/components/calender/usePlannerSystem";

import TopBar from "@/components/calender/TopBar";
import EventList from "@/components/calender/EventList";
import AnalyticsSidebar from "@/components/calender/AnalyticsSidebar";
import AddEventModal from "@/components/calender/AddEventModal";
import ProgressModal from "@/components/calender/ProgressModal";

export default function MatrixIntelligenceSystem() {
  const system = usePlannerSystem();

  if (!system.isReady) {
    return null; // Or a sleek loading spinner
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
      <Navbar 
        meta={{ currentMonth: "2026-04", isFocus: false, theme: 'light', lockedDates: [], rollbackUsedDates: [] }}
        setMonthYear={() => {}} exportData={() => {}} importData={() => {}}
      />

      <TopBar 
        systemVersion={system.SYSTEM_VERSION} 
        onAddClick={() => system.setIsAddModalOpen(true)} 
      />

      <main className="max-w-7xl mx-auto px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <EventList 
          activeTab={system.activeTab}
          setActiveTab={system.setActiveTab}
          searchQuery={system.searchQuery}
          setSearchQuery={system.setSearchQuery}
          filteredEvents={system.filteredEvents}
          logs={system.logs}
          toggleStatus={system.toggleStatus}
          deleteWithUndo={system.deleteWithUndo}
          onEdit={(ev) => { system.setFormData(ev); system.setIsAddModalOpen(true); }}
        />

        <AnalyticsSidebar analytics={system.analytics} />
      </main>

      <ProgressModal 
        isOpen={system.isStatusModalOpen} 
        onClose={system.closeStatusModal} 
      />

      <AddEventModal 
        isOpen={system.isAddModalOpen}
        onClose={() => system.setIsAddModalOpen(false)}
        formData={system.formData}
        setFormData={system.setFormData}
        handleSave={system.handleSave}
      />
    </div>
  );
}