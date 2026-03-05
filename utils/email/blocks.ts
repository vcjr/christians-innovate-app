// ─────────────────────────────────────────────────────────────────────────────
// Email Block System — Type definitions, HTML renderers & registry
// ─────────────────────────────────────────────────────────────────────────────

/** Accent / badge colors available across blocks */
export type BadgeColor = 'blue' | 'green' | 'purple' | 'orange'

const BADGE_COLORS: Record<BadgeColor, string> = {
  blue: '#2563eb',
  green: '#10b981',
  purple: '#8b5cf6',
  orange: '#f97316',
}

// ── Block type definitions ──────────────────────────────────────────────────

export interface BadgeBlock {
  type: 'badge'
  text: string
  color: BadgeColor
}

export interface HeroBlock {
  type: 'hero'
  heading: string
  body: string // supports HTML (e.g. <strong>, {{user.name}})
}

export interface PrimaryCtaBlock {
  type: 'primary-cta'
  label: string
  url: string
}

export interface DetailCardRow {
  emoji: string
  label: string
  value: string
}

export interface DetailCardBlock {
  type: 'detail-card'
  rows: DetailCardRow[]
}

export interface FeatureGridItem {
  emoji: string
  title: string
  description: string
}

export interface FeatureGridBlock {
  type: 'feature-grid'
  sectionLabel?: string
  features: FeatureGridItem[]
}

export interface TwoColumnItem {
  badge: string
  badgeColor: BadgeColor
  title: string
  description: string
  linkText: string
  linkUrl: string
}

export interface TwoColumnBlock {
  type: 'two-column'
  sectionLabel?: string
  columns: [TwoColumnItem, TwoColumnItem]
}

export interface StatItem {
  emoji: string
  value: string
  label: string
}

export interface StatsRowBlock {
  type: 'stats-row'
  stats: [StatItem, StatItem, StatItem]
}

export interface ScriptureBlock {
  type: 'scripture'
  label: string
  text: string
  reference: string
}

export interface DividerBlock {
  type: 'divider'
}

export type EmailBlock =
  | BadgeBlock
  | HeroBlock
  | PrimaryCtaBlock
  | DetailCardBlock
  | FeatureGridBlock
  | TwoColumnBlock
  | StatsRowBlock
  | ScriptureBlock
  | DividerBlock

// ── Shared HTML helpers ─────────────────────────────────────────────────────

const FONT_STACK = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif`

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Escape text but allow whitelisted safe inline HTML:
 * <strong>, <em>, <br>, <a href="...">, and {{variable}} placeholders
 */
function escBody(str: string): string {
  // Preserve {{variables}}, <strong>, <em>, <br>, <a> tags
  // Everything else gets escaped
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Restore safe tags
    .replace(/&lt;strong&gt;/g, '<strong>')
    .replace(/&lt;\/strong&gt;/g, '</strong>')
    .replace(/&lt;em&gt;/g, '<em>')
    .replace(/&lt;\/em&gt;/g, '</em>')
    .replace(/&lt;br\s*\/?&gt;/g, '<br>')
    .replace(/&lt;a\s+href=&quot;([^&]*)&quot;&gt;/g, '<a href="$1">')
    .replace(/&lt;\/a&gt;/g, '</a>')
}

// ── Block Renderers ─────────────────────────────────────────────────────────

function renderBadge(block: BadgeBlock): string {
  const color = BADGE_COLORS[block.color] || BADGE_COLORS.blue
  return `<!-- BLOCK:badge -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td>
            <p style="margin: 0 0 20px 0; font-family: ${FONT_STACK}; font-size: 12px; font-weight: 700; color: ${color}; text-transform: uppercase; letter-spacing: 1.5px; line-height: 1;">
                ${esc(block.text)}
            </p>
        </td>
    </tr>
</table>
<!-- /BLOCK:badge -->`
}

function renderHero(block: HeroBlock): string {
  return `<!-- BLOCK:hero -->
<h2 class="mobile-font-lg" style="margin: 0 0 16px 0; font-family: ${FONT_STACK}; font-size: 28px; font-weight: 800; color: #111827; line-height: 1.2; letter-spacing: -0.02em;">
    ${escBody(block.heading)}
</h2>
<p style="margin: 0 0 24px 0; font-family: ${FONT_STACK}; font-size: 16px; color: #4b5563; line-height: 1.65;">
    ${escBody(block.body)}
