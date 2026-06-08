import React from 'react';
import { Plus } from 'lucide-react';
import { SLASH_COMMANDS } from '../constants';

interface QuickMenuProps {
  showQuickMenu: boolean;
  setShowQuickMenu: (val: boolean) => void;
  keyboardOpen: boolean;
  isDarkMode: boolean;
  handleSlashCommand: (cmd: string) => void;
}

export const QuickMenu: React.FC<QuickMenuProps> = ({ showQuickMenu, setShowQuickMenu, keyboardOpen, isDarkMode, handleSlashCommand }) => {
  return (
    <>
      <button
        onClick={() => setShowQuickMenu(!showQuickMenu)}
        className={`md:hidden fixed z-50 p-4 rounded-full shadow-xl transition-all duration-300 ease-out border bottom-[5.5rem] right-6 ${
          isDarkMode ? "bg-green-700 hover:bg-green-600 active:bg-green-800 text-white border-green-600" : "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white border-green-500"
        } ${keyboardOpen ? "opacity-0 scale-75 pointer-events-none translate-y-4" : "opacity-100 scale-100 translate-y-0"}`}
      >
        <Plus size={24} className={`transition-transform duration-200 ${showQuickMenu ? 'rotate-45' : 'rotate-0'}`} />
      </button>

      {showQuickMenu && (
        <div className={`md:hidden fixed right-6 z-50 rounded-2xl shadow-2xl border py-2 w-56 animate-in slide-in-from-bottom-4 fade-in duration-200 bottom-[11rem] ${
          isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
        }`}>
          {SLASH_COMMANDS.map((item, i) => {
            // Extract the icon to a capitalized variable so React treats it as a component
            const IconComponent = item.icon; 
            
            return (
              <button
                key={i}
                onClick={() => { handleSlashCommand(item.cmd); setShowQuickMenu(false); }}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 text-sm font-medium transition-colors ${
                  isDarkMode ? "hover:bg-green-900/30 active:bg-green-900/50 text-gray-300" : "hover:bg-green-50 active:bg-green-100 text-gray-700"
                }`}
              >
                <span className={isDarkMode ? "text-green-500" : "text-green-600"}>
                  {/* If it's a string ("☑"), render the string. Otherwise, render the Lucide component */}
                  {typeof IconComponent === "string" ? IconComponent : <IconComponent size={18} />}
                </span>
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </>
  );
};