"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Document,
  Folder,
  Media,
  View,
  HistoryEntry,
  LogEntry,
} from "../types/types";
import { useNotificationSystem } from "@/notifications/engine/useNotificationSystem";

import {
  handleWorkspaceAction,
  handleGlobalState,
} from "@/notifications/engine/nexNotificationBrain";
import { getSupabaseClient } from "@/lib/supabase"; 
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

// ==========================================
// 🔥 HELPERS & SECURITY
// ==========================================
export async function hashPin(pin: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

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

const mapWorkspace = (w: any) => ({
  id: w.id, 
  name: w.name, 
  color: w.color || 'bg-gray-800', 
  isLocked: w.is_locked || false,
  lockHash: w.lock_hash || null,
  createdAt: new Date(w.created_at).getTime()
});

const mapDoc = (d: any): Document => ({
  id: d.id,
  title: d.title,
  content: d.content,
  type: d.type || "txt", 
  folderId: d.folder_id ?? null,
  workspaceId: d.workspace_id, 
  tags: d.tags || [],
  pinned: d.pinned ?? false,
  history: d.history || [],
  logs: d.logs || [], 
  mediaIds: d.media_ids || [],
  createdAt: new Date(d.created_at).getTime(),
  updatedAt: new Date(d.updated_at).getTime(),
  deletedAt: d.deleted_at ? new Date(d.deleted_at).getTime() : undefined,
  version: d.version ?? 0 
});

const mapFolder = (f: any): Folder => ({
  id: f.id, 
  name: f.name,
  parentId: f.parent_id ?? null,
  workspaceId: f.workspace_id 
});

const mapMedia = (m: any): Media => ({
  id: m.id, 
  type: m.type as "image"|"video", 
  url: m.url, 
  name: m.name, 
  folderId: m.folder_id ?? null, 
  workspaceId: m.workspace_id, 
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

  const [currentUser, setCurrentUser] = useState<any>(null);
  const userRef = useRef<any>(null);
  const { addNotification } = useNotificationSystem(currentUser?.id);

  // Workspace State
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [lockModal, setLockModal] = useState<{ type: 'set' | 'unlock' | 'remove', id: string } | null>(null);

  // Raw Global Entities (All Workspaces)
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [media, setMedia] = useState<Media[]>([]);

  // UI & Selection State
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [view, setView] = useState<View>("editor");
  
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const [historyStack, setHistoryStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Defaults open for desktop
  const [showWipPopup, setShowWipPopup] = useState(false);

  const lastHistorySave = useRef<number>(0);
  const firstLoadDone = useRef(false);
  const dbSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editingDocRef = useRef<string | null>(null);
  const editingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const documentsRef = useRef<Document[]>(documents);
  const foldersRef = useRef<Folder[]>(folders);
  useEffect(() => { documentsRef.current = documents; }, [documents]);
  useEffect(() => { foldersRef.current = folders; }, [folders]);

  // ==========================================
  // 🔥 ISOLATION LAYER & SECURITY GUARD
  // ==========================================
  const activeWorkspace = useMemo(() => workspaces.find(w => w.id === activeWorkspaceId), [workspaces, activeWorkspaceId]);
  const isLocked = activeWorkspace?.isLocked || false;

  // Protect local state: Completely hide files/folders if workspace is locked
  const activeFolders = useMemo(() => isLocked ? [] : folders.filter(f => f.workspaceId === activeWorkspaceId), [folders, activeWorkspaceId, isLocked]);
  const activeDocuments = useMemo(() => isLocked ? [] : documents.filter(d => d.workspaceId === activeWorkspaceId), [documents, activeWorkspaceId, isLocked]);
  const activeMedia = useMemo(() => isLocked ? [] : media.filter(m => m.workspaceId === activeWorkspaceId), [media, activeWorkspaceId, isLocked]);

  const activeDocument = useMemo(() => activeDocuments.find(d => d.id === activeDocId), [activeDocuments, activeDocId]);

  useEffect(() => {
    if (activeWorkspaceId && firstLoadDone.current) {
      localStorage.setItem("activeWorkspace", activeWorkspaceId);
      setActiveDocId(null);
      setActiveFolderId(null);
      setOpenTabs([]);
      setSelectedItems(new Set());
      setSearchQuery("");
      setHistoryStack([]);
    }
  }, [activeWorkspaceId]);

  // ==========================================
  // 🔥 WORKSPACE API
  // ==========================================
  
  const createWorkspace = async (name: string) => {
    if (!name.trim() || !userRef.current || !supabase) {
      console.warn("Blocked: No user or connection");
      return;
    }
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // 🔥 FIX: Cast to any
    const { data, error } = await (supabase as any)
      .from('workspaces')
      .insert({
        name: name.trim(),
        user_id: userRef.current.id,
        color: randomColor
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Workspace creation error FULL:", error, JSON.stringify(error, null, 2));
      addNotification('mini', 'Error', `Failed to create workspace`, 'high', '/Workspace');
      return;
    }

    const dbWorkspace = mapWorkspace(data);
    
    setWorkspaces(prev => [...prev, dbWorkspace]);
    setActiveWorkspaceId(dbWorkspace.id);
    addNotification('mini', 'Workspace Created', `Switched to ${dbWorkspace.name}`, 'low', '/Workspace');
  };

  const renameWorkspace = async (id: string, name: string) => {
    if (!name.trim() || !supabase) return;
    try {
      // 🔥 FIX: Cast to any
      await (supabase as any).from("workspaces").update({ name }).eq("id", id);
      setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, name } : w)));
    } catch (e) {
      console.error("Rename workspace failed", e);
      addNotification('mini', 'Error', 'Failed to rename workspace', 'high', '/Workspace');
    }
  };

  const deleteWorkspace = async (workspaceId: string) => {
    if (!workspaceId) return;
    
    // Safety check: Don't allow deleting the last workspace
    if (workspaces.length <= 1) {
      addNotification('mini', 'Error', 'You must have at least one workspace.', 'high', '/Workspace');
      return;
    }

    try {
      if (supabase && currentUser?.id) {
        // 🔥 FIX: Cast to any
        await (supabase as any)
          .from("workspaces")
          .delete()
          .eq("id", workspaceId)
          .throwOnError();
      }

      // Cleanup local state
      setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
      
      // Auto-switch to next available workspace if active was deleted
      if (activeWorkspaceId === workspaceId) {
        const nextWorkspace = workspaces.find(w => w.id !== workspaceId);
        setActiveWorkspaceId(nextWorkspace?.id || null);
      }
      
      addNotification('mini', 'Deleted', 'Workspace successfully deleted.', 'low', '/Workspace');
    } catch (e) {
      console.error("❌ Delete workspace failed:", e);
      addNotification('mini', 'Error', 'Failed to delete workspace.', 'high', '/Workspace');
    }
  };

  // ==========================================
  // 🔥 LOCKING FUNCTIONS
  // ==========================================
  const setWorkspaceLock = async (workspaceId: string, pin: string) => {
    if (!pin || !supabase) return;
    const hash = await hashPin(pin);
    // 🔥 FIX: Cast to any
    await (supabase as any).from("workspaces").update({
      is_locked: true, lock_hash: hash, lock_updated_at: new Date().toISOString()
    }).eq("id", workspaceId);

    setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, isLocked: true, lockHash: hash } : w));
    addNotification('mini', 'Workspace Locked', 'Secured with PIN.', 'low', '/Workspace');
  };

  const unlockWorkspace = async (workspaceId: string, pin: string) => {
    const hash = await hashPin(pin);
    const ws = workspaces.find(w => w.id === workspaceId);
    if (ws?.lockHash !== hash) return false;

    // Remove lock locally for THIS session only
    setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, isLocked: false } : w));
    addNotification('mini', 'Unlocked', 'Workspace unlocked.', 'low', '/Workspace');
    return true;
  };

  const removeWorkspaceLock = async (workspaceId: string) => {
    if (!supabase) return;
    // 🔥 FIX: Cast to any
    await (supabase as any).from("workspaces").update({ is_locked: false, lock_hash: null }).eq("id", workspaceId);
    setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, isLocked: false, lockHash: null } : w));
    addNotification('mini', 'Lock Removed', 'Workspace is now unprotected.', 'low', '/Workspace');
  };

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders(prev => {
      const getAncestors = (folderId: string): string[] => {
        const folder = foldersRef.current.find(f => f.id === folderId);
        if (!folder || !folder.parentId) return [];
        return [folder.parentId, ...getAncestors(folder.parentId)];
      };
      
      const ancestors = getAncestors(id);
      const isCurrentlyExpanded = !!prev[id];
      const newState: Record<string, boolean> = {};
      
      ancestors.forEach(a => newState[a] = true);
      newState[id] = !isCurrentlyExpanded;
      
      return newState;
    });
  }, []);

  const closeTab = useCallback((id: string) => {
    setOpenTabs(prev => {
      const next = prev.filter(t => t !== id);
      if (activeDocId === id) {
        setActiveDocId(next.length > 0 ? next[next.length - 1] : null);
      }
      return next;
    });
  }, [activeDocId]);

  const toggleSelection = useCallback((id: string, multi: boolean = false) => {
    setSelectedItems(prev => {
      const next = new Set(multi ? prev : []);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const markEditing = useCallback((docId: string) => {
    editingDocRef.current = docId;
    if (editingTimeoutRef.current) clearTimeout(editingTimeoutRef.current);
    editingTimeoutRef.current = setTimeout(() => { editingDocRef.current = null; }, 5000); 
  }, []);

  const syncDocToDB = async (doc: Document, retry = 0): Promise<any> => {
    try {
      const user = userRef.current;
      if (!user || !supabase) return { error: new Error("Not authenticated") };
      
      // 🔥 FIX: Cast to any
      const res = await (supabase as any).from('workspace_documents').upsert({
        id: doc.id, 
        user_id: user.id, 
        folder_id: doc.folderId ?? null, 
        workspace_id: doc.workspaceId, 
        title: doc.title, 
        content: doc.content, 
        tags: doc.tags || [],
        type: doc.type || "txt", 
        pinned: doc.pinned ?? false, 
        history: doc.history || [], 
        logs: doc.logs || [], 
        media_ids: doc.mediaIds || [],
        version: doc.version ?? 0, 
        updated_at: new Date(doc.updatedAt).toISOString(), 
        created_at: new Date(doc.createdAt).toISOString(),
        deleted_at: doc.deletedAt ? new Date(doc.deletedAt).toISOString() : null
      }, { onConflict: 'id' });

      if (res.error && retry < 2) {
        return syncDocToDB(doc, retry + 1);
      }
      return res;
    } catch (e) { 
      if (retry < 2) return syncDocToDB(doc, retry + 1);
      console.error("Doc Sync Error", e); 
      return { error: e };
    }
  };

  const queueDocDBSync = useCallback((doc: Document) => {
    setSaveState('saving');
    if (dbSyncTimerRef.current) clearTimeout(dbSyncTimerRef.current);
    dbSyncTimerRef.current = setTimeout(() => {
      syncDocToDB(doc).then(({ error }) => {
        if (!error) {
          setSaveState('saved');
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      });
    }, 500); 
  }, []);

  const syncFolderToDB = async (folder: Folder) => {
    if (!userRef.current || !supabase) return { error: new Error("No user") };
    // 🔥 FIX: Cast to any
    return await (supabase as any).from('workspace_folders').upsert({ 
      id: folder.id, 
      user_id: userRef.current.id, 
      name: folder.name,
      parent_id: folder.parentId ?? null,
      workspace_id: folder.workspaceId 
    });
  };

  const syncMediaToDB = async (mediaItem: Media) => {
    if (!userRef.current || !supabase) return;
    // 🔥 FIX: Cast to any
    await (supabase as any).from('workspace_media').upsert({
      id: mediaItem.id, user_id: userRef.current.id, folder_id: mediaItem.folderId ?? null,
      workspace_id: mediaItem.workspaceId, 
      type: mediaItem.type, url: mediaItem.url, name: mediaItem.name
    });
  };

  const addLog = useCallback((docId: string, type: string, meta?: any) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id !== docId) return doc;
      const newLog = { type, timestamp: Date.now(), meta };
      const updatedDoc = { ...doc, logs: [...(doc.logs || []), newLog].slice(-50) };
      queueDocDBSync(updatedDoc);
      return updatedDoc;
    }));
  }, [queueDocDBSync]);

  const updateDocument = useCallback((id: string, updates: Partial<Document>) => {
    markEditing(id); 
    setDocuments(prev => {
      const target = prev.find(d => d.id === id);
      if (!target) return prev;

      if (updates.content || updates.title) {
        setHistoryStack(stack => [...stack, { type: 'UPDATE_DOC', prev: target, next: { ...target, ...updates } }]);
      }

      const updatedDoc: Document = { ...target, ...updates, updatedAt: Date.now(), version: (target.version ?? 0) + 1 };
      queueDocDBSync(updatedDoc);
      return prev.map(d => d.id === id ? updatedDoc : d);
    });
    pingActivity();
  }, [markEditing, queueDocDBSync]);

  const updateFolderName = useCallback(async (id: string, name: string) => {
    const target = foldersRef.current.find(f => f.id === id);
    if (target) setHistoryStack(prev => [...prev, { type: 'RENAME_FOLDER', prev: target, next: { ...target, name } }]);
    
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
    if (userRef.current && supabase) {
      // 🔥 FIX: Cast to any
      await (supabase as any).from('workspace_folders').update({ name }).eq('id', id);
    }
  }, [supabase]);

  const createFolder = useCallback(async (parentId: string | null = null, name: string) => {
    if (!activeWorkspaceId || !workspaces.find(w => w.id === activeWorkspaceId) || !userRef.current) return;
    if (!name || !name.trim()) return;

    const cleanName = name.trim();
    const newFolder: Folder = { id: crypto.randomUUID(), name: cleanName, parentId, workspaceId: activeWorkspaceId };
    
    setHistoryStack(prev => [...prev, { type: 'CREATE_FOLDER', payload: newFolder }]);
    setFolders(prev => [...prev, newFolder]);

    setExpandedFolders(prev => ({
      ...prev, ...(parentId ? { [parentId]: true } : {}), [newFolder.id]: true 
    }));

    const { error } = await syncFolderToDB(newFolder);
    
    if (error) {
      console.error("❌ Folder Sync Error:", error);
      addNotification('mini', 'Error', `Could not save folder.`, 'high', '/Workspace');
      setFolders(prev => prev.filter(f => f.id !== newFolder.id));
      return;
    }
    
    pingActivity();
    addNotification('mini', 'Folder Created', `"${cleanName}" initialized.`, 'low', '/Workspace');
  }, [activeWorkspaceId, workspaces, addNotification]); 

  const deleteFolder = async (id: string) => {
    if (!confirm("Delete this folder and all its contents?")) return;

    const getAllChildIds = (targetId: string, allFolders: Folder[]): string[] => {
      let ids = [targetId];
      allFolders.filter(f => f.parentId === targetId).forEach(child => {
        ids = ids.concat(getAllChildIds(child.id, allFolders));
      });
      return ids;
    };

    const idsToDelete = getAllChildIds(id, folders);
    const prevFolders = [...folders];
    const prevDocs = [...documents];

    setHistoryStack(prev => [...prev, { type: 'DELETE_FOLDER', payload: { folderIds: idsToDelete, docs: prevDocs.filter(d => d.folderId && idsToDelete.includes(d.folderId)) } }]);

    setFolders(prev => prev.filter(f => !idsToDelete.includes(f.id)));
    setDocuments(prev => prev.map(d => (d.folderId && idsToDelete.includes(d.folderId)) ? { ...d, folderId: null } : d));

    if (activeFolderId && idsToDelete.includes(activeFolderId)) setActiveFolderId(null);

    if (supabase && userRef.current) {
      // 🔥 FIX: Cast to any
      await (supabase as any).from("workspace_documents").update({ folder_id: null }).in("folder_id", idsToDelete);
      const { error: folErr } = await (supabase as any).from("workspace_folders").delete().in("id", idsToDelete);

      if (folErr) {
        console.error("Failed to delete folder from DB", folErr);
        addNotification('mini', 'Error', `Could not delete folder.`, 'high', '/Workspace');
        setFolders(prevFolders); 
        setDocuments(prevDocs);
        return;
      }
    }
    pingActivity();
  };

  const createDocument = useCallback(async (folderId: string | null = null, type: string = "txt", title: string) => {
    if (!activeWorkspaceId || !workspaces.find(w => w.id === activeWorkspaceId) || !userRef.current) return;
    if (!title || !title.trim()) return;

    const cleanTitle = title.trim();
    const newDoc: Document = {
      id: crypto.randomUUID(), title: cleanTitle, content: "", type: type, 
      folderId: folderId, workspaceId: activeWorkspaceId, 
      tags: [], mediaIds: [], pinned: false, 
      createdAt: Date.now(), updatedAt: Date.now(), history: [], logs: [{ type: "created", timestamp: Date.now() }], version: 1 
    };
    
    setHistoryStack(prev => [...prev, { type: 'CREATE_DOC', payload: newDoc }]);
    setDocuments(prev => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    setOpenTabs(prev => prev.includes(newDoc.id) ? prev : [...prev, newDoc.id]);

    if (folderId) setExpandedFolders(prev => ({ ...prev, [folderId]: true }));
    setView("editor");
    
    const { error } = await syncDocToDB(newDoc);
    if (error) {
      console.error("❌ Document Sync Error:", error);
      setDocuments(prev => prev.filter(d => d.id !== newDoc.id));
      setActiveDocId(null);
      setOpenTabs(prev => prev.filter(id => id !== newDoc.id)); 
      addNotification('mini', 'Error', `Failed to save file. Check connection.`, 'high', '/Workspace');
      return;
    }
    pingActivity();
    addNotification('mini', 'File Created', `"${cleanTitle}" initialized.`, 'low', '/Workspace');
  }, [activeWorkspaceId, workspaces, addNotification]); 

  const deleteDocument = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    const target = documentsRef.current.find(d => d.id === id);
    if (!target) return;

    setHistoryStack(prev => [...prev, { type: 'DELETE_DOC', payload: target }]);
    const updatedDoc = { ...target, deletedAt: Date.now() };
    setDocuments(prev => prev.map(doc => doc.id === id ? updatedDoc : doc));
    addLog(id, "deleted"); 
    closeTab(id); 

    if (supabase && userRef.current) {
      // 🔥 FIX: Cast to any
      await (supabase as any).from('workspace_documents').upsert({
        ...updatedDoc, user_id: userRef.current.id, folder_id: updatedDoc.folderId ?? null, deleted_at: new Date(updatedDoc.deletedAt!).toISOString()
      }, { onConflict: 'id' });
    }
    pingActivity();
  };

  const handleDrop = useCallback(async (draggedId: string, targetFolderId: string | null, type: 'file' | 'folder') => {
    if (type === 'file') {
      const targetDoc = documentsRef.current.find(d => d.id === draggedId);
      if (!targetDoc || targetDoc.folderId === targetFolderId) return;

      setHistoryStack(prev => [...prev, { type: 'MOVE_DOC', id: draggedId, from: targetDoc.folderId, to: targetFolderId }]);
      setDocuments(prev => prev.map(d => d.id === draggedId ? { ...d, folderId: targetFolderId, updatedAt: Date.now() } : d));

      // 🔥 FIX: Cast to any
      if (userRef.current && supabase) await (supabase as any).from('workspace_documents').update({ folder_id: targetFolderId }).eq('id', draggedId);
    } else if (type === 'folder') {
      if (draggedId === targetFolderId) return; 
      
      const targetFolder = foldersRef.current.find(f => f.id === draggedId);
      if (!targetFolder || targetFolder.parentId === targetFolderId) return;

      setHistoryStack(prev => [...prev, { type: 'MOVE_FOLDER', id: draggedId, from: targetFolder.parentId, to: targetFolderId }]);
      setFolders(prev => prev.map(f => f.id === draggedId ? { ...f, parentId: targetFolderId } : f));
      
      // 🔥 FIX: Cast to any
      if (userRef.current && supabase) await (supabase as any).from('workspace_folders').update({ parent_id: targetFolderId }).eq('id', draggedId);
    }
  }, [supabase]);

  const togglePin = useCallback((id: string) => {
    const target = documentsRef.current.find(d => d.id === id);
    if (target) {
      updateDocument(id, { pinned: !target.pinned });
      addLog(id, !target.pinned ? "pinned" : "unpinned");
    }
  }, [updateDocument, addLog]);

  const updateDocumentTitle = useCallback((id: string, title: string) => {
    updateDocument(id, { title });
    addLog(id, "renamed", { title });
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
      addLog(id, "edited"); 
      if (newHistoryList.length === 15) handleWorkspaceAction(addNotification, 'deepWork');
    }

    updateDocument(id, {
      content, title: shouldAutoTitle ? extractTitle(content) : target.title, history: newHistoryList
    });
  }, [updateDocument, addLog, addNotification]);

  const addTag = useCallback((docId: string, tagName: string) => {
    const cleanTag = tagName.trim().toLowerCase();
    if (!cleanTag) return;
    const target = documentsRef.current.find(d => d.id === docId);
    if (target) {
      updateDocument(docId, { tags: [...(target.tags || []).filter(t => t !== cleanTag), cleanTag] });
      addLog(docId, "tag_added", { tag: cleanTag }); 
    }
  }, [updateDocument, addLog]);

  const removeTag = useCallback((docId: string, tagName: string) => {
    const target = documentsRef.current.find(d => d.id === docId);
    if (target) {
      updateDocument(docId, { tags: (target.tags || []).filter(t => t !== tagName) });
      addLog(docId, "tag_removed", { tag: tagName }); 
    }
  }, [updateDocument, addLog]);

  const addMedia = useCallback((file: File, onInsert?: (mediaItem: Media) => void) => {
    if (!activeFolderId || !activeWorkspaceId || !userRef.current) { 
      setMediaError("Select a folder first");
      setTimeout(() => setMediaError(""), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const newMedia: Media = { 
        id: crypto.randomUUID(), type: file.type.startsWith("video") ? "video" : "image", 
        url: reader.result as string, name: file.name, folderId: activeFolderId, 
        workspaceId: activeWorkspaceId, createdAt: Date.now() 
      };
      setMedia(prev => [newMedia, ...prev]);
      syncMediaToDB(newMedia);
      if (activeDocId && typeof onInsert === 'function') onInsert(newMedia);
      pingActivity();
    };
    reader.readAsDataURL(file);
  }, [activeFolderId, activeDocId, activeWorkspaceId]);

  const deleteMedia = async (id: string) => {
    if (!confirm("Delete permanently?")) return;
    setMedia(prev => prev.filter(m => m.id !== id));
    // 🔥 FIX: Cast to any
    if (supabase) await (supabase as any).from('workspace_media').delete().eq('id', id);
    pingActivity();
  };

  const isSearching = searchQuery.trim().length > 0;

  const mediaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeMedia.forEach(m => { if (m.folderId) counts[m.folderId] = (counts[m.folderId] || 0) + 1; });
    return counts;
  }, [activeMedia]);

  const unifiedSearchResults = useMemo(() => {
    if (!isSearching) return [];
    const term = searchQuery.toLowerCase().trim();
    return activeDocuments
      .filter(doc => !doc.deletedAt)
      .filter(doc => doc.title.toLowerCase().includes(term) || doc.content.toLowerCase().includes(term) || doc.tags?.some(t => t.toLowerCase().includes(term)))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [activeDocuments, searchQuery, isSearching]);

  const visibleDocs = useMemo(() => {
    const docs = activeDocuments.filter(doc => {
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
  }, [activeDocuments, activeFolderId, activeTag]);

  const filteredMedia = useMemo(() => {
    let items = activeMedia;
    if (activeFolderId) items = items.filter(m => m.folderId === activeFolderId);
    if (isSearching) {
      const term = searchQuery.toLowerCase().trim();
      items = items.filter(m => m.name?.toLowerCase().includes(term) || m.type.includes(term));
    }
    return items;
  }, [activeMedia, activeFolderId, searchQuery, isSearching]);

  // ==========================================
  // 🔥 INITIALIZATION & REALTIME
  // ==========================================
  useEffect(() => {
    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      userRef.current = session?.user ?? null;
      setCurrentUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!currentUser) return; 

    const hasSeenPopup = sessionStorage.getItem('nexspace_workspace_wip_seen');
    if (!hasSeenPopup) {
      setShowWipPopup(true);
      sessionStorage.setItem('nexspace_workspace_wip_seen', 'true');
    }

    const initWorkspace = async () => {
      if (!currentUser?.id || !supabase) return;

      // 🔥 FIX: Cast to any
      const { data: wsData } = await (supabase as any).from('workspaces').select('*').eq('user_id', currentUser.id);
      
      let loadedWorkspaces: any[] = wsData?.map(mapWorkspace) || [];
      
      if (loadedWorkspaces.length === 0) {
        // 🔥 FIX: Cast to any
        const { data } = await (supabase as any)
          .from('workspaces')
          .insert({ name: "Personal Workspace", user_id: currentUser.id, color: "bg-blue-500" })
          .select()
          .single();
        if (data) loadedWorkspaces = [mapWorkspace(data)];
      }
      
      setWorkspaces(loadedWorkspaces);

      const savedWsId = localStorage.getItem("activeWorkspace");
      const initialWsId = loadedWorkspaces.find((w: any) => w.id === savedWsId)?.id || loadedWorkspaces[0].id;
      setActiveWorkspaceId(initialWsId);

      // 🔥 FIX: Cast all promises to any
      const [docsRes, foldersRes, mediaRes] = await Promise.all([
        (supabase as any).from('workspace_documents').select('*').eq('user_id', currentUser.id).order('updated_at', { ascending: false }),
        (supabase as any).from('workspace_folders').select('*').eq('user_id', currentUser.id),
        (supabase as any).from('workspace_media').select('*').eq('user_id', currentUser.id)
      ]);

      if (foldersRes.data) setFolders(foldersRes.data.map(mapFolder)); 
      if (mediaRes.data) setMedia(mediaRes.data.map(mapMedia)); 

      if (docsRes.data && docsRes.data.length > 0) {
        const loadedDocs: Document[] = docsRes.data.map(mapDoc);
        setDocuments(loadedDocs);
        
        const firstActiveDoc = loadedDocs.find(d => !d.deletedAt && d.workspaceId === initialWsId);
        if (!activeDocId && firstActiveDoc) {
          setActiveDocId(firstActiveDoc.id);
          setOpenTabs([firstActiveDoc.id]); 
        }
      }
      firstLoadDone.current = true;
    };

    initWorkspace();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); 

useEffect(() => {
  if (!supabase || !currentUser) return;

  const channelName = `workspace-${currentUser.id}`;

  const existing = supabase
    .getChannels()
    .find(c => c.topic === `realtime:${channelName}`);

  if (existing) {
    supabase.removeChannel(existing);
  }

  const channel = supabase.channel(channelName);

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "workspace_documents",
      filter: `user_id=eq.${currentUser.id}`,
    },
    (payload) => {
      // document logic
    }
  );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "workspace_folders",
      filter: `user_id=eq.${currentUser.id}`,
    },
    (payload) => {
      // folder logic
    }
  );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "workspace_media",
      filter: `user_id=eq.${currentUser.id}`,
    },
    (payload) => {
      // media logic
    }
  );

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentUser?.id]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!navigator.onLine || !userRef.current || !supabase) return;
      const user = userRef.current;
      // 🔥 FIX: Cast all promises to any
      const [docs, foldersRes, mediaRes] = await Promise.all([
        (supabase as any).from("workspace_documents").select("*").eq("user_id", user.id),
        (supabase as any).from("workspace_folders").select("*").eq("user_id", user.id),
        (supabase as any).from("workspace_media").select("*").eq("user_id", user.id),
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
    if (!firstLoadDone.current || activeDocuments.length === 0 || !userRef.current) return;
    
    const timer = setTimeout(() => {
      const storageKey = `nexspace-${userRef.current.id}-workspace`;
      const mediaKey = `nexspace-${userRef.current.id}-media`;
      localStorage.setItem(storageKey, JSON.stringify({ documents: activeDocuments, folders: activeFolders }));
      localStorage.setItem(mediaKey, JSON.stringify(activeMedia));
      handleWorkspaceAction(addNotification, 'save');
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeDocuments, activeFolders, activeMedia, addNotification]);

  return {
    documents: activeDocuments, 
    setDocuments, 
    folders: activeFolders, 
    media: activeMedia, 

    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    createWorkspace,
    deleteWorkspace,
    renameWorkspace,

    lockModal, setLockModal, setWorkspaceLock, unlockWorkspace, removeWorkspaceLock,
    
    activeDocId, setActiveDocId, activeFolderId, setActiveFolderId,
    activeTag, setActiveTag, view, setView, 
    
    openTabs, setOpenTabs, closeTab,
    expandedFolders, setExpandedFolders, toggleFolder,

    selectedItems, toggleSelection, handleDrop,
    historyStack, redoStack, setHistoryStack, setRedoStack,

    isSearching, search: searchQuery, setSearch: setSearchQuery, 
    globalSearchQuery: searchQuery, setGlobalSearchQuery: setSearchQuery, 
    globalSearchOpen, setGlobalSearchOpen, 
    
    saveState, lastSavedTime, mediaError, isSidebarOpen, setIsSidebarOpen,
    showWipPopup, setShowWipPopup, activeDocument, mediaCounts, visibleDocs, 
    
    globalSearchResults: unifiedSearchResults, filteredMedia,
    
    createFolder, deleteFolder, createDocument, deleteDocument, togglePin, 
    updateDocumentTitle, updateDocumentContent, updateDocument, updateFolderName, 
    addTag, removeTag, addMedia, deleteMedia, editingDocRef, addLog
  };
}