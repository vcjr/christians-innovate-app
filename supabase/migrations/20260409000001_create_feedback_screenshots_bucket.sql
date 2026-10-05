-- Storage bucket for feedback screenshots (private — use signed URLs to view)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-screenshots',
  'feedback-screenshots',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload screenshots to their own folder
DROP POLICY IF EXISTS "Users can upload feedback screenshots" ON storage.objects;
CREATE POLICY "Users can upload feedback screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'feedback-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own screenshots
DROP POLICY IF EXISTS "Users can view own feedback screenshots" ON storage.objects;
CREATE POLICY "Users can view own feedback screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'feedback-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
