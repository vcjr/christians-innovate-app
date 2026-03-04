-- ============================================================
-- BLOCK-SYSTEM EMAIL TEMPLATES
-- Generated from composeEmail() block system for light-mode,
-- branded HTML with BLOCKS_META round-trip support.
-- ============================================================

-- ============================================================
-- 1. DAILY READING REMINDER
-- ============================================================
INSERT INTO public.email_templates (
  template_key, name, subject, body_html, body_text, variables, description, is_active
) VALUES (
  'daily-reminder',
  'Daily Reading Reminder',
  'Your reading for today — {{day.scripture}} 📖',
  '<!DOCTYPE html>
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
            font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif;
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
</head>
<body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; color: #171717;">
    <center style="width: 100%; background-color: #ffffff; padding: 20px 0 60px 0;">

        <div style="display: none; font-size: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
        Building for the next 5, 50, and 500 years.
        &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
    </div>
        <!-- BLOCKS_META:W3sidHlwZSI6ImJhZGdlIiwidGV4dCI6IkRhaWx5IFJlYWRpbmciLCJjb2xvciI6ImJsdWUifSx7InR5cGUiOiJoZXJvIiwiaGVhZGluZyI6IvCfk5YgVG9kYXkncyBSZWFkaW5nIiwiYm9keSI6IkhpIDxzdHJvbmc+e3t1c2VyLm5hbWV9fTwvc3Ryb25nPiwgeW91ciByZWFkaW5nIGZvciA8c3Ryb25nPnt7ZGF5LnRpdGxlfX08L3N0cm9uZz4gaXMgcmVhZHkuIFN0YXkgY29uc2lzdGVudCDigJQgZXZlcnkgZGF5IGFkZHMgdXAuIn0seyJ0eXBlIjoic2NyaXB0dXJlIiwibGFiZWwiOiJUb2RheSdzIFBhc3NhZ2UiLCJ0ZXh0Ijoie3tkYXkuc2NyaXB0dXJlfX0iLCJyZWZlcmVuY2UiOiIifSx7InR5cGUiOiJwcmltYXJ5LWN0YSIsImxhYmVsIjoiT3BlbiBUb2RheSdzIERldm90aW9uYWwg4oaSIiwidXJsIjoie3tkYXkubGlua319In0seyJ0eXBlIjoiZGl2aWRlciJ9LHsidHlwZSI6Imhlcm8iLCJoZWFkaW5nIjoiIiwiYm9keSI6IjxlbT5cIkJ1aWxkaW5nIGZvciB0aGUgbmV4dCA1LCA1MCwgYW5kIDUwMCB5ZWFycy5cIjwvZW0+In1d -->

        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: auto; width: 100%; max-width: 600px;" class="email-container">
            <tr>
                <td style="height: 4px; background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%); font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>
        </table>

        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: auto; width: 100%; max-width: 600px;" class="email-container">
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
                        <span style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 700; color: #111827; vertical-align: middle; letter-spacing: -0.01em; padding-left: 10px;">Christians Innovate</span>
                        <!--[if mso]>
                        </td></tr></table>
                        <![endif]-->
                    </a>
                </td>
            </tr>
        </table>

        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: auto; width: 100%; max-width: 600px;" class="email-container mobile-padding">
            <tr>
                <td style="padding-top: 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td class="mobile-padding-inner" style="padding: 40px; border: 1px solid #f3f4f6; border-radius: 24px; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">

<!-- BLOCK:badge -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td>
            <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1.5px; line-height: 1;">
                Daily Reading
            </p>
        </td>
    </tr>
</table>
<!-- /BLOCK:badge -->

<!-- BLOCK:hero -->
<h2 class="mobile-font-lg" style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 800; color: #111827; line-height: 1.2; letter-spacing: -0.02em;">
    📖 Today''s Reading
</h2>
<p style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 16px; color: #4b5563; line-height: 1.65;">
    Hi <strong>{{user.name}}</strong>, your reading for <strong>{{day.title}}</strong> is ready. Stay consistent — every day adds up.
</p>
<!-- /BLOCK:hero -->

<!-- BLOCK:scripture -->
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
                                    <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 1.5px;">
                                        Today''s Passage
                                    </p>
                                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 17px; font-weight: 600; color: #1e3a8a; line-height: 1.6; font-style: italic;">
                                        &ldquo;{{day.scripture}}&rdquo;
                                    </p>
                                    <p style="margin: 12px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 13px; color: #64748b; font-weight: 500;">
                                        &mdash; 
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
<!-- /BLOCK:scripture -->

<!-- BLOCK:primary-cta -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td style="padding-top: 8px; padding-bottom: 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td style="border-radius: 12px; background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb, #1d4ed8);">
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{day.link}}" style="height:52px;v-text-anchor:middle;width:240px;" arcsize="23%" strokecolor="#2563eb" fillcolor="#2563eb">
                        <w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Open Today''s Devotional →</center>
                        </v:roundrect>
                        <![endif]-->
                        <!--[if !mso]><!-->
                        <a href="{{day.link}}" class="btn-primary" style="background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb, #1d4ed8); font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; color: #ffffff; padding: 14px 32px; border-radius: 12px; display: inline-block; mso-padding-alt: 0; line-height: 1.4;">
                            Open Today''s Devotional →
                        </a>
                        <!--<![endif]-->
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
<!-- /BLOCK:primary-cta -->

