import React from 'react';
import { FileText, ChevronDown, Check } from 'lucide-react';
import { WORKSPACE_VIEWS } from '../constants';

interface ViewSwitcherProps {
  system: any;
  showViewMenu: boolean;
  setShowViewMenu: (value: boolean) => void;
  isDarkMode: boolean;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ system, showViewMenu, setShowViewMenu, isDarkMode }) => {
  return (
    <div className="relative view-menu-container">
      <button 
        onClick={() => setShowViewMenu(!showViewMenu)} 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold active:scale-95 transition-all ${
          isDarkMode 
            ? "bg-[#1f1f1f] border border-gray-800 text-white hover:bg-gray-800" 
            : "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm"
        }`}
      >
        <FileText size={14} className="text-orange-500" />
        <span className="hidden sm:inline">Editor</span>
        <ChevronDown size={14} className="opacity-50" />
      </button>

      {showViewMenu && (
        <div className={`absolute top-full mt-2 left-0 w-48 border rounded-xl shadow-xl py-1.5 z-50 animate-in slide-in-from-top-2 ${
          isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
        }`}>
          {WORKSPACE_VIEWS.map((v) => {
            const isActive = system.view === v.id;
            const Icon = v.icon;
            return (
              <button 
                key={v.id}
                onClick={() => { system.setView(v.id); setShowViewMenu(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive 
                    ? (isDarkMode ? "text-orange-500 bg-orange-500/10" : "text-orange-600 bg-orange-50") 
                    : (isDarkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-50")
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={14} className={isActive ? "text-orange-500" : "opacity-50"} /> 
                  {v.label}
                </div>
                {isActive && <Check size={14} className="text-orange-500" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  );
};