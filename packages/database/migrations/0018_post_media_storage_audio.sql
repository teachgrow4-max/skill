-- Skilltego — allow voice-note audio files in the existing post-media
-- Supabase Storage bucket (used for post media, avatars/covers, resumes, and
-- now DM voice notes). Same bucket and RLS policies as migration 0017 —
-- only the allowed MIME type list changes.

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg',
  'application/pdf'
]
where id = 'post-media';