<!-- BLOCK:divider -->
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
<!-- /BLOCK:divider -->

<!-- BLOCK:hero -->
<h2 class="mobile-font-lg" style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 800; color: #111827; line-height: 1.2; letter-spacing: -0.02em;">
    
</h2>
<p style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 16px; color: #4b5563; line-height: 1.65;">
    <em>"Building for the next 5, 50, and 500 years."</em>
</p>
<!-- /BLOCK:hero -->

                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td style="padding: 60px 40px 0 40px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td style="text-align: center; padding-bottom: 20px;">
                                <a href="{{site_url}}/dashboard" style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 500; color: #6b7280; text-decoration: none; margin: 0 12px;">Dashboard</a>
                                <a href="{{site_url}}/settings" style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 500; color: #6b7280; text-decoration: none; margin: 0 12px;">Settings</a>
                            </td>
                        </tr>
                    </table>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td style="text-align: center;">
                                <p style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                                    Faith &times; Technology &times; Entrepreneurship<br>
                                    &copy; 2026 Christians Innovate. All rights reserved.
                                </p>
                                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 12px; color: #9ca3af;">
                                    <a href="{{unsubscribe_link}}" style="color: #3b82f6; text-decoration: none;">Unsubscribe</a> from these communications.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

    </center>
</body>
</html>',
  'Hi {{user.name}},

Your reading for {{day.title}} is ready.

Today''s Passage: {{day.scripture}}

Open your devotional: {{day.link}}

"Building for the next 5, 50, and 500 years."

Christians Innovate
Unsubscribe: {{unsubscribe_link}}',
  '["user.name","day.title","day.scripture","day.link","unsubscribe_link"]'::jsonb,
  'Daily reminder email for Bible reading plan subscribers',
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  name        = EXCLUDED.name,
  subject     = EXCLUDED.subject,
  body_html   = EXCLUDED.body_html,
  body_text   = EXCLUDED.body_text,
  variables   = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at  = now();


