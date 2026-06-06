"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";

import Navbar from "@/navigation/Navbar";
import { useNexCore } from "@/modules/tasks/engine/useNexCore";
import { useWorkspaceSystem } from "@/modules/workspace/engine/useWorkspaceSystem";

import { Menu, FolderOpen, ChevronRight, Lock, Monitor, ArrowLeft } from "lucide-react";

// Workspace Module Components
import Sidebar from "@/modules/workspace/components/Sidebar/Sidebar";
import Editor from "@/modules/workspace/components/Editor/Editor";
import MediaLibrary from "@/modules/workspace/components/MediaLibrary/MediaLibrary";
import Analytics from "@/modules/workspace/components/Analytics/Analytics";
import HistoryView from "@/modules/workspace/components/HistoryView/HistoryView";
import GlobalSearch from "@/modules/workspace/components/GlobalSearch/GlobalSearch";

const SIDEBAR_WIDTH = 300;

export default function NexSpaceWorkspace() {
  const { state, setMonthYear } = useNexCore();
  const system = useWorkspaceSystem();

  // ==========================================
  // SCROLL & TABS ANIMATION STATE
  // ==========================================
  const [showTabs, setShowTabs] = useState(true);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Unified window scroll listener with thresholds
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      const currentY = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // top area
          if (currentY <= 20) {
            setShowTabs(true);
            lastY = currentY;
            ticking = false;
            return;
          }

          // scrolling down
          if (currentY > lastY + 10) {
            setShowTabs(false);
            lastY = currentY;
          }

          // scrolling up
          if (currentY < lastY - 10) {
            setShowTabs(true);
            lastY = currentY;
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Track dynamic tabs height
  useEffect(() => {
    const updateTabsHeight = () => {
      if (tabsRef.current) {
        const h = tabsRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--tabs-h",
          `${h}px`
        );
      }
    };

    updateTabsHeight();
    window.addEventListener("resize", updateTabsHeight);

    return () =>
      window.removeEventListener("resize", updateTabsHeight);
  }, [showTabs]);

  // ==========================================
  // DYNAMIC BREADCRUMB LOGIC
  // ==========================================
  const folderMap = useMemo(() => {
    const map: Record<string, any> = {};
    system.folders.forEach((f: any) => {
      map[f.id] = f;
    });
    return map;
  }, [system.folders]);

  const getFolderPath = (folderId?: string | null) => {
    if (!folderId) return [];
    const path: { id: string; name: string }[] = [];
    let current = folderMap[folderId];

    while (current) {
      path.unshift({
        id: current.id,
        name: current.name,
      });

      current = current.parentId
        ? folderMap[current.parentId]
        : undefined;
    }
    return path;
  };

  const activeDoc = system.documents.find(
    (d: any) => d.id === system.activeDocId
  );

  const folderPath = getFolderPath(activeDoc?.folderId);
  const activeWorkspace = system.workspaces.find(
    (w: any) => w.id === system.activeWorkspaceId
  );
  const isLocked = activeWorkspace?.isLocked;

  return (
    <div className="min-h-screen bg-white text-gray-700 flex flex-col relative pt-[var(--navbar-h)]">

      {/* Primary Navbar */}
      <Navbar
        meta={state.meta}
        setMonthYear={setMonthYear}
        exportData={() => {}}
        importData={() => {}}
      />

      {/* MOBILE BLOCKER STATE */}
      <div className="md:hidden flex flex-1 flex-col items-center justify-center p-8 text-center bg-gray-50/50">
        <div className="w-20 h-20 bg-white border border-gray-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <Monitor size={32} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">
          Desktop Only
        </h2>
        <p className="text-[13px] text-gray-500 max-w-[280px] leading-relaxed mb-8">
          The workspace module features a complex interface that requires a larger screen. Please open this page on a desktop or tablet device.
        </p>
        <Link 
          href="/" 
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-[13px] font-medium hover:bg-gray-800 transition-colors active:scale-95"
        >
          <ArrowLeft size={16} />
          Return to Tasks
        </Link>
      </div>

      {/* DESKTOP WORKSPACE LAYOUT */}
      <div className="hidden md:flex flex-1 relative border-t border-gray-100">

        {/* Sidebar */}
        <Sidebar system={system} />

        {/* Main Content */}
        <main
          className={`flex-1 min-w-0 flex flex-col bg-white relative transition-all duration-300 ${
            system.isSidebarOpen
              ? "ml-[300px]"
              : "ml-0"
          }`}
        >

          {/* Sticky Tabs */}
          <div className="relative z-50">
            <div
              ref={tabsRef}
              style={{
                top: "var(--navbar-h)",
                transition:
                  "transform 200ms ease, left 300ms ease",
              }}
              className={`fixed right-0 z-50 border-b border-gray-100 shadow-sm bg-white/90 backdrop-blur-md will-change-transform left-0 ${
                system.isSidebarOpen
                  ? "left-[300px]"
                  : ""
              } ${
                showTabs
                  ? "translate-y-0"
                  : "-translate-y-full"
              }`}
            >

              <div className="flex items-center px-6 md:px-10 pt-6">

                {/* Desktop Toggle */}
                <button
                  onClick={() =>
                    system.setIsSidebarOpen(
                      (p: boolean) => !p
                    )
                  }
                  className="hidden md:flex items-center justify-center p-2 -ml-2 text-gray-400 hover:bg-gray-50 rounded-xl mr-2 transition-colors active:scale-95"
                >
                  <Menu size={20} />
                </button>

                {/* Tabs */}
                <div
                  className={`flex overflow-x-auto no-scrollbar w-full gap-2 ${
                    isLocked
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  {(
                    [
                      "editor",
                      "analytics",
                      "media",
                      "history",
                    ] as const
                  ).map((v) => (
                    <button
                      key={v}
                      onClick={() => system.setView(v)}
                      className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                        system.view === v
                          ? "border-orange-500 text-orange-600 translate-y-[1px]"
                          : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
                      }`}
                    >
                      {v === "editor" && "Editor"}
                      {v === "analytics" && "Analytics"}
                      {v === "media" && (
                        <>
                          <FolderOpen size={16} />
                          Media
                        </>
                      )}
                      {v === "history" && "History"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Breadcrumbs */}
              {system.view === "editor" &&
                system.activeDocId &&
                !isLocked && (
                  <div className="flex items-center gap-1.5 px-6 md:px-10 py-3 text-[11px] font-semibold text-gray-500 overflow-x-auto no-scrollbar">

                    <span
                      className="hover:text-gray-800 hover:underline cursor-pointer transition shrink-0"
                      onClick={() =>
                        system.setActiveFolderId(null)
                      }
                    >
                      Workspace
                    </span>

                    {folderPath.map((folder) => (
                      <React.Fragment key={folder.id}>
                        <ChevronRight
                          size={12}
                          className="text-gray-300 shrink-0"
                        />
                        <span
                          className="hover:text-gray-800 hover:underline cursor-pointer transition max-w-[120px] truncate shrink-0"
                          onClick={() =>
                            system.setActiveFolderId(folder.id)
                          }
                        >
                          {folder.name}
                        </span>
                      </React.Fragment>
                    ))}

                    {activeDoc && (
                      <>
                        <ChevronRight
                          size={12}
                          className="text-gray-300 shrink-0"
                        />
                        <span className="text-orange-600 font-semibold max-w-[150px] truncate shrink-0">
                          {activeDoc.title || "Untitled"}
                        </span>
                      </>
                    )}
                  </div>
                )}
            </div>
          </div>

          {/* Spacer */}
          <div
            style={{
              height: "var(--tabs-h, 110px)",
            }}
            className="shrink-0 w-full"
          />

          {/* Main Views */}
          <div className="flex-1 overflow-visible px-6 md:px-10 pb-6 scrollbar-hide">

            {isLocked ? (
              <div className="h-full flex flex-col items-center justify-center animate-[fadeIn_0.3s_ease-out]">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <Lock
                    size={24}
                    className="text-gray-400"
                  />
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">
                  Workspace Locked
                </h2>
                <p className="text-[13px] text-gray-500 mb-6 max-w-xs text-center leading-relaxed">
                  This workspace is protected.
                </p>
                <button
                  onClick={() =>
                    system.setLockModal({
                      type: "unlock",
                      id: activeWorkspace.id,
                    })
                  }
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
                      <p className="text-sm font-medium tracking-widest uppercase">
                        Initialize a node to begin
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
            )}
          </div>
        </main>
      </div>

      {/* Global Search is kept outside so it can still be accessed if needed, or hidden via its own logic */}
      <GlobalSearch system={system} />
    </div>
  );
}