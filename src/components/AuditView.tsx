"use client";

import { Log, Meta } from '../types';

interface AuditProps {
  logs: Log[];
  meta: Meta;
  clearLogs: () => void;
}

export default function AuditView({ logs, meta, clearLogs }: AuditProps) {
  const getBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'text-green-700 bg-green-100';
      case 'DELETE': return 'text-red-700 bg-red-100';
      case 'TOGGLE': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5 overflow-hidden bg-gray-50 transition-colors">
      <div className="flex-1 overflow-auto border border-gray-200 rounded-xl bg-white shadow-sm transition-colors">
        <div className="overflow-x-auto min-w-full">
          <table className="min-w-[640px] w-full text-left">
            <thead className="bg-gray-50 sticky top-0 transition-colors">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Timestamp</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Action</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Target</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-10 text-gray-500">Audit trail empty.</td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    {/* The timestamp will now render full date and time perfectly */}
                    <td className="p-4 text-xs text-gray-500 whitespace-nowrap">{log.time}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${getBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-sm text-gray-900">{log.name}</td>
                    <td className="p-4 text-xs text-gray-500">{log.detail}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-col gap-3 justify-between items-start mt-4 shrink-0 sm:flex-row sm:items-center">
        {/* CHANGED: Updated the label to reflect total history retention */}
        <span className="text-xs text-gray-500 font-medium">All historical events are retained.</span>
        <button onClick={clearLogs} className="text-red-500 text-xs font-black uppercase hover:text-red-600 transition-colors">
          PURGE HISTORY
        </button>
      </div>
    </div>
  );
}