-- ============================================================
-- 2. WELCOME TO CHRISTIANS INNOVATE
-- ============================================================
INSERT INTO public.email_templates (
  template_key, name, subject, body_html, body_text, variables, description, is_active
) VALUES (
  'welcome',
  'Welcome to Christians Innovate',
  'Welcome to Christians Innovate, {{user.name}}! 🎉',
  '<!DOCTYPE html>
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
            font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif;
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
</head>
<body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; color: #171717;">
    <center style="width: 100%; background-color: #ffffff; padding: 20px 0 60px 0;">

        <div style="display: none; font-size: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
        Building for the next 5, 50, and 500 years.
        &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
    </div>
        <!-- BLOCKS_META:W3sidHlwZSI6ImJhZGdlIiwidGV4dCI6IldlbGNvbWUiLCJjb2xvciI6ImJsdWUifSx7InR5cGUiOiJoZXJvIiwiaGVhZGluZyI6IldlbGNvbWUgdG8gQ2hyaXN0aWFucyBJbm5vdmF0ZSEg8J+OiSIsImJvZHkiOiJIaSA8c3Ryb25nPnt7dXNlci5uYW1lfX08L3N0cm9uZz4g8J+Rizxicj48YnI+V2UncmUgc28gZ2xhZCB5b3UncmUgaGVyZS4gQ2hyaXN0aWFucyBJbm5vdmF0ZSBjb25uZWN0cyBDaHJpc3RpYW4gcHJvZmVzc2lvbmFscywgYnVpbGRlcnMsIGFuZCBlbnRyZXByZW5ldXJzIGNvbW1pdHRlZCB0byBjcmVhdGluZyB3b3JrIHRoYXQgbGFzdHMg4oCUIDxlbT5mb3IgdGhlIG5leHQgNSwgNTAsIGFuZCA1MDAgeWVhcnMuPC9lbT4ifSx7InR5cGUiOiJkaXZpZGVyIn0seyJ0eXBlIjoiZmVhdHVyZS1ncmlkIiwic2VjdGlvbkxhYmVsIjoiR2V0IFN0YXJ0ZWQiLCJmZWF0dXJlcyI6W3siZW1vamkiOiLwn5GkIiwidGl0bGUiOiJDb21wbGV0ZSB5b3VyIHByb2ZpbGUiLCJkZXNjcmlwdGlvbiI6IlNoYXJlIHlvdXIgc2tpbGxzLCBpbnRlcmVzdHMsIGFuZCB3aGF0IHlvdSdyZSBidWlsZGluZy4ifSx7ImVtb2ppIjoi8J+TliIsInRpdGxlIjoiSm9pbiBhIHJlYWRpbmcgcGxhbiIsImRlc2NyaXB0aW9uIjoiU3RheSBncm91bmRlZCBkYWlseSB3aXRoIG91ciBCaWJsZSByZWFkaW5nIHBsYW5zLiJ9LHsiZW1vamkiOiLwn6SdIiwidGl0bGUiOiJDb25uZWN0IHdpdGggbWVtYmVycyIsImRlc2NyaXB0aW9uIjoiQnJvd3NlIHRoZSBkaXJlY3RvcnkgdG8gZmluZCBjb2xsYWJvcmF0b3JzIGFuZCBhY2NvdW50YWJpbGl0eSBwYXJ0bmVycy4ifSx7ImVtb2ppIjoi8J+agCIsInRpdGxlIjoiU2hhcmUgeW91ciBqb3VybmV5IiwiZGVzY3JpcHRpb24iOiJQb3N0IGxhdW5jaGVzLCBwcmF5ZXIgcmVxdWVzdHMsIGFuZCB3aW5zIGluIHRoZSBjb21tdW5pdHkgZmVlZC4ifV19LHsidHlwZSI6InByaW1hcnktY3RhIiwibGFiZWwiOiJHbyB0byBZb3VyIERhc2hib2FyZCDihpIiLCJ1cmwiOiJ7e3NpdGVfdXJsfX0vZGFzaGJvYXJkIn1d -->

        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: auto; width: 100%; max-width: 600px;" class="email-container">
            <tr>
                <td style="height: 4px; background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%); font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>
        </table>

        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: auto; width: 100%; max-width: 600px;" class="email-container">
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
                        <span style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 700; color: #111827; vertical-align: middle; letter-spacing: -0.01em; padding-left: 10px;">Christians Innovate</span>
                        <!--[if mso]>
                        </td></tr></table>
                        <![endif]-->
                    </a>
                </td>
            </tr>
        </table>

        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: auto; width: 100%; max-width: 600px;" class="email-container mobile-padding">
            <tr>
                <td style="padding-top: 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td class="mobile-padding-inner" style="padding: 40px; border: 1px solid #f3f4f6; border-radius: 24px; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">

<!-- BLOCK:badge -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td>
            <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1.5px; line-height: 1;">
                Welcome
            </p>
        </td>
    </tr>
</table>
<!-- /BLOCK:badge -->

<!-- BLOCK:hero -->
<h2 class="mobile-font-lg" style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 800; color: #111827; line-height: 1.2; letter-spacing: -0.02em;">
    Welcome to Christians Innovate! 🎉
</h2>
<p style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 16px; color: #4b5563; line-height: 1.65;">
    Hi <strong>{{user.name}}</strong> 👋<br><br>We''re so glad you''re here. Christians Innovate connects Christian professionals, builders, and entrepreneurs committed to creating work that lasts — <em>for the next 5, 50, and 500 years.</em>
</p>
<!-- /BLOCK:hero -->

<!-- BLOCK:divider -->
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
<!-- /BLOCK:divider -->

<!-- BLOCK:feature-grid -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td style="padding-bottom: 32px;">
            <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Get Started</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr><td width="50%" valign="top" class="stack" style="padding-right: 8px; padding-bottom: 8px;">
                <div style="background-color: #f8fafc; border: 1px solid #f3f4f6; border-radius: 16px; padding: 20px;">
                    <p style="margin: 0 0 6px 0; font-size: 22px; line-height: 1;">👤</p>
                    <p style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color: #111827;">Complete your profile</p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 13px; color: #6b7280; line-height: 1.5;">Share your skills, interests, and what you''re building.</p>
                </div>
            </td><td width="50%" valign="top" class="stack" style="padding-left: 8px; padding-bottom: 8px;">
                <div style="background-color: #f8fafc; border: 1px solid #f3f4f6; border-radius: 16px; padding: 20px;">
                    <p style="margin: 0 0 6px 0; font-size: 22px; line-height: 1;">📖</p>
                    <p style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color: #111827;">Join a reading plan</p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 13px; color: #6b7280; line-height: 1.5;">Stay grounded daily with our Bible reading plans.</p>
                </div>
            </td></tr>
                <tr><td width="50%" valign="top" class="stack" style="padding-right: 8px;">
                <div style="background-color: #f8fafc; border: 1px solid #f3f4f6; border-radius: 16px; padding: 20px;">
                    <p style="margin: 0 0 6px 0; font-size: 22px; line-height: 1;">🤝</p>
                    <p style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color: #111827;">Connect with members</p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 13px; color: #6b7280; line-height: 1.5;">Browse the directory to find collaborators and accountability partners.</p>
                </div>
            </td><td width="50%" valign="top" class="stack" style="padding-left: 8px;">
                <div style="background-color: #f8fafc; border: 1px solid #f3f4f6; border-radius: 16px; padding: 20px;">
                    <p style="margin: 0 0 6px 0; font-size: 22px; line-height: 1;">🚀</p>
                    <p style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color: #111827;">Share your journey</p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 13px; color: #6b7280; line-height: 1.5;">Post launches, prayer requests, and wins in the community feed.</p>
                </div>
            </td></tr>
            </table>
        </td>
    </tr>
</table>
<!-- /BLOCK:feature-grid -->

<!-- BLOCK:primary-cta -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td style="padding-top: 8px; padding-bottom: 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td style="border-radius: 12px; background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb, #1d4ed8);">
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{site_url}}/dashboard" style="height:52px;v-text-anchor:middle;width:240px;" arcsize="23%" strokecolor="#2563eb" fillcolor="#2563eb">
                        <w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Go to Your Dashboard →</center>
                        </v:roundrect>
                        <![endif]-->
                        <!--[if !mso]><!-->
                        <a href="{{site_url}}/dashboard" class="btn-primary" style="background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb, #1d4ed8); font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; color: #ffffff; padding: 14px 32px; border-radius: 12px; display: inline-block; mso-padding-alt: 0; line-height: 1.4;">
                            Go to Your Dashboard →
                        </a>
                        <!--<![endif]-->
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
<!-- /BLOCK:primary-cta -->

                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td style="padding: 60px 40px 0 40px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td style="text-align: center; padding-bottom: 20px;">
                                <a href="{{site_url}}/dashboard" style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 500; color: #6b7280; text-decoration: none; margin: 0 12px;">Dashboard</a>
                                <a href="{{site_url}}/settings" style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 500; color: #6b7280; text-decoration: none; margin: 0 12px;">Settings</a>
                            </td>
                        </tr>
                    </table>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td style="text-align: center;">
                                <p style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                                    Faith &times; Technology &times; Entrepreneurship<br>
                                    &copy; 2026 Christians Innovate. All rights reserved.
                                </p>
                                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 12px; color: #9ca3af;">
                                    <a href="{{unsubscribe_link}}" style="color: #3b82f6; text-decoration: none;">Unsubscribe</a> from these communications.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

    </center>
