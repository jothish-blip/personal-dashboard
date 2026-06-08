import { Extension } from '@tiptap/react';
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
    ];
  }
});

export const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    bulletList: { keepMarks: true, keepAttributes: false },
    orderedList: { keepMarks: true, keepAttributes: false },
    underline: false,
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