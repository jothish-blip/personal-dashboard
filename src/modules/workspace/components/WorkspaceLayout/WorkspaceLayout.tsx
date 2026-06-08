"use client";

import React, { useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Editor from "../Editor/Editor";
import HistoryView from "../HistoryView/HistoryView";
import MediaLibrary from "../MediaLibrary/MediaLibrary";
import Analytics from "../Analytics/Analytics";
import { useWorkspaceSystem } from "../../engine/useWorkspaceSystem";
import { 
  ChevronRight, 
  FolderPlus, 
  FilePlus, 
  Upload, 
  FileText,
  Folder,
  Clock,
  Menu,
  BarChart2
} from "lucide-react";

export default function WorkspaceLayout() {
  const system = useWorkspaceSystem();

  // Lookups
  const activeDoc = system.documents?.find((d: any) => d.id === system.activeDocId);
  const activeWorkspace = system.workspaces?.find((w: any) => w.id === system.activeWorkspaceId);

  // 🔥 SMART SIDEBAR UX: Auto-close on non-editor pages, Auto-open on Editor
  useEffect(() => {
    if (system.view !== "editor") {
      system.setIsSidebarOpen(false); // Close when going to History, Analytics, etc.
    } else {
      // Re-open when coming back to Editor (only if on Desktop to protect mobile UX)
      if (window.innerWidth >= 1024) {
        system.setIsSidebarOpen(true);
      }
    }
  }, [system.view, system.setIsSidebarOpen]);

  return (
    <div className="flex flex-1 h-full min-h-0 w-full bg-white overflow-hidden text-gray-800 font-sans border-t border-gray-200 relative">
      
      {/* 🔥 MOBILE OVERLAY: Tap outside to close */}
      {system.isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden transition-opacity"
          onClick={() => system.setIsSidebarOpen(false)}
        />
      )}

      {/* 1. LEFT SIDE (SIDEBAR) */}
      <aside 
        className={`shrink-0 border-gray-200 bg-gray-50 h-full flex flex-col absolute lg:relative z-30 transition-all duration-300 ease-in-out overflow-hidden ${
          system.isSidebarOpen 
            ? "w-[280px] sm:w-[320px] border-r translate-x-0 shadow-2xl lg:shadow-none" 
            : "w-[280px] sm:w-[320px] lg:w-0 border-r lg:border-r-0 -translate-x-full lg:translate-x-0 opacity-0 lg:opacity-100 pointer-events-none lg:pointer-events-auto"
        }`}
      >
        <Sidebar system={system} />
      </aside>

      {/* 2. RIGHT SIDE (WORKSPACE HEADER + CONTENT AREA) */}
      <div className="flex flex-col flex-1 min-w-0 h-full bg-white relative z-10">
        
        {/* WORKSPACE HEADER */}
        <div className="flex flex-col border-b border-gray-200 bg-white px-4 md:px-8 pt-5 pb-4 shrink-0 z-10">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500 mb-2 overflow-x-auto no-scrollbar pl-1 md:pl-0">
            <span className="hover:text-gray-900 cursor-pointer transition-colors whitespace-nowrap">
              {activeWorkspace?.name || "Workspace"}
            </span>
            {activeDoc && system.view === "editor" && (
              <>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
                <span className="text-gray-900 truncate max-w-[150px] md:max-w-[200px]">{activeDoc.title || "Untitled"}</span>
              </>
            )}
            {system.view !== "editor" && (
              <>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
                <span className="text-gray-900 capitalize">{system.view}</span>
              </>
            )}
          </div>

          {/* Title & Actions Row */}
          <div className="flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              {/* HAMBURGER MENU: Shows when sidebar is closed so you can always open it back up */}
              {!system.isSidebarOpen && (
                <button 
                  onClick={() => system.setIsSidebarOpen(true)}
                  className="p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 text-gray-600 transition-colors"
                >
                  <Menu size={20} />
                </button>
              )}

              {/* Title & Metadata */}
              <div className="flex flex-col">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate max-w-[200px] md:max-w-[400px]">
                  {system.view !== "editor" 
                    ? system.view.charAt(0).toUpperCase() + system.view.slice(1)
                    : (activeDoc ? (activeDoc.title || "Untitled") : (activeWorkspace?.name || "Workspace"))}
                </h1>
                
                {/* Workspace Metadata Row (Hidden on Mobile) */}
                {!activeDoc && system.view === "editor" && (
                  <div className="hidden md:flex items-center gap-3 mt-1 text-[13px] text-gray-500 font-medium">
                    <span className="flex items-center gap-1"><Clock size={12} /> Last Edited: Today</span>
                    <span>&bull;</span>
                    <span>Files: {system.documents?.length || 0}</span>
                    <span>&bull;</span>
                    <span>Folders: {system.folders?.length || 0}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Universal Workspace Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop Actions */}
              <div className="hidden lg:flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors">
                  <Upload size={16} /> Upload
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors">
                  <FolderPlus size={16} /> New Folder
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 active:scale-95 rounded-lg transition-all">
                  <FilePlus size={16} /> New File
                </button>
              </div>

              {/* Mobile Actions - Simplified */}
              <div className="lg:hidden flex items-center">
                <button className="flex items-center justify-center w-9 h-9 text-white bg-gray-900 hover:bg-gray-800 active:scale-95 rounded-lg transition-all shadow-sm">
                  <FilePlus size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* WORKSPACE CONTENT CANVAS */}
        <div className="flex-1 overflow-auto bg-[#fafafa]">
          <div className="max-w-[1600px] mx-auto p-4 md:p-8 h-full relative flex flex-col">
            
            {/* ROUTING ZONE */}
            
            {system.view === "history" && (
              <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 md:p-6 flex flex-col min-h-0 shadow-sm animate-in fade-in duration-300">
                <HistoryView 
                  documents={system.documents} 
                  setDocuments={system.setDocuments} 
                  setView={system.setView} 
                  setActiveDocId={system.setActiveDocId} 
                />
              </div>
            )}

            {system.view === "analytics" && (
              <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 md:p-6 flex flex-col min-h-0 shadow-sm animate-in fade-in duration-300">
                <Analytics documents={system.documents} media={system.media} />
              </div>
            )}

            {system.view === "media" && (
              <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 md:p-6 flex flex-col min-h-0 shadow-sm animate-in fade-in duration-300">
                <MediaLibrary system={system} />
              </div>
            )}

            {system.view === "editor" && (
              activeDoc ? (
                // Active Editor State
                <div className="flex-1 bg-white rounded-xl border border-gray-200 p-2 md:p-4 flex flex-col min-h-0 shadow-sm animate-in fade-in duration-300">
                  <Editor system={system} />
                </div>
              ) : (
                // Workspace Home Dashboard
                <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 md:p-8 flex flex-col min-h-0 overflow-y-auto shadow-sm animate-in fade-in duration-300">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">Your workspace is ready</h2>
                  <p className="text-sm text-gray-500 mb-6 md:mb-8">Create a file or choose one from the sidebar.</p>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 md:mb-10">
                    <button className="flex flex-col items-start p-4 md:p-5 border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm hover:bg-gray-50 transition-all text-left group">
                      <div className="p-2 bg-gray-100 rounded-lg mb-4 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <FilePlus size={20} className="text-gray-700"/>
                      </div>
                      <span className="font-semibold text-gray-900">New File</span>
                      <span className="text-sm text-gray-500 mt-1 line-clamp-1">Start drafting a new document</span>
                    </button>
                    <button className="flex flex-col items-start p-4 md:p-5 border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm hover:bg-gray-50 transition-all text-left group">
                      <div className="p-2 bg-gray-100 rounded-lg mb-4 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <FolderPlus size={20} className="text-gray-700"/>
                      </div>
                      <span className="font-semibold text-gray-900">New Folder</span>
                      <span className="text-sm text-gray-500 mt-1 line-clamp-1">Organize your workspace</span>
                    </button>
                    <button className="flex flex-col items-start p-4 md:p-5 border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm hover:bg-gray-50 transition-all text-left group sm:col-span-2 lg:col-span-1">
                      <div className="p-2 bg-gray-100 rounded-lg mb-4 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <Upload size={20} className="text-gray-700"/>
                      </div>
                      <span className="font-semibold text-gray-900">Upload Assets</span>
                      <span className="text-sm text-gray-500 mt-1 line-clamp-1">Import files to this workspace</span>
                    </button>
                  </div>

                  {/* Recent Activity Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
                    {/* Recent Files */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" /> Recent Files
                      </h3>
                      <div className="space-y-1">
                        <div className="px-3 py-2 text-sm text-gray-500 italic bg-gray-50 rounded-md border border-gray-100">
                          No recent files found.
                        </div>
                      </div>
                    </div>

                    {/* Recent Folders */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Folder size={16} className="text-gray-400" /> Recent Folders
                      </h3>
                      <div className="space-y-1">
                        <div className="px-3 py-2 text-sm text-gray-500 italic bg-gray-50 rounded-md border border-gray-100">
                          No recent folders found.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

          </div>
        </div>

      </div>
    </div>
  );
}