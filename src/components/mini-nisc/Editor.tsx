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
  Heading1, Heading2, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Minus, Plus, MoreHorizontal, Subscript as SubscriptIcon, Superscript as SuperscriptIcon, 
  Code, SquareTerminal, Quote, Indent, Outdent, Type, Circle, Share, Link as LinkIcon,
  Pin, Copy, Trash, Tag, Download, CopyPlus
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

const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    bulletList: { keepMarks: true, keepAttributes: false },
    orderedList: { keepMarks: true, keepAttributes: false },
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
    HTMLAttributes: {
      class: 'flex items-start gap-2',
    },
  }),
  Placeholder.configure({ placeholder: "Start writing or type '/'..." }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  CharacterCount,
  Typography,
  AutoCorrect,
  Link.configure({ 
    openOnClick: false,
    HTMLAttributes: {
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  }),
];

const ToolbarButton = ({ children, onClick, isActive, title, className = "" }: any) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    className={`p-1.5 md:p-2 rounded-lg flex items-center justify-center transition-all duration-200 border flex-shrink-0 ${
      isActive
        ? "bg-green-100 text-green-700 border-green-200 shadow-sm"
        : "bg-transparent text-gray-600 border-transparent hover:bg-gray-100"
    } ${className}`}
  >
    {children}
  </button>
);

