-- ============================================
-- STORAGE BUCKET FOR RESOURCES
-- ============================================

-- Create the resources bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resources',
  'resources',
  true,
  52428800, -- 50MB limit for resource files
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Allow authenticated users to upload their own resources
DROP POLICY IF EXISTS "Users can upload their own resources" ON storage.objects;
CREATE POLICY "Users can upload their own resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resources' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own resources
DROP POLICY IF EXISTS "Users can update their own resources" ON storage.objects;
CREATE POLICY "Users can update their own resources"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resources' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'resources' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own resources
DROP POLICY IF EXISTS "Users can delete their own resources" ON storage.objects;
CREATE POLICY "Users can delete their own resources"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resources' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view resources (since bucket is public)
DROP POLICY IF EXISTS "Anyone can view resources" ON storage.objects;
CREATE POLICY "Anyone can view resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources');
