"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FolderOpen, AlertTriangle, Upload, Image as ImageIcon, 
  Plus, Trash2, Play, Loader2, Search, ArrowUpDown, X, 
  ChevronLeft, ChevronRight, Copy, CheckSquare, Square
} from 'lucide-react';
import { Media } from './types';

export default function MediaLibrary({ system }: any) {
  const { 
    activeFolderId, folders, mediaError, addMedia, 
    filteredMedia, deleteMedia, activeDocId, setView, setPendingMedia 
  } = system;

  // --- UI States ---
  const [activeMedia, setActiveMedia] = useState<Media | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<'new' | 'old'>('new');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  
  // --- Selection States ---
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // --- Filter/Preview States ---
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [activeUploadFilter, setActiveUploadFilter] = useState("none");

  // Robust Filtering & Sorting
  const mediaList = filteredMedia || [];
  const processedMedia = mediaList
    .filter((m: any) => {
      const matchSearch = (m.name || "").toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      return matchSearch && matchType;
    })
    .sort((a: any, b: any) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'new' ? bTime - aTime : aTime - bTime;
    });

  // --- Navigation Logic ---
  const goNext = useCallback(() => {
    if (activeIndex === null || processedMedia.length === 0) return;
    const next = (activeIndex + 1) % processedMedia.length;
    setActiveIndex(next);
    setActiveMedia(processedMedia[next]);
  }, [activeIndex, processedMedia]);

  const goPrev = useCallback(() => {
    if (activeIndex === null || processedMedia.length === 0) return;
    const prev = (activeIndex - 1 + processedMedia.length) % processedMedia.length;
    setActiveIndex(prev);
    setActiveMedia(processedMedia[prev]);
  }, [activeIndex, processedMedia]);

  // Keyboard Support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!activeMedia) return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") {
        setActiveMedia(null);
        setActiveIndex(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeMedia, goNext, goPrev]);

  // Actions
  const processUpload = async () => {
    if (!previewFile) return;
    setIsUploading(true);
    try {
      await addMedia(previewFile);
      setPreviewFile(null);
      setActiveUploadFilter("none");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} items permanently?`)) return;
    for (const id of selectedIds) {
      await deleteMedia(id);
    }
    setSelectedIds([]);
    setSelectionMode(false);
  };

  return (
    <div 
      className={`relative bg-white border rounded-3xl p-4 md:p-8 shadow-sm pb-32 min-h-[70vh] transition-all duration-300 ${
        isDragging ? 'border-green-400 ring-8 ring-green-500/5' : 'border-gray-200'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) setPreviewFile(file);
      }}
    >
      {/* 1. Header Area */}
      <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-gray-800">Media Assets</h2>
            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
              {processedMedia.length} Items
            </span>
          </div>
          <p className="text-[11px] font-medium text-gray-400 mt-1">
            Manage and insert visual assets into your workspace
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Multi-Select Toggle */}
          <button 
            onClick={() => { setSelectionMode(!selectionMode); setSelectedIds([]); }}
            className={`p-2.5 rounded-xl border transition-all ${selectionMode ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}
          >
            {selectionMode ? <CheckSquare size={18} /> : <Square size={18} />}
          </button>

          {/* Search Box */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" placeholder="Search..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-gray-50 border-transparent rounded-xl text-sm w-full sm:w-48 focus:bg-white focus:ring-2 focus:ring-green-500/10 transition-all outline-none"
            />
          </div>

          <select 
            value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-gray-50 border-transparent text-gray-600 text-xs font-bold px-3 py-2.5 rounded-xl outline-none"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>

          <button 
            onClick={() => document.getElementById("media-upload-input")?.click()}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-green-600/20 hover:bg-green-700 active:scale-95 transition-all"
          >
            <Upload size={18} /> Upload
          </button>
        </div>
      </div>

      <input 
        id="media-upload-input" type="file" className="hidden" 
        onChange={(e) => { if(e.target.files?.[0]) setPreviewFile(e.target.files[0]); }} 
      />

      {/* 2. Selection Toolbar */}
      {selectionMode && selectedIds.length > 0 && (
        <div className="mb-6 flex items-center justify-between bg-blue-600 p-4 rounded-2xl text-white shadow-xl animate-in slide-in-from-top-4">
          <span className="font-bold text-sm">{selectedIds.length} assets selected</span>
          <div className="flex gap-2">
            <button onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-xs font-black transition-colors flex items-center gap-2">
              <Trash2 size={14} /> Delete Selected
            </button>
            <button onClick={() => setSelectedIds([])} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-black transition-colors">
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* 3. Media Grid */}
      {processedMedia.length === 0 ? (
        <div className="py-20 flex flex-col items-center opacity-40">
          <ImageIcon size={64} strokeWidth={1} />
          <p className="font-bold mt-4">No results found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {processedMedia.map((item: Media, index: number) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div 
                key={item.id} 
                className={`group relative rounded-2xl transition-all duration-300 ${
                  isSelected ? 'ring-4 ring-blue-500 ring-offset-2' : 'hover:scale-[1.02] hover:shadow-xl'
                }`}
              >
                <div 
                  className="aspect-square bg-gray-50 rounded-2xl overflow-hidden cursor-pointer relative"
                  onClick={() => {
                    if (selectionMode) {
                      setSelectedIds(prev => isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                    } else {
                      setActiveMedia(item);
                      setActiveIndex(index);
                    }
                  }}
                >
                  <img src={item.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" alt="" />
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10"><Play size={24} className="text-white fill-current" /></div>
                  )}
                  {selectionMode && (
                    <div className={`absolute top-3 left-3 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-black/20 border-white'}`}>
                      {isSelected && <CheckSquare size={14} className="text-white" />}
                    </div>
                  )}
                </div>

                {/* Inline Actions (Visible on hover) */}
                {!selectionMode && (
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <button onClick={() => setPendingMedia?.(item)} className="p-2 bg-white/95 backdrop-blur shadow-sm rounded-lg text-green-600 hover:bg-green-600 hover:text-white transition-all"><Plus size={16}/></button>
                    <button onClick={() => navigator.clipboard.writeText(item.url)} className="p-2 bg-white/95 backdrop-blur shadow-sm rounded-lg text-gray-600 hover:bg-gray-100 transition-all"><Copy size={16}/></button>
                    <button onClick={() => deleteMedia(item.id)} className="p-2 bg-white/95 backdrop-blur shadow-sm rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                  </div>
                )}

                <div className="mt-2 px-1">
                  <p className="text-[11px] font-bold text-gray-700 truncate">{item.name || 'Untitled'}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Upload Preview + Filter Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[400] bg-gray-900/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in-95">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8">
              <h3 className="text-xl font-black text-gray-900 mb-6">Preview Asset</h3>
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100 mb-6">
                <img 
                  src={URL.createObjectURL(previewFile)} 
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{
                    filter: 
                      activeUploadFilter === "grayscale" ? "grayscale(1)" :
                      activeUploadFilter === "sepia" ? "sepia(1)" :
                      activeUploadFilter === "vibrant" ? "saturate(1.8) contrast(1.1)" :
                      "none"
                  }}
                />
              </div>

              <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar py-1">
                {["none", "grayscale", "sepia", "vibrant"].map(f => (
                  <button 
                    key={f} onClick={() => setActiveUploadFilter(f)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeUploadFilter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPreviewFile(null)} className="flex-1 py-4 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">Cancel</button>
                <button onClick={processUpload} className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-bold shadow-xl shadow-green-600/20 flex items-center justify-center gap-2">
                   {isUploading ? <Loader2 className="animate-spin" size={18}/> : 'Finish & Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Lightbox Gallery Viewer */}
      {activeMedia && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
          <button onClick={() => setActiveMedia(null)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors z-10"><X size={32}/></button>
          
          <button onClick={goPrev} className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all"><ChevronLeft size={32}/></button>
          <button onClick={goNext} className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all"><ChevronRight size={32}/></button>

          <div className="max-w-4xl w-full flex flex-col items-center gap-8">
            <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl bg-black">
               {activeMedia.type === 'image' ? (
                 <img src={activeMedia.url} className="max-h-[70vh] mx-auto object-contain transition-all duration-500" alt="" />
               ) : (
                 <video src={activeMedia.url} controls autoPlay className="max-h-[70vh] w-full" />
               )}
            </div>

            <div className="flex flex-col items-center text-center">
              <h4 className="text-white font-black text-lg">{activeMedia.name}</h4>
              <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-bold">
                Asset {activeIndex! + 1} of {processedMedia.length} • {new Date(activeMedia.createdAt).toLocaleDateString()}
              </p>
              <div className="flex gap-4 mt-6">
                 <button onClick={() => setPendingMedia?.(activeMedia)} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-green-500 transition-all shadow-xl shadow-green-600/20">Insert Asset</button>
                 <button onClick={() => navigator.clipboard.writeText(activeMedia.url)} className="bg-white/10 text-white px-8 py-3 rounded-2xl font-black hover:bg-white/20 transition-all">Copy Link</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}