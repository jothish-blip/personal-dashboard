import React, { useEffect } from 'react';
import { BookOpen, Folder, FileText, UploadCloud, History, BarChart2, X } from 'lucide-react';

interface WorkspaceGuideProps {
  showWipPopup: boolean;
  setShowWipPopup: (val: boolean) => void;
}

export function WipPopup({ showWipPopup, setShowWipPopup }: WorkspaceGuideProps) {
  
  // Smart UX: Automatically hide if they've already seen it
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("workspace_guide_seen");
    if (hasSeenGuide && showWipPopup) {
      setShowWipPopup(false);
    }
  }, [showWipPopup, setShowWipPopup]);

  const handleClose = () => {
    localStorage.setItem("workspace_guide_seen", "true");
    setShowWipPopup(false);
  };

  if (!showWipPopup) return null;

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-white/70 backdrop-blur-sm p-0 md:p-4 transition-opacity"
    >
      {/* Keyboard & Scroll Safe Container - Bottom Sheet on Mobile */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white p-5 md:p-8 rounded-t-[2rem] md:rounded-3xl shadow-2xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto scrollbar-hide border border-slate-100 animate-in slide-in-from-bottom-8 md:zoom-in-95"
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500 rounded-t-[2rem] md:rounded-t-3xl" />
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 mt-2">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600">
              <BookOpen size={24} />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Your Workspace Guide</h2>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-500 text-sm mb-6 font-medium">
          Start organizing your work efficiently. Here is what you can do in your new workspace:
        </p>

        {/* Structured Content Blocks */}
        <div className="space-y-5 text-sm text-gray-600 mb-8">
          
          <div className="flex gap-3 items-start">
            <Folder className="text-orange-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold text-gray-900">Organize Files</p>
              <p className="mt-0.5 leading-relaxed">Create folders and manage all your content easily in one place.</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <FileText className="text-orange-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold text-gray-900">Write Notes</p>
              <p className="mt-0.5 leading-relaxed">Create and edit notes inside folders anytime. Everything is saved.</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <UploadCloud className="text-orange-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold text-gray-900">Upload Media</p>
              <p className="mt-0.5 leading-relaxed">Add images and files directly to your workspace for quick access.</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <History className="text-orange-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold text-gray-900">View History</p>
              <p className="mt-0.5 leading-relaxed">Track your changes and view previous versions of your work.</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <BarChart2 className="text-orange-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold text-gray-900">Check Analytics</p>
              <p className="mt-0.5 leading-relaxed">See your activity, track your progress, and understand your workflow.</p>
            </div>
          </div>

        </div>

        {/* Footer Action */}
        <div className="pt-2">
          <button 
            onClick={handleClose} 
            className="w-full py-4 bg-orange-500 text-white font-bold text-base rounded-xl hover:bg-orange-600 transition-all active:scale-[0.98] shadow-lg shadow-orange-500/20"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}