</body>
</html>',
  'Hi {{user.name}},

Welcome to Christians Innovate! We''re so glad you''re here.

Christians Innovate connects Christian professionals, builders, and entrepreneurs committed to creating work that lasts — for the next 5, 50, and 500 years.

Get started:
- Complete your profile and share your skills
- Join a Bible reading plan
- Connect with other members in the directory
- Share your launches, prayers, and wins

Go to your dashboard: {{site_url}}/dashboard

Christians Innovate — Faith × Technology × Entrepreneurship
Unsubscribe: {{unsubscribe_link}}',
  '["user.name","site_url","unsubscribe_link"]'::jsonb,
  'Welcome email sent to new users upon signup',
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  name        = EXCLUDED.name,
  subject     = EXCLUDED.subject,
  body_html   = EXCLUDED.body_html,
  body_text   = EXCLUDED.body_text,
  variables   = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at  = now();


-- ============================================================
-- 3. MEETING REMINDER
-- ============================================================
INSERT INTO public.email_templates (
  template_key, name, subject, body_html, body_text, variables, description, is_active
) VALUES (
  'meeting-reminder',
  'Meeting Reminder',
  '📅 Reminder: {{meeting.title}} is Tomorrow',
  '<!DOCTYPE html>
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
            font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif;
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
</head>
<body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; color: #171717;">
    <center style="width: 100%; background-color: #ffffff; padding: 20px 0 60px 0;">

        <div style="display: none; font-size: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
        Building for the next 5, 50, and 500 years.
        &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
    </div>
        <!-- BLOCKS_META:W3sidHlwZSI6ImJhZGdlIiwidGV4dCI6Ik1lZXRpbmcgUmVtaW5kZXIiLCJjb2xvciI6ImdyZWVuIn0seyJ0eXBlIjoiaGVybyIsImhlYWRpbmciOiLwn5OFIE1lZXRpbmcgVG9tb3Jyb3ciLCJib2R5IjoiSGkgPHN0cm9uZz57e3VzZXIubmFtZX19PC9zdHJvbmc+LCB0aGlzIGlzIGEgZnJpZW5kbHkgcmVtaW5kZXIgYWJvdXQgeW91ciB1cGNvbWluZyBjb21tdW5pdHkgbWVldGluZy4ifSx7InR5cGUiOiJkZXRhaWwtY2FyZCIsInJvd3MiOlt7ImVtb2ppIjoi8J+TiyIsImxhYmVsIjoiTWVldGluZyIsInZhbHVlIjoie3ttZWV0aW5nLnRpdGxlfX0ifSx7ImVtb2ppIjoi8J+ThSIsImxhYmVsIjoiV2hlbiIsInZhbHVlIjoie3ttZWV0aW5nLmRhdGV9fSBhdCB7e21lZXRpbmcudGltZX19In0seyJlbW9qaSI6IvCfkqwiLCJsYWJlbCI6IkFib3V0IiwidmFsdWUiOiJ7e21lZXRpbmcuZGVzY3JpcHRpb259fSJ9XX0seyJ0eXBlIjoicHJpbWFyeS1jdGEiLCJsYWJlbCI6IkpvaW4gWm9vbSBNZWV0aW5nIOKGkiIsInVybCI6Int7bWVldGluZy56b29tX2xpbmt9fSJ9LHsidHlwZSI6Imhlcm8iLCJoZWFkaW5nIjoiIiwiYm9keSI6IldlIGxvb2sgZm9yd2FyZCB0byBzZWVpbmcgeW91ISBBcnJpdmUgYSBjb3VwbGUgb2YgbWludXRlcyBlYXJseSB0byBnZXQgc2V0dGxlZC4ifV0= -->

        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: auto; width: 100%; max-width: 600px;" class="email-container">
            <tr>
                <td style="height: 4px; background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%); font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>
        </table>

        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: auto; width: 100%; max-width: 600px;" class="email-container">
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
                        <span style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 700; color: #111827; vertical-align: middle; letter-spacing: -0.01em; padding-left: 10px;">Christians Innovate</span>
                        <!--[if mso]>
                        </td></tr></table>
                        <![endif]-->
                    </a>
                </td>
            </tr>
        </table>

        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: auto; width: 100%; max-width: 600px;" class="email-container mobile-padding">
            <tr>
                <td style="padding-top: 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td class="mobile-padding-inner" style="padding: 40px; border: 1px solid #f3f4f6; border-radius: 24px; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">

<!-- BLOCK:badge -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td>
            <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 1.5px; line-height: 1;">
                Meeting Reminder
            </p>
        </td>
    </tr>
</table>
<!-- /BLOCK:badge -->

<!-- BLOCK:hero -->
<h2 class="mobile-font-lg" style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 800; color: #111827; line-height: 1.2; letter-spacing: -0.02em;">
    📅 Meeting Tomorrow
</h2>
<p style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 16px; color: #4b5563; line-height: 1.65;">
    Hi <strong>{{user.name}}</strong>, this is a friendly reminder about your upcoming community meeting.
</p>
<!-- /BLOCK:hero -->

<!-- BLOCK:detail-card -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td style="padding-bottom: 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 16px; padding: 28px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style=" margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
                <tr>
                    <td valign="top" width="36" style="padding-right: 12px;">
                        <div style="width: 36px; height: 36px; background-color: #eff6ff; border-radius: 10px; text-align: center; line-height: 36px; font-size: 18px;">📋</div>
                    </td>
                    <td valign="center">
                        <p style="margin: 0 0 2px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Meeting</p>
                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color: #111827;">{{meeting.title}}</p>
                    </td>
                </tr>
            </table>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style=" margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
                <tr>
                    <td valign="top" width="36" style="padding-right: 12px;">
                        <div style="width: 36px; height: 36px; background-color: #eff6ff; border-radius: 10px; text-align: center; line-height: 36px; font-size: 18px;">📅</div>
                    </td>
                    <td valign="center">
                        <p style="margin: 0 0 2px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">When</p>
                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color: #111827;">{{meeting.date}} at {{meeting.time}}</p>
                    </td>
                </tr>
            </table>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="">
                <tr>
                    <td valign="top" width="36" style="padding-right: 12px;">
                        <div style="width: 36px; height: 36px; background-color: #eff6ff; border-radius: 10px; text-align: center; line-height: 36px; font-size: 18px;">💬</div>
                    </td>
                    <td valign="center">
                        <p style="margin: 0 0 2px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">About</p>
                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color: #111827;">{{meeting.description}}</p>
                    </td>
                </tr>
            </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
<!-- /BLOCK:detail-card -->

<!-- BLOCK:primary-cta -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td style="padding-top: 8px; padding-bottom: 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td style="border-radius: 12px; background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb, #1d4ed8);">
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{meeting.zoom_link}}" style="height:52px;v-text-anchor:middle;width:240px;" arcsize="23%" strokecolor="#2563eb" fillcolor="#2563eb">
                        <w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Join Zoom Meeting →</center>
                        </v:roundrect>
                        <![endif]-->
                        <!--[if !mso]><!-->
                        <a href="{{meeting.zoom_link}}" class="btn-primary" style="background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb, #1d4ed8); font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; color: #ffffff; padding: 14px 32px; border-radius: 12px; display: inline-block; mso-padding-alt: 0; line-height: 1.4;">
                            Join Zoom Meeting →
                        </a>
                        <!--<![endif]-->
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
<!-- /BLOCK:primary-cta -->

