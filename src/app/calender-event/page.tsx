"use client";

import React from "react";
import Navbar from "@/components/Navbar";

// Fixed Imports using relative paths to ensure the module is found
import { usePlannerSystem } from "../../components/calender/usePlannerSystem";
import TopBar from "../../components/calender/TopBar";
import EventList from "../../components/calender/EventList";
import AnalyticsSidebar from "../../components/calender/AnalyticsSidebar";
import AddEventModal from "../../components/calender/AddEventModal";
import ProgressModal from "../../components/calender/ProgressModal";

export default function MatrixIntelligenceSystem() {
  const system = usePlannerSystem();

  if (!system.isReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 font-sans">
      {/* 1. Main Navigation */}
      <Navbar 
        meta={{ 
          currentMonth: "2026-04", 
          isFocus: false, 
          theme: 'light', 
          lockedDates: [], 
          rollbackUsedDates: [] 
        }}
        setMonthYear={() => {}} 
        exportData={() => {}} 
        importData={() => {}}
      />

      {/* 2. TopBar - Wired to unified state */}
      <TopBar 
        events={system.events}
        filterMode={system.activeTab}
        setFilterMode={system.setActiveTab}
        onAddClick={() => system.setIsAddModalOpen(true)} 
      />

      {/* 3. Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 lg:pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Side: Event List */}
        <div className="lg:col-span-8">
          <EventList 
            activeTab={system.activeTab} 
            setActiveTab={system.setActiveTab} 
            searchQuery={system.searchQuery}
            setSearchQuery={system.setSearchQuery}
            filteredEvents={system.filteredEvents}
            logs={system.logs}
            toggleStatus={system.toggleStatus}
            deleteWithUndo={system.deleteWithUndo}
            onEdit={(ev) => { 
              system.setFormData(ev); 
              system.setIsAddModalOpen(true); 
            }}
          />
        </div>

        {/* 4. Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-4">
          <AnalyticsSidebar 
            analytics={system.analytics} 
            rescheduleTask={system.rescheduleTask}
            rescheduleAllMissed={system.rescheduleAllMissed}
          />
        </aside>

      </main>

      {/* 5. Modals & Overlays */}
      <ProgressModal 
        isOpen={system.isStatusModalOpen} 
        onClose={system.closeStatusModal} 
      />

      <AddEventModal 
        isOpen={system.isAddModalOpen}
        onClose={() => {
          system.setIsAddModalOpen(false);
          // Reset form on close
          system.setFormData({ 
            id: "", 
            title: "", 
            date: new Date().toISOString().split('T')[0], 
            time: "09:00", 
            type: "Work", 
            priority: "medium" 
          });
        }}
        formData={system.formData}
        setFormData={system.setFormData}
        handleSave={system.handleSave}
      />
    </div>
  );
}