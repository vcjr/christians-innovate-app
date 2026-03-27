'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  GripVertical,
  Tag,
  Type,
  MousePointerClick,
  ListChecks,
  LayoutGrid,
  Columns2,
  BarChart3,
  BookOpen,
  Minus,
  Sparkles,
} from 'lucide-react'
import type { EmailBlock } from '@/utils/email/blocks'
import { BLOCK_REGISTRY } from '@/utils/email/blocks'
import { composeEmail, decomposeEmail } from '@/utils/email/compose'
import { BlockPalette } from './block-palette'
import { BlockConfigPanel } from './block-config-panel'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Tag,
  Type,
  MousePointerClick,
  ListChecks,
  LayoutGrid,
  Columns2,
  BarChart3,
  BookOpen,
  Minus,
}

// ── Quick Start Presets ─────────────────────────────────────────────────────

export interface BlockPreset {
  name: string
  description: string
  blocks: EmailBlock[]
}

export const BLOCK_PRESETS: BlockPreset[] = [
  {
    name: 'Blank',
    description: 'Start from scratch',
    blocks: [],
  },
  {
    name: 'Newsletter',
    description: 'Weekly update with stats & highlights',
    blocks: [
      { type: 'badge', text: 'This Week in the Collective', color: 'blue' },
      {
        type: 'hero',
        heading: 'Weekly Update',
        body: 'Hi {{user.name}}, here\'s what happened in the community this week.',
      },
      { type: 'divider' },
      {
        type: 'stats-row',
        stats: [
          { emoji: '🚀', value: '{{digest.launches}}', label: 'Launches' },
          { emoji: '🙏', value: '{{digest.prayers}}', label: 'Prayers' },
          { emoji: '🎉', value: '{{digest.wins}}', label: 'Wins' },
        ],
      },
      {
        type: 'two-column',
        sectionLabel: 'Also this week',
        columns: [
          {
            badge: 'Meeting',
            badgeColor: 'green',
            title: 'Thursday Convening',
            description: 'Join the collective for our weekly discussion.',
            linkText: 'RSVP',
            linkUrl: '{{site_url}}/dashboard',
          },
          {
            badge: 'Bible Year',
            badgeColor: 'purple',
            title: 'Daily Reading',
            description: 'Stay consistent with our community reading plan.',
            linkText: 'Read Today',
            linkUrl: '{{site_url}}/dashboard',
          },
        ],
      },
      {
        type: 'scripture',
        label: 'Fellowship Scripture',
        text: 'Wherefore comfort yourselves together, and edify one another, even as also ye do.',
        reference: '1 Thessalonians 5:11',
      },
    ],
  },
  {
    name: 'Welcome',
    description: 'New member onboarding email',
    blocks: [
      { type: 'badge', text: 'Welcome to the Collective', color: 'blue' },
      {
        type: 'hero',
        heading: "You're in, {{user.name}}.",
        body: "We're so glad you're here. Christians Innovate is a community of faith-driven builders, founders, and creatives committed to <strong>redemptive innovation</strong> — boldly building for the next 5, 50, and 500 years.",
      },
      {
        type: 'primary-cta',
        label: 'Go to Your Dashboard →',
        url: '{{site_url}}/dashboard',
      },
      {
        type: 'feature-grid',
        sectionLabel: "Here's what's waiting for you",
        features: [
          {
            emoji: '📖',
            title: 'Bible Year',
            description:
              'Read through the Bible as a community with daily guided plans.',
          },
          {
            emoji: '🚀',
            title: 'Launch & Prayer',
            description:
              'Share what you\'re building. Get prayer and accountability from the collective.',
          },
          {
            emoji: '🤝',
            title: 'Directory',
            description:
              'Connect with fellow innovators, founders, and builders in the network.',
          },
          {
            emoji: '📅',
            title: 'Convenings',
            description:
              'Join our Thursday gatherings — live discussions on faith, tech, and business.',
          },
        ],
      },
      {
        type: 'scripture',
        label: 'Our Foundation',
        text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.',
        reference: 'Colossians 3:23',
      },
    ],
  },
  {
    name: 'Meeting Reminder',
    description: 'Thursday convening invitation',
    blocks: [
      { type: 'badge', text: 'Thursday Convening', color: 'blue' },
      {
        type: 'hero',
        heading: '{{meeting.title}}',
        body: "Hi {{user.name}}, you're invited to this week's convening. We'd love to see you there.",
      },
      {
        type: 'detail-card',
        rows: [
          { emoji: '📅', label: 'When', value: '{{meeting.date}} at {{meeting.time}}' },
          { emoji: '💬', label: 'Topic', value: '{{meeting.description}}' },
          { emoji: '🔗', label: 'Where', value: 'Zoom — link below' },
        ],
      },
      {
        type: 'primary-cta',
        label: 'Join the Meeting →',
        url: '{{meeting.zoom_link}}',
      },
      {
        type: 'scripture',
        label: 'Fellowship Scripture',
        text: 'For where two or three gather in my name, there am I with them.',
        reference: 'Matthew 18:20',
      },
    ],
  },
  {
    name: 'Daily Reading',
    description: 'Bible Year daily reminder',
    blocks: [
      { type: 'badge', text: 'Bible Year', color: 'purple' },
      {
        type: 'hero',
        heading: 'Day {{day.number}}: {{day.scripture}}',
        body: "Hi {{user.name}}, today's reading for <strong>{{day.title}}</strong> is ready. Take a few minutes to read and reflect with the community.",
      },
      {
        type: 'primary-cta',
        label: 'Read Today →',
        url: '{{day.link}}',
      },
      {
        type: 'scripture',
        label: 'Today\'s Verse',
        text: 'Your word is a lamp for my feet, a light on my path.',
        reference: 'Psalm 119:105',
      },
    ],
  },
]

