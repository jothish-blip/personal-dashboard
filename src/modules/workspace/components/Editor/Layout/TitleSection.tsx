import React, { useState } from 'react';
import { Pin, Copy } from 'lucide-react';
import { ConvertMenu } from '../Menus/ConvertMenu';

interface TitleSectionProps {
  activeDocument: any;
  activeDocId: string;
  updateDocumentTitle: (id: string, title: string) => void;
  isDarkMode: boolean;
  keyboardOpen: boolean;
  system: any;
  editor: any;
  lastSavedTime: string;
  maxWidthClass: string;
}

export const TitleSection: React.FC<TitleSectionProps> = ({ 
  activeDocument, activeDocId, updateDocumentTitle, isDarkMode, keyboardOpen, system, editor, lastSavedTime, maxWidthClass 
}) => {
  const [showConvertMenu, setShowConvertMenu] = useState(false);

  return (
    <div className={`${maxWidthClass} w-full mx-auto px-4 pt-6 md:pt-10 pb-4 transition-all duration-500`}>
      <div className={`border rounded-[2rem] md:rounded-[2.5rem] shadow-sm p-8 ${isDarkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-white border-gray-200"}`}>
        <input
          type="text"
          value={activeDocument.title}
          onChange={(e) => updateDocumentTitle(activeDocId, e.target.value)}
          className={`w-full text-4xl md:text-5xl font-black bg-transparent border-b-2 outline-none pb-4 focus:border-green-500 transition-colors ${
            isDarkMode ? "text-white border-gray-800 placeholder-gray-700" : "text-gray-900 border-gray-100 placeholder-gray-300"
          }`}
          placeholder="Untitled Note"
        />

        {!keyboardOpen && (
          <>
            <div className={`flex items-center gap-4 mt-4 text-xs font-medium transition-all duration-300 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
              <button onClick={() => system.togglePin?.(activeDocument.id)} className={`flex items-center gap-1.5 transition-colors active:scale-95 ${
                activeDocument.isPinned ? (isDarkMode ? 'text-emerald-500' : 'text-green-600') : (isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-900')
              }`}>
                <Pin size={14} className={activeDocument.isPinned ? (isDarkMode ? 'fill-emerald-500' : 'fill-green-600') : ''} /> {activeDocument.isPinned ? 'Pinned' : 'Pin'}
              </button>
              <button onClick={() => navigator.clipboard.writeText(editor.getText())} className={`flex items-center gap-1.5 transition-colors active:scale-95 ${isDarkMode ? "hover:text-gray-300" : "hover:text-gray-900"}`}>
                <Copy size={14} /> Copy
              </button>
              <div className={`w-px h-3 mx-1 ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`}></div>
              
              <div className="relative convert-menu-container">
                <button onClick={() => setShowConvertMenu(!showConvertMenu)} className={`flex items-center gap-1.5 transition-colors active:scale-95 ${isDarkMode ? "hover:text-emerald-500" : "hover:text-green-600"}`}>
                  Convert
                </button>
                <ConvertMenu showConvertMenu={showConvertMenu} setShowConvertMenu={setShowConvertMenu} isDarkMode={isDarkMode} editor={editor} activeDocument={activeDocument} />
              </div>
            </div>
            
            <div className={`text-xs mt-2 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>Last edited: {lastSavedTime || "just now"}</div>
          </>
        )}
      </div>
    </div>
  );
};