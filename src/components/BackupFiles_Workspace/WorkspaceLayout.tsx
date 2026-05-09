"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Editor from "./Editor"; 
import { useWorkspaceSystem } from "./useWorkspaceSystem";

export default function WorkspaceLayout() {
  const system = useWorkspaceSystem();

  return (
    // MAIN SHELL: Fills the screen, splits into left (aside) and right (main div)
    <div className="flex h-[calc(100vh-60px)] w-full bg-white overflow-hidden text-gray-800 font-sans border-t border-gray-200">
      
      {/* 1. LEFT SIDE (SIDEBAR) */}
      <aside className={`shrink-0 border-r border-gray-200 bg-gray-50 h-full flex flex-col relative z-20 transition-all duration-300 ${system.isSidebarOpen ? 'w-[260px] translate-x-0' : 'hidden md:flex w-0 -translate-x-full md:w-[260px] md:translate-x-0'}`}>
        <Sidebar system={system} />
      </aside>

      {/* 2. RIGHT SIDE (TABS + EDITOR) */}
      <div className="flex flex-col flex-1 min-w-0 h-full bg-white relative z-10">
        
        {/* TABS ROW */}
        <div className="h-[40px] border-b border-gray-200 bg-[#f8f9fa] flex items-center overflow-x-auto scrollbar-hide shrink-0">
          {system.openTabs.map((id: string) => {
             const doc = system.documents.find((d: any) => d.id === id);
             if (!doc) return null;
             return (
               <div
                 key={id}
                 onClick={() => system.setActiveDocId(id)}
                 className={`group px-3 py-1.5 h-full text-[13px] flex items-center gap-2 cursor-pointer border-r border-gray-200 min-w-[120px] max-w-[200px] transition-colors ${
                   system.activeDocId === id ? "bg-white border-t-2 border-t-gray-800 text-gray-900 font-medium" : "bg-transparent text-gray-500 hover:bg-gray-100 border-t-2 border-t-transparent"
                 }`}
               >
                 <span className="truncate flex-1">{doc.title}</span>
                 <span 
                   className={`p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-800 transition-colors ${system.activeDocId === id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                   onClick={(e) => { e.stopPropagation(); system.closeTab(id); }}
                 >✕</span>
               </div>
             )
          })}
        </div>

        {/* EDITOR CANVAS */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="max-w-[1000px] mx-auto h-full relative">
            {system.openTabs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-[13px]">
                Select or create a file to start working
              </div>
            ) : (
              <Editor system={system} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}