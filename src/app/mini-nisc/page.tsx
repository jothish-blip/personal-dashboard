"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { useNexCore } from "@/hooks/useNexCore";
import {
  Plus, Trash2, Bold, Italic, Underline, List, CheckSquare, Circle,
  Image as ImageIcon, Undo, Redo, Pin, FileText, Search, X, Clock, Tag,
  BarChart3, Video, FolderOpen
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
  folderId?: string;           // ← NEW: Media now belongs to a folder
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

  // Filtered Media (NOW FOLDER-AWARE)
  const filteredMedia = useMemo(() => {
    let items = media;

    // Filter by active folder (if one is selected)
    if (activeFolderId) {
      items = items.filter(m => m.folderId === activeFolderId);
    }

    // Search within media
    if (search) {
      const term = search.toLowerCase();
      items = items.filter(m =>
        m.name?.toLowerCase().includes(term) ||
        m.type.includes(term)
      );
    }

    return items;
  }, [media, activeFolderId, search]);

  // Add Media (FOLDER-BASED + SAFETY CHECK)
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
        folderId: activeFolderId,           // ← Assigned to current folder
        createdAt: Date.now()
      };

      setMedia(prev => [newMedia, ...prev]);

      // Auto-insert into editor
      if (activeDocId) {
        insertMedia(newMedia);
      }
    };
    reader.readAsDataURL(file);
  };

  // Reuse media from gallery
  const insertMedia = (mediaItem: Media) => {
    if (!activeDocId || !editorRef.current) return;

    const html = mediaItem.type === "image"
      ? `<img src="${mediaItem.url}" class="rounded-2xl my-6 max-w-full shadow-sm" alt="${mediaItem.name || 'image'}" />`
      : `<video src="${mediaItem.url}" controls class="rounded-2xl my-6 max-w-full shadow-sm"></video>`;

    execCommand("insertHTML", html);

    // Track usage in document
    setDocuments(prev => prev.map(doc =>
      doc.id === activeDocId
        ? { ...doc, mediaIds: [...(doc.mediaIds || []), mediaItem.id] }
        : doc
    ));
  };

  // Move media between folders
  const moveMedia = (mediaId: string, newFolderId: string) => {
    setMedia(prev => prev.map(m =>
      m.id === mediaId ? { ...m, folderId: newFolderId } : m
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto">
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
              <div onClick={() => { setActiveFolderId(null); setActiveTag(null); }}
                className={`px-4 py-2.5 rounded-2xl cursor-pointer flex items-center gap-2 ${!activeFolderId && !activeTag ? 'bg-white shadow' : 'hover:bg-white'}`}>
                📁 All Documents
              </div>
              {folders.map(folder => {
                const count = mediaCounts[folder.id] || 0;
                return (
                  <div
                    key={folder.id}
                    onClick={() => { setActiveFolderId(folder.id); setActiveTag(null); }}
                    className={`px-4 py-2.5 rounded-2xl cursor-pointer flex items-center gap-2 mt-1 ${activeFolderId === folder.id ? 'bg-white shadow' : 'hover:bg-white'}`}
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
                    onClick={() => { setActiveTag(tag); setActiveFolderId(null); }}
                    className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-all flex items-center gap-1 ${activeTag === tag ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                  >
                    <Tag size={12} /> #{tag}
                  </div>
                ))}
              </div>
            </div>

            {/* Documents List */}
            <div className="flex justify-between items-center mb-3 px-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Documents</span>
              <button onClick={() => createDocument(activeFolderId || undefined)} className="text-indigo-600">
                <Plus size={18} />
              </button>
            </div>

            <div className="space-y-1">
              {visibleDocs.map(doc => (
                <div key={doc.id} onClick={() => setActiveDocId(doc.id)}
                  className={`group px-4 py-3 rounded-2xl cursor-pointer flex items-center gap-3 transition-all ${activeDocId === doc.id ? "bg-white shadow border border-slate-200" : "hover:bg-white"}`}>
                  <FileText size={18} className="text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{doc.title}</div>
                    <div className="flex gap-1 mt-1">
                      {doc.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); togglePin(doc.id); }} className="text-amber-500">
                    <Pin size={16} className={doc.pinned ? "fill-current" : ""} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }} className="opacity-0 group-hover:opacity-100 text-rose-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex border-b border-slate-200 mb-10">
              {(["editor", "analytics", "history", "media"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-8 py-4 font-bold text-sm uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${view === v ? "border-slate-700 text-slate-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                >
                  {v === "editor" && "Editor"}
                  {v === "analytics" && "Analytics"}
                  {v === "history" && "History"}
                  {v === "media" && (
                    <>
                      <FolderOpen size={18} /> Media
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* EDITOR VIEW */}
            {view === "editor" && activeDocument && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={activeDocument.title}
                    onChange={(e) => updateDocumentTitle(activeDocId!, e.target.value)}
                    className="flex-1 text-4xl font-black tracking-tight bg-transparent outline-none border-b border-slate-200 pb-4 text-slate-700"
                  />

                  <div className="flex items-center gap-2">
                    {activeDocument.tags?.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-slate-100 text-xs rounded-full flex items-center gap-1">
                        #{tag}
                        <button onClick={() => removeTag(activeDocument.id, tag)} className="text-slate-400 hover:text-rose-500">×</button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="+ tag"
                      className="text-xs px-3 py-1 bg-transparent border border-dashed border-slate-300 rounded-full w-24 focus:outline-none focus:border-indigo-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addTag(activeDocument.id, e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <ToolbarButton onClick={() => execCommand("bold")} title="Bold"><Bold size={18} /></ToolbarButton>
                  <ToolbarButton onClick={() => execCommand("italic")} title="Italic"><Italic size={18} /></ToolbarButton>
                  <ToolbarButton onClick={() => execCommand("underline")} title="Underline"><Underline size={18} /></ToolbarButton>
                  <ToolbarButton onClick={() => execCommand("undo")} title="Undo"><Undo size={18} /></ToolbarButton>
                  <ToolbarButton onClick={() => execCommand("redo")} title="Redo"><Redo size={18} /></ToolbarButton>
                  <div className="w-px h-8 bg-slate-200 mx-3" />
                  <select onChange={(e) => insertHeading(Number(e.target.value))} className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
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

                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={handleEditorBlur}
                  onClick={handleEditorClick}
                  className="min-h-[560px] p-10 bg-white border border-slate-200 rounded-3xl text-slate-700 text-[17px] leading-relaxed outline-none focus:border-slate-300 shadow-sm prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: highlightText(activeDocument.content, search) }}
                />

                <div className="text-xs text-slate-400 flex justify-between px-3">
                  <span>{words} words • {readTime} min read</span>
                  <span>Last saved {lastSaved}</span>
                </div>
              </div>
            )}

            {/* MEDIA LIBRARY VIEW (FOLDER-BASED) */}
            {view === "media" && (
              <div className="bg-white border border-slate-200 rounded-3xl p-10">
                {/* Current Folder Indicator */}
                <div className="text-sm text-slate-400 mb-4 flex items-center gap-2">
                  📁 Current Folder:{" "}
                  <span className="font-medium text-slate-700">
                    {activeFolderId
                      ? folders.find(f => f.id === activeFolderId)?.name
                      : "All Media"}
                  </span>
                </div>

                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold flex items-center gap-3">
                    <FolderOpen size={32} /> Media Library
                  </h2>
                  <button
                    onClick={() => document.getElementById("media-upload")?.click()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition"
                  >
                    <Plus size={20} /> Upload Image or Video
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
                  <div className="text-center py-20 text-slate-400">
                    {activeFolderId
                      ? "No media in this folder yet. Upload something!"
                      : "No media yet. Select a folder and upload."}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredMedia.map(item => (
                      <div key={item.id} className="group relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
                          {item.type === "image" ? (
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <video src={item.url} className="w-full h-full object-cover" />
                          )}
                        </div>

                        <div className="p-4">
                          <div className="text-sm font-medium truncate">{item.name || `${item.type} • ${item.id.slice(0,8)}`}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => insertMedia(item)}
                            className="bg-white text-indigo-600 p-2 rounded-xl shadow hover:bg-indigo-50"
                            title="Insert into editor"
                          >
                            <ImageIcon size={18} />
                          </button>
                          <button
                            onClick={() => deleteMedia(item.id)}
                            className="bg-white text-rose-500 p-2 rounded-xl shadow hover:bg-rose-50"
                            title="Delete media"
                          >
                            <Trash2 size={18} />
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
              <div className="bg-white border border-slate-200 rounded-3xl p-10">
                <h2 className="text-3xl font-bold mb-10 flex items-center gap-3">
                  <BarChart3 size={32} /> Global Analytics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-slate-50 p-8 rounded-2xl">
                    <h3 className="font-semibold mb-6">Overall Productivity</h3>
                    <div className="text-7xl font-black text-indigo-600 mb-2">—</div>
                    <p className="text-slate-500">Media-aware analytics coming soon</p>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-2xl">
                    <h3 className="font-semibold mb-4">Total Documents</h3>
                    <p className="text-6xl font-bold text-slate-700">{documents.length}</p>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-2xl">
                    <h3 className="font-semibold mb-4">Total Media Items</h3>
                    <p className="text-6xl font-bold text-slate-700">{media.length}</p>
                  </div>
                </div>
              </div>
            )}

            {/* HISTORY VIEW */}
            {view === "history" && activeDocument && (
              <div className="bg-white border border-slate-200 rounded-3xl p-10">
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                  <Clock size={32} /> Version History
                </h2>
                <p className="text-slate-500 mb-8">Last 20 versions • Click to restore</p>
                <div className="space-y-4">
                  {activeDocument.history && activeDocument.history.length > 0 ? (
                    activeDocument.history.slice().reverse().map((entry, index) => (
                      <div
                        key={index}
                        onClick={() => restoreVersion(activeDocument.id, entry)}
                        className="p-6 border border-slate-200 rounded-2xl hover:border-indigo-300 cursor-pointer transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-slate-700">
                              {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">Version {activeDocument.history!.length - index}</div>
                          </div>
                          <button className="text-xs px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl opacity-0 group-hover:opacity-100">
                            Restore this version
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 text-slate-400">No history yet. Start editing to create versions.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Global Search Panel */}
      {globalSearchOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-24 z-50">
          <div className="bg-white w-full max-w-2xl mx-4 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex items-center gap-4">
              <Search size={24} className="text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search documents, content, or tags..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="flex-1 outline-none text-lg placeholder:text-slate-400"
              />
              <button onClick={() => setGlobalSearchOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-4">
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
                    className="px-6 py-5 hover:bg-slate-50 rounded-2xl cursor-pointer flex gap-4 items-start"
                  >
                    <FileText size={22} className="text-slate-400 mt-1" />
                    <div>
                      <div className="font-semibold text-lg">{doc.title}</div>
                      <div className="text-sm text-slate-500 line-clamp-2 mt-1"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(
                            doc.content.replace(/<[^>]+>/g, "").slice(0, 180),
                            globalSearchQuery
                          )
                        }}
                      />
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {doc.tags.map(tag => (
                            <span key={tag} className="text-xs px-3 py-1 bg-slate-100 rounded-full">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : globalSearchQuery ? (
                <div className="text-center py-20 text-slate-400">No results found</div>
              ) : (
                <div className="text-center py-20 text-slate-400">Type to search across all documents...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarButton({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="px-4 py-3 rounded-2xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all active:bg-slate-200"
    >
      {children}
    </button>
  );
}