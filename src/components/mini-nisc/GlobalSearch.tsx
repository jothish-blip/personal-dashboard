import React from 'react';
import { Search, X, FileText } from 'lucide-react';
import { Document } from './types';

export default function GlobalSearch({ system }: any) {
  if (!system.globalSearchOpen) return null;

  const highlightText = (html: string, term: string): string => {
    if (!term) return html;
    const regex = new RegExp(`(${term})`, "gi");
    return html.replace(regex, `<mark class="bg-green-200 text-green-900 px-1 rounded">$1</mark>`);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-start justify-center pt-0 md:pt-24 z-[200] px-0 md:px-4 transition-all">
      <div className="bg-white w-full h-full md:h-auto md:max-w-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        <div className="p-4 md:p-5 border-b border-gray-100 flex items-center gap-3 bg-white">
          <Search size={20} className="text-green-500 shrink-0" />
          <input 
            type="text" 
            autoFocus 
            placeholder="Search documents, text, tags..." 
            value={system.globalSearchQuery} 
            onChange={(e) => system.setGlobalSearchQuery(e.target.value)} 
            className="flex-1 outline-none text-base font-semibold placeholder:text-gray-300 text-gray-800" 
          />
          <button 
            onClick={() => system.setGlobalSearchOpen(false)} 
            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 md:max-h-[60vh] overflow-y-auto p-2 bg-gray-50">
          {system.globalSearchResults.length > 0 ? (
            system.globalSearchResults.map((doc: Document) => (
              <div 
                key={doc.id} 
                onClick={() => { system.setActiveDocId(doc.id); system.setView("editor"); system.setGlobalSearchOpen(false); system.setSearch(""); }} 
                className="p-4 hover:bg-white hover:shadow-sm rounded-xl cursor-pointer flex gap-4 items-start transition-all border border-transparent hover:border-gray-200"
              >
                <div className="p-2 bg-green-50 text-green-600 rounded-lg shrink-0 border border-green-100">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-gray-800 text-sm truncate">{doc.title}</div>
                  <div 
                    className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed font-medium" 
                    dangerouslySetInnerHTML={{ __html: highlightText(doc.content.replace(/<[^>]+>/g, "").slice(0, 150) + "...", system.globalSearchQuery) }} 
                  />
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {doc.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-500 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : system.globalSearchQuery ? (
            <div className="text-center py-16 text-gray-500 flex flex-col items-center">
              <Search size={28} className="text-gray-300 mb-3" />
              <span className="font-semibold text-sm">No matches found for "{system.globalSearchQuery}"</span>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 text-xs">
              <span className="font-bold text-gray-500 mb-1 block text-sm">Quick Search Mode</span>
              Find anything across your workspace instantly.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}