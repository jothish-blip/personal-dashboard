import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function WipPopup({ showWipPopup, setShowWipPopup }: { showWipPopup: boolean, setShowWipPopup: (val: boolean) => void }) {
  if (!showWipPopup) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full relative">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Work in Progress</h2>
        </div>
        <p className="text-gray-600 text-base leading-relaxed mb-4">
          We are still working hard on this page, actively fixing bugs and pushing improvements. My team and I are currently developing these features.
        </p>
        <p className="text-gray-600 text-base leading-relaxed mb-6">
          If you find any issues, please contact:<br />
          <a href="mailto:jothishgandham2@gmail.com" className="text-green-500 font-semibold hover:underline">
            jothishgandham2@gmail.com
          </a>
        </p>
        <div className="mb-8">
          <p className="text-gray-800 font-bold">Regards,</p>
          <p className="text-gray-800 font-bold">Jothish Gandham</p>
        </div>
        <button 
          onClick={() => setShowWipPopup(false)} 
          className="w-full py-4 bg-green-500 text-white font-bold text-lg rounded-2xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30"
        >
          Acknowledge & Continue
        </button>
      </div>
    </div>
  );
}