import React from 'react';

interface ConvertMenuProps {
  showConvertMenu: boolean;
  setShowConvertMenu: (value: boolean) => void;
  isDarkMode: boolean;
  editor: any;
  activeDocument: any;
}

export const ConvertMenu: React.FC<ConvertMenuProps> = ({ showConvertMenu, setShowConvertMenu, isDarkMode, editor, activeDocument }) => {
  if (!showConvertMenu) return null;

  return (
    <div className={`absolute top-full mt-2 left-0 border rounded-xl shadow-lg p-2 min-w-[140px] z-50 animate-in slide-in-from-top-2 ${
      isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
    }`}>
      <button onClick={() => {
        const blob = new Blob([editor.getText()], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${activeDocument.title || 'note'}.txt`; a.click();
        URL.revokeObjectURL(url); setShowConvertMenu(false);
      }} className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors active:scale-95 ${
        isDarkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
      }`}>
        Export as TXT
      </button>
      <button onClick={() => { window.print(); setShowConvertMenu(false); }} className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors mt-1 active:scale-95 ${
        isDarkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
      }`}>
        Export as PDF
      </button>
    </div>
  );
};