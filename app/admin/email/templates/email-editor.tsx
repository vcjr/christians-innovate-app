'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Code2, Eye, LayoutGrid, AlertTriangle } from 'lucide-react'
import { BlockEditor } from './block-editor'
import { decomposeEmail } from '@/utils/email/compose'

type EditorMode = 'blocks' | 'html' | 'preview'

interface EmailEditorProps {
  content: string
  onChange: (html: string) => void
}

export function EmailEditor({ content, onChange }: EmailEditorProps) {
  const [mode, setMode] = useState<EditorMode>('blocks')
  const [rawHtml, setRawHtml] = useState(content)
  const [showHtmlWarning, setShowHtmlWarning] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Sync when parent updates content (e.g. switching templates)
  useEffect(() => {
    setRawHtml(content)
  }, [content])

  // Auto-resize iframe to fit its content
  useEffect(() => {
    if (mode !== 'preview' || !iframeRef.current) return
    const iframe = iframeRef.current
    const resize = () => {
      try {
        const body = iframe.contentDocument?.body
        if (body) {
          iframe.style.height = body.scrollHeight + 'px'
        }
      } catch {
        // cross-origin guard (shouldn't happen with srcDoc)
      }
    }
    iframe.addEventListener('load', resize)
    return () => iframe.removeEventListener('load', resize)
  }, [mode, rawHtml])

  const handleChange = useCallback(
    (value: string) => {
      setRawHtml(value)
      onChange(value)
    },
    [onChange],
  )

  /** Switch to a new tab, with safety checks */
  const switchMode = (next: EditorMode) => {
    // If switching from HTML → Blocks, check if we can decompose
    if (mode === 'html' && next === 'blocks') {
      const blocks = decomposeEmail(rawHtml)
      if (!blocks && rawHtml.trim().length > 0) {
        // Raw HTML that wasn't composed from blocks — warn user
        setShowHtmlWarning(true)
        return
      }
    }
    setMode(next)
  }

  const confirmSwitchToBlocks = () => {
    setShowHtmlWarning(false)
    setMode('blocks')
  }

  const tabHint: Record<EditorMode, string> = {
    blocks: 'Drag-and-drop block builder — compose emails visually',
    html: 'Write HTML with inline styles — this is what gets sent',
    preview: 'Exact render of what recipients will see',
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Tab bar */}
      <div className="bg-gray-100 border-b border-gray-200 p-2 flex items-center gap-2">
        {([
          { id: 'blocks' as const, icon: LayoutGrid, label: 'Blocks' },
          { id: 'html' as const, icon: Code2, label: 'HTML' },
          { id: 'preview' as const, icon: Eye, label: 'Preview' },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchMode(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition flex items-center gap-1.5 ${mode === tab.id
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
        <span className="text-xs text-gray-500 ml-2">{tabHint[mode]}</span>
      </div>

      {/* Warning dialog: switching from HTML to Blocks with non-block HTML */}
      {showHtmlWarning && (
        <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              This HTML wasn&apos;t created with the block builder
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Switching to Blocks mode will start a fresh canvas. Your current
              HTML is preserved in the HTML tab.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={confirmSwitchToBlocks}
                className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded hover:bg-amber-700 transition"
              >
                Switch to Blocks anyway
              </button>
              <button
                type="button"
                onClick={() => setShowHtmlWarning(false)}
                className="px-3 py-1.5 text-xs font-medium bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50 transition"
              >
                Stay in HTML
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor panes */}
      {mode === 'blocks' && (
        <BlockEditor initialContent={rawHtml} onChange={handleChange} />
      )}

      {mode === 'html' && (
        <textarea
          value={rawHtml}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full min-h-[400px] p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-white"
          placeholder="Enter HTML with inline styles..."
          spellCheck={false}
        />
      )}

      {mode === 'preview' && (
        <div className="bg-gray-50 p-4">
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <iframe
              ref={iframeRef}
              srcDoc={rawHtml}
              title="Email preview"
              sandbox="allow-same-origin"
              className="w-full min-h-[400px] block"
              style={{ border: 'none' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