<!-- BLOCK:hero -->
<h2 class="mobile-font-lg" style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 800; color: #111827; line-height: 1.2; letter-spacing: -0.02em;">
    
</h2>
<p style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 16px; color: #4b5563; line-height: 1.65;">
    We look forward to seeing you! Arrive a couple of minutes early to get settled.
</p>
<!-- /BLOCK:hero -->

                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td style="padding: 60px 40px 0 40px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td style="text-align: center; padding-bottom: 20px;">
                                <a href="{{site_url}}/dashboard" style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 500; color: #6b7280; text-decoration: none; margin: 0 12px;">Dashboard</a>
                                <a href="{{site_url}}/settings" style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 500; color: #6b7280; text-decoration: none; margin: 0 12px;">Settings</a>
                            </td>
                        </tr>
                    </table>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td style="text-align: center;">
                                <p style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                                    Faith &times; Technology &times; Entrepreneurship<br>
                                    &copy; 2026 Christians Innovate. All rights reserved.
                                </p>
                                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 12px; color: #9ca3af;">
                                    <a href="{{unsubscribe_link}}" style="color: #3b82f6; text-decoration: none;">Unsubscribe</a> from these communications.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

    </center>
</body>
</html>',
  'Hi {{user.name}},

You have a community meeting tomorrow!

