# Resend Inbound Email Webhook Test

This is a simple test to verify your Resend inbound email webhook is working.

## Test using curl

```bash
# Test the health check endpoint
curl https://your-domain.com/api/webhooks/resend-inbound

# Expected response:
# {
#   "status": "ok",
#   "message": "Resend inbound email webhook endpoint",
#   "timestamp": "2026-02-20T12:00:00.000Z"
# }
```

## Test with a sample payload

```bash
curl -X POST https://your-domain.com/api/webhooks/resend-inbound \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.received",
    "data": {
      "from": "Test User <test@example.com>",
      "to": "support@christiansinnovate.com",
      "subject": "Test Email",
      "html": "<p>This is a test email</p>",
      "text": "This is a test email",
      "headers": {
        "reply-to": "test@example.com"
      },
      "attachments": []
    }
  }'

# Expected response:
# {
#   "success": true,
#   "message_id": "uuid-here",
#   "from": "test@example.com",
#   "to": "support@christiansinnovate.com"
# }
```

After running this test, check your Admin Inbox at `/admin/inbox` to see the test message.

## Test with Resend Dashboard

1. Go to [Resend Dashboard](https://resend.com/webhooks)
2. Select your webhook
3. Click **Test** or **Send Test Event**
4. Select `email.received` event
5. Click **Send Test**

## Debugging

If the webhook isn't working:

1. **Check the webhook URL**: Make sure it's publicly accessible (not localhost)
2. **Check environment variables**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
3. **Check Resend logs**: Look for webhook delivery failures in Resend Dashboard
4. **Check application logs**: Look for errors in your deployment logs
5. **Test health endpoint**: Verify `GET /api/webhooks/resend-inbound` returns 200

## Local Testing with ngrok

For local development:

```bash
# Start your app
npm run dev

# In another terminal, expose your local server
npx ngrok http 3000

# Use the ngrok URL in Resend webhook configuration
# Example: https://abc123.ngrok.io/api/webhooks/resend-inbound
```

## Security Note

The webhook endpoint uses the service role key to bypass RLS. In production, you should:

1. Add webhook signature verification
2. Validate the sender addresses
3. Implement rate limiting
4. Log all webhook events for security audit
