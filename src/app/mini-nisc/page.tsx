"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { useNexCore } from "@/hooks/useNexCore";
import {
  Plus, Trash2, Bold, Italic, Underline, List, CheckSquare, Circle,
  Image as ImageIcon, Undo, Redo, Pin, FileText, Search, X, Clock, Tag,
  BarChart3, Video, FolderOpen, Menu, CheckCircle2, Zap,
  Activity,
  Upload,
  AlertTriangle
} from "lucide-react";

interface Folder {
  id: string;
  name: string;
}

interface HistoryEntry {
  content: string;
  timestamp: number;
  title?: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  tags?: string[];
  pinned?: boolean;
  history?: HistoryEntry[];
  mediaIds?: string[];
  createdAt: number;
  updatedAt: number;
}

interface Media {
  id: string;
  type: "image" | "video";
  url: string;
  name?: string;
  folderId?: string;          
  createdAt: number;
}

type View = "editor" | "analytics" | "history" | "media";

// Helper for "Edited 2 min ago"
function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)} hrs ago`;
  return new Date(ts).toLocaleDateString();
}

export default function NexUpWorkspace() {
  const { state, setMonthYear } = useNexCore();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [view, setView] = useState<View>("editor");
  const [search, setSearch] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  
  // Refined Save Status
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  
  // Media Error State
  const [mediaError, setMediaError] = useState("");

  // Toolbar Active State
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastHistorySave = useRef<number>(0);
  const formatTimeout = useRef<NodeJS.Timeout | null>(null);

  const activeDocument = documents.find(d => d.id === activeDocId);

  // Media counts per folder
  const mediaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    media.forEach(m => {
      if (m.folderId) {
        counts[m.folderId] = (counts[m.folderId] || 0) + 1;
      }
    });
    return counts;
  }, [media]);

  // Load data
  useEffect(() => {
    const savedWorkspace = localStorage.getItem("nexup-workspace-v6");
    const savedMedia = localStorage.getItem("nexup-media-v6");

    if (savedWorkspace) {
      const data = JSON.parse(savedWorkspace);
      setDocuments(data.documents || []);
      setFolders(data.folders || []);
      if (data.documents?.length) setActiveDocId(data.documents[0].id);
    } else {
      const welcome: Document = {
        id: "welcome-doc",
        title: "Welcome to NexUp Workspace",
        content: "<p>This is your personal workspace with folder-based media.</p>",
        tags: ["welcome"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        history: [],
        mediaIds: []
      };
      setDocuments([welcome]);
      setActiveDocId(welcome.id);
      setFolders([
        { id: "work", name: "Work" },
        { id: "personal", name: "Personal" }
      ]);
    }

    if (savedMedia) {
      setMedia(JSON.parse(savedMedia));
    }
  }, []);

  // Auto Save Engine
  useEffect(() => {
    if (documents.length === 0 && folders.length === 0) return;
    setSaveState('saving');
    const timer = setTimeout(() => {
      localStorage.setItem("nexup-workspace-v6", JSON.stringify({ documents, folders }));
      localStorage.setItem("nexup-media-v6", JSON.stringify(media));
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setSaveState('saved');
    }, 800);
    return () => clearTimeout(timer);
  }, [documents, folders, media]);

  // Handle Initial Document Content Injection (NO RE-RENDERS)
  useEffect(() => {
    if (editorRef.current && activeDocument) {
      if (editorRef.current.innerHTML !== activeDocument.content) {
        editorRef.current.innerHTML = activeDocument.content;
      }
    }
  }, [activeDocId]); // ONLY run when switching documents

  // Global Search Hotkey
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setGlobalSearchOpen(true);
        setGlobalSearchQuery("");
      }
      if (e.key === "Escape" && globalSearchOpen) setGlobalSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [globalSearchOpen]);

  // Quick Actions (Hotkeys)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === "n") {
          e.preventDefault();
          createDocument(activeFolderId || undefined);
        }
        if (e.key.toLowerCase() === "b") {
          e.preventDefault();
          execCommand("bold");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeFolderId]);

  const highlightText = (html: string, term: string): string => {
    if (!term) return html;
    const regex = new RegExp(`(${term})`, "gi");
    return html.replace(regex, `<mark class="bg-green-200 text-green-900 px-1 rounded">$1</mark>`);
  };

  // Filtered Documents
  const visibleDocs = useMemo(() => {
    let docs = documents.filter(doc => {
      // Safely handle folder activation state
      const folderMatch = activeFolderId === null ? true : doc.folderId === activeFolderId;
      const tagMatch = !activeTag || doc.tags?.includes(activeTag);
      return folderMatch && tagMatch;
    });

    const term = search.toLowerCase();
    if (term) {
      docs = docs.filter(doc =>
        doc.title.toLowerCase().includes(term) ||
        doc.content.toLowerCase().includes(term) ||
        doc.tags?.some(t => t.toLowerCase().includes(term))
      );
    }

    return docs.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [documents, activeFolderId, activeTag, search]);

  // Global Search Results
  const globalSearchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];
    const term = globalSearchQuery.toLowerCase();
    return documents
      .filter(doc =>
        doc.title.toLowerCase().includes(term) ||
        doc.content.toLowerCase().includes(term) ||
        doc.tags?.some(t => t.toLowerCase().includes(term))
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 8);
  }, [documents, globalSearchQuery]);

  // Filtered Media
  const filteredMedia = useMemo(() => {
    let items = media;
    if (activeFolderId) {
      items = items.filter(m => m.folderId === activeFolderId);
    }
    if (search) {
      const term = search.toLowerCase();
      items = items.filter(m =>
        m.name?.toLowerCase().includes(term) ||
        m.type.includes(term)
      );
    }
    return items;
  }, [media, activeFolderId, search]);

  // Add Media
  const addMedia = (file: File) => {
    if (!activeFolderId) {
      setMediaError("Select a folder first");
      setTimeout(() => setMediaError(""), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newMedia: Media = {
        id: crypto.randomUUID(),
        type: file.type.startsWith("video") ? "video" : "image",
        url: reader.result as string,
        name: file.name,
        folderId: activeFolderId,
        createdAt: Date.now()
      };

      setMedia(prev => [newMedia, ...prev]);

      if (activeDocId) {
        insertMedia(newMedia);
      }
    };
    reader.readAsDataURL(file);
  };

  const insertMedia = (mediaItem: Media) => {
    if (!activeDocId || !editorRef.current) return;

    const html = mediaItem.type === "image"
      ? `<img src="${mediaItem.url}" class="rounded-2xl my-6 max-w-full shadow-sm border border-gray-200" alt="${mediaItem.name || 'image'}" />`
      : `<video src="${mediaItem.url}" controls class="rounded-2xl my-6 max-w-full shadow-sm border border-gray-200"></video>`;

    execCommand("insertHTML", html);

    setDocuments(prev => prev.map(doc =>
      doc.id === activeDocId
        ? { ...doc, mediaIds: [...(doc.mediaIds || []), mediaItem.id] }
        : doc
    ));
  };

  const deleteMedia = (id: string) => {
    if (!confirm("Delete this media permanently?")) return;
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const createFolder = () => {
    const name = prompt("Folder name:");
    if (!name) return;
    const newFolder: Folder = { id: crypto.randomUUID(), name };
    setFolders([...folders, newFolder]);
  };

  const createDocument = (folderId?: string) => {
    const newDoc: Document = {
      id: crypto.randomUUID(),
      title: "Untitled Document",
      content: "<p>Start writing here...</p>",
      folderId,
      tags: [],
      mediaIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: []
    };
    setDocuments(prev => [newDoc, ...prev]); // Stable identity
    setActiveDocId(newDoc.id);
    setView("editor");
    setIsSidebarOpen(false);
  };

  const addTag = (docId: string, tagName: string) => {
    const cleanTag = tagName.trim().toLowerCase();
    if (!cleanTag) return;
    setDocuments(prev => prev.map(doc =>
      doc.id === docId
        ? { ...doc, tags: [...(doc.tags || []).filter(t => t !== cleanTag), cleanTag], updatedAt: Date.now() }
        : doc
    ));
  };

  const removeTag = (docId: string, tagName: string) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === docId ? { ...doc, tags: doc.tags?.filter(t => t !== tagName), updatedAt: Date.now() } : doc
    ));
  };

  const togglePin = (id: string) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === id ? { ...doc, pinned: !doc.pinned, updatedAt: Date.now() } : doc
    ));
  };

  const updateDocumentTitle = (id: string, title: string) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === id ? { ...doc, title, updatedAt: Date.now() } : doc
    ));
  };

  const updateDocumentContent = (id: string, content: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id !== id) return doc;
      const shouldAutoTitle = doc.title === "Untitled Document" || doc.title.startsWith("Untitled");
      
      const now = Date.now();
      let newHistoryList = doc.history || [];

      // Throttle history saves to 5 seconds
      if (now - lastHistorySave.current > 5000) {
        lastHistorySave.current = now;
        const newHistory: HistoryEntry = { content, timestamp: now, title: doc.title };
        newHistoryList = [...newHistoryList, newHistory].slice(-20);
      }

      return {
        ...doc,
        content,
        title: shouldAutoTitle ? extractTitle(content) : doc.title,
        updatedAt: now,
        history: newHistoryList
      };
    }));
  };

  const restoreVersion = (docId: string, historyEntry: HistoryEntry) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === docId ? { ...doc, content: historyEntry.content, updatedAt: Date.now() } : doc
    ));
    if (editorRef.current) {
      editorRef.current.innerHTML = historyEntry.content;
    }
    setView("editor");
  };

  const deleteDocument = (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setDocuments(prev => {
      const updated = prev.filter(doc => doc.id !== id);
      if (activeDocId === id) {
        setActiveDocId(updated[0]?.id || null);
      }
      return updated;
    });
  };

  const extractTitle = (html: string): string => {
    const text = html.replace(/<[^>]+>/g, "").trim();
    return text.split("\n")[0].slice(0, 60) || "Untitled Document";
  };

  const checkFormat = () => {
    if (formatTimeout.current) clearTimeout(formatTimeout.current);

    formatTimeout.current = setTimeout(() => {
      const formats = [];
      if (document.queryCommandState('bold')) formats.push('bold');
      if (document.queryCommandState('italic')) formats.push('italic');
      if (document.queryCommandState('underline')) formats.push('underline');
      setActiveFormats(formats);
    }, 100);
  };

  // Stable ExecCommand
  const execCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    editorRef.current.focus();

    setTimeout(() => {
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand(command, false, value);
      checkFormat();
      if (activeDocId) updateDocumentContent(activeDocId, editorRef.current!.innerHTML);
    }, 0);
  };

  // Safe Input Handler (No loops)
  const handleInput = () => {
    if (!editorRef.current || !activeDocId) return;

    const newContent = editorRef.current.innerHTML;
    if (newContent === activeDocument?.content) return; // Prevent unnecessary updates

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(() => {
      updateDocumentContent(activeDocId, newContent);
    }, 500);
  };

  const insertCheckbox = () => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    editorRef.current.focus();

    setTimeout(() => {
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("insertHTML", false,
        `<div class="task-item flex items-center gap-3 my-3"><input type="checkbox" class="w-5 h-5 accent-green-500 cursor-pointer" /> <span contenteditable="true" class="task-text">New task</span></div>`
      );
      if (activeDocId) updateDocumentContent(activeDocId, editorRef.current!.innerHTML);
    }, 0);
  };

  const insertRadio = () => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    editorRef.current.focus();

    setTimeout(() => {
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("insertHTML", false,
        `<div class="flex items-center gap-3 my-2"><input type="radio" name="radio-group" class="w-5 h-5 accent-green-500 cursor-pointer" /> <span contenteditable="true">Option</span></div>`
      );
      if (activeDocId) updateDocumentContent(activeDocId, editorRef.current!.innerHTML);
    }, 0);
  };

  const insertHeading = (level: number) => {
    if (!editorRef.current || level === 0) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    editorRef.current.focus();

    setTimeout(() => {
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("insertHTML", false, `<h${level} class="font-bold my-4 text-gray-800">Heading ${level}</h${level}>`);
      if (activeDocId) updateDocumentContent(activeDocId, editorRef.current!.innerHTML);
    }, 0);
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    checkFormat();
    const target = e.target as HTMLInputElement;
    if (target.type === "checkbox") {
      const taskItem = target.closest(".task-item");
      const taskText = taskItem?.querySelector(".task-text") as HTMLElement;
      if (taskText) {
        target.checked
          ? taskText.classList.add("line-through", "text-gray-400")
          : taskText.classList.remove("line-through", "text-gray-400");
      }
      if (activeDocId && editorRef.current) {
        updateDocumentContent(activeDocId, editorRef.current.innerHTML);
      }
    }
  };

  const words = activeDocument
    ? activeDocument.content.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length
    : 0;

  const readTime = Math.ceil(words / 200);

  return (
    <div className="min-h-screen bg-white text-gray-700 flex flex-col">
      <Navbar 
  meta={state.meta} 
  setMonthYear={setMonthYear} 
  exportData={() => {}} 
  importData={() => {}} 
/>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Sidebar Overlay */}
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className={`md:hidden fixed inset-0 bg-gray-900/50 z-40 transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} 
        />

        {/* Sidebar */}
        <aside className={`
          absolute md:relative inset-y-0 left-0 z-50 h-full w-72 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto shrink-0
          transform transition-transform duration-300 ease-in-out md:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-bold text-2xl tracking-tight text-gray-800">NexUp</h1>
              <button onClick={createFolder} className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors">+ Folder</button>
            </div>

            <div className="relative mb-6">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search docs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 transition-colors shadow-sm"
              />
            </div>

            {/* Folders */}
            <div className="mb-8">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 px-2">Folders</div>
              <div onClick={() => { setActiveFolderId(null); setActiveTag(null); setIsSidebarOpen(false); }}
                className={`px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 transition-colors relative overflow-hidden ${!activeFolderId && !activeTag ? 'bg-green-50 border border-green-200 text-green-700' : 'hover:bg-gray-100 text-gray-600 border border-transparent'}`}>
                {!activeFolderId && !activeTag && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />}
                <FolderOpen size={16} className={!activeFolderId && !activeTag ? "text-green-600" : "text-gray-400"} /> 
                <span className="font-medium text-sm">All Documents</span>
              </div>
              {folders.map(folder => {
                const count = mediaCounts[folder.id] || 0;
                const isActive = activeFolderId === folder.id;
                return (
                  <div
                    key={folder.id}
                    onClick={() => { setActiveFolderId(folder.id); setActiveTag(null); setIsSidebarOpen(false); }}
                    className={`px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 mt-1 transition-colors relative overflow-hidden ${isActive ? 'bg-green-50 border border-green-200 text-green-700' : 'hover:bg-gray-100 text-gray-600 border border-transparent'}`}
                  >
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />}
                    <FolderOpen size={16} className={isActive ? "text-green-600" : "text-gray-400"} />
                    <span className="font-medium text-sm">{folder.name}</span>
                    <span className={`ml-auto text-xs font-semibold ${isActive ? 'text-green-500' : 'text-gray-400'}`}>({count})</span>
                  </div>
                );
              })}
            </div>

            {/* Tags */}
            <div className="mb-8">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 px-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(documents.flatMap(d => d.tags || []))).map(tag => {
                  const isActive = activeTag === tag;
                  return (
                    <div
                      key={tag}
                      onClick={() => { setActiveTag(tag); setActiveFolderId(null); setIsSidebarOpen(false); }}
                      className={`px-3 py-1.5 text-xs rounded-md cursor-pointer transition-colors flex items-center gap-1 font-semibold ${isActive ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      <Tag size={12} /> #{tag}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents List */}
            <div className="flex justify-between items-center mb-3 px-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Documents</span>
              <button onClick={() => createDocument(activeFolderId || undefined)} className="text-green-600 hover:text-green-700 transition-colors">
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-1">
              {visibleDocs.map(doc => {
                const isActive = activeDocId === doc.id;
                return (
                  <div key={doc.id} onClick={() => { setActiveDocId(doc.id); setIsSidebarOpen(false); }}
                    className={`group px-4 py-3 rounded-xl cursor-pointer flex items-center gap-3 transition-colors relative overflow-hidden ${isActive ? "bg-green-50 border border-green-200 text-green-700 shadow-md scale-[1.01]" : "hover:bg-gray-100 border border-transparent text-gray-600"}`}>
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />}
                    <FileText size={16} className={isActive ? "text-green-600 shrink-0" : "text-gray-400 shrink-0"} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{doc.title}</div>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {doc.tags.slice(0, 2).map(tag => (
                            <span key={tag} className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded truncate max-w-[80px] ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); togglePin(doc.id); }} className={`shrink-0 ${doc.pinned ? 'text-green-500' : 'text-gray-300 hover:text-green-600'}`}>
                      <Pin size={14} className={doc.pinned ? "fill-current" : ""} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }} className="text-gray-400 hover:text-red-500 shrink-0 p-1 md:flex hidden transition-colors" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
              {visibleDocs.length === 0 && (
                <div className="px-4 py-8 text-center text-sm font-medium text-gray-400">
                  No documents in this folder.<br/>Create one to get started.
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col bg-white">
          <div className="w-full max-w-5xl mx-auto p-4 md:p-8 flex-1">
            
            {/* Mobile Header & View Tabs */}
            <div className="flex items-center border-b border-gray-200 mb-6 md:mb-8">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg mr-2 transition-colors">
                <Menu size={20} />
              </button>
              
              <div className="flex overflow-x-auto no-scrollbar w-full [&::-webkit-scrollbar]:hidden">
                {(["editor", "analytics", "history", "media"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 md:px-6 py-3 text-xs md:text-sm font-semibold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${view === v ? "border-green-500 text-green-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                  >
                    {v === "editor" && "Editor"}
                    {v === "analytics" && "Analytics"}
                    {v === "history" && "History"}
                    {v === "media" && (
                      <>
                        <FolderOpen size={16} /> Media
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Action Bar */}
            {view === "editor" && (
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => createDocument(activeFolderId || undefined)} className="text-xs font-semibold flex items-center gap-1.5 text-gray-500 hover:text-green-600 bg-gray-50 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-green-200 transition-colors shadow-sm">
                  <Plus size={14}/> New Doc
                </button>
                <button onClick={() => setView("media")} className="text-xs font-semibold flex items-center gap-1.5 text-gray-500 hover:text-green-600 bg-gray-50 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-green-200 transition-colors shadow-sm">
                  <ImageIcon size={14}/> Upload
                </button>
                <button onClick={() => document.getElementById('tag-input')?.focus()} className="text-xs font-semibold flex items-center gap-1.5 text-gray-500 hover:text-green-600 bg-gray-50 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-green-200 transition-colors shadow-sm">
                  <Tag size={14}/> Tag
                </button>
              </div>
            )}

            {/* EDITOR VIEW */}
            {view === "editor" && activeDocument ? (
              <div className="space-y-6">
                
                {/* Title & Tags */}
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <input
                    type="text"
                    value={activeDocument.title}
                    onChange={(e) => updateDocumentTitle(activeDocId!, e.target.value)}
                    className="flex-1 text-3xl md:text-4xl font-bold tracking-tight bg-transparent outline-none border-b border-gray-200 pb-3 text-gray-800 focus:border-green-400 transition-colors"
                    placeholder="Document Title"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    {activeDocument.tags?.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold rounded-md flex items-center gap-1">
                        #{tag}
                        <button onClick={() => removeTag(activeDocument.id, tag)} className="text-gray-400 hover:text-red-500 transition-colors">×</button>
                      </span>
                    ))}
                    <input
                      id="tag-input"
                      type="text"
                      placeholder="+ tag"
                      className="text-xs px-3 py-1.5 bg-transparent border border-dashed border-gray-300 rounded-md w-24 focus:outline-none focus:border-green-400 focus:bg-green-50 transition-colors font-medium"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addTag(activeDocument.id, e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap gap-1 md:gap-2 bg-white border border-gray-200 rounded-xl p-2 shadow-sm sticky top-0 z-10">
                  <ToolbarButton isActive={activeFormats.includes('bold')} onClick={() => execCommand("bold")} title="Bold"><Bold size={16} /></ToolbarButton>
                  <ToolbarButton isActive={activeFormats.includes('italic')} onClick={() => execCommand("italic")} title="Italic"><Italic size={16} /></ToolbarButton>
                  <ToolbarButton isActive={activeFormats.includes('underline')} onClick={() => execCommand("underline")} title="Underline"><Underline size={16} /></ToolbarButton>
                  
                  <div className="w-px h-6 bg-gray-200 mx-1 self-center" />
                  
                  <ToolbarButton onClick={() => execCommand("undo")} title="Undo"><Undo size={16} /></ToolbarButton>
                  <ToolbarButton onClick={() => execCommand("redo")} title="Redo"><Redo size={16} /></ToolbarButton>
                  
                  <div className="w-px h-6 bg-gray-200 mx-1 self-center" />
                  
                  <select onChange={(e) => insertHeading(Number(e.target.value))} className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 outline-none hover:border-gray-300 cursor-pointer focus:border-green-400">
                    <option value="0">Normal</option>
                    <option value="1">H1</option>
                    <option value="2">H2</option>
                    <option value="3">H3</option>
                  </select>

                  <ToolbarButton onClick={() => document.getElementById("media-upload")?.click()} title="Upload Media"><ImageIcon size={16} /></ToolbarButton>
                  <ToolbarButton onClick={insertCheckbox} title="Task"><CheckSquare size={16} /></ToolbarButton>
                  <ToolbarButton onClick={insertRadio} title="Radio"><Circle size={16} /></ToolbarButton>
                </div>

                {/* Editor Content Area */}
                <div className="relative">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onClick={handleEditorClick}
                    onKeyUp={checkFormat}
                    onMouseUp={checkFormat}
                    className="min-h-[400px] md:min-h-[500px] p-6 md:p-8 bg-white border border-gray-200 rounded-2xl text-gray-700 text-base leading-relaxed outline-none focus:border-green-400 focus:ring-4 ring-green-500/10 shadow-sm transition-all prose max-w-none"
                  />
                </div>

                {/* Footer Stats */}
                <div className="text-xs text-gray-400 font-semibold flex flex-wrap justify-between items-center px-2 pb-6">
                  <span>{words} words • {readTime} min read</span>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline">Edited {timeAgo(activeDocument.updatedAt)}</span>
                    <span className="sm:hidden text-gray-300">|</span>
                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${saveState === 'saving' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                      {saveState === 'saving' ? <Zap size={12} className="animate-pulse" /> : <CheckCircle2 size={12} />}
                      {saveState === 'saving' ? 'Saving...' : `Saved at ${lastSavedTime || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                    </span>
                  </div>
                </div>
              </div>
            ) : view === "editor" ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-gray-200 rounded-2xl">
                 <FileText size={48} className="text-gray-300 mb-4" />
                 <p className="text-gray-500 font-semibold">No document selected</p>
                 <button onClick={() => createDocument(activeFolderId || undefined)} className="mt-4 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg hover:bg-green-600 transition-colors shadow-sm">
                   Create New Document
                 </button>
               </div>
            ) : null}

            {/* MEDIA LIBRARY VIEW */}
            {view === "media" && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                      <FolderOpen size={24} className="text-green-500" /> Media Library
                    </h2>
                    <div className="text-xs font-medium text-gray-500 mt-2 flex items-center gap-2 bg-gray-50 w-fit px-3 py-1.5 rounded-md border border-gray-200">
                      📁 Target Folder: <span className="font-bold text-gray-700">{activeFolderId ? folders.find(f => f.id === activeFolderId)?.name : "All Media"}</span>
                    </div>
                    {mediaError && <p className="text-red-500 text-xs mt-2 font-bold flex items-center gap-1"><AlertTriangle size={12}/> {mediaError}</p>}
                  </div>
                  <button
                    onClick={() => document.getElementById("media-upload")?.click()}
                    className="w-full md:w-auto px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition-colors shadow-sm"
                  >
                    <Upload size={18} /> Upload File
                  </button>
                </div>

                <input
                  id="media-upload"
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) addMedia(file);
                    e.target.value = "";
                  }}
                />

                {filteredMedia.length === 0 ? (
                  <div className="text-center py-16 md:py-20 border-2 border-dashed border-gray-200 rounded-2xl px-4">
                    <ImageIcon size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-bold text-gray-500 mb-1">No media found</p>
                    <p className="text-xs text-gray-400 font-medium">
                      {activeFolderId
                        ? "Upload images or videos to this folder."
                        : "Select a folder from the sidebar to start uploading."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredMedia.map(item => (
                      <div key={item.id} className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-green-300 transition-all">
                        <div className="aspect-video bg-gray-50 flex items-center justify-center overflow-hidden">
                          {item.type === "image" ? (
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <video src={item.url} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-3 border-t border-gray-100">
                          <div className="text-xs font-bold text-gray-700 truncate">{item.name || `${item.type} file`}</div>
                          <div className="text-[10px] font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Quick Actions Overlay */}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => insertMedia(item)}
                            className="bg-white/90 backdrop-blur text-green-600 p-2 rounded-lg shadow-sm hover:bg-green-50 border border-gray-200 transition-colors"
                            title="Insert into active document"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => deleteMedia(item.id)}
                            className="bg-white/90 backdrop-blur text-red-500 p-2 rounded-lg shadow-sm hover:bg-red-50 border border-gray-200 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ANALYTICS VIEW */}
            {view === "analytics" && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-10 shadow-sm">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-gray-800">
                  <BarChart3 size={24} className="text-green-500" /> Workspace Analytics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Documents</h3>
                    <p className="text-4xl font-black text-gray-800">{documents.length}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Media</h3>
                    <p className="text-4xl font-black text-gray-800">{media.length}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm">
                    <Activity size={32} className="text-green-500 mb-2" />
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Insights Engine Active</p>
                  </div>
                </div>
              </div>
            )}

            {/* HISTORY VIEW */}
            {view === "history" && activeDocument && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-10 shadow-sm">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-gray-800">
                  <Clock size={24} className="text-green-500" /> Version History
                </h2>
                <p className="text-xs text-gray-500 font-semibold mb-8 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg w-fit">
                  Recent snapshots • Click to restore
                </p>
                <div className="space-y-4">
                  {activeDocument.history && activeDocument.history.length > 0 ? (
                    activeDocument.history.slice().reverse().map((entry, index) => (
                      <div
                        key={index}
                        className="p-5 bg-white border border-gray-200 rounded-xl hover:border-green-400 hover:shadow-md transition-all flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 group"
                      >
                        <div>
                          <div className="font-bold text-gray-800 text-sm">
                            {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            Version {activeDocument.history!.length - index}
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (confirm("Restore this version? Unsaved changes will be lost.")) {
                              restoreVersion(activeDocument.id, entry);
                            }
                          }}
                          className="text-xs font-bold px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-green-100 w-full sm:w-auto"
                        >
                          Restore Backup
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                      <p className="font-semibold">No history recorded yet.</p>
                      <p className="text-xs mt-1">Auto-saves will appear here as you edit.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Global Search Panel Modal */}
      {globalSearchOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-start justify-center pt-0 md:pt-24 z-[100] px-0 md:px-4 transition-all">
          <div className="bg-white w-full h-full md:h-auto md:max-w-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
            <div className="p-4 md:p-5 border-b border-gray-100 flex items-center gap-3 bg-white">
              <Search size={20} className="text-green-500 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search documents, text, tags..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="flex-1 outline-none text-base font-semibold placeholder:text-gray-300 text-gray-800"
              />
              <button onClick={() => setGlobalSearchOpen(false)} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 md:max-h-[60vh] overflow-y-auto p-2 bg-gray-50">
              {globalSearchResults.length > 0 ? (
                globalSearchResults.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setActiveDocId(doc.id);
                      setView("editor");
                      setGlobalSearchOpen(false);
                      setSearch("");
                    }}
                    className="p-4 hover:bg-white hover:shadow-sm rounded-xl cursor-pointer flex gap-4 items-start transition-all border border-transparent hover:border-gray-200"
                  >
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg shrink-0 border border-green-100">
                       <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-gray-800 text-sm truncate">{doc.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed font-medium"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(
                            doc.content.replace(/<[^>]+>/g, "").slice(0, 150) + "...",
                            globalSearchQuery
                          )
                        }}
                      />
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {doc.tags.map(tag => (
                            <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-500 rounded">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : globalSearchQuery ? (
                <div className="text-center py-16 text-gray-500 flex flex-col items-center">
                  <Search size={28} className="text-gray-300 mb-3" />
                  <span className="font-semibold text-sm">No matches found for "{globalSearchQuery}"</span>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400 text-xs">
                  <span className="font-bold text-gray-500 mb-1 block text-sm">Quick Search Mode</span>
                  Find anything across your workspace instantly.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Refined Sub-component for Toolbar
function ToolbarButton({ children, onClick, title, isActive }: { children: React.ReactNode; onClick: () => void; title?: string; isActive?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 md:p-2 rounded-lg flex items-center justify-center transition-colors font-medium border ${
        isActive 
          ? "bg-green-50 text-green-600 border-green-200 shadow-sm" 
          : "bg-transparent text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}