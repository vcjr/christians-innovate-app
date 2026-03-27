-- Enable Realtime publication for the notifications table so the
-- client-side NotificationBell can receive live inserts via Supabase channels.
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
