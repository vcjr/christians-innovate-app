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
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        // Return the original placeholder if variable not found
        return match
      }
    }

    return value !== undefined && value !== null ? String(value) : match
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
 * Wrap email content with a standard email layout
 * @param content - The main email content HTML
 * @param unsubscribeLink - Optional unsubscribe link
 * @returns Complete HTML email with layout
 */
export function wrapEmailLayout(
  content: string,
  unsubscribeLink?: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Christians Innovate</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px;">
              ${content}
              ${unsubscribeLink ? getUnsubscribeFooter(unsubscribeLink) : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
