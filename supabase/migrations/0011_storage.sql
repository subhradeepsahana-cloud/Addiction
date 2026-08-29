-- Private storage bucket for My Why photos. Files are stored under
-- `${auth.uid()}/...` and RLS on storage.objects restricts access to the
-- owning user only. Never made public.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('motivation-photos', 'motivation-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "motivation_photos_select_own"
  on storage.objects for select
  using (bucket_id = 'motivation-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "motivation_photos_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'motivation-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "motivation_photos_update_own"
  on storage.objects for update
  using (bucket_id = 'motivation-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "motivation_photos_delete_own"
  on storage.objects for delete
  using (bucket_id = 'motivation-photos' and auth.uid()::text = (storage.foldername(name))[1]);
