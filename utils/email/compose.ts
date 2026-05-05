// ─────────────────────────────────────────────────────────────────────────────
// Email Compose — Layout shell, composeEmail() & decomposeEmail()
// ─────────────────────────────────────────────────────────────────────────────

import { EmailBlock, renderBlock } from './blocks'

export interface ComposeOptions {
  preheaderText?: string
}

const FONT_STACK = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif`

// ── Layout pieces ───────────────────────────────────────────────────────────

const HEAD = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>Christians Innovate</title>

    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <style>
        * { font-family: Arial, sans-serif !important; }
        table { border-collapse: collapse; }
    </style>
    <![endif]-->

    <style>
        :root { color-scheme: light; supported-color-schemes: light; }
        html, body { margin: 0 auto !important; padding: 0 !important; height: 100% !important; width: 100% !important; }
        * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
        div[style*="margin: 16px 0"] { margin: 0 !important; }
        #MessageViewBody, #MessageWebViewDiv { width: 100% !important; }
        table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
        table { border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important; }
        img { -ms-interpolation-mode: bicubic; max-width: 100%; height: auto; display: block; border: 0; }
        a { text-decoration: none; color: #2563eb; }

        body {
            font-family: ${FONT_STACK};
            color: #171717;
            line-height: 1.6;
            background-color: #ffffff;
        }

        .btn-primary:hover { background-color: #1d4ed8 !important; }
        .link-arrow:hover { opacity: 0.85; }

        @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; }
            .mobile-padding { padding-left: 16px !important; padding-right: 16px !important; }
            .mobile-padding-inner { padding-left: 24px !important; padding-right: 24px !important; }
            .stack { display: block !important; width: 100% !important; max-width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
            .stack-spacer { display: block !important; height: 12px !important; width: 100% !important; }
            .mobile-center { text-align: center !important; }
            .mobile-full-width { width: 100% !important; text-align: center !important; }
            .mobile-hide { display: none !important; }
            .mobile-font-lg { font-size: 24px !important; }
        }

    </style>
</head>`

function buildPreheader(text: string): string {
  return `<div style="display: none; font-size: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
        ${text}
        &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
    </div>`
}

const ACCENT_BAR = `<table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: auto; width: 100%; max-width: 600px;" class="email-container">
            <tr>
                <td style="height: 4px; background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%); font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>
        </table>`

const LOGO_HEADER = `<table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: auto; width: 100%; max-width: 600px;" class="email-container">
            <tr>
                <td style="padding: 40px 0; text-align: center;">
                    <a href="{{site_url}}" style="display: inline-block; text-decoration: none;">
                        <!--[if mso]>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"><tr><td valign="middle">
                        <![endif]-->
                        <img src="{{site_url}}/logo.png" alt="Christians Innovate" width="40" height="40" style="display: inline-block; vertical-align: middle; width: 40px; height: 40px; object-fit: contain; border: 0;" />
                        <!--[if mso]>
                        </td><td valign="middle" style="padding-left: 10px;">
                        <![endif]-->
                        <span style="font-family: ${FONT_STACK}; font-size: 20px; font-weight: 700; color: #111827; vertical-align: middle; letter-spacing: -0.01em; padding-left: 10px;">Christians Innovate</span>
                        <!--[if mso]>
                        </td></tr></table>
                        <![endif]-->
                    </a>
                </td>
            </tr>
        </table>`

const FOOTER = `<tr>
                <td style="padding: 60px 40px 0 40px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td style="text-align: center; padding-bottom: 20px;">
                                <a href="{{site_url}}/dashboard" style="font-family: ${FONT_STACK}; font-size: 14px; font-weight: 500; color: #6b7280; text-decoration: none; margin: 0 12px;">Dashboard</a>
                                <a href="{{site_url}}/settings" style="font-family: ${FONT_STACK}; font-size: 14px; font-weight: 500; color: #6b7280; text-decoration: none; margin: 0 12px;">Settings</a>
                            </td>
                        </tr>
                    </table>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td style="text-align: center;">
                                <p style="margin: 0 0 10px 0; font-family: ${FONT_STACK}; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                                    Faith &times; Technology &times; Entrepreneurship<br>
                                    &copy; 2026 Christians Innovate. All rights reserved.
                                </p>
                                <p style="margin: 0; font-family: ${FONT_STACK}; font-size: 12px; color: #9ca3af;">
                                    <a href="{{unsubscribe_link}}" style="color: #3b82f6; text-decoration: none;">Unsubscribe</a> from these communications.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>`

// ── composeEmail ─────────────────────────────────────────────────────────────

/**
 * Compose a complete branded email from an array of content blocks.
 * Returns self-contained HTML with {{variable}} placeholders preserved.
 * Injects <!-- BLOCK:type --> markers around each block for round-trip parsing.
 */
export function composeEmail(
  blocks: EmailBlock[],
  options: ComposeOptions = {}
): string {
  const preheader = options.preheaderText
    ? buildPreheader(options.preheaderText)
    : buildPreheader('Building for the next 5, 50, and 500 years.')

  const blockHtml = blocks.map((b) => renderBlock(b)).join('\n\n')

  // Encode the blocks array as a JSON comment for perfect round-tripping
  const blocksJson = JSON.stringify(blocks)
  const metaComment = `<!-- BLOCKS_META:${Buffer.from(blocksJson).toString('base64')} -->`

  return `${HEAD}
<body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #ffffff; font-family: ${FONT_STACK}; color: #171717;">
    <center style="width: 100%; background-color: #ffffff; padding: 20px 0 60px 0;">

        ${preheader}
        ${metaComment}

        ${ACCENT_BAR}

        ${LOGO_HEADER}

        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: auto; width: 100%; max-width: 600px;" class="email-container mobile-padding">
            <tr>
                <td style="padding-top: 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td class="mobile-padding-inner" style="padding: 40px; border: 1px solid #f3f4f6; border-radius: 24px; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">

${blockHtml}

                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            ${FOOTER}
        </table>

    </center>
</body>
</html>`
}

// ── decomposeEmail ──────────────────────────────────────────────────────────

/**
 * Attempt to extract the EmailBlock[] array from HTML generated by composeEmail().
 * Returns the blocks array if the BLOCKS_META comment is found, otherwise null.
 */
export function decomposeEmail(html: string): EmailBlock[] | null {
  const match = html.match(/<!-- BLOCKS_META:([A-Za-z0-9+/=]+) -->/)
  if (!match) return null

  try {
    const json = Buffer.from(match[1], 'base64').toString('utf-8')
    const blocks = JSON.parse(json) as EmailBlock[]
    // Basic validation: ensure it's an array of objects with type
    if (!Array.isArray(blocks) || blocks.some((b) => !b.type)) return null
    return blocks
  } catch {
    return null
  }
}
