"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import { useTheme } from "@/theme/ThemeProvider"; 
import { editorExtensions } from './editorExtensions';
import { SLASH_COMMANDS, SlashCommand } from './constants';
import { WorkspaceToolbar } from './Toolbar/WorkspaceToolbar';
import { SelectionMenu } from './Menus/SelectionMenu';
import { SlashMenu } from './Menus/SlashMenu';
import { QuickMenu } from './Menus/QuickMenu';
import { TitleSection } from './Layout/TitleSection';
import { ContentArea } from './Layout/ContentArea';

export default function Editor({ system }: any) {
  const {
    activeDocument, activeDocId, updateDocumentTitle, updateDocumentContent,
    removeTag, saveState, lastSavedTime, editingDocRef
  } = system;

  const { isDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [powerMode, setPowerMode] = useState(false);
  
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [selectionCoords, setSelectionCoords] = useState({ top: 0, left: 0 });
  
  const [pageWidth, setPageWidth] = useState<'narrow' | 'normal' | 'wide'>('normal');
  const [lineHeight, setLineHeight] = useState(1.85);
  const [autoSave] = useState(true);
  
  const [currentFontSize, setCurrentFontSize] = useState(17);
  const [wordGoal, setWordGoal] = useState(500);

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeDocIdRef = useRef(activeDocId);
  const autoSaveRef = useRef(autoSave);
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => { activeDocIdRef.current = activeDocId; }, [activeDocId]);
  useEffect(() => { autoSaveRef.current = autoSave; }, [autoSave]);

  useEffect(() => { setMounted(true); }, []);

  // SMART MOBILE MODE (Keyboard Detection)
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const isKeyboardOpen = viewport.height < window.innerHeight * 0.75;
      setKeyboardOpen(isKeyboardOpen);
      document.documentElement.style.setProperty('--vh', `${viewport.height * 0.01}px`);

      if (isKeyboardOpen) {
        setShowQuickMenu(false);
        setShowSelectionMenu(false);
        setShowViewMenu(false);
      }
    };

    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);

  // Close view menu when clicking outside
  useEffect(() => {
    const closeMenu = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.view-menu-container')) {
        setShowViewMenu(false);
      }
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  // EDITOR INSTANCE
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
      
      if (window.innerWidth < 768) {
        requestAnimationFrame(() => {
          const selection = window.getSelection();
          if (!selection?.rangeCount) return;
          const rect = selection.getRangeAt(0).getBoundingClientRect();
          const safeZone = window.innerHeight * 0.45;
          
          if (rect.bottom > safeZone) {
            window.scrollBy({ top: rect.bottom - safeZone, behavior: "smooth" });
          }
        });
      }

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
        hashMatches.forEach((tag: string) => system.addTag(activeDocIdRef.current, tag.replace("#", "")));
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
        try { updateDocumentContent(activeDocIdRef.current, html); } 
        catch(e) { console.log("Supabase save ignored for now."); }
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
  const filteredSlashCommands: SlashCommand[] = SLASH_COMMANDS.filter(c => 
    c.label.toLowerCase().includes(slashQuery) || c.cmd.includes(slashQuery)
  );
  const maxWidthClass = pageWidth === 'narrow' ? 'max-w-2xl' : pageWidth === 'wide' ? 'max-w-7xl' : 'max-w-5xl';

  return (
    <div
  className={`flex flex-col flex-1 h-full overflow-y-auto transition-colors duration-500 relative ${
    isDarkMode ? "bg-[#050505] text-white" : "bg-[#f9fafb] text-gray-900"
  }`}
>
      
      <SelectionMenu editor={editor} showSelectionMenu={showSelectionMenu} selectionCoords={selectionCoords} isDarkMode={isDarkMode} setLink={setLink} />
      
      <WorkspaceToolbar 
        editor={editor} system={system} isDarkMode={isDarkMode} 
        powerMode={powerMode} setPowerMode={setPowerMode}
        showViewMenu={showViewMenu} setShowViewMenu={setShowViewMenu}
        currentFontSize={currentFontSize} wordCount={wordCount} wordGoal={wordGoal}
        autoSave={autoSave} isSaving={isSaving} isTyping={isTyping}
        setLink={setLink} toggleCase={toggleCase}
      />
      
      <TitleSection 
        activeDocument={activeDocument} activeDocId={activeDocId!} updateDocumentTitle={updateDocumentTitle}
        isDarkMode={isDarkMode} keyboardOpen={keyboardOpen} system={system} editor={editor} lastSavedTime={lastSavedTime} maxWidthClass={maxWidthClass}
      />
      
      <ContentArea 
        editor={editor} maxWidthClass={maxWidthClass} isDarkMode={isDarkMode} 
        keyboardOpen={keyboardOpen} lineHeight={lineHeight}
        handleTouchStart={handleTouchStart} handleTouchEnd={handleTouchEnd}
      />
      
      <QuickMenu showQuickMenu={showQuickMenu} setShowQuickMenu={setShowQuickMenu} keyboardOpen={keyboardOpen} isDarkMode={isDarkMode} handleSlashCommand={handleSlashCommand} />
      
      <SlashMenu showSlashMenu={showSlashMenu} filteredSlashCommands={filteredSlashCommands} isDarkMode={isDarkMode} handleSlashCommand={handleSlashCommand} />
      
    </div>
  );
}