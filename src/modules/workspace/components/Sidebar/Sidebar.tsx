"use client";

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { 
  Search, FolderOpen, Trash2, FileText, FileCode, FileJson, 
  File, ChevronRight, ChevronDown, Edit3, FolderPlus, FilePlus,
  Briefcase, X, Command, CheckSquare, Menu, PanelLeftClose
} from 'lucide-react';
import { Folder, Document } from "../../types/types";
import { useTheme } from "@/theme/ThemeProvider";

const getFileIcon = (type?: string) => {
  switch (type) {
    case "py": return <FileCode size={14} className="text-blue-500" />;
    case "js": return <FileCode size={14} className="text-yellow-500" />;
    case "java": return <FileCode size={14} className="text-red-500" />;
    case "json": return <FileJson size={14} className="text-orange-500" />;
    case "txt": return <FileText size={14} className="text-neutral-400" />;
    default: return <File size={14} className="text-neutral-400" />;
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
    isSidebarOpen, setIsSidebarOpen
  } = system;

  const { isDarkMode } = useTheme();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: "folder" | "file", id: string } | null>(null);
  
  const [creating, setCreating] = useState<{ type: "folder" | "file", parentId: string | null } | null>(null);
  const [createValue, setCreateValue] = useState("");

  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [workspaceNameInput, setWorkspaceNameInput] = useState("");

  const isSearching = search.trim().length > 0;
  const docsToShow = isSearching ? globalSearchResults : [];

  const activeWorkspace = workspaces?.find((w: any) => w.id === activeWorkspaceId);
  const totalFiles = documents?.filter((d: Document) => !d.deletedAt).length || 0;
  const totalFolders = folders?.length || 0;

  // ==========================================
  // SCROLL LOCKING & OVERLAY EFFECTS
  // ==========================================
  useEffect(() => {
    // Lock body scroll on mobile when sidebar opens to prevent leakage
    if (isSidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

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

  // ==========================================
  // SHORTCUTS
  // ==========================================
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

  // ==========================================
  // TREE MAPPING
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

  const { roots, rootFiles } = useMemo(() => {
    const rootMap: Record<string, any> = {};
    const rootsArray: any[] = [];
    const rootFilesArray: any[] = [];
    
    folders.forEach((f: Folder) => { rootMap[f.id] = { ...f, children: [], docs: [] }; });
    folders.forEach((f: Folder) => {
      if (f.parentId && rootMap[f.parentId]) rootMap[f.parentId].children.push(rootMap[f.id]); 
      else rootsArray.push(rootMap[f.id]); 
    });
    documents.forEach((doc: Document) => {
      if (!doc.deletedAt) {
        if (doc.folderId && rootMap[doc.folderId]) rootMap[doc.folderId].docs.push(doc); 
        else if (!doc.folderId) rootFilesArray.push(doc);
      }
    });
    return { roots: rootsArray, rootFiles: rootFilesArray };
  }, [folders, documents]);

  const renderInlineInput = (parentId: string | null, depthIndent: number = 0) => {
    if (creating?.parentId !== parentId) return null;
    return (
      <div style={{ paddingLeft: depthIndent }} className="flex items-center gap-2 pr-4 py-2 mx-3 animate-[fadeIn_0.15s_ease-out]">
        {creating.type === "folder" ? <FolderOpen size={14} className={isDarkMode ? "text-neutral-500" : "text-neutral-400"}/> : <File size={14} className={isDarkMode ? "text-neutral-500" : "text-neutral-400"}/>}
        <input
          autoFocus value={createValue} onChange={(e) => setCreateValue(e.target.value)} placeholder={`New ${creating.type}`}
          className={`flex-1 border rounded px-2 py-1 outline-none text-[13px] shadow-sm ${
            isDarkMode ? "bg-black border-blue-500 text-white placeholder-neutral-600" : "bg-white border-blue-500 text-black placeholder-neutral-400"
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
    const indent = depth * 12;
    return nodeFolders.map(folder => {
      const isActiveFolder = activeFolderId === folder.id && !isSearching;
      const isExpanded = expandedFolders[folder.id];
      const isSelected = selectedItems?.has(folder.id);
      
      return (
        <div key={folder.id} className="flex flex-col">
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
            className={`group flex items-center gap-2 pr-3 py-1.5 mx-3 rounded-md cursor-pointer transition-colors active:scale-[0.99] ${
              isActiveFolder || isSelected 
                ? (isDarkMode ? 'bg-neutral-900 text-white' : 'bg-blue-50 text-blue-700') 
                : (isDarkMode ? 'hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200' : 'hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900')
            }`}
          >
            <span className={`folder-arrow shrink-0 transition-transform duration-200 p-0.5 rounded ${
              isDarkMode ? "text-neutral-500 hover:bg-neutral-800" : "text-neutral-400 hover:bg-neutral-200"
            }`}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <FolderOpen size={14} className={isActiveFolder ? (isDarkMode ? "text-blue-400" : "text-blue-600") : (isDarkMode ? "text-neutral-500" : "text-neutral-400")} />
            
            {renamingId === folder.id ? (
              <input
                autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRenameSubmit(folder.id, 'folder')} onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(folder.id, 'folder')}
                className={`flex-1 border rounded px-1.5 py-0.5 outline-none text-[13px] ${
                  isDarkMode ? "bg-black border-blue-500 text-white" : "bg-white border-blue-500 text-black"
                }`} 
                onClick={(e) => e.stopPropagation()}
              />
            ) : <span className={`truncate flex-1 text-[13px] select-none ${isActiveFolder ? 'font-medium' : 'font-normal'}`}>{folder.name}</span>}
            
            {/* Desktop Hover Actions */}
            <div className="hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedFolders((p: any) => ({ ...p, [folder.id]: true })); setCreating({ type: "file", parentId: folder.id }); }}
                className={`p-1 rounded transition-colors ${isDarkMode ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"}`}
                title="New File"
              >
                <FilePlus size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedFolders((p: any) => ({ ...p, [folder.id]: true })); setCreating({ type: "folder", parentId: folder.id }); }}
                className={`p-1 rounded transition-colors ${isDarkMode ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"}`}
                title="New Subfolder"
              >
                <FolderPlus size={12} />
              </button>
            </div>
          </div>

          <div className={`transition-all duration-200 ease-out overflow-hidden ${isExpanded ? 'max-h-auto opacity-100 mt-[1px]' : 'max-h-0 opacity-0'}`}>
            <div className="flex flex-col gap-[1px]">
              {renderInlineInput(folder.id, indent + 22)}
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
                  style={{ paddingLeft: indent + 28 }}
                  className={`group flex items-center gap-2 pr-3 py-1.5 mx-3 rounded-md cursor-pointer transition-colors active:scale-[0.99] ${
                    activeDocId === doc.id || selectedItems?.has(doc.id) 
                      ? (isDarkMode ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-900 font-medium") 
                      : (isDarkMode ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900" : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100")
                  }`}
                >
                  {getFileIcon(doc.type)}
                  
                  {renamingId === doc.id ? (
                    <input
                      autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRenameSubmit(doc.id, 'doc')} onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(doc.id, 'doc')}
                      className={`flex-1 border rounded px-1.5 py-0.5 outline-none text-[13px] ${
                        isDarkMode ? "bg-black border-blue-500 text-white" : "bg-white border-blue-500 text-black"
                      }`} onClick={(e) => e.stopPropagation()}
                    />
                  ) : <span className={`truncate flex-1 text-[13px] select-none ${activeDocId === doc.id ? (isDarkMode ? 'font-medium text-white' : 'font-medium text-neutral-900') : 'font-normal'}`}>{doc.title}</span>}

                  {/* Desktop File Hover Actions */}
                  <div className="hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setRenamingId(doc.id); setRenameValue(doc.title); }} 
                      className={`p-1 rounded transition-colors ${isDarkMode ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"}`}
                      title="Rename File"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }} 
                      className={`p-1 rounded transition-colors ${isDarkMode ? "text-neutral-400 hover:bg-red-950 hover:text-red-400" : "text-neutral-500 hover:bg-red-100 hover:text-red-600"}`}
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

      {/* Extreme Blocking Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998] lg:hidden animate-[fadeIn_0.3s_ease-out]" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Main Sidebar Shell */}
      <div 
        className={`fixed lg:sticky top-0 lg:top-[var(--navbar-h)] left-0 h-[100dvh] lg:h-[calc(100vh-var(--navbar-h))] w-[88vw] max-w-[380px] border-r transition-all duration-300 ease-out z-[9999] lg:z-40 flex flex-col select-none pt-[env(safe-area-inset-top)] lg:pt-0 overflow-hidden ${
          isSidebarOpen ? "translate-x-0 lg:w-[320px]" : "-translate-x-full lg:translate-x-0 lg:w-0"
        } ${isDarkMode ? "bg-black border-neutral-900 text-white" : "bg-white border-neutral-200 text-neutral-900"}`}
      >
        
        {/* Modern Unified Header */}
        <div className="flex items-start justify-between px-5 pt-6 pb-4 relative workspace-dropdown-container z-20">
          <div className="flex flex-col gap-0.5">
            <span className={`text-[12px] font-medium tracking-wide uppercase ${isDarkMode ? "text-neutral-500" : "text-neutral-400"}`}>NexSpace</span>
            
            <div 
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)} 
              className="inline-flex items-center gap-1.5 cursor-pointer group w-max mt-0.5"
            >
              <h2 className={`text-[18px] font-bold tracking-tight transition-opacity ${isDarkMode ? "text-white group-hover:text-neutral-300" : "text-neutral-900 group-hover:text-neutral-600"}`}>
                {activeWorkspace?.name || "Workspace"}
              </h2>
              <ChevronDown size={16} className={`transition-transform ${isDarkMode ? "text-neutral-500 group-hover:text-neutral-300" : "text-neutral-400 group-hover:text-neutral-600"} ${showWorkspaceDropdown ? 'rotate-180' : ''}`} />
            </div>

            <div className={`text-[12px] mt-1 ${isDarkMode ? "text-neutral-500" : "text-neutral-500"}`}>
              {totalFiles} Files • {totalFolders} Folders
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className={`hidden lg:flex p-2 rounded-md transition-colors ${
                isDarkMode ? "hover:bg-neutral-900" : "hover:bg-neutral-100"
              }`}
            >
              <PanelLeftClose size={16} className={isDarkMode ? "text-neutral-400" : "text-neutral-600"} />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className={`lg:hidden p-2 rounded-full active:scale-95 transition-all ${
                isDarkMode ? "bg-neutral-900 hover:bg-neutral-800" : "bg-neutral-100 hover:bg-neutral-200"
              }`}
            >
              <X size={16} className={isDarkMode ? "text-neutral-400" : "text-neutral-700"} />
            </button>
          </div>

          {/* Workspace Dropdown */}
          {showWorkspaceDropdown && (
            <div className={`absolute top-20 left-4 right-4 border rounded-lg shadow-xl py-1.5 animate-[fadeIn_0.1s_ease-out] z-50 ${
              isDarkMode ? "bg-[#111111] border-neutral-800" : "bg-white border-neutral-200"
            }`}>
              <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-neutral-500" : "text-neutral-400"}`}>Workspaces</div>
              
              <div className="max-h-48 overflow-y-auto scrollbar-hide">
                {workspaces?.map((ws: any) => (
                  <div key={ws.id} className={`group flex items-center justify-between px-3 py-2 cursor-pointer text-[13px] font-medium ${
                    isDarkMode ? "hover:bg-neutral-900 text-neutral-300" : "hover:bg-neutral-50 text-neutral-700"
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
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${ws.color || 'bg-neutral-800'} shrink-0`}>
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
                            isDarkMode ? "bg-black border-blue-500 text-white" : "bg-white border-blue-400 text-black"
                          }`}
                        />
                      ) : (
                        <div className="flex items-center justify-between flex-1 min-w-0 pr-1">
                          <span className="truncate">{ws.name}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setRenamingId(ws.id); setRenameValue(ws.name); }}
                              className={`p-1 rounded transition-colors ${isDarkMode ? "text-neutral-400 hover:bg-neutral-800" : "text-neutral-500 hover:bg-neutral-200"}`}
                              title="Rename"
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
                              title="Delete"
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

              <div className={`border-t my-1 ${isDarkMode ? "border-neutral-800" : "border-neutral-100"}`} />

              {creatingWorkspace ? (
                <div className="px-3 py-2">
                  <input
                    autoFocus placeholder="Workspace Name..." value={workspaceNameInput} onChange={e => setWorkspaceNameInput(e.target.value)}
                    className={`w-full px-2 py-1.5 border rounded text-[13px] outline-none shadow-sm ${
                      isDarkMode ? "bg-black border-blue-500 text-white placeholder-neutral-600" : "bg-white border-blue-400 text-black placeholder-neutral-400"
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && workspaceNameInput.trim()) { createWorkspace(workspaceNameInput.trim()); setCreatingWorkspace(false); setWorkspaceNameInput(""); setShowWorkspaceDropdown(false); }
                      if (e.key === 'Escape') setCreatingWorkspace(false);
                    }}
                  />
                </div>
              ) : (
                <div onClick={(e) => { e.stopPropagation(); setCreatingWorkspace(true); }} className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-[13px] font-medium transition-colors ${
                  isDarkMode ? "text-neutral-300 hover:bg-neutral-900" : "text-neutral-600 hover:bg-neutral-50"
                }`}>
                  <Briefcase size={14} className={isDarkMode ? "text-neutral-500" : "text-neutral-400"} /><span>Create Workspace</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Unified Search & Actions */}
        <div className="px-5 pb-4 relative z-10">
          <div className={`relative flex items-center border rounded-lg transition-all duration-200 ${
            isSearching ? (isDarkMode ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-blue-400 ring-1 ring-blue-400/50') : (isDarkMode ? 'border-neutral-800 bg-[#111111]' : 'border-neutral-200 bg-neutral-50')
          }`}>
            <Search size={14} className={`absolute left-3 ${isSearching ? 'text-blue-500' : 'text-neutral-400'}`} />
            <input 
              ref={searchInputRef} type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-8 py-2.5 bg-transparent text-[13px] outline-none ${
                isDarkMode ? "text-white placeholder-neutral-500" : "text-black placeholder-neutral-400"
              }`} 
            />
            <div className="absolute right-2.5 flex items-center gap-0.5 text-neutral-400 pointer-events-none">
              <Command size={12} /><span className="text-[10px] font-semibold">K</span>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <button onClick={() => setCreating({ type: "file", parentId: null })} className={`flex-1 flex items-center justify-center gap-1.5 border text-[12px] font-medium py-1.5 rounded-md transition-all active:scale-95 shadow-sm ${
              isDarkMode ? "bg-black border-neutral-800 hover:bg-[#111111] text-neutral-300" : "bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-700"
            }`}>
              <FilePlus size={13} className={isDarkMode ? "text-neutral-500" : "text-neutral-400"} /> New File
            </button>
            <button onClick={() => setCreating({ type: "folder", parentId: null })} className={`flex-1 flex items-center justify-center gap-1.5 border text-[12px] font-medium py-1.5 rounded-md transition-all active:scale-95 shadow-sm ${
              isDarkMode ? "bg-black border-neutral-800 hover:bg-[#111111] text-neutral-300" : "bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-700"
            }`}>
              <FolderPlus size={13} className={isDarkMode ? "text-neutral-500" : "text-neutral-400"} /> New Folder
            </button>
          </div>
        </div>

        {/* Tree Area */}
        <div 
          className="flex-1 overflow-y-auto touch-pan-y pb-20 scrollbar-hide relative z-0"
          onDragOver={(e) => { e.preventDefault(); }} 
          onDrop={(e) => { 
            e.preventDefault(); 
            const droppedFileId = e.dataTransfer.getData("application/file");
            const droppedFolderId = e.dataTransfer.getData("application/folder");
            if (droppedFileId) handleDrop(droppedFileId, null, 'file');
            if (droppedFolderId) handleDrop(droppedFolderId, null, 'folder');
          }}
        >
          {isSearching && <div className={`absolute inset-0 z-[-1] backdrop-blur-md ${isDarkMode ? "bg-black/95" : "bg-white/95"}`} />}

          <div className={`transition-transform duration-300 ease-out origin-top ${isSearching ? 'scale-[0.98] opacity-90' : 'scale-100'}`}>
            {!isSearching && (
              <div className="space-y-[1px] pb-6 mt-2">
                {renderInlineInput(null, 0)}

                {/* Empty State */}
                {documents.length === 0 && folders.length === 0 && !creating && (
                  <div className="flex flex-col items-center justify-center pt-10 px-6 text-center animate-[fadeIn_0.3s_ease-out]">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-sm border ${isDarkMode ? "bg-[#111111] border-neutral-800" : "bg-neutral-50 border-neutral-100"}`}>
                      <FolderOpen size={20} className={isDarkMode ? "text-neutral-600" : "text-neutral-400"} />
                    </div>
                    <p className={`text-[14px] font-semibold ${isDarkMode ? "text-neutral-300" : "text-neutral-800"}`}>Workspace is empty</p>
                    <p className={`text-[12px] mt-1 mb-4 leading-relaxed ${isDarkMode ? "text-neutral-500" : "text-neutral-500"}`}>Start by creating your first file or folder above.</p>
                  </div>
                )}

                {/* FOLDERS SECTION */}
                {roots.length > 0 && (
                  <div className="mb-5 mt-1">
                    <div className={`px-5 text-[10px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? "text-neutral-600" : "text-neutral-400"}`}>Folders</div>
                    {renderTree(roots, 0)}
                  </div>
                )}

                {/* FILES SECTION */}
                {rootFiles.length > 0 && (
                  <div>
                    <div className={`px-5 text-[10px] font-bold uppercase tracking-widest mb-2 ${roots.length > 0 ? "mt-4" : "mt-1"} ${isDarkMode ? "text-neutral-600" : "text-neutral-400"}`}>Files</div>
                    {rootFiles.map((doc: Document) => (
                      <div
                        key={doc.id} draggable
                        onDragStart={(e) => { e.dataTransfer.setData("application/file", doc.id); document.body.style.opacity = "0.8"; }}
                        onDragEnd={() => { document.body.style.opacity = "1"; }}
                        onClick={(e) => { 
                          if (e.metaKey || e.ctrlKey) toggleSelection(doc.id, true);
                          else { setActiveDocId(doc.id); setOpenTabs((p: any) => p.includes(doc.id) ? p : [...p, doc.id]); if (window.innerWidth < 1024) setIsSidebarOpen(false); }
                        }}
                        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, type: "file", id: doc.id }); }}
                        className={`group flex items-center gap-2 px-3 py-1.5 mx-3 rounded-md cursor-pointer transition-colors active:scale-[0.99] ${
                          activeDocId === doc.id || selectedItems?.has(doc.id) 
                            ? (isDarkMode ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-900 font-medium") 
                            : (isDarkMode ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900" : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100")
                        }`}
                      >
                        {getFileIcon(doc.type)}
                        
                        {renamingId === doc.id ? (
                          <input
                            autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleRenameSubmit(doc.id, 'doc')} onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(doc.id, 'doc')}
                            className={`flex-1 border rounded px-1.5 py-0.5 outline-none text-[13px] ${
                              isDarkMode ? "bg-black border-blue-500 text-white" : "bg-white border-blue-500 text-black"
                            }`} onClick={(e) => e.stopPropagation()}
                          />
                        ) : <span className={`truncate flex-1 text-[13px] select-none ${activeDocId === doc.id ? (isDarkMode ? 'font-medium text-white' : 'font-medium text-neutral-900') : 'font-normal'}`}>{doc.title}</span>}

                        {/* Desktop File Hover Actions */}
                        <div className="hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setRenamingId(doc.id); setRenameValue(doc.title); }} 
                            className={`p-1 rounded transition-colors ${isDarkMode ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"}`}
                            title="Rename File"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }} 
                            className={`p-1 rounded transition-colors ${isDarkMode ? "text-neutral-400 hover:bg-red-950 hover:text-red-400" : "text-neutral-500 hover:bg-red-100 hover:text-red-600"}`}
                            title="Delete File"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isSearching && (
              <div className="px-3 z-10 relative mt-2">
                <span className={`px-2 text-[10px] font-bold tracking-widest uppercase block mb-2 mt-1 ${isDarkMode ? "text-neutral-600" : "text-neutral-400"}`}>Search Results</span>
                {docsToShow.length === 0 && (
                  <div className={`text-[13px] px-3 py-5 text-center border border-dashed rounded-lg mx-2 mt-2 ${
                    isDarkMode ? "bg-black border-neutral-800 text-neutral-500" : "bg-neutral-50 border-neutral-200 text-neutral-500"
                  }`}>
                    No results found for "<span className={`font-medium ${isDarkMode ? "text-neutral-300" : "text-neutral-800"}`}>{search}</span>"
                  </div>
                )}
                {docsToShow.map((doc: Document) => {
                  const path = getFolderPath(doc.folderId).map(f => f.name).join(" / ");
                  return (
                    <div 
                      key={doc.id} onClick={() => { setActiveDocId(doc.id); setSearch(""); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
                      className={`flex flex-col gap-0.5 px-3 py-2.5 mx-2 border rounded-lg cursor-pointer transition-all duration-150 active:scale-[0.99] ${
                        isDarkMode 
                          ? "bg-[#111111] border-neutral-800 hover:border-neutral-700" 
                          : "bg-white border-neutral-100 hover:border-neutral-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getFileIcon(doc.type)}<span className={`text-[13px] truncate font-medium ${isDarkMode ? "text-neutral-200" : "text-neutral-800"}`}>{highlightMatch(doc.title)}</span>
                      </div>
                      {path && <div className="pl-6 text-[10px] text-neutral-500 truncate">{path}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selection State Popover */}
        {selectedItems && selectedItems.size > 0 && (
          <div className={`absolute bottom-6 left-4 right-4 backdrop-blur-md rounded-lg shadow-2xl px-4 py-3 flex items-center justify-between animate-[slideUp_0.2s_ease-out] z-50 ${
            isDarkMode ? "bg-neutral-900 text-white border border-neutral-800" : "bg-neutral-900 text-white border border-neutral-800"
          }`}>
            <div className="flex items-center gap-2"><CheckSquare size={16} className="text-blue-400" /><span className="text-[13px] font-medium">{selectedItems.size} selected</span></div>
            <div className="flex items-center gap-3"><button onClick={() => toggleSelection(null, false)} className="text-[12px] text-neutral-300 hover:text-white font-medium active:scale-95 transition-transform">Clear</button></div>
          </div>
        )}
      </div>

      {/* Cross-device Context Menu */}
      {contextMenu && (
        <div style={{ top: contextMenu.y, left: contextMenu.x }} className={`fixed backdrop-blur-md border shadow-2xl rounded-lg z-[9999] w-48 py-1.5 px-1.5 animate-[fadeIn_0.1s_ease-out] context-menu-container flex flex-col gap-0.5 ${
          isDarkMode ? "bg-[#111111]/95 border-neutral-800" : "bg-white/95 border-neutral-200"
        }`}>
          <button onClick={(e) => { e.stopPropagation(); const id = contextMenu.id; const item = contextMenu.type === 'folder' ? folders.find((f: any) => f.id === id) : documents.find((d: any) => d.id === id); setRenamingId(id); setRenameValue(item?.name || item?.title || ""); setContextMenu(null); }} className={`w-full text-left px-2.5 py-2.5 rounded-md text-[13px] flex items-center gap-2.5 font-medium active:scale-[0.98] transition-colors ${
            isDarkMode ? "text-neutral-300 hover:bg-neutral-800" : "text-neutral-700 hover:bg-neutral-100"
          }`}>
            <Edit3 size={14} className={isDarkMode ? "text-neutral-500" : "text-neutral-500"} /> Rename
          </button>
          
          {contextMenu.type === 'folder' && (
            <button onClick={(e) => { e.stopPropagation(); setExpandedFolders((p: any) => ({...p, [contextMenu.id]: true})); setCreating({ type: "folder", parentId: contextMenu.id }); setContextMenu(null); }} className={`w-full text-left px-2.5 py-2.5 rounded-md text-[13px] flex items-center gap-2.5 font-medium active:scale-[0.98] transition-colors ${
              isDarkMode ? "text-neutral-300 hover:bg-neutral-800" : "text-neutral-700 hover:bg-neutral-100"
            }`}>
              <FolderPlus size={14} className={isDarkMode ? "text-neutral-500" : "text-neutral-500"} /> New Subfolder
            </button>
          )}
          
          <div className={`h-[1px] my-0.5 w-full ${isDarkMode ? "bg-neutral-800" : "bg-neutral-100"}`} />
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if(contextMenu.type === 'folder') deleteFolder(contextMenu.id);
              else deleteDocument(contextMenu.id);
              setContextMenu(null);
            }}
            className={`w-full text-left px-2.5 py-2.5 rounded-md text-[13px] flex items-center gap-2.5 group active:scale-[0.98] transition-colors ${
              isDarkMode ? "text-red-400 hover:bg-red-950/30" : "text-red-600 hover:bg-red-50"
            }`}
          >
            <Trash2 size={14} className={`transition-colors ${isDarkMode ? "text-red-500 group-hover:text-red-400" : "text-red-400 group-hover:text-red-600"}`} /> Delete {contextMenu.type === 'folder' ? 'Folder' : 'File'}
          </button>
        </div>
      )}
    </>
  );
}