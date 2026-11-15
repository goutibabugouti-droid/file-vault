-- File Vault Supabase Schema
-- Run this in Supabase SQL Editor after creating your project

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create files table
create table if not exists public.files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  size bigint not null,
  mime_type text not null,
  path text not null,
  public_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.files enable row level security;

-- Policy: Users can only see their own files
create policy "Users can view own files"
  on public.files for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own files
create policy "Users can insert own files"
  on public.files for insert
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own files
create policy "Users can delete own files"
  on public.files for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists files_user_id_created_at_idx
  on public.files (user_id, created_at desc);

-- Create storage bucket for files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'files',
  'files',
  true,
  52428800, -- 50MB
  array['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

-- Storage policies
-- Policy: Users can upload to their own folder
create policy "Users can upload own files"
  on storage.objects for insert
  with check (
    bucket_id = 'files' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can view their own files
create policy "Users can view own files"
  on storage.objects for select
  using (
    bucket_id = 'files' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own files
create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'files' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public access to files (for direct download links)
create policy "Public access to files"
  on storage.objects for select
  using (bucket_id = 'files');