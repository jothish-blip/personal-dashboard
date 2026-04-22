"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { textInputRule } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
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
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import ListKeymap from '@tiptap/extension-list-keymap';
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, Highlighter, Undo, Redo,
  Heading1, Heading2, Heading3, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Minus, Plus, MoreHorizontal, Subscript as SubscriptIcon, Superscript as SuperscriptIcon, 
  Code, SquareTerminal, Quote, Indent, Outdent, Circle, Share, Link as LinkIcon,
  Pin, Copy, Tag, Wand2, Settings2
} from 'lucide-react';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
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
    }];
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize: size }).run();
      },
    };
  },
});

const AutoCorrect = Extension.create({
  name: 'autoCorrect',
  addInputRules() {
    return [
      textInputRule({ find: /->$/, replace: '→' }),
      textInputRule({ find: /<-$/, replace: '←' }),
      textInputRule({ find: /=>$/, replace: '⇒' }),
      textInputRule({ find: /!=$/, replace: '≠' }),
      textInputRule({ find: /\(c\)$/i, replace: '©' }),
      textInputRule({ find: /\(r\)$/i, replace: '®' }),
      textInputRule({ find: /\(tm\)$/i, replace: '™' }),
      textInputRule({ find: /1\/2$/, replace: '½' }),
      textInputRule({ find: /teh $/, replace: 'the ' }),
      textInputRule({ find: /dont $/, replace: "don't " }),
      textInputRule({ find: /cant $/, replace: "can't " }),
    ]
  }
});

// Prevent Extension Duplication Warnings
const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    bulletList: { keepMarks: true, keepAttributes: false },
    orderedList: { keepMarks: true, keepAttributes: false },
    // @ts-ignore - Force overriding to stop duplicate warnings
    underline: false,
    // @ts-ignore
    link: false,
  }),
  ListKeymap,
  Underline,
  TextStyle,
  FontSize, 
  Color,
  FontFamily,
  Subscript,
  Superscript,
  Highlight.configure({ multicolor: true }),
  TaskList,
  TaskItem.configure({ 
    nested: true,
    HTMLAttributes: { class: 'flex items-start gap-2' },
  }),
  Placeholder.configure({ placeholder: "Start writing or type '/'..." }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  CharacterCount,
  Typography,
  AutoCorrect,
  Link.configure({ 
    openOnClick: false,
    HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
  }),
];

const ToolbarButton = ({ children, onClick, isActive, title, className = "" }: any) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    className={`p-1.5 md:p-2 rounded-lg flex items-center justify-center transition-all duration-200 border flex-shrink-0 active:scale-95 ${
      isActive
        ? "bg-green-100 text-green-700 border-green-200 shadow-sm"
        : "bg-transparent text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900"
    } ${className}`}
  >
    {children}
  </button>
);

const SLASH_COMMANDS = [
  { label: "Heading 1", cmd: 'h1', icon: <Heading1 size={18} /> },
  { label: "Heading 2", cmd: 'h2', icon: <Heading2 size={18} /> },
  { label: "Heading 3", cmd: 'h3', icon: <Heading3 size={18} /> },
  { label: "To-do List", cmd: 'todo', icon: "☑" },
  { label: "Quote", cmd: 'quote', icon: <Quote size={18} /> },
  { label: "Divider", cmd: 'divider', icon: <Minus size={18} /> },
  { label: "Code Block", cmd: 'code', icon: <SquareTerminal size={18} /> },
  { label: "Add Tag", cmd: 'tag', icon: <Tag size={18} /> },
];

