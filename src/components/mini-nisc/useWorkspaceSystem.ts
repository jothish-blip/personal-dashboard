import { useState, useEffect, useMemo, useRef } from "react";
import { Document, Folder, Media, View, HistoryEntry } from "./types";

export function useWorkspaceSystem() {
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
  
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWipPopup, setShowWipPopup] = useState(false);

  const activeDocument = documents.find(d => d.id === activeDocId);
  const lastHistorySave = useRef<number>(0);

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('nextask_workspace_wip_seen');
    if (!hasSeenPopup) {
      setShowWipPopup(true);
      sessionStorage.setItem('nextask_workspace_wip_seen', 'true');
    }
  }, []);

  useEffect(() => {
    const savedWorkspace = localStorage.getItem("nextask-workspace-v6");
    const savedMedia = localStorage.getItem("nextask-media-v6");

    if (savedWorkspace) {
      const data = JSON.parse(savedWorkspace);
      setDocuments(data.documents || []);
      setFolders(data.folders || []);
      if (data.documents?.length && !activeDocId) setActiveDocId(data.documents[0].id);
    } else {
      const welcome: Document = {
        id: "welcome-doc", title: "Welcome to Nextask Workspace",
        content: "<p>This is your personal workspace with folder-based media.</p>",
        tags: ["welcome"], createdAt: Date.now(), updatedAt: Date.now(), history: [], mediaIds: []
      };
      setDocuments([welcome]);
      setActiveDocId(welcome.id);
      setFolders([{ id: "work", name: "Work" }, { id: "personal", name: "Personal" }]);
    }

    if (savedMedia) setMedia(JSON.parse(savedMedia));
  }, []);

  useEffect(() => {
    if (documents.length === 0 && folders.length === 0) return;
    setSaveState('saving');
    const timer = setTimeout(() => {
      localStorage.setItem("nextask-workspace-v6", JSON.stringify({ documents, folders }));
      localStorage.setItem("nextask-media-v6", JSON.stringify(media));
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setSaveState('saved');
    }, 800);
    return () => clearTimeout(timer);
  }, [documents, folders, media]);

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === "n") {
          e.preventDefault();
          createDocument(activeFolderId || undefined);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeFolderId]);

  const mediaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    media.forEach(m => { if (m.folderId) counts[m.folderId] = (counts[m.folderId] || 0) + 1; });
    return counts;
  }, [media]);

  const visibleDocs = useMemo(() => {
    let docs = documents.filter(doc => {
      const folderMatch = activeFolderId === null ? true : doc.folderId === activeFolderId;
      const tagMatch = !activeTag || doc.tags?.includes(activeTag);
      return folderMatch && tagMatch;
    });

    const term = search.toLowerCase();
    if (term) {
      docs = docs.filter(doc => doc.title.toLowerCase().includes(term) || doc.content.toLowerCase().includes(term) || doc.tags?.some(t => t.toLowerCase().includes(term)));
    }
    return docs.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [documents, activeFolderId, activeTag, search]);

  const globalSearchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];
    const term = globalSearchQuery.toLowerCase();
    return documents
      .filter(doc => doc.title.toLowerCase().includes(term) || doc.content.toLowerCase().includes(term) || doc.tags?.some(t => t.toLowerCase().includes(term)))
      .sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8);
  }, [documents, globalSearchQuery]);

  const filteredMedia = useMemo(() => {
    let items = media;
    if (activeFolderId) items = items.filter(m => m.folderId === activeFolderId);
    if (search) {
      const term = search.toLowerCase();
      items = items.filter(m => m.name?.toLowerCase().includes(term) || m.type.includes(term));
    }
    return items;
  }, [media, activeFolderId, search]);

  const createFolder = () => {
    const name = prompt("Folder name:");
    if (!name) return;
    setFolders([...folders, { id: crypto.randomUUID(), name }]);
  };

  const createDocument = (folderId?: string) => {
    const newDoc: Document = {
      id: crypto.randomUUID(), title: "Untitled Document", content: "<p>Start writing here...</p>",
      folderId, tags: [], mediaIds: [], createdAt: Date.now(), updatedAt: Date.now(), history: []
    };
    setDocuments(prev => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    setView("editor");
    setIsSidebarOpen(false);
  };

  const deleteDocument = (id: string) => {
    if (!confirm("Delete this document?")) return;
    setDocuments(prev => {
      const updated = prev.filter(doc => doc.id !== id);
      if (activeDocId === id) setActiveDocId(updated[0]?.id || null);
      return updated;
    });
  };

  const togglePin = (id: string) => {
    setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, pinned: !doc.pinned, updatedAt: Date.now() } : doc));
  };

  const updateDocumentTitle = (id: string, title: string) => {
    setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, title, updatedAt: Date.now() } : doc));
  };

  const extractTitle = (html: string): string => {
    const text = html.replace(/<[^>]+>/g, "").trim();
    return text.split("\n")[0].slice(0, 60) || "Untitled Document";
  };

  const updateDocumentContent = (id: string, content: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id !== id) return doc;
      const shouldAutoTitle = doc.title === "Untitled Document" || doc.title.startsWith("Untitled");
      const now = Date.now();
      let newHistoryList = doc.history || [];

      if (now - lastHistorySave.current > 5000) {
        lastHistorySave.current = now;
        newHistoryList = [...newHistoryList, { content, timestamp: now, title: doc.title }].slice(-20);
      }

      return { ...doc, content, title: shouldAutoTitle ? extractTitle(content) : doc.title, updatedAt: now, history: newHistoryList };
    }));
  };

  const addTag = (docId: string, tagName: string) => {
    const cleanTag = tagName.trim().toLowerCase();
    if (!cleanTag) return;
    setDocuments(prev => prev.map(doc => doc.id === docId ? { ...doc, tags: [...(doc.tags || []).filter(t => t !== cleanTag), cleanTag], updatedAt: Date.now() } : doc));
  };

  const removeTag = (docId: string, tagName: string) => {
    setDocuments(prev => prev.map(doc => doc.id === docId ? { ...doc, tags: doc.tags?.filter(t => t !== tagName), updatedAt: Date.now() } : doc));
  };

  const addMedia = (file: File, onInsert: (mediaItem: Media) => void) => {
    if (!activeFolderId) {
      setMediaError("Select a folder first");
      setTimeout(() => setMediaError(""), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const newMedia: Media = { id: crypto.randomUUID(), type: file.type.startsWith("video") ? "video" : "image", url: reader.result as string, name: file.name, folderId: activeFolderId, createdAt: Date.now() };
      setMedia(prev => [newMedia, ...prev]);
      if (activeDocId) onInsert(newMedia);
    };
    reader.readAsDataURL(file);
  };

  const deleteMedia = (id: string) => {
    if (!confirm("Delete this media permanently?")) return;
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  return {
    documents, setDocuments, folders, media, activeDocId, setActiveDocId, activeFolderId, setActiveFolderId,
    activeTag, setActiveTag, view, setView, search, setSearch, globalSearchOpen, setGlobalSearchOpen,
    globalSearchQuery, setGlobalSearchQuery, saveState, lastSavedTime, mediaError, isSidebarOpen, setIsSidebarOpen,
    showWipPopup, setShowWipPopup, activeDocument, mediaCounts, visibleDocs, globalSearchResults, filteredMedia,
    createFolder, createDocument, deleteDocument, togglePin, updateDocumentTitle, updateDocumentContent,
    addTag, removeTag, addMedia, deleteMedia
  };
}