
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  Bold, Italic, Strikethrough, Highlighter, Undo, Redo, RotateCcw,
  Heading1, Heading2, List, Terminal, Minus, Plus, Eye, EyeOff, MoreHorizontal
} from 'lucide-react';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize: size }).run();
      },
    };
  },
});

const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    bulletList: { keepMarks: true },
    orderedList: { keepMarks: true },
  }),
  TextStyle,
  FontSize, 
  Color,
  FontFamily,
  Subscript,
  Superscript,
  Highlight.configure({ multicolor: true }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Placeholder.configure({ placeholder: "Type '/' for commands or start writing..." }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  CharacterCount,
];

const ToolbarButton = ({ children, onClick, isActive, title, className = "" }: any) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    className={`p-2 md:p-3 rounded-xl flex items-center justify-center transition-all duration-200 border active:bg-gray-100 md:hover:bg-gray-50 flex-shrink-0 ${
      isActive
        ? "bg-green-100 text-green-700 border-green-200 shadow-sm"
        : "bg-transparent text-gray-600 border-transparent hover:bg-gray-50"
    } ${className}`}
  >
    {children}
  </button>
);

const GroupLabel = ({ children }: { children: string }) => (
  <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest absolute -top-3 left-2 bg-white px-1">
    {children}
  </span>
);

const SLASH_COMMANDS = [
  { label: "Heading 1", cmd: 'h1', icon: <Heading1 size={18} /> },
  { label: "Heading 2", cmd: 'h2', icon: <Heading2 size={18} /> },
  { label: "To-do List", cmd: 'todo', icon: "☑" },
  { label: "Quote", cmd: 'quote', icon: '"' },
  { label: "Divider", cmd: 'divider', icon: <Minus size={18} /> },
  { label: "Code Block", cmd: 'code', icon: <Terminal size={18} /> },
];