export default function Editor({ system }: any) {
  const {
    activeDocument, activeDocId, updateDocumentTitle, updateDocumentContent,
    removeTag, saveState, lastSavedTime, editingDocRef
  } = system;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showConvertMenu, setShowConvertMenu] = useState(false);
  const [powerMode, setPowerMode] = useState(false);
  
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [selectionCoords, setSelectionCoords] = useState({ top: 0, left: 0 });
  
  const [pageWidth, setPageWidth] = useState<'narrow' | 'normal' | 'wide'>('normal');
  const [lineHeight, setLineHeight] = useState(1.85);
  const [autoSave] = useState(true);
  
  const [currentFontSize, setCurrentFontSize] = useState(17);
  const [tagInput, setTagInput] = useState("");
  const [wordGoal, setWordGoal] = useState(500);

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // 🔥 UNIVERSAL TOOLBAR DRAG STATE
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const toolbarDrag = useRef(false);
  const toolbarOffset = useRef({ x: 0, y: 0 });

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeDocIdRef = useRef(activeDocId);
  const autoSaveRef = useRef(autoSave);
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => { activeDocIdRef.current = activeDocId; }, [activeDocId]);
  useEffect(() => { autoSaveRef.current = autoSave; }, [autoSave]);
  useEffect(() => {
    if (activeDocument && !activeDocument.title) {
      document.querySelector("input")?.focus();
    }
  }, [activeDocId]);

  // 🔥 INITIAL POSITION FIX
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768;
      setToolbarPos({
        x: isMobile ? 10 : Math.max(10, window.innerWidth / 2 - 200),
        y: isMobile ? 80 : 16,
      });
    }
  }, []);

  // 🔥 TOOLBAR DRAG HANDLERS (MOUSE & TOUCH)
  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    toolbarDrag.current = true;
    toolbarOffset.current = {
      x: e.clientX - toolbarPos.x,
      y: e.clientY - toolbarPos.y,
    };
  };

  const handleToolbarTouchStart = (e: React.TouchEvent) => {
    toolbarDrag.current = true;
    const touch = e.touches[0];
    toolbarOffset.current = {
      x: touch.clientX - toolbarPos.x,
      y: touch.clientY - toolbarPos.y,
    };
  };

  // MOUSE MOVE
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!toolbarDrag.current) return;
      const newX = e.clientX - toolbarOffset.current.x;
      const newY = e.clientY - toolbarOffset.current.y;
      
      setToolbarPos({
        x: Math.max(0, Math.min(window.innerWidth - 100, newX)),
        y: Math.max(0, Math.min(window.innerHeight - 60, newY)),
      });
    };

    const up = () => (toolbarDrag.current = false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  // TOUCH MOVE
  useEffect(() => {
    const move = (e: TouchEvent) => {
      if (!toolbarDrag.current) return;
      const touch = e.touches[0];
      const newX = touch.clientX - toolbarOffset.current.x;
      const newY = touch.clientY - toolbarOffset.current.y;
      
      setToolbarPos({
        x: Math.max(0, Math.min(window.innerWidth - 100, newX)),
        y: Math.max(0, Math.min(window.innerHeight - 60, newY)),
      });
    };

    const up = () => (toolbarDrag.current = false);

    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);

    return () => {
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions, 
    content: activeDocument?.content || '',
    editorProps: {
      attributes: { spellcheck: 'true', autocorrect: 'on', autocapitalize: 'sentences' },
      handleClick(view, pos, event) {
        const target = event.target as HTMLElement;
        const aTag = target.tagName === "A" ? target : target.closest("a");
        if (aTag) {
          const href = aTag.getAttribute("href");
          if (href) { window.open(href, "_blank"); return true; }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 800);

      const html = editor.getHTML();
      const text = editor.getText();
      const { from } = editor.state.selection;
      
      if (!activeDocument?.title || activeDocument.title === "Untitled Note") {
        const potentialTitle = text.replace(/#\w+/g, '').trim().slice(0, 40);
        if (potentialTitle.length > 3) updateDocumentTitle(activeDocIdRef.current, potentialTitle);
      }

      const hashMatches = text.match(/#(\w+)/g);
      if (hashMatches && system.addTag) {
        hashMatches.forEach(tag => system.addTag(activeDocIdRef.current, tag.replace("#", "")));
      }

      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, '\n');
      const match = textBefore.match(/(?:\s|^)\/(\w*)$/);
      
      if (match) {
        setShowSlashMenu(true);
        setSlashQuery(match[1].toLowerCase());
      } else {
        setShowSlashMenu(false);
        setSlashQuery("");
      }

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (!activeDocIdRef.current || !autoSaveRef.current) return;
        try {
          updateDocumentContent(activeDocIdRef.current, html);
        } catch(e) {
          console.log("Supabase save ignored for now.");
        }
      }, 500);
    },
  });

  useEffect(() => {
    if (!editor) return;

    const updateSelectionMenu = () => {
      if (editor.state.selection.empty) {
        setShowSelectionMenu(false);
        return;
      }

      setTimeout(() => {
        try {
          const { from } = editor.state.selection;
          const coords = editor.view.coordsAtPos(from);

          const top = Math.max(10, coords.top - 60);
          const left = Math.min(window.innerWidth - 200, Math.max(10, coords.left));

          setSelectionCoords({ top, left });
          setShowSelectionMenu(true);
        } catch (e) {
          setShowSelectionMenu(false);
        }
      }, 10);
    };

    editor.on('selectionUpdate', updateSelectionMenu);
    editor.on('blur', () => setShowSelectionMenu(false));
    
    const handleScroll = () => setShowSelectionMenu(false);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      editor.off('selectionUpdate', updateSelectionMenu);
      editor.off('blur', () => setShowSelectionMenu(false));
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const updateFontSize = () => {
      const size = editor.getAttributes('textStyle').fontSize;
      setCurrentFontSize(size ? parseInt(size) : 17);
    };
    editor.on("selectionUpdate", updateFontSize);
    editor.on("transaction", updateFontSize);

    return () => {
      editor.off("selectionUpdate", updateFontSize);
      editor.off("transaction", updateFontSize);
    };
  }, [editor]);

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
    const viewport = window.visualViewport;
    if (!viewport) return;

    document.documentElement.style.setProperty('--vh', `${viewport.height * 0.01}px`);

    const handleResize = () => {
      const isKeyboardOpen = viewport.height < window.innerHeight * 0.75;
      setKeyboardOpen(isKeyboardOpen);
      document.documentElement.style.setProperty('--vh', `${viewport.height * 0.01}px`);

      if (isKeyboardOpen) {
        setShowQuickMenu(false);
        setShowSelectionMenu(false);
        setShowConvertMenu(false);
      }
    };

    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);

  if (!mounted || !activeDocument || !editor) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > 80 && Math.abs(deltaY) < 50) {
      if (deltaX > 0) editor.chain().focus().toggleBold().run(); 
      else editor.chain().focus().toggleItalic().run();             
    }
  };

  const handleSlashCommand = (command: string) => {
    const chain = editor.chain().focus();
    const deleteLength = slashQuery.length + 1;
    const { from } = editor.state.selection;
    const deleteRange = { from: from - deleteLength, to: from };

    switch (command) {
      case 'h1': chain.deleteRange(deleteRange).toggleHeading({ level: 1 }).run(); break;
      case 'h2': chain.deleteRange(deleteRange).toggleHeading({ level: 2 }).run(); break;
      case 'h3': chain.deleteRange(deleteRange).toggleHeading({ level: 3 }).run(); break;
      case 'todo': chain.deleteRange(deleteRange).toggleTaskList().run(); break;
      case 'quote': chain.deleteRange(deleteRange).toggleBlockquote().run(); break;
      case 'divider': chain.deleteRange(deleteRange).setHorizontalRule().run(); break;
      case 'code': chain.deleteRange(deleteRange).toggleCodeBlock().run(); break;
      case 'tag': chain.deleteRange(deleteRange).run(); system.addTag?.(activeDocument.id, "new"); break;
    }
    setShowSlashMenu(false); setSlashQuery("");
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl);
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const toggleCase = (type: 'upper' | 'lower') => {
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to);
    editor.chain().focus().insertContent(type === 'upper' ? text.toUpperCase() : text.toLowerCase()).run();
  };

  const wordCount = editor.storage.characterCount.words();
  const isSaving = saveState === 'saving';
  const filteredSlashCommands = SLASH_COMMANDS.filter(c => c.label.toLowerCase().includes(slashQuery) || c.cmd.includes(slashQuery));
  const maxWidthClass = pageWidth === 'narrow' ? 'max-w-2xl' : pageWidth === 'wide' ? 'max-w-7xl' : 'max-w-5xl';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-500 overflow-visible relative">
      
      {/* SELECTION MENU WITH NEW TOOLS */}
      {showSelectionMenu && editor && (
        <div 
          className="fixed z-[110] flex flex-wrap items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-xl -translate-x-1/2 transition-all duration-150 ease-out animate-in zoom-in-95"
          style={{ top: `${selectionCoords.top}px`, left: `${selectionCoords.left}px` }}
        >
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}><UnderlineIcon size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}><Strikethrough size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')}><SubscriptIcon size={14}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')}><SuperscriptIcon size={14}/></ToolbarButton>

          <div className="w-px h-4 bg-gray-200 mx-1" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>H1</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>H2</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })}>H3</ToolbarButton>

          <div className="w-px h-4 bg-gray-200 mx-1" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}><List size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')}>☑</ToolbarButton>

          <div className="w-px h-4 bg-gray-200 mx-1" />

          <ToolbarButton onClick={setLink} isActive={editor.isActive('link')}><LinkIcon size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')}><Highlighter size={16}/></ToolbarButton>
        </div>
      )}

      {/* 🔥 UNIVERSAL DRAGGABLE TOOLBAR */}
      <div
        style={{
          position: "fixed",
          top: toolbarPos.y,
          left: toolbarPos.x,
          zIndex: 9999,
          width: "fit-content",
        }}
        className="shadow-2xl rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200 flex flex-col max-w-[95vw] overflow-hidden"
      >
        {/* 🔥 TOUCH/MOUSE DRAG HANDLE */}
        <div
          onMouseDown={handleToolbarMouseDown}
          onTouchStart={handleToolbarTouchStart}
          className="cursor-move px-3 py-1.5 text-[10px] font-bold tracking-widest text-gray-400 bg-gray-50/80 rounded-t-2xl border-b border-gray-100 flex items-center justify-center uppercase transition-colors hover:bg-gray-100/80 touch-none"
        >
          Drag Tools
        </div>

        <div className="px-3 py-2 flex flex-col gap-2 max-h-[70vh] overflow-y-auto overflow-x-auto no-scrollbar">
          {/* Row 1: Primary Tools */}
          <div className="flex flex-wrap items-center gap-1">
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={16}/></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={16}/></ToolbarButton>
            
            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />
            
            {/* 20 Options Font List */}
            <select
              onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
              value={editor.getAttributes('textStyle').fontFamily || "Inter"}
              className="text-sm px-2 py-1.5 border border-transparent hover:border-gray-200 rounded-lg outline-none cursor-pointer bg-transparent text-gray-700 font-medium transition-colors w-28 sm:w-32"
              title="Font"
            >
              <option value="Inter">Inter</option>
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Tahoma">Tahoma</option>
              <option value="Trebuchet MS">Trebuchet</option>
              <option value="Courier New">Courier</option>
              <option value="monospace">Monospace</option>
              <option value="Poppins">Poppins</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Raleway">Raleway</option>
              <option value="Ubuntu">Ubuntu</option>
              <option value="Nunito">Nunito</option>
              <option value="Merriweather">Merriweather</option>
              <option value="Playfair Display">Playfair</option>
            </select>

            {/* Font Size Presets */}
            <select
              onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
              className="text-sm px-2 py-1.5 border border-transparent hover:border-gray-200 rounded-lg outline-none cursor-pointer bg-transparent text-gray-700 font-medium transition-colors"
              title="Size Preset"
            >
              <option value="12px">Small</option>
              <option value="17px">Normal</option>
              <option value="20px">Large</option>
              <option value="28px">Heading</option>
            </select>
            
            <div className="flex items-center gap-1 bg-transparent hover:bg-gray-100 rounded-lg p-0.5 border border-transparent hover:border-gray-200 transition-colors">
              <button onClick={() => editor.chain().focus().setFontSize(Math.max(8, currentFontSize - 1) + "px").run()} className="px-1.5 py-1 text-gray-500 hover:text-gray-900 transition-colors font-medium active:scale-90"><Minus size={14}/></button>
              <input type="number" min="8" max="96" value={currentFontSize} onChange={(e) => { if (e.target.value) editor.chain().focus().setFontSize(e.target.value + "px").run(); }} className="w-9 text-sm text-center bg-transparent outline-none font-medium text-gray-700 no-spinners"/>
              <button onClick={() => editor.chain().focus().setFontSize(Math.min(96, currentFontSize + 1) + "px").run()} className="px-1.5 py-1 text-gray-500 hover:text-gray-900 transition-colors font-medium active:scale-90"><Plus size={14}/></button>
            </div>

            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold"><Bold size={16}/></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic"><Italic size={16}/></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline"><UnderlineIcon size={16}/></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={16}/></ToolbarButton>
            
            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />
            
            <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Link"><LinkIcon size={16}/></ToolbarButton>
            <input type="color" className="w-7 h-7 p-0.5 rounded-md cursor-pointer border border-gray-200 bg-white shadow-sm ml-1" onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()} title="Text Color"/>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight"><Highlighter size={16}/></ToolbarButton>

            <div className="w-4 flex-1"></div>
            
            {/* Power Toggle */}
            <button 
              onClick={() => setPowerMode(!powerMode)} 
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${powerMode ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}
            >
              <Settings2 size={14} />
              {powerMode ? "Advanced" : "Simple"}
            </button>
          </div>

          {/* Row 2: Advanced Tools */}
          {powerMode && (
            <div className="flex flex-wrap items-center gap-1 border-t border-gray-100 pt-2 mt-1 animate-in slide-in-from-top-2">
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>H1</ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>H2</ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })}>H3</ToolbarButton>
              
              <div className="w-px h-6 bg-gray-200 mx-1" />

              <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List"><List size={16}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={16}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Task List">☑</ToolbarButton>

              <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={16}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter size={16}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={16}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Align Justify"><AlignJustify size={16}/></ToolbarButton>

              <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

              <ToolbarButton onClick={() => editor.chain().focus().sinkListItem('listItem').run()} title="Indent"><Indent size={16}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().liftListItem('listItem').run()} title="Outdent"><Outdent size={16}/></ToolbarButton>

              <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />
              
              <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline Code"><Code size={16}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block"><SquareTerminal size={16}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Quote"><Quote size={16}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus size={16}/></ToolbarButton>

              <div className="w-px h-6 bg-gray-200 mx-1" />

              <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')} title="Subscript"><SubscriptIcon size={16}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')} title="Superscript"><SuperscriptIcon size={16}/></ToolbarButton>
              <ToolbarButton onClick={() => toggleCase('upper')} title="Uppercase" className="font-bold">A</ToolbarButton>
              <ToolbarButton onClick={() => toggleCase('lower')} title="Lowercase" className="font-bold">a</ToolbarButton>

              <div className="w-4 flex-1"></div>

              {/* Quick Style Preset */}
              <button 
                onClick={() => editor.chain().focus().setFontFamily("Georgia").setFontSize("28px").toggleBold().run()}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors w-full sm:w-auto mt-2 sm:mt-0"
              >
                <Wand2 size={14}/> Title Style
              </button>
            </div>
          )}
          
          <div className={`flex justify-between items-center pt-2 text-[10px] font-medium text-gray-500 transition-opacity duration-200 border-t border-gray-100 ${isTyping ? 'opacity-30' : 'opacity-100'}`}>
            <div className="font-mono uppercase tracking-wider flex items-center gap-2">
              {wordCount} / {wordGoal} w
              <button onClick={() => setWordGoal(Number(prompt("Set word goal:", wordGoal.toString())) || wordGoal)} className="hover:text-gray-900 transition-colors">🎯</button>
            </div>
            <div className="flex items-center gap-1.5 text-green-600 font-semibold">
              {!autoSave ? <span className="text-orange-500">Auto-save OFF</span> : isSaving ? <>⟳ Saving...</> : isTyping ? <>● Editing...</> : <>✓ Saved</>}
            </div>
          </div>
        </div>
      </div>

      {/* TITLE SECTION */}
      <div className={`${maxWidthClass} mx-auto px-4 pt-6 md:pt-16 pb-4 transition-all duration-500`}>
        <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm p-8">
          <input
            type="text"
            value={activeDocument.title}
            onChange={(e) => updateDocumentTitle(activeDocId!, e.target.value)}
            className="w-full text-4xl md:text-5xl font-black bg-transparent border-b-2 border-gray-100 outline-none text-gray-900 placeholder-gray-300 pb-4 focus:border-green-500 transition-colors"
            placeholder="Untitled Note"
          />

          <div className="flex items-center gap-4 mt-4 text-xs font-medium text-gray-500 transition-all duration-300">
            <button onClick={() => system.togglePin?.(activeDocument.id)} className={`flex items-center gap-1.5 transition-colors active:scale-95 ${activeDocument.isPinned ? 'text-green-600' : 'hover:text-gray-900'}`}>
              <Pin size={14} className={activeDocument.isPinned ? 'fill-green-600' : ''} /> {activeDocument.isPinned ? 'Pinned' : 'Pin'}
            </button>
            <button onClick={() => navigator.clipboard.writeText(editor.getText())} className="flex items-center gap-1.5 hover:text-gray-900 transition-colors active:scale-95">
              <Copy size={14} /> Copy
            </button>
            <div className="w-px h-3 bg-gray-200 mx-1"></div>
            
            <div className="relative convert-menu-container">
              <button onClick={() => setShowConvertMenu(!showConvertMenu)} className="flex items-center gap-1.5 hover:text-green-600 transition-colors active:scale-95">
                Convert
              </button>
              {showConvertMenu && (
                <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-2 min-w-[140px] z-50 animate-in slide-in-from-top-2">
                  <button onClick={() => {
                    const blob = new Blob([editor.getText()], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `${activeDocument.title || 'note'}.txt`; a.click();
                    URL.revokeObjectURL(url); setShowConvertMenu(false);
                  }} className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors active:scale-95">
                    Export as TXT
                  </button>
                  <button onClick={() => { window.print(); setShowConvertMenu(false); }} className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mt-1 active:scale-95">
                    Export as PDF
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-xs text-gray-400 mt-2">Last edited: {lastSavedTime || "just now"}</div>
        </div>
      </div>

      {/* ✅ RESTORED STABLE EDITOR CONTENT */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`${maxWidthClass} mx-auto px-4 transition-all duration-300 ease-out pt-4 pb-32`}
      >
        <div className={`relative rounded-[3rem] shadow-sm transition-all duration-500 bg-white border border-gray-200`}>
          <style jsx global>{`
            .ProseMirror { 
              outline: none !important; 
              border: none !important; 
              caret-color: #22c55e; 
              min-height: 700px; 
              padding-top: 1.5rem; 
              padding-bottom: 6rem;
              padding-left: 2.5rem;
              padding-right: 2.5rem;
              font-size: 17px; 
              line-height: ${lineHeight} !important; 
              transition: all 0.3s ease; 
              color: #111827; 
              -webkit-overflow-scrolling: touch; 
            }
            .ProseMirror p { margin-bottom: 1.25em; }
            .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { margin-top: 2em; margin-bottom: 0.75em; font-weight: 900; color: #111827; }
            .ProseMirror ol { padding-left: 2.5rem; list-style-position: outside; }
            .ProseMirror ol li { padding-left: 0.5rem; }
            .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; margin: 0; }
            .ProseMirror li[data-type="taskItem"] { display: flex !important; align-items: flex-start !important; gap: 0.5rem; }
            .ProseMirror li[data-type="taskItem"] > label { display: flex; align-items: center; margin: 0; flex-shrink: 0; }
            .ProseMirror li[data-type="taskItem"] > div { flex: 1; margin: 0; }
            .ProseMirror ul { padding-left: 1.5rem; }
            .ProseMirror ::selection { background: #bbf7d0; color: #14532d; }
            .ProseMirror blockquote { border-left: 5px solid #22c55e; padding-left: 1.5rem; color: #4b5563; font-style: italic; margin: 2em 0; }
            .ProseMirror a { color: #16a34a; text-decoration: underline; cursor: pointer; }
            .ProseMirror pre { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; font-family: monospace; }
            .ProseMirror p.is-editor-empty:first-child::before { color: #9ca3af; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
            @media (max-width: 768px) { 
              .ProseMirror { 
                padding-top: 1.5rem; 
                padding-bottom: 6rem;
                padding-left: 1.25rem;
                padding-right: 1.25rem; 
              } 
            }
          `}</style>
          <EditorContent editor={editor} className="prose prose-lg max-w-none focus:outline-none" />
        </div>
      </div>

      {/* Hide floating button on mobile when keyboard is open */}
      <button
        onClick={() => setShowQuickMenu(!showQuickMenu)}
        className={`md:hidden fixed z-50 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white p-4 rounded-full shadow-xl transition-all duration-300 ease-out border border-green-500 bottom-[5.5rem] right-6 ${keyboardOpen ? "opacity-0 scale-75 pointer-events-none translate-y-4" : "opacity-100 scale-100 translate-y-0"}`}
      >
        <Plus size={24} className={`transition-transform duration-200 ${showQuickMenu ? 'rotate-45' : 'rotate-0'}`} />
      </button>

      {showQuickMenu && (
        <div className="md:hidden fixed right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 w-56 animate-in slide-in-from-bottom-4 fade-in duration-200 bottom-[11rem]">
          {SLASH_COMMANDS.map((item, i) => (
            <button
              key={i}
              onClick={() => { handleSlashCommand(item.cmd); setShowQuickMenu(false); }}
              className="w-full px-4 py-3 text-left hover:bg-green-50 active:bg-green-100 flex items-center gap-3 text-sm font-medium transition-colors text-gray-700"
            >
              <span className="text-green-600">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {showSlashMenu && (
        <div className="fixed left-1/2 top-[40%] -translate-x-1/2 z-[60] bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-3 w-72 animate-in fade-in zoom-in-95 duration-200">
          <p className="text-[10px] font-black text-gray-400 px-3 py-1 uppercase tracking-widest">
            {filteredSlashCommands.length > 0 ? "Quick Commands" : "No Match Found"}
          </p>
          {filteredSlashCommands.map((item) => (
            <button
              key={item.cmd}
              onClick={() => handleSlashCommand(item.cmd)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 active:bg-green-100 rounded-xl text-left text-sm font-semibold transition-colors text-gray-800"
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