</p>
<!-- /BLOCK:hero -->`
}

function renderPrimaryCta(block: PrimaryCtaBlock): string {
  return `<!-- BLOCK:primary-cta -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td style="padding-top: 8px; padding-bottom: 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td style="border-radius: 12px; background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb, #1d4ed8);">
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(block.url)}" style="height:52px;v-text-anchor:middle;width:240px;" arcsize="23%" strokecolor="#2563eb" fillcolor="#2563eb">
                        <w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${esc(block.label)}</center>
                        </v:roundrect>
                        <![endif]-->
                        <!--[if !mso]><!-->
                        <a href="${esc(block.url)}" class="btn-primary" style="background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb, #1d4ed8); font-family: ${FONT_STACK}; font-size: 16px; font-weight: 600; text-decoration: none; color: #ffffff; padding: 14px 32px; border-radius: 12px; display: inline-block; mso-padding-alt: 0; line-height: 1.4;">
                            ${esc(block.label)}
                        </a>
                        <!--<![endif]-->
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
<!-- /BLOCK:primary-cta -->`
}

function renderDetailCard(block: DetailCardBlock): string {
  const rows = block.rows
    .map((row, i) => {
      const isLast = i === block.rows.length - 1
      const borderStyle = isLast
        ? ''
        : ' margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;'
      return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${borderStyle}">
                <tr>
                    <td valign="top" width="36" style="padding-right: 12px;">
                        <div style="width: 36px; height: 36px; background-color: #eff6ff; border-radius: 10px; text-align: center; line-height: 36px; font-size: 18px;">${row.emoji}</div>
                    </td>
                    <td valign="center">
                        <p style="margin: 0 0 2px 0; font-family: ${FONT_STACK}; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">${esc(row.label)}</p>
                        <p style="margin: 0; font-family: ${FONT_STACK}; font-size: 15px; font-weight: 600; color: #111827;">${escBody(row.value)}</p>
                    </td>
                </tr>
            </table>`
    })
    .join('\n')

  return `<!-- BLOCK:detail-card -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td style="padding-bottom: 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 16px; padding: 28px;">
                        ${rows}
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
<!-- /BLOCK:detail-card -->`
}

function renderFeatureGrid(block: FeatureGridBlock): string {
  const labelHtml = block.sectionLabel
    ? `<p style="margin: 0 0 20px 0; font-family: ${FONT_STACK}; font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">${esc(block.sectionLabel)}</p>`
    : ''

  // Build rows in pairs of 2
  const rows: string[] = []
  for (let i = 0; i < block.features.length; i += 2) {
    const left = block.features[i]
    const right = block.features[i + 1]
    const isLastRow = i + 2 >= block.features.length

    const leftCell = `<td width="50%" valign="top" class="stack" style="padding-right: 8px;${isLastRow ? '' : ' padding-bottom: 8px;'}">
                <div style="background-color: #f8fafc; border: 1px solid #f3f4f6; border-radius: 16px; padding: 20px;">
                    <p style="margin: 0 0 4px 0; font-family: ${FONT_STACK}; font-size: 15px; font-weight: 700; color: #111827;">${left.emoji} ${esc(left.title)}</p>
                    <p style="margin: 0; font-family: ${FONT_STACK}; font-size: 13px; color: #6b7280; line-height: 1.5;">${esc(left.description)}</p>
                </div>
            </td>`

    const rightCell = right
      ? `<td width="50%" valign="top" class="stack" style="padding-left: 8px;${isLastRow ? '' : ' padding-bottom: 8px;'}">
                <div style="background-color: #f8fafc; border: 1px solid #f3f4f6; border-radius: 16px; padding: 20px;">
                    <p style="margin: 0 0 4px 0; font-family: ${FONT_STACK}; font-size: 15px; font-weight: 700; color: #111827;">${right.emoji} ${esc(right.title)}</p>
                    <p style="margin: 0; font-family: ${FONT_STACK}; font-size: 13px; color: #6b7280; line-height: 1.5;">${esc(right.description)}</p>
                </div>
            </td>`
      : '<td width="50%" valign="top" class="stack" style="padding-left: 8px;"></td>'

    rows.push(`<tr>${leftCell}${rightCell}</tr>`)
  }

  return `<!-- BLOCK:feature-grid -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td style="padding-bottom: 32px;">
            ${labelHtml}
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                ${rows.join('\n                ')}
            </table>
        </td>
    </tr>
</table>
<!-- /BLOCK:feature-grid -->`
}

