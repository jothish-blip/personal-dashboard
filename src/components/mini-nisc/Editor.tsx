import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, CheckSquare, Circle, Image as ImageIcon, Undo, Redo, Zap, CheckCircle2, Plus, Tag, FileText } from 'lucide-react';
import { timeAgo, Media } from './types';

function ToolbarButton({ children, onClick, title, isActive }: { children: React.ReactNode; onClick: () => void; title?: string; isActive?: boolean }) {
  return (
    <button onClick={onClick} title={title} className={`p-1.5 md:p-2 rounded-lg flex items-center justify-center transition-colors font-medium border ${isActive ? "bg-green-50 text-green-600 border-green-200 shadow-sm" : "bg-transparent text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-800"}`}>
      {children}
    </button>
  );
}

export default function Editor({ system }: any) {
  const { activeDocument, activeDocId, updateDocumentTitle, updateDocumentContent, addTag, removeTag, saveState, lastSavedTime, createDocument, activeFolderId, setView, setDocuments } = system;
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const formatTimeout = useRef<NodeJS.Timeout | null>(null);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  useEffect(() => {
    if (editorRef.current && activeDocument) {
      if (editorRef.current.innerHTML !== activeDocument.content) {
        editorRef.current.innerHTML = activeDocument.content;
      }
    }
  }, [activeDocId]);

  const checkFormat = () => {
    if (formatTimeout.current) clearTimeout(formatTimeout.current);
    formatTimeout.current = setTimeout(() => {
      const formats = [];
      if (document.queryCommandState('bold')) formats.push('bold');
      if (document.queryCommandState('italic')) formats.push('italic');
      if (document.queryCommandState('underline')) formats.push('underline');
      setActiveFormats(formats);
    }, 100);
  };

  const execCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    editorRef.current.focus();
    setTimeout(() => {
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand(command, false, value);
      checkFormat();
      if (activeDocId) updateDocumentContent(activeDocId, editorRef.current!.innerHTML);
    }, 0);
  };

  const handleInput = () => {
    if (!editorRef.current || !activeDocId) return;
    const newContent = editorRef.current.innerHTML;
    if (newContent === activeDocument?.content) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => { updateDocumentContent(activeDocId, newContent); }, 500);
  };

  const insertElement = (html: string) => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    editorRef.current.focus();
    setTimeout(() => {
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("insertHTML", false, html);
      if (activeDocId) updateDocumentContent(activeDocId, editorRef.current!.innerHTML);
    }, 0);
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    checkFormat();
    const target = e.target as HTMLInputElement;
    if (target.type === "checkbox") {
      const taskItem = target.closest(".task-item");
      const taskText = taskItem?.querySelector(".task-text") as HTMLElement;
      if (taskText) {
        target.checked ? taskText.classList.add("line-through", "text-gray-400") : taskText.classList.remove("line-through", "text-gray-400");
      }
      if (activeDocId && editorRef.current) updateDocumentContent(activeDocId, editorRef.current.innerHTML);
    }
  };

  if (!activeDocument) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-gray-200 rounded-2xl">
        <FileText size={48} className="text-gray-300 mb-4" />
        <p className="text-gray-500 font-semibold">No document selected</p>
        <button onClick={() => createDocument(activeFolderId || undefined)} className="mt-4 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg hover:bg-green-600 transition-colors shadow-sm">Create New Document</button>
      </div>
    );
  }

  const words = activeDocument.content.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(words / 200);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => createDocument(activeFolderId || undefined)} className="text-xs font-semibold flex items-center gap-1.5 text-gray-500 hover:text-green-600 bg-gray-50 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-green-200 transition-colors shadow-sm"><Plus size={14}/> New Doc</button>
        <button onClick={() => setView("media")} className="text-xs font-semibold flex items-center gap-1.5 text-gray-500 hover:text-green-600 bg-gray-50 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-green-200 transition-colors shadow-sm"><ImageIcon size={14}/> Upload</button>
        <button onClick={() => document.getElementById('tag-input')?.focus()} className="text-xs font-semibold flex items-center gap-1.5 text-gray-500 hover:text-green-600 bg-gray-50 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-green-200 transition-colors shadow-sm"><Tag size={14}/> Tag</button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <input type="text" value={activeDocument.title} onChange={(e) => updateDocumentTitle(activeDocId!, e.target.value)} className="flex-1 text-3xl md:text-4xl font-bold tracking-tight bg-transparent outline-none border-b border-gray-200 pb-3 text-gray-800 focus:border-green-400 transition-colors" placeholder="Document Title" />
        <div className="flex flex-wrap items-center gap-2">
          {activeDocument.tags?.map((tag: string) => (
            <span key={tag} className="px-3 py-1 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold rounded-md flex items-center gap-1">#{tag}<button onClick={() => removeTag(activeDocument.id, tag)} className="text-gray-400 hover:text-red-500 transition-colors">×</button></span>
          ))}
          <input id="tag-input" type="text" placeholder="+ tag" className="text-xs px-3 py-1.5 bg-transparent border border-dashed border-gray-300 rounded-md w-24 focus:outline-none focus:border-green-400 focus:bg-green-50 transition-colors font-medium" onKeyDown={(e) => { if (e.key === "Enter") { addTag(activeDocument.id, e.currentTarget.value); e.currentTarget.value = ""; } }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 md:gap-2 bg-white border border-gray-200 rounded-xl p-2 shadow-sm sticky top-0 z-10">
        <ToolbarButton isActive={activeFormats.includes('bold')} onClick={() => execCommand("bold")} title="Bold"><Bold size={16} /></ToolbarButton>
        <ToolbarButton isActive={activeFormats.includes('italic')} onClick={() => execCommand("italic")} title="Italic"><Italic size={16} /></ToolbarButton>
        <ToolbarButton isActive={activeFormats.includes('underline')} onClick={() => execCommand("underline")} title="Underline"><Underline size={16} /></ToolbarButton>
        <div className="w-px h-6 bg-gray-200 mx-1 self-center" />
        <ToolbarButton onClick={() => execCommand("undo")} title="Undo"><Undo size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand("redo")} title="Redo"><Redo size={16} /></ToolbarButton>
        <div className="w-px h-6 bg-gray-200 mx-1 self-center" />
        <select onChange={(e) => insertElement(`<h${e.target.value} class="font-bold my-4 text-gray-800">Heading ${e.target.value}</h${e.target.value}>`)} className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 outline-none hover:border-gray-300 cursor-pointer focus:border-green-400">
          <option value="0">Normal</option><option value="1">H1</option><option value="2">H2</option><option value="3">H3</option>
        </select>
        <ToolbarButton onClick={() => setView("media")} title="Upload Media"><ImageIcon size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => insertElement(`<div class="task-item flex items-center gap-3 my-3"><input type="checkbox" class="w-5 h-5 accent-green-500 cursor-pointer" /> <span contenteditable="true" class="task-text">New task</span></div>`)} title="Task"><CheckSquare size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => insertElement(`<div class="flex items-center gap-3 my-2"><input type="radio" name="radio-group" class="w-5 h-5 accent-green-500 cursor-pointer" /> <span contenteditable="true">Option</span></div>`)} title="Radio"><Circle size={16} /></ToolbarButton>
      </div>

      <div className="relative">
        <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={handleInput} onClick={handleEditorClick} onKeyUp={checkFormat} onMouseUp={checkFormat} className="min-h-[400px] md:min-h-[500px] p-6 md:p-8 bg-white border border-gray-200 rounded-2xl text-gray-700 text-base leading-relaxed outline-none focus:border-green-400 focus:ring-4 ring-green-500/10 shadow-sm transition-all prose max-w-none" />
      </div>

      <div className="text-xs text-gray-400 font-semibold flex flex-wrap justify-between items-center px-2 pb-6">
        <span>{words} words • {readTime} min read</span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Edited {timeAgo(activeDocument.updatedAt)}</span>
          <span className="sm:hidden text-gray-300">|</span>
          <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${saveState === 'saving' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
            {saveState === 'saving' ? <Zap size={12} className="animate-pulse" /> : <CheckCircle2 size={12} />}
            {saveState === 'saving' ? 'Saving...' : `Saved at ${lastSavedTime || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
          </span>
        </div>
      </div>
    </div>
  );
}