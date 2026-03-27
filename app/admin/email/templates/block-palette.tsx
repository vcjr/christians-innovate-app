'use client'

import {
  Tag,
  Type,
  MousePointerClick,
  ListChecks,
  LayoutGrid,
  Columns2,
  BarChart3,
  BookOpen,
  Minus,
  X,
} from 'lucide-react'
import { BLOCK_REGISTRY, type EmailBlock } from '@/utils/email/blocks'

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

interface BlockPaletteProps {
  onSelect: (block: EmailBlock) => void
  onClose: () => void
}

export function BlockPalette({ onSelect, onClose }: BlockPaletteProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Add Block</h3>
            <p className="text-sm text-gray-500">Choose a content block to add</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
          {BLOCK_REGISTRY.map((entry) => {
            const Icon = ICON_MAP[entry.icon] || Tag
            return (
              <button
                key={entry.type}
                type="button"
                onClick={() => {
                  // Deep clone the default config so each inserted block is independent
                  const block = JSON.parse(
                    JSON.stringify(entry.defaultConfig)
                  ) as EmailBlock
                  onSelect(block)
                  onClose()
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition group text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition">
                  <Icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {entry.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                    {entry.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
