import React from 'react';
import { Lock, BookOpen } from 'lucide-react';

export function LockedScreen({ passwordAttempt, setPasswordAttempt }: any) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-[24px] shadow-xl text-center border border-gray-100">
        <div className="bg-red-50 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6">
          <Lock className="text-red-500" size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 tracking-tight">Entry is Locked</h2>
        <p className="text-sm font-medium text-gray-500 mb-8">Enter your password to view this private memory</p>
        
        <div className="space-y-4">
          <input 
            type="password" 
            value={passwordAttempt} 
            onChange={(e) => setPasswordAttempt(e.target.value)} 
            placeholder="Password" 
            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-center text-sm font-bold outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all shadow-sm" 
          />
          <button className="w-full py-3.5 bg-gray-900 hover:bg-black transition-colors text-white font-bold text-sm rounded-xl shadow-md active:scale-[0.98]">
            Unlock Memory
          </button>
        </div>
        
        <p className="text-[10px] font-bold text-gray-400 mt-8 uppercase tracking-widest">
          Demo password: <span className="font-mono text-orange-500">nex</span>
        </p>
      </div>
    </div>
  );
}

export function WipPopup({ showWipPopup, setShowWipPopup }: { showWipPopup: boolean, setShowWipPopup: (val: boolean) => void }) {
  if (!showWipPopup) return null;
  
  return (
    <div className="fixed inset-0 z-[200] flex items-start md:items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4 overflow-y-auto">
      <div className="mt-12 md:mt-0 mb-8 bg-white p-6 sm:p-8 rounded-[24px] shadow-2xl max-w-md w-full relative animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600 shadow-sm shrink-0">
            <BookOpen size={24} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">How to use your Diary</h2>
        </div>
        
        <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
          This is not just a diary — it tracks your behavior, patterns, and progress over time.
        </p>
        
        {/* Step-by-Step Guide */}
        <div className="text-left space-y-5 text-sm text-gray-700 mb-8">
          <div className="flex gap-4 items-start">
            <span className="text-xl leading-none pt-0.5">🔹</span>
            <div>
              <p className="font-bold text-gray-900">1. Set your state</p>
              <p className="text-gray-500 font-medium mt-1 leading-relaxed">Select your mood, energy, and focus before writing.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <span className="text-xl leading-none pt-0.5">✍️</span>
            <div>
              <p className="font-bold text-gray-900">2. Write your day</p>
              <p className="text-gray-500 font-medium mt-1 leading-relaxed">Fill morning, afternoon, and evening to capture your real day.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <span className="text-xl leading-none pt-0.5">🔒</span>
            <div>
              <p className="font-bold text-gray-900">3. Close your day</p>
              <p className="text-gray-500 font-medium mt-1 leading-relaxed">Click “Close Day” to lock the entry and generate insights.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <span className="text-xl leading-none pt-0.5">📜</span>
            <div>
              <p className="font-bold text-gray-900">4. Review history</p>
              <p className="text-gray-500 font-medium mt-1 leading-relaxed">Scroll down to the timeline to revisit and replay your past days.</p>
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <button 
          onClick={() => setShowWipPopup(false)} 
          className="w-full py-3.5 bg-orange-500 text-white font-bold text-sm rounded-xl hover:bg-orange-600 transition-all shadow-md active:scale-[0.98]"
        >
          Start Using Diary
        </button>

        {/* Privacy Trust Signal */}
        <p className="text-[10px] font-bold text-gray-400 text-center mt-5 uppercase tracking-wider">
          Your entries are saved automatically and stay private on your device.
        </p>
      </div>
    </div>
  );
}