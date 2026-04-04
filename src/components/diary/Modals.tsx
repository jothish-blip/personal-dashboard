import React from 'react';
import { Lock, AlertTriangle } from 'lucide-react';

export function LockedScreen({ passwordAttempt, setPasswordAttempt }: any) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl text-center">
        <Lock className="mx-auto mb-4 text-red-500" size={48} />
        <h2 className="text-xl font-bold mb-2">This entry is locked</h2>
        <p className="text-gray-500 mb-6">Enter password to view private memory</p>
        <input 
          type="password" 
          value={passwordAttempt} 
          onChange={(e) => setPasswordAttempt(e.target.value)} 
          placeholder="Password" 
          className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-center mb-4 outline-none focus:border-orange-400 transition-colors" 
        />
        <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 transition-colors text-white font-semibold rounded-2xl shadow-md">
          Unlock
        </button>
        <p className="text-[10px] text-gray-400 mt-6">Demo password: <span className="font-mono">nex</span></p>
      </div>
    </div>
  );
}

export function WipPopup({ showWipPopup, setShowWipPopup }: { showWipPopup: boolean, setShowWipPopup: (val: boolean) => void }) {
  if (!showWipPopup) return null;
  
  return (
    <div className="fixed inset-0 z-[200] flex items-start md:items-center justify-center bg-black/40 backdrop-blur-sm px-4 overflow-y-auto">
      <div className="mt-8 md:mt-0 mb-8 bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full relative">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-orange-100 p-3 rounded-full text-orange-600">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Work in Progress</h2>
        </div>
        
        <p className="text-gray-600 text-base leading-relaxed mb-4">
          We are still working hard on this page, actively fixing bugs and pushing improvements. My team and I are currently developing these features.
        </p>
        
        <p className="text-gray-600 text-base leading-relaxed mb-6">
          If you find any issues, please contact:<br />
          <a href="mailto:jothishgandham2@gmail.com" className="text-orange-500 font-semibold hover:underline">
            jothishgandham2@gmail.com
          </a>
        </p>
        
        <div className="mb-8">
          <p className="text-gray-800 font-bold">Regards,</p>
          <p className="text-gray-800 font-bold">Jothish Gandham</p>
        </div>
        
        <button 
          onClick={() => setShowWipPopup(false)} 
          className="w-full py-4 bg-orange-500 text-white font-bold text-lg rounded-2xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30 active:scale-[0.98]"
        >
          Acknowledge & Continue
        </button>
      </div>
    </div>
  );
}