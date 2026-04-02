"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { useNexCore } from "@/hooks/useNexCore";
import {
  Plus, Trash2, Bold, Italic, Underline, List, CheckSquare, Circle,
  Image as ImageIcon, Undo, Redo, Pin, FileText, Search, X, Clock, Tag,
  BarChart3, Video, FolderOpen, Menu
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
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const activeDocument = documents.find(d => d.id === activeDocId);

  // Media counts per folder (for sidebar)
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
        tags: ["welcome", "tutorial"],
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

  // Auto Save
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("nexup-workspace-v6", JSON.stringify({ documents, folders }));
      localStorage.setItem("nexup-media-v6", JSON.stringify(media));
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 800);
    return () => clearTimeout(timer);
  }, [documents, folders, media]);

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

  // Quick Actions
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
    return html.replace(regex, `<mark class="bg-yellow-200 px-1 rounded">$1</mark>`);
  };

  // Filtered Documents
  const visibleDocs = useMemo(() => {
    let docs = documents.filter(doc => {
      const folderMatch = !activeFolderId || doc.folderId === activeFolderId;
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
      alert("Please select a folder before uploading media");
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
      ? `<img src="${mediaItem.url}" class="rounded-2xl my-6 max-w-full shadow-sm" alt="${mediaItem.name || 'image'}" />`
      : `<video src="${mediaItem.url}" controls class="rounded-2xl my-6 max-w-full shadow-sm"></video>`;

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
    setDocuments([newDoc, ...documents]);
    setActiveDocId(newDoc.id);
    setView("editor");
    setIsSidebarOpen(false); // Close sidebar on mobile after creation
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
      const newHistory: HistoryEntry = { content: doc.content, timestamp: Date.now(), title: doc.title };

      return {
        ...doc,
        content,
        title: shouldAutoTitle ? extractTitle(content) : doc.title,
        updatedAt: Date.now(),
        history: [...(doc.history || []), newHistory].slice(-20)
      };
    }));
  };

  const restoreVersion = (docId: string, historyEntry: HistoryEntry) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === docId ? { ...doc, content: historyEntry.content, updatedAt: Date.now() } : doc
    ));
    setView("editor");
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    if (activeDocId === id) {
      const remaining = documents.filter(d => d.id !== id);
      setActiveDocId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const extractTitle = (html: string): string => {
    const text = html.replace(/<[^>]+>/g, "").trim();
    return text.split("\n")[0].slice(0, 60) || "Untitled Document";
  };

  const execCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    if (activeDocId) updateDocumentContent(activeDocId, editorRef.current.innerHTML);
  };

  const insertCheckbox = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("insertHTML", false,
      `<div class="task-item flex items-center gap-3 my-3"><input type="checkbox" class="w-5 h-5 accent-indigo-600" /> <span contenteditable="true" class="task-text">New task</span></div>`
    );
    if (activeDocId) updateDocumentContent(activeDocId, editorRef.current.innerHTML);
  };

  const insertRadio = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("insertHTML", false,
      `<div class="flex items-center gap-3 my-2"><input type="radio" name="radio-group" class="w-5 h-5 accent-indigo-600" /> <span contenteditable="true">Option</span></div>`
    );
    if (activeDocId) updateDocumentContent(activeDocId, editorRef.current.innerHTML);
  };

  const insertHeading = (level: number) => {
    if (!editorRef.current || level === 0) return;
    editorRef.current.focus();
    document.execCommand("insertHTML", false, `<h${level} class="font-bold my-4 tracking-tight">Heading ${level}</h${level}>`);
    if (activeDocId) updateDocumentContent(activeDocId, editorRef.current.innerHTML);
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLInputElement;
    if (target.type === "checkbox") {
      const taskItem = target.closest(".task-item");
      const taskText = taskItem?.querySelector(".task-text") as HTMLElement;
      if (taskText) {
        target.checked
          ? taskText.classList.add("line-through", "text-slate-400")
          : taskText.classList.remove("line-through", "text-slate-400");
      }
      if (activeDocId && editorRef.current) {
        updateDocumentContent(activeDocId, editorRef.current.innerHTML);
      }
    }
  };

  const handleEditorBlur = () => {
    if (!editorRef.current || !activeDocId) return;
    updateDocumentContent(activeDocId, editorRef.current.innerHTML);
  };

  const words = activeDocument
    ? activeDocument.content.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length
    : 0;

  const readTime = Math.ceil(words / 200);

  return (
    <div className="min-h-screen bg-white text-slate-700 flex flex-col">
      <Navbar meta={state.meta} setMonthYear={setMonthYear} exportData={() => {}} importData={() => {}} />

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Sidebar Overlay */}
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className={`md:hidden fixed inset-0 bg-slate-900/50 z-40 transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} 
        />

        {/* Sidebar */}
        <aside className={`
          absolute md:relative inset-y-0 left-0 z-50 h-full w-72 bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto shrink-0
          transform transition-transform duration-300 ease-in-out md:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-black text-2xl tracking-tight text-slate-700">NexUp</h1>
              <button onClick={createFolder} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">+ Folder</button>
            </div>

            <input
              type="text"
              placeholder="Search documents & media..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm mb-6 focus:outline-none focus:border-slate-300"
            />

            {/* Folders + Media Count */}
            <div className="mb-8">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 px-2">Folders</div>
              <div onClick={() => { setActiveFolderId(null); setActiveTag(null); setIsSidebarOpen(false); }}
                className={`px-4 py-2.5 rounded-2xl cursor-pointer flex items-center gap-2 transition-colors ${!activeFolderId && !activeTag ? 'bg-white shadow border border-slate-200/60' : 'hover:bg-slate-200/50'}`}>
                📁 All Documents
              </div>
              {folders.map(folder => {
                const count = mediaCounts[folder.id] || 0;
                return (
                  <div
                    key={folder.id}
                    onClick={() => { setActiveFolderId(folder.id); setActiveTag(null); setIsSidebarOpen(false); }}
                    className={`px-4 py-2.5 rounded-2xl cursor-pointer flex items-center gap-2 mt-1 transition-colors ${activeFolderId === folder.id ? 'bg-white shadow border border-slate-200/60' : 'hover:bg-slate-200/50'}`}
                  >
                    📁 {folder.name}
                    <span className="ml-auto text-xs text-slate-400 font-medium">({count})</span>
                  </div>
                );
              })}
            </div>

            {/* Tags */}
            <div className="mb-8">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 px-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(documents.flatMap(d => d.tags || []))).map(tag => (
                  <div
                    key={tag}
                    onClick={() => { setActiveTag(tag); setActiveFolderId(null); setIsSidebarOpen(false); }}
                    className={`px-3 py-1.5 text-xs rounded-full cursor-pointer transition-all flex items-center gap-1 ${activeTag === tag ? 'bg-indigo-600 text-white' : 'bg-slate-200/60 hover:bg-slate-300/60 text-slate-600'}`}
                  >
                    <Tag size={12} /> #{tag}
                  </div>
                ))}
              </div>
            </div>

            {/* Documents List */}
            <div className="flex justify-between items-center mb-3 px-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Documents</span>
              <button onClick={() => createDocument(activeFolderId || undefined)} className="text-indigo-600 hover:text-indigo-700">
                <Plus size={18} />
              </button>
            </div>

            <div className="space-y-1">
              {visibleDocs.map(doc => (
                <div key={doc.id} onClick={() => { setActiveDocId(doc.id); setIsSidebarOpen(false); }}
                  className={`group px-4 py-3 rounded-2xl cursor-pointer flex items-center gap-3 transition-all ${activeDocId === doc.id ? "bg-white shadow border border-slate-200/60" : "hover:bg-slate-200/50"}`}>
                  <FileText size={18} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{doc.title}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {doc.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-200/50 rounded text-slate-500 truncate max-w-[80px]">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); togglePin(doc.id); }} className="text-amber-500 shrink-0">
                    <Pin size={16} className={doc.pinned ? "fill-current" : ""} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }} className="opacity-0 group-hover:opacity-100 text-rose-400 shrink-0 md:flex hidden">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {visibleDocs.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400">No documents found.</div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col bg-white">
          <div className="w-full max-w-5xl mx-auto p-4 md:p-10 flex-1">
            
            {/* Mobile Header & View Tabs */}
            <div className="flex items-center border-b border-slate-200 mb-6 md:mb-10">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-3 -ml-2 text-slate-600 active:bg-slate-100 rounded-xl mr-2">
                <Menu size={24} />
              </button>
              
              <div className="flex overflow-x-auto no-scrollbar scroll-smooth w-full [&::-webkit-scrollbar]:hidden">
                {(["editor", "analytics", "history", "media"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 md:px-8 py-3 md:py-4 font-bold text-xs md:text-sm uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${view === v ? "border-slate-700 text-slate-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                  >
                    {v === "editor" && "Editor"}
                    {v === "analytics" && "Analytics"}
                    {v === "history" && "History"}
                    {v === "media" && (
                      <>
                        <FolderOpen size={16} className="md:w-[18px] md:h-[18px]" /> Media
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* EDITOR VIEW */}
            {view === "editor" && activeDocument && (
              <div className="space-y-6 md:space-y-8">
                
                {/* Title & Tags */}
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <input
                    type="text"
                    value={activeDocument.title}
                    onChange={(e) => updateDocumentTitle(activeDocId!, e.target.value)}
                    className="flex-1 text-2xl md:text-4xl font-black tracking-tight bg-transparent outline-none border-b border-slate-200 pb-3 md:pb-4 text-slate-700"
                    placeholder="Document Title"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    {activeDocument.tags?.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-slate-100 border border-slate-200 text-xs rounded-full flex items-center gap-1">
                        #{tag}
                        <button onClick={() => removeTag(activeDocument.id, tag)} className="text-slate-400 hover:text-rose-500">×</button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="+ tag"
                      className="text-xs px-3 py-1.5 bg-transparent border border-dashed border-slate-300 rounded-full w-24 focus:outline-none focus:border-indigo-400"
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
                <div className="flex flex-wrap gap-1 md:gap-2 bg-white border border-slate-200 rounded-2xl p-2 md:p-3 shadow-sm sticky top-0 z-10">
                  <ToolbarButton onClick={() => execCommand("bold")} title="Bold"><Bold size={18} /></ToolbarButton>
                  <ToolbarButton onClick={() => execCommand("italic")} title="Italic"><Italic size={18} /></ToolbarButton>
                  <ToolbarButton onClick={() => execCommand("underline")} title="Underline"><Underline size={18} /></ToolbarButton>
                  
                  <div className="hidden md:block w-px h-8 bg-slate-200 mx-2 self-center" />
                  
                  <ToolbarButton onClick={() => execCommand("undo")} title="Undo"><Undo size={18} /></ToolbarButton>
                  <ToolbarButton onClick={() => execCommand("redo")} title="Redo"><Redo size={18} /></ToolbarButton>
                  
                  <div className="w-px h-6 md:h-8 bg-slate-200 mx-1 md:mx-2 self-center" />
                  
                  <select onChange={(e) => insertHeading(Number(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm outline-none focus:border-indigo-400 max-w-[100px] md:max-w-none">
                    <option value="0">Normal</option>
                    <option value="1">H1</option>
                    <option value="2">H2</option>
                    <option value="3">H3</option>
                  </select>

                  <ToolbarButton onClick={() => document.getElementById("media-upload")?.click()} title="Upload Image/Video">
                    <ImageIcon size={18} />
                  </ToolbarButton>

                  <ToolbarButton onClick={insertCheckbox} title="Task"><CheckSquare size={18} /></ToolbarButton>
                  <ToolbarButton onClick={insertRadio} title="Radio"><Circle size={18} /></ToolbarButton>
                </div>

                {/* Editor Content Area */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={handleEditorBlur}
                  onClick={handleEditorClick}
                  className="min-h-[400px] md:min-h-[560px] p-5 md:p-10 bg-white border border-slate-200 rounded-2xl md:rounded-3xl text-slate-700 text-[16px] md:text-[17px] leading-relaxed outline-none focus:border-indigo-200 shadow-sm transition-colors prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: highlightText(activeDocument.content, search) }}
                />

                {/* Footer Stats */}
                <div className="text-[10px] md:text-xs text-slate-400 font-medium flex flex-wrap justify-between items-center px-2 md:px-4 gap-2 pb-6">
                  <span>{words} words • {readTime} min read</span>
                  <span className="flex items-center gap-1.5"><Clock size={12}/> Last saved {lastSaved || "recently"}</span>
                </div>
              </div>
            )}

            {/* MEDIA LIBRARY VIEW */}
            {view === "media" && (
              <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-6 md:p-10">
                <div className="text-xs md:text-sm text-slate-400 mb-4 flex items-center gap-2 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                  📁 <span className="hidden md:inline">Current Folder:</span>
                  <span className="font-bold text-slate-700">
                    {activeFolderId ? folders.find(f => f.id === activeFolderId)?.name : "All Media"}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                    <FolderOpen size={28} className="text-indigo-500" /> Library
                  </h2>
                  <button
                    onClick={() => document.getElementById("media-upload")?.click()}
                    className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-sm"
                  >
                    <Plus size={20} /> <span className="hidden md:inline">Upload File</span><span className="md:hidden">Upload</span>
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
                  <div className="text-center py-16 md:py-24 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 px-4">
                    <ImageIcon size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-medium text-slate-500 mb-1">No media found</p>
                    <p className="text-sm">
                      {activeFolderId
                        ? "Upload images or videos to this folder."
                        : "Select a folder from the sidebar to start uploading."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredMedia.map(item => (
                      <div key={item.id} className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                          {item.type === "image" ? (
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <video src={item.url} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-4 bg-slate-50">
                          <div className="text-sm font-bold text-slate-700 truncate">{item.name || `${item.type} file`}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Quick Actions Overlay */}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => insertMedia(item)}
                            className="bg-white/90 backdrop-blur text-indigo-600 p-2 rounded-xl shadow-sm hover:bg-white"
                            title="Insert into active document"
                          >
                            <ImageIcon size={16} />
                          </button>
                          <button
                            onClick={() => deleteMedia(item.id)}
                            className="bg-white/90 backdrop-blur text-rose-500 p-2 rounded-xl shadow-sm hover:bg-white"
                            title="Delete"
                          >
                            <Trash2 size={16} />
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
              <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-6 md:p-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-8 md:mb-10 flex items-center gap-3">
                  <BarChart3 size={28} className="text-indigo-500" /> Analytics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                  <div className="bg-slate-50 border border-slate-100 p-6 md:p-8 rounded-2xl">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Total Documents</h3>
                    <p className="text-5xl md:text-6xl font-black text-slate-700">{documents.length}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-6 md:p-8 rounded-2xl">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Total Media</h3>
                    <p className="text-5xl md:text-6xl font-black text-slate-700">{media.length}</p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 p-6 md:p-8 rounded-2xl flex flex-col justify-center items-center text-center">
                    <div className="text-4xl md:text-5xl font-black text-indigo-600 mb-2">—</div>
                    <p className="text-xs font-bold text-indigo-400 uppercase">Insights Engine Offline</p>
                  </div>
                </div>
              </div>
            )}

            {/* HISTORY VIEW */}
            {view === "history" && activeDocument && (
              <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-6 md:p-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
                  <Clock size={28} className="text-indigo-500" /> Version History
                </h2>
                <p className="text-sm text-slate-500 mb-8 font-medium bg-slate-50 px-4 py-2 rounded-xl w-fit">
                  Recent snapshots • Click to restore
                </p>
                <div className="space-y-3 md:space-y-4">
                  {activeDocument.history && activeDocument.history.length > 0 ? (
                    activeDocument.history.slice().reverse().map((entry, index) => (
                      <div
                        key={index}
                        onClick={() => restoreVersion(activeDocument.id, entry)}
                        className="p-4 md:p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all group flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
                      >
                        <div>
                          <div className="font-bold text-slate-700 text-sm md:text-base">
                            {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                            Version {activeDocument.history!.length - index}
                          </div>
                        </div>
                        <button className="text-xs font-bold px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl sm:opacity-0 group-hover:opacity-100 transition-opacity w-full sm:w-auto">
                          Restore Backup
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                      No history recorded yet.
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-0 md:pt-24 z-[100] px-0 md:px-4">
          <div className="bg-white w-full h-full md:h-auto md:max-w-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center gap-3 md:gap-4 bg-white">
              <Search size={22} className="text-indigo-500 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search documents, text, tags..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="flex-1 outline-none text-base md:text-lg placeholder:text-slate-300 font-medium"
              />
              <button onClick={() => setGlobalSearchOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 md:max-h-[60vh] overflow-y-auto p-2 md:p-4 bg-slate-50/50">
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
                    className="p-4 md:p-5 hover:bg-white hover:shadow-sm rounded-2xl cursor-pointer flex gap-4 items-start transition-all border border-transparent hover:border-slate-200"
                  >
                    <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl shrink-0">
                       <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-sm md:text-base truncate">{doc.title}</div>
                      <div className="text-xs md:text-sm text-slate-500 line-clamp-2 mt-1 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(
                            doc.content.replace(/<[^>]+>/g, "").slice(0, 150) + "...",
                            globalSearchQuery
                          )
                        }}
                      />
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {doc.tags.map(tag => (
                            <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : globalSearchQuery ? (
                <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                  <Search size={32} className="text-slate-200 mb-3" />
                  <span className="font-medium">No matches found for "{globalSearchQuery}"</span>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400 text-sm">
                  <span className="font-medium text-slate-500 mb-1 block">Quick Search Mode</span>
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

// Sub-component for Toolbar
function ToolbarButton({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 md:px-3 md:py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-all active:bg-slate-200 flex items-center justify-center"
    >
      {children}
    </button>
  );
}