"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Document, Folder, Media, View, HistoryEntry } from "./types";
import { useNotificationSystem } from "@/notifications/useNotificationSystem";
import { handleWorkspaceAction, handleGlobalState } from "@/notifications/nexNotificationBrain";
import { getSupabaseClient } from "@/lib/supabase"; 

// 🔥 HELPER: Persistent Behavioral Locks
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

// 🔥 HELPER: Non-blocking activity logger
const pingActivity = () => {
  if (typeof window !== "undefined") {
    const last = Number(sessionStorage.getItem("temp_activity") || 0);
    if (Date.now() - last > 5000) {
      localStorage.setItem("last_activity", Date.now().toString());
      sessionStorage.setItem("temp_activity", Date.now().toString());
    }
  }
};

export function useWorkspaceSystem() {
  const { addNotification } = useNotificationSystem();
  const supabase = getSupabaseClient();

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
  
  const dbSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- SUPABASE SYNC HELPERS ---
  const getUser = async () => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  };

  const syncDocToDB = async (doc: Document) => {
    try {
      const user = await getUser();
      if (!user || !supabase) return;
      await supabase.from('workspace_documents').upsert({
        id: doc.id,
        user_id: user.id,
        folder_id: doc.folderId || null,
        title: doc.title,
        content: doc.content,
        tags: doc.tags || [],
        pinned: doc.pinned || false,
        history: doc.history || [],
        media_ids: doc.mediaIds || [],
        updated_at: new Date(doc.updatedAt).toISOString(),
        created_at: new Date(doc.createdAt).toISOString()
      }, { onConflict: 'id' });
    } catch (e) { console.error("Doc Sync Error", e); }
  };

  const queueDocDBSync = useCallback((doc: Document) => {
    setSaveState('saving');
    if (dbSyncTimerRef.current) clearTimeout(dbSyncTimerRef.current);
    dbSyncTimerRef.current = setTimeout(() => {
      syncDocToDB(doc).then(() => {
        setSaveState('saved');
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      });
    }, 1500); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncFolderToDB = async (folder: Folder) => {
    const user = await getUser();
    if (!user || !supabase) return;
    await supabase.from('workspace_folders').upsert({ id: folder.id, user_id: user.id, name: folder.name });
  };

  const syncMediaToDB = async (mediaItem: Media) => {
    const user = await getUser();
    if (!user || !supabase) return;
    await supabase.from('workspace_media').upsert({
      id: mediaItem.id, user_id: user.id, folder_id: mediaItem.folderId || null,
      type: mediaItem.type, url: mediaItem.url, name: mediaItem.name
    });
  };

  // --- INITIAL LOAD ---
  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('nextask_workspace_wip_seen');
    if (!hasSeenPopup) {
      setShowWipPopup(true);
      sessionStorage.setItem('nextask_workspace_wip_seen', 'true');
    }

    const initWorkspace = async () => {
      const user = await getUser();
      if (!user || !supabase) return;

      const [docsRes, foldersRes, mediaRes] = await Promise.all([
        supabase.from('workspace_documents').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
        supabase.from('workspace_folders').select('*').eq('user_id', user.id),
        supabase.from('workspace_media').select('*').eq('user_id', user.id)
      ]);

      let loadedFolders: Folder[] = [];
      if (foldersRes.data && foldersRes.data.length > 0) {
        // 🔥 FIX: Explicitly typed 'f' as any
        loadedFolders = foldersRes.data.map((f: any) => ({ id: f.id, name: f.name }));
        setFolders(loadedFolders);
      } else {
        const defaultFolders = [{ id: crypto.randomUUID(), name: "Work" }, { id: crypto.randomUUID(), name: "Personal" }];
        setFolders(defaultFolders);
        defaultFolders.forEach(f => syncFolderToDB(f));
        loadedFolders = defaultFolders;
      }

      if (mediaRes.data) {
        // 🔥 FIX: Explicitly typed 'm' as any
        setMedia(mediaRes.data.map((m: any) => ({
          id: m.id, type: m.type as "image"|"video", url: m.url, name: m.name, folderId: m.folder_id, createdAt: new Date(m.created_at).getTime()
        })));
      }

      if (docsRes.data && docsRes.data.length > 0) {
        // 🔥 FIX: Explicitly typed 'd' as any
        const loadedDocs: Document[] = docsRes.data.map((d: any) => ({
          id: d.id, title: d.title, content: d.content, folderId: d.folder_id, tags: d.tags, pinned: d.pinned, history: d.history,
          mediaIds: d.media_ids, createdAt: new Date(d.created_at).getTime(), updatedAt: new Date(d.updated_at).getTime()
        }));
        setDocuments(loadedDocs);
        if (!activeDocId) setActiveDocId(loadedDocs[0].id);
      } else {
        const welcome: Document = {
          id: crypto.randomUUID(), title: "Welcome to Nextask Workspace", content: "<p>This is your personal workspace...</p>",
          folderId: null, tags: ["welcome"], pinned: true, history: [], mediaIds: [], createdAt: Date.now(), updatedAt: Date.now()
        };
        setDocuments([welcome]);
        setActiveDocId(welcome.id);
        syncDocToDB(welcome);
      }

      firstLoadDone.current = true;
    };

    initWorkspace();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- LOCAL AUTO-SAVE (Runs parallel to DB debounce) ---
  useEffect(() => {
    if (!firstLoadDone.current || documents.length === 0) return;
    const timer = setTimeout(() => {
      localStorage.setItem("nextask-workspace-v6", JSON.stringify({ documents, folders }));
      localStorage.setItem("nextask-media-v6", JSON.stringify(media));
      handleWorkspaceAction('save');
    }, 1000);
    return () => clearTimeout(timer);
  }, [documents, folders, media]);

  // --- IDLE ACTIVITY TRACKER ---
  useEffect(() => {
    const idleTimer = setInterval(() => {
      const lastActiveStr = localStorage.getItem("last_activity");
      if (!lastActiveStr) return;
      const diff = Date.now() - Number(lastActiveStr);
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
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        createDocument(activeFolderId || undefined);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSearchOpen, activeFolderId]);

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

  // --- ACTIONS ---
  const createFolder = () => {
    const name = prompt("Folder name:");
    if (!name) return;
    const newFolder = { id: crypto.randomUUID(), name };
    setFolders([...folders, newFolder]);
    syncFolderToDB(newFolder);
    pingActivity();
    addNotification('mini', 'Folder Created', `"${name}" initialized.`, 'low', '/mini-nisc');
  };

  const createDocument = (folderId?: string) => {
    const newDoc: Document = {
      id: crypto.randomUUID(), title: "Untitled Document", content: "<p>Start writing...</p>",
      folderId: folderId || null, tags: [], mediaIds: [], pinned: false, createdAt: Date.now(), updatedAt: Date.now(), history: []
    };
    setDocuments(prev => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    setView("editor");
    setIsSidebarOpen(false);
    syncDocToDB(newDoc);
    pingActivity();
    handleWorkspaceAction('create');
  };

  const deleteDocument = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    setDocuments(prev => {
      const updated = prev.filter(doc => doc.id !== id);
      if (activeDocId === id) setActiveDocId(updated[0]?.id || null);
      return updated;
    });
    if (supabase) await supabase.from('workspace_documents').delete().eq('id', id);
    pingActivity();
  };

  const togglePin = (id: string) => {
    let updatedDoc: Document | undefined;
    setDocuments(prev => prev.map(d => {
      if (d.id === id) {
        updatedDoc = { ...d, pinned: !d.pinned, updatedAt: Date.now() };
        return updatedDoc;
      }
      return d;
    }));
    if (updatedDoc) queueDocDBSync(updatedDoc);
    pingActivity();
  };

  const updateDocumentTitle = (id: string, title: string) => {
    let updatedDoc: Document | undefined;
    setDocuments(prev => prev.map(d => {
      if (d.id === id) {
        updatedDoc = { ...d, title, updatedAt: Date.now() };
        return updatedDoc;
      }
      return d;
    }));
    if (updatedDoc) queueDocDBSync(updatedDoc);
    pingActivity();
  };

  const extractTitle = (html: string): string => {
    const text = html.replace(/<[^>]+>/g, "").trim();
    return text.split("\n")[0].slice(0, 60) || "Untitled Document";
  };

  const updateDocumentContent = useCallback((id: string, content: string) => {
    let modifiedDoc: Document | undefined;

    setDocuments(prev => prev.map(doc => {
      if (doc.id !== id) return doc;
      
      const shouldAutoTitle = doc.title === "Untitled Document" || doc.title.startsWith("Untitled");
      const now = Date.now();
      let newHistoryList = doc.history || [];

      if (now - lastHistorySave.current > 5000) {
        lastHistorySave.current = now;
        newHistoryList = [...newHistoryList, { content, timestamp: now, title: doc.title }].slice(-20); 
        
        if (newHistoryList.length === 15) { 
          handleWorkspaceAction('deepWork');
        }
      }

      modifiedDoc = { 
        ...doc, 
        content, 
        title: shouldAutoTitle ? extractTitle(content) : doc.title, 
        updatedAt: now, 
        history: newHistoryList 
      };
      return modifiedDoc;
    }));

    if (modifiedDoc) queueDocDBSync(modifiedDoc);
    pingActivity();
  }, [queueDocDBSync]);

  const addTag = (docId: string, tagName: string) => {
    const cleanTag = tagName.trim().toLowerCase();
    if (!cleanTag) return;
    let updatedDoc: Document | undefined;
    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        updatedDoc = { ...d, tags: [...(d.tags || []).filter(t => t !== cleanTag), cleanTag], updatedAt: Date.now() };
        return updatedDoc;
      }
      return d;
    }));
    if (updatedDoc) queueDocDBSync(updatedDoc);
    pingActivity();
  };

  const removeTag = (docId: string, tagName: string) => {
    let updatedDoc: Document | undefined;
    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        updatedDoc = { ...d, tags: d.tags?.filter(t => t !== tagName), updatedAt: Date.now() };
        return updatedDoc;
      }
      return d;
    }));
    if (updatedDoc) queueDocDBSync(updatedDoc);
    pingActivity();
  };

  const addMedia = (file: File, onInsert: (mediaItem: Media) => void) => {
    if (!activeFolderId) {
      setMediaError("Select a folder first");
      setTimeout(() => setMediaError(""), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const newMedia: Media = { 
        id: crypto.randomUUID(), type: file.type.startsWith("video") ? "video" : "image", 
        url: reader.result as string, name: file.name, folderId: activeFolderId, createdAt: Date.now() 
      };
      setMedia(prev => [newMedia, ...prev]);
      syncMediaToDB(newMedia);
      if (activeDocId) onInsert(newMedia);
      pingActivity();
    };
    reader.readAsDataURL(file);
  };

  const deleteMedia = async (id: string) => {
    if (!confirm("Delete permanently?")) return;
    setMedia(prev => prev.filter(m => m.id !== id));
    if (supabase) await supabase.from('workspace_media').delete().eq('id', id);
    pingActivity();
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