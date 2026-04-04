import React from 'react';
import { BarChart3, Activity } from 'lucide-react';

export default function Analytics({ documents, media }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-10 shadow-sm">
      <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-gray-800"><BarChart3 size={24} className="text-green-500" /> Workspace Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Documents</h3>
          <p className="text-4xl font-black text-gray-800">{documents.length}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Media</h3>
          <p className="text-4xl font-black text-gray-800">{media.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm">
          <Activity size={32} className="text-green-500 mb-2" />
          <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Insights Engine Active</p>
        </div>
      </div>
    </div>
  );
}