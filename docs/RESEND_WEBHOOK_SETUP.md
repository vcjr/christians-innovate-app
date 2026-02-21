# Resend Inbound Email Webhook Setup

This guide explains how to configure Resend to forward incoming emails to your admin inbox.

## Prerequisites

1. A Resend account with a verified domain
2. Your application deployed with a public URL
3. The `SUPABASE_SERVICE_ROLE_KEY` environment variable set

## Setup Steps

### 1. Configure Email Forwarding in Resend

1. Log in to your [Resend Dashboard](https://resend.com/domains)
2. Go to **Domains** and select your domain (e.g., `christiansinnovate.com`)
3. Click on **Email Forwarding** or **Inbound Rules**
4. Create forwarding rules for each sender address:

   - `support@christiansinnovate.com`
   - `tech@christiansinnovate.com`
   - `admin@christiansinnovate.com`
   - `community@christiansinnovate.com`
   - `noreply@christiansinnovate.com` (optional)

### 2. Set Up the Webhook

1. In Resend Dashboard, go to **Webhooks**
2. Click **Add Webhook**
3. Configure the webhook:
   - **URL**: `https://your-domain.com/api/webhooks/resend-inbound`
   - **Events**: Select `email.received`
   - **Name**: "Admin Inbox Inbound Emails"
   - **Description**: "Forward incoming emails to admin inbox"

4. Click **Create Webhook**
5. Copy the **Signing Secret** (for future webhook verification)

### 3. Test the Webhook

1. In Resend Dashboard, click **Test Webhook** on your newly created webhook
2. Or send a test email to one of your configured addresses
3. Check your Admin Inbox at `/admin/inbox` to verify the email was received

### 4. Environment Variables

Make sure these environment variables are set:

```env
# Required for webhook authentication with Supabase
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: For webhook signature verification (future enhancement)
RESEND_WEBHOOK_SECRET=your_webhook_signing_secret
```

## Webhook Payload Example

Resend sends webhook events in this format:

```json
{
  "type": "email.received",
  "data": {
    "from": "John Doe <john@example.com>",
    "to": "support@christiansinnovate.com",
    "subject": "Need help with my account",
    "html": "<p>Email body HTML</p>",
    "text": "Email body plain text",
    "headers": {
      "reply-to": "john@example.com",
      "message-id": "<abc123@example.com>"
    },
    "attachments": []
  }
}
```

## Troubleshooting

### Emails not appearing in inbox

1. Check webhook logs in Resend Dashboard
2. Verify the webhook URL is publicly accessible
3. Check your application logs for errors
4. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly
5. Verify RLS policies on `inbox_messages` table

### Testing locally

For local testing, you can use a tool like [ngrok](https://ngrok.com/) to expose your local server:

```bash
# Start your app locally
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Use the ngrok URL in your Resend webhook configuration
# Example: https://abc123.ngrok.io/api/webhooks/resend-inbound
```

## Security Considerations

1. **Service Role Key**: Keep your `SUPABASE_SERVICE_ROLE_KEY` secret and never expose it to the client
2. **Webhook Verification**: Future enhancement should verify webhook signatures using the signing secret
3. **Rate Limiting**: Consider adding rate limiting to the webhook endpoint
4. **Email Validation**: The webhook validates that emails are sent to configured sender addresses

## API Endpoint

**Endpoint**: `/api/webhooks/resend-inbound`

**Method**: `POST`

**Response**:
```json
{
  "success": true,
  "message_id": "uuid",
  "from": "john@example.com",
  "to": "support@christiansinnovate.com"
}
```

**Health Check**: `GET /api/webhooks/resend-inbound` returns:
```json
{
  "status": "ok",
  "message": "Resend inbound email webhook endpoint",
  "timestamp": "2026-02-20T12:00:00.000Z"
}
```
