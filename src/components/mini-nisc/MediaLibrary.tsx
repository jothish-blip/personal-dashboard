import React, { useState, useEffect } from 'react';
import { FolderOpen, AlertTriangle, Upload, Image as ImageIcon, Plus, Trash2, Play, Loader2 } from 'lucide-react';
import { Media } from './types';

export default function MediaLibrary({ system }: any) {
  const { 
    activeFolderId, 
    folders, 
    mediaError, 
    addMedia, 
    filteredMedia, 
    deleteMedia, 
    activeDocId, 
    setView,
    setPendingMedia 
  } = system;

  const [activeMedia, setActiveMedia] = useState<Media | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // CLEANUP: Revoke Object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      filteredMedia.forEach((item: Media) => {
        if (item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [filteredMedia]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // addMedia should handle the file -> URL conversion
      await addMedia(file); 
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const insertMedia = (mediaItem: Media) => {
    if (!activeDocId) {
      alert("Please open a document first to insert media.");
      return;
    }

    if (setPendingMedia) {
      setPendingMedia(mediaItem);
      setView("editor");
    } else {
      navigator.clipboard.writeText(mediaItem.url);
      alert("URL copied! Paste it in the editor.");
      setView("editor");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
            <FolderOpen size={24} className="text-green-500" /> 
            Media Library
          </h2>
          <div className="text-xs font-medium text-gray-500 mt-2 flex items-center gap-2 bg-gray-50 w-fit px-3 py-1.5 rounded-md border border-gray-200">
            📁 Target Folder: 
            <span className="font-bold text-gray-700">
              {activeFolderId ? folders.find((f: any) => f.id === activeFolderId)?.name : "All Media"}
            </span>
          </div>
          {mediaError && (
            <p className="text-red-500 text-xs mt-2 font-bold flex items-center gap-1">
              <AlertTriangle size={12} /> {mediaError}
            </p>
          )}
        </div>

        <button 
          disabled={isUploading}
          onClick={() => document.getElementById("media-upload")?.click()} 
          className={`w-full md:w-auto px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm ${isUploading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-600'}`}
        >
          {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
          {isUploading ? "Processing..." : "Upload File"}
        </button>
      </div>

      <input 
        id="media-upload" 
        type="file" 
        accept="image/*,video/*" 
        className="hidden" 
        onChange={handleFileUpload} 
      />

      {/* Grid Section */}
      {filteredMedia.length === 0 ? (
        <div className="text-center py-16 md:py-20 border-2 border-dashed border-gray-200 rounded-2xl px-4">
          <ImageIcon size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-bold text-gray-500 mb-1">No media found</p>
          <p className="text-xs text-gray-400 font-medium">
            {activeFolderId ? "Upload images or videos to this folder." : "Select a folder from the sidebar to start uploading."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item: Media) => (
            <div 
              key={item.id} 
              className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-green-300 transition-all"
            >
              <div 
                className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer relative"
                onClick={() => setActiveMedia(item)}
              >
                {item.type === "image" ? (
                  <img 
                    src={item.url} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <video src={item.url} muted className="w-full h-full object-cover" />
                )}

                {item.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play size={32} className="text-white drop-shadow-md" />
                  </div>
                )}

                <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-medium uppercase">
                  {item.type}
                </span>
              </div>

              <div className="p-3 border-t border-gray-100">
                <div className="text-xs font-bold text-gray-700 truncate">{item.name}</div>
                <div className="text-[10px] font-semibold text-gray-400 mt-0.5">
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => insertMedia(item)}
                  className="bg-white text-green-600 p-2 rounded-lg shadow-md hover:bg-green-50 border border-gray-100"
                  title="Insert"
                >
                  <Plus size={16} />
                </button>
                <button 
                  onClick={() => deleteMedia(item.id)}
                  className="bg-white text-red-500 p-2 rounded-lg shadow-md hover:bg-red-50 border border-gray-100"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Viewer */}
      {activeMedia && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveMedia(null)}
        >
          <button className="absolute top-6 right-6 text-white text-3xl">✕</button>
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            {activeMedia.type === "image" ? (
              <img src={activeMedia.url} className="w-full max-h-[85vh] object-contain rounded-lg" alt="" />
            ) : (
              <video src={activeMedia.url} controls autoPlay className="w-full max-h-[85vh] rounded-lg" />
            )}
            <p className="text-white mt-4 text-center font-medium">{activeMedia.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}