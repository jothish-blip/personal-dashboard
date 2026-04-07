"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Document, Folder, Media, View, HistoryEntry } from "./types";
import { useNotificationSystem } from "@/notifications/useNotificationSystem";
// ✅ FIXED: Imported handleGlobalState to replace the removed inactivity function
import { handleWorkspaceAction, handleGlobalState } from "@/notifications/nexNotificationBrain";

// 🔥 HELPER: Persistent Behavioral Locks (Cross-tab anti-spam)
const acquireLock = (lockKey: string, cooldownMs: number): boolean => {
  if (typeof window === "undefined") return false;
  const last = Number(localStorage.getItem(lockKey) || 0);
  const now = Date.now();
  if (now - last > cooldownMs) {
    localStorage.setItem(lockKey, now.toString());
    return true;
  }
  return false;
};

export function useWorkspaceSystem() {
  const { addNotification } = useNotificationSystem();

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
  const firstLoadDone = useRef(false);

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('nextask_workspace_wip_seen');
    if (!hasSeenPopup) {
      setShowWipPopup(true);
      sessionStorage.setItem('nextask_workspace_wip_seen', 'true');
    }
  }, []);

  // --- INITIAL LOAD & BEHAVIORAL SCANS ---
  useEffect(() => {
    const savedWorkspace = localStorage.getItem("nextask-workspace-v6");
    const savedMedia = localStorage.getItem("nextask-media-v6");

    let loadedDocs: Document[] = [];
    let loadedFolders: Folder[] = [];

    if (savedWorkspace) {
      const data = JSON.parse(savedWorkspace);
      loadedDocs = data.documents || [];
      loadedFolders = data.folders || [];
      setDocuments(loadedDocs);
      setFolders(loadedFolders);
      if (loadedDocs.length && !activeDocId) setActiveDocId(loadedDocs[0].id);
    } else {
      const welcome: Document = {
        id: "welcome-doc", title: "Welcome to Nextask Workspace",
        content: "<p>This is your personal workspace with folder-based media.</p>",
        tags: ["welcome"], createdAt: Date.now(), updatedAt: Date.now(), history: [], mediaIds: []
      };
      loadedDocs = [welcome];
      setDocuments(loadedDocs);
      setActiveDocId(welcome.id);
      setFolders([{ id: "work", name: "Work" }, { id: "personal", name: "Personal" }]);
    }

    if (savedMedia) setMedia(JSON.parse(savedMedia));

    setTimeout(() => { firstLoadDone.current = true; }, 1000);

    // 🔥 BEHAVIORAL BOOT SCANS
    if (acquireLock('workspace_behavior_scanned', 12 * 60 * 60 * 1000)) { 
      if (loadedDocs.length === 0) {
        setTimeout(() => addNotification('mini', 'Workspace Empty', 'Start by creating your first document.', 'high', '/mini-nisc'), 2000);
      }
      
      const untitledCount = loadedDocs.filter(d => d.title.startsWith("Untitled")).length;
      if (untitledCount > 4) {
        setTimeout(() => addNotification('mini', 'Organize Workspace 📂', `You have ${untitledCount} untitled documents. Name them for clarity.`, 'medium', '/mini-nisc'), 3000);
      }

      const unorganizedCount = loadedDocs.filter(d => !d.folderId).length;
      if (unorganizedCount > 10 && loadedFolders.length > 0) {
        setTimeout(() => addNotification('mini', 'Structure Needed 🧱', `You have ${unorganizedCount} unassigned documents.`, 'low', '/mini-nisc'), 5000);
      }

      if (loadedDocs.length > 50) {
        setTimeout(() => addNotification('mini', 'Workspace Heavy 🏋️', `You have ${loadedDocs.length} documents. Consider organizing.`, 'medium', '/mini-nisc'), 7000);
      }
    }
  }, []);

  // --- AUTO-SAVE ENGINE ---
  useEffect(() => {
    if (!firstLoadDone.current) return;
    if (documents.length === 0 && folders.length === 0) return;
    setSaveState('saving');
    
    const timer = setTimeout(() => {
      localStorage.setItem("nextask-workspace-v6", JSON.stringify({ documents, folders }));
      localStorage.setItem("nextask-media-v6", JSON.stringify(media));
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setSaveState('saved');

      handleWorkspaceAction('save');

      if (acquireLock('workspace_autosave_notified', 30 * 60 * 1000)) {
        addNotification('mini', 'Saved', 'All workspace changes synced successfully.', 'low', '/mini-nisc');
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [documents, folders, media, addNotification]);

  // --- IDLE ACTIVITY TRACKER ---
  useEffect(() => {
    const idleTimer = setInterval(() => {
      const lastActiveStr = localStorage.getItem("last_activity");
      if (!lastActiveStr) return;
      const diff = Date.now() - Number(lastActiveStr);
      
      // ✅ Now uses the consolidated handleGlobalState to check for inactivity
      if (diff > 3 * 60 * 60 * 1000 && diff < 3.5 * 60 * 60 * 1000) {
        handleGlobalState(documents);

        if (acquireLock('workspace_idle_notified', 6 * 60 * 60 * 1000)) {
          addNotification('mini', 'Workspace Idle 🧠', 'Capture your thoughts before they fade.', 'medium', '/mini-nisc');
        }
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(idleTimer);
  }, [documents, addNotification]);

  // --- KEYBOARD SHORTCUTS ---
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

  // --- MEMOIZED DATA ---
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

  const globalSearchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];
    const term = globalSearchQuery.toLowerCase();
    const results = documents
      .filter(doc => 
        doc.title.toLowerCase().includes(term) || 
        doc.content.toLowerCase().includes(term) || 
        doc.tags?.some(t => t.toLowerCase().includes(term))
      )
      .sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8);
      
    if (results.length === 0 && globalSearchQuery.length > 3) {
      if (acquireLock('search_fail_notified', 30000)) {
        addNotification('mini', 'No Results', `Could not find "${globalSearchQuery}".`, 'low', '/mini-nisc');
      }
    }
    return results;
  }, [documents, globalSearchQuery, addNotification]);

  const filteredMedia = useMemo(() => {
    let items = media;
    if (activeFolderId) items = items.filter(m => m.folderId === activeFolderId);
    if (search) {
      const term = search.toLowerCase();
      items = items.filter(m => m.name?.toLowerCase().includes(term) || m.type.includes(term));
    }
    return items;
  }, [media, activeFolderId, search]);

  // --- ACTIONS ---
  const createFolder = () => {
    const name = prompt("Folder name:");
    if (!name) return;
    setFolders([...folders, { id: crypto.randomUUID(), name }]);
    localStorage.setItem("last_activity", Date.now().toString());
    addNotification('mini', 'Folder Created', `"${name}" initialized.`, 'low', '/mini-nisc');
  };

  const createDocument = (folderId?: string) => {
    const newDoc: Document = {
      id: crypto.randomUUID(), title: "Untitled Document", content: "<p>Start writing...</p>",
      folderId, tags: [], mediaIds: [], createdAt: Date.now(), updatedAt: Date.now(), history: []
    };
    setDocuments(prev => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    setView("editor");
    setIsSidebarOpen(false);
    localStorage.setItem("last_activity", Date.now().toString());
    handleWorkspaceAction('create');
    addNotification('mini', 'New Document', 'A blank canvas added.', 'low', '/mini-nisc');
  };

  const deleteDocument = (id: string) => {
    const targetDoc = documents.find(d => d.id === id);
    if (!confirm("Delete this document?")) return;
    setDocuments(prev => {
      const updated = prev.filter(doc => doc.id !== id);
      if (activeDocId === id) setActiveDocId(updated[0]?.id || null);
      return updated;
    });
    localStorage.setItem("last_activity", Date.now().toString());
    handleWorkspaceAction('delete', `"${targetDoc?.title}" removed.`);
    addNotification('mini', 'Document Deleted', `"${targetDoc?.title || 'Document'}" removed.`, 'medium', '/mini-nisc');
  };

  const togglePin = (id: string) => {
    const doc = documents.find(d => d.id === id);
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, pinned: !d.pinned, updatedAt: Date.now() } : d));
    localStorage.setItem("last_activity", Date.now().toString());
    if (doc && !doc.pinned) {
      addNotification('mini', 'Pinned', `"${doc.title}" prioritized.`, 'low', '/mini-nisc');
    }
  };

  const updateDocumentTitle = (id: string, title: string) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, title, updatedAt: Date.now() } : d));
    localStorage.setItem("last_activity", Date.now().toString());
  };

  const extractTitle = (html: string): string => {
    const text = html.replace(/<[^>]+>/g, "").trim();
    return text.split("\n")[0].slice(0, 60) || "Untitled Document";
  };

  const updateDocumentContent = useCallback((id: string, content: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id !== id) return doc;
      const shouldAutoTitle = doc.title === "Untitled Document" || doc.title.startsWith("Untitled");
      const now = Date.now();
      let newHistoryList = doc.history || [];

      if (now - lastHistorySave.current > 5000) {
        lastHistorySave.current = now;
        newHistoryList = [...newHistoryList, { content, timestamp: now, title: doc.title }].slice(-20); 
        localStorage.setItem("last_activity", Date.now().toString());
        
        if (acquireLock('workspace_progress_notified', 2 * 60 * 1000)) {
          addNotification('mini', 'Progress Saved', 'Edits recorded.', 'low', '/mini-nisc');
        }

        const editCount = newHistoryList.length;
        if (editCount === 15) { 
          handleWorkspaceAction('deepWork');
          if (acquireLock('workspace_deepwork_notified', 60 * 60 * 1000)) {
            addNotification('mini', 'Deep Work Mode 🧠', 'High flow detected.', 'low', '/mini-nisc');
          }
        }
      }

      return { 
        ...doc, 
        content, 
        title: shouldAutoTitle ? extractTitle(content) : doc.title, 
        updatedAt: now, 
        history: newHistoryList 
      };
    }));
  }, [addNotification]);

  const addTag = (docId: string, tagName: string) => {
    const cleanTag = tagName.trim().toLowerCase();
    if (!cleanTag) return;
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, tags: [...(d.tags || []).filter(t => t !== cleanTag), cleanTag], updatedAt: Date.now() } : d));
    localStorage.setItem("last_activity", Date.now().toString());
  };

  const removeTag = (docId: string, tagName: string) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, tags: d.tags?.filter(t => t !== tagName), updatedAt: Date.now() } : d));
    localStorage.setItem("last_activity", Date.now().toString());
  };

  const addMedia = (file: File, onInsert: (mediaItem: Media) => void) => {
    if (!activeFolderId) {
      setMediaError("Select a folder first");
      setTimeout(() => setMediaError(""), 3000);
      addNotification('mini', 'Upload Failed ⚠️', 'Folder required.', 'high', '/mini-nisc');
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
      if (activeDocId) onInsert(newMedia);
      localStorage.setItem("last_activity", Date.now().toString());
      addNotification('mini', 'Media Uploaded', file.name, 'low', '/mini-nisc');
    };
    reader.readAsDataURL(file);
  };

  const deleteMedia = (id: string) => {
    if (!confirm("Delete permanently?")) return;
    setMedia(prev => prev.filter(m => m.id !== id));
    localStorage.setItem("last_activity", Date.now().toString());
    addNotification('mini', 'Media Removed', 'Asset deleted.', 'medium', '/mini-nisc');
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