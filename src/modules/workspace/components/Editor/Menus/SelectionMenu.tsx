import React from 'react';
import { Editor } from '@tiptap/react';
import { Bold, Italic, Strikethrough, Underline as UnderlineIcon, Subscript as SubscriptIcon, Superscript as SuperscriptIcon, List, Link as LinkIcon, Highlighter } from 'lucide-react';
import { ToolbarButton } from '../Toolbar/ToolbarButton';

interface SelectionMenuProps {
  editor: Editor | null;
  showSelectionMenu: boolean;
  selectionCoords: { top: number; left: number };
  isDarkMode: boolean;
  setLink: () => void;
}

export const SelectionMenu: React.FC<SelectionMenuProps> = ({ editor, showSelectionMenu, selectionCoords, isDarkMode, setLink }) => {
  if (!showSelectionMenu || !editor) return null;

  return (
    <div 
      className={`fixed z-[110] flex flex-wrap items-center gap-1 border rounded-xl px-2 py-1.5 shadow-xl -translate-x-1/2 transition-all duration-150 ease-out animate-in zoom-in-95 ${
        isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
      }`}
      style={{ top: `${selectionCoords.top}px`, left: `${selectionCoords.left}px` }}
    >
      <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold size={16}/></ToolbarButton>
      <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic size={16}/></ToolbarButton>
      <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}><UnderlineIcon size={16}/></ToolbarButton>
      <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}><Strikethrough size={16}/></ToolbarButton>
      <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')}><SubscriptIcon size={14}/></ToolbarButton>
      <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')}><SuperscriptIcon size={14}/></ToolbarButton>

      <div className={`w-px h-4 mx-1 ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`} />

      <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>H1</ToolbarButton>
      <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>H2</ToolbarButton>
      <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })}>H3</ToolbarButton>

      <div className={`w-px h-4 mx-1 ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`} />

      <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}><List size={16}/></ToolbarButton>
      <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')}>☑</ToolbarButton>

      <div className={`w-px h-4 mx-1 ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`} />

      <ToolbarButton isDarkMode={isDarkMode} onClick={setLink} isActive={editor.isActive('link')}><LinkIcon size={16}/></ToolbarButton>
      <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')}><Highlighter size={16}/></ToolbarButton>
    </div>
  );
};