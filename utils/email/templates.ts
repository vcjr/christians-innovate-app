import { EmailVariables } from './types'

/**
 * Interpolate variables into a template string
 * Supports nested variables like {{user.name}} or {{day.scripture}}
 * @param template - The template string with {{variable}} placeholders
 * @param variables - Object containing the variable values
 * @returns The rendered string with variables replaced
 */
export function interpolateTemplate(
  template: string,
  variables: EmailVariables
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const keys = path.trim().split('.')
    let value: unknown = variables

    for (const key of keys) {
      if (value && typeof value === 'object' && key in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[key]
      } else {
        // Return empty string if variable not found (prevents raw placeholders in sent emails)
        return ''
      }
    }

    return value !== undefined && value !== null ? String(value) : ''
  })
}

/**
 * Check which template variable paths would resolve to an empty / missing value
 * given a variables object. Returns an array of dot-paths that have no value.
 * Useful for guarding sends before dispatching emails with blank placeholders.
 */
export function getMissingVariables(
  template: string,
  variables: EmailVariables
): string[] {
  const paths = extractTemplateVariables(template)
  return paths.filter((path) => {
    const keys = path.split('.')
    let value: unknown = variables

    for (const key of keys) {
      if (value && typeof value === 'object' && key in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[key]
      } else {
        return true // path doesn't exist → missing
      }
    }

    return value === undefined || value === null || value === ''
  })
}

/**
 * Extract variable names from a template string
 * @param template - The template string with {{variable}} placeholders
 * @returns Array of unique variable names found in the template
 */
export function extractTemplateVariables(template: string): string[] {
  const matches = template.match(/\{\{([^}]+)\}\}/g) || []
  const variables = matches.map((match) =>
    match.replace(/\{\{|\}\}/g, '').trim()
  )
  return [...new Set(variables)]
}

/**
 * Render an email template with variables
 * @param subject - Subject line template
 * @param bodyHtml - HTML body template
 * @param bodyText - Plain text body template (optional)
 * @param variables - Variables to interpolate
 * @returns Rendered email with subject and body
 */
export function renderEmailTemplate(
  subject: string,
  bodyHtml: string,
  bodyText: string | null,
  variables: EmailVariables
): {
  subject: string
  html: string
  text?: string
} {
  return {
    subject: interpolateTemplate(subject, variables),
    html: interpolateTemplate(bodyHtml, variables),
    text: bodyText ? interpolateTemplate(bodyText, variables) : undefined,
  }
}

/**
 * Strip basic Markdown syntax and return a plain-text excerpt.
 * Strips headings, bold, italic, links, blockquotes, code, and list markers.
 * Truncates to `maxLength` characters at the nearest word boundary.
 */
export function excerptMarkdown(markdown: string | null | undefined, maxLength = 180): string {
  if (!markdown) return ''

  const plain = markdown
    .replace(/#{1,6}\s+/g, '')         // headings
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')  // bold / italic
    .replace(/_([^_]+)_/g, '$1')       // underscore italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // links
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // inline / fenced code
    .replace(/^>\s+/gm, '')            // blockquotes
    .replace(/^[-*+]\s+/gm, '')        // unordered lists
    .replace(/^\d+\.\s+/gm, '')        // ordered lists
    .replace(/\n+/g, ' ')              // collapse newlines
    .trim()

  if (plain.length <= maxLength) return plain
  // Trim at the last space before maxLength so words aren't split
  return plain.slice(0, maxLength).replace(/\s+\S*$/, '') + '\u2026'
}

/**
 * Get default unsubscribe footer HTML
 * @param unsubscribeLink - The unsubscribe URL
 * @returns HTML string for email footer
 */
export function getUnsubscribeFooter(unsubscribeLink: string): string {
  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
      <p>Christians Innovate - Building for the next 5, 50, and 500 years.</p>
      <p>
        <a href="${unsubscribeLink}" style="color: #2563eb; text-decoration: underline;">Unsubscribe from emails</a>
      </p>
    </div>
  `
}

/**
 * Wrap email content with the branded Christians Innovate email layout.
 * Includes gradient accent bar, logo header, dark-mode & Outlook support.
 * @param content - The main email content HTML
 * @param unsubscribeLink - Optional unsubscribe link
 * @returns Complete HTML email with branded layout
 */
export function wrapEmailLayout(
  content: string,
  unsubscribeLink?: string
): string {
  const fontStack = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif`

  const footer = unsubscribeLink
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding: 32px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;">
            <tr><td style="padding:24px 0 0; text-align:center; font-family:${fontStack}; font-size:13px; line-height:20px; color:#6b7280;">
              Christians Innovate &mdash; Building for the next 5, 50 &amp; 500 years.<br>
              <a href="${unsubscribeLink}" style="color:#2563eb;text-decoration:underline;">Unsubscribe</a>
            </td></tr>
          </table>
        </td></tr>
      </table>`
    : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding: 32px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;">
            <tr><td style="padding:24px 0 0; text-align:center; font-family:${fontStack}; font-size:13px; line-height:20px; color:#6b7280;">
              Christians Innovate &mdash; Building for the next 5, 50 &amp; 500 years.
            </td></tr>
          </table>
        </td></tr>
      </table>`

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Christians Innovate</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @media (prefers-color-scheme:dark){
      .email-bg{background:#1a1a2e!important}
      .card-bg{background:#1e293b!important}
      .body-text{color:#e2e8f0!important}
      .muted-text{color:#94a3b8!important}
    }
    @media only screen and (max-width:620px){
      .container{width:100%!important}
      .card-pad{padding:28px 20px!important}
    }
  </style>
</head>
<body class="email-bg" style="margin:0;padding:0;background:#f1f5f9;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background:#f1f5f9;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0">
        <!-- Accent bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#2563eb 0%,#3b82f6 50%,#60a5fa 100%);border-radius:24px 24px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
        <!-- Card -->
        <tr><td class="card-bg card-pad" style="background:#ffffff;padding:40px 48px;border-radius:0 0 24px 24px;">
          <!-- Logo -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding-bottom:32px;border-bottom:1px solid #e5e7eb;text-align:center;">
              <span style="font-family:${fontStack};font-weight:800;font-size:22px;letter-spacing:-.3px;color:#111827;">Christians Innovate</span>
            </td></tr>
          </table>
          <!-- Content -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td class="body-text" style="padding-top:32px;font-family:${fontStack};font-size:16px;line-height:26px;color:#374151;">
              ${content}
            </td></tr>
          </table>
          ${footer}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
