'use client'

import { Trash2, Plus } from 'lucide-react'
import type {
  EmailBlock,
  BadgeBlock,
  BadgeColor,
  HeroBlock,
  PrimaryCtaBlock,
  DetailCardBlock,
  FeatureGridBlock,
  TwoColumnBlock,
  StatsRowBlock,
  ScriptureBlock,
} from '@/utils/email/blocks'

interface BlockConfigPanelProps {
  block: EmailBlock
  onChange: (updated: EmailBlock) => void
}

// ── Shared tiny components ──────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${mono ? 'font-mono' : ''}`}
    />
  )
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
    />
  )
}

function ColorRadio({
  value,
  onChange,
}: {
  value: BadgeColor
  onChange: (v: BadgeColor) => void
}) {
  const options: { value: BadgeColor; color: string; label: string }[] = [
    { value: 'blue', color: 'bg-blue-500', label: 'Blue' },
    { value: 'green', color: 'bg-emerald-500', label: 'Green' },
    { value: 'purple', color: 'bg-violet-500', label: 'Purple' },
    { value: 'orange', color: 'bg-orange-500', label: 'Orange' },
  ]
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${value === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <span className={`w-3 h-3 rounded-full ${opt.color}`} />
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Per-block config forms ──────────────────────────────────────────────────

function BadgeConfig({
  block,
  onChange,
}: {
  block: BadgeBlock
  onChange: (b: BadgeBlock) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Label Text</Label>
        <Input
          value={block.text}
          onChange={(text) => onChange({ ...block, text })}
          placeholder="e.g., This Week"
        />
      </div>
      <div>
        <Label>Color</Label>
        <ColorRadio
          value={block.color}
          onChange={(color) => onChange({ ...block, color })}
        />
      </div>
    </div>
  )
}

function HeroConfig({
  block,
  onChange,
}: {
  block: HeroBlock
  onChange: (b: HeroBlock) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Heading</Label>
        <Input
          value={block.heading}
          onChange={(heading) => onChange({ ...block, heading })}
          placeholder="Your headline"
        />
      </div>
      <div>
        <Label>Body</Label>
        <Textarea
          value={block.body}
          onChange={(body) => onChange({ ...block, body })}
          placeholder="Hi {{user.name}}, your message here..."
          rows={4}
        />
        <p className="mt-1 text-xs text-gray-400">
          Supports {'{{variables}}'}, &lt;strong&gt;, &lt;em&gt;, &lt;a href=&quot;...&quot;&gt;
        </p>
      </div>
    </div>
  )
}

function CtaConfig({
  block,
  onChange,
}: {
  block: PrimaryCtaBlock
  onChange: (b: PrimaryCtaBlock) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Button Label</Label>
        <Input
          value={block.label}
          onChange={(label) => onChange({ ...block, label })}
          placeholder="Get Started →"
        />
      </div>
      <div>
        <Label>URL</Label>
        <Input
          value={block.url}
          onChange={(url) => onChange({ ...block, url })}
          placeholder="{{site_url}}/dashboard"
          mono
        />
      </div>
    </div>
  )
}

function DetailCardConfig({
  block,
  onChange,
}: {
  block: DetailCardBlock
  onChange: (b: DetailCardBlock) => void
}) {
  const updateRow = (
    idx: number,
    field: 'emoji' | 'label' | 'value',
    val: string
  ) => {
    const rows = [...block.rows]
    rows[idx] = { ...rows[idx], [field]: val }
    onChange({ ...block, rows })
  }

  const addRow = () => {
    onChange({
      ...block,
      rows: [...block.rows, { emoji: '📌', label: 'Label', value: 'Value' }],
    })
  }

  const removeRow = (idx: number) => {
    onChange({ ...block, rows: block.rows.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-3">
      <Label>Detail Rows</Label>
      {block.rows.map((row, idx) => (
        <div
          key={idx}
          className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg"
        >
          <div className="w-12">
            <Input
              value={row.emoji}
              onChange={(v) => updateRow(idx, 'emoji', v)}
              placeholder="📅"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Input
              value={row.label}
              onChange={(v) => updateRow(idx, 'label', v)}
              placeholder="Label"
            />
            <Input
              value={row.value}
              onChange={(v) => updateRow(idx, 'value', v)}
              placeholder="Value (supports {{variables}})"
            />
          </div>
          <button
            type="button"
            onClick={() => removeRow(idx)}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition mt-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        <Plus className="w-4 h-4" />
        Add Row
      </button>
    </div>
  )
}

function FeatureGridConfig({
  block,
  onChange,
}: {
  block: FeatureGridBlock
  onChange: (b: FeatureGridBlock) => void
}) {
  const updateFeature = (
    idx: number,
    field: 'emoji' | 'title' | 'description',
    val: string
  ) => {
    const features = [...block.features]
    features[idx] = { ...features[idx], [field]: val }
    onChange({ ...block, features })
  }

  const addFeature = () => {
    onChange({
      ...block,
      features: [
        ...block.features,
        { emoji: '✨', title: 'Feature', description: 'Description' },
      ],
    })
  }

  const removeFeature = (idx: number) => {
    onChange({
      ...block,
      features: block.features.filter((_, i) => i !== idx),
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Section Label (optional)</Label>
        <Input
          value={block.sectionLabel || ''}
          onChange={(sectionLabel) =>
            onChange({ ...block, sectionLabel: sectionLabel || undefined })
          }
          placeholder="e.g., What's waiting for you"
        />
      </div>
      <div className="space-y-3">
        <Label>Features</Label>
        {block.features.map((feat, idx) => (
          <div
            key={idx}
            className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg"
          >
            <div className="w-12">
              <Input
                value={feat.emoji}
                onChange={(v) => updateFeature(idx, 'emoji', v)}
                placeholder="📖"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Input
                value={feat.title}
                onChange={(v) => updateFeature(idx, 'title', v)}
                placeholder="Feature title"
              />
              <Textarea
                value={feat.description}
                onChange={(v) => updateFeature(idx, 'description', v)}
                placeholder="Feature description"
                rows={2}
              />
            </div>
            <button
              type="button"
              onClick={() => removeFeature(idx)}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition mt-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addFeature}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Feature
        </button>
      </div>
    </div>
  )
}

function TwoColumnConfig({
  block,
  onChange,
}: {
  block: TwoColumnBlock
  onChange: (b: TwoColumnBlock) => void
}) {
  const updateCol = (
    idx: 0 | 1,
    field: keyof TwoColumnBlock['columns'][0],
    val: string
  ) => {
    const columns = [...block.columns] as TwoColumnBlock['columns']
    columns[idx] = { ...columns[idx], [field]: val }
    onChange({ ...block, columns })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Section Label (optional)</Label>
        <Input
          value={block.sectionLabel || ''}
          onChange={(sectionLabel) =>
            onChange({ ...block, sectionLabel: sectionLabel || undefined })
          }
          placeholder="e.g., Also this week"
        />
      </div>
      {([0, 1] as const).map((idx) => (
        <div key={idx} className="p-3 bg-gray-50 rounded-lg space-y-2">
          <p className="text-xs font-bold text-gray-500">
            {idx === 0 ? 'Left' : 'Right'} Column
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={block.columns[idx].badge}
                onChange={(v) => updateCol(idx, 'badge', v)}
                placeholder="Badge"
              />
            </div>
            <ColorRadio
              value={block.columns[idx].badgeColor}
              onChange={(v) => updateCol(idx, 'badgeColor', v)}
            />
          </div>
          <Input
            value={block.columns[idx].title}
            onChange={(v) => updateCol(idx, 'title', v)}
            placeholder="Title"
          />
          <Textarea
            value={block.columns[idx].description}
            onChange={(v) => updateCol(idx, 'description', v)}
            placeholder="Description"
            rows={2}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={block.columns[idx].linkText}
                onChange={(v) => updateCol(idx, 'linkText', v)}
                placeholder="Link text"
              />
            </div>
            <div className="flex-1">
              <Input
                value={block.columns[idx].linkUrl}
                onChange={(v) => updateCol(idx, 'linkUrl', v)}
                placeholder="Link URL"
                mono
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatsRowConfig({
  block,
  onChange,
}: {
  block: StatsRowBlock
  onChange: (b: StatsRowBlock) => void
}) {
  const updateStat = (
    idx: 0 | 1 | 2,
    field: 'emoji' | 'value' | 'label',
    val: string
  ) => {
    const stats = [...block.stats] as StatsRowBlock['stats']
    stats[idx] = { ...stats[idx], [field]: val }
    onChange({ ...block, stats })
  }

  return (
    <div className="space-y-3">
      <Label>Stats (exactly 3)</Label>
      {([0, 1, 2] as const).map((idx) => (
        <div key={idx} className="flex gap-2 items-center p-3 bg-gray-50 rounded-lg">
          <div className="w-12">
            <Input
              value={block.stats[idx].emoji}
              onChange={(v) => updateStat(idx, 'emoji', v)}
              placeholder="🚀"
            />
          </div>
          <div className="flex-1">
            <Input
              value={block.stats[idx].value}
              onChange={(v) => updateStat(idx, 'value', v)}
              placeholder="Value (e.g., {{digest.launches}})"
            />
          </div>
          <div className="flex-1">
            <Input
              value={block.stats[idx].label}
              onChange={(v) => updateStat(idx, 'label', v)}
              placeholder="Label"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function ScriptureConfig({
  block,
  onChange,
}: {
  block: ScriptureBlock
  onChange: (b: ScriptureBlock) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Label</Label>
        <Input
          value={block.label}
          onChange={(label) => onChange({ ...block, label })}
          placeholder="e.g., Scripture of the Day"
        />
      </div>
      <div>
        <Label>Quote Text</Label>
        <Textarea
          value={block.text}
          onChange={(text) => onChange({ ...block, text })}
          placeholder="Enter the scripture text..."
          rows={3}
        />
      </div>
      <div>
        <Label>Reference</Label>
        <Input
          value={block.reference}
          onChange={(reference) => onChange({ ...block, reference })}
          placeholder="e.g., Colossians 3:23"
        />
      </div>
    </div>
  )
}

// ── Main panel component ────────────────────────────────────────────────────

export function BlockConfigPanel({ block, onChange }: BlockConfigPanelProps) {
  switch (block.type) {
    case 'badge':
      return (
        <BadgeConfig
          block={block}
          onChange={(b) => onChange(b)}
        />
      )
    case 'hero':
      return (
        <HeroConfig
          block={block}
          onChange={(b) => onChange(b)}
        />
      )
    case 'primary-cta':
      return (
        <CtaConfig
          block={block}
          onChange={(b) => onChange(b)}
        />
      )
    case 'detail-card':
      return (
        <DetailCardConfig
          block={block}
          onChange={(b) => onChange(b)}
        />
      )
    case 'feature-grid':
      return (
        <FeatureGridConfig
          block={block}
          onChange={(b) => onChange(b)}
        />
      )
    case 'two-column':
      return (
        <TwoColumnConfig
          block={block}
          onChange={(b) => onChange(b)}
        />
      )
    case 'stats-row':
      return (
        <StatsRowConfig
          block={block}
          onChange={(b) => onChange(b)}
        />
      )
    case 'scripture':
      return (
        <ScriptureConfig
          block={block}
          onChange={(b) => onChange(b)}
        />
      )
    case 'divider':
      return (
        <div className="py-6 text-center text-sm text-gray-400">
          No configuration needed — this is a simple divider line.
        </div>
      )
    default:
      return null
  }
}
