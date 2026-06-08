"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/navigation/Navbar";
import { useNexCore } from "@/modules/tasks/engine/useNexCore";
import { useWorkspaceSystem } from "@/modules/workspace/engine/useWorkspaceSystem";
import { useTheme } from "@/theme/ThemeProvider";

import { FileText, Menu, ChevronDown, Check, FolderOpen, BarChart2, Clock } from "lucide-react";

// Workspace Module Components
import Sidebar from "@/modules/workspace/components/Sidebar/Sidebar";
import Editor from "@/modules/workspace/components/Editor/Editor";
import MediaLibrary from "@/modules/workspace/components/MediaLibrary/MediaLibrary";
import Analytics from "@/modules/workspace/components/Analytics/Analytics";
import HistoryView from "@/modules/workspace/components/HistoryView/HistoryView";
import GlobalSearch from "@/modules/workspace/components/GlobalSearch/GlobalSearch";

// Asserting IDs as const gives them strict literal types instead of generic strings
const WORKSPACE_VIEWS = [
  { id: "editor" as const, icon: FileText, label: "Editor" },
  { id: "media" as const, icon: FolderOpen, label: "Media" },
  { id: "analytics" as const, icon: BarChart2, label: "Analytics" },
  { id: "history" as const, icon: Clock, label: "History" },
];

export default function NexSpaceWorkspace() {
  const { state, setMonthYear } = useNexCore();
  const system = useWorkspaceSystem();
  const { isDarkMode } = useTheme();

  const [showViewMenu, setShowViewMenu] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const closeMenu = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.fallback-view-menu')) {
        setShowViewMenu(false);
      }
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  const activeDoc = system.documents?.find(
    (d: any) => d.id === system.activeDocId
  );

  const ActiveIcon = WORKSPACE_VIEWS.find(v => v.id === system.view)?.icon || FileText;
  const activeLabel = WORKSPACE_VIEWS.find(v => v.id === system.view)?.label || "Editor";

  return (
    <div className={`min-h-screen flex flex-col relative pt-[var(--navbar-h)] transition-colors ${
      isDarkMode ? "bg-black text-white" : "bg-white text-neutral-900"
    }`}>

      {/* Primary Navbar */}
      <Navbar
        meta={state.meta}
        setMonthYear={setMonthYear}
        exportData={() => {}}
        importData={() => {}}
      />

      {/* UNIFIED WORKSPACE LAYOUT */}
      <div className={`flex flex-1 relative border-t min-w-0 ${isDarkMode ? "border-neutral-900" : "border-neutral-100"}`}>

        {/* Sidebar */}
        <Sidebar system={system} />

        {/* Main Content Area */}
        <main
          className={`flex-1 min-w-0 flex flex-col relative transition-all duration-300 ${
            isDarkMode ? "bg-[#050505]" : "bg-[#f9fafb]"
          }`}
        >
          {/* 🔥 FALLBACK NAVIGATION (Shows on Media, Analytics, History) */}
          {system.view !== "editor" && (
            <div className={`px-4 py-2 border-b flex items-center justify-between sticky top-0 z-40 transition-colors ${
                isDarkMode ? "bg-[#0a0a0a] border-neutral-800" : "bg-gray-50/80 border-neutral-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    system.setIsSidebarOpen(!system.isSidebarOpen);
                  }}
                  className={`p-1.5 rounded-lg active:scale-95 transition-colors ${
                    isDarkMode ? "hover:bg-neutral-800 text-neutral-400" : "hover:bg-neutral-200 text-neutral-600"
                  }`}
                >
                  <Menu size={18} />
                </button>

                <div className="relative fallback-view-menu">
                  <button 
                    onClick={() => setShowViewMenu(!showViewMenu)} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold active:scale-95 transition-all ${
                      isDarkMode 
                        ? "bg-[#1f1f1f] border border-neutral-800 text-white hover:bg-neutral-800" 
                        : "bg-white border border-neutral-200 text-neutral-900 hover:bg-neutral-50 shadow-sm"
                    }`}
                  >
                    <ActiveIcon size={14} className="text-orange-500" />
                    <span className="hidden sm:inline">{activeLabel}</span>
                    <ChevronDown size={14} className="opacity-50" />
                  </button>

                  {showViewMenu && (
                    <div className={`absolute top-full mt-2 left-0 w-48 border rounded-xl shadow-xl py-1.5 z-50 animate-in slide-in-from-top-2 ${
                      isDarkMode ? "bg-[#111111] border-neutral-800" : "bg-white border-neutral-200"
                    }`}>
                      {WORKSPACE_VIEWS.map((v) => {
                        const isActive = system.view === v.id;
                        const Icon = v.icon;
                        return (
                          <button 
                            key={v.id}
                            // No more TS error here: v.id is strictly typed
                            onClick={() => { system.setView(v.id); setShowViewMenu(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors ${
                              isActive 
                                ? (isDarkMode ? "text-orange-500 bg-orange-500/10" : "text-orange-600 bg-orange-50") 
                                : (isDarkMode ? "text-gray-300 hover:bg-neutral-800" : "text-gray-700 hover:bg-neutral-50")
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon size={14} className={isActive ? "text-orange-500" : "opacity-50"} /> 
                              {v.label}
                            </div>
                            {isActive && <Check size={14} className="text-orange-500" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MAIN CONTENT CANVAS - Full Bleed */}
          <div className="flex-1 scrollbar-hide">
            <div className="w-full h-full relative flex flex-col">

              {system.view === "editor" && (
                system.openTabs?.length === 0 && !activeDoc ? (
                  <div className="h-full flex flex-col items-center justify-center animate-[fadeIn_0.3s_ease-out] px-4">
                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center mb-4 shadow-sm ${
                      isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-100"
                    }`}>
                      <FileText size={20} className={isDarkMode ? "text-neutral-500" : "text-neutral-300"} />
                    </div>
                    <p className={`text-sm font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-neutral-700"}`}>
                      Your workspace is ready
                    </p>
                    <p className={`text-xs mt-1 text-center max-w-[250px] ${isDarkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                      Select a file from the sidebar or create a new one to start writing.
                    </p>
                  </div>
                ) : (
                  <Editor system={system} />
                )
              )}

              {system.view === "analytics" && (
                <Analytics
                  documents={system.documents}
                  media={system.media}
                />
              )}

              {system.view === "media" && (
                <MediaLibrary system={system} />
              )}

              {system.view === "history" && (
                <HistoryView
                  documents={system.documents}
                  setDocuments={system.setDocuments}
                  setView={system.setView}
                  setActiveDocId={system.setActiveDocId}
                />
              )}

            </div>
          </div>
        </main>
      </div>

      <GlobalSearch system={system} />
    </div>
  );
}