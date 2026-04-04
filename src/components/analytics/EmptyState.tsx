import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
      <AlertCircle size={32} className="text-gray-300 mb-4" />
      <p className="text-sm font-bold text-gray-600">No execution recorded for this range</p>
      <p className="text-xs font-bold text-gray-400 mt-1">Adjust filters or resume tasks.</p>
    </div>
  );
}