"use client";
import React, { useEffect } from 'react';
import { Search, X, FileText } from 'lucide-react';
import { Document } from './types';

export default function GlobalSearch({ system }: any) {
  if (!system.globalSearchOpen) return null;

  const isSearching = system.globalSearchQuery?.trim().length > 0;

  // Handle Escape Key for quick exit
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") system.setGlobalSearchOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [system]);

  const highlightText = (html: string, term: string): string => {
    if (!term) return html;
    const regex = new RegExp(`(${term})`, "gi");
    return html.replace(regex, `<mark class="bg-green-200 text-green-900 px-1 rounded">$1</mark>`);
  };

  const getSnippet = (content: string, term: string) => {
    if (!content) return "";
    const text = content.replace(/<[^>]+>/g, "");
    const index = text.toLowerCase().indexOf(term.toLowerCase());

    if (index === -1) return text.slice(0, 150);

    const start = Math.max(0, index - 40);
    return (start > 0 ? "..." : "") + text.slice(start, index + 100) + "...";
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-start justify-center pt-0 md:pt-24 z-[200] px-0 md:px-4 transition-all">
      <div className="bg-white w-full h-full md:h-auto md:max-w-2xl rounded-none md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        
        {/* Search Header */}
        <div className="p-4 md:p-5 border-b border-gray-100 flex items-center gap-3 bg-white">
          <Search size={20} className="text-green-500 shrink-0" />
          <input 
            type="text" 
            autoFocus 
            placeholder="Search documents, text, tags..." 
            value={system.globalSearchQuery} 
            onChange={(e) => system.setGlobalSearchQuery(e.target.value)} 
            className="flex-1 outline-none text-base font-medium placeholder:text-gray-400 text-gray-900 bg-transparent" 
          />
          <span className="text-xs text-gray-400 hidden md:block font-medium">ESC</span>
          <button 
            onClick={() => system.setGlobalSearchOpen(false)} 
            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Search Results Area */}
        <div className="flex-1 md:max-h-[60vh] overflow-y-auto p-2 bg-gray-50 flex flex-col gap-1">
          
          {isSearching && system.globalSearchResults?.length === 0 && (
            <div className="px-4 py-2 text-xs text-gray-400 animate-pulse font-medium">
              Searching...
            </div>
          )}

          {system.globalSearchResults?.length > 0 && (
            <div className="px-4 py-2 text-xs text-gray-400 font-medium">
              {system.globalSearchResults.length} results
            </div>
          )}

          {system.globalSearchResults?.length > 0 ? (
            system.globalSearchResults.map((doc: Document) => (
              <div 
                key={doc.id} 
                onClick={() => { 
                  system.setActiveDocId(doc.id); 
                  system.setView("editor"); 
                  system.setGlobalSearchOpen(false); 
                  system.setGlobalSearchQuery(""); 
                }} 
                className="p-4 bg-white hover:bg-gray-50 rounded-xl cursor-pointer flex gap-4 items-start transition-all border border-gray-100 hover:border-green-200 hover:shadow-sm active:scale-[0.98]"
              >
                <div className="p-2 bg-green-50 text-green-600 rounded-lg shrink-0 border border-green-100">
                  <FileText size={18} />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-gray-800 text-sm truncate">{doc.title || "Untitled"}</div>
                  
                  <div 
                    className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed font-medium" 
                    dangerouslySetInnerHTML={{ 
                      __html: highlightText(getSnippet(doc.content, system.globalSearchQuery), system.globalSearchQuery) 
                    }} 
                  />
                  
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {doc.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-gray-400 mt-2 font-semibold">
                    Open document →
                  </div>
                </div>
              </div>
            ))
          ) : isSearching ? (
            <div className="text-center py-16 text-gray-500 flex flex-col items-center">
              <Search size={28} className="text-gray-300 mb-3" />
              <span className="font-semibold text-sm text-gray-900">
                No results for "{system.globalSearchQuery}"
              </span>
              <p className="text-xs text-gray-400 mt-1">
                Try different keywords or remove filters
              </p>
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