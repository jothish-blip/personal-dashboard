"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Document, Folder, Media, View, HistoryEntry, LogEntry } from "./types";
import { useNotificationSystem } from "@/notifications/useNotificationSystem";
import { handleWorkspaceAction, handleGlobalState } from "@/notifications/nexNotificationBrain";
import { getSupabaseClient } from "@/lib/supabase"; 
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

// ==========================================
// 🔥 HELPERS
// ==========================================
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

const pingActivity = () => {
  if (typeof window !== "undefined") {
    const last = Number(sessionStorage.getItem("temp_activity") || 0);
    if (Date.now() - last > 5000) {
      localStorage.setItem("last_activity", Date.now().toString());
      sessionStorage.setItem("temp_activity", Date.now().toString());
    }
  }
};

const mapDoc = (d: any): Document => ({
  id: d.id,
  title: d.title,
  content: d.content,
  folderId: d.folder_id ?? null,
  tags: d.tags || [],
  pinned: d.pinned ?? false,
  history: d.history || [],
  logs: d.logs || [], // 🔥 Map logs from DB
  mediaIds: d.media_ids || [],
  createdAt: new Date(d.created_at).getTime(),
  updatedAt: new Date(d.updated_at).getTime(),
  deletedAt: d.deleted_at ? new Date(d.deleted_at).getTime() : undefined,
  version: d.version ?? 0 
});

const mapFolder = (f: any): Folder => ({
  id: f.id, 
  name: f.name 
});

const mapMedia = (m: any): Media => ({
  id: m.id, 
  type: m.type as "image"|"video", 
  url: m.url, 
  name: m.name, 
  folderId: m.folder_id ?? null, 
  createdAt: new Date(m.created_at).getTime()
});

const extractTitle = (html: string): string => {
  const text = html.replace(/<[^>]+>/g, "").trim();
  return text.split("\n")[0].slice(0, 60) || "Untitled Document";
};

