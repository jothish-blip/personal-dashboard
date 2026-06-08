import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  Menu, Undo, Redo, Minus, Plus, Bold, Italic, Underline as UnderlineIcon, Strikethrough, Link as LinkIcon, Highlighter, Settings2, Heading1, Heading2, Heading3, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Indent, Outdent, Code, SquareTerminal, Quote, Subscript as SubscriptIcon, Superscript as SuperscriptIcon, Wand2 
} from 'lucide-react';
import { ToolbarButton } from './ToolbarButton';
import { ViewSwitcher } from './ViewSwitcher';

interface WorkspaceToolbarProps {
  editor: Editor;
  system: any;
  isDarkMode: boolean;
  powerMode: boolean;
  setPowerMode: (value: boolean) => void;
  showViewMenu: boolean;
  setShowViewMenu: (value: boolean) => void;
  currentFontSize: number;
  wordCount: number;
  wordGoal: number;
  autoSave: boolean;
  isSaving: boolean;
  isTyping: boolean;
  setLink: () => void;
  toggleCase: (type: 'upper' | 'lower') => void;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  editor, system, isDarkMode, powerMode, setPowerMode, showViewMenu, setShowViewMenu,
  currentFontSize, wordCount, wordGoal, autoSave, isSaving, isTyping, setLink, toggleCase
}) => {
  return (
    <div 
      className={`sticky top-0 z-[100] w-full border-b backdrop-blur-xl transition-all duration-200 ${
        isDarkMode 
          ? "bg-black/90 border-white/5 shadow-lg shadow-black/20" 
          : "bg-white/90 border-black/5 shadow-lg shadow-black/5"
      }`}
    >
      {/* HEADER: COMMAND CENTER */}
      <div className={`px-4 py-2 flex items-center justify-between transition-colors border-b ${
          isDarkMode ? "bg-black border-[#1a1a1a]" : "bg-white border-gray-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              system.setIsSidebarOpen(!system.isSidebarOpen);
            }}
            className={`p-1.5 rounded-lg active:scale-95 transition-colors ${
              isDarkMode ? "hover:bg-[#1a1a1a] text-gray-400" : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <Menu size={18} />
          </button>

          <ViewSwitcher system={system} showViewMenu={showViewMenu} setShowViewMenu={setShowViewMenu} isDarkMode={isDarkMode} />

          <div className={`w-px h-5 mx-1 hidden sm:block ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-200"}`} />
          <span className={`hidden sm:block text-[10px] font-bold tracking-widest uppercase ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Tools</span>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3 pr-2 opacity-60">
          <div className={`text-[9px] font-mono tracking-widest flex items-center gap-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            {wordCount} / {wordGoal} w
          </div>
          <div className={`text-[9px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-emerald-400" : "text-green-600"}`}>
            {!autoSave ? <span className={isDarkMode ? "text-orange-400" : "text-orange-500"}>Auto-save OFF</span> : isSaving ? <>⟳ Saving</> : isTyping ? <>● Editing</> : <>✓ Saved</>}
          </div>
        </div>
      </div>

      {/* TOOLBAR CONTROLS */}
      <div className="px-4 py-2 flex flex-col gap-2 overflow-x-auto no-scrollbar relative">
        {/* Row 1: Primary Tools */}
        <div className="flex flex-nowrap items-center gap-1 min-w-max">
          <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={16}/></ToolbarButton>
          <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={16}/></ToolbarButton>
          
          <div className={`w-px h-6 mx-1 hidden sm:block ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-200"}`} />
          
          <select
            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
            value={editor.getAttributes('textStyle').fontFamily || "Inter"}
            className={`text-sm px-2 py-1.5 border border-transparent rounded-lg outline-none cursor-pointer bg-transparent font-medium transition-colors w-28 sm:w-32 ${
              isDarkMode ? "text-gray-300 hover:border-[#1a1a1a] [&>option]:bg-black" : "text-gray-700 hover:border-gray-200 [&>option]:bg-white"
            }`}
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

          <select
            onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
            className={`text-sm px-2 py-1.5 border border-transparent rounded-lg outline-none cursor-pointer bg-transparent font-medium transition-colors ${
              isDarkMode ? "text-gray-300 hover:border-[#1a1a1a] [&>option]:bg-black" : "text-gray-700 hover:border-gray-200 [&>option]:bg-white"
            }`}
          >
            <option value="12px">Small</option>
            <option value="17px">Normal</option>
            <option value="20px">Large</option>
            <option value="28px">Heading</option>
          </select>
          
          <div className={`flex items-center gap-1 bg-transparent rounded-lg p-0.5 border border-transparent transition-colors ${
            isDarkMode ? "hover:bg-[#0a0a0a] hover:border-[#1a1a1a]" : "hover:bg-gray-100 hover:border-gray-200"
          }`}>
            <button onClick={() => editor.chain().focus().setFontSize(Math.max(8, currentFontSize - 1) + "px").run()} className={`px-1.5 py-1 transition-colors font-medium active:scale-90 ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}><Minus size={14}/></button>
            <input type="number" min="8" max="96" value={currentFontSize} onChange={(e) => { if (e.target.value) editor.chain().focus().setFontSize(e.target.value + "px").run(); }} className={`w-9 text-sm text-center bg-transparent outline-none font-medium no-spinners ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}/>
            <button onClick={() => editor.chain().focus().setFontSize(Math.min(96, currentFontSize + 1) + "px").run()} className={`px-1.5 py-1 transition-colors font-medium active:scale-90 ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}><Plus size={14}/></button>
          </div>

          <div className={`w-px h-6 mx-1 hidden sm:block ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-200"}`} />

          <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold size={16}/></ToolbarButton>
          <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic size={16}/></ToolbarButton>
          <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}><UnderlineIcon size={16}/></ToolbarButton>
          <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}><Strikethrough size={16}/></ToolbarButton>
          
          <div className={`w-px h-6 mx-1 hidden sm:block ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-200"}`} />
          
          <ToolbarButton isDarkMode={isDarkMode} onClick={setLink} isActive={editor.isActive('link')}><LinkIcon size={16}/></ToolbarButton>
          <input type="color" className={`w-7 h-7 p-0.5 rounded-md cursor-pointer border shadow-sm ml-1 ${isDarkMode ? "bg-black border-[#1a1a1a]" : "bg-white border-gray-200"}`} onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}/>
          <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')}><Highlighter size={16}/></ToolbarButton>

          <div className="w-4 flex-1"></div>
          
          <button 
            onClick={() => setPowerMode(!powerMode)} 
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
              powerMode 
                ? (isDarkMode ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-100 text-green-700 border-green-200') 
                : (isDarkMode ? 'bg-[#0a0a0a] text-gray-300 border-[#1a1a1a] hover:bg-[#111111]' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200')
            }`}
          >
            <Settings2 size={14} />
            <span className="hidden sm:inline">{powerMode ? "Advanced" : "Simple"}</span>
          </button>
        </div>

        {/* Row 2: Advanced Tools */}
        {powerMode && (
          <div className={`flex flex-nowrap items-center gap-1 border-t pt-2 mt-1 animate-in slide-in-from-top-2 min-w-max ${isDarkMode ? "border-[#1a1a1a]" : "border-gray-100"}`}>
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>H1</ToolbarButton>
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>H2</ToolbarButton>
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })}>H3</ToolbarButton>
            
            <div className={`w-px h-6 mx-1 ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-200"}`} />

            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}><List size={16}/></ToolbarButton>
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}><ListOrdered size={16}/></ToolbarButton>
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')}>☑</ToolbarButton>

            <div className={`w-px h-6 mx-1 hidden sm:block ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-200"}`} />

            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })}><AlignLeft size={16}/></ToolbarButton>
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })}><AlignCenter size={16}/></ToolbarButton>
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })}><AlignRight size={16}/></ToolbarButton>
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })}><AlignJustify size={16}/></ToolbarButton>

            <div className={`w-px h-6 mx-1 hidden sm:block ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-200"}`} />

            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().sinkListItem('listItem').run()}><Indent size={16}/></ToolbarButton>
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().liftListItem('listItem').run()}><Outdent size={16}/></ToolbarButton>

            <div className={`w-px h-6 mx-1 hidden sm:block ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-200"}`} />
            
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')}><Code size={16}/></ToolbarButton>
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')}><SquareTerminal size={16}/></ToolbarButton>
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')}><Quote size={16}/></ToolbarButton>
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={16}/></ToolbarButton>

            <div className={`w-px h-6 mx-1 ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-200"}`} />

            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')}><SubscriptIcon size={16}/></ToolbarButton>
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')}><SuperscriptIcon size={16}/></ToolbarButton>
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => toggleCase('upper')} className="font-bold">A</ToolbarButton>
            <ToolbarButton isDarkMode={isDarkMode} onClick={() => toggleCase('lower')} className="font-bold">a</ToolbarButton>

            <div className="w-4 flex-1"></div>

            <button 
              onClick={() => editor.chain().focus().setFontFamily("Georgia").setFontSize("28px").toggleBold().run()}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                isDarkMode ? "bg-purple-900/30 text-purple-400 border-purple-800/50 hover:bg-purple-900/50" : "text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200"
              }`}
            >
              <Wand2 size={14}/> <span className="hidden md:inline">Title Style</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};