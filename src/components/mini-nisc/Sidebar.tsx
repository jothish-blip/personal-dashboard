import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  Search, FolderOpen, Trash2, FileText, FileCode, FileJson, 
  File, ChevronRight, ChevronDown, Edit3, FolderPlus, FilePlus,
  Briefcase, X, Command, CheckSquare, Menu, Lock, Unlock
} from 'lucide-react';
import { Folder, Document } from './types';

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
      p.toLowerCase() === search.toLowerCase() ? <span key={i} className="bg-yellow-200 text-black rounded px-0.5">{p}</span> : p
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
        {creating.type === "folder" ? <FolderOpen size={14} className="text-gray-400"/> : <File size={14} className="text-gray-400"/>}
        <input
          autoFocus value={createValue} onChange={(e) => setCreateValue(e.target.value)} placeholder={`New ${creating.type}`}
          className="flex-1 bg-white border border-blue-500 rounded px-2 py-1.5 text-[13px] outline-none shadow-sm"
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
          {depth > 0 && <div className="absolute top-0 bottom-0 w-px bg-gray-200 pointer-events-none" style={{ left: indent - 6 }}/>}
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
              isActiveFolder || isSelected ? 'bg-blue-50/80 border-blue-500 text-blue-700 shadow-[inset_1px_0_0_0_rgba(59,130,246,0.1)]' : 'border-transparent hover:bg-gray-100/80 text-gray-700 hover:text-gray-900'
            }`}
          >
            <span className="folder-arrow text-gray-400 shrink-0 transition-transform duration-200 p-0.5 hover:bg-gray-200 rounded">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <FolderOpen size={15} className={isActiveFolder ? "text-blue-600" : "text-gray-400"} />
            
            {renamingId === folder.id ? (
              <input
                autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRenameSubmit(folder.id, 'folder')} onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(folder.id, 'folder')}
                className="flex-1 bg-white border border-blue-500 rounded px-1.5 py-0.5 outline-none text-[13px]" onClick={(e) => e.stopPropagation()}
              />
            ) : <span className={`truncate flex-1 text-[13px] select-none ${isActiveFolder ? 'font-semibold' : 'font-medium'}`}>{folder.name}</span>}
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
                  style={{ paddingLeft: indent + 18 }}
                  className={`group flex items-center gap-2 pr-3 py-2.5 mx-2 rounded-md cursor-pointer transition-all duration-150 ease-out border-l-2 active:scale-[0.99] ${
                    activeDocId === doc.id || selectedItems?.has(doc.id) ? "bg-blue-50 border-blue-400 text-blue-700 font-medium" : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/60"
                  }`}
                >
                  {getFileIcon(doc.type)}
                  <span className={`truncate flex-1 text-[12.5px] select-none ${activeDocId === doc.id ? 'font-medium text-blue-700' : 'font-normal'}`}>{doc.title}</span>
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
          className="fixed top-3 left-3 pt-[env(safe-area-inset-top)] z-[45] lg:hidden bg-white border border-gray-200 shadow-sm p-2 rounded-md active:scale-95 transition-transform"
        >
          <Menu size={20} className="text-gray-700" />
        </button>
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-250" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div 
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
        className={`fixed lg:static z-50 top-[56px] md:top-[64px] h-[calc(100vh-56px)] md:h-[calc(100vh-64px)] w-[300px] bg-white border-r border-gray-200 transition-transform duration-250 ease-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} shadow-2xl lg:shadow-none flex flex-col select-none pt-[env(safe-area-inset-top)]`}
      >
        
        <div className="lg:hidden flex items-center justify-between px-4 py-2 h-[56px] min-h-[56px] border-b border-gray-200 bg-white">
          <span className="font-semibold text-sm text-gray-800">Files</span>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all">
            <X size={18} className="text-gray-700" />
          </button>
        </div>

        <div className="px-3 pt-4 pb-2 relative workspace-dropdown-container z-20">
          <div className="flex items-center justify-between bg-white border border-gray-200 shadow-sm px-3 py-3 rounded-lg">
            <div onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)} className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
              <div className={`w-7 h-7 ${activeWorkspace?.color || 'bg-gray-800'} rounded-md flex items-center justify-center shadow-sm`}>
                <span className="text-white text-[13px] font-bold">{activeWorkspace?.name.charAt(0).toUpperCase() || 'W'}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 truncate tracking-tight">{activeWorkspace?.name || "Loading..."}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
          </div>

          {showWorkspaceDropdown && (
            <div className="absolute top-[68px] left-3 right-3 bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 animate-[fadeIn_0.1s_ease-out]">
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Workspaces</div>
              
              <div className="max-h-48 overflow-y-auto scrollbar-hide">
                {workspaces?.map((ws: any) => (
                  <div key={ws.id} className="group flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 cursor-pointer text-[13px] text-gray-700 font-medium">
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
                          className="text-[13px] border border-blue-400 rounded px-1.5 py-0.5 outline-none w-full"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="truncate">{ws.name}</span>
                          {/* 🔥 Fixed Title Typo Error Here */}
                          {ws.lockHash && (
                            <span title="Protected Workspace" className="shrink-0 flex items-center">
                              <Lock size={10} className="text-gray-400" />
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 my-1" />

              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Current Workspace Options</div>
              
              {activeWorkspace?.lockHash ? (
                <>
                  <div 
                    onClick={(e) => { e.stopPropagation(); setLockModal({ type: 'remove', id: activeWorkspaceId }); setShowWorkspaceDropdown(false); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer text-[13px] font-medium transition-colors"
                  >
                    <Unlock size={14} className="text-gray-500" /><span>Remove PIN Lock</span>
                  </div>
                  <div 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const confirmDelete = confirm("Forgot PIN? This will permanently delete the entire workspace and all its contents.");
                      if (confirmDelete) { deleteWorkspace(activeWorkspaceId); setShowWorkspaceDropdown(false); }
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 cursor-pointer text-[13px] font-medium transition-colors"
                  >
                    <Trash2 size={14} /><span>Forgot PIN? (Delete Workspace)</span>
                  </div>
                </>
              ) : (
                <div 
                  onClick={(e) => { e.stopPropagation(); setLockModal({ type: 'set', id: activeWorkspaceId }); setShowWorkspaceDropdown(false); }}
                  className="flex items-center gap-2.5 px-3 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer text-[13px] font-medium transition-colors"
                >
                  <Lock size={14} className="text-gray-500" /><span>Set PIN Lock</span>
                </div>
              )}

              <div className="border-t border-gray-100 my-1" />

              {creatingWorkspace ? (
                <div className="px-3 py-2">
                  <input
                    autoFocus placeholder="Workspace Name..." value={workspaceNameInput} onChange={e => setWorkspaceNameInput(e.target.value)}
                    className="w-full px-2.5 py-2 border border-blue-400 rounded-md text-[13px] outline-none shadow-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && workspaceNameInput.trim()) { createWorkspace(workspaceNameInput.trim()); setCreatingWorkspace(false); setWorkspaceNameInput(""); setShowWorkspaceDropdown(false); }
                      if (e.key === 'Escape') setCreatingWorkspace(false);
                    }}
                  />
                </div>
              ) : (
                <div onClick={(e) => { e.stopPropagation(); setCreatingWorkspace(true); }} className="flex items-center gap-2.5 px-3 py-2 text-blue-600 hover:bg-blue-50 cursor-pointer text-[13px] font-medium transition-colors">
                  <Briefcase size={14} /><span>Create Workspace</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-3 py-1.5 flex gap-1.5 relative z-10">
          <button disabled={isLocked} onClick={() => setCreating({ type: "file", parentId: null })} className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm text-gray-700 text-[12.5px] font-medium py-2.5 rounded-md transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <FilePlus size={14} className={isLocked ? "text-gray-300" : "text-gray-500"} /> New File
          </button>
          <button disabled={isLocked} onClick={() => setCreating({ type: "folder", parentId: null })} className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm text-gray-700 text-[12.5px] font-medium py-2.5 rounded-md transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <FolderPlus size={14} className={isLocked ? "text-gray-300" : "text-gray-500"} /> New Folder
          </button>
        </div>

        <div className="px-3 py-2 relative z-10">
          <div className={`relative group flex items-center bg-white border ${isSearching ? 'border-blue-400 ring-2 ring-blue-50' : 'border-gray-200'} rounded-md transition-all duration-200 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
            <Search size={14} className={`absolute left-2.5 ${isSearching ? 'text-blue-500' : 'text-gray-400'}`} />
            <input 
              ref={searchInputRef} type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} disabled={isLocked}
              className="w-full pl-8 pr-8 py-2.5 bg-transparent text-[13px] outline-none placeholder-gray-400" 
            />
            <div className="absolute right-2 flex items-center gap-0.5 text-gray-300 pointer-events-none">
              <Command size={12} /><span className="text-[10px] font-semibold">K</span>
            </div>
          </div>
        </div>

        {breadcrumbPath.length > 0 && !isSearching && !isLocked && (
          <div className="px-4 py-2 flex items-center gap-1 text-[11px] text-gray-500 overflow-x-auto whitespace-nowrap scrollbar-hide border-y border-gray-100 bg-white/50">
            <span onClick={() => setActiveFolderId(null)} className="hover:text-blue-600 cursor-pointer font-medium truncate max-w-[80px]">{activeWorkspace?.name || 'Workspace'}</span>
            <ChevronRight size={10} className="text-gray-300 shrink-0" />
            {breadcrumbPath.map((p, i) => (
              <div key={p.id} className="flex items-center gap-1 shrink-0">
                <span className={`cursor-pointer truncate max-w-[80px] ${i === breadcrumbPath.length - 1 ? 'text-gray-800 font-semibold' : 'hover:text-blue-600'}`} onClick={() => setActiveFolderId(p.id)}>{p.name}</span>
                {i < breadcrumbPath.length - 1 && <ChevronRight size={10} className="text-gray-300" />}
              </div>
            ))}
          </div>
        )}

        <div 
          className={`flex-1 overflow-y-auto touch-pan-y pb-20 scrollbar-hide relative z-0 ${isSearching ? 'bg-white/95 backdrop-blur-md' : ''}`}
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
               <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-3 shadow-inner">
                 <Lock size={16} className="text-gray-400" />
               </div>
               <p className="text-[13px] font-semibold text-gray-700">Workspace Locked</p>
               <p className="text-[11px] text-gray-400 mt-1 mb-5 leading-relaxed">Unlock to view folders and files.</p>
               <button
                 onClick={() => setLockModal({ type: 'unlock', id: activeWorkspaceId })}
                 className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md text-[12px] font-medium transition-colors shadow-sm active:scale-[0.98]"
               >
                 Unlock
               </button>
            </div>
          ) : (
            <>
              {isSearching && <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[-1]" />}

              <div className={`transition-transform duration-300 ease-out origin-top pt-2 ${isSearching ? 'scale-[0.98] opacity-90' : 'scale-100'}`}>
                {!isSearching && (
                  <div className="space-y-[1px]">
                    {renderInlineInput(null, 0)}

                    {documents.length === 0 && folders.length === 0 && !creating && (
                      <div className="flex flex-col items-center justify-center pt-10 px-6 text-center animate-[fadeIn_0.3s_ease-out]">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 shadow-inner"><FolderOpen size={20} className="text-gray-400 animate-bounce" /></div>
                        <p className="text-[14px] font-semibold text-gray-800">No files yet</p>
                        <p className="text-[12px] text-gray-500 mt-1 mb-5 leading-relaxed">Start by creating your first file or folder.</p>
                        <div className="flex flex-col gap-2.5 w-full">
                          <button onClick={() => setCreating({type: 'file', parentId: null})} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[13px] font-semibold transition-colors shadow-sm active:scale-[0.98]">
                            + Create your first file
                          </button>
                          <button onClick={() => setCreating({type: 'folder', parentId: null})} className="w-full py-2.5 bg-transparent border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-md text-[13px] font-medium transition-colors shadow-sm active:scale-[0.98]">
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
                          className={`group flex items-center gap-2 px-3 py-2.5 mx-2 rounded-md cursor-pointer transition-all duration-150 ease-out border-l-2 active:scale-[0.99] ${
                            activeDocId === doc.id || selectedItems?.has(doc.id) ? "bg-blue-50 border-blue-500 text-blue-700 font-medium shadow-[inset_1px_0_0_0_rgba(59,130,246,0.1)]" : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/80"
                          }`}
                        >
                          {getFileIcon(doc.type)}
                          <span className={`truncate flex-1 text-[12.5px] select-none ${activeDocId === doc.id ? 'text-blue-700 font-medium' : 'font-normal'}`}>{doc.title}</span>
                        </div>
                    ))}
                    {renderTree(roots, 0)}
                  </div>
                )}

                {isSearching && (
                  <div className="px-2 z-10 relative">
                    <span className="px-3 text-[10px] font-bold text-gray-400 tracking-widest uppercase block mb-2 mt-1">Search Results</span>
                    {docsToShow.length === 0 && (
                      <div className="text-[13px] text-gray-500 px-3 py-4 text-center bg-gray-50/80 border border-dashed border-gray-200 rounded-lg mx-2 mt-2">
                        No results found for "<span className="text-gray-800 font-medium">{search}</span>"
                      </div>
                    )}
                    {docsToShow.map((doc: Document) => {
                      const path = getFolderPath(doc.folderId).map(f => f.name).join(" / ");
                      return (
                        <div 
                          key={doc.id} onClick={() => { setActiveDocId(doc.id); setSearch(""); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
                          className="flex flex-col gap-0.5 px-3 py-2.5 mx-2 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm rounded-lg cursor-pointer transition-all duration-150 active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-2">
                            {getFileIcon(doc.type)}<span className="text-[13px] text-gray-800 truncate font-medium">{highlightMatch(doc.title)}</span>
                          </div>
                          {path && <div className="pl-6 text-[10px] text-gray-400 truncate">{path}</div>}
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
          <div className="absolute bottom-4 left-4 right-4 bg-gray-900/90 backdrop-blur-md text-white rounded-lg shadow-2xl px-4 py-3 flex items-center justify-between animate-[slideUp_0.2s_ease-out] z-50">
            <div className="flex items-center gap-2"><CheckSquare size={16} className="text-blue-400" /><span className="text-[13px] font-medium">{selectedItems.size} selected</span></div>
            <div className="flex items-center gap-3"><button onClick={() => toggleSelection(null, false)} className="text-[12px] text-gray-300 hover:text-white font-medium active:scale-95 transition-transform">Clear</button></div>
          </div>
        )}
      </div>

      {contextMenu && (
        <div style={{ top: contextMenu.y, left: contextMenu.x }} className="fixed bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-lg z-[999] w-48 py-1.5 px-1.5 animate-[fadeIn_0.1s_ease-out] context-menu-container flex flex-col gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); const id = contextMenu.id; const item = contextMenu.type === 'folder' ? folders.find((f: any) => f.id === id) : documents.find((d: any) => d.id === id); setRenamingId(id); setRenameValue(item?.name || item?.title || ""); setContextMenu(null); }} className="w-full text-left px-2.5 py-2.5 rounded-md text-[13px] hover:bg-gray-100 transition-colors flex items-center gap-2.5 text-gray-700 font-medium active:scale-[0.98]">
            <Edit3 size={14} className="text-gray-500" /> Rename
          </button>
          {contextMenu.type === 'folder' && (
            <button onClick={(e) => { e.stopPropagation(); setExpandedFolders((p: any) => ({...p, [contextMenu.id]: true})); setCreating({ type: "folder", parentId: contextMenu.id }); setContextMenu(null); }} className="w-full text-left px-2.5 py-2.5 rounded-md text-[13px] hover:bg-gray-100 transition-colors flex items-center gap-2.5 text-gray-700 font-medium active:scale-[0.98]">
              <FolderPlus size={14} className="text-gray-500" /> New Subfolder
            </button>
          )}
          <div className="h-[1px] bg-gray-100 my-0.5 w-full" />
          <button onClick={(e) => { e.stopPropagation(); contextMenu.type === 'folder' ? deleteFolder(contextMenu.id) : deleteDocument(contextMenu.id); setContextMenu(null); }} className="w-full text-left px-2.5 py-2.5 rounded-md text-[13px] hover:bg-red-50 transition-colors flex items-center gap-2.5 text-red-600 font-semibold group active:scale-[0.98]">
            <Trash2 size={14} className="text-red-400 group-hover:text-red-600 transition-colors" /> Delete
          </button>
        </div>
      )}

      {/* Lock Modals */}
      {lockModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-sm animate-[slideUp_0.2s_ease-out]">
            <h2 className="font-bold text-lg mb-2 text-gray-900">
              {lockModal.type === 'set' ? 'Set Workspace Lock' : lockModal.type === 'unlock' ? 'Unlock Workspace' : 'Remove Lock'}
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {lockModal.type === 'set' ? 'Enter a PIN to secure this workspace.' : 'Enter your PIN to continue.'}
            </p>

            <input
              type="password" placeholder="••••" autoFocus value={pinInput} onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-6 text-center text-2xl tracking-[0.5em] font-mono"
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => { setLockModal(null); setPinInput(""); }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors active:scale-95">Cancel</button>
              <button onClick={handlePinSubmit} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm active:scale-95">
                {lockModal.type === 'set' ? 'Lock Workspace' : lockModal.type === 'unlock' ? 'Unlock' : 'Remove Lock'}
              </button>
            </div>

            {(lockModal.type === 'unlock' || lockModal.type === 'remove') && (
              <button
                onClick={() => {
                  const confirmDelete = confirm("Forgot PIN? This will permanently delete the entire workspace and all its contents.");
                  if (confirmDelete) { deleteWorkspace(lockModal.id); setLockModal(null); setPinInput(""); }
                }}
                className="text-[11px] text-red-500 hover:underline mt-6 text-center w-full block"
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