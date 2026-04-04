"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { useNexCore } from "@/hooks/useNexCore";
import { useWorkspaceSystem } from "@/components/mini-nisc/useWorkspaceSystem";
import { Menu, FolderOpen } from "lucide-react";

import { WipPopup } from "@/components/mini-nisc/Modals";
import Sidebar from "@/components/mini-nisc/Sidebar";
import Editor from "@/components/mini-nisc/Editor";
import MediaLibrary from "@/components/mini-nisc/MediaLibrary";
import Analytics from "@/components/mini-nisc/Analytics";
import HistoryView from "@/components/mini-nisc/HistoryView";
import GlobalSearch from "@/components/mini-nisc/GlobalSearch";

export default function NexTaskWorkspace() {
  const { state, setMonthYear } = useNexCore();
  const system = useWorkspaceSystem();

  return (
    <div className="min-h-screen bg-white text-gray-700 flex flex-col relative">
      <WipPopup showWipPopup={system.showWipPopup} setShowWipPopup={system.setShowWipPopup} />

      <Navbar meta={state.meta} setMonthYear={setMonthYear} exportData={() => {}} importData={() => {}} />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar system={system} />

        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col bg-white">
          <div className="w-full max-w-5xl mx-auto p-4 md:p-8 flex-1">
            <div className="flex items-center border-b border-gray-200 mb-6 md:mb-8">
              <button onClick={() => system.setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg mr-2 transition-colors">
                <Menu size={20} />
              </button>
              <div className="flex overflow-x-auto no-scrollbar w-full [&::-webkit-scrollbar]:hidden">
                {(["editor", "analytics", "history", "media"] as const).map((v) => (
                  <button key={v} onClick={() => system.setView(v)} className={`px-4 md:px-6 py-3 text-xs md:text-sm font-semibold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${system.view === v ? "border-green-500 text-green-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                    {v === "editor" && "Editor"}
                    {v === "analytics" && "Analytics"}
                    {v === "history" && "History"}
                    {v === "media" && <><FolderOpen size={16} /> Media</>}
                  </button>
                ))}
              </div>
            </div>

            {system.view === "editor" && <Editor system={system} />}
            {system.view === "media" && <MediaLibrary system={system} />}
            {system.view === "analytics" && <Analytics documents={system.documents} media={system.media} />}
            {system.view === "history" && <HistoryView activeDocument={system.activeDocument} setDocuments={system.setDocuments} setView={system.setView} />}
          </div>
        </main>
      </div>

      <GlobalSearch system={system} />
    </div>
  );
}