"use client";
import React, { useState, useMemo } from 'react';
import { Files, Search, Activity, X } from 'lucide-react';

export default function HistoryView(props: any) {
  const documents = props.documents || props.system?.documents || [];
  const setDocuments = props.setDocuments || props.system?.setDocuments;
  const setView = props.setView || props.system?.setView;
  const setActiveDocId = props.setActiveDocId || props.system?.setActiveDocId;

  const [filterType, setFilterType] = useState<'all' | 'month' | 'year'>('all');
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated' | 'words'>('updated');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [selectedLogDoc, setSelectedLogDoc] = useState<any>(null); // 🔥 For Log Panel

  // 1. Core Filtering
  const filteredDocs = useMemo(() => {
    const now = new Date();
    return documents.filter((doc: any) => {
      if (search && !doc.title?.toLowerCase().includes(search.toLowerCase())) return false;
      const date = new Date(doc.updatedAt || doc.createdAt || Date.now());
      if (filterType === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (filterType === 'year') return date.getFullYear() === now.getFullYear();
      return true;
    });
  }, [documents, filterType, search]);

  // 2. Sorting Logic
  const sortedDocs = useMemo(() => {
    const docs = [...filteredDocs];
    if (sortBy === 'name') return docs.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    if (sortBy === 'created') return docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (sortBy === 'updated') return docs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    if (sortBy === 'words') {
      return docs.sort((a, b) => {
        const wcA = a.content ? a.content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length : 0;
        const wcB = b.content ? b.content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length : 0;
        return wcB - wcA;
      });
    }
    return docs;
  }, [filteredDocs, sortBy]);

  // 3. Selection Actions
  const toggleSelect = (id: string) => {
    setSelectedDocs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedDocs.length === sortedDocs.length) setSelectedDocs([]);
    else setSelectedDocs(sortedDocs.map((d: any) => d.id));
  };

  // 4. Bulk Actions (with Logs!)
  const bulkDelete = () => {
    if (!setDocuments || !confirm(`Soft delete ${selectedDocs.length} documents?`)) return;
    setDocuments((prev: any[]) => prev.map(doc => {
      if (selectedDocs.includes(doc.id)) {
        return { 
          ...doc, 
          deletedAt: Date.now(),
          logs: [...(doc.logs || []), { type: "deleted", timestamp: Date.now() }].slice(-50)
        };
      }
      return doc;
    }));
    setSelectedDocs([]);
  };

  const bulkRestore = () => {
    if (!setDocuments) return;
    setDocuments((prev: any[]) => prev.map(doc => {
      if (selectedDocs.includes(doc.id)) {
        return { 
          ...doc, 
          deletedAt: undefined,
          logs: [...(doc.logs || []), { type: "restored", timestamp: Date.now() }].slice(-50)
        };
      }
      return doc;
    }));
    setSelectedDocs([]);
  };

  const formatDate = (dateString: string | number | undefined | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // 🔥 Format Log Function
  const formatLog = (log: any) => {
    switch (log.type) {
      case "created": return "📄 Created document";
      case "edited": return "✏️ Edited content";
      case "deleted": return "🗑️ Deleted document";
      case "restored": return "♻️ Restored document";
      case "renamed": return `✏️ Renamed to "${log.meta?.title}"`;
      case "tag_added": return `🏷️ Added tag "${log.meta?.tag}"`;
      case "tag_removed": return `🏷️ Removed tag "${log.meta?.tag}"`;
      case "pinned": return "📌 Pinned document";
      case "unpinned": return "📌 Unpinned document";
      default: return log.type;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Files size={24} className="text-gray-900" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">File History Overview</h2>
        </div>

        {/* Top Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-200 pl-9 pr-3 py-2 rounded-xl text-sm w-full outline-none focus:border-green-500 bg-gray-50"
              />
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="border border-gray-200 px-3 py-2 rounded-xl text-sm outline-none focus:border-green-500 bg-gray-50 text-gray-700 cursor-pointer">
              <option value="updated">Sort by Updated</option>
              <option value="created">Sort by Created</option>
              <option value="name">Sort by Name</option>
              <option value="words">Sort by Words</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex gap-2">
              <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filterType === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
              <button onClick={() => setFilterType('month')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filterType === 'month' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>This Month</button>
              <button onClick={() => setFilterType('year')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filterType === 'year' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>This Year</button>
            </div>

            {selectedDocs.length > 0 && (
              <div className="flex gap-2 animate-in fade-in duration-200">
                <button onClick={bulkDelete} className="text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100">Delete ({selectedDocs.length})</button>
                <button onClick={bulkRestore} className="text-xs font-bold bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100">Restore ({selectedDocs.length})</button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">
                  <input type="checkbox" checked={sortedDocs.length > 0 && selectedDocs.length === sortedDocs.length} onChange={toggleSelectAll} className="cursor-pointer rounded border-gray-300 text-green-600 focus:ring-green-500"/>
                </th>
                <th className="text-left py-3 px-4">File Name</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Updated</th>
                <th className="text-left py-3 px-4">Words</th>
                <th className="text-left py-3 px-4">Action</th>
                <th className="text-left py-3 px-4">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedDocs.length > 0 ? (
                sortedDocs.map((doc: any) => {
                  const wordCount = doc.content ? doc.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length : 0;
                  const isSelected = selectedDocs.includes(doc.id);
                  const isViewingLogs = selectedLogDoc?.id === doc.id;

                  return (
                    <tr key={doc.id} className={`transition-colors group ${isViewingLogs ? 'bg-blue-50/50' : isSelected ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="py-3 px-4 text-center">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(doc.id)} className="cursor-pointer rounded border-gray-300 text-green-600 focus:ring-green-500"/>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800 truncate max-w-[200px]" title={doc.title || "Untitled"}>{doc.title || "Untitled"}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${doc.deletedAt ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"}`}>
                          {doc.deletedAt ? "Deleted" : "Active"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(doc.updatedAt)}</td>
                      <td className="py-3 px-4 text-gray-600 font-medium">{wordCount}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => { if (setActiveDocId && setView) { setActiveDocId(doc.id); setView("editor"); } }} className="text-xs font-bold text-green-600 hover:underline">
                          Open
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <button onClick={() => setSelectedLogDoc(doc)} className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1.5">
                            <Activity size={12} /> View Logs
                          </button>
                          <span className="text-[10px] text-gray-400 font-medium ml-1">{doc.logs?.length || 0} entries</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400 bg-gray-50/50">
                    <p className="font-medium text-gray-500 mb-1">No documents found</p>
                    <p className="text-xs">Adjust your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 🔥 Log View Panel */}
        {selectedLogDoc && (
          <div className="mt-8 border border-gray-200 rounded-2xl p-6 bg-gray-50 shadow-inner animate-in fade-in slide-in-from-bottom-4 relative">
            <button onClick={() => setSelectedLogDoc(null)} className="absolute top-4 right-4 p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-blue-500" />
              Activity Logs — <span className="text-gray-500 font-medium truncate max-w-[200px] md:max-w-md">{selectedLogDoc.title || "Untitled"}</span>
            </h3>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
              {selectedLogDoc.logs && selectedLogDoc.logs.length > 0 ? (
                selectedLogDoc.logs.slice().reverse().map((log: any, i: number) => (
                  <div key={i} className="text-xs flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-blue-100 transition-colors">
                    <span className="font-semibold text-gray-700">{formatLog(log)}</span>
                    <span className="text-gray-400 font-medium">{formatDate(log.timestamp)}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs font-medium">
                  No activity recorded for this document yet.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}