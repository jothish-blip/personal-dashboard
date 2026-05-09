import React from 'react';
import { FileSpreadsheet, FileJson, FileText, Trash2 } from 'lucide-react';

interface ExportControlsProps {
  handleExportCSV: () => void;
  handleExportJSON: () => void;
  handleExportSummary: () => void;
  clearLogs: () => void;
}

export default function ExportControls({
  handleExportCSV, handleExportJSON, handleExportSummary, clearLogs
}: ExportControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between mt-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-gray-500 mr-2">Export Data:</span>
        
        <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all text-gray-700 shadow-sm">
          <FileSpreadsheet size={14} className="text-green-600" /> CSV
        </button>
        
        <button onClick={handleExportJSON} className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all text-gray-700 shadow-sm">
          <FileJson size={14} className="text-orange-500" /> JSON Logs
        </button>
        
        <button onClick={handleExportSummary} className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all text-gray-700 shadow-sm">
          <FileText size={14} className="text-orange-500" /> Executive Summary
        </button>
      </div>

      <button 
        onClick={() => {
          if (confirm("Delete ALL audit logs? This cannot be undone.")) {
            clearLogs();
          }
        }}
        className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 text-red-600 shadow-sm transition-colors"
      >
        <Trash2 size={14} /> Clear All Logs
      </button>
    </div>
  );
}