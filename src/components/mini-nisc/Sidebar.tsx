import React from 'react';
import { Search, FolderOpen, Tag, Plus, FileText, Pin, Trash2 } from 'lucide-react';
import { Folder, Document } from './types';

export default function Sidebar({ system }: any) {
  const { 
    folders, documents, activeFolderId, setActiveFolderId, activeTag, 
    setActiveTag, search, setSearch, setIsSidebarOpen, mediaCounts, 
    visibleDocs, activeDocId, setActiveDocId, createFolder, createDocument, 
    togglePin, deleteDocument, isSidebarOpen 
  } = system;

  return (
    <>
      {/* Mobile Overlay - bumped to z-[150] */}
      <div 
        onClick={() => setIsSidebarOpen(false)} 
        className={`md:hidden fixed inset-0 bg-gray-900/50 z-[150] transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} 
      />
      
      {/* Sidebar Panel - bumped to z-[160] */}
      <aside className={`absolute md:relative inset-y-0 left-0 z-[160] md:z-50 h-full w-72 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto shrink-0 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-bold text-2xl tracking-tight text-gray-800">Nextask</h1>
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
            <div onClick={() => { setActiveFolderId(null); setActiveTag(null); setIsSidebarOpen(false); }} className={`px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 transition-colors relative overflow-hidden ${!activeFolderId && !activeTag ? 'bg-green-50 border border-green-200 text-green-700' : 'hover:bg-gray-100 text-gray-600 border border-transparent'}`}>
              {!activeFolderId && !activeTag && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />}
              <FolderOpen size={16} className={!activeFolderId && !activeTag ? "text-green-600" : "text-gray-400"} /> 
              <span className="font-medium text-sm">All Documents</span>
            </div>
            {folders.map((folder: Folder) => {
              const count = mediaCounts[folder.id] || 0;
              const isActive = activeFolderId === folder.id;
              return (
                <div key={folder.id} onClick={() => { setActiveFolderId(folder.id); setActiveTag(null); setIsSidebarOpen(false); }} className={`px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 mt-1 transition-colors relative overflow-hidden ${isActive ? 'bg-green-50 border border-green-200 text-green-700' : 'hover:bg-gray-100 text-gray-600 border border-transparent'}`}>
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
              {Array.from(new Set(documents.flatMap((d: Document) => d.tags || []))).map((tag: unknown) => {
                const tagStr = tag as string;
                const isActive = activeTag === tagStr;
                return (
                  <div key={tagStr} onClick={() => { setActiveTag(tagStr); setActiveFolderId(null); setIsSidebarOpen(false); }} className={`px-3 py-1.5 text-xs rounded-md cursor-pointer transition-colors flex items-center gap-1 font-semibold ${isActive ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <Tag size={12} /> #{tagStr}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Documents List */}
          <div className="flex justify-between items-center mb-3 px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Documents</span>
            <button onClick={() => createDocument(activeFolderId || undefined)} className="text-green-600 hover:text-green-700 transition-colors"><Plus size={16} /></button>
          </div>
          <div className="space-y-1">
            {visibleDocs.map((doc: Document) => {
              const isActive = activeDocId === doc.id;
              return (
                <div key={doc.id} onClick={() => { setActiveDocId(doc.id); setIsSidebarOpen(false); }} className={`group px-4 py-3 rounded-xl cursor-pointer flex items-center gap-3 transition-colors relative overflow-hidden ${isActive ? "bg-green-50 border border-green-200 text-green-700 shadow-md scale-[1.01]" : "hover:bg-gray-100 border border-transparent text-gray-600"}`}>
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />}
                  <FileText size={16} className={isActive ? "text-green-600 shrink-0" : "text-gray-400 shrink-0"} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{doc.title}</div>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doc.tags.slice(0, 2).map(tag => <span key={tag} className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded truncate max-w-[80px] ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>#{tag}</span>)}
                      </div>
                    )}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); togglePin(doc.id); }} className={`shrink-0 ${doc.pinned ? 'text-green-500' : 'text-gray-300 hover:text-green-600'}`}><Pin size={14} className={doc.pinned ? "fill-current" : ""} /></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }} className="text-gray-400 hover:text-red-500 shrink-0 p-1 md:flex hidden transition-colors" title="Delete"><Trash2 size={16} /></button>
                </div>
              );
            })}
            {visibleDocs.length === 0 && <div className="px-4 py-8 text-center text-sm font-medium text-gray-400">No documents in this folder.<br/>Create one to get started.</div>}
          </div>
        </div>
      </aside>
    </>
  );
}