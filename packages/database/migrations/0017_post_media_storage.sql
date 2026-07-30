-- Skilltego — Supabase Storage bucket for post media (images/videos/PDFs),
-- replacing the client-side Cloudinary upload path for the post composer.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  true,
  26214400,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf'
  ]
)
on conflict (id) do nothing;

-- Files are stored under `${auth.uid()}/<uuid>.<ext>`, so ownership checks are
-- a simple folder-prefix match. storage.objects already has RLS enabled by
-- default on every Supabase project.
create policy "post_media_public_read" on storage.objects
  for select using (bucket_id = 'post-media');

create policy "post_media_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "post_media_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "post_media_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);
