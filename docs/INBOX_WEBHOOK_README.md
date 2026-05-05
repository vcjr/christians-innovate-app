# Admin Inbox - Incoming Email Webhook Implementation

## Overview

The incoming email webhook has been successfully implemented, allowing emails sent to your sender addresses to be received and displayed in the Admin Inbox.

## What Was Implemented

### 1. Webhook Endpoint (`/app/api/webhooks/resend-inbound/route.ts`)

- **POST endpoint** to receive `email.received` events from Resend
- **GET endpoint** for health checks
- Parses incoming email data (from, to, subject, body, attachments)
- Stores emails in the `inbox_messages` database table
- Uses service role client to bypass RLS for webhook authentication

### 2. Service Role Client (`/utils/supabase/server.ts`)

Added `createServiceClient()` function:
- Uses `SUPABASE_SERVICE_ROLE_KEY` for authentication
- Bypasses Row Level Security (RLS)
- **Only for trusted server-side operations** like webhooks

### 3. Updated Inbox UI (`/app/admin/inbox/inbox-client.tsx`)

- Shows webhook endpoint URL for easy configuration
- Provides setup instructions when inbox is empty
- Links to detailed documentation

### 4. Documentation

Created comprehensive setup guides:
- **`docs/RESEND_WEBHOOK_SETUP.md`** - Complete webhook configuration guide
- **`docs/WEBHOOK_TESTING.md`** - Testing and debugging instructions

## Configuration Required

### Step 1: Add Environment Variable

Add to your `.env.local` (local) and deployment environment:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Where to find it:**
- Go to your [Supabase Dashboard](https://app.supabase.com)
- Select your project
- Go to Settings → API
- Copy the `service_role` secret key (not the anon key!)

### Step 2: Configure Resend Webhook

1. Go to [Resend Dashboard → Webhooks](https://resend.com/webhooks)
2. Click **Add Webhook**
3. Configure:
   - **URL**: `https://your-domain.com/api/webhooks/resend-inbound`
   - **Events**: Select `email.received`
   - **Name**: "Admin Inbox Inbound"
4. Click **Create**

### Step 3: Configure Email Forwarding

In Resend Dashboard:
1. Go to **Domains** → Select your domain
2. Go to **Email Forwarding** or **Inbound Rules**
3. Create forwarding rules for each sender address:
   - `support@christiansinnovate.com` → Forward to webhook
   - `tech@christiansinnovate.com` → Forward to webhook
   - `admin@christiansinnovate.com` → Forward to webhook
   - `community@christiansinnovate.com` → Forward to webhook

## How It Works

```
External Email Sender
      ↓
Resend Email Service
      ↓
Webhook: /api/webhooks/resend-inbound
      ↓
Parse & Validate Email Data
      ↓
Store in inbox_messages table
      ↓
Display in Admin Inbox UI
```

## Testing

### Quick Test (Local)

```bash
# Test health endpoint
curl http://localhost:3000/api/webhooks/resend-inbound

# Test with sample payload
curl -X POST http://localhost:3000/api/webhooks/resend-inbound \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.received",
    "data": {
      "from": "test@example.com",
      "to": "support@christiansinnovate.com",
      "subject": "Test Email",
      "html": "<p>Test</p>",
      "text": "Test"
    }
  }'
```

### Test with Resend

1. In Resend Dashboard, click **Test Webhook**
2. Select `email.received` event
3. Click **Send Test**
4. Check `/admin/inbox` for the test message

## Features

✅ Receive emails sent to any sender address  
✅ Parse HTML and plain text bodies  
✅ Extract sender name and email  
✅ Handle reply-to headers  
✅ Store email headers and metadata  
✅ Support for attachments storage (data structure ready)  
✅ Mark emails as read/unread  
✅ Reply to received emails  
✅ View full email HTML rendering  

## Security Features

✅ Uses service role key (keep secret!)  
✅ Validates event type (email.received only)  
✅ Webhook signature verification structure (ready for implementation)  
⚠️ **TODO**: Implement HMAC signature verification for production

## Database Schema

The `inbox_messages` table stores:
- `from_email`, `from_name` - Sender information
- `to_email` - Recipient address
- `subject`, `body_html`, `body_text` - Email content
- `headers` (JSONB) - All email headers
- `attachments` (JSONB) - Attachment metadata
- `is_read` - Read status
- `assigned_to`, `replied_by` - Admin assignment tracking
- `received_at` - Timestamp

## Next Steps (Optional Enhancements)

1. **Implement webhook signature verification** using `RESEND_WEBHOOK_SECRET`
2. **Add rate limiting** to prevent webhook abuse
3. **Add email filtering** by sender/recipient
4. **Add attachment handling** (upload to Supabase Storage)
5. **Add email threading** (group related emails)
6. **Add auto-responders** for certain email addresses
7. **Add email forwarding** to team members
8. **Add notification system** for new inbox messages

## Troubleshooting

### Webhook not receiving emails

1. ✓ Check `SUPABASE_SERVICE_ROLE_KEY` is set
2. ✓ Verify webhook URL is publicly accessible
3. ✓ Check Resend webhook logs for delivery failures
4. ✓ Test health endpoint returns 200 OK
5. ✓ Check email forwarding rules are configured

### Emails not appearing in inbox

1. ✓ Check application logs for errors
2. ✓ Verify service role key has proper permissions
3. ✓ Check RLS policies on `inbox_messages` table
4. ✓ Test with curl to isolate Resend vs app issues

## Support

For issues or questions:
- Check `docs/RESEND_WEBHOOK_SETUP.md` for detailed setup
- Check `docs/WEBHOOK_TESTING.md` for testing guide
- Review Resend webhook documentation
- Check application logs for error details

---

**Status**: ✅ Ready for configuration  
**Last Updated**: February 20, 2026