export default function Editor({ system }: any) {
  const {
    activeDocument,
    activeDocId,
    updateDocumentTitle,
    updateDocumentContent,
    removeTag,
    saveState,
    lastSavedTime,
    editingDocRef
  } = system;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ⚡ FIX 1: Debounce Save Ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeDocIdRef = useRef(activeDocId);
  useEffect(() => {
    activeDocIdRef.current = activeDocId;
  }, [activeDocId]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions, 
    content: activeDocument?.content || '',
    onUpdate: ({ editor }) => {
      // ⚡ FIX 4: Faster UI recovery (800ms)
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 800);

      const html = editor.getHTML();
      const { from } = editor.state.selection;
      
      // 🧠 UPGRADE 1: Intelligent Slash Command Search
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, '\n');
      const match = textBefore.match(/(?:\s|^)\/(\w*)$/);
      
      if (match) {
        setShowSlashMenu(true);
        setSlashQuery(match[1].toLowerCase());
      } else {
        setShowSlashMenu(false);
        setSlashQuery("");
      }

      // ⚡ FIX 1: Heavy rendering debounce
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (activeDocIdRef.current) {
          updateDocumentContent(activeDocIdRef.current, html);
        }
      }, 500);
    },
  });

  const prevDocId = useRef(activeDocId);

  useEffect(() => {
    if (!editor || !activeDocument) return;

    if (prevDocId.current !== activeDocId) {
      editor.commands.setContent(activeDocument.content || "<p></p>");
      prevDocId.current = activeDocId;
      return; 
    }

    if (editor.isFocused || editingDocRef.current === activeDocId) return;

    const currentHTML = editor.getHTML();
    if (currentHTML !== activeDocument.content) {
      editor.commands.setContent(activeDocument.content || "<p></p>");
    }
  }, [activeDocId, editor, activeDocument?.content, editingDocRef]);

  useEffect(() => {
    const updateKeyboard = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      // ⚡ FIX 2: Stable Android cross-device keyboard detection
      const isKeyboard = viewport.height < window.innerHeight * 0.75;
      setKeyboardOpen(isKeyboard);
      
      if (isKeyboard) {
        setKeyboardHeight(window.innerHeight - viewport.height);
      } else {
        setKeyboardHeight(0);
        setShowMobileMore(false);
      }
    };

    window.visualViewport?.addEventListener("resize", updateKeyboard);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateKeyboard);
    };
  }, []);

  useEffect(() => {
    if (!editor || !keyboardOpen) return;

    const timeout = setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // ⚡ FIX 3: Prevent scroll jump glitch
      if (rect.bottom > window.innerHeight - 100) {
        window.scrollTo({
          top: window.scrollY + rect.bottom - window.innerHeight / 2,
          behavior: "smooth",
        });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [keyboardOpen, editor]);

  if (!mounted || !activeDocument || !editor) return null;

  const handleSlashCommand = (command: string) => {
    const chain = editor.chain().focus();
    const deleteLength = slashQuery.length + 1; // +1 for the '/'
    const { from } = editor.state.selection;
    const deleteRange = { from: from - deleteLength, to: from };

    switch (command) {
      case 'h1': chain.deleteRange(deleteRange).toggleHeading({ level: 1 }).run(); break;
      case 'h2': chain.deleteRange(deleteRange).toggleHeading({ level: 2 }).run(); break;
      case 'todo': chain.deleteRange(deleteRange).toggleTaskList().run(); break;
      case 'quote': chain.deleteRange(deleteRange).toggleBlockquote().run(); break;
      case 'divider': chain.deleteRange(deleteRange).setHorizontalRule().run(); break;
      case 'code': chain.deleteRange(deleteRange).toggleCodeBlock().run(); break;
    }
    
    setShowSlashMenu(false);
    setSlashQuery("");
  };

  const wordCount = editor.storage.characterCount.words();
  
  const filteredSlashCommands = SLASH_COMMANDS.filter(c => 
    c.label.toLowerCase().includes(slashQuery) || 
    c.cmd.includes(slashQuery)
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${showFocusMode ? 'bg-zinc-950' : 'bg-gray-50'}`}>
      
      <div className={`max-w-5xl mx-auto px-4 pt-6 pb-8 transition-opacity duration-300 ${showFocusMode || keyboardOpen || isTyping ? 'opacity-0 pointer-events-none h-0 overflow-hidden py-0' : 'opacity-100'}`}>
        <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm p-8">
          <input
            type="text"
            value={activeDocument.title}
            onChange={(e) => updateDocumentTitle(activeDocId!, e.target.value)}
            className="w-full text-4xl md:text-5xl font-black bg-transparent border-b-2 border-gray-100 outline-none text-gray-900 placeholder-gray-200 pb-4 focus:border-green-500 transition-colors"
            placeholder="Untitled Note"
          />
          
          <div className="flex flex-wrap gap-2 mt-6">
            {activeDocument.tags?.map((tag: string) => (
              <span key={tag} className="px-4 py-1.5 bg-green-50 text-green-700 text-sm font-semibold rounded-2xl border border-green-100 flex items-center gap-2 shadow-sm">
                #{tag}
                <button onClick={() => removeTag(activeDocument.id, tag)} className="ml-1 text-green-600 hover:text-red-500 font-bold text-lg leading-none">×</button>
              </span>
            ))}
            {(!activeDocument.tags || activeDocument.tags.length === 0) && (
              <p className="text-gray-400 text-sm italic">No tags yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="hidden md:block sticky top-4 z-40 max-w-5xl mx-auto px-4">
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl p-3 shadow-xl flex flex-wrap gap-4 items-center transition-all">
          <div className="relative flex items-center gap-1 border border-gray-100 p-1.5 rounded-xl">
            <GroupLabel>Style</GroupLabel>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold size={18}/></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic size={18}/></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}><Strikethrough size={18}/></ToolbarButton>
            
            <div className="w-px h-6 bg-gray-200 mx-2" />
            
            <input
              type="color"
              className="w-9 h-9 p-1 rounded-xl cursor-pointer border border-gray-200"
              onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
              title="Text Color"
            />
            <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')}><Highlighter size={18}/></ToolbarButton>
          </div>

          <div className="relative flex items-center gap-2 border border-gray-100 p-1.5 rounded-xl">
            <GroupLabel>Font</GroupLabel>
            <select
              className="bg-transparent text-sm font-medium outline-none cursor-pointer text-gray-700"
              onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
            >
              <option value="Inter">Inter</option>
              <option value="Georgia">Georgia</option>
              <option value="monospace">Mono</option>
            </select>
            <select
              className="bg-transparent text-sm font-medium outline-none cursor-pointer text-gray-700 border-l pl-3"
              onChange={(e) => editor.chain().focus().extendMarkRange('textStyle').setFontSize(e.target.value).run()}
            >
              <option value="16px">16</option>
              <option value="18px">18</option>
              <option value="20px">20</option>
              <option value="24px">24</option>
              <option value="32px">32</option>
            </select>
          </div>

          <div className="relative flex items-center gap-1 border border-gray-100 p-1.5 rounded-xl">
            <GroupLabel>Blocks</GroupLabel>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>H1</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>H2</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}><List size={18}/></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')}>☑</ToolbarButton>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={20}/></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={20}/></ToolbarButton>
            <ToolbarButton onClick={() => setShowFocusMode(!showFocusMode)} title="Focus Mode">
              {showFocusMode ? <EyeOff size={20}/> : <Eye size={20}/>}
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear Format">
              <RotateCcw size={20}/>
            </ToolbarButton>
          </div>
        </div>
      </div>

      <div 
        className={`max-w-5xl mx-auto px-4 transition-all duration-300 ease-out ${showFocusMode ? 'pt-8' : 'pt-4'}`}
        style={{
          paddingBottom: keyboardOpen ? "120px" : "8rem"
        }}
      >
        <div className={`relative rounded-[3rem] shadow-sm transition-all duration-500 ${showFocusMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
          <style jsx global>{`
            .ProseMirror {
              outline: none !important;
              border: none !important;
              caret-color: #22c55e;
              min-height: 700px;
              padding: 3rem 2.5rem;
              font-size: 17px;
              line-height: 1.85;
            }
            .ProseMirror p { margin-bottom: 1.25em; }
            .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
              margin-top: 2em;
              margin-bottom: 0.75em;
              font-weight: 900;
              color: ${showFocusMode ? '#f1f5f9' : '#111827'};
            }
            .ProseMirror ::selection {
              background: #86efac;
              color: #14532d;
            }
            .ProseMirror blockquote {
              border-left: 5px solid #4ade80;
              padding-left: 1.5rem;
              color: #64748b;
              font-style: italic;
              margin: 2em 0;
            }
            @media (max-width: 768px) {
              .ProseMirror {
                padding: 2rem 1.25rem;
                font-size: 16.5px;
              }
            }
          `}</style>
          <EditorContent editor={editor} className="prose prose-lg max-w-none focus:outline-none" />
        </div>
      </div>

      <div 
        className="md:hidden fixed left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-all duration-200 ease-out"
        style={{
          bottom: keyboardOpen ? `${keyboardHeight}px` : "env(safe-area-inset-bottom)"
        }}
      >
        <div className="flex items-center justify-between p-2 overflow-x-auto border-b border-gray-100 no-scrollbar gap-1">
          <div className="flex items-center gap-1">
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold size={20}/></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic size={20}/></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}><List size={20}/></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={20}/></ToolbarButton>
          </div>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowMobileMore(!showMobileMore)}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl transition-colors border active:scale-95 flex-shrink-0 ${
              showMobileMore 
                ? "bg-gray-100 text-gray-900 border-gray-200 shadow-inner" 
                : "bg-white text-gray-600 border-gray-200 shadow-sm"
            }`}
          >
            <MoreHorizontal size={16} />
            {showMobileMore ? "Less" : "More"}
          </button>
        </div>

        <div className={`grid grid-cols-[1fr] transition-all duration-200 ease-out ${showMobileMore ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 p-2 overflow-x-auto bg-gray-50 border-b border-gray-100 no-scrollbar">
              <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}><Strikethrough size={20}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>H1</ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>H2</ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')}>☑</ToolbarButton>
              
              <div className="w-px h-5 bg-gray-300 mx-1 shrink-0" />
              
              <input
                type="color"
                className="w-8 h-8 p-0.5 rounded-lg cursor-pointer border border-gray-200 shrink-0 bg-white"
                onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                title="Text Color"
              />
              <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} className="p-2">
                <Highlighter size={20} />
              </ToolbarButton>
              
              <div className="w-px h-5 bg-gray-300 mx-1 shrink-0" />

              <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={20}/></ToolbarButton>
              <ToolbarButton onClick={() => setShowFocusMode(!showFocusMode)} title="Focus Mode">
                {showFocusMode ? <EyeOff size={20}/> : <Eye size={20}/>}
              </ToolbarButton>
            </div>
          </div>
        </div>

        <div className={`flex justify-between items-center px-4 py-1.5 text-[10px] font-medium bg-white text-gray-400 transition-opacity duration-200 ${isTyping ? 'opacity-30' : 'opacity-100'}`}>
          <div className="font-mono uppercase tracking-wider">
            {wordCount} words
          </div>
          <div className="flex items-center gap-1.5 text-green-600 font-semibold">
            {saveState === 'saving' ? (
              <>⟳ Saving...</>
            ) : (
              <>✓ Saved {lastSavedTime || "just now"}</>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowQuickMenu(!showQuickMenu)}
        className="md:hidden fixed z-50 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white p-4 rounded-full shadow-xl transition-all duration-300 ease-out"
        style={{
          bottom: keyboardOpen ? `${keyboardHeight + 80}px` : "7rem",
          right: "1.5rem"
        }}
      >
        <Plus size={24} className={`transition-transform duration-200 ${showQuickMenu ? 'rotate-45' : 'rotate-0'}`} />
      </button>

      {showQuickMenu && (
        <div 
          className="md:hidden fixed right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 w-56 animate-in slide-in-from-bottom-4 fade-in duration-200"
          style={{
            bottom: keyboardOpen ? `${keyboardHeight + 140}px` : "11rem"
          }}
        >
          {SLASH_COMMANDS.map((item, i) => (
            <button
              key={i}
              onClick={() => { handleSlashCommand(item.cmd); setShowQuickMenu(false); }}
              className="w-full px-4 py-3 text-left hover:bg-green-50 active:bg-green-100 flex items-center gap-3 text-sm font-medium transition-colors"
            >
              <span className="text-green-600">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {showSlashMenu && (
        <div className="fixed left-1/2 top-1/3 -translate-x-1/2 z-[60] bg-white/95 backdrop-blur-xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-2xl p-3 w-72 animate-in fade-in zoom-in-95 duration-200">
          <p className="text-[10px] font-black text-gray-400 px-3 py-1 uppercase tracking-widest">
            {filteredSlashCommands.length > 0 ? "Quick Commands" : "No Match Found"}
          </p>
          {filteredSlashCommands.map((item) => (
            <button
              key={item.cmd}
              onClick={() => handleSlashCommand(item.cmd)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 active:bg-green-100 rounded-xl text-left text-sm font-semibold transition-colors"
            >
              <span className="text-green-600">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}