{{meeting.title}}
When: {{meeting.date}} at {{meeting.time}}
About: {{meeting.description}}

Join Zoom: {{meeting.zoom_link}}

See you there!
Christians Innovate
Unsubscribe: {{unsubscribe_link}}',
  '["user.name","meeting.title","meeting.date","meeting.time","meeting.description","meeting.zoom_link","unsubscribe_link"]'::jsonb,
  'Meeting reminder sent the day before a scheduled community meeting',
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  name        = EXCLUDED.name,
  subject     = EXCLUDED.subject,
  body_html   = EXCLUDED.body_html,
  body_text   = EXCLUDED.body_text,
  variables   = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at  = now();


-- ============================================================
-- 4. WEEKLY COMMUNITY DIGEST
-- ============================================================
INSERT INTO public.email_templates (
  template_key, name, subject, body_html, body_text, variables, description, is_active
) VALUES (
  'weekly-digest',
  'Weekly Community Digest',
  '🌟 This week in Christians Innovate',
  '<!DOCTYPE html>
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
            font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif;
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
</head>
<body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; color: #171717;">
    <center style="width: 100%; background-color: #ffffff; padding: 20px 0 60px 0;">

        <div style="display: none; font-size: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
        Building for the next 5, 50, and 500 years.
        &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
    </div>
        <!-- BLOCKS_META:W3sidHlwZSI6ImJhZGdlIiwidGV4dCI6IldlZWtseSBEaWdlc3QiLCJjb2xvciI6InB1cnBsZSJ9LHsidHlwZSI6Imhlcm8iLCJoZWFkaW5nIjoi8J+MnyBUaGlzIFdlZWsgaW4gdGhlIENvbW11bml0eSIsImJvZHkiOiJIaSA8c3Ryb25nPnt7dXNlci5uYW1lfX08L3N0cm9uZz4sIGhlcmUncyBhIHF1aWNrIGxvb2sgYXQgd2hhdCB0aGUgQ2hyaXN0aWFucyBJbm5vdmF0ZSBjb21tdW5pdHkgc2hhcmVkIHRoaXMgd2Vlay4ifSx7InR5cGUiOiJzdGF0cy1yb3ciLCJzdGF0cyI6W3siZW1vamkiOiLwn5qAIiwidmFsdWUiOiJ7e2RpZ2VzdC5sYXVuY2hlc319IiwibGFiZWwiOiJMYXVuY2hlcyJ9LHsiZW1vamkiOiLwn5mPIiwidmFsdWUiOiJ7e2RpZ2VzdC5wcmF5ZXJzfX0iLCJsYWJlbCI6IlByYXllcnMifSx7ImVtb2ppIjoi8J+OiSIsInZhbHVlIjoie3tkaWdlc3Qud2luc319IiwibGFiZWwiOiJXaW5zIn1dfSx7InR5cGUiOiJkaXZpZGVyIn0seyJ0eXBlIjoiaGVybyIsImhlYWRpbmciOiIiLCJib2R5IjoiRXZlcnkgcG9zdCwgcHJheWVyLCBhbmQgbGF1bmNoIG1hdHRlcnMuIFlvdXIgcHJlc2VuY2UgaW4gdGhpcyBjb21tdW5pdHkgaXMgcGFydCBvZiBzb21ldGhpbmcgYmlnZ2VyIOKAlCBhIGJvZHkgb2YgYnVpbGRlcnMgd29ya2luZyBmb3IgR29kJ3Mga2luZ2RvbS4ifSx7InR5cGUiOiJwcmltYXJ5LWN0YSIsImxhYmVsIjoiVmlldyBDb21tdW5pdHkgRmVlZCDihpIiLCJ1cmwiOiJ7e3NpdGVfdXJsfX0vbGF1bmNoLXByYXllciJ9XQ== -->

        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: auto; width: 100%; max-width: 600px;" class="email-container">
            <tr>
                <td style="height: 4px; background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%); font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>
        </table>

        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: auto; width: 100%; max-width: 600px;" class="email-container">
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
                        <span style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 700; color: #111827; vertical-align: middle; letter-spacing: -0.01em; padding-left: 10px;">Christians Innovate</span>
                        <!--[if mso]>
                        </td></tr></table>
                        <![endif]-->
                    </a>
                </td>
            </tr>
        </table>

        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: auto; width: 100%; max-width: 600px;" class="email-container mobile-padding">
            <tr>
                <td style="padding-top: 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td class="mobile-padding-inner" style="padding: 40px; border: 1px solid #f3f4f6; border-radius: 24px; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">

<!-- BLOCK:badge -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td>
            <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color: #8b5cf6; text-transform: uppercase; letter-spacing: 1.5px; line-height: 1;">
                Weekly Digest
            </p>
        </td>
    </tr>
</table>
<!-- /BLOCK:badge -->

<!-- BLOCK:hero -->
<h2 class="mobile-font-lg" style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 800; color: #111827; line-height: 1.2; letter-spacing: -0.02em;">
    🌟 This Week in the Community
</h2>
<p style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 16px; color: #4b5563; line-height: 1.65;">
    Hi <strong>{{user.name}}</strong>, here''s a quick look at what the Christians Innovate community shared this week.
</p>
<!-- /BLOCK:hero -->

<!-- BLOCK:stats-row -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td style="padding-bottom: 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td width="33%" class="stack" style="padding-right: 8px;">
                <div style="text-align: center; padding: 20px 12px; background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 14px;">
                    <p style="margin: 0 0 4px 0; font-size: 24px; line-height: 1;">🚀</p>
                    <p style="margin: 0 0 2px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 800; color: #111827; line-height: 1.2;">{{digest.launches}}</p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Launches</p>
                </div>
            </td>
<td width="33%" class="stack" style="padding-left: 4px; padding-right: 4px;">
                <div style="text-align: center; padding: 20px 12px; background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 14px;">
                    <p style="margin: 0 0 4px 0; font-size: 24px; line-height: 1;">🙏</p>
                    <p style="margin: 0 0 2px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 800; color: #111827; line-height: 1.2;">{{digest.prayers}}</p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Prayers</p>
                </div>
            </td>
<td width="33%" class="stack" style="padding-left: 8px;">
                <div style="text-align: center; padding: 20px 12px; background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 14px;">
                    <p style="margin: 0 0 4px 0; font-size: 24px; line-height: 1;">🎉</p>
                    <p style="margin: 0 0 2px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 800; color: #111827; line-height: 1.2;">{{digest.wins}}</p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Wins</p>
                </div>
            </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
<!-- /BLOCK:stats-row -->

<!-- BLOCK:divider -->
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
<!-- /BLOCK:divider -->

<!-- BLOCK:hero -->
<h2 class="mobile-font-lg" style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 800; color: #111827; line-height: 1.2; letter-spacing: -0.02em;">
    
</h2>
<p style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 16px; color: #4b5563; line-height: 1.65;">
    Every post, prayer, and launch matters. Your presence in this community is part of something bigger — a body of builders working for God''s kingdom.
</p>
<!-- /BLOCK:hero -->

<!-- BLOCK:primary-cta -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td style="padding-top: 8px; padding-bottom: 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td style="border-radius: 12px; background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb, #1d4ed8);">
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{site_url}}/launch-prayer" style="height:52px;v-text-anchor:middle;width:240px;" arcsize="23%" strokecolor="#2563eb" fillcolor="#2563eb">
                        <w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">View Community Feed →</center>
                        </v:roundrect>
                        <![endif]-->
                        <!--[if !mso]><!-->
                        <a href="{{site_url}}/launch-prayer" class="btn-primary" style="background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb, #1d4ed8); font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; color: #ffffff; padding: 14px 32px; border-radius: 12px; display: inline-block; mso-padding-alt: 0; line-height: 1.4;">
                            View Community Feed →
                        </a>
                        <!--<![endif]-->
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
<!-- /BLOCK:primary-cta -->

                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td style="padding: 60px 40px 0 40px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td style="text-align: center; padding-bottom: 20px;">
                                <a href="{{site_url}}/dashboard" style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 500; color: #6b7280; text-decoration: none; margin: 0 12px;">Dashboard</a>
                                <a href="{{site_url}}/settings" style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 500; color: #6b7280; text-decoration: none; margin: 0 12px;">Settings</a>
                            </td>
                        </tr>
                    </table>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td style="text-align: center;">
                                <p style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                                    Faith &times; Technology &times; Entrepreneurship<br>
                                    &copy; 2026 Christians Innovate. All rights reserved.
                                </p>
                                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, Helvetica, sans-serif; font-size: 12px; color: #9ca3af;">
                                    <a href="{{unsubscribe_link}}" style="color: #3b82f6; text-decoration: none;">Unsubscribe</a> from these communications.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

    </center>
</body>
</html>',
  'Hi {{user.name}},

Here''s what happened in the Christians Innovate community this week:

🚀 Launches: {{digest.launches}}
🙏 Prayers:  {{digest.prayers}}
🎉 Wins:     {{digest.wins}}

Every post, prayer, and launch matters. Your presence in this community is part of something bigger.

View the community feed: {{site_url}}/launch-prayer

Christians Innovate — Faith × Technology × Entrepreneurship
Unsubscribe: {{unsubscribe_link}}',
  '["user.name","digest.launches","digest.prayers","digest.wins","site_url","unsubscribe_link"]'::jsonb,
  'Weekly summary of community activity sent to CI Updates subscribers',
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  name        = EXCLUDED.name,
  subject     = EXCLUDED.subject,
  body_html   = EXCLUDED.body_html,
  body_text   = EXCLUDED.body_text,
  variables   = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at  = now();