const SLASH_COMMANDS = [
  { label: "Heading 1", cmd: 'h1', icon: <Heading1 size={18} /> },
  { label: "Heading 2", cmd: 'h2', icon: <Heading2 size={18} /> },
  { label: "To-do List", cmd: 'todo', icon: "☑" },
  { label: "Quote", cmd: 'quote', icon: <Quote size={18} /> },
  { label: "Divider", cmd: 'divider', icon: <Minus size={18} /> },
  { label: "Code Block", cmd: 'code', icon: <SquareTerminal size={18} /> },
  { label: "Add Tag", cmd: 'tag', icon: <Tag size={18} /> },
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
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [selectionCoords, setSelectionCoords] = useState({ top: 0, left: 0 });
  
  const [pageWidth, setPageWidth] = useState<'narrow' | 'normal' | 'wide'>('normal');
  const [lineHeight, setLineHeight] = useState(1.85);
  const [autoSave] = useState(true);
  
  const [currentFontSize, setCurrentFontSize] = useState(17);
  const [tagInput, setTagInput] = useState("");
  const [wordGoal, setWordGoal] = useState(500);

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeDocIdRef = useRef(activeDocId);
  const autoSaveRef = useRef(autoSave);
  
  useEffect(() => {
    activeDocIdRef.current = activeDocId;
  }, [activeDocId]);

  useEffect(() => {
    autoSaveRef.current = autoSave;
  }, [autoSave]);

  // Auto Focus Title
  useEffect(() => {
    if (activeDocument && !activeDocument.title) {
      document.querySelector("input")?.focus();
    }
  }, [activeDocId]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions, 
    content: activeDocument?.content || '',
    editorProps: {
      attributes: {
        spellcheck: 'true',
        autocorrect: 'on',
        autocapitalize: 'sentences',
      },
      handleClick(view, pos, event) {
        const target = event.target as HTMLElement;
        const aTag = target.tagName === "A" ? target : target.closest("a");
        
        if (aTag) {
          const href = aTag.getAttribute("href");
          if (href) {
            window.open(href, "_blank"); 
            return true;
          }
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
      
      // Auto Title Suggestion
      if (!activeDocument?.title || activeDocument.title === "Untitled Note") {
        const potentialTitle = text.replace(/#\w+/g, '').trim().slice(0, 40);
        if (potentialTitle.length > 3) {
          updateDocumentTitle(activeDocIdRef.current, potentialTitle);
        }
      }

      // Auto Tagging via Hashtags
      const hashMatches = text.match(/#(\w+)/g);
      if (hashMatches && system.addTag) {
        hashMatches.forEach(tag => {
          system.addTag(activeDocIdRef.current, tag.replace("#", ""));
        });
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
        updateDocumentContent(activeDocIdRef.current, html);
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
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
          setShowSelectionMenu(false);
          return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setSelectionCoords({
          top: rect.top - 50,
          left: rect.left + rect.width / 2,
        });
        setShowSelectionMenu(true);
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
    const updateKeyboard = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      const isKeyboard = viewport.height < window.innerHeight * 0.75;
      setKeyboardOpen(isKeyboard);
      
      if (isKeyboard) {
        setKeyboardHeight(window.innerHeight - viewport.height);
        setShowMobileMore(false);
        setShowQuickMenu(false);
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
    if (showMobileMore) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileMore]);

  useEffect(() => {
    if (!editor || !keyboardOpen) return;

    const timeout = setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

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
    const deleteLength = slashQuery.length + 1;
    const { from } = editor.state.selection;
    const deleteRange = { from: from - deleteLength, to: from };

    switch (command) {
      case 'h1': chain.deleteRange(deleteRange).toggleHeading({ level: 1 }).run(); break;
      case 'h2': chain.deleteRange(deleteRange).toggleHeading({ level: 2 }).run(); break;
      case 'todo': chain.deleteRange(deleteRange).toggleTaskList().run(); break;
      case 'quote': chain.deleteRange(deleteRange).toggleBlockquote().run(); break;
      case 'divider': chain.deleteRange(deleteRange).setHorizontalRule().run(); break;
      case 'code': chain.deleteRange(deleteRange).toggleCodeBlock().run(); break;
      case 'tag': 
        chain.deleteRange(deleteRange).run();
        system.addTag?.(activeDocument.id, "new"); 
        break;
    }
    
    setShowSlashMenu(false);
    setSlashQuery("");
  };

  const shareDocument = async () => {
    const link = `${window.location.origin}/editor/${activeDocId}`;
    const text = `${activeDocument.title}\n\n${link}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeDocument.title,
          text: text,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(link);
      alert("Link copied");
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const wordCount = editor.storage.characterCount.words();
  const isSaving = saveState === 'saving';
  
  const filteredSlashCommands = SLASH_COMMANDS.filter(c => 
    c.label.toLowerCase().includes(slashQuery) || 
    c.cmd.includes(slashQuery)
  );

  const maxWidthClass = pageWidth === 'narrow' ? 'max-w-2xl' : pageWidth === 'wide' ? 'max-w-7xl' : 'max-w-5xl';

  return (
    <div className={`min-h-screen transition-colors duration-500 bg-gray-50 text-gray-900`}>
      
      {/* Native Floating Format Bar */}
      {showSelectionMenu && editor && (
        <div 
          className="fixed z-50 flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-xl -translate-x-1/2 transition-all duration-150 ease-out"
          style={{ top: `${selectionCoords.top}px`, left: `${selectionCoords.left}px` }}
        >
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}><Strikethrough size={16}/></ToolbarButton>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <ToolbarButton onClick={setLink} isActive={editor.isActive('link')}><LinkIcon size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')}><Highlighter size={16}/></ToolbarButton>
        </div>
      )}

      <div className={`${maxWidthClass} mx-auto px-4 pt-6 pb-8 transition-all duration-500`}>
        <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm p-8">
          <input
            type="text"
            value={activeDocument.title}
            onChange={(e) => updateDocumentTitle(activeDocId!, e.target.value)}
            className="w-full text-4xl md:text-5xl font-black bg-transparent border-b-2 border-gray-100 outline-none text-gray-900 placeholder-gray-300 pb-4 focus:border-green-500 transition-colors"
            placeholder="Untitled Note"
          />

          {/* Action Bar */}
          <div className="flex items-center gap-4 mt-4 text-xs font-medium text-gray-500">
            <button onClick={() => system.togglePin?.(activeDocument.id)} className={`flex items-center gap-1.5 transition-colors ${activeDocument.isPinned ? 'text-green-600' : 'hover:text-gray-900'}`}>
              <Pin size={14} className={activeDocument.isPinned ? 'fill-green-600' : ''} /> {activeDocument.isPinned ? 'Pinned' : 'Pin'}
            </button>
            <button onClick={shareDocument} className="flex items-center gap-1.5 hover:text-green-600 transition-colors">
              <Share size={14} /> Share
            </button>
            <button onClick={() => navigator.clipboard.writeText(editor.getText())} className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
              <Copy size={14} /> Copy
            </button>
            <button onClick={() => system.duplicateDocument?.(activeDocument.id)} className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
              <CopyPlus size={14} /> Duplicate
            </button>
            <button onClick={() => {
              const blob = new Blob([editor.getText()], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${activeDocument.title || 'Export'}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }} className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
              <Download size={14} /> Export
            </button>
            <div className="w-px h-3 bg-gray-200 mx-1"></div>
            <button onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().setContent('').run()} className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
              <Trash size={14} /> Clear
            </button>
          </div>
          
          <div className="text-xs text-gray-400 mt-2">
            Last edited: {lastSavedTime || "just now"}
          </div>
          
          {/* Tags Section */}
          <div className="flex flex-col gap-3 mt-6">
            <div className="flex flex-wrap gap-2">
              {activeDocument.tags?.map((tag: string) => (
                <span key={tag} className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-semibold rounded-xl border border-green-200 flex items-center gap-2">
                  #{tag}
                  <button onClick={() => removeTag(activeDocument.id, tag)} className="ml-1 text-green-600 hover:text-red-500 font-bold text-lg leading-none">×</button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    system.addTag(activeDocument.id, tagInput.trim());
                    setTagInput("");
                  }
                }}
                placeholder="Add tag..."
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-500 bg-gray-50 text-gray-800 placeholder-gray-400 transition-all"
              />
              <button
                onClick={() => {
                  if (tagInput.trim()) {
                    system.addTag(activeDocument.id, tagInput.trim());
                    setTagInput("");
                  }
                }}
                className="px-3 py-1.5 text-sm bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex gap-2 mt-1 flex-wrap">
              {["work", "idea", "urgent", "personal"].map((t) => (
                <button
                  key={t}
                  onClick={() => system.addTag(activeDocument.id, t)}
                  className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-green-100 hover:text-green-700 transition-colors"
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`hidden md:block sticky top-4 z-40 ${maxWidthClass} mx-auto px-4 transition-all duration-500`}>
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl px-3 py-2 shadow-xl flex flex-wrap items-center gap-1">
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={16}/></ToolbarButton>
          <ToolbarButton onClick={shareDocument} title="Share Link"><Share size={16}/></ToolbarButton>
          
          <div className="w-px h-6 bg-gray-200 mx-2" />
          
          <select
            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
            value={editor.getAttributes('textStyle').fontFamily || "Inter"}
            className="text-sm px-2 py-1.5 border border-transparent hover:border-gray-200 rounded-lg outline-none cursor-pointer bg-transparent text-gray-700 font-medium transition-colors w-32"
            title="Font"
          >
            <option value="Inter">Inter</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Tahoma">Tahoma</option>
            <option value="Trebuchet MS">Trebuchet</option>
            <option value="Courier New">Courier New</option>
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
          
          <div className="flex items-center gap-1 bg-transparent hover:bg-gray-100 rounded-lg p-0.5 border border-transparent hover:border-gray-200 transition-colors">
            <button 
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const newSize = Math.max(8, currentFontSize - 1);
                editor.chain().focus().setFontSize(newSize + "px").run();
              }} 
              className="px-1.5 py-1 text-gray-500 hover:text-gray-900 transition-colors font-medium"
            >
              <Minus size={14}/>
            </button>
            <input
              type="number"
              min="8" max="96"
              value={currentFontSize}
              onChange={(e) => {
                const size = e.target.value;
                if (size) editor.chain().focus().setFontSize(size + "px").run();
              }}
              className="w-9 text-sm text-center bg-transparent outline-none font-medium text-gray-700 no-spinners"
              title="Font Size"
            />
            <button 
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const newSize = Math.min(96, currentFontSize + 1);
                editor.chain().focus().setFontSize(newSize + "px").run();
              }} 
              className="px-1.5 py-1 text-gray-500 hover:text-gray-900 transition-colors font-medium"
            >
              <Plus size={14}/>
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200 mx-2" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold"><Bold size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic"><Italic size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline"><UnderlineIcon size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')} title="Subscript"><SubscriptIcon size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')} title="Superscript"><SuperscriptIcon size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => {
            const { from, to } = editor.state.selection;
            if (from === to) return;
            const text = editor.state.doc.textBetween(from, to);
            editor.chain().focus().insertContent(text.toUpperCase()).run();
          }} title="Uppercase">
            <Type size={16}/>
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-200 mx-2" />

          <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Link"><LinkIcon size={16}/></ToolbarButton>
          <input
            type="color"
            className="w-7 h-7 p-0.5 rounded-md cursor-pointer border border-gray-200 bg-white shadow-sm ml-1"
            onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
            title="Text Color"
          />
          <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight"><Highlighter size={16}/></ToolbarButton>

          <div className="w-px h-6 bg-gray-200 mx-2" />

          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Align Justify"><AlignJustify size={16}/></ToolbarButton>

          <div className="w-px h-6 bg-gray-200 mx-2" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List"><List size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Task List">☑</ToolbarButton>
          <ToolbarButton onClick={() => { editor.chain().focus().insertContent('<p>◯ </p>').run(); }} title="Radio Item"><Circle size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().sinkListItem('listItem').run()} title="Indent"><Indent size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().liftListItem('listItem').run()} title="Outdent"><Outdent size={16}/></ToolbarButton>

          <div className="w-px h-6 bg-gray-200 mx-2" />
          
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline Code"><Code size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block"><SquareTerminal size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Quote"><Quote size={16}/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus size={16}/></ToolbarButton>

          <div className="w-px h-6 bg-gray-200 mx-2" />

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase text-gray-500 pl-1">LH</span>
            <select
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
              className="text-sm px-1 py-1 border border-transparent hover:border-gray-200 rounded-lg outline-none cursor-pointer bg-transparent text-gray-700 font-medium transition-colors"
              title="Line Height"
            >
              <option value="1.4">1.4</option>
              <option value="1.6">1.6</option>
              <option value="1.85">1.8</option>
              <option value="2.0">2.0</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase text-gray-500 pl-2">W</span>
            <select
              value={pageWidth}
              onChange={(e) => setPageWidth(e.target.value as any)}
              className="text-sm px-1 py-1 border border-transparent hover:border-gray-200 rounded-lg outline-none cursor-pointer bg-transparent text-gray-700 font-medium transition-colors"
              title="Page Width"
            >
              <option value="narrow">Narrow</option>
              <option value="normal">Normal</option>
              <option value="wide">Wide</option>
            </select>
          </div>
        </div>
      </div>

      <div 
        className={`${maxWidthClass} mx-auto px-4 transition-all duration-300 ease-out pt-4`}
        style={{ paddingBottom: keyboardOpen ? "140px" : "6rem" }}
      >
        <div className={`relative rounded-[3rem] shadow-sm transition-all duration-500 bg-white border border-gray-200`}>
          <style jsx global>{`
            button {
              touch-action: manipulation;
            }
            .ProseMirror {
              outline: none !important;
              border: none !important;
              caret-color: #22c55e;
              min-height: 700px;
              padding: 3rem 2.5rem;
              font-size: 17px; 
              line-height: ${lineHeight} !important;
              transition: all 0.3s ease;
              color: #111827;
            }
            .ProseMirror p { margin-bottom: 1.25em; }
            .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
              margin-top: 2em;
              margin-bottom: 0.75em;
              font-weight: 900;
              color: #111827;
            }
            .ProseMirror ol {
              padding-left: 2.5rem;
              list-style-position: outside;
            }
            .ProseMirror ol li {
              padding-left: 0.5rem;
            }
            .ProseMirror ol li::marker {
              font-variant-numeric: tabular-nums;
              font-weight: 500;
              color: #6b7280;
            }
            .ProseMirror ul[data-type="taskList"] {
              list-style: none;
              padding-left: 0;
              margin: 0;
            }
            .ProseMirror li[data-type="taskItem"] {
              display: flex !important;
              align-items: flex-start !important;
              gap: 0.5rem;
            }
            .ProseMirror li[data-type="taskItem"] > label {
              display: flex;
              align-items: center;
              margin: 0;
              flex-shrink: 0;
            }
            .ProseMirror li[data-type="taskItem"] > div {
              flex: 1;
              margin: 0;
            }
            .ProseMirror li[data-type="taskItem"] p {
              margin: 0;
            }
            .ProseMirror ul {
              padding-left: 1.5rem;
            }
            .ProseMirror li {
              margin-bottom: 0.4em;
            }
            .ProseMirror ::selection {
              background: #bbf7d0;
              color: #14532d;
            }
            .ProseMirror blockquote {
              border-left: 5px solid #22c55e;
              padding-left: 1.5rem;
              color: #4b5563;
              font-style: italic;
              margin: 2em 0;
            }
            .ProseMirror a {
              color: #16a34a;
              text-decoration: underline;
              cursor: pointer;
            }
            .ProseMirror pre {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 0.5rem;
              padding: 1rem;
              color: #374151;
              font-family: monospace;
            }
            .ProseMirror code {
              background: #f3f4f6;
              padding: 0.2rem 0.4rem;
              border-radius: 0.25rem;
              font-size: 0.9em;
              color: #ef4444;
            }
            input[type="number"]::-webkit-inner-spin-button,
            input[type="number"]::-webkit-outer-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            input[type="number"] {
              -moz-appearance: textfield;
            }
            .ProseMirror p.is-editor-empty:first-child::before {
              color: #9ca3af;
              content: attr(data-placeholder);
              float: left;
              height: 0;
              pointer-events: none;
            }
            @media (max-width: 768px) {
              .ProseMirror {
                padding: 2rem 1.25rem;
              }
            }
          `}</style>
          <EditorContent editor={editor} className="prose prose-lg max-w-none focus:outline-none" />
        </div>
      </div>

      {showMobileMore && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/10 transition-opacity"
          onClick={() => setShowMobileMore(false)}
        />
      )}

      {/* Mobile Bottom Bar */}
      <div 
        className="md:hidden fixed left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-all duration-200 ease-out"
        style={{
          bottom: keyboardOpen ? `${keyboardHeight + 12}px` : "env(safe-area-inset-bottom)"
        }}
      >
        <div className={`
          absolute left-0 right-0 bottom-full 
          transition-all duration-300 ease-out
          ${showMobileMore ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}
        `}>
          <div className="bg-gray-50 border-t border-gray-200 rounded-t-2xl shadow-lg p-2 pb-4 flex flex-col gap-2">
            
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}><Strikethrough size={20}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')}><SubscriptIcon size={20}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')}><SuperscriptIcon size={20}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')}><Code size={20}/></ToolbarButton>
              
              <div className="w-px h-5 bg-gray-300 mx-1 shrink-0" />
              
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>H1</ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>H2</ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')}>☑</ToolbarButton>
              <ToolbarButton onClick={() => { editor.chain().focus().insertContent('<p>◯ </p>').run(); }}><Circle size={20}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')}><Quote size={20}/></ToolbarButton>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <ToolbarButton onClick={setLink} isActive={editor.isActive('link')}><LinkIcon size={20}/></ToolbarButton>
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

              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })}><AlignLeft size={20}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })}><AlignCenter size={20}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })}><AlignRight size={20}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })}><AlignJustify size={20}/></ToolbarButton>
              
              <div className="w-px h-5 bg-gray-300 mx-1 shrink-0" />

              <ToolbarButton onClick={() => editor.chain().focus().sinkListItem('listItem').run()}><Indent size={20}/></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().liftListItem('listItem').run()}><Outdent size={20}/></ToolbarButton>
              
              <div className="w-px h-5 bg-gray-300 mx-1 shrink-0" />
              
              <ToolbarButton onClick={shareDocument} title="Share Link"><Share size={20}/></ToolbarButton>
            </div>
            
          </div>
        </div>

        <div className="flex items-center justify-between p-2 overflow-x-auto border-b border-gray-200 no-scrollbar gap-1 relative z-10 bg-white/95 backdrop-blur-xl">
          <div className="flex items-center gap-1">
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold size={20}/></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic size={20}/></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}><UnderlineIcon size={20}/></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}><List size={20}/></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={20}/></ToolbarButton>
          </div>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowMobileMore(!showMobileMore)}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl transition-colors border active:scale-95 flex-shrink-0 ${
              showMobileMore 
                ? "bg-gray-100 text-gray-900 border-gray-200 shadow-inner" 
                : "bg-white text-gray-600 border-gray-200 shadow-sm hover:bg-gray-50"
            }`}
          >
            <MoreHorizontal size={16} />
            {showMobileMore ? "Less" : "More"}
          </button>
        </div>

        <div className={`flex justify-between items-center px-4 py-1.5 text-[10px] font-medium bg-white text-gray-500 transition-opacity duration-200 relative z-10 ${isTyping ? 'opacity-30' : 'opacity-100'}`}>
          <div className="font-mono uppercase tracking-wider flex items-center gap-2">
            {wordCount} / {wordGoal} words
            <button onClick={() => setWordGoal(Number(prompt("Set word goal:", wordGoal.toString())) || wordGoal)} className="hover:text-gray-900 transition-colors">🎯</button>
          </div>
          <div className="flex items-center gap-1.5 text-green-600 font-semibold">
            {!autoSave ? (
              <span className="text-orange-500">Auto-save OFF</span>
            ) : isSaving ? (
              <>⟳ Saving...</>
            ) : isTyping ? (
              <>● Editing...</>
            ) : (
              <>✓ Saved {lastSavedTime || "just now"}</>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowQuickMenu(!showQuickMenu)}
        className={`md:hidden fixed z-50 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white p-4 rounded-full shadow-xl transition-all duration-300 ease-out border border-green-500 ${
          showMobileMore ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-100"
        }`}
        style={{
          bottom: keyboardOpen ? `${keyboardHeight + 100}px` : "5.5rem",
          right: "1.5rem"
        }}
      >
        <Plus size={24} className={`transition-transform duration-200 ${showQuickMenu ? 'rotate-45' : 'rotate-0'}`} />
      </button>

      {/* Quick Menu Slash Commands (Mobile) */}
      {showQuickMenu && (
        <div 
          className="md:hidden fixed right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 w-56 animate-in slide-in-from-bottom-4 fade-in duration-200"
          style={{ bottom: keyboardOpen ? `${keyboardHeight + 140}px` : "11rem" }}
        >
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

      {/* Desktop Slash Commands Autocomplete */}
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