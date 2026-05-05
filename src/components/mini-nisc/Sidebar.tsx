"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  Search, FolderOpen, Trash2, FileText, FileCode, FileJson, 
  File, ChevronRight, ChevronDown, Edit3, FolderPlus, FilePlus,
  Briefcase, X, Command, CheckSquare, Menu, Lock, Unlock
} from 'lucide-react';
import { Folder, Document } from './types';
import { useTheme } from "@/components/ThemeProvider"; // 🔥 Added Theme Provider

const getFileIcon = (type?: string) => {
  switch (type) {
    case "py": return <FileCode size={14} className="text-blue-500" />;
    case "js": return <FileCode size={14} className="text-yellow-500" />;
    case "java": return <FileCode size={14} className="text-red-500" />;
    case "json": return <FileJson size={14} className="text-orange-500" />;
    case "txt": return <FileText size={14} className="text-gray-400" />;
    default: return <File size={14} className="text-gray-400" />;
  }
};

export default function Sidebar({ system }: any) {
  const { 
    folders, documents, activeFolderId, setActiveFolderId, search, setSearch, 
    globalSearchResults, activeDocId, setActiveDocId, 
    createFolder, createDocument, deleteFolder, deleteDocument, 
    setActiveTag, updateDocumentTitle, updateFolderName,
    setOpenTabs, expandedFolders, setExpandedFolders, toggleFolder,
    selectedItems, toggleSelection, handleDrop,
    workspaces, activeWorkspaceId, setActiveWorkspaceId, createWorkspace, deleteWorkspace, renameWorkspace,
    isSidebarOpen, setIsSidebarOpen, lockModal, setLockModal
  } = system;

  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: "folder" | "file", id: string } | null>(null);
  
  const [creating, setCreating] = useState<{ type: "folder" | "file", parentId: string | null } | null>(null);
  const [createValue, setCreateValue] = useState("");

  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [workspaceNameInput, setWorkspaceNameInput] = useState("");
  const [pinInput, setPinInput] = useState("");

  const [touchStart, setTouchStart] = useState(0);

  const isSearching = search.trim().length > 0;
  const docsToShow = isSearching ? globalSearchResults : [];

  const activeWorkspace = workspaces?.find((w: any) => w.id === activeWorkspaceId);
  const isLocked = activeWorkspace?.isLocked || false;

  // ==========================================
  // 🔥 FOLDER PATH & MAP
  // ==========================================
  const folderMap = useMemo(() => {
    const map: Record<string, Folder> = {};
    folders.forEach((f: Folder) => { map[f.id] = f; });
    return map;
  }, [folders]);

  const getFolderPath = (folderId?: string | null): { id: string; name: string }[] => {
    if (!folderId) return [];
    const path: { id: string; name: string }[] = [];
    let current: Folder | undefined = folderMap[folderId];
    while (current) {
      path.unshift({ id: current.id, name: current.name });
      if (current.parentId && !folderMap[current.parentId]) break; 
      current = current.parentId ? folderMap[current.parentId] : undefined;
    }
    return path;
  };

  const breadcrumbPath = getFolderPath(activeFolderId);

  // ==========================================
  // 🔥 EVENTS & GESTURES
  // ==========================================
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 50) setIsSidebarOpen(false);
  };

  useEffect(() => {
    let startX = 0;
    const onTouchStartGlobal = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onTouchEndGlobal = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      if (startX < 30 && endX - startX > 60) setIsSidebarOpen(true); 
    };
    window.addEventListener("touchstart", onTouchStartGlobal);
    window.addEventListener("touchend", onTouchEndGlobal);
    return () => {
      window.removeEventListener("touchstart", onTouchStartGlobal);
      window.removeEventListener("touchend", onTouchEndGlobal);
    };
  }, [setIsSidebarOpen]);

  useEffect(() => {
    const closeOverlay = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.context-menu-container')) setContextMenu(null);
      if (!(e.target as Element).closest('.workspace-dropdown-container')) {
        setShowWorkspaceDropdown(false);
        setCreatingWorkspace(false);
      }
    };
    window.addEventListener("click", closeOverlay);
    return () => window.removeEventListener("click", closeOverlay);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "F2" && activeDocId) {
        const doc = documents.find((d: Document) => d.id === activeDocId);
        if (doc) { setRenamingId(activeDocId); setRenameValue(doc.title); }
      }
      if (e.key === "Delete" && activeDocId) deleteDocument(activeDocId);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDocId, documents, deleteDocument]);

  const handleRenameSubmit = (id: string, type: 'folder' | 'doc') => {
    if (renameValue.trim()) {
      type === 'folder' ? updateFolderName(id, renameValue) : updateDocumentTitle(id, renameValue);
    }
    setRenamingId(null);
  };

  const handlePinSubmit = async () => {
    if (!pinInput.trim()) return;
    
    if (lockModal.type === 'set') {
      await system.setWorkspaceLock(lockModal.id, pinInput);
      setLockModal(null);
    } else if (lockModal.type === 'unlock') {
      const success = await system.unlockWorkspace(lockModal.id, pinInput);
      if (!success) alert("Incorrect PIN");
      else setLockModal(null);
    } else if (lockModal.type === 'remove') {
      const success = await system.unlockWorkspace(lockModal.id, pinInput);
      if (!success) alert("Incorrect PIN");
      else {
        await system.removeWorkspaceLock(lockModal.id);
        setLockModal(null);
      }
    }
    setPinInput("");
  };

  const highlightMatch = (text: string) => {
    if (!isSearching) return text;
    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return parts.map((p, i) =>
      p.toLowerCase() === search.toLowerCase() ? (
        <span key={i} className={`rounded px-0.5 ${isDarkMode ? "bg-yellow-900/50 text-yellow-400" : "bg-yellow-200 text-black"}`}>
          {p}
        </span>
      ) : p
    );
  };

  const { roots } = useMemo(() => {
    const rootMap: Record<string, any> = {};
    const rootsArray: any[] = [];
    folders.forEach((f: Folder) => { rootMap[f.id] = { ...f, children: [], docs: [] }; });
    folders.forEach((f: Folder) => {
      if (f.parentId && rootMap[f.parentId]) rootMap[f.parentId].children.push(rootMap[f.id]); 
      else rootsArray.push(rootMap[f.id]); 
    });
    documents.forEach((doc: Document) => {
      if (!doc.deletedAt && doc.folderId && rootMap[doc.folderId]) rootMap[doc.folderId].docs.push(doc); 
    });
    return { roots: rootsArray };
  }, [folders, documents]);

  const renderInlineInput = (parentId: string | null, depthIndent: number = 0) => {
    if (creating?.parentId !== parentId) return null;
    return (
      <div style={{ paddingLeft: depthIndent }} className="flex items-center gap-2 pr-3 py-2.5 mx-2 animate-[fadeIn_0.15s_ease-out]">
        {creating.type === "folder" ? <FolderOpen size={14} className={isDarkMode ? "text-gray-500" : "text-gray-400"}/> : <File size={14} className={isDarkMode ? "text-gray-500" : "text-gray-400"}/>}
        <input
          autoFocus value={createValue} onChange={(e) => setCreateValue(e.target.value)} placeholder={`New ${creating.type}`}
          className={`flex-1 border rounded px-2 py-1.5 text-[13px] outline-none shadow-sm ${
            isDarkMode ? "bg-[#111111] border-blue-500 text-white placeholder-gray-600" : "bg-white border-blue-500 text-black placeholder-gray-400"
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (!createValue.trim()) return; 
              if (creating.type === "folder") createFolder(parentId, createValue.trim());
              else createDocument(parentId, "txt", createValue.trim());
              setCreating(null); setCreateValue("");
            }
            if (e.key === "Escape") { setCreating(null); setCreateValue(""); }
          }}
          onBlur={() => setTimeout(() => { setCreating(null); setCreateValue(""); }, 100)}
        />
      </div>
    );
  };

  const renderTree = (nodeFolders: any[], depth = 0) => {
    const indent = Math.min(depth * 14, 36); 
    return nodeFolders.map(folder => {
      const isActiveFolder = activeFolderId === folder.id && !isSearching;
      const isExpanded = expandedFolders[folder.id];
      const isSelected = selectedItems?.has(folder.id);
      
      return (
        <div key={folder.id} className="flex flex-col relative">
          {depth > 0 && <div className={`absolute top-0 bottom-0 w-px pointer-events-none ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`} style={{ left: indent - 6 }}/>}
          <div
            draggable
            onDragStart={(e) => { e.dataTransfer.setData("application/folder", folder.id); document.body.style.opacity = "0.8"; }}
            onDragEnd={() => { document.body.style.opacity = "1"; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const droppedFileId = e.dataTransfer.getData("application/file");
              const droppedFolderId = e.dataTransfer.getData("application/folder");
              if (droppedFileId) handleDrop(droppedFileId, folder.id, 'file');
              if (droppedFolderId) handleDrop(droppedFolderId, folder.id, 'folder');
            }}
            onClick={(e) => { 
              const isArrowClick = (e.target as HTMLElement).closest(".folder-arrow");
              if (isArrowClick) { toggleFolder(folder.id); return; }
              if (e.metaKey || e.ctrlKey) toggleSelection(folder.id, true);
              else { setActiveFolderId(folder.id); setActiveTag(null); if (window.innerWidth < 1024) setIsSidebarOpen(false); }
            }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, type: "folder", id: folder.id }); }}
            style={{ paddingLeft: indent }}
            className={`group flex items-center gap-2 pr-3 py-2.5 mx-2 rounded-md cursor-pointer transition-all duration-150 ease-out border-l-2 active:scale-[0.99] ${
              isActiveFolder || isSelected 
                ? (isDarkMode ? 'bg-blue-900/20 border-blue-500 text-blue-400' : 'bg-blue-50/80 border-blue-500 text-blue-700 shadow-[inset_1px_0_0_0_rgba(59,130,246,0.1)]') 
                : (isDarkMode ? 'border-transparent hover:bg-[#1a1a1a] text-gray-400 hover:text-gray-200' : 'border-transparent hover:bg-gray-100/80 text-gray-700 hover:text-gray-900')
            }`}
          >
            <span className={`folder-arrow shrink-0 transition-transform duration-200 p-0.5 rounded ${
              isDarkMode ? "text-gray-500 hover:bg-gray-800" : "text-gray-400 hover:bg-gray-200"
            }`}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <FolderOpen size={15} className={isActiveFolder ? (isDarkMode ? "text-blue-400" : "text-blue-600") : (isDarkMode ? "text-gray-500" : "text-gray-400")} />
            
            {renamingId === folder.id ? (
              <input
                autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRenameSubmit(folder.id, 'folder')} onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(folder.id, 'folder')}
                className={`flex-1 border rounded px-1.5 py-0.5 outline-none text-[13px] ${
                  isDarkMode ? "bg-[#111111] border-blue-500 text-white" : "bg-white border-blue-500 text-black"
                }`} 
                onClick={(e) => e.stopPropagation()}
              />
            ) : <span className={`truncate flex-1 text-[13px] select-none ${isActiveFolder ? 'font-semibold' : 'font-medium'}`}>{folder.name}</span>}
            
            {/* Folder Hover Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedFolders((p: any) => ({ ...p, [folder.id]: true })); setCreating({ type: "file", parentId: folder.id }); }}
                className={`p-1 rounded transition-colors ${isDarkMode ? "text-gray-400 hover:bg-blue-900/30 hover:text-blue-400" : "text-gray-500 hover:bg-blue-100 hover:text-blue-700"}`}
                title="New File"
              >
                <FilePlus size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedFolders((p: any) => ({ ...p, [folder.id]: true })); setCreating({ type: "folder", parentId: folder.id }); }}
                className={`p-1 rounded transition-colors ${isDarkMode ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200" : "text-gray-500 hover:bg-gray-200 hover:text-gray-900"}`}
                title="New Subfolder"
              >
                <FolderPlus size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setRenamingId(folder.id); setRenameValue(folder.name); }}
                className={`p-1 rounded transition-colors ${isDarkMode ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200" : "text-gray-500 hover:bg-gray-200 hover:text-gray-900"}`}
                title="Rename"
              >
                <Edit3 size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                className={`p-1 rounded transition-colors ${isDarkMode ? "text-red-500 hover:bg-red-950/50 hover:text-red-400" : "text-red-500 hover:bg-red-100 hover:text-red-700"}`}
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          <div className={`transition-all duration-200 ease-out overflow-hidden ${isExpanded ? 'max-h-auto opacity-100 mt-[1px]' : 'max-h-0 opacity-0'}`}>
            <div className="flex flex-col gap-[1px]">
              {renderInlineInput(folder.id, indent + 14)}
              {folder.docs.map((doc: Document) => (
                <div
                  key={doc.id} draggable
                  onDragStart={(e) => { e.dataTransfer.setData("application/file", doc.id); document.body.style.opacity = "0.8"; }}
                  onDragEnd={() => { document.body.style.opacity = "1"; }}
                  onClick={(e) => { 
                    if (e.metaKey || e.ctrlKey) toggleSelection(doc.id, true);
                    else { setActiveDocId(doc.id); setOpenTabs((p: any) => p.includes(doc.id) ? p : [...p, doc.id]); if (window.innerWidth < 1024) setIsSidebarOpen(false); }
                  }}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, type: "file", id: doc.id }); }}
                  style={{ paddingLeft: indent + 18 }}
                  className={`group flex items-center gap-2 pr-3 py-2.5 mx-2 rounded-md cursor-pointer transition-all duration-150 ease-out border-l-2 active:scale-[0.99] ${
                    activeDocId === doc.id || selectedItems?.has(doc.id) 
                      ? (isDarkMode ? "bg-blue-900/20 border-blue-500 text-blue-400 font-medium" : "bg-blue-50 border-blue-400 text-blue-700 font-medium") 
                      : (isDarkMode ? "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a]" : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/60")
                  }`}
                >
                  {getFileIcon(doc.type)}
                  
                  {renamingId === doc.id ? (
                    <input
                      autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRenameSubmit(doc.id, 'doc')} onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(doc.id, 'doc')}
                      className={`flex-1 border rounded px-1.5 py-0.5 outline-none text-[12.5px] ${
                        isDarkMode ? "bg-[#111111] border-blue-500 text-white" : "bg-white border-blue-500 text-black"
                      }`} onClick={(e) => e.stopPropagation()}
                    />
                  ) : <span className={`truncate flex-1 text-[12.5px] select-none ${activeDocId === doc.id ? (isDarkMode ? 'font-medium text-blue-400' : 'font-medium text-blue-700') : 'font-normal'}`}>{doc.title}</span>}

                  {/* File Hover Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setRenamingId(doc.id); setRenameValue(doc.title); }} 
                      className={`p-1 rounded transition-colors ${isDarkMode ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200" : "text-gray-500 hover:bg-blue-100 hover:text-blue-700"}`}
                      title="Rename File"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }} 
                      className={`p-1 rounded transition-colors ${isDarkMode ? "text-red-500 hover:bg-red-950/50 hover:text-red-400" : "text-red-500 hover:bg-red-100 hover:text-red-700"}`}
                      title="Delete File"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {renderTree(folder.children, depth + 1)}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <>
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed top-3 left-3 pt-[env(safe-area-inset-top)] z-[45] lg:hidden border shadow-sm p-2 rounded-md active:scale-95 transition-transform ${
            isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
          }`}
        >
          <Menu size={20} className={isDarkMode ? "text-gray-300" : "text-gray-700"} />
        </button>
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-250" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div 
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
        className={`fixed lg:static z-50 top-[56px] md:top-[64px] h-[calc(100vh-56px)] md:h-[calc(100vh-64px)] w-[300px] border-r transition-transform duration-250 ease-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } shadow-2xl lg:shadow-none flex flex-col select-none pt-[env(safe-area-inset-top)] ${
          isDarkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-white border-gray-200"
        }`}
      >
        
        <div className={`lg:hidden flex items-center justify-between px-4 py-2 h-[56px] min-h-[56px] border-b ${
          isDarkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-white border-gray-200"
        }`}>
          <span className={`font-semibold text-sm ${isDarkMode ? "text-white" : "text-gray-800"}`}>Files</span>
          <button onClick={() => setIsSidebarOpen(false)} className={`p-2 rounded-full active:scale-95 transition-all ${
            isDarkMode ? "bg-gray-900 hover:bg-gray-800" : "bg-gray-100 hover:bg-gray-200"
          }`}>
            <X size={18} className={isDarkMode ? "text-gray-400" : "text-gray-700"} />
          </button>
        </div>

        <div className="px-3 pt-4 pb-2 relative workspace-dropdown-container z-20">
          <div className={`flex items-center justify-between border shadow-sm px-3 py-3 rounded-lg ${
            isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
          }`}>
            <div onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)} className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
              <div className={`w-7 h-7 ${activeWorkspace?.color || (isDarkMode ? 'bg-gray-700' : 'bg-gray-800')} rounded-md flex items-center justify-center shadow-sm`}>
                <span className="text-white text-[13px] font-bold">{activeWorkspace?.name.charAt(0).toUpperCase() || 'W'}</span>
              </div>
              <div className="flex flex-1 items-center gap-2 min-w-0">
                <span className={`text-sm font-semibold truncate tracking-tight ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>{activeWorkspace?.name || "Loading..."}</span>
                {activeWorkspace?.lockHash && <Lock size={14} className="text-gray-400 shrink-0" />}
              </div>
              <ChevronDown size={16} className="text-gray-400 shrink-0" />
            </div>
          </div>

          {showWorkspaceDropdown && (
            <div className={`absolute top-[68px] left-3 right-3 border rounded-lg shadow-xl py-1.5 animate-[fadeIn_0.1s_ease-out] ${
              isDarkMode ? "bg-[#1a1a1a] border-gray-800" : "bg-white border-gray-200"
            }`}>
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Workspaces</div>
              
              <div className="max-h-48 overflow-y-auto scrollbar-hide">
                {workspaces?.map((ws: any) => (
                  <div key={ws.id} className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer text-[13px] font-medium ${
                    isDarkMode ? "hover:bg-[#222222] text-gray-300" : "hover:bg-gray-50 text-gray-700"
                  }`}>
                    <div
                      onClick={() => {
                        if (renamingId === ws.id) return; 
                        setActiveWorkspaceId(ws.id); 
                        setShowWorkspaceDropdown(false); 
                        if (window.innerWidth < 1024) setIsSidebarOpen(false); 
                      }}
                      className="flex items-center gap-2.5 flex-1 min-w-0"
                    >
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${ws.color} shrink-0`}>
                        <span className="text-white text-[11px] font-bold">{ws.name.charAt(0).toUpperCase()}</span>
                      </div>
                      
                      {renamingId === ws.id ? (
                        <input
                          autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => { renameWorkspace(ws.id, renameValue); setRenamingId(null); }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { renameWorkspace(ws.id, renameValue); setRenamingId(null); }
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-[13px] border rounded px-1.5 py-0.5 outline-none w-full ${
                            isDarkMode ? "bg-[#111111] border-blue-500 text-white" : "bg-white border-blue-400 text-black"
                          }`}
                        />
                      ) : (
                        <div className="flex items-center justify-between flex-1 min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="truncate">{ws.name}</span>
                            {ws.lockHash && (
                              <Lock size={12} className="text-gray-400 shrink-0" />
                            )}
                          </div>
                          
                          {/* Workspace Edit/Delete Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setRenamingId(ws.id); setRenameValue(ws.name); }}
                              className={`p-1 rounded transition-colors ${isDarkMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-200"}`}
                              title="Rename Workspace"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Are you sure you want to delete this workspace and all its contents?")) {
                                  deleteWorkspace(ws.id);
                                }
                              }}
                              className={`p-1 rounded transition-colors ${isDarkMode ? "text-red-500 hover:bg-red-950/30" : "text-red-600 hover:bg-red-100"}`}
                              title="Delete Workspace"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className={`border-t my-1 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`} />

              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Current Workspace Options</div>
              
              {activeWorkspace?.lockHash ? (
                <>
                  <div 
                    onClick={(e) => { e.stopPropagation(); setLockModal({ type: 'remove', id: activeWorkspaceId }); setShowWorkspaceDropdown(false); }}
                    className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-[13px] font-medium transition-colors ${
                      isDarkMode ? "text-gray-300 hover:bg-[#222222]" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Unlock size={14} className="text-gray-500" /><span>Remove PIN Lock</span>
                  </div>
                  <div 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const confirmDelete = confirm("Forgot PIN? This will permanently delete the entire workspace and all its contents.");
                      if (confirmDelete) { deleteWorkspace(activeWorkspaceId); setShowWorkspaceDropdown(false); }
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-[13px] font-medium transition-colors ${
                      isDarkMode ? "text-red-400 hover:bg-red-950/30" : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <Trash2 size={14} /><span>Forgot PIN? (Delete Workspace)</span>
                  </div>
                </>
              ) : (
                <div 
                  onClick={(e) => { e.stopPropagation(); setLockModal({ type: 'set', id: activeWorkspaceId }); setShowWorkspaceDropdown(false); }}
                  className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-[13px] font-medium transition-colors ${
                    isDarkMode ? "text-gray-300 hover:bg-[#222222]" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Lock size={14} className="text-gray-500" /><span>Set PIN Lock</span>
                </div>
              )}

              <div className={`border-t my-1 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`} />

              {creatingWorkspace ? (
                <div className="px-3 py-2">
                  <input
                    autoFocus placeholder="Workspace Name..." value={workspaceNameInput} onChange={e => setWorkspaceNameInput(e.target.value)}
                    className={`w-full px-2.5 py-2 border rounded-md text-[13px] outline-none shadow-sm ${
                      isDarkMode ? "bg-[#111111] border-blue-500 text-white placeholder-gray-600" : "bg-white border-blue-400 text-black placeholder-gray-400"
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && workspaceNameInput.trim()) { createWorkspace(workspaceNameInput.trim()); setCreatingWorkspace(false); setWorkspaceNameInput(""); setShowWorkspaceDropdown(false); }
                      if (e.key === 'Escape') setCreatingWorkspace(false);
                    }}
                  />
                </div>
              ) : (
                <div onClick={(e) => { e.stopPropagation(); setCreatingWorkspace(true); }} className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-[13px] font-medium transition-colors ${
                  isDarkMode ? "text-blue-400 hover:bg-blue-900/20" : "text-blue-600 hover:bg-blue-50"
                }`}>
                  <Briefcase size={14} /><span>Create Workspace</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-3 py-1.5 flex gap-1.5 relative z-10">
          <button disabled={isLocked} onClick={() => setCreating({ type: "file", parentId: null })} className={`flex-1 flex items-center justify-center gap-1.5 border text-[12.5px] font-medium py-2.5 rounded-md transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
            isDarkMode ? "bg-[#111111] border-gray-800 hover:bg-[#1a1a1a] text-gray-300" : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
          }`}>
            <FilePlus size={14} className={isLocked ? (isDarkMode ? "text-gray-700" : "text-gray-300") : "text-gray-500"} /> New File
          </button>
          <button disabled={isLocked} onClick={() => setCreating({ type: "folder", parentId: null })} className={`flex-1 flex items-center justify-center gap-1.5 border text-[12.5px] font-medium py-2.5 rounded-md transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
            isDarkMode ? "bg-[#111111] border-gray-800 hover:bg-[#1a1a1a] text-gray-300" : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
          }`}>
            <FolderPlus size={14} className={isLocked ? (isDarkMode ? "text-gray-700" : "text-gray-300") : "text-gray-500"} /> New Folder
          </button>
        </div>

        <div className="px-3 py-2 relative z-10">
          <div className={`relative group flex items-center border rounded-md transition-all duration-200 ${
            isSearching ? (isDarkMode ? 'border-blue-500 ring-2 ring-blue-900/30' : 'border-blue-400 ring-2 ring-blue-50') : (isDarkMode ? 'border-gray-800 bg-[#111111]' : 'border-gray-200 bg-white')
          } ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
            <Search size={14} className={`absolute left-2.5 ${isSearching ? 'text-blue-500' : 'text-gray-400'}`} />
            <input 
              ref={searchInputRef} type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} disabled={isLocked}
              className={`w-full pl-8 pr-8 py-2.5 bg-transparent text-[13px] outline-none ${
                isDarkMode ? "text-white placeholder-gray-600" : "text-black placeholder-gray-400"
              }`} 
            />
            <div className="absolute right-2 flex items-center gap-0.5 text-gray-400 pointer-events-none">
              <Command size={12} /><span className="text-[10px] font-semibold">K</span>
            </div>
          </div>
        </div>

        {breadcrumbPath.length > 0 && !isSearching && !isLocked && (
          <div className={`px-4 py-2 flex items-center gap-1 text-[11px] overflow-x-auto whitespace-nowrap scrollbar-hide border-y ${
            isDarkMode ? "bg-[#0a0a0a]/50 text-gray-400 border-gray-800" : "bg-white/50 text-gray-500 border-gray-100"
          }`}>
            <span onClick={() => setActiveFolderId(null)} className="hover:text-blue-500 cursor-pointer font-medium truncate max-w-[80px]">{activeWorkspace?.name || 'Workspace'}</span>
            <ChevronRight size={10} className={isDarkMode ? "text-gray-600 shrink-0" : "text-gray-300 shrink-0"} />
            {breadcrumbPath.map((p, i) => (
              <div key={p.id} className="flex items-center gap-1 shrink-0">
                <span className={`cursor-pointer truncate max-w-[80px] ${i === breadcrumbPath.length - 1 ? (isDarkMode ? 'text-gray-200 font-semibold' : 'text-gray-800 font-semibold') : 'hover:text-blue-500'}`} onClick={() => setActiveFolderId(p.id)}>{p.name}</span>
                {i < breadcrumbPath.length - 1 && <ChevronRight size={10} className={isDarkMode ? "text-gray-600" : "text-gray-300"} />}
              </div>
            ))}
          </div>
        )}

        <div 
          className={`flex-1 overflow-y-auto touch-pan-y pb-20 scrollbar-hide relative z-0 ${isSearching ? (isDarkMode ? 'bg-[#0a0a0a]/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md') : ''}`}
          style={{ WebkitOverflowScrolling: 'touch' }}
          onDragOver={(e) => { if(!isLocked) e.preventDefault(); }} 
          onDrop={(e) => { 
            if(isLocked) return;
            e.preventDefault(); 
            const droppedFileId = e.dataTransfer.getData("application/file");
            const droppedFolderId = e.dataTransfer.getData("application/folder");
            if (droppedFileId) handleDrop(droppedFileId, null, 'file');
            if (droppedFolderId) handleDrop(droppedFolderId, null, 'folder');
          }}
        >
          {isLocked ? (
            <div className="flex flex-col items-center justify-center pt-12 px-6 text-center animate-[fadeIn_0.3s_ease-out]">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 shadow-inner ${isDarkMode ? "bg-[#111111]" : "bg-gray-50"}`}>
                 <Lock size={16} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
               </div>
               <p className={`text-[13px] font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Workspace Locked</p>
               <p className={`text-[11px] mt-1 mb-5 leading-relaxed ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Unlock to view folders and files.</p>
               <button
                 onClick={() => setLockModal({ type: 'unlock', id: activeWorkspaceId })}
                 className={`w-full py-2 rounded-md text-[12px] font-medium transition-colors shadow-sm active:scale-[0.98] ${
                   isDarkMode ? "bg-white text-black hover:bg-gray-200" : "bg-gray-900 text-white hover:bg-gray-800"
                 }`}
               >
                 Unlock
               </button>
            </div>
          ) : (
            <>
              {isSearching && <div className={`absolute inset-0 z-[-1] backdrop-blur-md ${isDarkMode ? "bg-[#0a0a0a]/95" : "bg-white/95"}`} />}

              <div className={`transition-transform duration-300 ease-out origin-top pt-2 ${isSearching ? 'scale-[0.98] opacity-90' : 'scale-100'}`}>
                {!isSearching && (
                  <div className="space-y-[1px]">
                    {renderInlineInput(null, 0)}

                    {documents.length === 0 && folders.length === 0 && !creating && (
                      <div className="flex flex-col items-center justify-center pt-10 px-6 text-center animate-[fadeIn_0.3s_ease-out]">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-inner ${isDarkMode ? "bg-[#111111]" : "bg-gray-50"}`}>
                          <FolderOpen size={20} className={`animate-bounce ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                        </div>
                        <p className={`text-[14px] font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>No files yet</p>
                        <p className={`text-[12px] mt-1 mb-5 leading-relaxed ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>Start by creating your first file or folder.</p>
                        <div className="flex flex-col gap-2.5 w-full">
                          <button onClick={() => setCreating({type: 'file', parentId: null})} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[13px] font-semibold transition-colors shadow-sm active:scale-[0.98]">
                            + Create your first file
                          </button>
                          <button onClick={() => setCreating({type: 'folder', parentId: null})} className={`w-full py-2.5 border rounded-md text-[13px] font-medium transition-colors shadow-sm active:scale-[0.98] ${
                            isDarkMode ? "bg-transparent border-gray-800 hover:bg-[#111111] text-gray-300" : "bg-transparent border-gray-200 hover:bg-gray-50 text-gray-700"
                          }`}>
                            + Create a folder
                          </button>
                        </div>
                      </div>
                    )}

                    {documents.filter((doc: Document) => !doc.folderId && !doc.deletedAt).map((doc: Document) => (
                        <div
                          key={doc.id} draggable
                          onDragStart={(e) => { e.dataTransfer.setData("application/file", doc.id); document.body.style.opacity = "0.8"; }}
                          onDragEnd={() => { document.body.style.opacity = "1"; }}
                          onClick={(e) => { 
                            if (e.metaKey || e.ctrlKey) toggleSelection(doc.id, true);
                            else { setActiveDocId(doc.id); setOpenTabs((p: any) => p.includes(doc.id) ? p : [...p, doc.id]); if (window.innerWidth < 1024) setIsSidebarOpen(false); }
                          }}
                          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, type: "file", id: doc.id }); }}
                          className={`group flex items-center gap-2 px-3 py-2.5 mx-2 rounded-md cursor-pointer transition-all duration-150 ease-out border-l-2 active:scale-[0.99] ${
                            activeDocId === doc.id || selectedItems?.has(doc.id) 
                              ? (isDarkMode ? "bg-blue-900/20 border-blue-500 text-blue-400 font-medium" : "bg-blue-50 border-blue-500 text-blue-700 font-medium shadow-[inset_1px_0_0_0_rgba(59,130,246,0.1)]") 
                              : (isDarkMode ? "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a]" : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/80")
                          }`}
                        >
                          {getFileIcon(doc.type)}
                          
                          {renamingId === doc.id ? (
                            <input
                              autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => handleRenameSubmit(doc.id, 'doc')} onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(doc.id, 'doc')}
                              className={`flex-1 border rounded px-1.5 py-0.5 outline-none text-[12.5px] ${
                                isDarkMode ? "bg-[#111111] border-blue-500 text-white" : "bg-white border-blue-500 text-black"
                              }`} onClick={(e) => e.stopPropagation()}
                            />
                          ) : <span className={`truncate flex-1 text-[12.5px] select-none ${activeDocId === doc.id ? (isDarkMode ? 'text-blue-400 font-medium' : 'text-blue-700 font-medium') : 'font-normal'}`}>{doc.title}</span>}

                          {/* File Hover Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setRenamingId(doc.id); setRenameValue(doc.title); }} 
                              className={`p-1 rounded transition-colors ${isDarkMode ? "text-gray-400 hover:bg-blue-900/30 hover:text-blue-400" : "text-gray-500 hover:bg-blue-100 hover:text-blue-700"}`}
                              title="Rename File"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }} 
                              className={`p-1 rounded transition-colors ${isDarkMode ? "text-red-500 hover:bg-red-950/50 hover:text-red-400" : "text-red-500 hover:bg-red-100 hover:text-red-700"}`}
                              title="Delete File"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                    ))}
                    {renderTree(roots, 0)}
                  </div>
                )}

                {isSearching && (
                  <div className="px-2 z-10 relative">
                    <span className={`px-3 text-[10px] font-bold tracking-widest uppercase block mb-2 mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Search Results</span>
                    {docsToShow.length === 0 && (
                      <div className={`text-[13px] px-3 py-4 text-center border border-dashed rounded-lg mx-2 mt-2 ${
                        isDarkMode ? "bg-[#111111]/80 border-gray-800 text-gray-500" : "bg-gray-50/80 border-gray-200 text-gray-500"
                      }`}>
                        No results found for "<span className={`font-medium ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>{search}</span>"
                      </div>
                    )}
                    {docsToShow.map((doc: Document) => {
                      const path = getFolderPath(doc.folderId).map(f => f.name).join(" / ");
                      return (
                        <div 
                          key={doc.id} onClick={() => { setActiveDocId(doc.id); setSearch(""); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
                          className={`flex flex-col gap-0.5 px-3 py-2.5 mx-2 border rounded-lg cursor-pointer transition-all duration-150 active:scale-[0.99] ${
                            isDarkMode 
                              ? "bg-transparent border-transparent hover:border-gray-800 hover:bg-[#111111]" 
                              : "bg-transparent border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {getFileIcon(doc.type)}<span className={`text-[13px] truncate font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{highlightMatch(doc.title)}</span>
                          </div>
                          {path && <div className="pl-6 text-[10px] text-gray-500 truncate">{path}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {selectedItems && selectedItems.size > 0 && (
          <div className={`absolute bottom-4 left-4 right-4 backdrop-blur-md rounded-lg shadow-2xl px-4 py-3 flex items-center justify-between animate-[slideUp_0.2s_ease-out] z-50 ${
            isDarkMode ? "bg-[#1a1a1a]/90 text-white border border-gray-800" : "bg-gray-900/90 text-white border border-gray-800"
          }`}>
            <div className="flex items-center gap-2"><CheckSquare size={16} className="text-blue-400" /><span className="text-[13px] font-medium">{selectedItems.size} selected</span></div>
            <div className="flex items-center gap-3"><button onClick={() => toggleSelection(null, false)} className="text-[12px] text-gray-300 hover:text-white font-medium active:scale-95 transition-transform">Clear</button></div>
          </div>
        )}
      </div>

      {contextMenu && (
        <div style={{ top: contextMenu.y, left: contextMenu.x }} className={`fixed backdrop-blur-md border shadow-2xl rounded-lg z-[999] w-48 py-1.5 px-1.5 animate-[fadeIn_0.1s_ease-out] context-menu-container flex flex-col gap-0.5 ${
          isDarkMode ? "bg-[#1a1a1a]/95 border-gray-800" : "bg-white/95 border-gray-200"
        }`}>
          <button onClick={(e) => { e.stopPropagation(); const id = contextMenu.id; const item = contextMenu.type === 'folder' ? folders.find((f: any) => f.id === id) : documents.find((d: any) => d.id === id); setRenamingId(id); setRenameValue(item?.name || item?.title || ""); setContextMenu(null); }} className={`w-full text-left px-2.5 py-2.5 rounded-md text-[13px] flex items-center gap-2.5 font-medium active:scale-[0.98] transition-colors ${
            isDarkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
          }`}>
            <Edit3 size={14} className={isDarkMode ? "text-gray-500" : "text-gray-500"} /> Rename
          </button>
          
          {contextMenu.type === 'folder' && (
            <button onClick={(e) => { e.stopPropagation(); setExpandedFolders((p: any) => ({...p, [contextMenu.id]: true})); setCreating({ type: "folder", parentId: contextMenu.id }); setContextMenu(null); }} className={`w-full text-left px-2.5 py-2.5 rounded-md text-[13px] flex items-center gap-2.5 font-medium active:scale-[0.98] transition-colors ${
              isDarkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
            }`}>
              <FolderPlus size={14} className={isDarkMode ? "text-gray-500" : "text-gray-500"} /> New Subfolder
            </button>
          )}
          
          <div className={`h-[1px] my-0.5 w-full ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`} />
          
          {contextMenu.type === 'folder' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteFolder(contextMenu.id);
                setContextMenu(null);
              }}
              className={`w-full text-left px-2.5 py-2.5 rounded-md text-[13px] flex items-center gap-2.5 group active:scale-[0.98] transition-colors ${
                isDarkMode ? "text-red-400 hover:bg-red-950/30" : "text-red-600 hover:bg-red-50"
              }`}
            >
              <Trash2 size={14} className={`transition-colors ${isDarkMode ? "text-red-500 group-hover:text-red-400" : "text-red-400 group-hover:text-red-600"}`} /> Delete Folder
            </button>
          )}

          {contextMenu.type === 'file' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteDocument(contextMenu.id);
                setContextMenu(null);
              }}
              className={`w-full text-left px-2.5 py-2.5 rounded-md text-[13px] flex items-center gap-2.5 group active:scale-[0.98] transition-colors ${
                isDarkMode ? "text-red-400 hover:bg-red-950/30" : "text-red-600 hover:bg-red-50"
              }`}
            >
              <Trash2 size={14} className={`transition-colors ${isDarkMode ? "text-red-500 group-hover:text-red-400" : "text-red-400 group-hover:text-red-600"}`} /> Delete File
            </button>
          )}
        </div>
      )}

      {/* Lock Modals */}
      {lockModal && (
        <div className={`fixed inset-0 backdrop-blur-sm z-[100] flex items-center justify-center animate-[fadeIn_0.2s_ease-out] ${
          isDarkMode ? "bg-black/60" : "bg-black/40"
        }`}>
          <div className={`p-6 rounded-xl shadow-xl w-[90%] max-w-sm animate-[slideUp_0.2s_ease-out] border ${
            isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-transparent"
          }`}>
            <h2 className={`font-bold text-lg mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {lockModal.type === 'set' ? 'Set Workspace Lock' : lockModal.type === 'unlock' ? 'Unlock Workspace' : 'Remove Lock'}
            </h2>
            <p className={`text-sm mb-6 leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {lockModal.type === 'set' ? 'Enter a PIN to secure this workspace.' : 'Enter your PIN to continue.'}
            </p>

            <input
              type="password" placeholder="••••" autoFocus value={pinInput} onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              className={`w-full px-3 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-6 text-center text-2xl tracking-[0.5em] font-mono ${
                isDarkMode ? "bg-[#0a0a0a] border-gray-700 text-white placeholder-gray-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-300"
              }`}
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => { setLockModal(null); setPinInput(""); }} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors active:scale-95 ${
                isDarkMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"
              }`}>Cancel</button>
              <button onClick={handlePinSubmit} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm active:scale-95 ${
                isDarkMode ? "bg-white text-black hover:bg-gray-200" : "bg-gray-900 text-white hover:bg-gray-800"
              }`}>
                {lockModal.type === 'set' ? 'Lock Workspace' : lockModal.type === 'unlock' ? 'Unlock' : 'Remove Lock'}
              </button>
            </div>

            {(lockModal.type === 'unlock' || lockModal.type === 'remove') && (
              <button
                onClick={() => {
                  const confirmDelete = confirm("Forgot PIN? This will permanently delete the entire workspace and all its contents.");
                  if (confirmDelete) { deleteWorkspace(lockModal.id); setLockModal(null); setPinInput(""); }
                }}
                className={`text-[11px] hover:underline mt-6 text-center w-full block ${isDarkMode ? "text-red-400" : "text-red-500"}`}
              >
                Forgot PIN? Delete Workspace
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}