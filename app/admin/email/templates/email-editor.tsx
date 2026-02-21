'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useEffect } from 'react'
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Palette,
  Code2,
  Eye,
} from 'lucide-react'
import { useState } from 'react'

interface EmailEditorProps {
  content: string
  onChange: (html: string) => void
}

// MenuButton component defined outside to avoid recreation on each render
const MenuButton = ({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${active ? 'bg-gray-200' : ''
      }`}
  >
    {children}
  </button>
)

export function EmailEditor({
  content,
  onChange,
}: EmailEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [colorValue, setColorValue] = useState('#000000')
  const [mode, setMode] = useState<'wysiwyg' | 'html'>('html') // Default to HTML mode
  const [rawHtml, setRawHtml] = useState(content)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: null,
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: null,
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: 'color: #2563eb; text-decoration: underline;',
        },
      }),
      TextStyle,
      Color,
    ],
    content,
    parseOptions: {
      preserveWhitespace: 'full',
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 border border-gray-200 rounded-lg',
      },
    },
    onUpdate: ({ editor, transaction }) => {
      // Only call onChange if the update was triggered by user input
      // (not by initial content setting or programmatic changes)
      if (transaction.docChanged) {
        onChange(editor.getHTML())
      }
    },
  })

  // Update editor content when content prop changes (e.g., when switching templates)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  // Sync rawHtml with content prop
  useEffect(() => {
    setRawHtml(content)
  }, [content])

  if (!editor) {
    return null
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run()
    }
  }

  const applyColor = () => {
    editor.chain().focus().setColor(colorValue).run()
    setShowColorPicker(false)
  }

  const handleModeSwitch = (newMode: 'wysiwyg' | 'html') => {
    if (newMode === 'html' && mode === 'wysiwyg') {
      // Switching from WYSIWYG to HTML - get current editor content
      setRawHtml(editor.getHTML())
    } else if (newMode === 'wysiwyg' && mode === 'html') {
      // Switching from HTML to WYSIWYG - update editor with raw HTML
      editor.commands.setContent(rawHtml, { emitUpdate: false })
      onChange(rawHtml)
    }
    setMode(newMode)
  }

  const handleRawHtmlChange = (value: string) => {
    setRawHtml(value)
    onChange(value)
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Mode Toggle */}
      <div className="bg-gray-100 border-b border-gray-200 p-2 flex items-center gap-2">
        <span className="text-xs font-medium text-gray-600 mr-2">Editor Mode:</span>
        <button
          type="button"
          onClick={() => handleModeSwitch('wysiwyg')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition flex items-center gap-1.5 ${mode === 'wysiwyg'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Visual Editor
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch('html')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition flex items-center gap-1.5 ${mode === 'html'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Raw HTML
        </button>
        <span className="text-xs text-gray-500 ml-2">
          {mode === 'html' ? 'Recommended: Edit raw HTML with inline styles for emails' : 'Visual editing (strips inline styles - not recommended for emails)'}
        </span>
      </div>

      {mode === 'wysiwyg' ? (
        <>
          {/* Toolbar */}
          <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </MenuButton>

            <MenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </MenuButton>

            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </MenuButton>

            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </MenuButton>

            <div className="w-px bg-gray-300 mx-1" />

            <MenuButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </MenuButton>

            <MenuButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </MenuButton>

            <div className="w-px bg-gray-300 mx-1" />

            <MenuButton onClick={addLink} active={editor.isActive('link')} title="Add Link">
              <LinkIcon className="w-4 h-4" />
            </MenuButton>

            <div className="relative">
              <MenuButton
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Text Color"
              >
                <Palette className="w-4 h-4" />
              </MenuButton>

              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <input
                    type="color"
                    value={colorValue}
                    onChange={(e) => setColorValue(e.target.value)}
                    className="w-20 h-8 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={applyColor}
                    className="mt-2 w-full px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            <div className="w-px bg-gray-300 mx-1" />

            <MenuButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </MenuButton>

            <MenuButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </MenuButton>
          </div>

          {/* Editor Content */}
          <EditorContent editor={editor} />
        </>
      ) : (
        /* Raw HTML Editor */
        <textarea
          value={rawHtml}
          onChange={(e) => handleRawHtmlChange(e.target.value)}
          className="w-full min-h-[400px] p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          placeholder="Enter HTML content with inline styles..."
          spellCheck={false}
        />
      )}
    </div>
  )
}
