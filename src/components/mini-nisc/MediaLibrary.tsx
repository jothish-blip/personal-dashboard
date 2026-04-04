import React from 'react';
import { FolderOpen, AlertTriangle, Upload, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { Media } from './types';

export default function MediaLibrary({ system }: any) {
  const { activeFolderId, folders, mediaError, addMedia, filteredMedia, deleteMedia, activeDocId, setDocuments, setView } = system;

  const insertMedia = (mediaItem: Media) => {
    if (!activeDocId) return;
    // Note: Due to standard execCommand restrictions in split files, 
    // it's safer to let the user return to the editor to paste, 
    // or trigger a state update that the Editor component listens to.
    // For this rewrite, we will just switch them back to the editor.
    alert(`To insert this image into your document, copy this URL: ${mediaItem.url}`);
    setView("editor");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-800"><FolderOpen size={24} className="text-green-500" /> Media Library</h2>
          <div className="text-xs font-medium text-gray-500 mt-2 flex items-center gap-2 bg-gray-50 w-fit px-3 py-1.5 rounded-md border border-gray-200">
            📁 Target Folder: <span className="font-bold text-gray-700">{activeFolderId ? folders.find((f: any) => f.id === activeFolderId)?.name : "All Media"}</span>
          </div>
          {mediaError && <p className="text-red-500 text-xs mt-2 font-bold flex items-center gap-1"><AlertTriangle size={12}/> {mediaError}</p>}
        </div>
        <button onClick={() => document.getElementById("media-upload")?.click()} className="w-full md:w-auto px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition-colors shadow-sm">
          <Upload size={18} /> Upload File
        </button>
      </div>

      <input id="media-upload" type="file" accept="image/*,video/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) addMedia(file, insertMedia); e.target.value = ""; }} />

      {filteredMedia.length === 0 ? (
        <div className="text-center py-16 md:py-20 border-2 border-dashed border-gray-200 rounded-2xl px-4">
          <ImageIcon size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-bold text-gray-500 mb-1">No media found</p>
          <p className="text-xs text-gray-400 font-medium">{activeFolderId ? "Upload images or videos to this folder." : "Select a folder from the sidebar to start uploading."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item: Media) => (
            <div key={item.id} className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-green-300 transition-all">
              <div className="aspect-video bg-gray-50 flex items-center justify-center overflow-hidden">
                {item.type === "image" ? <img src={item.url} alt={item.name} className="w-full h-full object-cover" /> : <video src={item.url} className="w-full h-full object-cover" />}
              </div>
              <div className="p-3 border-t border-gray-100">
                <div className="text-xs font-bold text-gray-700 truncate">{item.name || `${item.type} file`}</div>
                <div className="text-[10px] font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">{new Date(item.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="absolute top-2 right-2 flex flex-col gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => insertMedia(item)} className="bg-white/90 backdrop-blur text-green-600 p-2 rounded-lg shadow-sm hover:bg-green-50 border border-gray-200 transition-colors" title="Insert into active document"><Plus size={14} /></button>
                <button onClick={() => deleteMedia(item.id)} className="bg-white/90 backdrop-blur text-red-500 p-2 rounded-lg shadow-sm hover:bg-red-50 border border-gray-200 transition-colors" title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}