function renderTwoColumn(block: TwoColumnBlock): string {
  const labelHtml = block.sectionLabel
    ? `<p style="margin: 0 0 20px 0; font-family: ${FONT_STACK}; font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">${esc(block.sectionLabel)}</p>`
    : ''

  const cols = block.columns
    .map((col, i) => {
      const pad = i === 0 ? 'padding-right: 8px;' : 'padding-left: 8px;'
      const badgeColor = BADGE_COLORS[col.badgeColor] || BADGE_COLORS.blue
      return `<td width="50%" valign="top" class="stack" style="${pad}">
                <div style="padding: 20px; border: 1px solid #f3f4f6; border-radius: 16px;">
                    <p style="margin: 0 0 8px 0; font-family: ${FONT_STACK}; font-size: 12px; font-weight: 700; color: ${badgeColor}; text-transform: uppercase; letter-spacing: 1px;">${esc(col.badge)}</p>
                    <p style="margin: 0 0 8px 0; font-family: ${FONT_STACK}; font-size: 15px; font-weight: 700; color: #111827;">${esc(col.title)}</p>
                    <p style="margin: 0 0 12px 0; font-family: ${FONT_STACK}; font-size: 13px; color: #6b7280; line-height: 1.5;">${esc(col.description)}</p>
                    <a href="${esc(col.linkUrl)}" style="font-family: ${FONT_STACK}; font-size: 13px; font-weight: 600; color: #2563eb; text-decoration: none;">${esc(col.linkText)} &rarr;</a>
                </div>
            </td>`
    })
    .join('\n')

  return `<!-- BLOCK:two-column -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td style="padding-bottom: 32px;">
            ${labelHtml}
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    ${cols}
                </tr>
            </table>
        </td>
    </tr>
</table>
<!-- /BLOCK:two-column -->`
}

function renderStatsRow(block: StatsRowBlock): string {
  const paddings = ['padding-right: 8px;', 'padding-left: 4px; padding-right: 4px;', 'padding-left: 8px;']
  const cells = block.stats
    .map(
      (stat, i) => `<td width="33%" class="stack" style="${paddings[i]}">
                <div style="text-align: center; padding: 20px 12px; background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 14px;">
                    <p style="margin: 0 0 2px 0; font-family: ${FONT_STACK}; font-size: 24px; font-weight: 800; color: #111827; line-height: 1.2;">${stat.emoji} ${escBody(stat.value)}</p>
                    <p style="margin: 0; font-family: ${FONT_STACK}; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">${esc(stat.label)}</p>
                </div>
            </td>`
    )
    .join('\n')

  return `<!-- BLOCK:stats-row -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td style="padding-bottom: 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    ${cells}
                </tr>
            </table>
        </td>
    </tr>
</table>
<!-- /BLOCK:stats-row -->`
}

function renderScripture(block: ScriptureBlock): string {
  return `<!-- BLOCK:scripture -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td style="padding-top: 32px; padding-bottom: 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td style="background-color: #f8fafc; border-radius: 16px; padding: 0; border: 1px solid #eff6ff; overflow: hidden;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                                <td style="width: 4px; background-color: #3b82f6;" width="4"></td>
                                <td style="padding: 24px;">
                                    <p style="margin: 0 0 8px 0; font-family: ${FONT_STACK}; font-size: 11px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 1.5px;">
                                        ${esc(block.label)}
                                    </p>
                                    <p style="margin: 0; font-family: ${FONT_STACK}; font-size: 17px; font-weight: 600; color: #1e3a8a; line-height: 1.6; font-style: italic;">
                                        &ldquo;${escBody(block.text)}&rdquo;
                                    </p>
                                    <p style="margin: 12px 0 0 0; font-family: ${FONT_STACK}; font-size: 13px; color: #64748b; font-weight: 500;">
                                        &mdash; ${esc(block.reference)}
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
<!-- /BLOCK:scripture -->`
}

function renderDivider(): string {
  return `<!-- BLOCK:divider -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td style="padding-top: 24px; padding-bottom: 24px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td style="border-top: 1px solid #e5e7eb; font-size: 0; line-height: 0; height: 1px;">&nbsp;</td>
                </tr>
            </table>
        </td>
    </tr>
</table>
<!-- /BLOCK:divider -->`
}