// ==========================================
// 🚀 MAIN WORKSPACE HOOK
// ==========================================
export function useWorkspaceSystem() {
  const supabase = getSupabaseClient();

  // --- 1. AUTH & NOTIFICATIONS ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const userRef = useRef<any>(null);
  const { addNotification } = useNotificationSystem(currentUser?.id);

  // --- 2. DATA STATE ---
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [media, setMedia] = useState<Media[]>([]);

  // --- 3. UI STATE ---
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [view, setView] = useState<View>("editor");
  
  // Unified Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWipPopup, setShowWipPopup] = useState(false);

  // --- 4. REFS ---
  const lastHistorySave = useRef<number>(0);
  const firstLoadDone = useRef(false);
  const dbSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editingDocRef = useRef<string | null>(null);
  const editingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const documentsRef = useRef<Document[]>(documents);
  useEffect(() => { documentsRef.current = documents; }, [documents]);

  const activeDocument = useMemo(() => documents.find(d => d.id === activeDocId), [documents, activeDocId]);

  // --- 5. SYNC LOGIC (DB & REALTIME) ---
  const markEditing = useCallback((docId: string) => {
    editingDocRef.current = docId;
    if (editingTimeoutRef.current) clearTimeout(editingTimeoutRef.current);
    editingTimeoutRef.current = setTimeout(() => { editingDocRef.current = null; }, 5000); 
  }, []);

  const syncDocToDB = async (doc: Document) => {
    try {
      const user = userRef.current;
      if (!user || !supabase) return;
      const { error } = await supabase.from('workspace_documents').upsert({
        id: doc.id, user_id: user.id, folder_id: doc.folderId ?? null,
        title: doc.title, content: doc.content, tags: doc.tags || [],
        pinned: doc.pinned ?? false, history: doc.history || [], 
        logs: doc.logs || [], // 🔥 Sync logs to DB
        media_ids: doc.mediaIds || [],
        version: doc.version ?? 0, 
        updated_at: new Date(doc.updatedAt).toISOString(), 
        created_at: new Date(doc.createdAt).toISOString(),
        deleted_at: doc.deletedAt ? new Date(doc.deletedAt).toISOString() : null
      }, { onConflict: 'id' });
      if (error) console.error("❌ DB Upsert Error:", error.message);
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
    }, 500); 
  }, []);

  const syncFolderToDB = async (folder: Folder) => {
    if (!userRef.current || !supabase) return;
    await supabase.from('workspace_folders').upsert({ id: folder.id, user_id: userRef.current.id, name: folder.name });
  };

  const syncMediaToDB = async (mediaItem: Media) => {
    if (!userRef.current || !supabase) return;
    await supabase.from('workspace_media').upsert({
      id: mediaItem.id, user_id: userRef.current.id, folder_id: mediaItem.folderId ?? null,
      type: mediaItem.type, url: mediaItem.url, name: mediaItem.name
    });
  };

  // --- 6. ACTIONS (CRUD & LOGS) ---
  
  // 🔥 ACTION LOG HELPER
  const addLog = useCallback((docId: string, type: string, meta?: any) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id !== docId) return doc;
      const newLog = { type, timestamp: Date.now(), meta };
      const updatedDoc = {
        ...doc,
        logs: [...(doc.logs || []), newLog].slice(-50) // keep last 50
      };
      queueDocDBSync(updatedDoc);
      return updatedDoc;
    }));
  }, [queueDocDBSync]);

  const updateDocument = useCallback((id: string, updates: Partial<Document>) => {
    markEditing(id); 
    setDocuments(prev => {
      const target = prev.find(d => d.id === id);
      if (!target) return prev;
      const updatedDoc: Document = { 
        ...target, 
        ...updates, 
        updatedAt: Date.now(), 
        version: (target.version ?? 0) + 1 
      };
      queueDocDBSync(updatedDoc);
      return prev.map(d => d.id === id ? updatedDoc : d);
    });
    pingActivity();
  }, [markEditing, queueDocDBSync]);

  const createFolder = useCallback(() => {
    const name = prompt("Folder name:");
    if (!name) return;
    const newFolder = { id: crypto.randomUUID(), name };
    setFolders(prev => [...prev, newFolder]);
    syncFolderToDB(newFolder);
    pingActivity();
    addNotification('mini', 'Folder Created', `"${name}" initialized.`, 'low', '/mini-nisc');
  }, [addNotification]);

  const createDocument = useCallback((folderId?: string) => {
    const newDoc: Document = {
      id: crypto.randomUUID(), title: "Untitled Document", content: "<p>Start writing...</p>",
      folderId: folderId ?? null, tags: [], mediaIds: [], pinned: false, 
      createdAt: Date.now(), updatedAt: Date.now(), history: [], logs: [{ type: "created", timestamp: Date.now() }], version: 1 
    };
    setDocuments(prev => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    setView("editor");
    setIsSidebarOpen(false);
    syncDocToDB(newDoc);
    pingActivity();
    addNotification('mini', 'Document Created', 'New workspace document initialized.', 'low', '/mini-nisc');
  }, [addNotification]);

  const deleteDocument = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    const target = documentsRef.current.find(d => d.id === id);
    if (!target) return;

    const updatedDoc = { ...target, deletedAt: Date.now() };
    setDocuments(prev => prev.map(doc => doc.id === id ? updatedDoc : doc));
    addLog(id, "deleted"); // 🔥 Add log
    
    if (activeDocId === id) setActiveDocId(null);

    if (supabase && userRef.current) {
      await supabase.from('workspace_documents').upsert({
        ...updatedDoc,
        user_id: userRef.current.id,
        folder_id: updatedDoc.folderId ?? null,
        deleted_at: new Date(updatedDoc.deletedAt!).toISOString()
      }, { onConflict: 'id' });
    }
    pingActivity();
  };

  const togglePin = useCallback((id: string) => {
    const target = documentsRef.current.find(d => d.id === id);
    if (target) {
      updateDocument(id, { pinned: !target.pinned });
      addLog(id, !target.pinned ? "pinned" : "unpinned"); // 🔥 Add log
    }
  }, [updateDocument, addLog]);

  const updateDocumentTitle = useCallback((id: string, title: string) => {
    updateDocument(id, { title });
    addLog(id, "renamed", { title }); // 🔥 Add log
  }, [updateDocument, addLog]);

  const updateDocumentContent = useCallback((id: string, content: string) => {
    const target = documentsRef.current.find(d => d.id === id);
    if (!target) return;

    const shouldAutoTitle = target.title === "Untitled Document" || target.title.startsWith("Untitled");
    const nowMs = Date.now(); 
    let newHistoryList = target.history || [];

    if (nowMs - lastHistorySave.current > 5000) {
      lastHistorySave.current = nowMs;
      newHistoryList = [...newHistoryList, { content, timestamp: nowMs, title: target.title }].slice(-20); 
      addLog(id, "edited"); // 🔥 Add log (only trigger every 5s max to avoid spam)
      if (newHistoryList.length === 15) handleWorkspaceAction(addNotification, 'deepWork');
    }

    updateDocument(id, {
      content,
      title: shouldAutoTitle ? extractTitle(content) : target.title,
      history: newHistoryList
    });
  }, [updateDocument, addLog, addNotification]);

  const addTag = useCallback((docId: string, tagName: string) => {
    const cleanTag = tagName.trim().toLowerCase();
    if (!cleanTag) return;
    const target = documentsRef.current.find(d => d.id === docId);
    if (target) {
      updateDocument(docId, { tags: [...(target.tags || []).filter(t => t !== cleanTag), cleanTag] });
      addLog(docId, "tag_added", { tag: cleanTag }); // 🔥 Add log
    }
  }, [updateDocument, addLog]);

  const removeTag = useCallback((docId: string, tagName: string) => {
    const target = documentsRef.current.find(d => d.id === docId);
    if (target) {
      updateDocument(docId, { tags: (target.tags || []).filter(t => t !== tagName) });
      addLog(docId, "tag_removed", { tag: tagName }); // 🔥 Add log
    }
  }, [updateDocument, addLog]);

  const addMedia = useCallback((file: File, onInsert?: (mediaItem: Media) => void) => {
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
      if (activeDocId && typeof onInsert === 'function') onInsert(newMedia);
      pingActivity();
    };
    reader.readAsDataURL(file);
  }, [activeFolderId, activeDocId]);

  const deleteMedia = async (id: string) => {
    if (!confirm("Delete permanently?")) return;
    setMedia(prev => prev.filter(m => m.id !== id));
    if (supabase) await supabase.from('workspace_media').delete().eq('id', id);
    pingActivity();
  };

  // --- 7. DERIVED STATE (MEMOS) ---
  const isSearching = searchQuery.trim().length > 0;

  const mediaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    media.forEach(m => { if (m.folderId) counts[m.folderId] = (counts[m.folderId] || 0) + 1; });
    return counts;
  }, [media]);

  const unifiedSearchResults = useMemo(() => {
    if (!isSearching) return [];
    const term = searchQuery.toLowerCase().trim();
    return documents
      .filter(doc => !doc.deletedAt)
      .filter(doc => doc.title.toLowerCase().includes(term) || doc.content.toLowerCase().includes(term) || doc.tags?.some(t => t.toLowerCase().includes(term)))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [documents, searchQuery, isSearching]);

  const visibleDocs = useMemo(() => {
    const docs = documents.filter(doc => {
      if (doc.deletedAt) return false;
      const folderMatch = activeFolderId === null ? true : doc.folderId === activeFolderId;
      const tagMatch = !activeTag || doc.tags?.includes(activeTag);
      return folderMatch && tagMatch;
    });

    return docs.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt; 
    });
  }, [documents, activeFolderId, activeTag]);

  const filteredMedia = useMemo(() => {
    let items = media;
    if (activeFolderId) items = items.filter(m => m.folderId === activeFolderId);
    if (isSearching) {
      const term = searchQuery.toLowerCase().trim();
      items = items.filter(m => m.name?.toLowerCase().includes(term) || m.type.includes(term));
    }
    return items;
  }, [media, activeFolderId, searchQuery, isSearching]);

  // --- 8. EFFECTS ---
  useEffect(() => {
    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      userRef.current = session?.user ?? null;
      setCurrentUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('nextask_workspace_wip_seen');
    if (!hasSeenPopup) {
      setShowWipPopup(true);
      sessionStorage.setItem('nextask_workspace_wip_seen', 'true');
    }

    const initWorkspace = async () => {
      if (!currentUser || !supabase) return;
      const [docsRes, foldersRes, mediaRes] = await Promise.all([
        supabase.from('workspace_documents').select('*').eq('user_id', currentUser.id).order('updated_at', { ascending: false }),
        supabase.from('workspace_folders').select('*').eq('user_id', currentUser.id),
        supabase.from('workspace_media').select('*').eq('user_id', currentUser.id)
      ]);

      let loadedFolders: Folder[] = [];
      if (foldersRes.data && foldersRes.data.length > 0) {
        loadedFolders = foldersRes.data.map(mapFolder);
        setFolders(loadedFolders);
      } else {
        const defaultFolders = [{ id: crypto.randomUUID(), name: "Work" }, { id: crypto.randomUUID(), name: "Personal" }];
        setFolders(defaultFolders);
        defaultFolders.forEach(f => syncFolderToDB(f));
        loadedFolders = defaultFolders;
      }

      if (mediaRes.data) setMedia(mediaRes.data.map(mapMedia));

      if (docsRes.data && docsRes.data.length > 0) {
        const loadedDocs: Document[] = docsRes.data.map(mapDoc);
        setDocuments(loadedDocs);
        const firstActiveDoc = loadedDocs.find(d => !d.deletedAt);
        if (!activeDocId && firstActiveDoc) setActiveDocId(firstActiveDoc.id);
      } else {
        const welcome: Document = {
          id: crypto.randomUUID(), title: "Welcome to Nextask Workspace", content: "<p>This is your personal workspace...</p>",
          folderId: null, tags: ["welcome"], pinned: true, history: [], logs: [{ type: "created", timestamp: Date.now() }], mediaIds: [], 
          createdAt: Date.now(), updatedAt: Date.now(), version: 1
        };
        setDocuments([welcome]);
        setActiveDocId(welcome.id);
        syncDocToDB(welcome);
      }
      firstLoadDone.current = true;
    };

    initWorkspace();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); 

  useEffect(() => {
    if (!supabase || !currentUser) return;
    const channel = supabase
      .channel(`workspace-${currentUser.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_documents", filter: `user_id=eq.${currentUser.id}` },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setDocuments(prev => prev.some(d => d.id === payload.new.id) ? prev : [mapDoc(payload.new), ...prev]);
          }
          if (payload.eventType === "UPDATE") {
            const incomingDoc = mapDoc(payload.new);
            if (editingDocRef.current === incomingDoc.id) return; 
            setDocuments(prev => prev.map(d => d.id === incomingDoc.id && incomingDoc.version > (d.version ?? 0) ? incomingDoc : d));
          }
          if (payload.eventType === "DELETE") setDocuments(prev => prev.filter(d => d.id !== payload.old.id));
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_folders", filter: `user_id=eq.${currentUser.id}` },
        (payload: any) => {
          if (payload.eventType === "INSERT") setFolders(prev => prev.some(f => f.id === payload.new.id) ? prev : [...prev, mapFolder(payload.new)]);
          if (payload.eventType === "UPDATE") setFolders(prev => prev.map(f => f.id === payload.new.id ? mapFolder(payload.new) : f));
          if (payload.eventType === "DELETE") setFolders(prev => prev.filter(f => f.id !== payload.old.id));
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_media", filter: `user_id=eq.${currentUser.id}` },
        (payload: any) => {
          if (payload.eventType === "INSERT") setMedia(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, mapMedia(payload.new)]);
          if (payload.eventType === "UPDATE") setMedia(prev => prev.map(m => m.id === payload.new.id ? mapMedia(payload.new) : m));
          if (payload.eventType === "DELETE") setMedia(prev => prev.filter(m => m.id !== payload.old.id));
        }
      ).subscribe();
  
    return () => { supabase.removeChannel(channel); };
  }, [supabase, currentUser]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!navigator.onLine || !userRef.current || !supabase) return;
      const user = userRef.current;
      const [docs, foldersRes, mediaRes] = await Promise.all([
        supabase.from("workspace_documents").select("*").eq("user_id", user.id),
        supabase.from("workspace_folders").select("*").eq("user_id", user.id),
        supabase.from("workspace_media").select("*").eq("user_id", user.id),
      ]);
      
      if (docs.data) {
        setDocuments(prev => {
          const incoming: Document[] = docs.data.map(mapDoc);
          const prevIds = new Set(prev.map(d => d.id));
          const newDocs = incoming.filter(d => !prevIds.has(d.id));
          return [
            ...prev.map(localDoc => {
              const dbDoc = incoming.find(d => d.id === localDoc.id);
              if (!dbDoc || editingDocRef.current === localDoc.id) return localDoc;
              return dbDoc.version > (localDoc.version ?? 0) ? dbDoc : localDoc;
            }),
            ...newDocs 
          ];
        });
      }
      if (foldersRes.data) setFolders(foldersRes.data.map(mapFolder)); 
      if (mediaRes.data) setMedia(mediaRes.data.map(mapMedia)); 
    }, 15000);
    return () => clearInterval(interval);
  }, [supabase]);

  useEffect(() => {
    if (!firstLoadDone.current || documents.length === 0) return;
    const timer = setTimeout(() => {
      localStorage.setItem("nextask-workspace-v6", JSON.stringify({ documents, folders }));
      localStorage.setItem("nextask-media-v6", JSON.stringify(media));
      handleWorkspaceAction(addNotification, 'save');
    }, 1000);
    return () => clearTimeout(timer);
  }, [documents, folders, media, addNotification]);

  useEffect(() => {
    const idleTimer = setInterval(() => {
      const lastActiveStr = localStorage.getItem("last_activity");
      if (!lastActiveStr) return;
      const diff = Date.now() - Number(lastActiveStr);
      if (diff > 3 * 60 * 60 * 1000 && diff < 3.5 * 60 * 60 * 1000) {
        handleGlobalState(addNotification, documentsRef.current);
        if (acquireLock('workspace_idle_notified', 6 * 60 * 60 * 1000)) {
          addNotification('mini', 'Workspace Idle 🧠', 'Capture your thoughts before they fade.', 'medium', '/mini-nisc');
        }
      }
    }, 15 * 60 * 1000);
    return () => clearInterval(idleTimer);
  }, [addNotification]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setGlobalSearchOpen(true);
        setSearchQuery("");
      }
      if (e.key === "Escape" && globalSearchOpen) setGlobalSearchOpen(false);
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        createDocument(activeFolderId ?? undefined);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [globalSearchOpen, activeFolderId, createDocument]);

  return {
    documents, setDocuments, folders, media, activeDocId, setActiveDocId, activeFolderId, setActiveFolderId,
    activeTag, setActiveTag, view, setView, 
    
    isSearching,
    search: searchQuery, setSearch: setSearchQuery, 
    globalSearchQuery: searchQuery, setGlobalSearchQuery: setSearchQuery, 
    globalSearchOpen, setGlobalSearchOpen, 
    
    saveState, lastSavedTime, mediaError, isSidebarOpen, setIsSidebarOpen,
    showWipPopup, setShowWipPopup, activeDocument, mediaCounts, visibleDocs, 
    
    globalSearchResults: unifiedSearchResults, filteredMedia,
    
    createFolder, createDocument, deleteDocument, togglePin, updateDocumentTitle, updateDocumentContent,
    addTag, removeTag, addMedia, deleteMedia, editingDocRef, addLog
  };
}