"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Document, Folder, Media, View, HistoryEntry } from "./types";
import { useNotificationSystem } from "@/notifications/useNotificationSystem";
import { handleWorkspaceAction, handleGlobalState } from "@/notifications/nexNotificationBrain";
import { getSupabaseClient } from "@/lib/supabase"; 
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

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

// ✅ SAFE DB MAPPERS
const mapDoc = (d: any): Document => ({
  id: d.id,
  title: d.title,
  content: d.content,
  folderId: d.folder_id ?? null,
  tags: d.tags || [],
  pinned: d.pinned ?? false,
  history: d.history || [],
  mediaIds: d.media_ids || [],
  createdAt: new Date(d.created_at).getTime(),
  updatedAt: new Date(d.updated_at).getTime(),
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

export function useWorkspaceSystem() {
  const supabase = getSupabaseClient();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const userRef = useRef<any>(null);

  const { addNotification } = useNotificationSystem(currentUser?.id);
  
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
  const editingDocRef = useRef<string | null>(null);
  const editingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const markEditing = useCallback((docId: string) => {
    editingDocRef.current = docId;
    if (editingTimeoutRef.current) {
      clearTimeout(editingTimeoutRef.current);
    }
    editingTimeoutRef.current = setTimeout(() => {
      editingDocRef.current = null;
    }, 5000); 
  }, []);

  const documentsRef = useRef<Document[]>(documents);
  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  // AUTH LISTENER
  useEffect(() => {
    if (!supabase) return;

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const user = session?.user ?? null;
        userRef.current = user;
        setCurrentUser(user);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  // --- SUPABASE SYNC HELPERS ---
  const syncDocToDB = async (doc: Document) => {
    try {
      const user = userRef.current;
      if (!user || !supabase) return;
      const { error } = await supabase.from('workspace_documents').upsert({
        id: doc.id,
        user_id: user.id,
        folder_id: doc.folderId ?? null,
        title: doc.title,
        content: doc.content,
        tags: doc.tags || [],
        pinned: doc.pinned ?? false,
        history: doc.history || [],
        media_ids: doc.mediaIds || [],
        version: doc.version ?? 0, 
        updated_at: new Date(doc.updatedAt).toISOString(), 
        created_at: new Date(doc.createdAt).toISOString()  
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
    const user = userRef.current;
    if (!user || !supabase) return;
    await supabase.from('workspace_folders').upsert({ id: folder.id, user_id: user.id, name: folder.name });
  };

  const syncMediaToDB = async (mediaItem: Media) => {
    const user = userRef.current;
    if (!user || !supabase) return;
    await supabase.from('workspace_media').upsert({
      id: mediaItem.id, user_id: user.id, folder_id: mediaItem.folderId ?? null,
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
      if (!currentUser || !supabase) return;
      const user = currentUser;

      const [docsRes, foldersRes, mediaRes] = await Promise.all([
        supabase.from('workspace_documents').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
        supabase.from('workspace_folders').select('*').eq('user_id', user.id),
        supabase.from('workspace_media').select('*').eq('user_id', user.id)
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
        if (!activeDocId) setActiveDocId(loadedDocs[0].id);
      } else {
        const welcome: Document = {
          id: crypto.randomUUID(), title: "Welcome to Nextask Workspace", content: "<p>This is your personal workspace...</p>",
          folderId: null, tags: ["welcome"], pinned: true, history: [], mediaIds: [], 
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

  // --- REALTIME ENGINE ---
  useEffect(() => {
    if (!supabase || !currentUser) return;
  
    const channel = supabase
      .channel(`workspace-${currentUser.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspace_documents", filter: `user_id=eq.${currentUser.id}` },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setDocuments(prev => {
              if (prev.some(d => d.id === payload.new.id)) return prev;
              return [mapDoc(payload.new), ...prev];
            });
          }
  
          if (payload.eventType === "UPDATE") {
            const incomingDoc = mapDoc(payload.new);
            if (editingDocRef.current === incomingDoc.id) return; 
            setDocuments(prev => prev.map(d => {
              if (d.id !== incomingDoc.id) return d;
              return incomingDoc.version > (d.version ?? 0) ? incomingDoc : d;
            }));
          }
  
          if (payload.eventType === "DELETE") {
            setDocuments(prev => prev.filter(d => d.id !== payload.old.id));
          }
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
      )
      .subscribe();
  
    return () => { supabase.removeChannel(channel); };
  }, [supabase, currentUser]);

  // --- FALLBACK SYNC ---
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!navigator.onLine) return;
      const user = userRef.current;
      if (!user || !supabase) return;
  
      const [docs, foldersRes, mediaRes] = await Promise.all([
        supabase.from("workspace_documents").select("*").eq("user_id", user.id),
        supabase.from("workspace_folders").select("*").eq("user_id", user.id),
        supabase.from("workspace_media").select("*").eq("user_id", user.id),
      ]);
      
      if (docs.data) {
        setDocuments(prev => {
          const incoming: Document[] = docs.data.map(mapDoc);
          const prevIds = new Set(prev.map((d: Document) => d.id));
          const newDocs = incoming.filter((d: Document) => !prevIds.has(d.id));

          return [
            ...prev.map((localDoc: Document) => {
              const dbDoc = incoming.find((d: Document) => d.id === localDoc.id);
              if (!dbDoc) return localDoc;
              if (editingDocRef.current === localDoc.id) return localDoc;
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

  // --- LOCAL AUTO-SAVE ---
  useEffect(() => {
    if (!firstLoadDone.current || documents.length === 0) return;
    const timer = setTimeout(() => {
      localStorage.setItem("nextask-workspace-v6", JSON.stringify({ documents, folders }));
      localStorage.setItem("nextask-media-v6", JSON.stringify(media));
      handleWorkspaceAction(addNotification, 'save');
    }, 1000);
    return () => clearTimeout(timer);
  }, [documents, folders, media, addNotification]);

  // --- IDLE ACTIVITY TRACKER ---
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
        createDocument(activeFolderId ?? undefined);
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
      folderId: folderId ?? null, 
      tags: [], mediaIds: [], pinned: false, 
      createdAt: Date.now(), updatedAt: Date.now(), 
      history: [],
      version: 1 
    };
    setDocuments(prev => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    setView("editor");
    setIsSidebarOpen(false);
    syncDocToDB(newDoc);
    pingActivity();
    addNotification('mini', 'Document Created', 'New workspace document initialized.', 'low', '/mini-nisc');
  };

  const deleteDocument = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    setDocuments(prev => {
      const updated = prev.filter(doc => doc.id !== id);
      if (activeDocId === id) setActiveDocId(updated[0]?.id ?? null);
      return updated;
    });
    if (supabase) await supabase.from('workspace_documents').delete().eq('id', id);
    pingActivity();
  };

  // ✅ FIX: Extract targeted document FIRST to avoid async React bugs
  const togglePin = (id: string) => {
    const target = documentsRef.current.find(d => d.id === id);
    if (!target) return;

    const updatedDoc: Document = { 
      ...target, 
      pinned: !target.pinned, 
      updatedAt: Date.now(), 
      version: (target.version ?? 0) + 1 
    };

    queueDocDBSync(updatedDoc);
    setDocuments(prev => prev.map(d => d.id === id ? updatedDoc : d));
    pingActivity();
  };

  const updateDocumentTitle = (id: string, title: string) => {
    markEditing(id); 
    if (dbSyncTimerRef.current) clearTimeout(dbSyncTimerRef.current);

    const target = documentsRef.current.find(d => d.id === id);
    if (!target) return;

    const updatedDoc: Document = { 
      ...target, 
      title, 
      updatedAt: Date.now(), 
      version: (target.version ?? 0) + 1 
    };

    queueDocDBSync(updatedDoc);
    setDocuments(prev => prev.map(d => d.id === id ? updatedDoc : d));
    pingActivity();
  };

  const extractTitle = (html: string): string => {
    const text = html.replace(/<[^>]+>/g, "").trim();
    return text.split("\n")[0].slice(0, 60) || "Untitled Document";
  };

  // ✅ FIX: Fixed the core closure anti-pattern preventing the database from saving
  const updateDocumentContent = useCallback((id: string, content: string) => {
    markEditing(id); 
    if (dbSyncTimerRef.current) clearTimeout(dbSyncTimerRef.current);

    const target = documentsRef.current.find(d => d.id === id);
    if (!target) return;

    const shouldAutoTitle = target.title === "Untitled Document" || target.title.startsWith("Untitled");
    const nowMs = Date.now(); 
    let newHistoryList = target.history || [];

    if (nowMs - lastHistorySave.current > 5000) {
      lastHistorySave.current = nowMs;
      newHistoryList = [...newHistoryList, { content, timestamp: nowMs, title: target.title }].slice(-20); 
      if (newHistoryList.length === 15) handleWorkspaceAction(addNotification, 'deepWork');
    }

    const modifiedDoc: Document = { 
      ...target, 
      content, 
      title: shouldAutoTitle ? extractTitle(content) : target.title, 
      updatedAt: nowMs, 
      version: (target.version ?? 0) + 1, 
      history: newHistoryList 
    };

    // Queue with explicit object reference
    queueDocDBSync(modifiedDoc);
    setDocuments(prev => prev.map(d => d.id === id ? modifiedDoc : d));
    pingActivity();
  }, [queueDocDBSync, markEditing, addNotification]);

  const addTag = (docId: string, tagName: string) => {
    const cleanTag = tagName.trim().toLowerCase();
    if (!cleanTag) return;

    const target = documentsRef.current.find(d => d.id === docId);
    if (!target) return;

    const updatedDoc: Document = { 
      ...target, 
      tags: [...(target.tags || []).filter(t => t !== cleanTag), cleanTag], 
      updatedAt: Date.now(), 
      version: (target.version ?? 0) + 1 
    };

    queueDocDBSync(updatedDoc);
    setDocuments(prev => prev.map(d => d.id === docId ? updatedDoc : d));
    pingActivity();
  };

  const removeTag = (docId: string, tagName: string) => {
    const target = documentsRef.current.find(d => d.id === docId);
    if (!target) return;

    const updatedDoc: Document = { 
      ...target, 
      tags: target.tags?.filter(t => t !== tagName) || [], 
      updatedAt: Date.now(), 
      version: (target.version ?? 0) + 1 
    };

    queueDocDBSync(updatedDoc);
    setDocuments(prev => prev.map(d => d.id === docId ? updatedDoc : d));
    pingActivity();
  };

  // ✅ FIX: Made onInsert optional by adding '?' and checking if it's a function
  const addMedia = (file: File, onInsert?: (mediaItem: Media) => void) => {
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
      
      // ✅ FIX: Only call onInsert if it was actually provided
      if (activeDocId && typeof onInsert === 'function') {
        onInsert(newMedia);
      }
      
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
    addTag, removeTag, addMedia, deleteMedia, editingDocRef
  };
}