import React from 'react';

interface ToolbarButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  title?: string;
  className?: string;
  isDarkMode: boolean;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  children, onClick, isActive, title, className = "", isDarkMode 
}) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    className={`p-1.5 md:p-2 rounded-lg flex items-center justify-center transition-all duration-200 border flex-shrink-0 active:scale-95 ${
      isActive
        ? isDarkMode 
            ? "bg-green-900/30 text-green-400 border-green-800" 
            : "bg-green-100 text-green-700 border-green-200 shadow-sm"
        : isDarkMode
            ? "bg-transparent text-gray-400 border-transparent hover:bg-[#1f1f1f] hover:text-white"
            : "bg-transparent text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900"
    } ${className}`}
  >
    {children}
  </button>
);