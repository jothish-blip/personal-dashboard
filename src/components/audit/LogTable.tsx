import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { Log } from '../../types';

interface LogTableProps {
  filteredLogs: Log[];
  deleteLog: (id: string | number) => void;
  resetFilters: () => void;
}

export default function LogTable({ filteredLogs, deleteLog, resetFilters }: LogTableProps) {
  return (
    <div className="w-full border border-gray-200 rounded-[20px] overflow-hidden bg-white shadow-sm flex flex-col max-h-[600px]">
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-20 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide w-12 text-center">Sr.No</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Time</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Event</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Objective</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Payload</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, index) => {
                const rowId = log.id || `${log.time}-${index}`;
                return (
                  <tr key={rowId} className="group transition-colors hover:bg-gray-50">
                    <td className="p-4 text-xs font-medium text-gray-500 text-center">
                      {filteredLogs.length - index}
                    </td>
                    <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.time).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wide ${
                        log.action === 'DELETE' ? 'bg-red-50 text-red-600' :
                        log.action === 'CREATE' ? 'bg-green-50 text-green-600' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-700 max-w-[200px] truncate" title={log.name}>{log.name}</td>
                    <td className="p-4 text-xs text-gray-500 max-w-sm truncate" title={log.detail}>{log.detail}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => {
                          if (confirm("Delete this log entry?")) {
                            deleteLog(rowId);
                          }
                        }} 
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
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
                    <AlertCircle size={32} className="text-gray-300" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">No events recorded in selected range</p>
                      <p className="text-xs text-gray-400 mt-1">Adjust filters or continue activity</p>
                    </div>
                    <button onClick={resetFilters} className="mt-2 text-xs text-orange-500 font-medium hover:underline">Reset Filters</button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Active Engine: v12.6.4</span>
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{filteredLogs.length} Events Listed</span>
      </div>
    </div>
  );
}