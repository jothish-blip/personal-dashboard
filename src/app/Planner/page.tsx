"use client";

import React from "react";

import Navbar from "@/navigation/Navbar";

// Planner Module Imports
import { usePlannerSystem } from "@/modules/planner/engine/usePlannerSystem";

import TopBar from "@/modules/planner/components/TopBar/TopBar";
import EventList from "@/modules/planner/components/EventList/EventList";
import AnalyticsSidebar from "@/modules/planner/components/AnalyticsSidebar/AnalyticsSidebar";
import AddEventModal from "@/modules/planner/components/AddEventModal/AddEventModal";

export default function MatrixIntelligenceSystem() {
  const system =
    usePlannerSystem();

  if (!system.isReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 font-sans">
      {/* Main Navigation */}
      <Navbar
        meta={{
          currentMonth:
            "2026-04",
          isFocus: false,
          theme: "light",
          lockedDates: [],
          rollbackUsedDates:
            [],
        }}
        setMonthYear={() => {}}
        exportData={() => {}}
        importData={() => {}}
      />

      {/* TopBar */}
      <TopBar
        events={system.events}
        activeTab={
          system.activeTab as any
        }
        setActiveTab={
          system.setActiveTab as any
        }
        onAddClick={() =>
          system.setIsAddModalOpen(
            true
          )
        }
      />

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-5 lg:pt-6 flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-10">
        {/* Left Side */}
        <div className="w-full lg:col-span-8">
          <EventList
            activeTab={
              system.activeTab as any
            }
            setActiveTab={
              system.setActiveTab as any
            }
            searchQuery={
              system.searchQuery
            }
            setSearchQuery={
              system.setSearchQuery
            }
            filteredEvents={
              system.filteredEvents
            }
            logs={system.logs}
            toggleStatus={
              system.toggleStatus
            }
            deleteWithUndo={
              system.deleteWithUndo
            }
            onEdit={(ev) => {
              system.setFormData(
                ev
              );

              system.setIsAddModalOpen(
                true
              );
            }}
            onAddClick={() =>
              system.setIsAddModalOpen(
                true
              )
            }
            getDateLabel={
              system.getDateLabel
            }
          />
        </div>

        {/* Mobile Sidebar */}
        <div className="block lg:hidden mt-4">
          <AnalyticsSidebar
            analytics={
              system.analytics
            }
            rescheduleTask={
              system.rescheduleTask
            }
            rescheduleAllMissed={
              system.rescheduleAllMissed
            }
          />
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-4 self-start">
          <AnalyticsSidebar
            analytics={
              system.analytics
            }
            rescheduleTask={
              system.rescheduleTask
            }
            rescheduleAllMissed={
              system.rescheduleAllMissed
            }
          />
        </aside>
      </main>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={
          system.isAddModalOpen
        }
        onClose={() => {
          system.setIsAddModalOpen(
            false
          );

          // Timezone-safe date reset
          const d =
            new Date();

          d.setMinutes(
            d.getMinutes() -
              d.getTimezoneOffset()
          );

          const localDate =
            d
              .toISOString()
              .split("T")[0];

          // Reset form
          system.setFormData({
            id: "",
            title: "",
            date: localDate,
            time: "09:00",
            type: "Work",
            priority:
              "medium",
          });
        }}
        formData={
          system.formData
        }
        setFormData={
          system.setFormData
        }
        handleSave={
          system.handleSave
        }
      />
    </div>
  );
}