-- Create avatars storage bucket and policies
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Allow public read access to avatars
create policy "Avatar images are publicly accessible"
on storage.objects
for select
using (bucket_id = 'avatars');

-- Allow users to upload their own avatar (path must start with their user id)
create policy "Users can upload their own avatar"
on storage.objects
for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar files
create policy "Users can update their own avatar"
on storage.objects
for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);
