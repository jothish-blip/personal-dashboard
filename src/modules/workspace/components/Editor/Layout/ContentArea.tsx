import React from 'react';
import { EditorContent } from '@tiptap/react';
import '../styles/editor.css';

interface ContentAreaProps {
  editor: any;
  maxWidthClass: string;
  isDarkMode: boolean;
  keyboardOpen: boolean;
  lineHeight: number;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
}

export const ContentArea: React.FC<ContentAreaProps> = ({ 
  editor, maxWidthClass, isDarkMode, keyboardOpen, lineHeight, handleTouchStart, handleTouchEnd 
}) => {
  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`pm-editor-container ${maxWidthClass} w-full mx-auto px-3 md:px-4 transition-all duration-300 ease-out pt-2 pb-[10rem] ${keyboardOpen ? 'translate-y-[-16px]' : ''}`}
      style={{
        '--editor-bg': isDarkMode ? '#0a0a0a' : '#ffffff',
        '--editor-text': isDarkMode ? '#f3f4f6' : '#111827',
        '--editor-heading': isDarkMode ? '#ffffff' : '#111827',
        '--editor-selection-bg': isDarkMode ? '#064e3b' : '#bbf7d0',
        '--editor-selection-text': isDarkMode ? '#dcfce7' : '#14532d',
        '--editor-quote-text': isDarkMode ? '#9ca3af' : '#4b5563',
        '--editor-code-bg': isDarkMode ? '#111827' : '#f9fafb',
        '--editor-code-border': isDarkMode ? '#374151' : '#e5e7eb',
        '--editor-placeholder': isDarkMode ? '#6b7280' : '#9ca3af',
        '--editor-line-height': lineHeight.toString()
      } as React.CSSProperties}
    >
      <div className={`relative rounded-[2rem] md:rounded-[3rem] shadow-sm transition-all duration-500 border ${
        isDarkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-white border-gray-200"
      }`}>
        <EditorContent editor={editor} className="prose prose-lg max-w-none focus:outline-none" />
      </div>
    </div>
  );
};