// ── Block summary text (for canvas card display) ────────────────────────────

function blockSummary(block: EmailBlock): string {
  switch (block.type) {
    case 'badge':
      return block.text
    case 'hero':
      return block.heading
    case 'primary-cta':
      return block.label
    case 'detail-card':
      return `${block.rows.length} detail row${block.rows.length !== 1 ? 's' : ''}`
    case 'feature-grid':
      return `${block.features.length} feature${block.features.length !== 1 ? 's' : ''}`
    case 'two-column':
      return `${block.columns[0].title} / ${block.columns[1].title}`
    case 'stats-row':
      return block.stats.map((s) => s.label).join(' · ')
    case 'scripture':
      return block.reference
    case 'divider':
      return 'Horizontal line'
    default:
      return ''
  }
}

function blockRegistryEntry(type: string) {
  return BLOCK_REGISTRY.find((e) => e.type === type)
}

// ── Main Editor Component ───────────────────────────────────────────────────

interface BlockEditorProps {
  /** Initial HTML content — will be decomposed if possible */
  initialContent: string
  /** Called when blocks change; receives the composed HTML */
  onChange: (html: string) => void
}

export function BlockEditor({ initialContent, onChange }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<EmailBlock[]>(() => {
    if (!initialContent) return []
    const parsed = decomposeEmail(initialContent)
    return parsed ?? []
  })
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showPalette, setShowPalette] = useState(false)
  const [showPresets, setShowPresets] = useState(!initialContent)
  const previewRef = useRef<HTMLIFrameElement>(null)

  // Compose HTML and notify parent whenever blocks change
  const composeAndNotify = useCallback(
    (newBlocks: EmailBlock[]) => {
      const html = composeEmail(newBlocks)
      onChange(html)
    },
    [onChange]
  )

  // Keep composed HTML in sync
  useEffect(() => {
    composeAndNotify(blocks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks])

  // Block operations
  const addBlock = (block: EmailBlock) => {
    const next = [...blocks, block]
    setBlocks(next)
    setSelectedIndex(next.length - 1)
  }

  const updateBlock = (index: number, updated: EmailBlock) => {
    const next = [...blocks]
    next[index] = updated
    setBlocks(next)
  }

  const removeBlock = (index: number) => {
    const next = blocks.filter((_, i) => i !== index)
    setBlocks(next)
    if (selectedIndex === index) setSelectedIndex(null)
    else if (selectedIndex !== null && selectedIndex > index)
      setSelectedIndex(selectedIndex - 1)
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
      ;[next[index], next[target]] = [next[target], next[index]]
    setBlocks(next)
    setSelectedIndex(target)
  }

  const loadPreset = (preset: BlockPreset) => {
    const cloned = JSON.parse(JSON.stringify(preset.blocks)) as EmailBlock[]
    setBlocks(cloned)
    setSelectedIndex(null)
    setShowPresets(false)
  }

  const selectedBlock =
    selectedIndex !== null && selectedIndex < blocks.length
      ? blocks[selectedIndex]
      : null

  // ── Preset picker ─────────────────────────────────────────────────────────

  if (showPresets && blocks.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6 text-center">
          <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-gray-900">Quick Start</h3>
          <p className="text-sm text-gray-500">
            Choose a preset to start with pre-built blocks, or start from scratch.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {BLOCK_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => loadPreset(preset)}
              className="p-4 text-left border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition"
            >
              <p className="text-sm font-semibold text-gray-900">
                {preset.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
              {preset.blocks.length > 0 && (
                <p className="text-xs text-blue-500 mt-2">
                  {preset.blocks.length} block{preset.blocks.length !== 1 ? 's' : ''}
                </p>
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowPresets(false)}
          className="mt-4 w-full text-sm text-gray-400 hover:text-gray-600 py-2"
        >
          or build from scratch
        </button>
      </div>
    )
  }

  // ── Main editor UI ────────────────────────────────────────────────────────

  return (
    <div className="flex h-[600px]">
      {/* Left: Canvas */}
      <div className="flex-1 flex flex-col border-r border-gray-200 overflow-hidden">
        {/* Canvas toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
          <span className="text-xs font-medium text-gray-500">
            {blocks.length} block{blocks.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPresets(true)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition"
            >
              Presets
            </button>
            <button
              type="button"
              onClick={() => setShowPalette(true)}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Block
            </button>
          </div>
        </div>

        {/* Block list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-sm text-gray-400 mb-3">No blocks yet</p>
              <button
                type="button"
                onClick={() => setShowPalette(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
              >
                <Plus className="w-4 h-4" />
                Add your first block
              </button>
            </div>
          ) : (
            blocks.map((block, idx) => {
              const entry = blockRegistryEntry(block.type)
              const Icon = entry ? ICON_MAP[entry.icon] || Tag : Tag
              const isSelected = selectedIndex === idx

              return (
                <div
                  key={`${block.type}-${idx}`}
                  onClick={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${isSelected
                      ? 'border-blue-400 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                >
                  {/* Grip / type icon */}
                  <div className="flex items-center gap-1.5">
                    <GripVertical className="w-4 h-4 text-gray-300" />
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-100' : 'bg-gray-100'
                        }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'
                          }`}
                      />
                    </div>
                  </div>

                  {/* Name + summary */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {entry?.name || block.type}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {blockSummary(block)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => moveBlock(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded transition"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(idx, 'down')}
                      disabled={idx === blocks.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded transition"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(idx)}
                      className="p-1 text-red-400 hover:text-red-600 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Bottom add button */}
        {blocks.length > 0 && (
          <div className="p-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowPalette(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-500 border border-dashed border-gray-300 rounded-xl hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition"
            >
              <Plus className="w-4 h-4" />
              Add Block
            </button>
          </div>
        )}
      </div>

      {/* Right: Config panel */}
      <div className="w-80 flex flex-col overflow-hidden">
        {selectedBlock ? (
          <>
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-bold text-gray-900">
                {blockRegistryEntry(selectedBlock.type)?.name || selectedBlock.type}
              </p>
              <p className="text-xs text-gray-500">
                {blockRegistryEntry(selectedBlock.type)?.description}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <BlockConfigPanel
                block={selectedBlock}
                onChange={(updated) => {
                  if (selectedIndex !== null) {
                    updateBlock(selectedIndex, updated)
                  }
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <p className="text-sm text-gray-400">
              Select a block to edit its properties
            </p>
          </div>
        )}

        {/* Live mini preview */}
        <div className="border-t border-gray-200">
          <div className="px-4 py-2 bg-gray-50">
            <p className="text-xs font-medium text-gray-500">Live Preview</p>
          </div>
          <div className="h-48 overflow-hidden bg-gray-100">
            <iframe
              ref={previewRef}
              srcDoc={composeEmail(blocks)}
              title="Email preview"
              sandbox="allow-same-origin"
              className="w-full h-full border-0"
              style={{
                transform: 'scale(0.4)',
                transformOrigin: 'top left',
                width: '250%',
                height: '250%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Block palette modal */}
      {showPalette && (
        <BlockPalette
          onSelect={addBlock}
          onClose={() => setShowPalette(false)}
        />
      )}

      {/* Presets overlay (when user clicks "Presets" from toolbar) */}
      {showPresets && blocks.length > 0 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Load Preset</h3>
            <p className="text-sm text-gray-500 mb-4">
              This will replace your current blocks. Are you sure?
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {BLOCK_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => loadPreset(preset)}
                  className="p-3 text-left border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition"
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {preset.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowPresets(false)}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
