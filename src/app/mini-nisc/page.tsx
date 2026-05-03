"use client";

import React, { useMemo } from "react";
import Navbar from "@/components/Navbar";
import { useNexCore } from "@/hooks/useNexCore";
import { useWorkspaceSystem } from "@/components/mini-nisc/useWorkspaceSystem";
import { Menu, FolderOpen, ChevronRight, Lock } from "lucide-react";

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

  // ==========================================
  // 🔥 DYNAMIC BREADCRUMB LOGIC (Optimized)
  // ==========================================
  const folderMap = useMemo(() => {
    const map: Record<string, any> = {};
    system.folders.forEach((f: any) => { map[f.id] = f; });
    return map;
  }, [system.folders]);

  const getFolderPath = (folderId?: string | null) => {
    if (!folderId) return [];

    const path: { id: string; name: string }[] = [];
    let current = folderMap[folderId];

    while (current) {
      path.unshift({ id: current.id, name: current.name });
      current = current.parentId ? folderMap[current.parentId] : undefined;
    }

    return path;
  };

  const activeDoc = system.documents.find((d: any) => d.id === system.activeDocId);
  const folderPath = getFolderPath(activeDoc?.folderId);
  const activeWorkspace = system.workspaces.find((w: any) => w.id === system.activeWorkspaceId);
  const isLocked = activeWorkspace?.isLocked;

  return (
    <div className="min-h-screen bg-white text-gray-700 flex flex-col relative overflow-hidden">
      <WipPopup showWipPopup={system.showWipPopup} setShowWipPopup={system.setShowWipPopup} />

      {/* Primary NexTask Navbar */}
      <Navbar meta={state.meta} setMonthYear={setMonthYear} exportData={() => {}} importData={() => {}} />

      <div className="flex flex-1 overflow-hidden relative border-t border-gray-100">
        
        {/* Modern Minimal Sidebar */}
        <aside className={`shrink-0 border-r border-gray-100 bg-gray-50/50 h-full transition-all duration-300 ${system.isSidebarOpen ? 'w-72' : 'w-0'}`}>
          <Sidebar system={system} />
        </aside>

        <main className="flex-1 min-w-0 overflow-hidden flex flex-col bg-white">
          
          {/* Main Navigation Header */}
          <div className="px-6 md:px-10 pt-6 bg-white shrink-0">
            <div className="flex items-center border-b border-gray-100">
              {/* Mobile Sidebar Toggle */}
              <button 
                onClick={() => system.setIsSidebarOpen(!system.isSidebarOpen)} 
                className="md:hidden p-2 -ml-2 text-gray-400 hover:bg-gray-50 rounded-xl mr-2 transition-colors active:scale-95"
              >
                <Menu size={20} />
              </button>

              {/* Desktop Sidebar Toggle */}
              <button
                onClick={() => system.setIsSidebarOpen((p: boolean) => !p)}
                className="hidden md:flex items-center justify-center p-2 -ml-2 text-gray-400 hover:bg-gray-50 rounded-xl mr-2 transition-colors active:scale-95"
              >
                <Menu size={20} />
              </button>
              
              {/* Application Tabs */}
              <div className={`flex overflow-x-auto no-scrollbar w-full gap-2 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                {(["editor", "analytics", "history", "media"] as const).map((v) => (
                  <button 
                    key={v} 
                    onClick={() => system.setView(v)} 
                    className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                      system.view === v 
                        ? "border-green-500 text-green-600 translate-y-[1px]" 
                        : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
                    }`}
                  >
                    {v === "editor" && "Editor"}
                    {v === "analytics" && "Analytics"}
                    {v === "history" && "History"}
                    {v === "media" && <><FolderOpen size={16} /> Media</>}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Breadcrumb Navigation - Hidden when locked to prevent data leaks */}
            {system.view === "editor" && system.activeDocId && !isLocked && (
              <div className="flex items-center gap-1.5 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-50 overflow-x-auto no-scrollbar sticky top-0 bg-white z-10">
                <span className="hover:text-gray-800 hover:underline cursor-pointer transition shrink-0" onClick={() => system.setActiveFolderId(null)}>
                  Workspace
                </span>
                {folderPath.map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    <ChevronRight size={12} className="text-gray-300 shrink-0" />
                    <span className="hover:text-gray-800 hover:underline cursor-pointer transition max-w-[120px] truncate shrink-0" onClick={() => system.setActiveFolderId(folder.id)}>
                      {folder.name}
                    </span>
                  </React.Fragment>
                ))}
                {activeDoc && (
                  <>
                    <ChevronRight size={12} className="text-gray-300 shrink-0" />
                    <span className="text-green-600 font-semibold max-w-[150px] truncate shrink-0">{activeDoc.title || "Untitled"}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Scrollable View Content */}
          <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 scrollbar-hide">
            {isLocked ? (
              <div className="h-full flex flex-col items-center justify-center animate-[fadeIn_0.3s_ease-out]">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <Lock size={24} className="text-gray-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">Workspace Locked</h2>
                <p className="text-[13px] text-gray-500 mb-6 max-w-xs text-center leading-relaxed">
                  This workspace is protected. Enter your PIN to access your files and media.
                </p>
                <button
                  onClick={() => system.setLockModal({ type: "unlock", id: activeWorkspace.id })}
                  className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition shadow-sm active:scale-95"
                >
                  Unlock Workspace
                </button>
              </div>
            ) : (
              <div className="w-full max-w-5xl mx-auto h-full">
                {system.view === "editor" && (
                  system.openTabs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-300 animate-pulse">
                      <p className="text-sm font-medium tracking-widest uppercase">Initialize a node to begin</p>
                    </div>
                  ) : (
                    <Editor system={system} />
                  )
                )}
                
                {system.view === "media" && <MediaLibrary system={system} />}
                {system.view === "analytics" && <Analytics documents={system.documents} media={system.media} />}
                {system.view === "history" && (
                  <HistoryView 
                    documents={system.documents} 
                    setDocuments={system.setDocuments} 
                    setView={system.setView} 
                    setActiveDocId={system.setActiveDocId} 
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <GlobalSearch system={system} />
    </div>
  );
}