// ── Dispatcher ──────────────────────────────────────────────────────────────

export function renderBlock(block: EmailBlock): string {
  switch (block.type) {
    case 'badge':
      return renderBadge(block)
    case 'hero':
      return renderHero(block)
    case 'primary-cta':
      return renderPrimaryCta(block)
    case 'detail-card':
      return renderDetailCard(block)
    case 'feature-grid':
      return renderFeatureGrid(block)
    case 'two-column':
      return renderTwoColumn(block)
    case 'stats-row':
      return renderStatsRow(block)
    case 'scripture':
      return renderScripture(block)
    case 'divider':
      return renderDivider()
    default:
      return ''
  }
}

// ── Block Registry (for the visual editor UI) ───────────────────────────────

export interface BlockRegistryEntry {
  type: EmailBlock['type']
  name: string
  description: string
  icon: string // Lucide icon name
  defaultConfig: EmailBlock
}

export const BLOCK_REGISTRY: BlockRegistryEntry[] = [
  {
    type: 'badge',
    name: 'Badge',
    description: 'Uppercase colored label',
    icon: 'Tag',
    defaultConfig: { type: 'badge', text: 'Announcement', color: 'blue' },
  },
  {
    type: 'hero',
    name: 'Hero',
    description: 'Heading + body paragraph',
    icon: 'Type',
    defaultConfig: {
      type: 'hero',
      heading: 'Your Heading Here',
      body: 'Hi {{user.name}}, write your message here.',
    },
  },
  {
    type: 'primary-cta',
    name: 'Button',
    description: 'Call-to-action button',
    icon: 'MousePointerClick',
    defaultConfig: {
      type: 'primary-cta',
      label: 'Get Started →',
      url: '{{site_url}}/dashboard',
    },
  },
  {
    type: 'detail-card',
    name: 'Detail Card',
    description: 'Icon + label + value rows',
    icon: 'ListChecks',
    defaultConfig: {
      type: 'detail-card',
      rows: [
        { emoji: '📅', label: 'When', value: 'Thursday at 7 PM' },
        { emoji: '💬', label: 'Topic', value: 'Faith & Innovation' },
        { emoji: '🔗', label: 'Where', value: 'Zoom — link below' },
      ],
    },
  },
  {
    type: 'feature-grid',
    name: 'Feature Grid',
    description: '2×N responsive feature cards',
    icon: 'LayoutGrid',
    defaultConfig: {
      type: 'feature-grid',
      sectionLabel: 'Features',
      features: [
        { emoji: '📖', title: 'Feature One', description: 'Description of this feature.' },
        { emoji: '🚀', title: 'Feature Two', description: 'Description of this feature.' },
      ],
    },
  },
  {
    type: 'two-column',
    name: 'Two Column',
    description: 'Side-by-side highlight cards',
    icon: 'Columns2',
    defaultConfig: {
      type: 'two-column',
      sectionLabel: 'Highlights',
      columns: [
        {
          badge: 'Category',
          badgeColor: 'green',
          title: 'Left Card',
          description: 'Description text here.',
          linkText: 'Learn More',
          linkUrl: '{{site_url}}/dashboard',
        },
        {
          badge: 'Category',
          badgeColor: 'purple',
          title: 'Right Card',
          description: 'Description text here.',
          linkText: 'Learn More',
          linkUrl: '{{site_url}}/dashboard',
        },
      ],
    },
  },
  {
    type: 'stats-row',
    name: 'Stats Row',
    description: 'Three metric pills in a row',
    icon: 'BarChart3',
    defaultConfig: {
      type: 'stats-row',
      stats: [
        { emoji: '🚀', value: '{{digest.launches}}', label: 'Launches' },
        { emoji: '🙏', value: '{{digest.prayers}}', label: 'Prayers' },
        { emoji: '🎉', value: '{{digest.wins}}', label: 'Wins' },
      ],
    },
  },
  {
    type: 'scripture',
    name: 'Scripture',
    description: 'Scripture callout with accent',
    icon: 'BookOpen',
    defaultConfig: {
      type: 'scripture',
      label: 'Scripture of the Day',
      text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.',
      reference: 'Colossians 3:23',
    },
  },
  {
    type: 'divider',
    name: 'Divider',
    description: 'Thin horizontal separator',
    icon: 'Minus',
    defaultConfig: { type: 'divider' },
  },
]
