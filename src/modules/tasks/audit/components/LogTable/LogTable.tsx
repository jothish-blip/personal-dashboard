"use client";

import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { Log } from "../../../types/index";
import { useTheme } from "@/theme/ThemeProvider";

interface LogTableProps {
  filteredLogs: Log[];
  deleteLog: (id: string | number) => void;
  resetFilters: () => void;
}

export default function LogTable({ filteredLogs, deleteLog, resetFilters }: LogTableProps) {
  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state

  return (
    <div className={`w-full border rounded-[20px] overflow-hidden shadow-sm flex flex-col max-h-[600px] transition-colors duration-300 ${
      isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
    }`}>
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className={`sticky top-0 z-20 border-b transition-colors ${
            isDarkMode ? "bg-[#1a1a1a] border-gray-800" : "bg-gray-50 border-gray-200"
          }`}>
            <tr>
              <th className={`p-4 text-xs font-medium uppercase tracking-wide w-12 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Sr.No</th>
              <th className={`p-4 text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Time</th>
              <th className={`p-4 text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Event</th>
              <th className={`p-4 text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Objective</th>
              <th className={`p-4 text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Payload</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className={`divide-y transition-colors ${isDarkMode ? "divide-gray-800" : "divide-gray-100"}`}>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, index) => {
                const rowId = log.id || `${log.time}-${index}`;
                return (
                  <tr key={rowId} className={`group transition-colors ${
                    isDarkMode ? "hover:bg-[#1a1a1a]" : "hover:bg-gray-50"
                  }`}>
                    <td className={`p-4 text-xs font-medium text-center ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                      {filteredLogs.length - index}
                    </td>
                    <td className={`p-4 text-xs whitespace-nowrap ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {new Date(log.time).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wide border ${
                        log.action === 'DELETE' 
                          ? (isDarkMode ? 'bg-red-950/30 text-red-400 border-red-900/50' : 'bg-red-50 text-red-600 border-transparent') :
                        log.action === 'CREATE' 
                          ? (isDarkMode ? 'bg-green-950/30 text-emerald-400 border-green-900/50' : 'bg-green-50 text-green-600 border-transparent') :
                        (isDarkMode ? 'bg-orange-950/30 text-orange-400 border-orange-900/50' : 'bg-orange-50 text-orange-600 border-transparent')
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className={`p-4 text-sm font-medium max-w-[200px] truncate ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} title={log.name}>
                      {log.name}
                    </td>
                    <td className={`p-4 text-xs max-w-sm truncate ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} title={log.detail}>
                      {log.detail}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => {
                          if (confirm("Delete this log entry?")) {
                            deleteLog(rowId);
                          }
                        }} 
                        className={`p-2 transition-colors ${
                          isDarkMode ? "text-gray-600 hover:text-red-400" : "text-gray-400 hover:text-red-500"
                        }`}
                        title="Delete entry"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-24 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle size={32} className={isDarkMode ? "text-gray-700" : "text-gray-300"} />
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>No events recorded in selected range</p>
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Adjust filters or continue activity</p>
                    </div>
                    <button onClick={resetFilters} className="mt-2 text-xs text-orange-500 font-medium hover:underline">Reset Filters</button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={`p-4 border-t flex justify-between items-center transition-colors ${
        isDarkMode ? "bg-[#1a1a1a] border-gray-800" : "bg-gray-50 border-gray-200"
      }`}>
        <span className={`text-[10px] font-medium uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Active Engine: v12.6.4</span>
        <span className={`text-[10px] font-medium uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{filteredLogs.length} Events Listed</span>
      </div>
    </div>
  );
}