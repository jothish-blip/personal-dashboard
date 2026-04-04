import React from 'react';
import { Clock } from 'lucide-react';

export default function HistoryView({ activeDocument, setDocuments, editorRef, setView }: any) {
  if (!activeDocument) return null;

  const restoreVersion = (historyEntry: any) => {
    setDocuments((prev: any[]) => prev.map(doc => doc.id === activeDocument.id ? { ...doc, content: historyEntry.content, updatedAt: Date.now() } : doc));
    if (editorRef?.current) editorRef.current.innerHTML = historyEntry.content;
    setView("editor");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-10 shadow-sm">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-gray-800"><Clock size={24} className="text-green-500" /> Version History</h2>
      <p className="text-xs text-gray-500 font-semibold mb-8 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg w-fit">Recent snapshots • Click to restore</p>
      <div className="space-y-4">
        {activeDocument.history && activeDocument.history.length > 0 ? (
          activeDocument.history.slice().reverse().map((entry: any, index: number) => (
            <div key={index} className="p-5 bg-white border border-gray-200 rounded-xl hover:border-green-400 hover:shadow-md transition-all flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 group">
              <div>
                <div className="font-bold text-gray-800 text-sm">{new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Version {activeDocument.history!.length - index}</div>
              </div>
              <button onClick={() => { if (confirm("Restore this version? Unsaved changes will be lost.")) restoreVersion(entry); }} className="text-xs font-bold px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-green-100 w-full sm:w-auto">Restore Backup</button>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
            <p className="font-semibold">No history recorded yet.</p>
            <p className="text-xs mt-1">Auto-saves will appear here as you edit.</p>
          </div>
        )}
      </div>
    </div>
  );
}